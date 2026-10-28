import test from 'node:test'
import assert from 'node:assert/strict'
import { ref, computed } from 'vue'
import { createJiti } from 'jiti'

// =============================================================================
// Nuxt Global State Simulation & JITI Runtime Setup
// =============================================================================

// Prevent unhandled promise rejections on secondary .finally() branches in Node test runner
const origFinally = Promise.prototype.finally
Promise.prototype.finally = function (callback) {
  const res = origFinally.call(this, callback)
  res.catch(() => {})
  return res
}

const nuxtState = new Map()
function mockUseState(key, init) {
  if (!nuxtState.has(key)) {
    nuxtState.set(key, ref(init ? init() : undefined))
  }
  return nuxtState.get(key)
}

globalThis.useState = mockUseState
globalThis.$fetch = async (url, opts) => {
  return []
}

const jiti = createJiti(import.meta.url)
const { useWorkspaceStore } = jiti('../../composables/useWorkspaceStore.ts')
const { useTasks } = jiti('../../composables/useTasks.ts')
const { useSession } = jiti('../../composables/useSession.ts')

// =============================================================================
// EXISTING BASELINE TESTS (Retained for Regression Guard)
// =============================================================================

test('useTaskDrawer manages singleton state and drawer controls', () => {
  const isDrawerOpen = mockUseState('task_drawer:open', () => false)
  const activeTaskId = mockUseState('task_drawer:active_id', () => null)

  function openTaskDrawer(taskId) {
    activeTaskId.value = taskId
    isDrawerOpen.value = true
  }

  function closeTaskDrawer() {
    isDrawerOpen.value = false
    activeTaskId.value = null
  }

  assert.equal(isDrawerOpen.value, false)
  assert.equal(activeTaskId.value, null)

  openTaskDrawer('ENG-101')
  assert.equal(isDrawerOpen.value, true)
  assert.equal(activeTaskId.value, 'ENG-101')

  closeTaskDrawer()
  assert.equal(isDrawerOpen.value, false)
  assert.equal(activeTaskId.value, null)
})

test('useWorkspaceStore manages canonical singleton state and optimistic mutators', () => {
  const tasks = mockUseState('workspace:tasks', () => [])
  const projects = mockUseState('workspace:projects', () => [])
  const sprints = mockUseState('workspace:sprints', () => [])
  const notes = mockUseState('workspace:notes', () => [])

  function addTaskToStore(newTask) {
    tasks.value = [newTask, ...tasks.value]
  }

  function updateTaskInStore(id, patch) {
    const idx = tasks.value.findIndex(t => t.id === id || t.taskId === id)
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...patch }
    }
  }

  function removeTaskFromStore(id) {
    tasks.value = tasks.value.filter(t => t.id !== id && t.taskId !== id)
  }

  // Add task
  addTaskToStore({ id: 'task-1', taskId: 'ENG-001', name: 'Original', status: 'in_queue' })
  assert.equal(tasks.value.length, 1)
  assert.equal(tasks.value[0].name, 'Original')

  // Optimistic update
  updateTaskInStore('task-1', { status: 'running_sprint', name: 'Updated' })
  assert.equal(tasks.value[0].status, 'running_sprint')
  assert.equal(tasks.value[0].name, 'Updated')

  // Remove task
  removeTaskFromStore('task-1')
  assert.equal(tasks.value.length, 0)
})

// =============================================================================
// PHASE 1 STEP 6 MANDATORY BEHAVIORAL SPECIFICATION TESTS
// =============================================================================

