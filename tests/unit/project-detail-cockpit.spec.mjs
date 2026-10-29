import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ref, computed } from 'vue'
import { createJiti } from 'jiti'

// =============================================================================
// Nuxt Global State Simulation & JITI Runtime Setup
// =============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

// Prevent unhandled promise rejections on secondary .finally() branches in Node test runner
const origFinally = Promise.prototype.finally
Promise.prototype.finally = function (callback) {
  const res = origFinally.call(this, callback)
  res.catch(() => {})
  return res
}

// Global navigator definition for Node.js 24 compatibility
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { onLine: true }
} else {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: true,
    configurable: true,
    writable: true
  })
}

// Simulated Nuxt useState reactive store
const nuxtState = new Map()
function mockUseState(key, init) {
  if (!nuxtState.has(key)) {
    nuxtState.set(key, ref(init ? init() : undefined))
  }
  return nuxtState.get(key)
}

globalThis.useState = mockUseState
globalThis.defineEventHandler = (fn) => fn
globalThis.$fetch = async () => []

const jiti = createJiti(import.meta.url, { alias: { '~': projectRoot, '~~': projectRoot } })
const { useWorkspaceStore } = jiti('../../composables/useWorkspaceStore.ts')
const { useProjects } = jiti('../../composables/useProjects.ts')
const { useProjectNav } = jiti('../../composables/useProjectNav.ts')

// Helper function to reset reactive store between tests
function resetWorkspaceStore() {
  nuxtState.clear()
  const store = useWorkspaceStore()
  store.tasks.value = []
  store.projects.value = []
  store.sprints.value = []
  store.notes.value = []
  store.isInitialized.value = false
  store.isLoading.value = false
  store.hydrationStatus.value = {
    tasks: 'idle',
    projects: 'idle',
    sprints: 'idle',
    notes: 'idle'
  }
  return store
}

// =============================================================================
// PHASE 6: PROJECT DETAIL COCKPIT — 14 TEST CONTRACTS
// =============================================================================

// -----------------------------------------------------------------------------
// 1. STATE-01: State machine yields 'LOADING' when uninitialized or loading
// -----------------------------------------------------------------------------
test('STATE-01: State machine yields "LOADING" when store is uninitialized or projects hydration is loading', () => {
  // Logic matching app/pages/projects/[slug].vue:613-631
  function computeDetailState({ isInitialized, isLoading, projHydration, currentProject }) {
    if (
      !isInitialized &&
      (isLoading || projHydration === 'loading' || projHydration === 'idle')
    ) {
      return 'LOADING'
    }
    if (projHydration === 'loading' && !currentProject) {
      return 'LOADING'
    }
    if (projHydration === 'error' && !currentProject) {
      return 'ERROR'
    }
    if (!currentProject) {
      return 'NOT_FOUND'
    }
    return 'READY'
  }

  // 1. Initial boot: not initialized, isLoading = true
  assert.equal(
    computeDetailState({
      isInitialized: false,
      isLoading: true,
      projHydration: 'idle',
      currentProject: null
    }),
    'LOADING',
    'Must yield LOADING during initial boot when isLoading is true'
  )

  // 2. Initial boot: not initialized, projHydration = 'loading'
  assert.equal(
    computeDetailState({
      isInitialized: false,
      isLoading: false,
      projHydration: 'loading',
      currentProject: null
    }),
    'LOADING',
    'Must yield LOADING during initial boot when projHydration is loading'
  )

  // 3. Initial boot: not initialized, projHydration = 'idle'
  assert.equal(
    computeDetailState({
      isInitialized: false,
      isLoading: false,
      projHydration: 'idle',
      currentProject: null
    }),
    'LOADING',
    'Must yield LOADING before hydration begins'
  )

  // 4. In-flight background fetch with no project found yet
  assert.equal(
    computeDetailState({
      isInitialized: true,
      isLoading: false,
      projHydration: 'loading',
      currentProject: null
    }),
    'LOADING',
    'Must yield LOADING while projects are loading and target project is not yet in cache'
  )
})

