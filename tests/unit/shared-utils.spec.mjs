import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

// =============================================================================
// Shared Pure Utilities Unit & Contract Test Suite
// Testing 100% pure functions in utils/formatters.ts, utils/badges.ts,
// and utils/markdown-checklist.ts
// =============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

const jiti = createJiti(import.meta.url, {
  alias: {
    '~': projectRoot,
    '~~': projectRoot
  }
})

// Dynamic TypeScript module imports
const {
  formatTaskId,
  formatDate,
  formatRelativeTime,
  getLocalDateString,
  isOverdue
} = await jiti.import('../../utils/formatters.ts')

const {
  normalizeStatus,
  getStatusLabel,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  getPriorityColor
} = await jiti.import('../../utils/badges.ts')

const {
  parseChecklist,
  toggleChecklistStep,
  appendChecklistStep,
  removeChecklistStep
} = await jiti.import('../../utils/markdown-checklist.ts')

// =============================================================================
// 1. FORMATTERS UTILITIES (utils/formatters.ts)
// =============================================================================

test('FMT-TASKID-01: formatTaskId formats task with prefix or no prefix', () => {
  // Case 1: Standard taskId
  assert.equal(formatTaskId({ taskId: 'ENG-101' }), '#ENG-101')
  assert.equal(formatTaskId({ taskId: 'ENG-101' }, { prefix: false }), 'ENG-101')

  // Case 2: taskId already having hash prefix
  assert.equal(formatTaskId({ taskId: '#PROJ-42' }), '#PROJ-42')
  assert.equal(formatTaskId({ taskId: '#PROJ-42' }, { prefix: false }), 'PROJ-42')

  // Case 3: Fallback to id (slice first 7 chars)
  assert.equal(formatTaskId({ id: '9f8e7d6c5b4a' }), '#9f8e7d6')
  assert.equal(formatTaskId({ id: '9f8e7d6c5b4a' }, { prefix: false }), '9f8e7d6')

  // Case 4: taskId takes precedence over id
  assert.equal(formatTaskId({ taskId: 'ENG-999', id: '1234567890' }), '#ENG-999')

  // Case 5: Empty/whitespace taskId falls back to id
  assert.equal(formatTaskId({ taskId: '   ', id: 'abcdef123456' }), '#abcdef1')

  // Case 6: Nullish / missing task input defaults
  assert.equal(formatTaskId(null), '#TASK')
  assert.equal(formatTaskId(null, { prefix: false }), 'TASK')
  assert.equal(formatTaskId(undefined), '#TASK')
  assert.equal(formatTaskId({}), '#TASK')
  assert.equal(formatTaskId({}, { prefix: false }), 'TASK')
})

test('FMT-DATE-01: formatDate formats ISO dates into short and medium styles', () => {
  // Case 1: Nullish or invalid inputs
  assert.equal(formatDate(null), '')
  assert.equal(formatDate(undefined), '')
  assert.equal(formatDate(''), '')
  assert.equal(formatDate('invalid-date-string'), 'invalid-date-string')

  // Case 2: Short style (default: 'MMM D')
  const shortResult = formatDate('2026-03-15T10:00:00Z', 'short')
  assert.ok(shortResult.includes('Mar'), 'Short date should contain month name')
  assert.ok(shortResult.includes('15'), 'Short date should contain day')

  // Case 3: Medium style ('MMM D, YYYY')
  const medResult = formatDate('2026-03-15T10:00:00Z', 'medium')
  assert.ok(medResult.includes('Mar'), 'Medium date should contain month name')
  assert.ok(medResult.includes('15'), 'Medium date should contain day')
  assert.ok(medResult.includes('2026'), 'Medium date should contain year')
})

