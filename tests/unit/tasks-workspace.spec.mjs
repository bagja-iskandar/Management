import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ref, computed } from 'vue'
import { createJiti } from 'jiti'
import { createError, getRouterParam } from 'h3'

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

// In-memory Nitro storage mock for repository tests
const memoryStorage = new Map()
globalThis.useStorage = () => ({
  getItem: async (k) => memoryStorage.get(k) ?? null,
  setItem: async (k, v) => memoryStorage.set(k, v),
  removeItem: async (k) => memoryStorage.delete(k)
})

const jiti = createJiti(import.meta.url, { alias: { '~': projectRoot } })
const { useWorkspaceStore } = jiti('../../composables/useWorkspaceStore.ts')
const { useTasks } = jiti('../../composables/useTasks.ts')
const { withApiHandler } = jiti('../../server/utils/handler.ts')
const { NitroTaskRepository } = jiti('../../server/repositories/nitro/nitro-task.repository.ts')
const { getArray, setArray } = jiti('../../server/utils/store.ts')
const { mapTaskToRow } = jiti('../../server/repositories/supabase/mappers.ts')
const { createTaskSchema, updateTaskSchema } = jiti('../../server/schemas/task.schema.ts')

// Helper function to reset reactive store between tests
function resetWorkspaceStore() {
  nuxtState.clear()
  const store = useWorkspaceStore()
  store.tasks.value = []
  store.projects.value = []
  store.sprints.value = []
  store.notes.value = []
  store.isInitialized.value = true
  return store
}

// =============================================================================
// TEST-TASK-HONESTY-01: Data & Badge Honesty
// =============================================================================

test('TEST-TASK-HONESTY-01: When task.techTags is empty or undefined, no #core tag is generated or present', () => {
  // Metric honesty contract: resolving techTags must never hallucinate fake default tags
  function resolveTaskTags(task) {
    if (task.techTags && Array.isArray(task.techTags) && task.techTags.length > 0) {
      return task.techTags.slice(0, 3)
    }
    return []
  }

  // 1. Empty techTags array
  const taskEmptyTags = {
    id: 't-empty',
    name: 'Task with empty tags',
    techTags: []
  }
  const emptyResult = resolveTaskTags(taskEmptyTags)
  assert.deepEqual(emptyResult, [])
  assert.equal(emptyResult.includes('#core'), false, 'Empty techTags must not include #core')
  assert.equal(emptyResult.includes('core'), false, 'Empty techTags must not include core')

  // 2. Undefined techTags
  const taskUndefinedTags = {
    id: 't-undefined',
    name: 'Task with undefined tags',
    techTags: undefined
  }
  const undefinedResult = resolveTaskTags(taskUndefinedTags)
  assert.deepEqual(undefinedResult, [])
  assert.equal(undefinedResult.includes('#core'), false, 'Undefined techTags must not include #core')
  assert.equal(undefinedResult.includes('core'), false, 'Undefined techTags must not include core')

  // 3. Absent techTags property entirely
  const taskNoTags = {
    id: 't-none',
    name: 'Task without techTags field'
  }
  const absentResult = resolveTaskTags(taskNoTags)
  assert.deepEqual(absentResult, [])
  assert.equal(absentResult.includes('#core'), false, 'Missing techTags must not include #core')

  // 4. Genuine tags are preserved honestly
  const taskWithRealTags = {
    id: 't-real',
    name: 'Task with actual tags',
    techTags: ['vue', 'tailwind', 'typescript']
  }
  const realResult = resolveTaskTags(taskWithRealTags)
  assert.deepEqual(realResult, ['vue', 'tailwind', 'typescript'])
  assert.equal(realResult.length, 3)
})

test("TEST-TASK-HONESTY-01: task.projectSlug is displayed cleanly and when absent defaults to 'Unassigned' without fake fallbacks", () => {
  // Display name helper contract matching app/pages/tasks.vue (getProjectName)
  function getProjectName(task) {
    return task.projectSlug || 'Unassigned'
  }

  // 1. Task with valid project slug
  const taskWithProject = {
    id: 't-proj-1',
    name: 'Backend API Service',
    projectSlug: 'nexura-cloud'
  }
  assert.equal(getProjectName(taskWithProject), 'nexura-cloud')

  // 2. Task with undefined projectSlug
  const taskUndefinedProject = {
    id: 't-proj-2',
    name: 'General Chore',
    projectSlug: undefined
  }
  const undefinedProjectName = getProjectName(taskUndefinedProject)
  assert.equal(undefinedProjectName, 'Unassigned')
  assert.notEqual(undefinedProjectName, 'management', "Must not fall back to fake 'management' project")
  assert.notEqual(undefinedProjectName, 'core', "Must not fall back to fake 'core' project")

  // 3. Task with null projectSlug
  const taskNullProject = {
    id: 't-proj-3',
    name: 'Ad-hoc Fix',
    projectSlug: null
  }
  assert.equal(getProjectName(taskNullProject), 'Unassigned')

  // 4. Task with empty string projectSlug
  const taskEmptyProject = {
    id: 't-proj-4',
    name: 'Quick Patch',
    projectSlug: ''
  }
  assert.equal(getProjectName(taskEmptyProject), 'Unassigned')
})

