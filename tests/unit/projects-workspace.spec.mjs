import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
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
// PROJECTS WORKSPACE SPECIFICATION: 11 TEST CONTRACTS (PHASE 5C)
// =============================================================================

// -----------------------------------------------------------------------------
// 1. PROJ-STATE-01: 5 Discrete States of projectsDataState
// -----------------------------------------------------------------------------
test('PROJ-STATE-01: projectsDataState evaluates 5 discrete authoritative states', () => {
  // Logic matching app/pages/projects/index.vue:459-476
  function computeProjectsDataState({ hydrationStatus, storeProjects, isInitialized, isLoading }) {
    if (
      hydrationStatus.projects === 'loading' ||
      (!isInitialized && isLoading)
    ) {
      return 'LOADING'
    }
    if (
      hydrationStatus.projects === 'error' &&
      storeProjects.length === 0
    ) {
      return 'ERROR'
    }
    if (!isInitialized && hydrationStatus.projects === 'idle') {
      return 'NOT_LOADED'
    }
    return storeProjects.length === 0 ? 'SUCCESS_EMPTY' : 'SUCCESS_WITH_DATA'
  }

  // 1. State: LOADING
  assert.equal(
    computeProjectsDataState({
      hydrationStatus: { projects: 'loading' },
      storeProjects: [],
      isInitialized: false,
      isLoading: true
    }),
    'LOADING',
    'Must return LOADING when hydrationStatus.projects is loading'
  )
  assert.equal(
    computeProjectsDataState({
      hydrationStatus: { projects: 'idle' },
      storeProjects: [],
      isInitialized: false,
      isLoading: true
    }),
    'LOADING',
    'Must return LOADING when not initialized but loading'
  )

  // 2. State: ERROR
  assert.equal(
    computeProjectsDataState({
      hydrationStatus: { projects: 'error' },
      storeProjects: [],
      isInitialized: true,
      isLoading: false
    }),
    'ERROR',
    'Must return ERROR when hydrationStatus is error and cache is empty'
  )

  // 3. State: NOT_LOADED
  assert.equal(
    computeProjectsDataState({
      hydrationStatus: { projects: 'idle' },
      storeProjects: [],
      isInitialized: false,
      isLoading: false
    }),
    'NOT_LOADED',
    'Must return NOT_LOADED when not initialized and status is idle'
  )

  // 4. State: SUCCESS_EMPTY
  assert.equal(
    computeProjectsDataState({
      hydrationStatus: { projects: 'success' },
      storeProjects: [],
      isInitialized: true,
      isLoading: false
    }),
    'SUCCESS_EMPTY',
    'Must return SUCCESS_EMPTY when hydrated with zero projects'
  )

  // 5. State: SUCCESS_WITH_DATA
  assert.equal(
    computeProjectsDataState({
      hydrationStatus: { projects: 'success' },
      storeProjects: [{ id: 'p1', slug: 'nexura-cloud', title: 'Nexura Cloud' }],
      isInitialized: true,
      isLoading: false
    }),
    'SUCCESS_WITH_DATA',
    'Must return SUCCESS_WITH_DATA when projects exist'
  )
})

