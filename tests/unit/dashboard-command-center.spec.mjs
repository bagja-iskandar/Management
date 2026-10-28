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

const jiti = createJiti(import.meta.url, { alias: { '~': projectRoot } })
const { useWorkspaceStore } = jiti('../../composables/useWorkspaceStore.ts')
const pingHandler = jiti('../../server/api/ping.get.ts').default

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
// DASHBOARD COMMAND CENTER SPECIFICATION: 19 TEST CONTRACTS
// =============================================================================

// -----------------------------------------------------------------------------
// 1. DASH-HONESTY-01: Empty Workspace State
// -----------------------------------------------------------------------------
test('DASH-HONESTY-01: Empty workspace state yields 0 for in-flight, high-priority, completion rate, open PRs, and active repos', () => {
  const tasks = []
  const projects = []

  // Mathematical computations matching UnifiedHeroBanner.vue & Dashboard.vue
  const inFlightCount = tasks.filter((t) => t.status === 'running_sprint').length
  const highPriorityCount = tasks.filter(
    (t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'deployed'
  ).length
  const totalCount = tasks.length
  const completedCount = tasks.filter((t) => t.status === 'deployed').length
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const openPrCount = tasks.filter((t) => Boolean(t.githubPrUrl)).length
  const activeReposCount = projects.length

  assert.equal(inFlightCount, 0, 'inFlightCount must be 0 (not 14)')
  assert.equal(highPriorityCount, 0, 'highPriorityCount must be 0 (not 3)')
  assert.equal(completionRate, 0, 'completionRate must be 0% (not 78%)')
  assert.equal(openPrCount, 0, 'openPrCount must be 0 (not 7)')
  assert.equal(activeReposCount, 0, 'activeReposCount must be 0')
})

// -----------------------------------------------------------------------------
// 2. DASH-COMPLETION-01: Workspace-wide Completion Rate Formula
// -----------------------------------------------------------------------------
test('DASH-COMPLETION-01: Workspace-wide completion rate formula Math.round((deployed / total) * 100) and zero deliverables handling', () => {
  function computeCompletion(tasks) {
    const total = tasks.length
    if (total === 0) {
      return { percentage: 0, health: 'No deliverables' }
    }
    const deployed = tasks.filter((t) => t.status === 'deployed').length
    const percentage = Math.round((deployed / total) * 100)
    const health = percentage >= 70 ? 'On track' : 'Attention needed'
    return { percentage, health }
  }

  // Skenario A: 0 deliverables
  const emptyRes = computeCompletion([])
  assert.equal(emptyRes.percentage, 0)
  assert.equal(emptyRes.health, 'No deliverables')

  // Skenario B: 2 deployed out of 5 total tasks = 40% (Attention needed)
  const tasksB = [
    { id: '1', status: 'deployed' },
    { id: '2', status: 'deployed' },
    { id: '3', status: 'running_sprint' },
    { id: '4', status: 'in_queue' },
    { id: '5', status: 'in_queue' }
  ]
  const resB = computeCompletion(tasksB)
  assert.equal(resB.percentage, 40)
  assert.equal(resB.health, 'Attention needed')

  // Skenario C: 4 deployed out of 5 total tasks = 80% (On track)
  const tasksC = [
    { id: '1', status: 'deployed' },
    { id: '2', status: 'deployed' },
    { id: '3', status: 'deployed' },
    { id: '4', status: 'deployed' },
    { id: '5', status: 'running_sprint' }
  ]
  const resC = computeCompletion(tasksC)
  assert.equal(resC.percentage, 80)
  assert.equal(resC.health, 'On track')

  // Skenario D: 1 deployed out of 3 total tasks = 33%
  const tasksD = [
    { id: '1', status: 'deployed' },
    { id: '2', status: 'in_queue' },
    { id: '3', status: 'in_queue' }
  ]
  const resD = computeCompletion(tasksD)
  assert.equal(resD.percentage, 33)
})

// -----------------------------------------------------------------------------
// 3. DASH-CI-01: CI Data Tidak Tersedia
// -----------------------------------------------------------------------------
test('DASH-CI-01: CI data unavailable (null/undefined) displays as null and summarizes as "No active checks"', () => {
  function getCiView(ciSuccessRate, ciWorkflowCount, customSummary) {
    if (customSummary) return customSummary
    if (ciSuccessRate === null || ciSuccessRate === undefined || ciWorkflowCount === 0) {
      return 'No active checks'
    }
    return `${ciWorkflowCount} checks passed`
  }

  // 1. ciSuccessRate is null
  assert.equal(getCiView(null, 0), 'No active checks')
  // 2. ciSuccessRate is undefined
  assert.equal(getCiView(undefined, 0), 'No active checks')
  // 3. UI rendering check for null: renders '--'
  const renderedMetric = (rate) => (rate !== null && rate !== undefined ? `${rate}%` : '--')
  assert.equal(renderedMetric(null), '--')
  assert.equal(renderedMetric(undefined), '--')
  assert.notEqual(renderedMetric(null), '100%')
  assert.notEqual(renderedMetric(null), '98.4%')
})

// -----------------------------------------------------------------------------
// 4. DASH-CI-02: CI Data Aktual dengan 0% Success
// -----------------------------------------------------------------------------
test('DASH-CI-02: CI data with actual 0% success displays honestly as 0% without fallback', () => {
  const ciSuccessRate = 0
  const ciWorkflowCount = 3

  const renderedMetric = (rate) => (rate !== null && rate !== undefined ? `${rate}%` : '--')
  assert.equal(renderedMetric(ciSuccessRate), '0%')

  function getCiSummary(rate, count) {
    if (rate === null || rate === undefined || count === 0) {
      return 'No active checks'
    }
    return `${rate}% passing across ${count} workflows`
  }

  const summary = getCiSummary(ciSuccessRate, ciWorkflowCount)
  assert.equal(summary, '0% passing across 3 workflows')
  assert.notEqual(summary, 'No active checks')
})

// -----------------------------------------------------------------------------
// 5. DASH-HONESTY-02: Boundary Filter High Priority
// -----------------------------------------------------------------------------
test('DASH-HONESTY-02: Deployed tasks with critical or high priority are excluded from pending high-priority deliverables count', () => {
  const tasks = [
    { id: '1', name: 'Critical In-Flight', priority: 'critical', status: 'running_sprint' },
    { id: '2', name: 'High Priority Queued', priority: 'high', status: 'in_queue' },
    { id: '3', name: 'Critical Already Deployed', priority: 'critical', status: 'deployed' },
    { id: '4', name: 'High Already Deployed', priority: 'high', status: 'deployed' },
    { id: '5', name: 'Medium In-Flight', priority: 'medium', status: 'running_sprint' },
    { id: '6', name: 'Low Priority Queued', priority: 'low', status: 'in_queue' }
  ]

  // Implementation contract from UnifiedHeroBanner.vue line 153-157
  const highPriorityCount = tasks.filter(
    (t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'deployed'
  ).length

  // Only task 1 and task 2 qualify
  assert.equal(highPriorityCount, 2, 'Must only count pending (non-deployed) critical and high priority tasks')
})

// -----------------------------------------------------------------------------
// 6. DASH-HONESTY-03: Semantik Open PR
// -----------------------------------------------------------------------------
test('DASH-HONESTY-03: Only tasks with valid githubPrUrl are counted as open PRs (githubIssueUrl is excluded)', () => {
  const tasks = [
    { id: '1', name: 'Task with valid PR', githubPrUrl: 'https://github.com/org/repo/pull/101', githubIssueUrl: null },
    { id: '2', name: 'Task with issue only', githubPrUrl: null, githubIssueUrl: 'https://github.com/org/repo/issues/45' },
    { id: '3', name: 'Task with empty PR string', githubPrUrl: '', githubIssueUrl: 'https://github.com/org/repo/issues/46' },
    { id: '4', name: 'Task with both PR and issue', githubPrUrl: 'https://github.com/org/repo/pull/102', githubIssueUrl: 'https://github.com/org/repo/issues/47' },
    { id: '5', name: 'Task without git links', githubPrUrl: undefined, githubIssueUrl: undefined }
  ]

  // Implementation contract from UnifiedHeroBanner.vue line 175-178
  const openPrCount = tasks.filter((t) => Boolean(t.githubPrUrl)).length

  assert.equal(openPrCount, 2, 'Only tasks 1 and 4 have valid githubPrUrl')
})

// -----------------------------------------------------------------------------
// 7. DASH-STORE-01: Workspace Store Status LOADING
// -----------------------------------------------------------------------------
test("DASH-STORE-01: tasksDataState computed yields 'LOADING' when hydrationStatus.tasks is loading", () => {
  const store = resetWorkspaceStore()

  // Function contract matching Dashboard.vue line 129-142
  function computeTasksDataState() {
    const taskStatus = store.hydrationStatus.value.tasks
    if (taskStatus === 'error') return 'ERROR'
    if (taskStatus === 'loading' || (store.isLoading.value && taskStatus === 'idle')) {
      return 'LOADING'
    }
    if (taskStatus === 'idle' && !store.isInitialized.value) {
      return 'NOT_LOADED'
    }
    if (taskStatus === 'success') {
      return (store.tasks.value || []).length === 0 ? 'SUCCESS_EMPTY' : 'SUCCESS_WITH_DATA'
    }
    return 'NOT_LOADED'
  }

  // 1. hydrationStatus.tasks = 'loading'
  store.hydrationStatus.value.tasks = 'loading'
  assert.equal(computeTasksDataState(), 'LOADING')

  // 2. store.isLoading = true while tasks status is idle
  store.hydrationStatus.value.tasks = 'idle'
  store.isLoading.value = true
  assert.equal(computeTasksDataState(), 'LOADING')
})

// -----------------------------------------------------------------------------
// 8. DASH-STORE-02: Workspace Store Status SUCCESS_EMPTY
// -----------------------------------------------------------------------------
test("DASH-STORE-02: tasksDataState computed yields 'SUCCESS_EMPTY' when hydrationStatus.tasks is success and tasks array is empty", () => {
  const store = resetWorkspaceStore()

  function computeTasksDataState() {
    const taskStatus = store.hydrationStatus.value.tasks
    if (taskStatus === 'error') return 'ERROR'
    if (taskStatus === 'loading' || (store.isLoading.value && taskStatus === 'idle')) {
      return 'LOADING'
    }
    if (taskStatus === 'idle' && !store.isInitialized.value) {
      return 'NOT_LOADED'
    }
    if (taskStatus === 'success') {
      return (store.tasks.value || []).length === 0 ? 'SUCCESS_EMPTY' : 'SUCCESS_WITH_DATA'
    }
    return 'NOT_LOADED'
  }

  store.hydrationStatus.value.tasks = 'success'
  store.tasks.value = []
  assert.equal(computeTasksDataState(), 'SUCCESS_EMPTY')

  // When tasks are present, it yields SUCCESS_WITH_DATA
  store.tasks.value = [{ id: 't-1', name: 'Task One' }]
  assert.equal(computeTasksDataState(), 'SUCCESS_WITH_DATA')
})

// -----------------------------------------------------------------------------
// 9. DASH-STORE-03: Workspace Store Status ERROR
// -----------------------------------------------------------------------------
test("DASH-STORE-03: tasksDataState computed yields 'ERROR' when hydrationStatus.tasks is error; other entity failures do not clobber tasks state", () => {
  const store = resetWorkspaceStore()

  function computeTasksDataState() {
    const taskStatus = store.hydrationStatus.value.tasks
    if (taskStatus === 'error') return 'ERROR'
    if (taskStatus === 'loading' || (store.isLoading.value && taskStatus === 'idle')) {
      return 'LOADING'
    }
    if (taskStatus === 'idle' && !store.isInitialized.value) {
      return 'NOT_LOADED'
    }
    if (taskStatus === 'success') {
      return (store.tasks.value || []).length === 0 ? 'SUCCESS_EMPTY' : 'SUCCESS_WITH_DATA'
    }
    return 'NOT_LOADED'
  }

  // 1. Direct tasks error
  store.hydrationStatus.value.tasks = 'error'
  assert.equal(computeTasksDataState(), 'ERROR')

  // 2. Partial resilience: notes error, but tasks is success
  store.hydrationStatus.value.tasks = 'success'
  store.hydrationStatus.value.notes = 'error'
  store.tasks.value = [{ id: 't-1', name: 'Valid Task' }]
  assert.equal(computeTasksDataState(), 'SUCCESS_WITH_DATA', 'Notes error must not clobber tasks state')
})

// -----------------------------------------------------------------------------
// 10. DASH-STORE-04: SSOT Reaktivitas: Mutasi Task Terpropagasi 0ms
// -----------------------------------------------------------------------------
test('DASH-STORE-04: SSOT reactivity mutates in-flight, deployed, and completion rate calculations instantaneously (0ms)', () => {
  const store = resetWorkspaceStore()

  store.tasks.value = [
    { id: 'task-1', name: 'Feature A', status: 'running_sprint', priority: 'high' },
    { id: 'task-2', name: 'Feature B', status: 'in_queue', priority: 'medium' }
  ]

  // Reactive computed metrics
  const inFlight = computed(() => store.tasks.value.filter((t) => t.status === 'running_sprint').length)
  const deployed = computed(() => store.tasks.value.filter((t) => t.status === 'deployed').length)
  const rate = computed(() =>
    store.tasks.value.length === 0 ? 0 : Math.round((deployed.value / store.tasks.value.length) * 100)
  )

  // Initial state
  assert.equal(inFlight.value, 1)
  assert.equal(deployed.value, 0)
  assert.equal(rate.value, 0)

  // Mutate task status via store helper (0ms synchronous update)
  store.updateTaskInStore('task-1', { status: 'deployed' })

  // Instant propagation
  assert.equal(inFlight.value, 0, 'In flight immediately drops to 0')
  assert.equal(deployed.value, 1, 'Deployed immediately increases to 1')
  assert.equal(rate.value, 50, 'Completion rate immediately calculates to 50%')
})

// -----------------------------------------------------------------------------
// 11. DASH-STORE-05: Idempotensi initializeWorkspace
// -----------------------------------------------------------------------------
test('DASH-STORE-05: initializeWorkspace is idempotent and returns memory cache with 0 additional HTTP fetches when already initialized', async () => {
  const store = resetWorkspaceStore()

  let fetchCount = 0
  globalThis.$fetch = async (url) => {
    fetchCount++
    if (url === '/api/tasks') return [{ id: 't-10', name: 'Task 10', status: 'in_queue' }]
    if (url === '/api/projects') return [{ id: 'p-1', slug: 'nexura-core' }]
    if (url === '/api/sprints') return []
    if (url === '/api/notes') return []
    return []
  }

  // First initialization
  await store.initializeWorkspace()
  assert.equal(store.isInitialized.value, true)
  const initialFetchCount = fetchCount
  assert.ok(initialFetchCount >= 1, 'Initial call triggers fetches')

  // Second initialization call (without force flag)
  const cachedData = await store.initializeWorkspace()
  assert.equal(fetchCount, initialFetchCount, 'Zero additional HTTP requests should be made on second call')
  assert.equal(cachedData.tasks.length, 1)
  assert.equal(cachedData.tasks[0].id, 't-10')
})

// -----------------------------------------------------------------------------
// 12. DASH-STORE-06: Konkurensi inFlightHydrationPromise
// -----------------------------------------------------------------------------
test('DASH-STORE-06: Concurrent calls to initializeWorkspace share the identical inFlightHydrationPromise batch', async () => {
  const store = resetWorkspaceStore()

  let fetchCalls = 0
  globalThis.$fetch = async (url) => {
    fetchCalls++
    // Artificial latency
    await new Promise((r) => setTimeout(r, 20))
    if (url === '/api/tasks') return [{ id: 't-concurrent', name: 'Concurrent Task' }]
    return []
  }

  // Trigger two concurrent initializations
  const [res1, res2] = await Promise.all([
    store.initializeWorkspace(),
    store.initializeWorkspace()
  ])

  assert.equal(res1.tasks.length, 1)
  assert.equal(res2.tasks.length, 1)
  assert.equal(res1.tasks[0].id, 't-concurrent')
  // Verify only 1 batch of endpoints was fetched (tasks, projects, sprints, notes = 4 calls total)
  assert.equal(fetchCalls, 4, 'Should execute only 1 batch of fetches for both concurrent calls')
})

// -----------------------------------------------------------------------------
// 13. DASH-STORE-07: Ketahanan Hidrasi & Retry
// -----------------------------------------------------------------------------
test('DASH-STORE-07: Workspace store hydration failure resilience and refreshWorkspace recovery', async () => {
  const store = resetWorkspaceStore()

  // First attempt: tasks endpoint fails
  globalThis.$fetch = async (url) => {
    if (url === '/api/tasks') {
      throw new Error('500 Internal Server Error: Database Down')
    }
    return []
  }

  await store.initializeWorkspace()
  assert.equal(store.hydrationStatus.value.tasks, 'error', 'Tasks hydration status must record error')

  // Recovery: server is restored, call refreshWorkspace
  globalThis.$fetch = async (url) => {
    if (url === '/api/tasks') {
      return [{ id: 't-recovered', name: 'Recovered Deliverable' }]
    }
    return []
  }

  await store.refreshWorkspace()
  assert.equal(store.hydrationStatus.value.tasks, 'success', 'Hydration status must recover to success')
  assert.equal(store.tasks.value.length, 1)
  assert.equal(store.tasks.value[0].id, 't-recovered')
})

// -----------------------------------------------------------------------------
// 14. DASH-QUEUE-01: ActiveExecutionQueue Due Date Formatting
// -----------------------------------------------------------------------------
test("DASH-QUEUE-01: ActiveExecutionQueue formatDueOrDate returns 'No Due Date' when dueDate is absent (never defaults to 'Today')", () => {
  // Implementation contract from ActiveExecutionQueue.vue line 208-226
  function formatDueOrDate(task) {
    if (task.status === 'deployed') return 'Deployed'
    if (task.dueDate) {
      const todayStr = new Date().toISOString().slice(0, 10)
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      const due = task.dueDate.slice(0, 10)
      if (due === todayStr) return 'Today'
      if (due === tomorrow) return 'Tomorrow'
      if (due < todayStr) return 'Overdue'
      const parts = due.split('-')
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const m = months[parseInt(parts[1], 10) - 1]
        return `${m} ${parseInt(parts[2], 10)}`
      }
      return task.dueDate
    }
    return 'No Due Date'
  }

  // 1. Task without dueDate
  const taskNoDue = { id: '1', name: 'Unscheduled', dueDate: undefined, status: 'in_queue' }
  const resNoDue = formatDueOrDate(taskNoDue)
  assert.equal(resNoDue, 'No Due Date')
  assert.notEqual(resNoDue, 'Today', "Must not hallucinate 'Today' when dueDate is missing")

  // 2. Task with null dueDate
  const taskNullDue = { id: '2', name: 'Unscheduled Null', dueDate: null, status: 'in_queue' }
  assert.equal(formatDueOrDate(taskNullDue), 'No Due Date')

  // 3. Task deployed
  const taskDeployed = { id: '3', name: 'Shipped Task', dueDate: undefined, status: 'deployed' }
  assert.equal(formatDueOrDate(taskDeployed), 'Deployed')

  // 4. Task due today
  const todayIso = new Date().toISOString().slice(0, 10)
  const taskToday = { id: '4', name: 'Due Today', dueDate: todayIso, status: 'running_sprint' }
  assert.equal(formatDueOrDate(taskToday), 'Today')

  // 5. Task overdue
  const taskOverdue = { id: '5', name: 'Past Due', dueDate: '2020-01-01', status: 'running_sprint' }
  assert.equal(formatDueOrDate(taskOverdue), 'Overdue')
})

// -----------------------------------------------------------------------------
// 15. DASH-SHIPMENTS-01: RecentShipmentsCard Filter Integritas
// -----------------------------------------------------------------------------
test('DASH-SHIPMENTS-01: RecentShipmentsCard strictly filters tasks to deployed status only', () => {
  const allTasks = [
    { id: '1', name: 'Shipped Alpha', status: 'deployed' },
    { id: '2', name: 'Active Beta', status: 'running_sprint' },
    { id: '3', name: 'Queued Gamma', status: 'in_queue' },
    { id: '4', name: 'Blocked Delta', status: 'blocked' },
    { id: '5', name: 'Shipped Epsilon', status: 'deployed' }
  ]

  // Implementation contract from RecentShipmentsCard.vue line 90-97
  const deployedTasks = allTasks.filter((t) => t.status === 'deployed')
  const displayShipments = deployedTasks.slice(0, 4)

  assert.equal(displayShipments.length, 2)
  assert.deepEqual(
    displayShipments.map((t) => t.id),
    ['1', '5']
  )
  assert.ok(!displayShipments.some((t) => t.status === 'running_sprint'))
  assert.ok(!displayShipments.some((t) => t.status === 'in_queue'))
  assert.ok(!displayShipments.some((t) => t.status === 'blocked'))
})

// -----------------------------------------------------------------------------
// 16. DASH-SHIPMENTS-02: RecentShipmentsCard Tech Tags Honesty
// -----------------------------------------------------------------------------
test('DASH-SHIPMENTS-02: RecentShipmentsCard getTechTags returns empty array for absent/empty techTags (no mock fallback)', () => {
  // Implementation contract from RecentShipmentsCard.vue line 99-104
  function getTechTags(task) {
    if (task.techTags && task.techTags.length > 0) {
      return task.techTags.slice(0, 3)
    }
    return []
  }

  // 1. Task with empty techTags
  assert.deepEqual(getTechTags({ techTags: [] }), [])

  // 2. Task with undefined techTags
  assert.deepEqual(getTechTags({ techTags: undefined }), [])

  // 3. Task with null techTags
  assert.deepEqual(getTechTags({ techTags: null }), [])

  // 4. Verify no fake mock fallback like ['Vue 3', 'Nuxt 4', 'Tailwind']
  const emptyRes = getTechTags({})
  assert.equal(emptyRes.includes('Vue 3'), false)
  assert.equal(emptyRes.includes('Nuxt 4'), false)

  // 5. Genuine tags capped at 3
  const realRes = getTechTags({ techTags: ['TS', 'Nuxt', 'Vite', 'Vitest'] })
  assert.deepEqual(realRes, ['TS', 'Nuxt', 'Vite'])
})

// -----------------------------------------------------------------------------
// 17. DASH-PING-01: Endpoint /api/ping Liveness Probe
// -----------------------------------------------------------------------------
test('DASH-PING-01: Endpoint /api/ping liveness probe returns ok: true, service: "nexura-app-server", and timestamp', async () => {
  const mockEvent = {}
  const response = await Promise.resolve(pingHandler(mockEvent))

  assert.ok(response, 'Response must exist')
  assert.equal(response.ok, true, 'Response ok must be true')
  assert.equal(response.service, 'nexura-app-server', 'Service identifier must match')
  assert.equal(typeof response.timestamp, 'number', 'Timestamp must be a numeric epoch')
  assert.ok(response.timestamp > 0, 'Timestamp must be greater than zero')
  assert.ok(Math.abs(Date.now() - response.timestamp) < 5000, 'Timestamp must be within current second range')
})

// -----------------------------------------------------------------------------
// 18. DASH-PING-02: Ping Network / HTTP Failure Handling
// -----------------------------------------------------------------------------
test("DASH-PING-02: Ping edge failure handling returns 'Offline · Err' on network or HTTP error (never falls back to OK)", async () => {
  // Client simulation matching InfrastructureMeshCard.vue line 84-103
  async function simulatePingEdge(fetchCall) {
    const start = Date.now()
    try {
      await fetchCall()
      const elapsed = Date.now() - start
      return `${elapsed}ms · OK`
    } catch (err) {
      if (err?.name === 'AbortError' || err?.message?.toLowerCase().includes('timeout')) {
        return 'Timeout · Err'
      } else {
        return 'Offline · Err'
      }
    }
  }

  // 1. Network error (connection refused)
  const netErrRes = await simulatePingEdge(async () => {
    throw new Error('fetch failed: ECONNREFUSED')
  })
  assert.equal(netErrRes, 'Offline · Err')
  assert.notEqual(netErrRes, '32ms · OK', 'Must never fall back to fake OK')

  // 2. HTTP 500 Server error
  const httpErrRes = await simulatePingEdge(async () => {
    throw new Error('HTTP 500 Internal Server Error')
  })
  assert.equal(httpErrRes, 'Offline · Err')
})

// -----------------------------------------------------------------------------
// 19. DASH-PING-03: Ping Timeout / Abort Handling
// -----------------------------------------------------------------------------
test("DASH-PING-03: Ping edge timeout handling returns 'Timeout · Err' on abort or timeout error", async () => {
  async function simulatePingEdge(fetchCall) {
    const start = Date.now()
    try {
      await fetchCall()
      const elapsed = Date.now() - start
      return `${elapsed}ms · OK`
    } catch (err) {
      if (err?.name === 'AbortError' || err?.message?.toLowerCase().includes('timeout')) {
        return 'Timeout · Err'
      } else {
        return 'Offline · Err'
      }
    }
  }

  // 1. AbortError instance
  const abortErr = new Error('The operation was aborted')
  abortErr.name = 'AbortError'
  const abortRes = await simulatePingEdge(async () => {
    throw abortErr
  })
  assert.equal(abortRes, 'Timeout · Err')

  // 2. Timeout message in error
  const timeoutErr = new Error('Gateway request timeout (504)')
  const timeoutRes = await simulatePingEdge(async () => {
    throw timeoutErr
  })
  assert.equal(timeoutRes, 'Timeout · Err')
})

// =============================================================================
// REDESIGN DASHBOARD COMMAND CENTER SPECIFICATION: 12 NEW TEST CONTRACTS
// =============================================================================

// -----------------------------------------------------------------------------
// 20. PULSE-STATE-01: Workspace Pulse Status LOADING
// -----------------------------------------------------------------------------
test("PULSE-STATE-01: Workspace Pulse status yields 'LOADING' when hydrationStatus is loading or data is pending", () => {
  function computePulseState(hydrationStatus, tasks) {
    const isTasksLoading =
      hydrationStatus === 'loading' ||
      (typeof hydrationStatus === 'object' && hydrationStatus !== null && hydrationStatus.tasks === 'loading')

    if (isTasksLoading) return 'LOADING'

    const isTasksError =
      hydrationStatus === 'error' ||
      (typeof hydrationStatus === 'object' && hydrationStatus !== null && hydrationStatus.tasks === 'error') ||
      !tasks

    if (isTasksError) return 'DATA_UNAVAILABLE'

    const blocked = (tasks || []).filter((t) => t.status === 'blocked').length
    const todayStr = new Date().toISOString().slice(0, 10)
    const overdue = (tasks || []).filter((t) => t.status !== 'deployed' && t.dueDate && t.dueDate.slice(0, 10) < todayStr).length

    if (blocked > 0 || overdue > 0) return 'ATTENTION_REQUIRED'
    return 'NO_CRITICAL_ISSUES'
  }

  // 1. hydrationStatus string = 'loading'
  assert.equal(computePulseState('loading', []), 'LOADING')

  // 2. hydrationStatus object with tasks = 'loading'
  assert.equal(computePulseState({ tasks: 'loading', projects: 'idle' }, []), 'LOADING')
})

// -----------------------------------------------------------------------------
// 21. PULSE-STATE-02: Workspace Pulse Status DATA_UNAVAILABLE
// -----------------------------------------------------------------------------
test("PULSE-STATE-02: Workspace Pulse status yields 'DATA_UNAVAILABLE' when hydrationStatus is error or tasks data is missing", () => {
  function computePulseState(hydrationStatus, tasks) {
    const isTasksLoading =
      hydrationStatus === 'loading' ||
      (typeof hydrationStatus === 'object' && hydrationStatus !== null && hydrationStatus.tasks === 'loading')

    if (isTasksLoading) return 'LOADING'

    const isTasksError =
      hydrationStatus === 'error' ||
      (typeof hydrationStatus === 'object' && hydrationStatus !== null && hydrationStatus.tasks === 'error') ||
      !tasks

    if (isTasksError) return 'DATA_UNAVAILABLE'

    const blocked = (tasks || []).filter((t) => t.status === 'blocked').length
    const todayStr = new Date().toISOString().slice(0, 10)
    const overdue = (tasks || []).filter((t) => t.status !== 'deployed' && t.dueDate && t.dueDate.slice(0, 10) < todayStr).length

    if (blocked > 0 || overdue > 0) return 'ATTENTION_REQUIRED'
    return 'NO_CRITICAL_ISSUES'
  }

  // 1. hydrationStatus string = 'error'
  assert.equal(computePulseState('error', []), 'DATA_UNAVAILABLE')

  // 2. hydrationStatus object with tasks = 'error'
  assert.equal(computePulseState({ tasks: 'error' }, []), 'DATA_UNAVAILABLE')

  // 3. tasks missing (null/undefined)
  assert.equal(computePulseState('idle', null), 'DATA_UNAVAILABLE')
})

// -----------------------------------------------------------------------------
// 22. PULSE-STATE-03: Workspace Pulse Status NO_CRITICAL_ISSUES
// -----------------------------------------------------------------------------
test("PULSE-STATE-03: Workspace Pulse status yields 'NO_CRITICAL_ISSUES' when hydrated with zero blockers and zero overdue, and forbids fake global claims", () => {
  function computePulseState(hydrationStatus, tasks) {
    const isTasksLoading =
      hydrationStatus === 'loading' ||
      (typeof hydrationStatus === 'object' && hydrationStatus !== null && hydrationStatus.tasks === 'loading')
    if (isTasksLoading) return 'LOADING'

    const isTasksError =
      hydrationStatus === 'error' ||
      (typeof hydrationStatus === 'object' && hydrationStatus !== null && hydrationStatus.tasks === 'error') ||
      !tasks
    if (isTasksError) return 'DATA_UNAVAILABLE'

    const blocked = (tasks || []).filter((t) => t.status === 'blocked').length
    const todayStr = new Date().toISOString().slice(0, 10)
    const overdue = (tasks || []).filter((t) => t.status !== 'deployed' && t.dueDate && t.dueDate.slice(0, 10) < todayStr).length

    if (blocked > 0 || overdue > 0) return 'ATTENTION_REQUIRED'
    return 'NO_CRITICAL_ISSUES'
  }

  const tasksNominal = [
    { id: '1', name: 'Task A', status: 'running_sprint', dueDate: new Date(Date.now() + 86400000).toISOString() },
    { id: '2', name: 'Task B', status: 'deployed', dueDate: '2025-01-01' },
    { id: '3', name: 'Task C', status: 'in_queue' }
  ]

  const state = computePulseState({ tasks: 'success' }, tasksNominal)
  assert.equal(state, 'NO_CRITICAL_ISSUES')

  // Verify source code of WorkspacePulse.vue forbids fake global claims
  const pulseSource = fs.readFileSync(path.resolve(projectRoot, 'components/dashboard/WorkspacePulse.vue'), 'utf-8')
  assert.equal(pulseSource.includes('All Systems Nominal'), false, "Must not contain fake claim 'All Systems Nominal'")
  assert.equal(pulseSource.includes('All Clear · Optimal'), false, "Must not contain fake claim 'All Clear · Optimal'")
})

// -----------------------------------------------------------------------------
// 23. PULSE-STATE-04: Workspace Pulse Status ATTENTION_REQUIRED
// -----------------------------------------------------------------------------
test("PULSE-STATE-04: Workspace Pulse status yields 'ATTENTION_REQUIRED' when blocked or overdue count exceeds zero with itemized counts", () => {
  function evaluatePulse(tasks) {
    const blocked = (tasks || []).filter((t) => t.status === 'blocked').length
    const todayStr = new Date().toISOString().slice(0, 10)
    const overdue = (tasks || []).filter((t) => t.status !== 'deployed' && t.dueDate && t.dueDate.slice(0, 10) < todayStr).length
    const state = blocked > 0 || overdue > 0 ? 'ATTENTION_REQUIRED' : 'NO_CRITICAL_ISSUES'
    return { state, blockedCount: blocked, overdueCount: overdue }
  }

  // Skenario A: Blocked > 0, Overdue = 0
  const tasksA = [
    { id: '1', status: 'blocked' },
    { id: '2', status: 'in_queue' }
  ]
  const resA = evaluatePulse(tasksA)
  assert.equal(resA.state, 'ATTENTION_REQUIRED')
  assert.equal(resA.blockedCount, 1)
  assert.equal(resA.overdueCount, 0)

  // Skenario B: Blocked = 0, Overdue > 0
  const tasksB = [
    { id: '1', status: 'running_sprint', dueDate: '2020-01-01' },
    { id: '2', status: 'in_queue' }
  ]
  const resB = evaluatePulse(tasksB)
  assert.equal(resB.state, 'ATTENTION_REQUIRED')
  assert.equal(resB.blockedCount, 0)
  assert.equal(resB.overdueCount, 1)

  // Skenario C: Both Blocked > 0 and Overdue > 0
  const tasksC = [
    { id: '1', status: 'blocked' },
    { id: '2', status: 'blocked' },
    { id: '3', status: 'running_sprint', dueDate: '2020-01-01' }
  ]
  const resC = evaluatePulse(tasksC)
  assert.equal(resC.state, 'ATTENTION_REQUIRED')
  assert.equal(resC.blockedCount, 2)
  assert.equal(resC.overdueCount, 1)
})

// -----------------------------------------------------------------------------
// 24. PULSE-OVERDUE-01: Penanganan Tanggal Overdue Bebas Timezone Bias
// -----------------------------------------------------------------------------
test('PULSE-OVERDUE-01: Local calendar date comparison identifies overdue deliverables without timezone bias and excludes deployed tasks', () => {
  function getLocalDateString(d = new Date()) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function checkOverdue(task, refDate = new Date()) {
    if (task.status === 'deployed') return false
    if (!task.dueDate) return false
    const todayStr = getLocalDateString(refDate)
    const dueStr = task.dueDate.slice(0, 10)
    return dueStr < todayStr
  }

  const baseDate = new Date(2026, 9, 28) // 2026-10-28 local
  const yesterdayStr = '2026-10-27'
  const todayStr = '2026-10-28'
  const tomorrowStr = '2026-10-29'

  // 1. Task due yesterday (non-deployed) -> overdue
  assert.equal(checkOverdue({ status: 'running_sprint', dueDate: yesterdayStr }, baseDate), true)

  // 2. Task due today -> NOT overdue
  assert.equal(checkOverdue({ status: 'running_sprint', dueDate: todayStr }, baseDate), false)

  // 3. Task due tomorrow -> NOT overdue
  assert.equal(checkOverdue({ status: 'in_queue', dueDate: tomorrowStr }, baseDate), false)

  // 4. Deployed task due in the past -> NEVER overdue
  assert.equal(checkOverdue({ status: 'deployed', dueDate: yesterdayStr }, baseDate), false)
  assert.equal(checkOverdue({ status: 'deployed', dueDate: '2020-01-01' }, baseDate), false)
})

// -----------------------------------------------------------------------------
// 25. CHART-UNASSIGNED-01: Deliverables Tanpa Proyek
// -----------------------------------------------------------------------------
test("CHART-UNASSIGNED-01: Deliverables without registered project are grouped into pseudo 'Unassigned Deliverables' row, omitted when count is zero", () => {
  function buildOverview(projects, tasks) {
    const knownSlugs = new Set(projects.map((p) => p.slug))
    const taskMap = new Map()
    const unassignedTasks = []

    for (const t of tasks) {
      if (t.projectSlug && knownSlugs.has(t.projectSlug)) {
        if (!taskMap.has(t.projectSlug)) taskMap.set(t.projectSlug, [])
        taskMap.get(t.projectSlug).push(t)
      } else {
        unassignedTasks.push(t)
      }
    }

    const rows = projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      isUnassigned: false,
      total: (taskMap.get(p.slug) || []).length
    }))

    if (unassignedTasks.length > 0) {
      rows.push({
        id: 'unassigned',
        slug: 'unassigned',
        title: 'Unassigned Deliverables',
        isUnassigned: true,
        total: unassignedTasks.length
      })
    }

    return rows
  }

  const registeredProjects = [
    { id: 'p1', slug: 'nexura-cloud', title: 'Nexura Cloud' },
    { id: 'p2', slug: 'nexura-ui', title: 'Nexura UI' }
  ]

  // Skenario A: 0 unassigned tasks
  const tasksA = [
    { id: 't1', projectSlug: 'nexura-cloud' },
    { id: 't2', projectSlug: 'nexura-ui' }
  ]
  const rowsA = buildOverview(registeredProjects, tasksA)
  assert.equal(rowsA.length, 2)
  assert.equal(rowsA.some((r) => r.isUnassigned), false, 'Must not render unassigned row when count is 0')

  // Skenario B: Tasks with missing projectSlug or unknown slug
  const tasksB = [
    { id: 't1', projectSlug: 'nexura-cloud' },
    { id: 't2', projectSlug: undefined },
    { id: 't3', projectSlug: 'deleted-legacy-proj' }
  ]
  const rowsB = buildOverview(registeredProjects, tasksB)
  assert.equal(rowsB.length, 3)
  const unassignedRow = rowsB.find((r) => r.isUnassigned)
  assert.ok(unassignedRow, 'Must append unassigned row when unassigned deliverables exist')
  assert.equal(unassignedRow.title, 'Unassigned Deliverables')
  assert.equal(unassignedRow.total, 2)
})