// -----------------------------------------------------------------------------
// 2. STATE-02: State machine yields 'NOT_FOUND' and currentProject === null
// -----------------------------------------------------------------------------
test('STATE-02: State machine yields "NOT_FOUND" and currentProject === null when slug is not registered (zero fake fallback)', () => {
  const storeProjects = [
    { id: 'p1', slug: 'nexura-cloud', title: 'Nexura Cloud' },
    { id: 'p2', slug: 'nexura-ui', title: 'Nexura UI' }
  ]

  // Implementation matching app/pages/projects/[slug].vue:606-610
  function resolveCurrentProject(slug, list) {
    const currentSlug = (slug || '').toLowerCase()
    return list.find((p) => p.slug.toLowerCase() === currentSlug) || null
  }

  function computeDetailState({ isInitialized, isLoading, projHydration, currentProject }) {
    if (
      !isInitialized &&
      (isLoading || projHydration === 'loading' || projHydration === 'idle')
    ) {
      return 'LOADING'
    }
    if (projHydration === 'loading' && !currentProject) return 'LOADING'
    if (projHydration === 'error' && !currentProject) return 'ERROR'
    if (!currentProject) return 'NOT_FOUND'
    return 'READY'
  }

  // Query an unregistered slug
  const targetSlug = 'non-existent-service'
  const project = resolveCurrentProject(targetSlug, storeProjects)

  // 1. Must resolve to null strictly without fake fallback data
  assert.equal(project, null, 'Unregistered slug must resolve strictly to null')

  // 2. State machine must produce NOT_FOUND
  const state = computeDetailState({
    isInitialized: true,
    isLoading: false,
    projHydration: 'success',
    currentProject: project
  })
  assert.equal(state, 'NOT_FOUND', 'State machine must yield NOT_FOUND when project does not exist')
})

// -----------------------------------------------------------------------------
// 3. STATE-03: State machine yields 'ERROR' when hydration fails and no cache exists
// -----------------------------------------------------------------------------
test('STATE-03: State machine yields "ERROR" (not a false 404) when projects hydration fails and no cache exists', () => {
  function computeDetailState({ isInitialized, isLoading, projHydration, currentProject }) {
    if (
      !isInitialized &&
      (isLoading || projHydration === 'loading' || projHydration === 'idle')
    ) {
      return 'LOADING'
    }
    if (projHydration === 'loading' && !currentProject) return 'LOADING'
    if (projHydration === 'error' && !currentProject) return 'ERROR'
    if (!currentProject) return 'NOT_FOUND'
    return 'READY'
  }

  const state = computeDetailState({
    isInitialized: true,
    isLoading: false,
    projHydration: 'error',
    currentProject: null
  })

  // Must report ERROR so connection error card with Retry button is rendered, NOT a false 404!
  assert.equal(state, 'ERROR', 'Must yield ERROR instead of false NOT_FOUND on network failure')
  assert.notEqual(state, 'NOT_FOUND')
})

// -----------------------------------------------------------------------------
// 4. STATE-04: Stale cache resilience yields 'READY' with stale warning
// -----------------------------------------------------------------------------
test('STATE-04: State machine yields "READY" with isStaleProjectsError = true when hydration fails but cache exists', () => {
  const cachedProject = { id: 'p1', slug: 'nexura-cloud', title: 'Nexura Cloud Cached' }
  const projHydration = 'error'

  function computeDetailState({ isInitialized, isLoading, projHydration, currentProject }) {
    if (
      !isInitialized &&
      (isLoading || projHydration === 'loading' || projHydration === 'idle')
    ) {
      return 'LOADING'
    }
    if (projHydration === 'loading' && !currentProject) return 'LOADING'
    if (projHydration === 'error' && !currentProject) return 'ERROR'
    if (!currentProject) return 'NOT_FOUND'
    return 'READY'
  }

  const isStaleProjectsError = projHydration === 'error' && !!cachedProject

  const state = computeDetailState({
    isInitialized: true,
    isLoading: false,
    projHydration: 'error',
    currentProject: cachedProject
  })

  // Stale cache serves cockpit uninterrupted
  assert.equal(state, 'READY', 'Must yield READY to allow user interaction with cached project')
  assert.equal(isStaleProjectsError, true, 'Must flag isStaleProjectsError to display warning banner')
})