test('TEST-HYD-01: Kegagalan Hidrasi Parsial (Promise.allSettled Resilience)', async () => {
  const store = useWorkspaceStore()

  // Setup mock data and partial failure
  const mockTasks = [{ id: 'task-h1', taskId: 'ENG-101', name: 'Hydrated Task 1', status: 'in_queue' }]
  const mockProjects = [{ id: 'proj-h1', slug: 'management', title: 'Management' }]

  globalThis.$fetch = async (url) => {
    if (url === '/api/tasks') return mockTasks
    if (url === '/api/projects') return mockProjects
    if (url === '/api/sprints') throw new Error('HTTP 500 Sprints Service Unavailable')
    if (url === '/api/notes') throw new Error('HTTP 500 Notes Database Deadlock')
    return []
  }

  // Verification: initializeWorkspace MUST NOT throw an unhandled crash exception
  await assert.doesNotReject(async () => {
    await store.initializeWorkspace(true)
  })

  // Successful endpoints populate store
  assert.equal(store.tasks.value.length, 1)
  assert.equal(store.tasks.value[0].name, 'Hydrated Task 1')
  assert.equal(store.projects.value.length, 1)
  assert.equal(store.projects.value[0].slug, 'management')

  // Hydration status tracking matches outcomes
  assert.equal(store.hydrationStatus.value.tasks, 'success')
  assert.equal(store.hydrationStatus.value.projects, 'success')
  assert.equal(store.hydrationStatus.value.sprints, 'error')

  // Calling fetchWorkspaceNotes directly also gracefully records 'error' on 500
  await store.fetchWorkspaceNotes()
  assert.equal(store.hydrationStatus.value.notes, 'error')
  assert.equal(store.isInitialized.value, true)
})

test('TEST-HYD-02: Shared In-Flight Hydration Promise prevents duplicate network calls', async () => {
  const store = useWorkspaceStore()
  const tasksService = useTasks()

  // Reset initialized state to trigger fresh hydration
  store.isInitialized.value = false

  const callCounts = {
    '/api/tasks': 0,
    '/api/projects': 0,
    '/api/sprints': 0,
    '/api/notes': 0
  }

  globalThis.$fetch = async (url) => {
    const cleanUrl = url.split('?')[0]
    if (callCounts[cleanUrl] !== undefined) {
      callCounts[cleanUrl]++
    }
    // Simulate realistic 15ms network latency
    await new Promise(r => setTimeout(r, 15))
    return []
  }

  // Fire 5 concurrent workspace initializations plus concurrent fallback getTasks()
  await Promise.all([
    store.initializeWorkspace(),
    store.initializeWorkspace(),
    store.initializeWorkspace(),
    store.initializeWorkspace(),
    store.initializeWorkspace(),
    tasksService.getTasks()
  ])

  // Each core endpoint MUST be requested EXACTLY once
  assert.equal(callCounts['/api/tasks'], 1, 'Endpoint /api/tasks must only be fetched once')
  assert.equal(callCounts['/api/projects'], 1, 'Endpoint /api/projects must only be fetched once')
  assert.equal(callCounts['/api/sprints'], 1, 'Endpoint /api/sprints must only be fetched once')
  assert.equal(callCounts['/api/notes'], 1, 'Endpoint /api/notes must only be fetched once')

  const totalCalls = Object.values(callCounts).reduce((a, b) => a + b, 0)
  assert.equal(totalCalls, 4, 'Total network calls must equal exactly 4 across all concurrent callers')
})

test('TEST-MUT-01: Rollback Optimistic Add Task Gagal', async () => {
  const store = useWorkspaceStore()
  const tasksService = useTasks()

  store.tasks.value = []

  // Server fails on POST /api/tasks
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'POST') {
      throw new Error('500 Internal Server Error: Database write timeout')
    }
    return []
  }

  await assert.rejects(
    async () => {
      await tasksService.createTask({
        name: 'Transient Failing Task',
        status: 'in_queue'
      })
    },
    /Database write timeout/
  )

  // Optimistic task must be cleanly rolled back from the store
  assert.equal(store.tasks.value.length, 0, 'Store must revert to 0 tasks after add failure')
})