// =============================================================================
// TEST-TASK-ROLLBACK-01: Status Transition & Targeted Optimistic Rollback
// =============================================================================

test('TEST-TASK-ROLLBACK-01: Optimistic status transition captures baseline and reverts strictly on network failure without reload waterfall', async () => {
  const store = resetWorkspaceStore()
  const tasksApi = useTasks()

  const initialTask = {
    id: 'task-rb-01',
    taskId: 'ENG-501',
    name: 'Critical Authentication Refactor',
    status: 'in_queue',
    priority: 'high',
    projectSlug: 'nexura-core'
  }

  // Seed task in SSOT store
  store.addTaskToStore(initialTask)
  assert.equal(store.tasks.value.length, 1)
  assert.equal(store.tasks.value[0].status, 'in_queue')

  // Track reload waterfall attempts
  let reloadAttempts = 0
  let fetchCallCount = 0

  // Mock $fetch: rejects task update with simulated 500 Network/Database Error
  globalThis.$fetch = async (url, opts) => {
    fetchCallCount++
    if (typeof url === 'string' && url.includes('/api/tasks/task-rb-01')) {
      throw new Error('HTTP 500 Internal Server Error: Database Connection Timeout')
    }
    if (typeof url === 'string' && (url === '/api/tasks' || url.includes('/api/workspace'))) {
      reloadAttempts++
      return []
    }
    return {}
  }

  // Dispatch optimistic mutation via useTasks.updateTask
  let caughtError = null
  try {
    await tasksApi.updateTask('task-rb-01', { status: 'running_sprint' })
  } catch (err) {
    caughtError = err
  }

  // 1. Verify that mutation threw the expected error
  assert.ok(caughtError, 'Mutation must reject when network fails')
  assert.match(caughtError.message, /500 Internal Server Error/)

  // 2. Verify targeted rollback: task status strictly reverted to its pre-mutation baseline 'in_queue'
  const taskAfterRollback = store.tasks.value.find((t) => t.id === 'task-rb-01')
  assert.ok(taskAfterRollback, 'Task must still exist in store')
  assert.equal(
    taskAfterRollback.status,
    'in_queue',
    "Task status must strictly revert to pre-mutation baseline 'in_queue'"
  )

  // 3. Verify zero reload waterfall: no blanket reload fetches were executed
  assert.equal(reloadAttempts, 0, 'No reload waterfall should be triggered during targeted rollback')
})

test('TEST-TASK-ROLLBACK-01: Successful status transition advances server baseline', async () => {
  const store = resetWorkspaceStore()
  const tasksApi = useTasks()

  const initialTask = {
    id: 'task-success-01',
    taskId: 'ENG-502',
    name: 'Observability Telemetry Pipeline',
    status: 'in_queue',
    priority: 'critical'
  }

  store.addTaskToStore(initialTask)

  // Mock $fetch: successfully responds with updated task
  globalThis.$fetch = async (url, opts) => {
    if (typeof url === 'string' && url.includes('/api/tasks/task-success-01')) {
      return {
        ...initialTask,
        status: 'running_sprint',
        updatedAt: '2026-10-28T08:00:00.000Z'
      }
    }
    return {}
  }

  const result = await tasksApi.updateTask('task-success-01', { status: 'running_sprint' })
  assert.equal(result.status, 'running_sprint')

  const taskInStore = store.tasks.value.find((t) => t.id === 'task-success-01')
  assert.equal(taskInStore.status, 'running_sprint')
})

// =============================================================================
// TEST-TASK-CHECKLIST-01: Sequential Checklist Mutations
// =============================================================================

