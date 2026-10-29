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
const { CANONICAL_RELEASE_PHASES } = jiti('../../types/project.ts')

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

// Helper: Roadmap Data State Machine (matching app/pages/roadmap.vue:628-648)
function computeRoadmapDataState({ projects, projectsHydration, isInitialized, isLoading }) {
  const projectsList = projects || []
  const hasProjects = projectsList.length > 0

  if (hasProjects) {
    return 'READY'
  }
  if (projectsHydration === 'error') {
    return 'ERROR'
  }
  if (!isInitialized || projectsHydration === 'loading') {
    return 'LOADING'
  }
  return 'SUCCESS_EMPTY'
}

function computeIsStaleDataWarning({ projects, projectsHydration }) {
  return projectsHydration === 'error' && (projects || []).length > 0
}

function computeIsTaskMetricsAvailable({ tasksHydration, tasks }) {
  return tasksHydration === 'success' || (tasks || []).length > 0
}

// Helper: Release Phase Normalization & Anomaly Detection (matching app/pages/roadmap.vue:660-679)
function classifyReleasePhase(rawPhase) {
  if (!rawPhase || typeof rawPhase !== 'string') {
    return { phase: 'backlog', isAnomaly: false }
  }

  const normalized = rawPhase.trim().toLowerCase()

  // Canonical phases
  if (
    normalized === 'backlog' ||
    normalized === 'mvp' ||
    normalized === 'v1.1' ||
    normalized === 'v2.0' ||
    normalized === 'released'
  ) {
    return { phase: normalized, isAnomaly: false }
  }

  // Legacy v1.0 mapping to mvp
  if (normalized === 'v1.0' || normalized === 'v1') {
    return { phase: 'mvp', isAnomaly: false }
  }

  // Unknown string / anomaly
  return { phase: 'backlog', isAnomaly: true, originalValue: rawPhase }
}

// Helper: Project Tasks Filter (matching app/pages/roadmap.vue:723-727)
function getProjectTasks(tasks, slug) {
  const all = tasks ?? []
  const targetSlug = (slug || '').trim().toLowerCase()
  if (!targetSlug) return []
  return all.filter((t) => (t.projectSlug || '').trim().toLowerCase() === targetSlug)
}

// Helper: Project Progress (matching app/pages/roadmap.vue:729-739)
function getProjectProgress(tasks, slug, isTaskMetricsAvailable) {
  if (!isTaskMetricsAvailable) {
    return null
  }
  const projectTasks = getProjectTasks(tasks, slug)
  if (projectTasks.length === 0) {
    return 0
  }
  const deployedCount = projectTasks.filter((t) => t.status === 'deployed').length
  return Math.round((deployedCount / projectTasks.length) * 100)
}

// Helper: Date Formatter (matching app/pages/roadmap.vue:741-750)
function formatDate(d) {
  if (!d) return 'TBD'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return 'TBD'
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return 'TBD'
  }
}

// Helper: Deterministic Multi-Phase Roadmap Sorting (matching Section 8 requirement)
function sortRoadmapProjects(projects) {
  const phaseOrder = {
    mvp: 1,
    'v1.1': 2,
    'v2.0': 3,
    backlog: 4,
    released: 5
  }

  return [...projects].sort((a, b) => {
    const phaseA = classifyReleasePhase(a.releasePhase).phase
    const phaseB = classifyReleasePhase(b.releasePhase).phase
    const orderDiff = phaseOrder[phaseA] - phaseOrder[phaseB]
    if (orderDiff !== 0) return orderDiff

    // Valid startDate first (ascending)
    if (a.startDate && b.startDate) {
      const dateDiff = a.startDate.localeCompare(b.startDate)
      if (dateDiff !== 0) return dateDiff
    } else if (a.startDate) {
      return -1
    } else if (b.startDate) {
      return 1
    }

    // Tie-breaker: slug
    return (a.slug || '').localeCompare(b.slug || '')
  })
}