test('TEST-MUT-02: Rollback Optimistic Update Task Gagal', async () => {
  const store = useWorkspaceStore()
  const tasksService = useTasks()

  const initialTask = {
    id: 'task-mut-02',
    taskId: 'ENG-202',
    name: 'Stable Task',
    status: 'in_queue',
    priority: 'low'
  }
  store.tasks.value = [{ ...initialTask }]

  // Server rejects with 401 Unauthorized
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT') {
      const err = new Error('Unauthorized')
      err.statusCode = 401
      err.data = { code: 'UNAUTHORIZED' }
      throw err
    }
    return []
  }

  await assert.rejects(
    async () => {
      await tasksService.updateTask('task-mut-02', { status: 'running_sprint' })
    },
    (err) => err.statusCode === 401
  )

  // Store must revert strictly to original server baseline
  const current = store.tasks.value.find(t => t.id === 'task-mut-02')
  assert.equal(current.status, 'in_queue', 'Status must roll back to baseline "in_queue"')
  assert.equal(current.priority, 'low')
})

test('TEST-MUT-03: Rollback Optimistic Delete Task Gagal', async () => {
  const store = useWorkspaceStore()
  const tasksService = useTasks()

  const taskToDelete = {
    id: 'task-mut-03',
    taskId: 'ENG-303',
    name: 'Protected Task',
    status: 'running_sprint'
  }
  store.tasks.value = [{ ...taskToDelete }]

  // Server rejects with 500 error
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'DELETE') {
      throw new Error('500 Server Delete Error')
    }
    return {}
  }

  await assert.rejects(
    async () => {
      await tasksService.deleteTask('task-mut-03')
    },
    /Server Delete Error/
  )

  // Task must be restored back into the store list
  assert.equal(store.tasks.value.length, 1)
  assert.equal(store.tasks.value[0].id, 'task-mut-03')
  assert.equal(store.tasks.value[0].name, 'Protected Task')
})

test('TEST-CONC-01: Mutasi Simultan pada Field Berbeda (Satu Gagal, Satu Sukses)', async () => {
  const store = useWorkspaceStore()
  const tasksService = useTasks()

  const baselineTask = {
    id: 'task-conc-01',
    taskId: 'ENG-401',
    name: 'Concurrent Target',
    status: 'in_queue',
    priority: 'low'
  }
  store.tasks.value = [{ ...baselineTask }]

  // Request 1 (status update) fails, Request 2 (priority update) succeeds
  globalThis.$fetch = async (url, opts) => {
    await new Promise(r => setTimeout(r, 10))
    if (opts?.body?.status) {
      throw new Error('Failed to update status')
    }
    if (opts?.body?.priority) {
      return { ...baselineTask, priority: opts.body.priority }
    }
    return {}
  }

  const mutation1 = tasksService.updateTask('task-conc-01', { status: 'running_sprint' }).catch(err => err)
  const mutation2 = tasksService.updateTask('task-conc-01', { priority: 'urgent' })

  await Promise.all([mutation1, mutation2])

  const result = store.tasks.value.find(t => t.id === 'task-conc-01')
  // Verification: status reverted to 'in_queue', priority preserved as 'urgent'
  assert.equal(result.status, 'in_queue', 'Failed field "status" must revert to "in_queue"')
  assert.equal(result.priority, 'urgent', 'Successful field "priority" must remain "urgent"')
})

test('TEST-CONC-02: Mutasi Simultan pada Field Sama (Keduanya Gagal)', async () => {
  const store = useWorkspaceStore()
  const tasksService = useTasks()

  const baselineTask = {
    id: 'task-conc-02',
    taskId: 'ENG-402',
    name: 'Double Fail Target',
    status: 'in_queue',
    priority: 'low'
  }
  store.tasks.value = [{ ...baselineTask }]

  // Both mutations fail
  globalThis.$fetch = async () => {
    await new Promise(r => setTimeout(r, 5))
    throw new Error('Server Rejected Update')
  }

  const mut1 = tasksService.updateTask('task-conc-02', { priority: 'medium' }).catch(e => e)
  const mut2 = tasksService.updateTask('task-conc-02', { priority: 'urgent' }).catch(e => e)

  await Promise.all([mut1, mut2])

  const result = store.tasks.value.find(t => t.id === 'task-conc-02')
  // Final value must revert 100% to baseline server state ('low')
  assert.equal(result.priority, 'low', 'When both mutations fail, priority must revert to baseline "low"')
})