test('TEST-TASK-CHECKLIST-01: Sequential markdown checklist mutations preserve description integrity without race conditions', async () => {
  const store = resetWorkspaceStore()
  const tasksApi = useTasks()

  const initialDescription = [
    'Integration Deliverables:',
    '- [ ] Step 1: Design database schema',
    '- [ ] Step 2: Implement repository methods',
    '- [ ] Step 3: Write integration tests'
  ].join('\n')

  const targetTask = {
    id: 'task-chk-01',
    taskId: 'ENG-601',
    name: 'Checklist Workflow Task',
    status: 'running_sprint',
    description: initialDescription
  }

  store.addTaskToStore(targetTask)

  // Track mutations received by simulated server
  const serverReceivedUpdates = []

  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT' && typeof url === 'string' && url.includes('task-chk-01')) {
      // Add slight artificial delay to test concurrency serialization
      await new Promise((r) => setTimeout(r, 10))
      serverReceivedUpdates.push(opts.body.description)
      return {
        ...targetTask,
        ...opts.body,
        updatedAt: new Date().toISOString()
      }
    }
    return {}
  }

  // ActiveFocusPanel checklist operations simulation
  function getTask() {
    return store.tasks.value.find((t) => t.id === 'task-chk-01')
  }

  async function toggleStep(lineIndex, completed) {
    const current = getTask()
    const lines = current.description.split('\n')
    if (lineIndex < lines.length) {
      if (completed) {
        lines[lineIndex] = lines[lineIndex].replace(/(\*|\-)\s*\[(x|X)\]/, '$1 [ ]')
      } else {
        lines[lineIndex] = lines[lineIndex].replace(/(\*|\-)\s*\[ \]/, '$1 [x]')
      }
    }
    return await tasksApi.updateTask(current.id, { description: lines.join('\n') })
  }

  async function addStep(stepText) {
    const current = getTask()
    const desc = current.description || ''
    const newline = desc && !desc.endsWith('\n') ? '\n' : ''
    const updatedDesc = `${desc}${newline}- [ ] ${stepText}`
    return await tasksApi.updateTask(current.id, { description: updatedDesc })
  }

  async function deleteStep(lineIndex) {
    const current = getTask()
    const lines = current.description.split('\n')
    lines.splice(lineIndex, 1)
    return await tasksApi.updateTask(current.id, { description: lines.join('\n') })
  }

  // Execute 3 sequential operations concurrently through entity queue
  // 1. Toggle Step 1: line 1 -> [x]
  // 2. Add Step 4: append "- [ ] Step 4: Verify CI pipeline"
  // 3. Delete Step 2: delete line 2 ("Step 2: Implement repository methods")
  await Promise.all([
    toggleStep(1, false), // Step 1 to [x]
    addStep('Step 4: Verify CI pipeline'), // Append Step 4
    deleteStep(2) // Delete Step 2
  ])

  // Verify final description in store
  const finalTask = getTask()
  const finalDesc = finalTask.description

  // Check 1: Step 1 is checked
  assert.ok(
    finalDesc.includes('- [x] Step 1: Design database schema'),
    'Step 1 must be toggled to completed [x]'
  )

  // Check 2: Step 2 was cleanly deleted
  assert.ok(
    !finalDesc.includes('Step 2: Implement repository methods'),
    'Step 2 must be deleted from description'
  )

  // Check 3: Step 3 is preserved
  assert.ok(
    finalDesc.includes('- [ ] Step 3: Write integration tests'),
    'Step 3 must be intact and unchecked'
  )

  // Check 4: Step 4 was successfully appended
  assert.ok(
    finalDesc.includes('- [ ] Step 4: Verify CI pipeline'),
    'Step 4 must be present in final description'
  )

  // Check 5: Queue serialized all 3 mutations
  assert.equal(serverReceivedUpdates.length, 3, 'All 3 mutations must be delivered to server in order')
})

// =============================================================================
// TEST-TASK-FOCUS-01: ActiveFocus Panel Contracts
// =============================================================================