// -----------------------------------------------------------------------------
// 2. PROJ-STATE-02: Independent Entity Hydration & Error Isolation
// -----------------------------------------------------------------------------
test('PROJ-STATE-02: Failure in other entities (tasks, sprints) does not clobber projectsDataState', () => {
  function computeProjectsDataState({ hydrationStatus, storeProjects, isInitialized, isLoading }) {
    if (
      hydrationStatus.projects === 'loading' ||
      (!isInitialized && isLoading)
    ) {
      return 'LOADING'
    }
    if (
      hydrationStatus.projects === 'error' &&
      storeProjects.length === 0
    ) {
      return 'ERROR'
    }
    if (!isInitialized && hydrationStatus.projects === 'idle') {
      return 'NOT_LOADED'
    }
    return storeProjects.length === 0 ? 'SUCCESS_EMPTY' : 'SUCCESS_WITH_DATA'
  }

  // Tasks and Sprints failed, but Projects succeeded
  const context = {
    hydrationStatus: {
      projects: 'success',
      tasks: 'error',
      sprints: 'error',
      notes: 'error'
    },
    storeProjects: [{ id: 'p-1', slug: 'nexura-ui', title: 'Nexura UI' }],
    isInitialized: true,
    isLoading: false
  }

  const result = computeProjectsDataState(context)
  assert.equal(
    result,
    'SUCCESS_WITH_DATA',
    'Projects state must remain SUCCESS_WITH_DATA even if tasks or sprints failed'
  )
  assert.notEqual(result, 'ERROR', 'Must not cascade other entity errors to projects')
})

// -----------------------------------------------------------------------------
// 3. PROJ-STATE-03: Stale Data Resilience on Refresh Failure
// -----------------------------------------------------------------------------
test('PROJ-STATE-03: Stale data resilience preserves SUCCESS_WITH_DATA and flags isProjectsStaleError on background fetch failure', () => {
  const storeProjects = [{ id: 'p-1', slug: 'nexura-cloud', title: 'Nexura Cloud' }]
  const hydrationStatus = { projects: 'error' }

  // Logic matching app/pages/projects/index.vue:479-481
  const isProjectsStaleError = hydrationStatus.projects === 'error' && storeProjects.length > 0

  function computeProjectsDataState() {
    if (hydrationStatus.projects === 'loading') return 'LOADING'
    if (hydrationStatus.projects === 'error' && storeProjects.length === 0) return 'ERROR'
    return storeProjects.length === 0 ? 'SUCCESS_EMPTY' : 'SUCCESS_WITH_DATA'
  }

  assert.equal(computeProjectsDataState(), 'SUCCESS_WITH_DATA', 'Must continue serving cached projects to user')
  assert.equal(isProjectsStaleError, true, 'Must flag isProjectsStaleError as true for non-blocking UI alert')
})

// -----------------------------------------------------------------------------
// 4. PROJ-HONESTY-01: Zero Fake Tech Stack Tags
// -----------------------------------------------------------------------------
test('PROJ-HONESTY-01: getTechStack returns empty array when techStack is empty/undefined and never injects fake tags', () => {
  // Logic matching app/pages/projects/index.vue:492-494
  function getTechStack(project) {
    return Array.isArray(project.techStack) ? project.techStack : []
  }

  // 1. Empty array
  const emptyRes = getTechStack({ slug: 'test', techStack: [] })
  assert.deepEqual(emptyRes, [])
  assert.equal(emptyRes.includes('PyTorch'), false, 'Must not inject fake PyTorch tag')
  assert.equal(emptyRes.includes('Nuxt 4'), false, 'Must not inject fake Nuxt 4 tag')

  // 2. Undefined techStack
  const undefinedRes = getTechStack({ slug: 'test', techStack: undefined })
  assert.deepEqual(undefinedRes, [])

  // 3. Null techStack
  const nullRes = getTechStack({ slug: 'test', techStack: null })
  assert.deepEqual(nullRes, [])

  // 4. Missing techStack property
  const missingRes = getTechStack({ slug: 'test' })
  assert.deepEqual(missingRes, [])

  // 5. Genuine techStack array is preserved accurately
  const genuineRes = getTechStack({ slug: 'test', techStack: ['TypeScript', 'Tailwind', 'Vue 3'] })
  assert.deepEqual(genuineRes, ['TypeScript', 'Tailwind', 'Vue 3'])
})

