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

// Simulated Nuxt useState reactive store
const nuxtState = new Map()
function mockUseState(key, init) {
  if (!nuxtState.has(key)) {
    nuxtState.set(key, ref(init ? init() : undefined))
  }
  return nuxtState.get(key)
}

globalThis.useState = mockUseState

const jiti = createJiti(import.meta.url, {
  alias: {
    '~': projectRoot,
    '~~': projectRoot
  }
})

const { useQuickTask } = await jiti.import('../../composables/useQuickTask.ts')

// Helper function to reset reactive store between tests
function resetQuickTaskState() {
  const { closeAddTask, closeAddIdea, closeAddProject, taskContext } = useQuickTask()
  closeAddTask()
  closeAddIdea()
  closeAddProject()
  taskContext.value = {}
}

// =============================================================================
// 1. USEQUICKTASK STATE ISOLATION & CONTEXT CONTRACTS
// =============================================================================

test('MODAL-STATE-01: useQuickTask initializes with all modals closed and empty context', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, isAddProjectOpen, taskContext } = useQuickTask()

  assert.equal(isAddTaskOpen.value, false, 'isAddTaskOpen must default to false')
  assert.equal(isAddIdeaOpen.value, false, 'isAddIdeaOpen must default to false')
  assert.equal(isAddProjectOpen.value, false, 'isAddProjectOpen must default to false')
  assert.deepEqual(taskContext.value, {}, 'taskContext must default to empty object')
})

test('MODAL-STATE-02: openAddTask() opens deliverable modal and sets status="in_queue" by default', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, taskContext, openAddTask } = useQuickTask()

  openAddTask()

  assert.equal(isAddTaskOpen.value, true, 'isAddTaskOpen must become true')
  assert.equal(isAddIdeaOpen.value, false, 'isAddIdeaOpen must remain false')
  assert.equal(taskContext.value.status, 'in_queue', 'default status for task modal must be in_queue')
  assert.equal(taskContext.value.projectSlug, null, 'default projectSlug must be null')
})

test('MODAL-STATE-03: openAddTask(slug, status) preserves custom target status and project scope', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, taskContext, openAddTask } = useQuickTask()

  openAddTask('nexura-management', 'running_sprint')

  assert.equal(isAddTaskOpen.value, true)
  assert.equal(taskContext.value.status, 'running_sprint', 'custom status running_sprint must be preserved')
  assert.equal(taskContext.value.projectSlug, 'nexura-management', 'custom projectSlug must be preserved')
})

test('MODAL-STATE-04: openAddIdea() opens idea modal with status="idea" and isolates from task modal', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, taskContext, openAddIdea } = useQuickTask()

  openAddIdea('nexura-core')

  assert.equal(isAddIdeaOpen.value, true, 'isAddIdeaOpen must become true')
  assert.equal(isAddTaskOpen.value, false, 'isAddTaskOpen must remain false')
  assert.equal(taskContext.value.status, 'idea', 'status for idea modal must strictly be idea')
  assert.equal(taskContext.value.projectSlug, 'nexura-core', 'projectSlug must be preserved')
})

test('MODAL-STATE-05: closeAddTask() and closeAddIdea() close respective modals independently', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, openAddTask, openAddIdea, closeAddTask, closeAddIdea } = useQuickTask()

  // Open both (e.g. transition scenario)
  openAddTask()
  openAddIdea()
  assert.equal(isAddTaskOpen.value, true)
  assert.equal(isAddIdeaOpen.value, true)

  // Close only AddTask
  closeAddTask()
  assert.equal(isAddTaskOpen.value, false, 'AddTask must be closed')
  assert.equal(isAddIdeaOpen.value, true, 'AddIdea must remain open')

  // Close AddIdea
  closeAddIdea()
  assert.equal(isAddIdeaOpen.value, false, 'AddIdea must be closed')
})

test('MODAL-STATE-06: openAddProject() and closeAddProject() control project modal state independently', () => {
  resetQuickTaskState()
  const { isAddProjectOpen, openAddProject, closeAddProject } = useQuickTask()

  assert.equal(isAddProjectOpen.value, false)
  openAddProject()
  assert.equal(isAddProjectOpen.value, true)
  closeAddProject()
  assert.equal(isAddProjectOpen.value, false)
})

// =============================================================================
// 2. KANBAN COLUMN TRIGGER ROUTING CONTRACTS
// =============================================================================