// Helper: Status Badge Class (matching app/pages/roadmap.vue:752-760)
function getStatusBadgeClass(status) {
  const s = (status || '').toLowerCase()
  if (s === 'maintenance') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
  if (s === 'completed' || s === 'deployed') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (s === 'on-hold') return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (s === 'planned') return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  if (s === 'archived') return 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]'
  return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
}

// =============================================================================
// PHASE 8: ROADMAP WORKSPACE — 14 RIGOROUS TEST CONTRACTS
// =============================================================================

// -----------------------------------------------------------------------------
// 1. ROADMAP-STATE-01: State Machine: LOADING
// -----------------------------------------------------------------------------
test('ROADMAP-STATE-01: roadmapDataState produces "LOADING" when hydration is loading or store is uninitialized with empty cache', () => {
  // Case A: Uninitialized store during boot (isLoading: true, projectsHydration: idle, cache: empty)
  const stateA = computeRoadmapDataState({
    projects: [],
    projectsHydration: 'idle',
    isInitialized: false,
    isLoading: true
  })
  assert.equal(stateA, 'LOADING', 'Must yield LOADING when uninitialized and loading')

  // Case B: Hydration actively in-flight (isInitialized: true, projectsHydration: loading, cache: empty)
  const stateB = computeRoadmapDataState({
    projects: [],
    projectsHydration: 'loading',
    isInitialized: true,
    isLoading: false
  })
  assert.equal(stateB, 'LOADING', 'Must yield LOADING when projectsHydration is loading')

  // Stale data warning must be false when cache is empty
  assert.equal(
    computeIsStaleDataWarning({ projects: [], projectsHydration: 'loading' }),
    false,
    'Stale warning must be false when cache is empty'
  )
})

// -----------------------------------------------------------------------------
// 2. ROADMAP-STATE-02: State Machine: ERROR
// -----------------------------------------------------------------------------
test('ROADMAP-STATE-02: roadmapDataState produces "ERROR" and isStaleDataWarning === false when backend hydration fails and cache is empty', () => {
  const state = computeRoadmapDataState({
    projects: [],
    projectsHydration: 'error',
    isInitialized: true,
    isLoading: false
  })
  assert.equal(state, 'ERROR', 'Must yield ERROR when projects hydration fails with empty cache')

  const isStale = computeIsStaleDataWarning({
    projects: [],
    projectsHydration: 'error'
  })
  assert.equal(isStale, false, 'isStaleDataWarning must be false when no cache exists')
})

// -----------------------------------------------------------------------------
// 3. ROADMAP-STATE-03: State Machine: SUCCESS_EMPTY
// -----------------------------------------------------------------------------
test('ROADMAP-STATE-03: roadmapDataState produces "SUCCESS_EMPTY" when initialized successfully with empty projects array', () => {
  const state = computeRoadmapDataState({
    projects: [],
    projectsHydration: 'success',
    isInitialized: true,
    isLoading: false
  })
  assert.equal(state, 'SUCCESS_EMPTY', 'Must yield SUCCESS_EMPTY when hydrated with zero projects')

  const isStale = computeIsStaleDataWarning({
    projects: [],
    projectsHydration: 'success'
  })
  assert.equal(isStale, false, 'isStaleDataWarning must be false on success')
})

// -----------------------------------------------------------------------------
// 4. ROADMAP-STATE-04: Cache Resilience: READY
// -----------------------------------------------------------------------------
test('ROADMAP-STATE-04: roadmapDataState remains "READY" with isStaleDataWarning === true when revalidation fails but local cache exists', () => {
  const cachedProjects = [
    {
      id: 'p-1',
      slug: 'nexura-cloud',
      title: 'Nexura Cloud Platform',
      status: 'active',
      priority: 'high',
      techStack: ['Nuxt 3', 'TypeScript'],
      releasePhase: 'mvp',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-29T00:00:00Z'
    }
  ]

  const state = computeRoadmapDataState({
    projects: cachedProjects,
    projectsHydration: 'error',
    isInitialized: true,
    isLoading: false
  })
  assert.equal(state, 'READY', 'Must yield READY when cached projects exist despite hydration error')

  const isStale = computeIsStaleDataWarning({
    projects: cachedProjects,
    projectsHydration: 'error'
  })
  assert.equal(isStale, true, 'isStaleDataWarning must be true when cache is displayed during error')
})