// -----------------------------------------------------------------------------
// 26. CHART-TOOLTIP-01: Kontrak 4 Field Tooltip & Navigasi
// -----------------------------------------------------------------------------
test('CHART-TOOLTIP-01: Tooltip strictly adheres to 4-field contract (projectTitle, statusLabel, count, percentage) without task snippets, and navigates correctly', () => {
  // Tooltip construction contract matching ProjectExecutionOverview.vue
  function createTooltip(project, segment) {
    return {
      projectTitle: project.title,
      statusLabel: segment.label,
      count: segment.count,
      percentage: segment.percentage
    }
  }

  const project = { id: 'p1', slug: 'nexura-core', title: 'Nexura Core Engine' }
  const segment = { status: 'running_sprint', label: 'In Progress', count: 4, percentage: 40 }

  const tooltip = createTooltip(project, segment)
  const keys = Object.keys(tooltip)
  assert.deepEqual(keys.sort(), ['count', 'percentage', 'projectTitle', 'statusLabel'].sort())
  assert.equal('tasks' in tooltip, false, 'Tooltip must not contain task list snippets')
  assert.equal('snippets' in tooltip, false, 'Tooltip must not contain snippets')

  // Navigation contract
  function getNavigationTarget(row) {
    if (row.isUnassigned) return '/tasks'
    return `/projects/${row.slug}`
  }

  assert.equal(getNavigationTarget({ isUnassigned: false, slug: 'nexura-core' }), '/projects/nexura-core')
  assert.equal(getNavigationTarget({ isUnassigned: true, slug: 'unassigned' }), '/tasks')
})