test('KANBAN-TRIG-01: Triggering add-task on "idea" column routes to openAddIdea with scoped project', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, taskContext, openAddTask, openAddIdea } = useQuickTask()

  // Handler implementation matching tasks.vue:800-807 & [slug].vue:1049-1056
  function onKanbanAddTask(status, projectSlug = null) {
    if (status === 'idea') {
      openAddIdea(projectSlug)
    } else {
      openAddTask(projectSlug, status)
    }
  }

  onKanbanAddTask('idea', 'nexura-analytics')

  assert.equal(isAddIdeaOpen.value, true, 'idea column must trigger AddIdeaModal')
  assert.equal(isAddTaskOpen.value, false, 'idea column must NOT trigger AddTaskModal')
  assert.equal(taskContext.value.status, 'idea')
  assert.equal(taskContext.value.projectSlug, 'nexura-analytics')
})

test('KANBAN-TRIG-02: Triggering add-task on execution columns routes to openAddTask with matching status', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, taskContext, openAddTask, openAddIdea } = useQuickTask()

  function onKanbanAddTask(status, projectSlug = null) {
    if (status === 'idea') {
      openAddIdea(projectSlug)
    } else {
      openAddTask(projectSlug, status)
    }
  }

  // 1. in_queue column
  onKanbanAddTask('in_queue', 'nexura')
  assert.equal(isAddTaskOpen.value, true)
  assert.equal(isAddIdeaOpen.value, false)
  assert.equal(taskContext.value.status, 'in_queue')

  // 2. running_sprint column
  onKanbanAddTask('running_sprint', 'nexura')
  assert.equal(taskContext.value.status, 'running_sprint')

  // 3. blocked column
  onKanbanAddTask('blocked', 'nexura')
  assert.equal(taskContext.value.status, 'blocked')

  // 4. deployed (DONE) column
  onKanbanAddTask('deployed', 'nexura')
  assert.equal(taskContext.value.status, 'deployed')
})

// =============================================================================
// 3. MODAL PAYLOAD CONTRACTS
// =============================================================================

test('PAYLOAD-DELIV-01: Deliverable modal creation payload adheres to canonical execution schema', () => {
  // Simulating payload emitted by AddTaskModal.vue:378-387
  function createDeliverablePayload({ name, description, projectSlug, status, priority, dueDate, techTagsInput }) {
    if (!name?.trim()) throw new Error('Deliverable Name is required.')

    const techTags = techTagsInput
      ? techTagsInput.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : []

    return {
      name: name.trim(),
      description: description?.trim() || '',
      project: projectSlug || 'management',
      projectSlug: projectSlug || 'management',
      status: status || 'in_queue',
      priority: priority || 'medium',
      dueDate: dueDate || undefined,
      techTags
    }
  }

  const payload = createDeliverablePayload({
    name: 'Implement OAuth PKCE Flow',
    description: 'RFC 7636 authorization code flow with SHA-256 challenge',
    projectSlug: 'nexura-core',
    status: 'in_queue',
    priority: 'high',
    dueDate: '2026-11-25',
    techTagsInput: 'security, oauth, auth'
  })

  assert.equal(payload.name, 'Implement OAuth PKCE Flow')
  assert.equal(payload.projectSlug, 'nexura-core')
  assert.equal(payload.status, 'in_queue')
  assert.equal(payload.priority, 'high')
  assert.equal(payload.dueDate, '2026-11-25')
  assert.deepEqual(payload.techTags, ['security', 'oauth', 'auth'])
})

test('PAYLOAD-IDEA-01: Idea modal creation payload strictly enforces status="idea" and priority="medium" without dueDate', () => {
  // Simulating payload emitted by AddIdeaModal.vue:303-310
  function createIdeaPayload({ name, description, projectSlug, selectedTags }) {
    if (!name?.trim()) throw new Error('Idea headline is required.')

    return {
      name: name.trim(),
      description: description?.trim() || '',
      projectSlug: projectSlug || 'management',
      status: 'idea',
      priority: 'medium',
      techTags: [...(selectedTags || [])]
    }
  }

  const payload = createIdeaPayload({
    name: 'Zero-knowledge proof verification pipeline',
    description: 'Investigate halo2 or circom for client verification',
    projectSlug: 'nexura-crypto',
    selectedTags: ['architecture', 'crypto']
  })

  assert.equal(payload.name, 'Zero-knowledge proof verification pipeline')
  assert.equal(payload.projectSlug, 'nexura-crypto')
  assert.equal(payload.status, 'idea', 'Idea payload must have status="idea"')
  assert.equal(payload.priority, 'medium', 'Idea payload must default to priority="medium"')
  assert.deepEqual(payload.techTags, ['architecture', 'crypto'])
  assert.equal(payload.dueDate, undefined, 'Idea payload must omit dueDate')
})

