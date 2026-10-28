import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Task, Project, Sprint, GitHubRepoSummary, ProjectNote } from '~/types'
import { useQuickTask } from '~/composables/useQuickTask'
import { useTaskDrawer } from '~/composables/useTaskDrawer'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useGitHubRepos } from '~/composables/useGitHub'

export type OmniSearchScope = 'all' | 'task' | 'project' | 'sprint' | 'repo' | 'action' | 'note'
export type OmniItemType = 'task' | 'project' | 'sprint' | 'repo' | 'action' | 'navigation' | 'note'

export interface OmniSearchItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  type: OmniItemType
  categoryLabel: string
  icon: string
  iconColor?: string
  badge?: string
  badgeColor?: string
  tags?: string[]
  projectSlug?: string
  priority?: string
  status?: string
  score?: number
  titleHighlights?: [number, number][]
  subtitleHighlights?: [number, number][]
  payload?: any
  action: () => void | Promise<void>
  secondaryAction?: () => void | Promise<void>
  secondaryActionLabel?: string
  shortcutHint?: string
}

export interface HighlightSegment {
  text: string
  isHighlight: boolean
}

/**
 * Splits text into highlighted and plain segments based on [start, end] ranges.
 */
export function splitHighlights(text: string, ranges?: [number, number][]): HighlightSegment[] {
  if (!text) return []
  if (!ranges || ranges.length === 0) {
    return [{ text, isHighlight: false }]
  }

  // Normalize, sort, and merge overlapping ranges
  const sorted = [...ranges]
    .filter(([s, e]) => s >= 0 && e > s && s < text.length)
    .sort((a, b) => a[0] - b[0])

  const merged: [number, number][] = []
  for (const range of sorted) {
    if (merged.length === 0) {
      merged.push([range[0], Math.min(range[1], text.length)])
    } else {
      const prev = merged[merged.length - 1]
      if (range[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], Math.min(range[1], text.length))
      } else {
        merged.push([range[0], Math.min(range[1], text.length)])
      }
    }
  }

  const segments: HighlightSegment[] = []
  let cursor = 0

  for (const [start, end] of merged) {
    if (start > cursor) {
      segments.push({
        text: text.slice(cursor, start),
        isHighlight: false
      })
    }
    segments.push({
      text: text.slice(start, end),
      isHighlight: true
    })
    cursor = end
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      isHighlight: false
    })
  }

  return segments
}

/**
 * Safely opens an external URL in a new window.
 * Strictly permits only 'http:' and 'https:' protocols (rejects 'javascript:', 'data:', etc.).
 * Always enforces 'noopener,noreferrer' window features (NEW-SEC-01).
 */
export function safeOpenExternal(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false
  const trimmed = rawUrl.trim()
  if (!trimmed) return false

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[safeOpenExternal] Blocked unsafe protocol: ${parsed.protocol}`)
      }
      return false
    }

    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(parsed.href, '_blank', 'noopener,noreferrer')
      return true
    }
    return false
  } catch {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[safeOpenExternal] Invalid URL: ${rawUrl}`)
    }
    return false
  }
}

const SEARCH_HISTORY_STORAGE_KEY = 'nexura:omni_search_history'
const MAX_SEARCH_HISTORY = 3

function getSafeLocalStorage(): Storage | null {
  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem === 'function' &&
      typeof window.localStorage.setItem === 'function'
    ) {
      return window.localStorage
    }
  } catch {
    // Ignore storage access errors
  }
  return null
}

function isRecordableQuery(q: string): boolean {
  const trimmed = (q || '').trim()
  if (!trimmed) return false
  if (['>', '#', '@', '!'].includes(trimmed)) return false
  return true
}

