import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

// In-Memory Storage Adapter Simulation for Nitro Repositories
const inMemoryStore = new Map()
globalThis.useStorage = () => ({
  getItem: async (key) => inMemoryStore.get(key) ?? null,
  setItem: async (key, value) => {
    inMemoryStore.set(key, value)
  },
  removeItem: async (key) => {
    inMemoryStore.delete(key)
  }
})

globalThis.defineEventHandler = (fn) => fn

const jiti = createJiti(import.meta.url, {
  alias: {
    '~': projectRoot,
    '~~': projectRoot
  }
})

const { NitroNoteRepository } = await jiti.import('../../server/repositories/nitro/nitro-note.repository.ts')
const { default: promoteHandler } = await jiti.import('../../server/api/notes/[id]/promote.post.ts')

// Helper function to reset in-memory state before each test
function resetInMemoryStorage() {
  inMemoryStore.clear()
}

// =============================================================================
// 1. SMART PROMOTION CATEGORY MAPPING (FASE 2 CONTRACT VERIFICATION)
// =============================================================================

test('SMART-PROMOTE-BUG: Note promotion with category bug assigns in_queue status and high priority', async () => {
  resetInMemoryStorage()
  const noteRepo = new NitroNoteRepository()

  const note = await noteRepo.create({
    projectSlug: 'nexura-core',
    category: 'bug',
    content: 'Memory leak in real-time notification socket listener'
  })

  assert.equal(note.category, 'bug')
  assert.equal(note.promotedTaskId, null)

  const result = await noteRepo.promoteToTask(note.id)

  // Verify created task contracts
  assert.ok(result.task, 'Promote result must contain a created task')
  assert.equal(result.task.status, 'in_queue', 'Bug note MUST be promoted directly to in_queue column')
  assert.equal(result.task.priority, 'high', 'Bug note MUST have default priority high')
  assert.deepEqual(result.task.techTags, ['scratchpad', 'bug'], 'Bug note task MUST have techTags [scratchpad, bug]')
  assert.equal(result.task.projectSlug, 'nexura-core')
  assert.equal(result.task.name, 'Memory leak in real-time notification socket listener')

  // Verify updated note contracts
  assert.ok(result.note, 'Promote result must return the updated note')
  assert.equal(result.note.promotedTaskId, result.task.id, 'Note promotedTaskId must match created task ID')

  // Verify persistence in repository
  const persistedNote = await noteRepo.findById(note.id)
  assert.equal(persistedNote?.promotedTaskId, result.task.id)
})

test('SMART-PROMOTE-MAINT: Note promotion with category maintenance assigns in_queue status and medium priority', async () => {
  resetInMemoryStorage()
  const noteRepo = new NitroNoteRepository()

  const note = await noteRepo.create({
    projectSlug: 'nexura-core',
    category: 'maintenance',
    content: 'Upgrade TypeScript compiler and rotate signing secrets'
  })

  assert.equal(note.category, 'maintenance')
  assert.equal(note.promotedTaskId, null)

  const result = await noteRepo.promoteToTask(note.id)

  // Verify created task contracts
  assert.ok(result.task, 'Promote result must contain a created task')
  assert.equal(result.task.status, 'in_queue', 'Maintenance note MUST be promoted directly to in_queue column')
  assert.equal(result.task.priority, 'medium', 'Maintenance note MUST have default priority medium')
  assert.deepEqual(result.task.techTags, ['scratchpad', 'maintenance'], 'Maintenance note task MUST have techTags [scratchpad, maintenance]')
  assert.equal(result.task.projectSlug, 'nexura-core')

  // Verify updated note
  assert.equal(result.note.promotedTaskId, result.task.id)
})

test('SMART-PROMOTE-IDEA: Note promotion with category idea assigns idea status and medium priority', async () => {
  resetInMemoryStorage()
  const noteRepo = new NitroNoteRepository()

  const note = await noteRepo.create({
    projectSlug: 'nexura-core',
    category: 'idea',
    content: 'Evaluate local IndexedDB vector search for workspace assets'
  })

  assert.equal(note.category, 'idea')
  assert.equal(note.promotedTaskId, null)

  const result = await noteRepo.promoteToTask(note.id)

  // Verify created task contracts
  assert.ok(result.task, 'Promote result must contain a created task')
  assert.equal(result.task.status, 'idea', 'Idea note MUST remain in idea column')
  assert.equal(result.task.priority, 'medium', 'Idea note MUST have default priority medium')
  assert.deepEqual(result.task.techTags, ['scratchpad', 'idea'], 'Idea note task MUST have techTags [scratchpad, idea]')
  assert.equal(result.task.projectSlug, 'nexura-core')

  // Verify updated note
  assert.equal(result.note.promotedTaskId, result.task.id)
})