test('FMT-RELTIME-01: formatRelativeTime converts timestamps into humanized relative descriptions', () => {
  // Case 1: Nullish and invalid inputs
  assert.equal(formatRelativeTime(null), '')
  assert.equal(formatRelativeTime(undefined), '')
  assert.equal(formatRelativeTime('not-a-date'), 'not-a-date')

  const nowMs = Date.now()

  // Case 2: Future date or <= 60 seconds ago -> 'just now'
  const futureIso = new Date(nowMs + 10000).toISOString()
  assert.equal(formatRelativeTime(futureIso), 'just now')

  const justNowIso = new Date(nowMs - 15000).toISOString()
  assert.equal(formatRelativeTime(justNowIso), 'just now')

  // Case 3: Minutes ago (< 60m)
  const fiveMinAgoIso = new Date(nowMs - 5 * 60 * 1000).toISOString()
  assert.equal(formatRelativeTime(fiveMinAgoIso), '5m ago')

  // Case 4: Hours ago (< 24h)
  const threeHoursAgoIso = new Date(nowMs - 3 * 3600 * 1000).toISOString()
  assert.equal(formatRelativeTime(threeHoursAgoIso), '3h ago')

  // Case 5: Yesterday (1 day ago)
  const yesterdayIso = new Date(nowMs - 25 * 3600 * 1000).toISOString()
  assert.equal(formatRelativeTime(yesterdayIso), 'yesterday')

  // Case 6: Few days ago (< 7d)
  const fourDaysAgoIso = new Date(nowMs - 4 * 24 * 3600 * 1000).toISOString()
  assert.equal(formatRelativeTime(fourDaysAgoIso), '4d ago')

  // Case 7: Older than 7 days -> fallback to formatted date (e.g. 'Jan 1')
  const twoWeeksAgoIso = new Date(nowMs - 14 * 24 * 3600 * 1000).toISOString()
  const formattedOld = formatRelativeTime(twoWeeksAgoIso)
  assert.ok(typeof formattedOld === 'string' && formattedOld.length > 0)
  assert.ok(!formattedOld.includes('ago'))
})

test('FMT-LOCALDATE-01: getLocalDateString returns ISO date string with day offset', () => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/

  // Case 1: Today (offset 0)
  const today = getLocalDateString(0)
  assert.ok(dateRegex.test(today), 'Must conform to YYYY-MM-DD format')

  // Case 2: Default argument (offset 0)
  assert.equal(getLocalDateString(), today)

  // Case 3: Tomorrow (offset +1)
  const tomorrow = getLocalDateString(1)
  assert.ok(dateRegex.test(tomorrow), 'Must conform to YYYY-MM-DD format')

  // Case 4: Yesterday (offset -1)
  const yesterday = getLocalDateString(-1)
  assert.ok(dateRegex.test(yesterday), 'Must conform to YYYY-MM-DD format')

  assert.notEqual(today, tomorrow)
  assert.notEqual(today, yesterday)
})

test('FMT-OVERDUE-01: isOverdue accurately detects if a due date has strictly passed local midnight', () => {
  // Case 1: Nullish and invalid inputs
  assert.equal(isOverdue(null), false)
  assert.equal(isOverdue(undefined), false)
  assert.equal(isOverdue('invalid-date'), false)

  // Case 2: Yesterday is overdue
  const yesterdayIso = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  assert.equal(isOverdue(yesterdayIso), true)

  // Case 3: Today is not overdue
  const todayStr = getLocalDateString(0)
  assert.equal(isOverdue(todayStr), false)

  // Case 4: Tomorrow is not overdue
  const tomorrowStr = getLocalDateString(1)
  assert.equal(isOverdue(tomorrowStr), false)
})

// =============================================================================
// 2. BADGE & VISUAL TAG UTILITIES (utils/badges.ts)
// =============================================================================

test('BADGE-NORM-01: normalizeStatus maps legacy, synonym, and formatted status strings into canonical TaskStatus', () => {
  // Case 1: Nullish / empty inputs default to 'in_queue'
  assert.equal(normalizeStatus(null), 'in_queue')
  assert.equal(normalizeStatus(undefined), 'in_queue')
  assert.equal(normalizeStatus(''), 'in_queue')

  // Case 2: Idea synonyms
  assert.equal(normalizeStatus('idea'), 'idea')
  assert.equal(normalizeStatus('ideas'), 'idea')
  assert.equal(normalizeStatus('IDEA'), 'idea')

  // Case 3: In Queue synonyms
  assert.equal(normalizeStatus('in_queue'), 'in_queue')
  assert.equal(normalizeStatus('in-queue'), 'in_queue')
  assert.equal(normalizeStatus('queue'), 'in_queue')
  assert.equal(normalizeStatus('todo'), 'in_queue')
  assert.equal(normalizeStatus('backlog'), 'in_queue')
  assert.equal(normalizeStatus('in_review'), 'in_queue')

  // Case 4: Running Sprint synonyms
  assert.equal(normalizeStatus('running_sprint'), 'running_sprint')
  assert.equal(normalizeStatus('running'), 'running_sprint')
  assert.equal(normalizeStatus('in_progress'), 'running_sprint')
  assert.equal(normalizeStatus('in-progress'), 'running_sprint')
  assert.equal(normalizeStatus('in_flight'), 'running_sprint')
  assert.equal(normalizeStatus('inflight'), 'running_sprint')
  assert.equal(normalizeStatus('active'), 'running_sprint')

  // Case 5: Deployed synonyms
  assert.equal(normalizeStatus('deployed'), 'deployed')
  assert.equal(normalizeStatus('done'), 'deployed')
  assert.equal(normalizeStatus('completed'), 'deployed')
  assert.equal(normalizeStatus('shipped'), 'deployed')

  // Case 6: Blocked synonyms
  assert.equal(normalizeStatus('blocked'), 'blocked')
  assert.equal(normalizeStatus('block'), 'blocked')
  assert.equal(normalizeStatus('rejected'), 'blocked')

  // Case 7: Unknown status defaults to 'in_queue'
  assert.equal(normalizeStatus('unknown_status_xyz'), 'in_queue')
})