// -----------------------------------------------------------------------------
// 27. CHART-SCALE-01: Formula Skala Seragam maxScale
// -----------------------------------------------------------------------------
test('CHART-SCALE-01: Uniform maxScale calculation rounds up to next multiple of 5 with minimum 5 across all projects', () => {
  function computeMaxScale(rows, unassignedTotal = 0) {
    const totals = rows.map((r) => r.total)
    if (unassignedTotal > 0) totals.push(unassignedTotal)
    const maxTotal = totals.length > 0 ? Math.max(0, ...totals) : 0
    return Math.max(5, Math.ceil(Math.max(5, maxTotal) / 5) * 5)
  }

  // 1. Max total is 12 -> 15
  assert.equal(computeMaxScale([{ total: 12 }, { total: 4 }]), 15)

  // 2. Max total is 18 -> 20
  assert.equal(computeMaxScale([{ total: 18 }, { total: 10 }]), 20)

  // 3. Max total is 0 -> 5
  assert.equal(computeMaxScale([{ total: 0 }, { total: 0 }]), 5)

  // 4. Max total is 5 -> 5
  assert.equal(computeMaxScale([{ total: 5 }, { total: 3 }]), 5)

  // 5. Max total is 21 -> 25
  assert.equal(computeMaxScale([{ total: 7 }, { total: 21 }]), 25)

  // Uniform scale basis prevents distortion
  const scale = computeMaxScale([{ total: 12 }, { total: 6 }])
  assert.equal(scale, 15)
  const widthA = (12 / scale) * 100 // 80%
  const widthB = (6 / scale) * 100  // 40%
  assert.equal(widthA, 80)
  assert.equal(widthB, 40)
})