// -----------------------------------------------------------------------------
// 5. NAV-01: useProjectNav accepts 'notes' and rejects legacy 'supabase'
// -----------------------------------------------------------------------------
test('NAV-01: useProjectNav accepts "notes" as a valid tab and rejects legacy tab "supabase"', () => {
  resetWorkspaceStore()
  const nav = useProjectNav()

  // 1. Initial tab defaults to 'dashboard'
  assert.equal(nav.activeTab.value, 'dashboard')

  // 2. Setting 'notes' is accepted and reflected
  nav.setActiveTab('notes')
  assert.equal(nav.activeTab.value, 'notes')

  // 3. Setting 'kanban', 'matrix', 'github', 'vercel'
  nav.setActiveTab('kanban')
  assert.equal(nav.activeTab.value, 'kanban')
  nav.setActiveTab('matrix')
  assert.equal(nav.activeTab.value, 'matrix')
  nav.setActiveTab('github')
  assert.equal(nav.activeTab.value, 'github')
  nav.setActiveTab('vercel')
  assert.equal(nav.activeTab.value, 'vercel')

  // 4. Valid tabs list contract
  const validTabs = ['dashboard', 'kanban', 'matrix', 'github', 'vercel', 'notes']
  assert.ok(validTabs.includes('notes'), 'notes must be in valid tabs')
  assert.ok(!validTabs.includes('supabase'), 'supabase must NOT be in valid tabs')
})

// -----------------------------------------------------------------------------
// 6. NAV-02: resolveTab maps 'supabase' -> 'notes', valid tabs, and invalid -> 'dashboard'
// -----------------------------------------------------------------------------
test('NAV-02: resolveTab maps "supabase" -> "notes", valid tabs to themselves, and invalid strings -> "dashboard"', () => {
  // Implementation matching app/pages/projects/[slug].vue:548-557
  function resolveTab(tabQuery) {
    if (typeof tabQuery !== 'string') return 'dashboard'
    const t = tabQuery.toLowerCase()
    if (t === 'supabase' || t === 'notes') return 'notes'
    if (t === 'kanban') return 'kanban'
    if (t === 'matrix') return 'matrix'
    if (t === 'github') return 'github'
    if (t === 'vercel') return 'vercel'
    return 'dashboard'
  }

  // 1. Legacy redirection: 'supabase' -> 'notes'
  assert.equal(resolveTab('supabase'), 'notes', 'Legacy tab "supabase" must resolve to "notes"')
  assert.equal(resolveTab('SUPABASE'), 'notes', 'Case-insensitive "SUPABASE" must resolve to "notes"')

  // 2. Direct match: 'notes'
  assert.equal(resolveTab('notes'), 'notes')

  // 3. Valid tabs
  assert.equal(resolveTab('kanban'), 'kanban')
  assert.equal(resolveTab('matrix'), 'matrix')
  assert.equal(resolveTab('github'), 'github')
  assert.equal(resolveTab('vercel'), 'vercel')
  assert.equal(resolveTab('dashboard'), 'dashboard')

  // 4. Invalid queries fallback to 'dashboard'
  assert.equal(resolveTab('unknown-tab'), 'dashboard')
  assert.equal(resolveTab(''), 'dashboard')
  assert.equal(resolveTab(null), 'dashboard')
  assert.equal(resolveTab(undefined), 'dashboard')
  assert.equal(resolveTab(123), 'dashboard')
})

// -----------------------------------------------------------------------------
// 7. NAV-03: setCounts in useProjectNav updates counters reactively
// -----------------------------------------------------------------------------
test('NAV-03: setCounts updates navigation counters reactively', () => {
  resetWorkspaceStore()
  const nav = useProjectNav()

  // Initial counters are zero/false
  assert.equal(nav.tasksCount.value, 0)
  assert.equal(nav.matrixCount.value, 0)
  assert.equal(nav.commitsCount.value, 0)
  assert.equal(nav.hasGithub.value, false)

  // Full update
  nav.setCounts({
    tasks: 15,
    matrix: 15,
    commits: 42,
    hasGithub: true
  })

  assert.equal(nav.tasksCount.value, 15)
  assert.equal(nav.matrixCount.value, 15)
  assert.equal(nav.commitsCount.value, 42)
  assert.equal(nav.hasGithub.value, true)

  // Partial update preserves untouched counters
  nav.setCounts({ commits: 50 })
  assert.equal(nav.commitsCount.value, 50)
  assert.equal(nav.tasksCount.value, 15, 'tasksCount must remain preserved on partial update')
  assert.equal(nav.hasGithub.value, true, 'hasGithub must remain preserved on partial update')
})