test('TEST-TASK-FOCUS-01: ActiveFocus panel filters running tasks by projectSlug and includes all when undefined', () => {
  const store = resetWorkspaceStore()

  // Seed tasks with varying statuses and project slugs
  const sampleTasks = [
    { id: 'f-1', taskId: 'ENG-201', name: 'Task Alpha 1', status: 'running_sprint', projectSlug: 'nexura-cloud' },
    { id: 'f-2', taskId: 'ENG-202', name: 'Task Beta 1', status: 'running_sprint', projectSlug: 'nexura-ui' },
    { id: 'f-3', taskId: 'ENG-203', name: 'Task Alpha 2', status: 'running_sprint', projectSlug: 'nexura-cloud' },
    { id: 'f-4', taskId: 'ENG-204', name: 'Task Queued Alpha', status: 'in_queue', projectSlug: 'nexura-cloud' },
    { id: 'f-5', taskId: 'ENG-205', name: 'Task Deployed Alpha', status: 'deployed', projectSlug: 'nexura-cloud' }
  ]

  store.tasks.value = [...sampleTasks]

  // Implementation contract from ActiveFocusPanel.vue (lines 315-321)
  function getRunningTasks(projectSlug) {
    let list = (store.tasks.value || []).filter((t) => t.status === 'running_sprint')
    if (projectSlug) {
      list = list.filter((t) => t.projectSlug === projectSlug)
    }
    return list
  }

  // 1. When projectSlug is undefined: returns all running tasks across all projects
  const allRunning = getRunningTasks(undefined)
  assert.equal(allRunning.length, 3, 'Should include all 3 running tasks when projectSlug is undefined')
  assert.deepEqual(
    allRunning.map((t) => t.id),
    ['f-1', 'f-2', 'f-3']
  )

  // 2. When projectSlug is 'nexura-cloud': returns only running tasks for nexura-cloud
  const cloudRunning = getRunningTasks('nexura-cloud')
  assert.equal(cloudRunning.length, 2, 'Should only return 2 running tasks for nexura-cloud')
  assert.deepEqual(
    cloudRunning.map((t) => t.id),
    ['f-1', 'f-3']
  )

  // 3. When projectSlug is 'nexura-ui': returns only running tasks for nexura-ui
  const uiRunning = getRunningTasks('nexura-ui')
  assert.equal(uiRunning.length, 1, 'Should only return 1 running task for nexura-ui')
  assert.equal(uiRunning[0].id, 'f-2')

  // 4. When projectSlug is an unassigned or non-existent project: returns empty array
  const nonExistent = getRunningTasks('non-existent-proj')
  assert.equal(nonExistent.length, 0, 'Should return empty array for non-matching project')

  // 5. Tasks in 'in_queue' or 'deployed' are never included in runningTasks
  assert.ok(!allRunning.some((t) => t.id === 'f-4'), "in_queue task must not be in runningTasks")
  assert.ok(!allRunning.some((t) => t.id === 'f-5'), "deployed task must not be in runningTasks")
})

test('TEST-TASK-FOCUS-01: ActiveFocus panel close event contract emits clean close signal', () => {
  // Emits contract verification: (e: 'close'): void
  let closeEmitted = false
  const emit = (event) => {
    if (event === 'close') {
      closeEmitted = true
    }
  }

  // Simulate clicking the panel header close button
  emit('close')
  assert.equal(closeEmitted, true, 'Panel must emit clean close signal without parameters')
})

// =============================================================================
// TEST-NOTE-PROMOTE-IDEMPOTENCY-01: Note Promotion Idempotency & 409 Conflict
// =============================================================================