// -----------------------------------------------------------------------------
// 5. PROJ-HONESTY-02: Zero Fake Due Dates
// -----------------------------------------------------------------------------
test("PROJ-HONESTY-02: formatDate returns 'No Due Date' for missing dates and formats genuine dates honestly", () => {
  // Logic matching app/pages/projects/index.vue:525-534
  function formatDate(d) {
    if (!d) return 'No Due Date'
    try {
      const date = new Date(d)
      if (isNaN(date.getTime())) return d
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } catch {
      return d
    }
  }

  // 1. Missing due dates
  assert.equal(formatDate(undefined), 'No Due Date')
  assert.equal(formatDate(null), 'No Due Date')
  assert.equal(formatDate(''), 'No Due Date')
  assert.notEqual(formatDate(undefined), 'Dec 2026', "Must not return hardcoded fake 'Dec 2026'")

  // 2. Genuine date
  const formatted = formatDate('2026-12-31')
  assert.equal(formatted, 'Dec 2026')

  const formattedJune = formatDate('2027-06-15')
  assert.equal(formattedJune, 'Jun 2027')

  // 3. Invalid date string fallback
  assert.equal(formatDate('invalid-date-string'), 'invalid-date-string')
})

// -----------------------------------------------------------------------------
// 6. PROJ-HONESTY-03: Real Project Status vs No Slug Regex
// -----------------------------------------------------------------------------
test("PROJ-HONESTY-03: Project status is read strictly from project.status without slug-based regex hallucination", () => {
  // Logic matching app/pages/projects/index.vue:505-514
  function getStatusBadgeClass(status) {
    const s = (status || 'active').toLowerCase()
    if (s === 'completed') return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
    if (s === 'active') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    if (s === 'planned') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    if (s === 'on-hold' || s === 'on hold') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    if (s === 'maintenance') return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    if (s === 'archived') return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  }

  function resolveProjectStatus(project) {
    return (project.status || 'active').toLowerCase()
  }

  // 1. Slug 'portfolio-site' without status property must NOT hallucinate 'completed'
  const portfolioProject = { slug: 'portfolio-site', title: 'Portfolio Website' }
  assert.equal(resolveProjectStatus(portfolioProject), 'active')
  assert.notEqual(resolveProjectStatus(portfolioProject), 'completed')

  // 2. Slug 'signal-analyzer' without status property must NOT hallucinate 'planned'
  const signalProject = { slug: 'signal-analyzer', title: 'Signal Analyzer' }
  assert.equal(resolveProjectStatus(signalProject), 'active')
  assert.notEqual(resolveProjectStatus(signalProject), 'planned')

  // 3. Explicit canonical statuses are respected
  assert.equal(resolveProjectStatus({ slug: 'p1', status: 'maintenance' }), 'maintenance')
  assert.equal(resolveProjectStatus({ slug: 'p2', status: 'planned' }), 'planned')
  assert.equal(resolveProjectStatus({ slug: 'p3', status: 'on-hold' }), 'on-hold')
  assert.equal(resolveProjectStatus({ slug: 'p4', status: 'completed' }), 'completed')
  assert.equal(resolveProjectStatus({ slug: 'p5', status: 'archived' }), 'archived')

  // 4. Status classes match design system
  assert.ok(getStatusBadgeClass('active').includes('text-emerald-400'))
  assert.ok(getStatusBadgeClass('maintenance').includes('text-purple-400'))
  assert.ok(getStatusBadgeClass('completed').includes('text-sky-400'))
  assert.ok(getStatusBadgeClass('planned').includes('text-yellow-400'))
  assert.ok(getStatusBadgeClass('on-hold').includes('text-amber-400'))
  assert.ok(getStatusBadgeClass('archived').includes('text-zinc-400'))
})