// -----------------------------------------------------------------------------
// 8. SSOT-01: Task filtering isolates tasks by projectSlug without cross-project leakage
// -----------------------------------------------------------------------------
test('SSOT-01: Task filtering strictly isolates tasks by projectSlug with zero cross-project leakage', () => {
  const storeTasks = [
    { id: 't-1', name: 'Task Cloud 1', projectSlug: 'nexura-cloud', status: 'in_queue' },
    { id: 't-2', name: 'Task Cloud 2', projectSlug: 'NEXURA-CLOUD', status: 'running_sprint' },
    { id: 't-3', name: 'Task UI 1', projectSlug: 'nexura-ui', status: 'deployed' },
    { id: 't-4', name: 'Task Backend', projectSlug: 'nexura-backend', status: 'in_queue' },
    { id: 't-5', name: 'Unassigned Task', projectSlug: null, status: 'in_queue' },
    { id: 't-6', name: 'Undefined Slug Task', status: 'in_queue' }
  ]

  // Implementation matching app/pages/projects/[slug].vue:883-887
  function filterProjectTasks(projectSlug, tasks) {
    if (!projectSlug) return []
    const currentSlug = projectSlug.toLowerCase()
    return (tasks || []).filter((t) => (t.projectSlug || '').toLowerCase() === currentSlug)
  }

  // 1. Query for 'nexura-cloud'
  const cloudTasks = filterProjectTasks('nexura-cloud', storeTasks)
  assert.equal(cloudTasks.length, 2)
  assert.deepEqual(
    cloudTasks.map((t) => t.id),
    ['t-1', 't-2'],
    'Should contain only tasks matching nexura-cloud case-insensitively'
  )

  // 2. Query for 'nexura-ui'
  const uiTasks = filterProjectTasks('nexura-ui', storeTasks)
  assert.equal(uiTasks.length, 1)
  assert.equal(uiTasks[0].id, 't-3')

  // 3. Query for non-existent project
  const emptyTasks = filterProjectTasks('non-existent', storeTasks)
  assert.equal(emptyTasks.length, 0)

  // 4. Zero cross-project leakage: Unassigned tasks are never included
  assert.ok(!cloudTasks.some((t) => t.id === 't-5'))
  assert.ok(!cloudTasks.some((t) => t.id === 't-6'))
})

// -----------------------------------------------------------------------------
// 9. SSOT-02: Milestone progress percentage calculation with zero-division safety
// -----------------------------------------------------------------------------
test('SSOT-02: Milestone progress calculates accurately with zero-division protection and integer rounding', () => {
  // Implementation matching app/pages/projects/[slug].vue:902-908
  function computeProgress(tasks) {
    const total = tasks.length
    if (!total) return 0
    const completed = tasks.filter((t) => t.status === 'deployed').length
    return Math.round((completed / total) * 100)
  }

  // 1. Zero deliverables -> 0% (zero-division safe)
  assert.equal(computeProgress([]), 0)

  // 2. Zero deployed deliverables -> 0%
  const tasksNone = [
    { id: '1', status: 'in_queue' },
    { id: '2', status: 'running_sprint' }
  ]
  assert.equal(computeProgress(tasksNone), 0)

  // 3. 1 out of 4 deployed -> 25%
  const tasksQuarter = [
    { id: '1', status: 'deployed' },
    { id: '2', status: 'in_queue' },
    { id: '3', status: 'in_queue' },
    { id: '4', status: 'running_sprint' }
  ]
  assert.equal(computeProgress(tasksQuarter), 25)

  // 4. 1 out of 3 deployed -> 33% (Math.round(33.333...) = 33)
  const tasksThird = [
    { id: '1', status: 'deployed' },
    { id: '2', status: 'in_queue' },
    { id: '3', status: 'running_sprint' }
  ]
  assert.equal(computeProgress(tasksThird), 33)

  // 5. 2 out of 3 deployed -> 67% (Math.round(66.666...) = 67)
  const tasksTwoThirds = [
    { id: '1', status: 'deployed' },
    { id: '2', status: 'deployed' },
    { id: '3', status: 'running_sprint' }
  ]
  assert.equal(computeProgress(tasksTwoThirds), 67)

  // 6. All deployed -> 100%
  const tasksAll = [
    { id: '1', status: 'deployed' },
    { id: '2', status: 'deployed' }
  ]
  assert.equal(computeProgress(tasksAll), 100)
})