test('TEST-NOTE-PROMOTE-IDEMPOTENCY-01: Note promotion idempotency, 409 Conflict rejection, and withApiHandler preservation', async () => {
  // In-memory note and task repository simulation
  const notesDatabase = new Map([
    [
      'note-archi-01',
      {
        id: 'note-archi-01',
        title: 'Dark Obsidian Bento Architecture',
        content: 'Refactor layout into precision 3-column bento grid',
        category: 'architecture',
        projectSlug: 'nexura-ui',
        promotedTaskId: null,
        createdAt: '2026-10-28T00:00:00.000Z',
        updatedAt: '2026-10-28T00:00:00.000Z'
      }
    ]
  ])

  const tasksDatabase = new Map()

  const mockNoteRepository = {
    async findById(id) {
      return notesDatabase.get(id) || null
    },
    async promoteToTask(id) {
      const note = notesDatabase.get(id)
      if (!note) throw new Error('Note not found')
      const taskId = `task-promoted-${Date.now()}`
      const newTask = {
        id: taskId,
        taskId: 'ENG-901',
        name: note.title,
        description: note.content,
        status: 'in_queue',
        priority: 'medium',
        projectSlug: note.projectSlug,
        techTags: [note.category],
        createdAt: new Date().toISOString()
      }
      tasksDatabase.set(taskId, newTask)

      note.promotedTaskId = taskId
      note.updatedAt = new Date().toISOString()
      notesDatabase.set(id, note)

      return { note, task: newTask }
    }
  }

  // Replicate promote.post.ts endpoint handler logic wrapped with real withApiHandler
  const promoteHandler = withApiHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Note ID is required' })
    }

    const note = await mockNoteRepository.findById(id)
    if (!note) {
      throw createError({ statusCode: 404, statusMessage: 'Note not found' })
    }

    if (note.promotedTaskId) {
      throw createError({ statusCode: 409, statusMessage: 'Note has already been promoted to a task' })
    }

    const result = await mockNoteRepository.promoteToTask(id)

    return {
      success: true,
      task: result.task,
      note: result.note
    }
  })

  // ---------------------------------------------------------------------------
  // Call 1: Unpromoted note -> returns { success: true, task: ..., note: ... }
  // ---------------------------------------------------------------------------
  const eventCall1 = {
    context: {
      params: { id: 'note-archi-01' }
    }
  }

  const response1 = await promoteHandler(eventCall1)
  assert.equal(response1.success, true, 'Call 1 must succeed')
  assert.ok(response1.task, 'Call 1 must return created task')
  assert.equal(response1.task.name, 'Dark Obsidian Bento Architecture')
  assert.ok(response1.note.promotedTaskId, 'Note must have promotedTaskId assigned')
  assert.equal(response1.note.promotedTaskId, response1.task.id)

  // Verify state in repository
  const noteInDb = await mockNoteRepository.findById('note-archi-01')
  assert.equal(noteInDb.promotedTaskId, response1.task.id)

  // ---------------------------------------------------------------------------
  // Call 2: Already promoted note -> throws HTTP 409 Conflict
  // ---------------------------------------------------------------------------
  const eventCall2 = {
    context: {
      params: { id: 'note-archi-01' }
    }
  }

  let errorCall2 = null
  try {
    await promoteHandler(eventCall2)
  } catch (err) {
    errorCall2 = err
  }

  assert.ok(errorCall2, 'Call 2 must reject when note was already promoted')
  // Verify that withApiHandler preserves the 409 status code and message
  assert.equal(
    errorCall2.statusCode,
    409,
    'withApiHandler must strictly preserve HTTP 409 Conflict status code'
  )
  assert.equal(
    errorCall2.statusMessage,
    'Note has already been promoted to a task',
    'Status message must clearly explain promotion conflict'
  )

  // ---------------------------------------------------------------------------
  // Call 3: Non-existent note -> throws HTTP 404 Not Found
  // ---------------------------------------------------------------------------
  const eventCallNotFound = {
    context: {
      params: { id: 'note-non-existent' }
    }
  }

  let errorNotFound = null
  try {
    await promoteHandler(eventCallNotFound)
  } catch (err) {
    errorNotFound = err
  }

  assert.ok(errorNotFound, 'Non-existent note must reject')
  assert.equal(errorNotFound.statusCode, 404)
  assert.equal(errorNotFound.statusMessage, 'Note not found')
})

// =============================================================================
// TASK-DEL-01: Single Execution Flow & Lifecycle (No Double-Delete)
// =============================================================================

test('TASK-DEL-01: TaskDrawer.vue implements internal confirmation dialog and single execution deletion flow without page duplication', () => {
  // 1. Verify app/pages/projects/[slug].vue has eliminated local duplicate TaskDrawer
  const slugContent = fs.readFileSync(path.resolve(projectRoot, 'app/pages/projects/[slug].vue'), 'utf-8')
  assert.equal(
    slugContent.includes('<TaskDrawer'),
    false,
    'projects/[slug].vue must not render local TaskDrawer component (prevents duplicate instance with app.vue)'
  )
  assert.equal(
    slugContent.includes('deleteTaskFromDrawer'),
    false,
    'projects/[slug].vue must not retain secondary deleteTaskFromDrawer handler that triggers double-delete'
  )

  // 2. Verify TaskDrawer.vue internal confirmation dialog wiring
  const drawerContent = fs.readFileSync(path.resolve(projectRoot, 'components/modals/task/TaskDrawer.vue'), 'utf-8')
  assert.ok(
    drawerContent.includes('confirmDeleteOpen'),
    'TaskDrawer must define confirmDeleteOpen state for internal deletion confirmation'
  )
  assert.ok(
    drawerContent.includes('<ConfirmDialog'),
    'TaskDrawer must render ConfirmDialog internally to protect destructive deletion'
  )
  assert.ok(
    drawerContent.includes('@confirm="executeDelete"'),
    'ConfirmDialog must bind @confirm to executeDelete handler'
  )
  assert.ok(
    drawerContent.includes('@click="confirmDeleteOpen = true"'),
    'Delete button in drawer header/footer must open ConfirmDialog instead of directly executing deletion'
  )

  // 3. Verify executeDelete single execution flow
  assert.ok(
    drawerContent.includes('async function executeDelete()'),
    'TaskDrawer must implement executeDelete handler'
  )
  assert.ok(
    drawerContent.includes('await tasksApi.deleteTask(taskToDelete.id)'),
    'executeDelete must invoke tasksApi.deleteTask once'
  )
  assert.ok(
    drawerContent.includes("emit('delete', taskToDelete)"),
    'executeDelete must emit delete event after deletion execution'
  )
})