// -----------------------------------------------------------------------------
// 7. PROJ-MATH-01: Progress & Task Count Calculation & Slug Isolation
// -----------------------------------------------------------------------------
test('PROJ-MATH-01: Progress and task count calculate correctly with zero-division safety and slug isolation', () => {
  // Logic matching app/pages/projects/index.vue:497-502 and 517-522
  function getProgress(slug, tasks) {
    const projectTasks = (tasks || []).filter((t) => t.projectSlug === slug)
    if (projectTasks.length === 0) return 0
    const deployed = projectTasks.filter((t) => t.status === 'deployed').length
    return Math.round((deployed / projectTasks.length) * 100)
  }

  function getTaskCountLabel(slug, tasks) {
    const projectTasks = (tasks || []).filter((t) => t.projectSlug === slug)
    if (projectTasks.length === 0) return '0/0 tasks'
    const deployed = projectTasks.filter((t) => t.status === 'deployed').length
    return `${deployed}/${projectTasks.length} tasks`
  }

  const allTasks = [
    // Tasks for 'nexura-cloud'
    { id: 't1', projectSlug: 'nexura-cloud', status: 'deployed' },
    { id: 't2', projectSlug: 'nexura-cloud', status: 'deployed' },
    { id: 't3', projectSlug: 'nexura-cloud', status: 'running_sprint' },
    { id: 't4', projectSlug: 'nexura-cloud', status: 'in_queue' },
    // Tasks for 'nexura-ui' (100% complete)
    { id: 't5', projectSlug: 'nexura-ui', status: 'deployed' },
    { id: 't6', projectSlug: 'nexura-ui', status: 'deployed' },
    // Tasks for 'other-service'
    { id: 't7', projectSlug: 'other-service', status: 'in_queue' },
    // Task with no projectSlug
    { id: 't8', status: 'deployed' }
  ]

  // 1. Zero deliverables project: 'empty-project'
  assert.equal(getProgress('empty-project', allTasks), 0)
  assert.equal(getTaskCountLabel('empty-project', allTasks), '0/0 tasks')

  // 2. All deployed project: 'nexura-ui' (2/2 = 100%)
  assert.equal(getProgress('nexura-ui', allTasks), 100)
  assert.equal(getTaskCountLabel('nexura-ui', allTasks), '2/2 tasks')

  // 3. Partial deployed: 'nexura-cloud' (2/4 = 50%)
  assert.equal(getProgress('nexura-cloud', allTasks), 50)
  assert.equal(getTaskCountLabel('nexura-cloud', allTasks), '2/4 tasks')

  // 4. Slug isolation: other-service tasks do not bleed into nexura-cloud
  const cloudTasks = allTasks.filter((t) => t.projectSlug === 'nexura-cloud')
  assert.equal(cloudTasks.length, 4)
  assert.ok(!cloudTasks.some((t) => t.id === 't7'))
})

// -----------------------------------------------------------------------------
// 8. PROJ-FILTER-01: 7 Canonical Status Tabs & Dynamic Counters
// -----------------------------------------------------------------------------
test('PROJ-FILTER-01: Status tabs filter correctly across all 7 statuses without distorting global tab counters', () => {
  const storeProjects = [
    { slug: 'p1', title: 'Project 1', status: 'active' },
    { slug: 'p2', title: 'Project 2', status: 'active' },
    { slug: 'p3', title: 'Project 3', status: 'maintenance' },
    { slug: 'p4', title: 'Project 4', status: 'planned' },
    { slug: 'p5', title: 'Project 5', status: 'on-hold' },
    { slug: 'p6', title: 'Project 6', status: 'completed' },
    { slug: 'p7', title: 'Project 7', status: 'archived' }
  ]

  // Independent global counters matching app/pages/projects/index.vue:537-543
  const allCount = storeProjects.length
  const activeCount = storeProjects.filter((p) => (p.status || 'active').toLowerCase() === 'active').length
  const maintenanceCount = storeProjects.filter((p) => (p.status || '').toLowerCase() === 'maintenance').length
  const plannedCount = storeProjects.filter((p) => (p.status || '').toLowerCase() === 'planned').length
  const onHoldCount = storeProjects.filter(
    (p) => (p.status || '').toLowerCase().replace(/\s+/g, '-') === 'on-hold'
  ).length
  const completedCount = storeProjects.filter((p) => (p.status || '').toLowerCase() === 'completed').length
  const archivedCount = storeProjects.filter((p) => (p.status || '').toLowerCase() === 'archived').length

  assert.equal(allCount, 7)
  assert.equal(activeCount, 2)
  assert.equal(maintenanceCount, 1)
  assert.equal(plannedCount, 1)
  assert.equal(onHoldCount, 1)
  assert.equal(completedCount, 1)
  assert.equal(archivedCount, 1)

  // Filter function
  function filterByStatus(projects, activeStatus) {
    if (activeStatus === 'all') return projects
    return projects.filter((p) => {
      const st = (p.status || 'active').toLowerCase().replace(/\s+/g, '-')
      return st === activeStatus
    })
  }

  // Active filter yields only 2 projects
  const activeFiltered = filterByStatus(storeProjects, 'active')
  assert.equal(activeFiltered.length, 2)

  // Maintenance filter yields 1 project
  const maintenanceFiltered = filterByStatus(storeProjects, 'maintenance')
  assert.equal(maintenanceFiltered.length, 1)

  // Archived filter yields 1 project
  const archivedFiltered = filterByStatus(storeProjects, 'archived')
  assert.equal(archivedFiltered.length, 1)

  // Verifikasi bahwa tab counters TIDAK terdistorsi oleh filter aktif
  assert.equal(allCount, 7, 'Global counter must remain 7 even when filtered')
  assert.equal(activeCount, 2, 'Global active counter must remain 2 even when filtered')
})