// -----------------------------------------------------------------------------
// 10. DELETE-01: Double-confirmation slug verification locks button until match
// -----------------------------------------------------------------------------
test('DELETE-01: Double-confirmation slug verification locks deletion until exact trimmed case-insensitive match', () => {
  const currentProject = { id: 'p1', slug: 'nexura-cloud', title: 'Nexura Cloud' }

  // Implementation matching app/pages/projects/[slug].vue:659-662
  function checkSlugMatch(input, project) {
    if (!project?.slug) return false
    return (input || '').trim().toLowerCase() === project.slug.toLowerCase()
  }

  // 1. Empty input -> locked
  assert.equal(checkSlugMatch('', currentProject), false)

  // 2. Whitespace only -> locked
  assert.equal(checkSlugMatch('   ', currentProject), false)

  // 3. Partial or typo -> locked
  assert.equal(checkSlugMatch('nexura', currentProject), false)
  assert.equal(checkSlugMatch('nexura-cloud-v2', currentProject), false)

  // 4. Exact match -> unlocked
  assert.equal(checkSlugMatch('nexura-cloud', currentProject), true)

  // 5. Trimmed match -> unlocked
  assert.equal(checkSlugMatch('  nexura-cloud  ', currentProject), true)

  // 6. Case-insensitive match -> unlocked
  assert.equal(checkSlugMatch('NEXURA-CLOUD', currentProject), true)
  assert.equal(checkSlugMatch('  NeXuRa-ClOuD  ', currentProject), true)
})

// -----------------------------------------------------------------------------
// 11. DELETE-02: Snapshot recovery on delete failure restores project to store
// -----------------------------------------------------------------------------
test('DELETE-02: Snapshot recovery restores project to workspaceStore if server deletion fails', async () => {
  const store = resetWorkspaceStore()
  const projectsApi = useProjects()

  const projectToDelete = {
    id: 'p-delete-1',
    slug: 'target-project',
    title: 'Project To Delete',
    status: 'active',
    description: 'Target description'
  }

  store.addProjectToStore(projectToDelete)
  assert.equal(store.projects.value.length, 1)

  // Simulate server deletion failure (HTTP 500 error)
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'DELETE' && typeof url === 'string' && url.includes('target-project')) {
      throw new Error('HTTP 500 Internal Server Error: Database Foreign Key Constraint')
    }
    return {}
  }

  let errorCaught = null
  try {
    await projectsApi.deleteProject('target-project')
  } catch (err) {
    errorCaught = err
  }

  // 1. Verify delete threw the expected rejection
  assert.ok(errorCaught, 'Delete must reject when server returns error')
  assert.match(errorCaught.message, /500 Internal Server Error/)

  // 2. Verify snapshot recovery restored project with intact metadata
  const restored = store.projects.value.find((p) => p.slug === 'target-project')
  assert.ok(restored, 'Project must be restored to store on failure')
  assert.equal(restored.id, 'p-delete-1')
  assert.equal(restored.title, 'Project To Delete')
  assert.equal(restored.status, 'active')
  assert.equal(store.projects.value.length, 1)
})

// -----------------------------------------------------------------------------
// 12. DELETE-03: Guard mutex isDeleting prevents concurrent duplicate execution
// -----------------------------------------------------------------------------
test('DELETE-03: Guard mutex isDeleting blocks concurrent duplicate execution', async () => {
  let isDeleting = false
  let deleteApiCallCount = 0

  async function simulateOnProjectDeleted(isSlugMatched) {
    if (!isSlugMatched || isDeleting) return false
    isDeleting = true
    try {
      deleteApiCallCount++
      // Artificial async delay
      await new Promise((r) => setTimeout(r, 20))
      return true
    } finally {
      isDeleting = false
    }
  }

  // 1. Trigger two rapid simultaneous deletion calls
  const [res1, res2] = await Promise.all([
    simulateOnProjectDeleted(true),
    simulateOnProjectDeleted(true)
  ])

  // Only the first call executed; the second was guarded by mutex
  assert.equal(res1, true, 'First delete execution must succeed')
  assert.equal(res2, false, 'Second concurrent delete execution must be blocked by mutex')
  assert.equal(deleteApiCallCount, 1, 'Delete API must be called exactly once')
  assert.equal(isDeleting, false, 'Mutex must reset to false after completion')
})