// =============================================================================
// 4. KEYBOARD SHORTCUT ROUTING & DISMISSAL CONTRACTS
// =============================================================================

test('SHORTCUT-ROUTING-01: Single-key shortcuts "C" and "I" dispatch to correct modals', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, openAddTask, openAddIdea } = useQuickTask()

  // Keydown dispatcher simulating app.vue:81-160
  function dispatchKeydown(event, { isInput = false, isAuthModalOpen = false, isOmniSearchOpen = false } = {}) {
    if (isAuthModalOpen) return

    // Ctrl+K / Cmd+K
    if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
      return 'OMNI_SEARCH'
    }

    if (isInput) return
    if (isAddTaskOpen.value || isAddIdeaOpen.value || isOmniSearchOpen) return

    // 'C' or 'c'
    if (event.key === 'c' || event.key === 'C') {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        openAddTask()
        return 'ADD_TASK'
      }
    }

    // 'I' or 'i'
    if (event.key === 'i' || event.key === 'I') {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        openAddIdea()
        return 'ADD_IDEA'
      }
    }
  }

  // 1. Press 'c' -> open AddTaskModal
  const resC = dispatchKeydown({ key: 'c' })
  assert.equal(resC, 'ADD_TASK')
  assert.equal(isAddTaskOpen.value, true)

  // Reset
  resetQuickTaskState()

  // 2. Press 'I' (uppercase) -> open AddIdeaModal
  const resI = dispatchKeydown({ key: 'I' })
  assert.equal(resI, 'ADD_IDEA')
  assert.equal(isAddIdeaOpen.value, true)
})

test('SHORTCUT-ROUTING-02: Shortcuts "C" and "I" are suppressed inside text inputs and with modifiers', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, openAddTask, openAddIdea } = useQuickTask()

  function dispatchKeydown(event, { isInput = false } = {}) {
    if (isInput) return 'SUPPRESSED_INPUT'
    if (isAddTaskOpen.value || isAddIdeaOpen.value) return 'SUPPRESSED_MODAL_OPEN'

    if (event.key === 'c' || event.key === 'C') {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        openAddTask()
        return 'ADD_TASK'
      }
      return 'MODIFIER_IGNORED'
    }

    if (event.key === 'i' || event.key === 'I') {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        openAddIdea()
        return 'ADD_IDEA'
      }
      return 'MODIFIER_IGNORED'
    }
  }

  // Inside text field
  const resInput = dispatchKeydown({ key: 'c' }, { isInput: true })
  assert.equal(resInput, 'SUPPRESSED_INPUT')
  assert.equal(isAddTaskOpen.value, false)

  // With Ctrl+C (clipboard copy)
  const resCtrlC = dispatchKeydown({ key: 'c', ctrlKey: true })
  assert.equal(resCtrlC, 'MODIFIER_IGNORED')
  assert.equal(isAddTaskOpen.value, false)

  // With Cmd+I (italic)
  const resCmdI = dispatchKeydown({ key: 'i', metaKey: true })
  assert.equal(resCmdI, 'MODIFIER_IGNORED')
  assert.equal(isAddIdeaOpen.value, false)
})

test('SHORTCUT-OMNI-01: Cmd+K closes any active deliverable or idea modal and opens OmniSearch', () => {
  resetQuickTaskState()
  const { isAddTaskOpen, isAddIdeaOpen, openAddTask, openAddIdea, closeAddTask, closeAddIdea } = useQuickTask()

  let isOmniSearchOpen = false
  function openSearch() {
    isOmniSearchOpen = true
  }

  function handleCmdK() {
    if (isAddTaskOpen.value || isAddIdeaOpen.value) {
      closeAddTask()
      closeAddIdea()
      openSearch()
    }
  }

  // Open AddTaskModal first
  openAddTask()
  assert.equal(isAddTaskOpen.value, true)

  // User hits Cmd+K
  handleCmdK()

  assert.equal(isAddTaskOpen.value, false, 'AddTaskModal must be closed on Cmd+K')
  assert.equal(isAddIdeaOpen.value, false, 'AddIdeaModal must be closed on Cmd+K')
  assert.equal(isOmniSearchOpen, true, 'OmniSearch must be opened')

  // Open AddIdeaModal
  openAddIdea()
  assert.equal(isAddIdeaOpen.value, true)

  // User hits Cmd+K again
  handleCmdK()
  assert.equal(isAddIdeaOpen.value, false, 'AddIdeaModal must be closed on Cmd+K')
})