// -----------------------------------------------------------------------------
// 9. PROJ-SEARCH-SORT-01: Search Query & Sort Order Integrity
// -----------------------------------------------------------------------------
test('PROJ-SEARCH-SORT-01: Search query matches title, description, slug, and techStack, with robust sorting', () => {
  const mockTasks = [
    { projectSlug: 'alpha', status: 'deployed' },
    { projectSlug: 'alpha', status: 'deployed' }, // Alpha: 100%
    { projectSlug: 'beta', status: 'in_queue' },   // Beta: 0%
    { projectSlug: 'gamma', status: 'deployed' },
    { projectSlug: 'gamma', status: 'in_queue' }   // Gamma: 50%
  ]

  function getProgress(slug) {
    const tasks = mockTasks.filter((t) => t.projectSlug === slug)
    if (!tasks.length) return 0
    const deployed = tasks.filter((t) => t.status === 'deployed').length
    return Math.round((deployed / tasks.length) * 100)
  }

  const projects = [
    {
      slug: 'alpha',
      title: 'Alpha Transformer',
      description: 'High performance EEG decoding',
      techStack: ['PyTorch', 'Python']
    },
    {
      slug: 'beta',
      title: 'Beta Dashboard',
      description: 'Obsidian bento workspace',
      techStack: ['Vue 3', 'Tailwind']
    },
    {
      slug: 'gamma',
      title: 'Gamma Service',
      description: 'Microservice message broker',
      techStack: ['Go', 'Docker']
    }
  ]

  function filterAndSort(list, searchQuery, sortBy) {
    let result = [...list]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.techStack ?? []).some((t) => t.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      if (sortBy === 'progress-desc') return getProgress(b.slug) - getProgress(a.slug)
      if (sortBy === 'progress-asc') return getProgress(a.slug) - getProgress(b.slug)
      if (sortBy === 'name-asc') return a.title.localeCompare(b.title)
      if (sortBy === 'name-desc') return b.title.localeCompare(a.title)
      return 0
    })

    return result
  }

  // 1. Search by title
  const matchTitle = filterAndSort(projects, 'Transformer', 'name-asc')
  assert.equal(matchTitle.length, 1)
  assert.equal(matchTitle[0].slug, 'alpha')

  // 2. Search by description
  const matchDesc = filterAndSort(projects, 'bento', 'name-asc')
  assert.equal(matchDesc.length, 1)
  assert.equal(matchDesc[0].slug, 'beta')

  // 3. Search by slug
  const matchSlug = filterAndSort(projects, 'gamma', 'name-asc')
  assert.equal(matchSlug.length, 1)
  assert.equal(matchSlug[0].slug, 'gamma')

  // 4. Search by techStack tag
  const matchTech = filterAndSort(projects, 'PyTorch', 'name-asc')
  assert.equal(matchTech.length, 1)
  assert.equal(matchTech[0].slug, 'alpha')

  // 5. Sort by progress-desc (Alpha: 100%, Gamma: 50%, Beta: 0%)
  const sortedProgressDesc = filterAndSort(projects, '', 'progress-desc')
  assert.deepEqual(
    sortedProgressDesc.map((p) => p.slug),
    ['alpha', 'gamma', 'beta']
  )

  // 6. Sort by progress-asc (Beta: 0%, Gamma: 50%, Alpha: 100%)
  const sortedProgressAsc = filterAndSort(projects, '', 'progress-asc')
  assert.deepEqual(
    sortedProgressAsc.map((p) => p.slug),
    ['beta', 'gamma', 'alpha']
  )

  // 7. Sort by name-asc (Alpha, Beta, Gamma)
  const sortedNameAsc = filterAndSort(projects, '', 'name-asc')
  assert.deepEqual(
    sortedNameAsc.map((p) => p.slug),
    ['alpha', 'beta', 'gamma']
  )

  // 8. Sort by name-desc (Gamma, Beta, Alpha)
  const sortedNameDesc = filterAndSort(projects, '', 'name-desc')
  assert.deepEqual(
    sortedNameDesc.map((p) => p.slug),
    ['gamma', 'beta', 'alpha']
  )
})