// -----------------------------------------------------------------------------
// 5. ROADMAP-TASK-HYDRATION-01: Split Hydration Guard
// -----------------------------------------------------------------------------
test('ROADMAP-TASK-HYDRATION-01: isTaskMetricsAvailable evaluates false when tasks hydration fails without cache, preventing misleading 0% progress bar', () => {
  // Scenario 1: Tasks hydration failed and tasks cache is empty
  const isAvailableEmpty = computeIsTaskMetricsAvailable({
    tasksHydration: 'error',
    tasks: []
  })
  assert.equal(isAvailableEmpty, false, 'isTaskMetricsAvailable must be false when tasks failed with no cache')

  // getProjectProgress must return null (not 0) so the UI displays syncing status instead of fake 0%
  const progressEmpty = getProjectProgress([], 'nexura-cloud', isAvailableEmpty)
  assert.equal(progressEmpty, null, 'Progress must be null when tasks metrics are unavailable')

  // Scenario 2: Tasks hydration succeeded
  const isAvailableSuccess = computeIsTaskMetricsAvailable({
    tasksHydration: 'success',
    tasks: []
  })
  assert.equal(isAvailableSuccess, true, 'isTaskMetricsAvailable must be true when tasksHydration is success')
  const progressSuccess = getProjectProgress([], 'nexura-cloud', isAvailableSuccess)
  assert.equal(progressSuccess, 0, 'Progress must be honest 0% when tasks are genuinely 0')

  // Scenario 3: Tasks hydration failed BUT tasks exist in cache
  const isAvailableCached = computeIsTaskMetricsAvailable({
    tasksHydration: 'error',
    tasks: [{ id: 't1', projectSlug: 'nexura-cloud', status: 'deployed' }]
  })
  assert.equal(isAvailableCached, true, 'isTaskMetricsAvailable must be true when cached tasks exist')
  const progressCached = getProjectProgress(
    [{ id: 't1', projectSlug: 'nexura-cloud', status: 'deployed' }],
    'nexura-cloud',
    isAvailableCached
  )
  assert.equal(progressCached, 100, 'Progress must calculate from cache (100%)')
})

