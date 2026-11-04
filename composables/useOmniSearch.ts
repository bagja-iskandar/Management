import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuickTask } from '~/composables/useQuickTask'
import { useTaskDrawer } from '~/composables/useTaskDrawer'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useGitHubRepos } from '~/composables/useGitHub'

import type { OmniSearchItem, OmniSearchScope } from './search/omniSearchTypes'
import {
  splitHighlights,
  safeOpenExternal,
  scoreItem,
  parseSearchQuery,
  isRecordableQuery,
  getSafeLocalStorage,
  SEARCH_HISTORY_STORAGE_KEY,
  MAX_SEARCH_HISTORY
} from './search/omniSearchScoring'
import {
  buildNavigationItems,
  buildActionItems,
  buildTaskItems,
  buildProjectItems,
  buildSprintItems,
  buildRepoItems,
  buildNoteItems
} from './search/omniSearchCatalog'

export { splitHighlights, safeOpenExternal } from './search/omniSearchScoring'
export * from './search/omniSearchTypes'

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
  const parsedQuery = computed(() => parseSearchQuery(rawQuery.value))

  // Navigation Items
  const navigationItems = computed<OmniSearchItem[]>(() =>
    buildNavigationItems({ router, closeSearch })
  )

  // Executable Actions
  const actionItems = computed<OmniSearchItem[]>(() =>
    buildActionItems({ router, closeSearch, openAddTask, workspaceStore })
  )

  // Flat Unified Catalog derived from canonical useWorkspaceStore
  const allIndexedItems = computed<OmniSearchItem[]>(() => {
    const list: OmniSearchItem[] = []
    list.push(...actionItems.value)
    list.push(...navigationItems.value)
    list.push(...buildTaskItems(workspaceStore.tasks.value || [], { closeSearch, openTaskDrawer }))
    list.push(...buildProjectItems(workspaceStore.projects.value || [], { closeSearch, router }))
    list.push(...buildSprintItems(workspaceStore.sprints.value || [], { closeSearch, router }))
    list.push(...buildRepoItems(repos.value || [], { closeSearch, router }))
    list.push(...buildNoteItems(workspaceStore.notes.value || [], { closeSearch, router }))
    return list
  })

  // Filtered and Scored Results
  const filteredResults = computed<OmniSearchItem[]>(() => {
    const { prefixMode, cleanQuery } = parsedQuery.value
    const scoredList: OmniSearchItem[] = []

    for (const item of allIndexedItems.value) {
      const { score, titleRanges, subtitleRanges } = scoreItem(
        item,
        cleanQuery,
        prefixMode,
        activeScope.value
      )
      if (score >= 0) {
        scoredList.push({
          ...item,
          score,
          titleHighlights: titleRanges,
          subtitleHighlights: subtitleRanges
        })
      }
    }

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