test('SMART-PROMOTE-OVERRIDES: Promotion respects custom priority and dueDate overrides', async () => {
  resetInMemoryStorage()
  const noteRepo = new NitroNoteRepository()

  // Case 1: Overriding an idea note to critical priority and explicit dueDate
  const ideaNote = await noteRepo.create({
    projectSlug: 'nexura-core',
    category: 'idea',
    content: 'Spike on zero-downtime database replication'
  })

  const res1 = await noteRepo.promoteToTask(ideaNote.id, {
    priority: 'critical',
    dueDate: '2026-11-20'
  })

  assert.equal(res1.task.status, 'idea', 'Status remains idea')
  assert.equal(res1.task.priority, 'critical', 'Override priority critical must be respected')
  assert.equal(res1.task.dueDate, '2026-11-20', 'Override dueDate must be respected')

  // Case 2: Overriding a bug note to low priority
  const bugNote = await noteRepo.create({
    projectSlug: 'nexura-core',
    category: 'bug',
    content: 'Minor cosmetic glitch on 4K display'
  })

  const res2 = await noteRepo.promoteToTask(bugNote.id, {
    priority: 'low'
  })

  assert.equal(res2.task.status, 'in_queue', 'Status remains in_queue for bug')
  assert.equal(res2.task.priority, 'low', 'Override priority low must be respected')
})

test('SMART-PROMOTE-IDEMPOTENCY: Re-promoting an already promoted note rejects with HTTP 409 Conflict', async () => {
  resetInMemoryStorage()
  const noteRepo = new NitroNoteRepository()

  const note = await noteRepo.create({
    projectSlug: 'nexura-core',
    category: 'bug',
    content: 'Critical race condition on concurrent checkout'
  })

  // First promotion: Success
  const firstResult = await noteRepo.promoteToTask(note.id)
  assert.ok(firstResult.task.id)

  // Second promotion: Must reject with HTTP 409
  let caughtError = null
  try {
    await noteRepo.promoteToTask(note.id)
  } catch (err) {
    caughtError = err
  }

  assert.ok(caughtError, 'Re-promoting note must throw an error')
  assert.equal(caughtError.statusCode, 409, 'Error status code must be 409 Conflict')
  assert.equal(
    caughtError.statusMessage,
    'Note has already been promoted to a task',
    'Status message must indicate already promoted'
  )
})

test('SMART-PROMOTE-NOT-FOUND: Promoting non-existent note throws HTTP 404 Not Found', async () => {
  resetInMemoryStorage()
  const noteRepo = new NitroNoteRepository()

  let caughtError = null
  try {
    await noteRepo.promoteToTask('non-existent-note-uuid-999')
  } catch (err) {
    caughtError = err
  }

  assert.ok(caughtError, 'Promoting non-existent note must throw an error')
  assert.equal(caughtError.statusCode, 404, 'Error status code must be 404 Not Found')
  assert.equal(caughtError.statusMessage, 'Note not found', 'Status message must be Note not found')
})

// =============================================================================
// 2. END-TO-END ROUTE HANDLER VERIFICATION (server/api/notes/[id]/promote.post.ts)
// =============================================================================

test('SMART-PROMOTE-HANDLER-E2E: promote.post.ts executes successfully via withApiHandler wrapper', async () => {
  resetInMemoryStorage()
  const noteRepo = new NitroNoteRepository()

  const note = await noteRepo.create({
    projectSlug: 'nexura-analytics',
    category: 'bug',
    content: 'Dashboard metrics telemetry graph tooltip clipping'
  })

  const event = {
    context: {
      params: { id: note.id }
    }
  }

  const response = await promoteHandler(event)

  assert.equal(response.success, true, 'Handler response must indicate success: true')
  assert.ok(response.task, 'Handler response must include created task')
  assert.equal(response.task.status, 'in_queue', 'Handler must reflect smart category mapping for bug')
  assert.equal(response.task.priority, 'high')
  assert.deepEqual(response.task.techTags, ['scratchpad', 'bug'])
  assert.equal(response.note.promotedTaskId, response.task.id)

  // Test handler 409 Conflict rejection
  await assert.rejects(
    async () => {
      await promoteHandler(event)
    },
    (err) => {
      return err.statusCode === 409 && err.statusMessage === 'Note has already been promoted to a task'
    },
    'Subsequent handler call must throw HTTP 409 Conflict'
  )

  // Test handler 404 Not Found rejection
  await assert.rejects(
    async () => {
      await promoteHandler({ context: { params: { id: 'missing-uuid-abc' } } })
    },
    (err) => {
      return err.statusCode === 404 && err.statusMessage === 'Note not found'
    },
    'Handler call with missing ID must throw HTTP 404 Not Found'
  )
})