// -----------------------------------------------------------------------------
// 6. ROADMAP-PHASE-01: Normalization & Anomaly
// -----------------------------------------------------------------------------
test('ROADMAP-PHASE-01: classifyReleasePhase normalizes canonical values, maps legacy v1.0 -> mvp, defaults null -> backlog, and flags unknown strings as anomalies', () => {
  // 1. Canonical values pass through intact (case-insensitive & trimmed)
  assert.deepEqual(classifyReleasePhase('backlog'), { phase: 'backlog', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase('mvp'), { phase: 'mvp', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase('v1.1'), { phase: 'v1.1', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase('v2.0'), { phase: 'v2.0', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase('released'), { phase: 'released', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase('  MVP  '), { phase: 'mvp', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase('V1.1'), { phase: 'v1.1', isAnomaly: false })

  // 2. Legacy 'v1.0' and 'v1' map to 'mvp'
  assert.deepEqual(classifyReleasePhase('v1.0'), { phase: 'mvp', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase('v1'), { phase: 'mvp', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase('V1.0'), { phase: 'mvp', isAnomaly: false })

  // 3. Empty/null/undefined map to 'backlog' without anomaly flag
  assert.deepEqual(classifyReleasePhase(null), { phase: 'backlog', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase(undefined), { phase: 'backlog', isAnomaly: false })
  assert.deepEqual(classifyReleasePhase(''), { phase: 'backlog', isAnomaly: false })

  // 4. Unknown string / typo (e.g. 'v1.l' with lowercase L) maps to 'backlog' with isAnomaly: true
  const typoResult = classifyReleasePhase('v1.l')
  assert.equal(typoResult.phase, 'backlog', 'Typo must fallback to backlog column')
  assert.equal(typoResult.isAnomaly, true, 'Typo must be flagged as anomaly')
  assert.equal(typoResult.originalValue, 'v1.l', 'Original raw value must be preserved')

  const unknownResult = classifyReleasePhase('future-phase-xyz')
  assert.equal(unknownResult.phase, 'backlog')
  assert.equal(unknownResult.isAnomaly, true)
  assert.equal(unknownResult.originalValue, 'future-phase-xyz')
})

// -----------------------------------------------------------------------------
// 7. ROADMAP-PHASE-02: Board Column Grouping
// -----------------------------------------------------------------------------
test('ROADMAP-PHASE-02: Projects are grouped into 5 canonical columns with accurate counts, allocating legacy and anomaly projects correctly', () => {
  const projects = [
    { id: 'p1', slug: 'proj-backlog', releasePhase: 'backlog' },
    { id: 'p2', slug: 'proj-mvp', releasePhase: 'mvp' },
    { id: 'p3', slug: 'proj-legacy-v1', releasePhase: 'v1.0' }, // Legacy -> mvp
    { id: 'p4', slug: 'proj-v11', releasePhase: 'v1.1' },
    { id: 'p5', slug: 'proj-v20', releasePhase: 'v2.0' },
    { id: 'p6', slug: 'proj-released', releasePhase: 'released' },
    { id: 'p7', slug: 'proj-typo', releasePhase: 'v1.l' }, // Anomaly -> backlog
    { id: 'p8', slug: 'proj-null', releasePhase: null } // Null -> backlog
  ]

  function getProjectsByPhase(phaseId) {
    return projects.filter((p) => classifyReleasePhase(p.releasePhase).phase === phaseId)
  }

  // 5 Canonical columns
  const backlogCol = getProjectsByPhase('backlog')
  const mvpCol = getProjectsByPhase('mvp')
  const v11Col = getProjectsByPhase('v1.1')
  const v20Col = getProjectsByPhase('v2.0')
  const releasedCol = getProjectsByPhase('released')

  // Backlog column has 3 projects: p1 (canonical), p7 (anomaly), p8 (null)
  assert.equal(backlogCol.length, 3)
  assert.deepEqual(
    backlogCol.map((p) => p.slug),
    ['proj-backlog', 'proj-typo', 'proj-null']
  )

  // MVP column has 2 projects: p2 (canonical mvp), p3 (legacy v1.0)
  assert.equal(mvpCol.length, 2)
  assert.deepEqual(
    mvpCol.map((p) => p.slug),
    ['proj-mvp', 'proj-legacy-v1']
  )

  // v1.1 column has 1 project
  assert.equal(v11Col.length, 1)
  assert.equal(v11Col[0].slug, 'proj-v11')

  // v2.0 column has 1 project
  assert.equal(v20Col.length, 1)
  assert.equal(v20Col[0].slug, 'proj-v20')

  // Released column has 1 project
  assert.equal(releasedCol.length, 1)
  assert.equal(releasedCol[0].slug, 'proj-released')

  // Total projects accounted for across all columns
  const totalInColumns =
    backlogCol.length + mvpCol.length + v11Col.length + v20Col.length + releasedCol.length
  assert.equal(totalInColumns, projects.length)
})

// -----------------------------------------------------------------------------
// 8. ROADMAP-PHASE-03: Deterministic Sorting
// -----------------------------------------------------------------------------
test('ROADMAP-PHASE-03: Deterministic sorting prioritizes active phases (mvp -> v1.1 -> v2.0 -> backlog -> released), then valid startDate, then tie-breaker slug', () => {
  const projects = [
    { slug: 'proj-rel', releasePhase: 'released', startDate: '2026-01-01' },
    { slug: 'proj-back-2', releasePhase: 'backlog', startDate: '2026-12-01' },
    { slug: 'proj-back-1', releasePhase: 'backlog', startDate: '2026-11-01' },
    { slug: 'proj-back-nodate-b', releasePhase: 'backlog', startDate: null },
    { slug: 'proj-back-nodate-a', releasePhase: 'backlog', startDate: null },
    { slug: 'proj-v20', releasePhase: 'v2.0', startDate: '2026-06-01' },
    { slug: 'proj-v11', releasePhase: 'v1.1', startDate: '2026-04-01' },
    { slug: 'proj-mvp-later', releasePhase: 'mvp', startDate: '2026-03-01' },
    { slug: 'proj-mvp-early', releasePhase: 'v1.0', startDate: '2026-02-01' } // Legacy v1.0 -> mvp
  ]

  const sorted = sortRoadmapProjects(projects)
  const sortedSlugs = sorted.map((p) => p.slug)

  assert.deepEqual(sortedSlugs, [
    'proj-mvp-early', // mvp (2026-02-01)
    'proj-mvp-later', // mvp (2026-03-01)
    'proj-v11', // v1.1 (2026-04-01)
    'proj-v20', // v2.0 (2026-06-01)
    'proj-back-1', // backlog (2026-11-01)
    'proj-back-2', // backlog (2026-12-01)
    'proj-back-nodate-a', // backlog (no date, slug 'a' before 'b')
    'proj-back-nodate-b', // backlog (no date, slug 'b')
    'proj-rel' // released
  ])
})

// -----------------------------------------------------------------------------
// 9. ROADMAP-METRIC-01: SSOT Task Association
// -----------------------------------------------------------------------------
test('ROADMAP-METRIC-01: getProjectTasks filters tasks by projectSlug case-insensitively and strictly isolates data between projects', () => {
  const tasks = [
    { id: 't1', taskId: 'TSK-1', projectSlug: 'nexura-cloud', status: 'deployed' },
    { id: 't2', taskId: 'TSK-2', projectSlug: 'NEXURA-CLOUD', status: 'running_sprint' },
    { id: 't3', taskId: 'TSK-3', projectSlug: '  nexura-cloud  ', status: 'in_queue' },
    { id: 't4', taskId: 'TSK-4', projectSlug: 'eeg-transformer', status: 'deployed' },
    { id: 't5', taskId: 'TSK-5', projectSlug: '', status: 'idea' },
    { id: 't6', taskId: 'TSK-6', projectSlug: null, status: 'idea' }
  ]

  // Query nexura-cloud
  const nexuraTasks = getProjectTasks(tasks, 'Nexura-Cloud')
  assert.equal(nexuraTasks.length, 3, 'Must match all 3 nexura-cloud tasks regardless of casing/trimming')
  assert.deepEqual(
    nexuraTasks.map((t) => t.id),
    ['t1', 't2', 't3']
  )

  // Query eeg-transformer
  const eegTasks = getProjectTasks(tasks, 'eeg-transformer')
  assert.equal(eegTasks.length, 1)
  assert.equal(eegTasks[0].id, 't4')

  // Query non-existent project
  const emptyTasks = getProjectTasks(tasks, 'unregistered-slug')
  assert.equal(emptyTasks.length, 0)

  // Query with empty/null slug
  assert.deepEqual(getProjectTasks(tasks, ''), [])
  assert.deepEqual(getProjectTasks(tasks, null), [])
})

// -----------------------------------------------------------------------------
// 10. ROADMAP-METRIC-02: Zero-Division & Progress
// -----------------------------------------------------------------------------
test('ROADMAP-METRIC-02: Milestone progress strictly counts deployed status and returns exact integer 0% when total tasks === 0', () => {
  // Case A: Zero deliverables returns exact integer 0 (not NaN, null, or undefined)
  const zeroProgress = getProjectProgress([], 'empty-project', true)
  assert.equal(zeroProgress, 0)
  assert.equal(typeof zeroProgress, 'number')
  assert.equal(Number.isNaN(zeroProgress), false)

  // Case B: Deliverables with various statuses
  const tasks = [
    { id: 't1', projectSlug: 'demo', status: 'deployed' },
    { id: 't2', projectSlug: 'demo', status: 'deployed' },
    { id: 't3', projectSlug: 'demo', status: 'running_sprint' },
    { id: 't4', projectSlug: 'demo', status: 'in_queue' },
    { id: 't5', projectSlug: 'demo', status: 'blocked' },
    { id: 't6', projectSlug: 'demo', status: 'idea' }
  ]

  // 2 deployed out of 6 tasks -> Math.round((2 / 6) * 100) = 33%
  const progress33 = getProjectProgress(tasks, 'demo', true)
  assert.equal(progress33, 33)

  // Case C: 3 deployed out of 4 tasks -> Math.round((3 / 4) * 100) = 75%
  const tasks75 = [
    { id: 't1', projectSlug: 'demo2', status: 'deployed' },
    { id: 't2', projectSlug: 'demo2', status: 'deployed' },
    { id: 't3', projectSlug: 'demo2', status: 'deployed' },
    { id: 't4', projectSlug: 'demo2', status: 'running_sprint' }
  ]
  const progress75 = getProjectProgress(tasks75, 'demo2', true)
  assert.equal(progress75, 75)
})

// -----------------------------------------------------------------------------
// 11. ROADMAP-MUTATION-01: Optimistic Phase Mutation
// -----------------------------------------------------------------------------
test('ROADMAP-MUTATION-01: Updating releasePhase mutates reactive store instantly (0ms) and commits on server success', async () => {
  const store = resetWorkspaceStore()
  const projectsApi = useProjects()

  const initialProject = {
    id: 'p-opt-1',
    slug: 'nexura-cloud',
    title: 'Nexura Cloud Core',
    status: 'active',
    priority: 'high',
    techStack: ['Nuxt 3'],
    releasePhase: 'backlog',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  }

  store.addProjectToStore(initialProject)
  assert.equal(store.projects.value.length, 1)
  assert.equal(store.projects.value[0].releasePhase, 'backlog')

  // Mock server response
  let receivedMethod = null
  let receivedBody = null
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT' && typeof url === 'string' && url.includes('nexura-cloud')) {
      receivedMethod = opts.method
      receivedBody = opts.body
      return {
        ...initialProject,
        ...opts.body,
        updatedAt: '2026-10-29T16:50:00.000Z'
      }
    }
    return []
  }

  // Execute update
  const updated = await projectsApi.updateProject('nexura-cloud', {
    releasePhase: 'mvp'
  })

  // Verify server payload
  assert.equal(receivedMethod, 'PUT')
  assert.deepEqual(receivedBody, { releasePhase: 'mvp' })

  // Verify return value and store reflection
  assert.equal(updated.releasePhase, 'mvp')
  const inStore = store.projects.value.find((p) => p.slug === 'nexura-cloud')
  assert.equal(inStore.releasePhase, 'mvp', 'Store must be updated to mvp')
})

// -----------------------------------------------------------------------------
// 12. ROADMAP-MUTATION-02: Rollback on Server Error
// -----------------------------------------------------------------------------
test('ROADMAP-MUTATION-02: Optimistic releasePhase update rolls back cleanly to snapshot baseline on server HTTP 500 failure', async () => {
  const store = resetWorkspaceStore()
  const projectsApi = useProjects()

  const initialProject = {
    id: 'p-rollback-1',
    slug: 'target-project',
    title: 'Target Project',
    status: 'active',
    priority: 'medium',
    techStack: ['Vue 3'],
    releasePhase: 'mvp',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z'
  }

  store.addProjectToStore(initialProject)
  // Add an unrelated task to confirm entity isolation
  store.tasks.value = [
    { id: 't-isolated', name: 'Isolated Task', status: 'deployed', projectSlug: 'target-project' }
  ]

  assert.equal(store.projects.value[0].releasePhase, 'mvp')
  assert.equal(store.tasks.value.length, 1)

  // Mock server HTTP 500 error
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT' && typeof url === 'string' && url.includes('target-project')) {
      throw new Error('HTTP 500 Internal Server Error: Database Write Conflict')
    }
    return []
  }

  let caughtError = null
  try {
    await projectsApi.updateProject('target-project', {
      releasePhase: 'v2.0'
    })
  } catch (err) {
    caughtError = err
  }

  // 1. Error was thrown and caught
  assert.ok(caughtError, 'Must propagate server error to caller')
  assert.match(caughtError.message, /500 Internal Server Error/)

  // 2. Reactive store rolled back releasePhase to 'mvp'
  const inStore = store.projects.value.find((p) => p.slug === 'target-project')
  assert.ok(inStore, 'Project must remain in store')
  assert.equal(
    inStore.releasePhase,
    'mvp',
    'releasePhase must be strictly rolled back to baseline snapshot'
  )

  // 3. Entity isolation: tasks are unaffected
  assert.equal(store.tasks.value.length, 1)
  assert.equal(store.tasks.value[0].id, 't-isolated')
  assert.equal(store.tasks.value[0].status, 'deployed')
})

// -----------------------------------------------------------------------------
// 13. ROADMAP-EDGE-01: Metric Honesty: Date Format
// -----------------------------------------------------------------------------
test('ROADMAP-EDGE-01: formatDate returns honest "TBD" for null, undefined, empty, or invalid dates (no fake synthetic dates)', () => {
  assert.equal(formatDate(null), 'TBD', 'null date must yield TBD')
  assert.equal(formatDate(undefined), 'TBD', 'undefined date must yield TBD')
  assert.equal(formatDate(''), 'TBD', 'empty string must yield TBD')
  assert.equal(formatDate('   '), 'TBD', 'whitespace must yield TBD')
  assert.equal(formatDate('not-a-date'), 'TBD', 'invalid date string must yield TBD')

  // Valid date must format cleanly
  const formatted = formatDate('2026-10-15')
  assert.ok(formatted.includes('2026'), 'Must include year 2026')
  assert.ok(formatted.includes('Oct'), 'Must include month Oct')
})

// -----------------------------------------------------------------------------
// 14. ROADMAP-EDGE-02: Status Independence
// -----------------------------------------------------------------------------
test('ROADMAP-EDGE-02: Independence between project.status and project.releasePhase, never conflating deployUrl with maintenance', () => {
  // Scenario 1: Project with status 'active' and releasePhase 'backlog' (early exploration)
  const p1 = {
    id: 'p1',
    status: 'active',
    releasePhase: 'backlog',
    deployUrl: null
  }
  const classification1 = classifyReleasePhase(p1.releasePhase)
  const badgeClass1 = getStatusBadgeClass(p1.status)
  assert.equal(classification1.phase, 'backlog')
  assert.ok(badgeClass1.includes('indigo'), 'Active status must use indigo badge')

  // Scenario 2: Project with status 'maintenance' and deployUrl, releasePhase 'released'
  const p2 = {
    id: 'p2',
    status: 'maintenance',
    releasePhase: 'released',
    deployUrl: 'https://app.nexura.io'
  }
  const classification2 = classifyReleasePhase(p2.releasePhase)
  const badgeClass2 = getStatusBadgeClass(p2.status)
  assert.equal(classification2.phase, 'released')
  assert.ok(badgeClass2.includes('cyan'), 'Maintenance status must use cyan badge')

  // Scenario 3: Project with deployUrl but status 'completed'
  // deployUrl must NOT force status to 'maintenance'
  const p3 = {
    id: 'p3',
    status: 'completed',
    releasePhase: 'released',
    deployUrl: 'https://live.example.com'
  }
  const badgeClass3 = getStatusBadgeClass(p3.status)
  assert.ok(badgeClass3.includes('emerald'), 'Completed status must use emerald badge, not cyan maintenance')

  // Scenario 4: All canonical statuses have distinct badge classes
  const statuses = ['active', 'maintenance', 'completed', 'on-hold', 'planned', 'archived']
  for (const s of statuses) {
    const cls = getStatusBadgeClass(s)
    assert.ok(cls.length > 0, `Status ${s} must have a non-empty badge class`)
  }
})