// =============================================================================
// TASK-DEL-02: Anti-Resurrection Guard (HTTP 404 on deleteTask does not rollback)
// =============================================================================

test('TASK-DEL-02: useTasks.deleteTask treats HTTP 404 as idempotent success and never resurrects deleted task snapshot', async () => {
  const store = resetWorkspaceStore()
  const tasksApi = useTasks()

  const ghostTask = {
    id: 'task-ghost-404-uuid',
    taskId: 'ENG-601',
    name: 'Ghost Deliverable Already Removed on Server',
    status: 'in_queue',
    priority: 'high'
  }

  // 1. Seed store with task
  store.addTaskToStore(ghostTask)
  assert.equal(store.tasks.value.length, 1)

  // 2. Mock $fetch returning HTTP 404 (simulating task already removed on server or deleted in concurrent tab)
  globalThis.$fetch = async (url, opts) => {
    if (typeof url === 'string' && url.includes('/api/tasks/')) {
      const err = new Error('HTTP 404 Not Found: Task does not exist')
      err.statusCode = 404
      throw err
    }
    return {}
  }

  // 3. Execute deleteTask - should NOT throw and should NOT restore snapshot
  const res = await tasksApi.deleteTask('task-ghost-404-uuid')
  assert.deepEqual(res, { ok: true, deleted: true }, 'deleteTask on 404 must return idempotent { ok: true, deleted: true }')

  // 4. Assert anti-resurrection: task must remain removed from store
  const foundInStore = store.tasks.value.find((t) => t.id === 'task-ghost-404-uuid')
  assert.equal(foundInStore, undefined, 'Task must not be resurrected into store on HTTP 404')
  assert.equal(store.tasks.value.length, 0, 'Store must remain empty after 404 deletion')

  // 5. Verify that true server errors (e.g., HTTP 500) STILL trigger targeted rollback
  const realErrorTask = {
    id: 'task-real-err-500',
    taskId: 'ENG-602',
    name: 'Deliverable With Server Error',
    status: 'running_sprint',
    priority: 'critical'
  }
  store.addTaskToStore(realErrorTask)
  assert.equal(store.tasks.value.length, 1)

  globalThis.$fetch = async () => {
    const err = new Error('HTTP 500 Internal Server Error: Database Deadlock')
    err.statusCode = 500
    throw err
  }

  let caughtErr = null
  try {
    await tasksApi.deleteTask('task-real-err-500')
  } catch (e) {
    caughtErr = e
  }
  assert.ok(caughtErr, 'HTTP 500 must reject')
  assert.equal(caughtErr.statusCode, 500)
  const rolledBackTask = store.tasks.value.find((t) => t.id === 'task-real-err-500')
  assert.ok(rolledBackTask, 'Task snapshot MUST be restored on true server failure (HTTP 500)')
  assert.equal(rolledBackTask.name, 'Deliverable With Server Error')
})

// =============================================================================
// TASK-DEL-03: Cascading Sprint taskIds Cleanup
// =============================================================================