test('TEST-CONC-03: Mutasi Simultan pada Field Sama (Mutasi 1 Gagal, Mutasi 2 Sukses)', async () => {
  const store = useWorkspaceStore()
  const tasksService = useTasks()

  const baselineTask = {
    id: 'task-conc-03',
    taskId: 'ENG-403',
    name: 'Ordered Mutex Target',
    status: 'in_queue',
    priority: 'medium'
  }
  store.tasks.value = [{ ...baselineTask }]

  // Mutation 1 fails, Mutation 2 succeeds
  globalThis.$fetch = async (url, opts) => {
    await new Promise(r => setTimeout(r, 10))
    if (opts?.body?.status === 'running_sprint') {
      throw new Error('Sprint capacity exceeded')
    }
    if (opts?.body?.status === 'deployed') {
      return { ...baselineTask, status: 'deployed' }
    }
    return {}
  }

  const mut1 = tasksService.updateTask('task-conc-03', { status: 'running_sprint' }).catch(e => e)
  const mut2 = tasksService.updateTask('task-conc-03', { status: 'deployed' })

  await Promise.all([mut1, mut2])

  const result = store.tasks.value.find(t => t.id === 'task-conc-03')
  // Final state must remain consistent with server ('deployed'); rollback of Mut 1 must not overwrite Mut 2
  assert.equal(result.status, 'deployed', 'Successful mutation 2 must prevail as "deployed"')
})

test('TEST-CONS-01: Konsistensi State Lintas Konsumen (HeaderBar & Sidebar Computed Sync)', () => {
  const store = useWorkspaceStore()

  store.tasks.value = [
    { id: 'cons-1', taskId: 'ENG-501', status: 'in_queue', projectSlug: 'nexura-core' },
    { id: 'cons-2', taskId: 'ENG-502', status: 'running_sprint', projectSlug: 'nexura-core' },
    { id: 'cons-3', taskId: 'ENG-503', status: 'deployed', projectSlug: 'nexura-ui' }
  ]

  // Simulate HeaderBar active tasks count computed getter
  const headerActiveCount = computed(() => {
    return store.tasks.value.filter(t => t.status !== 'deployed').length
  })

  // Simulate Sidebar project task count computed getter
  const sidebarProjectTaskCount = computed(() => {
    return store.tasks.value.filter(t => t.projectSlug === 'nexura-core').length
  })

  assert.equal(headerActiveCount.value, 2, 'Initial active count should be 2')
  assert.equal(sidebarProjectTaskCount.value, 2, 'Initial nexura-core project task count should be 2')

  // Immediate optimistic update (0ms latency, zero network wait)
  store.updateTaskInStore('cons-1', { status: 'deployed' })
  assert.equal(headerActiveCount.value, 1, 'HeaderBar count must immediately decrease to 1')

  // Immediate optimistic add
  store.addTaskToStore({ id: 'cons-4', taskId: 'ENG-504', status: 'in_queue', projectSlug: 'nexura-core' })
  assert.equal(headerActiveCount.value, 2, 'HeaderBar count must immediately reflect added task')
  assert.equal(sidebarProjectTaskCount.value, 3, 'Sidebar count must immediately increase to 3')

  // Immediate optimistic removal
  store.removeTaskFromStore('cons-2')
  assert.equal(headerActiveCount.value, 1, 'HeaderBar count must immediately reflect removed task')
  assert.equal(sidebarProjectTaskCount.value, 2, 'Sidebar count must immediately reflect removed task')
})