// =============================================================================
// 3. FRONTEND FALLBACK PROMOTION INTEGRITY (IdeaScratchpadPanel.vue)
// =============================================================================

test('SCRATCHPAD-PANEL-FALLBACK: IdeaScratchpadPanel fallback mirrors smart category mapping contracts', () => {
  const panelFilePath = path.resolve(projectRoot, 'components/notes/IdeaScratchpadPanel.vue')
  const content = fs.readFileSync(panelFilePath, 'utf-8')

  // Verify bug fallback mapping
  assert.match(
    content,
    /if\s*\(\s*note\.category\s*===\s*'bug'\s*\)\s*\{[\s\S]*?fallbackStatus\s*=\s*'in_queue'[\s\S]*?fallbackPriority\s*=\s*'high'/s,
    'IdeaScratchpadPanel fallback must map category bug to in_queue and high'
  )

  // Verify maintenance fallback mapping
  assert.match(
    content,
    /else\s+if\s*\(\s*note\.category\s*===\s*'maintenance'\s*\)\s*\{[\s\S]*?fallbackStatus\s*=\s*'in_queue'[\s\S]*?fallbackPriority\s*=\s*'medium'/s,
    'IdeaScratchpadPanel fallback must map category maintenance to in_queue and medium'
  )

  // Verify idea fallback mapping
  assert.match(
    content,
    /else\s*\{[\s\S]*?fallbackStatus\s*=\s*'idea'[\s\S]*?fallbackPriority\s*=\s*'medium'/s,
    'IdeaScratchpadPanel fallback must map other categories to idea and medium'
  )
})

// =============================================================================
// 4. KANBAN DONE PRESENTATION MAPPING CONTRACT (KanbanBoard.vue)
// =============================================================================

test('KANBAN-DONE-CONTRACT: Column 5 presents title="DONE", subtitle="Completed & deployed", status="deployed"', () => {
  const boardFilePath = path.resolve(projectRoot, 'components/KanbanBoard.vue')
  const content = fs.readFileSync(boardFilePath, 'utf-8')

  // Verify column 5 presentation attributes
  assert.match(content, /status="deployed"/, 'Column 5 must preserve internal status="deployed" for DB/API compatibility')
  assert.match(content, /title="DONE"/, 'Column 5 title must be presentation mapped to "DONE"')
  assert.match(content, /subtitle="Completed & deployed"/, 'Column 5 subtitle must be "Completed & deployed"')
  assert.match(content, /empty-title="NO COMPLETED DELIVERABLES"/, 'Column 5 empty-title must be "NO COMPLETED DELIVERABLES"')

  // Verify filtering logic preserves deployedTasks mapping strictly to status === 'deployed'
  assert.match(
    content,
    /deployedTasks\s*=\s*computed\(\(\)\s*=>\s*processedTasks\.value\.filter\(\(t\)\s*=>\s*t\.status\s*===\s*'deployed'\)/,
    'deployedTasks computed must strictly filter tasks with status === "deployed"'
  )
})

// =============================================================================
// 5. KANBAN QUICK-ADD ELIMINATION & FLUID CARD HEIGHT (KanbanColumn.vue & TaskCard.vue)
// =============================================================================

test('KANBAN-QUICK-ADD-ELIMINATION: Duplicate bottom Quick Add button is removed from KanbanColumn.vue', () => {
  const columnFilePath = path.resolve(projectRoot, 'components/kanban/KanbanColumn.vue')
  const content = fs.readFileSync(columnFilePath, 'utf-8')

  // Verify that the duplicate bottom button with quickAddBtnClass is eliminated
  assert.equal(
    content.includes('quickAddBtnClass'),
    false,
    'KanbanColumn.vue must NOT contain duplicate quickAddBtnClass footer button'
  )

  // Verify that header Add button is preserved and emits add-task with status
  assert.match(
    content,
    /@click="\$emit\('add-task',\s*status\)"/,
    'Header Add button must be preserved and emit add-task with status'
  )
})

test('TASKCARD-FLUID-HEIGHT: TaskCard.vue replaces rigid 180px fixed height with fluid min-h-[105px] h-auto', () => {
  const cardFilePath = path.resolve(projectRoot, 'components/TaskCard.vue')
  const content = fs.readFileSync(cardFilePath, 'utf-8')

  // Verify rigid fixed height is removed
  assert.equal(
    content.includes('h-[180px] min-h-[180px] max-h-[180px]'),
    false,
    'TaskCard.vue must NOT contain rigid fixed height h-[180px]'
  )

  // Verify fluid compact height is present
  assert.match(
    content,
    /min-h-\[105px\]\s+h-auto/,
    'TaskCard.vue must use fluid compact height min-h-[105px] h-auto'
  )
})