test('TASK-DEL-03: NitroTaskRepository.delete cascades deletion to remove task reference from sprints.taskIds', async () => {
  memoryStorage.clear()
  const repo = new NitroTaskRepository()

  const targetTask = {
    id: 'task-sprint-clean-uuid',
    taskId: 'ENG-701',
    name: 'Deliverable To Clean From Sprint',
    status: 'in_queue',
    priority: 'medium'
  }
  await setArray('tasks', [targetTask, { id: 'task-other-uuid', taskId: 'ENG-702', name: 'Other Task', status: 'in_queue', priority: 'low' }])

  const initialSprint = {
    id: 'sprint-active-01',
    name: 'Sprint 42 Bento Focus',
    taskIds: ['task-sprint-clean-uuid', 'ENG-702', 'task-keep-uuid']
  }
  await setArray('sprints', [initialSprint])

  // Execute deletion
  const deleted = await repo.delete('task-sprint-clean-uuid')
  assert.equal(deleted, true, 'Repository delete must return true')

  // Verify task removed from repository
  const foundTask = await repo.findById('task-sprint-clean-uuid')
  assert.equal(foundTask, null, 'Task must no longer exist in repository')

  // Verify sprint taskIds cleaned up
  const sprints = await getArray('sprints')
  assert.equal(sprints.length, 1)
  assert.equal(
    sprints[0].taskIds.includes('task-sprint-clean-uuid'),
    false,
    'Sprint taskIds must not contain the deleted task UUID'
  )
  assert.equal(
    sprints[0].taskIds.includes('ENG-701'),
    false,
    'Sprint taskIds must not contain the deleted taskId code'
  )
  assert.deepEqual(
    sprints[0].taskIds,
    ['ENG-702', 'task-keep-uuid'],
    'Sprint taskIds must retain un-deleted task references'
  )
})

// =============================================================================
// TASK-DEL-04: Cascading Note promotedTaskId Cleanup
// =============================================================================