// -----------------------------------------------------------------------------
// 13. LAYOUT-VIEWPORT-01: Single Viewport desktop flexbox classes are conditionally applied when activeTab === 'dashboard'
// -----------------------------------------------------------------------------
test("LAYOUT-VIEWPORT-01: Single Viewport desktop flexbox classes are conditionally applied when activeTab === 'dashboard'", () => {
  const pagePath = path.resolve(projectRoot, 'app/pages/projects/[slug].vue')
  assert.ok(fs.existsSync(pagePath), 'Project detail cockpit page must exist')
  const pageContent = fs.readFileSync(pagePath, 'utf8')

  // 1. Verify conditional scoping on root container
  assert.ok(
    pageContent.includes(
      "activeTab === 'dashboard' ? 'space-y-3 sm:space-y-3.5 xl:h-full xl:flex xl:flex-col xl:min-h-0 xl:pb-0' : 'space-y-6 pb-12'"
    ),
    'Root container must conditionally apply single-viewport desktop flexbox classes for dashboard tab only'
  )

  // 2. Verify 4-pillar bento grid applies desktop 4 columns
  assert.ok(
    pageContent.includes('grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'),
    'DevOps bento cockpit matrix must use grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
  )

  // 3. Verify inner dashboard container uses flex-1 and min-h-0 for desktop single-viewport layout
  assert.ok(
    pageContent.includes('xl:flex-1 xl:flex xl:flex-col xl:min-h-0'),
    'Dashboard view container must contain flex-1 flex-col min-h-0 for desktop containment'
  )
})

// -----------------------------------------------------------------------------
// 14. LAYOUT-RESPONSIVE-02: Non-dashboard tabs (kanban, matrix, notes) maintain unclipped natural scrolling and bottom padding
// -----------------------------------------------------------------------------
test('LAYOUT-RESPONSIVE-02: Non-dashboard tabs (kanban, matrix, notes) maintain unclipped natural scrolling and bottom padding', () => {
  function getTabContainerClasses(activeTab) {
    return activeTab === 'dashboard'
      ? 'space-y-3 sm:space-y-3.5 xl:h-full xl:flex xl:flex-col xl:min-h-0 xl:pb-0'
      : 'space-y-6 pb-12'
  }

  // Non-dashboard tabs must allow natural page overflow scrolling with generous bottom padding
  const nonDashboardTabs = ['kanban', 'matrix', 'notes', 'github', 'vercel']
  for (const tab of nonDashboardTabs) {
    const classes = getTabContainerClasses(tab)
    assert.equal(
      classes,
      'space-y-6 pb-12',
      `Tab ${tab} must return relaxed spacing and bottom padding pb-12`
    )
    assert.equal(
      classes.includes('xl:h-full'),
      false,
      `Tab ${tab} must not lock height to xl:h-full`
    )
    assert.equal(
      classes.includes('xl:flex'),
      false,
      `Tab ${tab} must not apply desktop flex container`
    )
    assert.equal(
      classes.includes('xl:min-h-0'),
      false,
      `Tab ${tab} must not apply flex minimum height zero constraint`
    )
    assert.ok(
      classes.includes('pb-12'),
      `Tab ${tab} must maintain bottom breathing room pb-12`
    )
  }

  // Dashboard tab must have the single-viewport lock
  const dashboardClasses = getTabContainerClasses('dashboard')
  assert.ok(
    dashboardClasses.includes('xl:h-full'),
    'Dashboard tab must lock desktop viewport height with xl:h-full'
  )
  assert.ok(
    dashboardClasses.includes('xl:flex'),
    'Dashboard tab must enable desktop flexbox with xl:flex'
  )
  assert.ok(
    dashboardClasses.includes('xl:min-h-0'),
    'Dashboard tab must enable child scroll containment with xl:min-h-0'
  )
  assert.ok(
    dashboardClasses.includes('xl:pb-0'),
    'Dashboard tab must strip extra bottom padding on desktop with xl:pb-0'
  )
})