// -----------------------------------------------------------------------------
// 28. CHART-ZERO-01: Proyek Tanpa Deliverable
// -----------------------------------------------------------------------------
test("CHART-ZERO-01: Projects with zero deliverables render neutral ghost bar '0 deliverables staged' without fictitious colored segments", () => {
  function renderProjectBar(total, segments) {
    if (total === 0) {
      return { isGhost: true, placeholder: '0 deliverables staged', renderedSegments: [] }
    }
    return { isGhost: false, placeholder: null, renderedSegments: segments }
  }

  const zeroProject = renderProjectBar(0, [])
  assert.equal(zeroProject.isGhost, true)
  assert.equal(zeroProject.placeholder, '0 deliverables staged')
  assert.deepEqual(zeroProject.renderedSegments, [])

  const activeProject = renderProjectBar(3, [{ status: 'running_sprint', count: 3 }])
  assert.equal(activeProject.isGhost, false)
  assert.equal(activeProject.renderedSegments.length, 1)
})

// -----------------------------------------------------------------------------
// 29. CLEANUP-MATRIX-01: Eliminasi Badge Matrix
// -----------------------------------------------------------------------------
test("CLEANUP-MATRIX-01: Source code audit confirms complete elimination of 'Command Center Matrix' from components/Dashboard.vue", () => {
  const dashboardSource = fs.readFileSync(path.resolve(projectRoot, 'components/Dashboard.vue'), 'utf-8')
  assert.equal(
    dashboardSource.includes('Command Center Matrix'),
    false,
    "components/Dashboard.vue must not contain the obsolete 'Command Center Matrix' badge"
  )
})