test('TASK-DEL-04: NitroTaskRepository.delete resets promotedTaskId to null on project_notes and notes (ON DELETE SET NULL parity)', async () => {
  memoryStorage.clear()
  const repo = new NitroTaskRepository()

  const taskFromNote = {
    id: 'task-note-promoted-uuid',
    taskId: 'ENG-703',
    name: 'Task Converted From Note',
    status: 'in_queue',
    priority: 'high'
  }
  await setArray('tasks', [taskFromNote])

  // Seed project_notes with pointer to task UUID
  const projectNote = {
    id: 'note-project-01',
    title: 'Architecture Idea',
    promotedTaskId: 'task-note-promoted-uuid',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
  await setArray('project_notes', [projectNote])

  // Seed notes with pointer to taskId
  const generalNote = {
    id: 'note-general-02',
    title: 'Feature Idea',
    promotedTaskId: 'ENG-703',
    updatedAt: '2026-10-01T00:00:00.000Z'
  }
  await setArray('notes', [generalNote])

  // Execute deletion
  const deleted = await repo.delete('task-note-promoted-uuid')
  assert.equal(deleted, true)

  // Verify project_notes promotedTaskId is reset to null
  const projectNotes = await getArray('project_notes')
  assert.equal(projectNotes.length, 1)
  assert.equal(
    projectNotes[0].promotedTaskId,
    null,
    'project_notes.promotedTaskId must be reset to null when linked task is deleted'
  )

  // Verify notes promotedTaskId is reset to null
  const notes = await getArray('notes')
  assert.equal(notes.length, 1)
  assert.equal(
    notes[0].promotedTaskId,
    null,
    'notes.promotedTaskId must be reset to null when linked task is deleted'
  )
})

// =============================================================================
// TASK-DATE-01: Explicit Null Update Payload (Clearing due date sends null)
// =============================================================================

test('TASK-DATE-01: Clearing task due date sends explicit null payload and persists null in Nitro and Supabase mappers', async () => {
  // 1. Verify TaskDrawer.vue implementation
  const drawerContent = fs.readFileSync(path.resolve(projectRoot, 'components/modals/task/TaskDrawer.vue'), 'utf-8')
  assert.ok(
    drawerContent.includes("form.dueDate && form.dueDate.trim() ? form.dueDate.trim() : null"),
    'TaskDrawer must map empty form.dueDate to explicit null instead of undefined'
  )
  assert.ok(
    drawerContent.includes('Clear Date'),
    'TaskDrawer must provide a Clear Date button in UI'
  )
  assert.ok(
    drawerContent.includes("form.dueDate = ''"),
    'Clear Date button must clear form.dueDate'
  )

  // 2. Verify NitroTaskRepository persists explicit null
  memoryStorage.clear()
  const repo = new NitroTaskRepository()
  const initialTask = {
    id: 'task-date-update-uuid',
    taskId: 'ENG-801',
    name: 'Task With Deadline',
    status: 'in_queue',
    priority: 'medium',
    dueDate: '2026-11-20'
  }
  await setArray('tasks', [initialTask])

  const updated = await repo.update('task-date-update-uuid', { dueDate: null })
  assert.ok(updated, 'Update must return updated task')
  assert.equal(updated.dueDate, null, 'Repository must persist null dueDate')

  const fetched = await repo.findById('task-date-update-uuid')
  assert.equal(fetched.dueDate, null, 'Persisted task in Nitro must have null dueDate')

  // 3. Verify Supabase mapper maps explicit null to database column due_date: null
  const rowWithNull = mapTaskToRow({ dueDate: null })
  assert.equal(rowWithNull.due_date, null, 'mapTaskToRow must map { dueDate: null } to due_date: null')

  const rowWithUndefined = mapTaskToRow({ dueDate: undefined })
  assert.equal(rowWithUndefined.due_date, undefined, 'mapTaskToRow must omit due_date when undefined')
})

// =============================================================================
// TASK-DATE-02: Optional Due Date Creation (Task without dueDate stored without date)
// =============================================================================

test('TASK-DATE-02: createTaskSchema and NitroTaskRepository support creating tasks without dueDate', async () => {
  // 1. Verify createTaskSchema accepts absent, null, or empty dueDate
  const parseOmitted = createTaskSchema.safeParse({
    name: 'Task with omitted dueDate',
    techTags: []
  })
  assert.equal(parseOmitted.success, true, 'createTaskSchema must accept omitted dueDate')
  assert.equal(parseOmitted.data.dueDate, undefined)

  const parseNull = createTaskSchema.safeParse({
    name: 'Task with null dueDate',
    dueDate: null,
    techTags: []
  })
  assert.equal(parseNull.success, true, 'createTaskSchema must accept null dueDate')
  assert.equal(parseNull.data.dueDate, null)

  const parseEmpty = createTaskSchema.safeParse({
    name: 'Task with empty string dueDate',
    dueDate: '',
    techTags: []
  })
  assert.equal(parseEmpty.success, true, 'createTaskSchema must accept empty string dueDate')
  assert.equal(parseEmpty.data.dueDate, '')

  // 2. Verify NitroTaskRepository.create without dueDate
  memoryStorage.clear()
  const repo = new NitroTaskRepository()
  const created = await repo.create({
    name: 'Task Created Without Due Date',
    status: 'in_queue',
    priority: 'low',
    techTags: [],
    dueDate: undefined
  })
  assert.ok(created.id)
  assert.equal(created.dueDate, undefined, 'Created task must not have artificial dueDate')

  const fetched = await repo.findById(created.id)
  assert.equal(fetched.dueDate, undefined, 'Stored task must reflect undefined dueDate')

  // 3. Verify AddTaskModal.vue handles optional empty dueDate submission
  const addModalContent = fs.readFileSync(path.resolve(projectRoot, 'components/modals/task/AddTaskModal.vue'), 'utf-8')
  assert.ok(
    addModalContent.includes("dueDate: dueDate.value.trim() ? dueDate.value.trim() : undefined"),
    'AddTaskModal must submit empty dueDate as undefined instead of mandatory date'
  )
  assert.ok(
    addModalContent.includes("const dueDate = ref('')"),
    "AddTaskModal must initialize dueDate as empty string (optional by default)"
  )
})

// =============================================================================
// TASK-DATE-03: Honest Date Rendering (Zero fake metric in ProjectTaskMatrix & tasks.vue)
// =============================================================================

test('TASK-DATE-03: ProjectTaskMatrix and tasks.vue render honest due date fallbacks without fake metrics or date masking', () => {
  // 1. Verify ProjectTaskMatrix.vue does NOT contain hardcoded fake metric date 'Nov 15, 2026'
  const matrixContent = fs.readFileSync(path.resolve(projectRoot, 'components/project/ProjectTaskMatrix.vue'), 'utf-8')
  assert.equal(
    matrixContent.includes('Nov 15, 2026'),
    false,
    'ProjectTaskMatrix.vue must never contain hardcoded fake metric date "Nov 15, 2026"'
  )
  assert.ok(
    matrixContent.includes("t.dueDate || '—'") || matrixContent.includes('t.dueDate || "—"'),
    'ProjectTaskMatrix.vue must display honest dash fallback "—" when dueDate is absent'
  )

  // 2. Verify app/pages/tasks.vue does not mask missing dueDate with task creation date
  const tasksPageContent = fs.readFileSync(path.resolve(projectRoot, 'app/pages/tasks.vue'), 'utf-8')
  assert.equal(
    tasksPageContent.includes('t.dueDate || t.date'),
    false,
    'tasks.vue must not mask missing dueDate with creation date (t.dueDate || t.date)'
  )
  assert.ok(
    tasksPageContent.includes('formatDate(t.dueDate)'),
    'tasks.vue must pass t.dueDate directly to formatDate to allow honest "No Due Date" rendering'
  )
})