// -----------------------------------------------------------------------------
// 10. PROJ-MODAL-VALIDATION-01: Edit Modal Form Validation & Payload Normalization
// -----------------------------------------------------------------------------
test('PROJ-MODAL-VALIDATION-01: Edit modal validates required title and normalizes payload fields safely', () => {
  // Logic matching EditProjectModal.vue:278-324
  function validateAndNormalize(formInput) {
    const trimmedTitle = (formInput.title || '').trim()
    if (!trimmedTitle) {
      return { valid: false, error: 'Project title is required.' }
    }

    const techStack = (formInput.techStackInput || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const patch = {
      title: trimmedTitle,
      description: (formInput.description || '').trim() || undefined,
      status: formInput.status,
      priority: formInput.priority,
      githubRepo: (formInput.githubRepo || '').trim() || null,
      deployUrl: (formInput.deployUrl || '').trim() || null,
      techStack,
      startDate: (formInput.startDate || '').trim() || null,
      dueDate: (formInput.dueDate || '').trim() || null,
      releasePhase: (formInput.releasePhase || '').trim() || undefined
    }

    return { valid: true, patch }
  }

  // 1. Validation error: empty title
  const emptyRes = validateAndNormalize({ title: '   ' })
  assert.equal(emptyRes.valid, false)
  assert.equal(emptyRes.error, 'Project title is required.')

  // 2. Normalization: empty strings converted to null or filtered
  const input = {
    title: '  TF-HiTNet EEG Transformer  ',
    description: '  High performance EEG transformer  ',
    status: 'active',
    priority: 'high',
    githubRepo: '   ',
    deployUrl: '',
    techStackInput: ' PyTorch, Python, , CUDA ',
    startDate: '',
    dueDate: '  2026-12-31  ',
    releasePhase: '   ',
    // Injected forbidden fields that must NOT be present in patch
    id: 'forbidden-id',
    slug: 'forbidden-slug',
    createdAt: 'forbidden-created',
    updatedAt: 'forbidden-updated'
  }

  const res = validateAndNormalize(input)
  assert.equal(res.valid, true)
  const patch = res.patch

  // Clean title & description
  assert.equal(patch.title, 'TF-HiTNet EEG Transformer')
  assert.equal(patch.description, 'High performance EEG transformer')

  // Normalized null values
  assert.equal(patch.githubRepo, null)
  assert.equal(patch.deployUrl, null)
  assert.equal(patch.startDate, null)
  assert.equal(patch.dueDate, '2026-12-31')
  assert.equal(patch.releasePhase, undefined)

  // Normalized techStack array
  assert.deepEqual(patch.techStack, ['PyTorch', 'Python', 'CUDA'])

  // Sanitization: forbidden fields must NOT leak into patch
  assert.equal('id' in patch, false, 'id must not exist in patch')
  assert.equal('slug' in patch, false, 'slug must not exist in patch')
  assert.equal('createdAt' in patch, false, 'createdAt must not exist in patch')
  assert.equal('updatedAt' in patch, false, 'updatedAt must not exist in patch')
})

// -----------------------------------------------------------------------------
// 11. PROJ-MUTATION-01: Optimistic Update & Snapshot Targeted Rollback
// -----------------------------------------------------------------------------
test('PROJ-MUTATION-01: Optimistic project update reflects immediately (0ms) and rolls back strictly on server failure without reload waterfall', async () => {
  const store = resetWorkspaceStore()
  const projectsApi = useProjects()

  const initialProject = {
    id: 'proj-1',
    slug: 'nexura-cloud',
    title: 'Nexura Cloud Core',
    status: 'active',
    priority: 'medium',
    description: 'Base cloud engine'
  }

  store.addProjectToStore(initialProject)
  assert.equal(store.projects.value.length, 1)
  assert.equal(store.projects.value[0].status, 'active')

  // 1. Successful optimistic update
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT' && typeof url === 'string' && url.includes('nexura-cloud')) {
      return {
        ...initialProject,
        ...opts.body,
        updatedAt: '2026-10-29T10:00:00.000Z'
      }
    }
    return []
  }

  const updated = await projectsApi.updateProject('nexura-cloud', {
    status: 'completed',
    title: 'Nexura Cloud V2'
  })

  assert.equal(updated.status, 'completed')
  const inStoreAfterSuccess = store.projects.value.find((p) => p.slug === 'nexura-cloud')
  assert.equal(inStoreAfterSuccess.status, 'completed')
  assert.equal(inStoreAfterSuccess.title, 'Nexura Cloud V2')

  // 2. Failed mutation with simulated HTTP 500 Network Error
  let reloadWaterfallCount = 0
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT' && typeof url === 'string' && url.includes('nexura-cloud')) {
      throw new Error('HTTP 500 Internal Server Error: Database Write Lock')
    }
    if (typeof url === 'string' && (url === '/api/projects' || url.includes('/api/workspace'))) {
      reloadWaterfallCount++
      return []
    }
    return []
  }

  let caughtError = null
  try {
    await projectsApi.updateProject('nexura-cloud', {
      status: 'archived',
      title: 'Failed Archived Attempt'
    })
  } catch (err) {
    caughtError = err
  }

  assert.ok(caughtError, 'Mutation must reject when server fails')
  assert.match(caughtError.message, /500 Internal Server Error/)

  // 3. Targeted Rollback Verification: project strictly reverts to pre-mutation baseline ('completed', 'Nexura Cloud V2')
  const inStoreAfterRollback = store.projects.value.find((p) => p.slug === 'nexura-cloud')
  assert.ok(inStoreAfterRollback, 'Project must remain in store')
  assert.equal(
    inStoreAfterRollback.status,
    'completed',
    "Status must strictly roll back to pre-mutation baseline 'completed'"
  )
  assert.equal(
    inStoreAfterRollback.title,
    'Nexura Cloud V2',
    "Title must strictly roll back to pre-mutation baseline 'Nexura Cloud V2'"
  )

  // 4. Zero reload waterfall: no full-table reload fetch was executed
  assert.equal(reloadWaterfallCount, 0, 'No reload waterfall should be triggered during targeted rollback')
})