test('BADGE-LABEL-01: getStatusLabel returns human-readable label for any status', () => {
  assert.equal(getStatusLabel(null), 'In Queue')
  assert.equal(getStatusLabel(undefined), 'In Queue')
  assert.equal(getStatusLabel('idea'), 'Idea')
  assert.equal(getStatusLabel('in_queue'), 'In Queue')
  assert.equal(getStatusLabel('todo'), 'In Queue')
  assert.equal(getStatusLabel('running_sprint'), 'Running')
  assert.equal(getStatusLabel('in_progress'), 'Running')
  assert.equal(getStatusLabel('deployed'), 'Deployed')
  assert.equal(getStatusLabel('done'), 'Deployed')
  assert.equal(getStatusLabel('blocked'), 'Blocked')
})

test('BADGE-CLASS-01: getStatusBadgeClass returns Tailwind class set conforming to Obsidian Bento design', () => {
  assert.equal(getStatusBadgeClass(null), 'bg-white/5 text-[#8A8F9E] border-white/10')
  assert.equal(getStatusBadgeClass(undefined), 'bg-white/5 text-[#8A8F9E] border-white/10')

  assert.equal(getStatusBadgeClass('idea'), 'bg-amber-500/15 text-amber-300 border-amber-500/30')
  assert.equal(getStatusBadgeClass('in_queue'), 'bg-white/5 text-[#8A8F9E] border-white/10')
  assert.equal(getStatusBadgeClass('running_sprint'), 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30')
  assert.equal(getStatusBadgeClass('deployed'), 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30')
  assert.equal(getStatusBadgeClass('blocked'), 'bg-rose-500/15 text-rose-400 border-rose-500/30')
})

test('BADGE-PRIORITY-01: getPriorityBadgeClass and getPriorityColor return appropriate classes and hex colors', () => {
  // Badge Classes
  assert.equal(getPriorityBadgeClass('critical'), 'bg-rose-500/15 text-rose-400 border-rose-500/30')
  assert.equal(getPriorityBadgeClass('high'), 'bg-amber-500/15 text-amber-400 border-amber-500/30')
  assert.equal(getPriorityBadgeClass('medium'), 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30')
  assert.equal(getPriorityBadgeClass('low'), 'bg-white/5 text-[#8A8F9E] border-white/10')
  assert.equal(getPriorityBadgeClass(null), 'bg-white/5 text-[#8A8F9E] border-white/10')
  assert.equal(getPriorityBadgeClass('unknown'), 'bg-white/5 text-[#8A8F9E] border-white/10')

  // Hex Colors
  assert.equal(getPriorityColor('critical'), '#F43F5E')
  assert.equal(getPriorityColor('high'), '#F59E0B')
  assert.equal(getPriorityColor('medium'), '#EAB308')
  assert.equal(getPriorityColor('low'), '#8A8F9E')
  assert.equal(getPriorityColor(null), '#8A8F9E')
  assert.equal(getPriorityColor('unknown'), '#8A8F9E')
})

// =============================================================================
// 3. MARKDOWN CHECKLIST UTILITIES (utils/markdown-checklist.ts)
// =============================================================================

test('CHK-PARSE-01: parseChecklist extracts checklist items with completed flag and line index', () => {
  // Case 1: Empty or nullish inputs
  assert.deepEqual(parseChecklist(''), [])
  assert.deepEqual(parseChecklist(null), [])
  assert.deepEqual(parseChecklist(undefined), [])

  // Case 2: Markdown with mixed content and checklist items
  const md = `# Title
Some introductory paragraph.

- [ ] Step 1: Design database schema
- [x] Step 2: Implement repository
* [ ] Step 3: Add API route
* [X] Step 4: Write comprehensive tests

Footer note.`

  const items = parseChecklist(md)
  assert.equal(items.length, 4)

  assert.deepEqual(items[0], {
    index: 3,
    completed: false,
    text: 'Step 1: Design database schema'
  })

  assert.deepEqual(items[1], {
    index: 4,
    completed: true,
    text: 'Step 2: Implement repository'
  })

  assert.deepEqual(items[2], {
    index: 5,
    completed: false,
    text: 'Step 3: Add API route'
  })

  assert.deepEqual(items[3], {
    index: 6,
    completed: true,
    text: 'Step 4: Write comprehensive tests'
  })
})

test('CHK-TOGGLE-01: toggleChecklistStep toggles completion status by line index and item index', () => {
  const initialMd = `- [ ] Task A
- [x] Task B`

  // Case 1: Toggle Task A (line index 0: uncompleted -> completed)
  const toggledA = toggleChecklistStep(initialMd, 0)
  assert.equal(toggledA, `- [x] Task A\n- [x] Task B`)

  // Case 2: Toggle Task B (line index 1: completed -> uncompleted)
  const toggledB = toggleChecklistStep(initialMd, 1)
  assert.equal(toggledB, `- [ ] Task A\n- [ ] Task B`)

  // Case 3: Toggle by parsed item index fallback
  const complexMd = `# Header
Paragraph here

- [ ] Item 0
- [x] Item 1`

  // Checklist items are at line 3 (item 0) and line 4 (item 1).
  // Passing item index 1 (which line 1 is not a checklist item, triggers itemIndex fallback):
  const toggledItem1 = toggleChecklistStep(complexMd, 1)
  assert.ok(toggledItem1.includes('- [ ] Item 1'), 'Item 1 should be toggled from [x] to [ ]')

  // Case 4: Invalid index or empty markdown returns untouched
  assert.equal(toggleChecklistStep('', 0), '')
  assert.equal(toggleChecklistStep(initialMd, 999), initialMd)
})

test('CHK-APPEND-01: appendChecklistStep appends items with formatting safety', () => {
  const base = '- [ ] First task'

  // Case 1: Appends simple text with default - [ ] prefix
  const appended = appendChecklistStep(base, 'Second task')
  assert.equal(appended, '- [ ] First task\n- [ ] Second task')

  // Case 2: Appends text that already has - [ ] or * [ ] prefix without duplication
  const appendedExisting = appendChecklistStep(base, '- [ ] Pre-formatted task')
  assert.equal(appendedExisting, '- [ ] First task\n- [ ] Pre-formatted task')

  // Case 3: Empty stepText returns markdown unchanged
  assert.equal(appendChecklistStep(base, ''), base)
  assert.equal(appendChecklistStep(base, '   '), base)

  // Case 4: Appending to empty markdown
  assert.equal(appendChecklistStep('', 'Initial task'), '- [ ] Initial task')

  // Case 5: Markdown with trailing newline does not create extra blank lines
  assert.equal(appendChecklistStep('- [ ] First\n', 'Second'), '- [ ] First\n- [ ] Second')
})

test('CHK-REMOVE-01: removeChecklistStep removes checklist items by line index or item index', () => {
  const md = `- [ ] Task 1
- [ ] Task 2
- [ ] Task 3`

  // Case 1: Remove by direct line index
  const removedFirst = removeChecklistStep(md, 0)
  assert.equal(removedFirst, '- [ ] Task 2\n- [ ] Task 3')

  // Case 2: Remove middle item
  const removedMiddle = removeChecklistStep(md, 1)
  assert.equal(removedMiddle, '- [ ] Task 1\n- [ ] Task 3')

  // Case 3: Remove by item index fallback
  const complexMd = `# Title\n\n- [ ] Subtask 0\n- [ ] Subtask 1`
  // Subtask 0 is at line 2. Item 1 is Subtask 1 at line 3.
  const removedItem1 = removeChecklistStep(complexMd, 1)
  assert.ok(!removedItem1.includes('Subtask 1'), 'Subtask 1 must be removed')
  assert.ok(removedItem1.includes('Subtask 0'), 'Subtask 0 must be preserved')

  // Case 4: Out of bounds index or empty markdown returns untouched
  assert.equal(removeChecklistStep('', 0), '')
  assert.equal(removeChecklistStep(md, 999), md)
})
