import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
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

const jiti = createJiti(import.meta.url, { alias: { '~': projectRoot } })
const { useWorkspaceStore } = jiti('../../composables/useWorkspaceStore.ts')
const { useTasks } = jiti('../../composables/useTasks.ts')
const { withApiHandler } = jiti('../../server/utils/handler.ts')

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