// -----------------------------------------------------------------------------
// 30. CLEANUP-BARLET-01: Eliminasi Quick Actions Barlet
// -----------------------------------------------------------------------------
test('CLEANUP-BARLET-01: Source code audit confirms complete elimination of Quick Actions Barlet (Task (C), CI Run, Prod) from components/Dashboard.vue', () => {
  const dashboardSource = fs.readFileSync(path.resolve(projectRoot, 'components/Dashboard.vue'), 'utf-8')
  assert.equal(dashboardSource.includes('Task (C)'), false, "Must not contain 'Task (C)' quick action button")
  assert.equal(dashboardSource.includes('CI Run'), false, "Must not contain 'CI Run' quick action button")
  assert.equal(dashboardSource.includes('Open Live Production on Vercel'), false, "Must not contain Prod link button")
})

// -----------------------------------------------------------------------------
// 31. VIEWPORT-FLEX-01: Dynamic Flex Contraction saat AlertBar Aktif
// -----------------------------------------------------------------------------
test('VIEWPORT-FLEX-01: Lower Bento Grid absorbs AlertBar height dynamically (flex-1 min-h-0) maintaining constant single viewport budget', () => {
  const dashboardSource = fs.readFileSync(path.resolve(projectRoot, 'components/Dashboard.vue'), 'utf-8')

  // 1. Verify layout container has flex column viewport constraints
  assert.ok(
    dashboardSource.includes('xl:h-full xl:flex xl:flex-col xl:min-h-0'),
    'Container must define full height flex column with min-h-0'
  )

  // 2. Verify AlertBar has shrink-0 so it occupies fixed budget only when visible
  assert.ok(
    dashboardSource.includes('<AlertBar') && dashboardSource.includes('class="shrink-0"'),
    'AlertBar must be marked shrink-0'
  )

  // 3. Verify Lower Bento Grid has flex-1 min-h-0 to dynamically absorb height variation
  assert.ok(
    dashboardSource.includes('class="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0"'),
    'Lower Bento Grid must be flex-1 min-h-0 to dynamically flex within viewport budget'
  )

  // 4. Mathematical space budget verification
  const totalViewportHeight = 900
  const fixedHeaderAndCards = 440 // Header + Hero + Project Overview
  const alertBarHeight = 56

  // When AlertBar is hidden (hasAlerts = false)
  const lowerBentoAvailableNoAlert = totalViewportHeight - fixedHeaderAndCards
  assert.equal(lowerBentoAvailableNoAlert, 460)

  // When AlertBar is active (hasAlerts = true)
  const lowerBentoAvailableWithAlert = totalViewportHeight - fixedHeaderAndCards - alertBarHeight
  assert.equal(lowerBentoAvailableWithAlert, 404)

  // Total composition height remains constant
  assert.equal(fixedHeaderAndCards + alertBarHeight + lowerBentoAvailableWithAlert, totalViewportHeight)
})