export function useOmniSearch() {
  const router = useRouter()
  const { openAddTask } = useQuickTask()
  const { openTaskDrawer } = useTaskDrawer()
  const workspaceStore = useWorkspaceStore()
  const { repos } = useGitHubRepos()

  // Global state across components via Nuxt useState
  const isOpen = useState<boolean>('omni-search:is_open', () => false)
  const rawQuery = useState<string>('omni-search:raw_query', () => '')
  const activeScope = useState<OmniSearchScope>('omni-search:active_scope', () => 'all')
  const selectedIndex = useState<number>('omni-search:selected_index', () => 0)
  const searchHistory = useState<string[]>('omni-search:search_history', () => [])
  const historyHydrated = useState<boolean>('omni-search:history_hydrated', () => false)
  const actionError = useState<string | null>('omni-search:action_error', () => null)

  if (!historyHydrated.value) {
    historyHydrated.value = true
    const storage = getSafeLocalStorage()
    if (storage) {
      try {
        const raw = storage.getItem(SEARCH_HISTORY_STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            searchHistory.value = parsed
              .filter((v): v is string => typeof v === 'string' && isRecordableQuery(v))
              .slice(0, MAX_SEARCH_HISTORY)
          }
        }
      } catch {
        // Ignore malformed storage JSON
      }
    }
  }

  function persistSearchHistory(items: string[]) {
    const storage = getSafeLocalStorage()
    if (!storage) return
    try {
      if (items.length === 0 && typeof storage.removeItem === 'function') {
        storage.removeItem(SEARCH_HISTORY_STORAGE_KEY)
      } else {
        storage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(items))
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  function addSearchHistory(queryText?: string) {
    const candidate = (queryText ?? rawQuery.value ?? '').trim()
    if (!isRecordableQuery(candidate)) return
    const filtered = searchHistory.value.filter(
      (h) => h.toLowerCase() !== candidate.toLowerCase()
    )
    const updated = [candidate, ...filtered].slice(0, MAX_SEARCH_HISTORY)
    searchHistory.value = updated
    persistSearchHistory(updated)
  }

  function removeSearchHistory(queryText: string) {
    const target = (queryText || '').trim().toLowerCase()
    if (!target) return
    const updated = searchHistory.value.filter((h) => h.toLowerCase() !== target)
    searchHistory.value = updated
    persistSearchHistory(updated)
  }

  function clearSearchHistory() {
    searchHistory.value = []
    persistSearchHistory([])
  }

  function applySearchHistory(queryText: string) {
    rawQuery.value = queryText
    selectedIndex.value = 0
    actionError.value = null
  }

  // Cycle available scopes
  const SCOPE_CYCLE: OmniSearchScope[] = ['all', 'task', 'project', 'sprint', 'repo', 'action', 'note']

  /**
   * Pure in-memory modal open with zero duplicate network fetches (0ms latency).
   */
  function openSearch(initialQuery = '') {
    isOpen.value = true
    actionError.value = null
    if (initialQuery) {
      rawQuery.value = initialQuery
    }
    selectedIndex.value = 0
  }

  function closeSearch() {
    isOpen.value = false
    activeScope.value = 'all'
    rawQuery.value = ''
    selectedIndex.value = 0
    actionError.value = null
  }

  function toggleSearch() {
    if (isOpen.value) {
      closeSearch()
    } else {
      openSearch()
    }
  }

  function setScope(scope: OmniSearchScope) {
    activeScope.value = scope
    selectedIndex.value = 0
  }

  function cycleScope(direction: 1 | -1 = 1) {
    const currentIndex = SCOPE_CYCLE.indexOf(activeScope.value)
    let nextIndex = currentIndex + direction
    if (nextIndex >= SCOPE_CYCLE.length) nextIndex = 0
    if (nextIndex < 0) nextIndex = SCOPE_CYCLE.length - 1
    activeScope.value = SCOPE_CYCLE[nextIndex]
    selectedIndex.value = 0
  }

  // Parse prefixes from raw query
  const parsedQuery = computed(() => {
    const raw = rawQuery.value.trim()
    if (raw.startsWith('>')) {
      return {
        prefixMode: 'action' as const,
        cleanQuery: raw.slice(1).trim().toLowerCase()
      }
    }
    if (raw.startsWith('#')) {
      return {
        prefixMode: 'tag' as const,
        cleanQuery: raw.slice(1).trim().toLowerCase()
      }
    }
    if (raw.startsWith('@')) {
      return {
        prefixMode: 'project' as const,
        cleanQuery: raw.slice(1).trim().toLowerCase()
      }
    }
    if (raw.startsWith('!')) {
      return {
        prefixMode: 'blocker' as const,
        cleanQuery: raw.slice(1).trim().toLowerCase()
      }
    }
    return {
      prefixMode: 'none' as const,
      cleanQuery: raw.toLowerCase()
    }
  })

  // Built-in Navigation Routes (Cleaned of dead routes)
  const navigationItems = computed<OmniSearchItem[]>(() => [
    {
      id: 'nav:command-center',
      title: 'Command Center',
      subtitle: '/',
      description: 'Main workspace telemetry, KPI summaries, and active execution queue',
      type: 'navigation',
      categoryLabel: 'Quick Navigation',
      icon: 'LayoutDashboard',
      iconColor: 'text-indigo-400',
      badge: 'PAGE',
      badgeColor: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
      action: async () => {
        closeSearch()
        await router.push('/')
      }
    },
    {
      id: 'nav:tasks',
      title: 'Tasks & Queue',
      subtitle: '/tasks',
      description: 'Deliverables matrix, task queue, and backlog execution',
      type: 'navigation',
      categoryLabel: 'Quick Navigation',
      icon: 'CheckSquare',
      iconColor: 'text-blue-400',
      badge: 'PAGE',
      badgeColor: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
      action: async () => {
        closeSearch()
        await router.push('/tasks')
      }
    },
    {
      id: 'nav:sprints',
      title: 'Weekly Sprints',
      subtitle: '/sprints',
      description: 'Sprint iterations, velocity tracking, and milestone goals',
      type: 'navigation',
      categoryLabel: 'Quick Navigation',
      icon: 'Calendar',
      iconColor: 'text-purple-400',
      badge: 'PAGE',
      badgeColor: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
      action: async () => {
        closeSearch()
        await router.push('/sprints')
      }
    },
    {
      id: 'nav:roadmap',
      title: 'Architecture Roadmap',
      subtitle: '/roadmap',
      description: 'Long-term architectural milestones, phases, and dependencies',
      type: 'navigation',
      categoryLabel: 'Quick Navigation',
      icon: 'Compass',
      iconColor: 'text-teal-400',
      badge: 'ROADMAP',
      badgeColor: 'bg-teal-500/10 text-teal-300 border border-teal-500/20',
      action: async () => {
        closeSearch()
        await router.push('/roadmap')
      }
    },
    {
      id: 'nav:repos',
      title: 'GitHub Repositories',
      subtitle: '/repos',
      description: 'Connected codebases, commits, pull requests, and CI/CD status',
      type: 'navigation',
      categoryLabel: 'Quick Navigation',
      icon: 'GitBranch',
      iconColor: 'text-emerald-400',
      badge: 'REPOS',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
      action: async () => {
        closeSearch()
        await router.push('/repos')
      }
    },
    {
      id: 'nav:telemetry',
      title: 'System Telemetry',
      subtitle: '/telemetry',
      description: 'Live agent health, edge RPC latencies, and service metrics',
      type: 'navigation',
      categoryLabel: 'Quick Navigation',
      icon: 'Activity',
      iconColor: 'text-rose-400',
      badge: 'TELEMETRY',
      badgeColor: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
      action: async () => {
        closeSearch()
        await router.push('/telemetry')
      }
    },
    {
      id: 'nav:projects',
      title: 'Active Projects',
      subtitle: '/projects',
      description: 'Project portfolio overview and repository linking',
      type: 'navigation',
      categoryLabel: 'Quick Navigation',
      icon: 'Layers',
      iconColor: 'text-sky-400',
      badge: 'PORTFOLIO',
      badgeColor: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
      action: async () => {
        closeSearch()
        await router.push('/projects')
      }
    }
  ])

  // Built-in Executable Action Commands
  const actionItems = computed<OmniSearchItem[]>(() => [
    {
      id: 'action:new-deliverable',
      title: '> Create New Deliverable',
      subtitle: 'Add a new task deliverable to the workspace',
      description: 'Create a new task deliverable with priority, tech tags, and project attribution',
      type: 'action',
      categoryLabel: 'Actions',
      icon: 'Plus',
      iconColor: 'text-emerald-400',
      badge: 'COMMAND',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
      shortcutHint: 'C',
      action: () => {
        closeSearch()
        openAddTask()
      }
    },
    {
      id: 'action:filter-blockers',
      title: '> Filter Critical Blockers',
      subtitle: 'Jump to deliverables matrix with blocked filter',
      description: 'Inspect all P0 critical and blocked issues across the active workspace',
      type: 'action',
      categoryLabel: 'Actions',
      icon: 'AlertTriangle',
      iconColor: 'text-rose-400',
      badge: 'FILTER',
      badgeColor: 'bg-rose-500/10 text-rose-300 border border-rose-500/20',
      action: async () => {
        closeSearch()
        await router.push('/tasks?status=blocked')
      }
    },
    {
      id: 'action:trigger-cicd',
      title: '> Trigger CI/CD Workflows',
      subtitle: 'View GitHub Actions workflow runs and rerun jobs',
      description: 'Check active workflow dispatch jobs and inspect real-time CI/CD status',
      type: 'action',
      categoryLabel: 'Actions',
      icon: 'PlayCircle',
      iconColor: 'text-sky-400',
      badge: 'CI/CD',
      badgeColor: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
      action: async () => {
        closeSearch()
        await router.push('/repos')
      }
    },
    {
      id: 'action:ping-edge',
      title: '> Ping Edge Gateway',
      subtitle: 'Inspect live edge health and RPC latency',
      description: 'Test latency and heartbeat to Supabase Edge Runtime and service nodes',
      type: 'action',
      categoryLabel: 'Actions',
      icon: 'Radio',
      iconColor: 'text-purple-400',
      badge: 'RPC',
      badgeColor: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
      action: async () => {
        closeSearch()
        await router.push('/telemetry')
      }
    },
    {
      id: 'action:refresh-all',
      title: '> Refresh All Data',
      subtitle: 'Synchronize caches across the application',
      description: 'Re-fetch tasks, projects, sprints, and repository states from backend APIs',
      type: 'action',
      categoryLabel: 'Actions',
      icon: 'RefreshCw',
      iconColor: 'text-teal-400',
      badge: 'SYNC',
      badgeColor: 'bg-teal-500/10 text-teal-300 border border-teal-500/20',
      action: async () => {
        closeSearch()
        await Promise.all([
          workspaceStore.initializeWorkspace(true),
          refreshNuxtData('github-repos'),
          refreshNuxtData('stats')
        ])
      }
    }
  ])

  // Flat Unified Catalog of Items derived from canonical useWorkspaceStore
  const allIndexedItems = computed<OmniSearchItem[]>(() => {
    const list: OmniSearchItem[] = []

    // 1. Actions & Commands
    list.push(...actionItems.value)

    // 2. Navigation Routes
    list.push(...navigationItems.value)

    // 3. Tasks & Deliverables
    const tasks = workspaceStore.tasks.value || []
    for (const t of tasks) {
      const taskIdCode = t.taskId || t.id.slice(0, 7)
      const isBlocked = t.status === 'blocked'
      const isCritical = t.priority === 'critical'
      const isDeployed = t.status === 'deployed'
      const isRunning = t.status === 'running_sprint'

      let icon = 'CheckSquare'
      let iconColor = 'text-indigo-400'
      if (isBlocked) {
        icon = 'AlertTriangle'
        iconColor = 'text-rose-400'
      } else if (isDeployed) {
        icon = 'CheckCircle2'
        iconColor = 'text-emerald-400'
      } else if (isRunning) {
        icon = 'Clock'
        iconColor = 'text-amber-400'
      }

      let badgeColor = 'bg-white/[0.06] text-[#8A8F9E] border border-white/[0.08]'
      if (isCritical || isBlocked) {
        badgeColor = 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
      } else if (isDeployed) {
        badgeColor = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
      } else if (isRunning) {
        badgeColor = 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
      }

      const secondaryAction = t.githubIssueUrl
        ? () => {
            safeOpenExternal(t.githubIssueUrl)
          }
        : undefined

      list.push({
        id: `task:${t.id}`,
        title: t.name,
        subtitle: `${taskIdCode} · ${t.projectSlug || 'General'}`,
        description: t.description || undefined,
        type: 'task',
        categoryLabel: 'Tasks & Deliverables',
        icon,
        iconColor,
        badge: taskIdCode,
        badgeColor,
        tags: t.techTags || [],
        projectSlug: t.projectSlug || undefined,
        priority: t.priority,
        status: t.status,
        payload: t,
        action: () => {
          closeSearch()
          openTaskDrawer(t.id)
        },
        secondaryAction,
        secondaryActionLabel: t.githubIssueUrl ? 'Open GitHub Issue' : undefined
      })
    }

    // 4. Projects
    const projects = workspaceStore.projects.value || []
    for (const p of projects) {
      const secondaryAction = p.githubRepo
        ? () => {
            const url = p.githubRepo?.startsWith('http://') || p.githubRepo?.startsWith('https://')
              ? p.githubRepo
              : `https://github.com/${p.githubRepo?.replace(/^github\.com\//, '')}`
            safeOpenExternal(url)
          }
        : undefined

      list.push({
        id: `project:${p.id || p.slug}`,
        title: p.title || p.slug,
        subtitle: `/projects/${p.slug}`,
        description: p.description || undefined,
        type: 'project',
        categoryLabel: 'Projects',
        icon: 'Folder',
        iconColor: 'text-indigo-400',
        badge: (p.status || 'PROJECT').toUpperCase(),
        badgeColor: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
        tags: p.techStack || [],
        projectSlug: p.slug,
        priority: p.priority,
        status: p.status,
        payload: p,
        action: async () => {
          closeSearch()
          await router.push(`/projects/${p.slug}`)
        },
        secondaryAction,
        secondaryActionLabel: p.githubRepo ? 'Open GitHub Repo' : undefined
      })
    }

    // 5. Weekly Sprints
    const sprints = workspaceStore.sprints.value || []
    for (const s of sprints) {
      const match = s.name.match(/W\d+/i)
      const sprintCode = match ? match[0].toUpperCase() : 'SPRINT'
      const isActive = s.status === 'active'

      list.push({
        id: `sprint:${s.id}`,
        title: s.name,
        subtitle: `${s.startDate || ''} → ${s.endDate || ''}`,
        description: s.objective || `${s.taskIds?.length || 0} deliverables committed`,
        type: 'sprint',
        categoryLabel: 'Weekly Sprints',
        icon: 'Calendar',
        iconColor: isActive ? 'text-amber-400' : 'text-purple-400',
        badge: sprintCode,
        badgeColor: isActive
          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
          : 'bg-white/[0.06] text-[#8A8F9E] border border-white/[0.08]',
        status: s.status,
        payload: s,
        action: async () => {
          closeSearch()
          await router.push('/sprints')
        }
      })
    }

    // 6. GitHub Repositories
    const reposList = repos.value || []
    for (const r of reposList) {
      const secondaryAction = () => {
        if (r.htmlUrl) {
          safeOpenExternal(r.htmlUrl)
        }
      }

      list.push({
        id: `repo:${r.id}`,
        title: r.name,
        subtitle: r.fullName,
        description: r.description || `${r.language || 'Code'} · ★ ${r.stargazersCount || 0} · branch: ${r.defaultBranch}`,
        type: 'repo',
        categoryLabel: 'Repositories',
        icon: 'GitBranch',
        iconColor: 'text-emerald-400',
        badge: r.language || 'REPO',
        badgeColor: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
        payload: r,
        action: async () => {
          closeSearch()
          await router.push(`/repos?q=${encodeURIComponent(r.name)}`)
        },
        secondaryAction,
        secondaryActionLabel: 'Open on GitHub'
      })
    }

    // 7. Project Notes & Ideas
    const notesList = workspaceStore.notes.value || []
    for (const n of notesList) {
      let icon = 'Wrench'
      let iconColor = 'text-amber-400'
      if (n.category === 'idea') {
        icon = 'Sparkles'
        iconColor = 'text-yellow-400'
      } else if (n.category === 'bug') {
        icon = 'Bug'
        iconColor = 'text-rose-400'
      }

      list.push({
        id: `note:${n.id}`,
        title: n.content.slice(0, 60),
        subtitle: `Note · ${n.projectSlug}`,
        description: n.content,
        type: 'note',
        categoryLabel: 'Project Notes',
        icon,
        iconColor,
        badge: n.category.toUpperCase(),
        badgeColor: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
        projectSlug: n.projectSlug,
        payload: n,
        action: async () => {
          closeSearch()
          const params = new URLSearchParams({ scratchpad: '1' })
          if (n.projectSlug) {
            params.set('project', n.projectSlug)
          }
          await router.push(`/tasks?${params.toString()}`)
        }
      })
    }

    return list
  })

  // Fast Fuzzy Matching and Scoring Engine ($O(N)$ zero-lag)
  function scoreItem(
    item: OmniSearchItem,
    query: string,
    prefixMode: 'none' | 'action' | 'tag' | 'project' | 'blocker'
  ): { score: number; titleRanges?: [number, number][]; subtitleRanges?: [number, number][] } {
    // Prefix filtering rules
    if (prefixMode === 'action') {
      if (item.type !== 'action' && item.type !== 'navigation') {
        return { score: -1 }
      }
    } else if (prefixMode === 'tag') {
      const tags = item.tags || []
      if (tags.length === 0) {
        return { score: -1 }
      }
      if (query) {
        const hasTag = tags.some((t) => t.toLowerCase().includes(query))
        if (!hasTag) {
          return { score: -1 }
        }
      }
    } else if (prefixMode === 'project') {
      const isProjectEntity = item.type === 'project' || Boolean(item.projectSlug)
      if (!isProjectEntity) {
        return { score: -1 }
      }
      if (query) {
        const projectMatches =
          item.projectSlug?.toLowerCase().includes(query) ||
          (item.type === 'project' && item.title.toLowerCase().includes(query))
        if (!projectMatches) {
          return { score: -1 }
        }
      }
    } else if (prefixMode === 'blocker') {
      const isCriticalOrBlocked =
        item.status === 'blocked' || item.priority === 'critical'
      if (!isCriticalOrBlocked) {
        return { score: -1 }
      }
    } else {
      // Scope filter when no explicit prefix override
      if (activeScope.value !== 'all') {
        if (activeScope.value === 'action') {
          if (item.type !== 'action' && item.type !== 'navigation') return { score: -1 }
        } else if (item.type !== activeScope.value) {
          return { score: -1 }
        }
      }
    }

    // Default sorting when query is empty
    if (!query) {
      let base = 100
      if (prefixMode === 'project' && item.type === 'project') base += 60
      if (item.type === 'action') base += 50
      if (item.priority === 'critical') base += 50
      if (item.status === 'blocked') base += 40
      if (item.status === 'active' || item.status === 'running_sprint') base += 30
      return { score: base }
    }

    let score = 0
    let titleRanges: [number, number][] | undefined
    let subtitleRanges: [number, number][] | undefined

    const titleLower = (item.title || '').toLowerCase()
    const subtitleLower = (item.subtitle || '').toLowerCase()
    const badgeLower = (item.badge || '').toLowerCase()

    // 1. Exact ID match (+1000) e.g. "DEL-01", "ENG-001", "W42"
    if (badgeLower === query || item.id.toLowerCase().endsWith(query)) {
      score += 1000
    }

    // 2. Exact Title match (+800)
    if (titleLower === query) {
      score += 800
      titleRanges = [[0, item.title.length]]
    }

    // 3. Prefix Match on Title (+500)
    if (titleLower.startsWith(query)) {
      score += 500
      titleRanges = [[0, query.length]]
    } else {
      // Word boundary prefix match
      const wordMatchIndex = titleLower.indexOf(' ' + query)
      if (wordMatchIndex !== -1) {
        score += 380
        titleRanges = [[wordMatchIndex + 1, wordMatchIndex + 1 + query.length]]
      }
    }

    // 4. Acronym Match (+400) e.g. "cc" -> Command Center, "w42" -> Weekly Sprint 42, "tfs" -> tf-hitnet-stream
    const words = item.title.split(/[\s\-_]+/).filter(Boolean)
    const acronym = words.map((w) => w[0]).join('').toLowerCase()
    if (acronym === query || acronym.startsWith(query)) {
      score += 400
    }

    // 5. Consecutive Substring Match (+200 + position bonuses)
    const titleIdx = titleLower.indexOf(query)
    if (titleIdx !== -1) {
      score += 200 + Math.max(0, 100 - titleIdx * 4)
      if (!titleRanges) {
        titleRanges = [[titleIdx, titleIdx + query.length]]
      }
    }

    const subIdx = subtitleLower.indexOf(query)
    if (subIdx !== -1) {
      score += 120 + Math.max(0, 60 - subIdx * 2)
      subtitleRanges = [[subIdx, subIdx + query.length]]
    }

    // 6. Tech Tag match (+250 exact/prefix, +180 substring)
    if (item.tags?.some((t) => t.toLowerCase() === query || t.toLowerCase().startsWith(query))) {
      score += 250
    } else if (item.tags?.some((t) => t.toLowerCase().includes(query))) {
      score += 180
    }

    // 6b. Project Slug match under @ prefix (+200)
    if (prefixMode === 'project' && item.projectSlug?.toLowerCase().includes(query)) {
      score += 200
    }

    // 7. Description match (+80)
    if (item.description?.toLowerCase().includes(query)) {
      score += 80
    }

    // 8. Urgency & State Boosts
    if (item.priority === 'critical') score += 50
    if (item.status === 'blocked') score += 40
    if (item.status === 'active' || item.status === 'running_sprint') score += 30

    // 9. Fuzzy character subsequence fallback if no match yet
    if (score === 0) {
      let qIdx = 0
      let matchCount = 0
      let consecutive = 0
      const matchedPositions: number[] = []

      for (let i = 0; i < titleLower.length && qIdx < query.length; i++) {
        if (titleLower[i] === query[qIdx]) {
          matchedPositions.push(i)
          qIdx++
          matchCount++
          consecutive++
          score += 10 + consecutive * 5
        } else {
          consecutive = 0
        }
      }

      if (qIdx === query.length) {
        // All characters matched in sequence
        score += 50
        // Convert matched positions into ranges
        titleRanges = []
        let rangeStart = matchedPositions[0]
        let prev = rangeStart
        for (let i = 1; i < matchedPositions.length; i++) {
          const curr = matchedPositions[i]
          if (curr === prev + 1) {
            prev = curr
          } else {
            titleRanges.push([rangeStart, prev + 1])
            rangeStart = curr
            prev = curr
          }
        }
        titleRanges.push([rangeStart, prev + 1])
      } else {
        score = -1 // No match
      }
    }

    return { score, titleRanges, subtitleRanges }
  }

  // Filtered and Scored Results
  const filteredResults = computed<OmniSearchItem[]>(() => {
    const { prefixMode, cleanQuery } = parsedQuery.value
    const scoredList: OmniSearchItem[] = []

    for (const item of allIndexedItems.value) {
      const { score, titleRanges, subtitleRanges } = scoreItem(item, cleanQuery, prefixMode)
      if (score >= 0) {
        scoredList.push({
          ...item,
          score,
          titleHighlights: titleRanges,
          subtitleHighlights: subtitleRanges
        })
      }
    }

    // Sort descending by score
    return scoredList.sort((a, b) => (b.score || 0) - (a.score || 0))
  })

  // Selected Item
  const selectedItem = computed<OmniSearchItem | null>(() => {
    if (filteredResults.value.length === 0) return null
    const idx = Math.min(Math.max(0, selectedIndex.value), filteredResults.value.length - 1)
    return filteredResults.value[idx] || null
  })

  function selectNext() {
    if (filteredResults.value.length === 0) return
    selectedIndex.value = (selectedIndex.value + 1) % filteredResults.value.length
  }

  function selectPrevious() {
    if (filteredResults.value.length === 0) return
    selectedIndex.value =
      (selectedIndex.value - 1 + filteredResults.value.length) % filteredResults.value.length
  }

  function setSelectedIndex(idx: number) {
    if (idx >= 0 && idx < filteredResults.value.length) {
      selectedIndex.value = idx
    }
  }

  async function executeCurrent(targetItem?: OmniSearchItem | null) {
    const item = targetItem ?? selectedItem.value
    if (!item || !item.action) return
    actionError.value = null
    if (isRecordableQuery(rawQuery.value)) {
      addSearchHistory(rawQuery.value)
    }
    try {
      await item.action()
      closeSearch()
    } catch (err) {
      actionError.value =
        err instanceof Error ? err.message : 'Failed to execute action. Please try again.'
    }
  }

  async function executeSecondary(targetItem?: OmniSearchItem | null) {
    const item = targetItem ?? selectedItem.value
    if (!item) return
    actionError.value = null
    if (isRecordableQuery(rawQuery.value)) {
      addSearchHistory(rawQuery.value)
    }
    try {
      if (item.secondaryAction) {
        await item.secondaryAction()
        closeSearch()
      } else if (item.action) {
        await item.action()
      }
    } catch (err) {
      actionError.value =
        err instanceof Error ? err.message : 'Failed to execute action. Please try again.'
    }
  }

  // Clear action error when query changes
  watch(rawQuery, () => {
    if (actionError.value) {
      actionError.value = null
    }
  })

  // Keep selected index within bounds when results change
  watch(
    () => filteredResults.value.length,
    (len) => {
      if (selectedIndex.value >= len) {
        selectedIndex.value = Math.max(0, len - 1)
      }
    }
  )

  return {
    isOpen,
    rawQuery,
    parsedQuery,
    activeScope,
    selectedIndex,
    selectedItem,
    filteredResults,
    searchHistory,
    actionError,
    openSearch,
    closeSearch,
    toggleSearch,
    setScope,
    cycleScope,
    selectNext,
    selectPrevious,
    setSelectedIndex,
    executeCurrent,
    executeSecondary,
    addSearchHistory,
    removeSearchHistory,
    clearSearchHistory,
    applySearchHistory,
    safeOpenExternal
  }
}
