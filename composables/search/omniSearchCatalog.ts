import type { Task, Project, Sprint, GitHubRepoSummary, ProjectNote } from '~/types'
import type { OmniSearchItem } from './omniSearchTypes'
import { safeOpenExternal } from './omniSearchScoring'

export interface CatalogDeps {
  router: any
  closeSearch: () => void
  openAddTask: () => void
  openTaskDrawer: (id: string) => void
  workspaceStore: any
}

export function buildNavigationItems(deps: { router: any; closeSearch: () => void }): OmniSearchItem[] {
  const { router, closeSearch } = deps
  return [
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
  ]
}

export function buildActionItems(deps: {
  router: any
  closeSearch: () => void
  openAddTask: () => void
  workspaceStore: any
}): OmniSearchItem[] {
  const { router, closeSearch, openAddTask, workspaceStore } = deps
  return [
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
          typeof globalThis.refreshNuxtData === 'function' ? globalThis.refreshNuxtData('github-repos') : Promise.resolve(),
          typeof globalThis.refreshNuxtData === 'function' ? globalThis.refreshNuxtData('stats') : Promise.resolve()
        ])
      }
    }
  ]
}

export function buildTaskItems(
  tasks: Task[],
  deps: { closeSearch: () => void; openTaskDrawer: (id: string) => void }
): OmniSearchItem[] {
  const { closeSearch, openTaskDrawer } = deps
  const list: OmniSearchItem[] = []

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

  return list
}

export function buildProjectItems(
  projects: Project[],
  deps: { closeSearch: () => void; router: any }
): OmniSearchItem[] {
  const { closeSearch, router } = deps
  const list: OmniSearchItem[] = []

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

  return list
}

export function buildSprintItems(
  sprints: Sprint[],
  deps: { closeSearch: () => void; router: any }
): OmniSearchItem[] {
  const { closeSearch, router } = deps
  const list: OmniSearchItem[] = []

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

  return list
}

export function buildRepoItems(
  repos: GitHubRepoSummary[],
  deps: { closeSearch: () => void; router: any }
): OmniSearchItem[] {
  const { closeSearch, router } = deps
  const list: OmniSearchItem[] = []

  for (const r of repos) {
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

  return list
}

export function buildNoteItems(
  notes: ProjectNote[],
  deps: { closeSearch: () => void; router: any }
): OmniSearchItem[] {
  const { closeSearch, router } = deps
  const list: OmniSearchItem[] = []

  for (const n of notes) {
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
}
