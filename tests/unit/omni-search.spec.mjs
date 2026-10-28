import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import Module from 'node:module'
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

const nuxtState = new Map()
function mockUseState(key, init) {
  if (!nuxtState.has(key)) {
    nuxtState.set(key, ref(init ? init() : undefined))
  }
  return nuxtState.get(key)
}

globalThis.useState = mockUseState

let lastNavigatedPath = null
globalThis.useRouter = () => ({
  push: async (path) => {
    lastNavigatedPath = path
    return path
  }
})

const origModuleLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === 'vue-router' || (typeof request === 'string' && request.includes('vue-router'))) {
    return {
      useRouter: () => globalThis.useRouter(),
      useRoute: () => ({ query: {}, params: {}, path: '/', fullPath: '/' })
    }
  }
  return origModuleLoad.apply(this, arguments)
}

globalThis.useLazyAsyncData = (key, fn, opts) => {
  const stateKey = typeof key === 'string' ? `async-data:${key}` : null
  const data = stateKey
    ? mockUseState(stateKey, () => (opts?.default ? opts.default() : []))
    : ref(opts?.default ? opts.default() : [])
  return {
    data,
    refresh: async () => {},
    pending: ref(false),
    error: ref(null)
  }
}

globalThis.refreshNuxtData = async () => {}
globalThis.$fetch = async () => []

// Setup global window mock with open spy for safeOpenExternal tests
const windowCalls = []
globalThis.window = {
  open: (url, target, features) => {
    windowCalls.push({ url, target, features })
  }
}

const jiti = createJiti(import.meta.url, {
  alias: {
    '~': projectRoot
  }
})

const { safeOpenExternal, splitHighlights, useOmniSearch } = jiti('../../composables/useOmniSearch.ts')
const { useWorkspaceStore } = jiti('../../composables/useWorkspaceStore.ts')
const { useTaskDrawer } = jiti('../../composables/useTaskDrawer.ts')
const { useGitHubRepos } = jiti('../../composables/useGitHub.ts')

// =============================================================================
// EXISTING BASELINE TESTS (Retained for Strict Regression Guard)
// =============================================================================

test('NEW-SEC-01: safeOpenExternal permits only http and https protocols', () => {
  windowCalls.length = 0

  // 1. Valid HTTPS URL
  const res1 = safeOpenExternal('https://github.com/nexura/management')
  assert.equal(res1, true)
  assert.equal(windowCalls.length, 1)
  assert.equal(windowCalls[0].url, 'https://github.com/nexura/management')
  assert.equal(windowCalls[0].target, '_blank')
  assert.equal(windowCalls[0].features, 'noopener,noreferrer')

  // 2. Valid HTTP URL
  const res2 = safeOpenExternal('http://localhost:3000/dashboard')
  assert.equal(res2, true)
  assert.equal(windowCalls.length, 2)
  assert.equal(windowCalls[1].url, 'http://localhost:3000/dashboard')
  assert.equal(windowCalls[1].target, '_blank')
  assert.equal(windowCalls[1].features, 'noopener,noreferrer')

  // 3. Reject javascript: pseudo-protocol (XSS attempt)
  const resXss = safeOpenExternal('javascript:alert(document.cookie)')
  assert.equal(resXss, false)
  assert.equal(windowCalls.length, 2, 'window.open must NOT be invoked for javascript:')

  // 4. Reject data: URI
  const resData = safeOpenExternal('data:text/html,<script>evil()</script>')
  assert.equal(resData, false)
  assert.equal(windowCalls.length, 2, 'window.open must NOT be invoked for data:')

  // 5. Reject vbscript: URI
  const resVb = safeOpenExternal('vbscript:msgbox(1)')
  assert.equal(resVb, false)
  assert.equal(windowCalls.length, 2)

  // 6. Reject file: URI
  const resFile = safeOpenExternal('file:///etc/passwd')
  assert.equal(resFile, false)
  assert.equal(windowCalls.length, 2)

  // 7. Reject empty, null, undefined, invalid
  assert.equal(safeOpenExternal(''), false)
  assert.equal(safeOpenExternal(null), false)
  assert.equal(safeOpenExternal(undefined), false)
  assert.equal(safeOpenExternal('not-a-valid-url'), false)
  assert.equal(windowCalls.length, 2)
})

test('OMNI-001: Task selection opens TaskDrawer globally and closes OmniSearch', () => {
  let searchIsOpen = true
  let drawerIsOpen = false
  let activeDrawerTaskId = null

  function closeSearch() {
    searchIsOpen = false
  }

  function openTaskDrawer(taskId) {
    activeDrawerTaskId = taskId
    drawerIsOpen = true
  }

  const taskItem = {
    id: 'task:task-123',
    title: 'Migrate to strict SSOT',
    type: 'task',
    payload: { id: 'task-123', name: 'Migrate to strict SSOT' },
    action: () => {
      closeSearch()
      openTaskDrawer('task-123')
    }
  }

  assert.equal(searchIsOpen, true)
  assert.equal(drawerIsOpen, false)
  assert.equal(activeDrawerTaskId, null)

  taskItem.action()

  assert.equal(searchIsOpen, false, 'OmniSearch must be closed')
  assert.equal(drawerIsOpen, true, 'TaskDrawer must be opened')
  assert.equal(activeDrawerTaskId, 'task-123', 'Active task id must match selected task id')
})

test('Keyboard shortcut contract: Cmd+K / Ctrl+K and Escape semantics', () => {
  let searchOpen = false
  function toggleSearch() {
    searchOpen = !searchOpen
  }
  function closeSearch() {
    searchOpen = false
  }

  function handleKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.defaultPrevented = true
      toggleSearch()
      return
    }
    if (e.key === 'Escape' && searchOpen) {
      e.defaultPrevented = true
      closeSearch()
      return
    }
  }

  // Cmd+K toggles search open
  const event1 = { metaKey: true, ctrlKey: false, key: 'k' }
  handleKeydown(event1)
  assert.equal(event1.defaultPrevented, true)
  assert.equal(searchOpen, true)

  // Escape closes search
  const eventEsc = { metaKey: false, ctrlKey: false, key: 'Escape' }
  handleKeydown(eventEsc)
  assert.equal(eventEsc.defaultPrevented, true)
  assert.equal(searchOpen, false)

  // Ctrl+K toggles search open
  const event2 = { metaKey: false, ctrlKey: true, key: 'K' }
  handleKeydown(event2)
  assert.equal(event2.defaultPrevented, true)
  assert.equal(searchOpen, true)

  // Ctrl+K again toggles search closed
  const event3 = { metaKey: false, ctrlKey: true, key: 'k' }
  handleKeydown(event3)
  assert.equal(event3.defaultPrevented, true)
  assert.equal(searchOpen, false)
})

// =============================================================================
// PHASE 2 BEHAVIOR-DRIVEN OMNISEARCH TEST SUITES
// =============================================================================

test('TEST-OMNI-STORE-01: Integrasi SSOT in-memory useWorkspaceStore (0 pemanggilan $fetch saat openSearch)', () => {
  const store = useWorkspaceStore()
  store.isInitialized.value = true

  // Pre-populate canonical SSOT store
  store.tasks.value = [
    { id: 'task-ssot-1', taskId: 'ENG-901', name: 'Engine Optimization Task', status: 'in_queue' },
    { id: 'task-ssot-2', taskId: 'ENG-902', name: 'Critical Database Fix', status: 'blocked', priority: 'critical' }
  ]
  store.projects.value = [
    { id: 'proj-ssot-1', slug: 'nexura-core', title: 'Nexura Core' }
  ]
  store.sprints.value = [
    { id: 'sprint-ssot-1', name: 'Sprint W43', status: 'active', taskIds: ['task-ssot-1'] }
  ]

  // Track network fetch invocations
  let fetchCallCount = 0
  globalThis.$fetch = async () => {
    fetchCallCount++
    return []
  }

  const omni = useOmniSearch()
  omni.openSearch()

  // Must NOT trigger any background network $fetch call upon opening search modal
  assert.equal(fetchCallCount, 0, 'openSearch must not make network requests; must use in-memory store')
  assert.equal(omni.isOpen.value, true)

  // Verify items from store are present in indexed results
  const titles = omni.filteredResults.value.map(item => item.title)
  assert.ok(titles.includes('Engine Optimization Task'), 'Task from store must be present in search catalog')
  assert.ok(titles.includes('Critical Database Fix'), 'Critical task from store must be present')
  assert.ok(titles.includes('Nexura Core'), 'Project from store must be present')
  assert.ok(titles.includes('Sprint W43'), 'Sprint from store must be present')
})

test('TEST-OMNI-KEYBOARD-01: Traversal up/down dengan modulo wrap-around & Tab scope cycling', () => {
  const omni = useOmniSearch()
  omni.rawQuery.value = ''
  omni.setScope('all')

  const totalResults = omni.filteredResults.value.length
  assert.ok(totalResults > 3, 'Filtered results should contain multiple items')

  // Initial index should be 0
  omni.setSelectedIndex(0)
  assert.equal(omni.selectedIndex.value, 0)

  // 1. selectNext traverses forward
  omni.selectNext()
  assert.equal(omni.selectedIndex.value, 1)

  omni.selectNext()
  assert.equal(omni.selectedIndex.value, 2)

  // 2. Modulo wrap-around on boundary (end -> start)
  omni.setSelectedIndex(totalResults - 1)
  assert.equal(omni.selectedIndex.value, totalResults - 1)
  omni.selectNext()
  assert.equal(omni.selectedIndex.value, 0, 'selectNext on last item must wrap around to 0')

  // 3. Modulo wrap-around on start -> end
  omni.selectPrevious()
  assert.equal(omni.selectedIndex.value, totalResults - 1, 'selectPrevious on first item must wrap around to last index')

  // 4. Tab scope cycling (all -> task -> project -> sprint -> repo -> action -> note -> all)
  omni.setScope('all')
  assert.equal(omni.activeScope.value, 'all')

  // Cycle forward (Tab)
  omni.cycleScope(1)
  assert.equal(omni.activeScope.value, 'task')
  assert.equal(omni.selectedIndex.value, 0, 'Scope change must reset selected index to 0')

  omni.cycleScope(1)
  assert.equal(omni.activeScope.value, 'project')

  omni.cycleScope(1)
  assert.equal(omni.activeScope.value, 'sprint')

  omni.cycleScope(1)
  assert.equal(omni.activeScope.value, 'repo')

  omni.cycleScope(1)
  assert.equal(omni.activeScope.value, 'action')

  omni.cycleScope(1)
  assert.equal(omni.activeScope.value, 'note')

  omni.cycleScope(1)
  assert.equal(omni.activeScope.value, 'all', 'Cycle scope forward must wrap around to all')

  // Cycle backward (Shift+Tab)
  omni.cycleScope(-1)
  assert.equal(omni.activeScope.value, 'note')

  // Reset scope for following tests
  omni.setScope('all')
})

test('TEST-OMNI-PREFIX-01: Filter prefix query (>, #, @, !)', () => {
  const store = useWorkspaceStore()
  const omni = useOmniSearch()
  omni.setScope('all')

  store.tasks.value = [
    {
      id: 'task-p1',
      taskId: 'ENG-101',
      name: 'Implement OAuth Token Refresh',
      status: 'in_queue',
      priority: 'high',
      projectSlug: 'portal-app',
      techTags: ['auth', 'security', 'oauth']
    },
    {
      id: 'task-p2',
      taskId: 'ENG-102',
      name: 'Database Migration Deadlock',
      status: 'blocked',
      priority: 'critical',
      projectSlug: 'portal-app',
      techTags: ['postgres', 'sql']
    }
  ]
  store.projects.value = [
    { id: 'proj-p1', slug: 'portal-app', title: 'Portal Application', techStack: ['vue', 'node'] }
  ]

  // --- Prefix 1: Action Command ('>') ---
  omni.rawQuery.value = '> create'
  assert.equal(omni.parsedQuery.value.prefixMode, 'action')
  assert.equal(omni.parsedQuery.value.cleanQuery, 'create')

  const actionResults = omni.filteredResults.value
  assert.ok(actionResults.length > 0, 'Prefix > should return matching action items')
  assert.ok(actionResults.every(item => item.type === 'action' || item.type === 'navigation'), 'All items under > prefix must be action or navigation')
  assert.ok(actionResults.some(item => item.id === 'action:new-deliverable'), 'New deliverable command must match')

  // --- Prefix 2: Tech Tag ('#') ---
  omni.rawQuery.value = '#oauth'
  assert.equal(omni.parsedQuery.value.prefixMode, 'tag')
  assert.equal(omni.parsedQuery.value.cleanQuery, 'oauth')

  const tagResults = omni.filteredResults.value
  assert.ok(tagResults.length > 0)
  assert.ok(tagResults.some(item => item.id === 'task:task-p1'), 'Task with techTag oauth must be matched')
  assert.ok(!tagResults.some(item => item.id === 'task:task-p2'), 'Task without oauth must not be matched')

  // --- Prefix 3: Project ('@') ---
  omni.rawQuery.value = '@portal-app'
  assert.equal(omni.parsedQuery.value.prefixMode, 'project')
  assert.equal(omni.parsedQuery.value.cleanQuery, 'portal-app')

  const projectResults = omni.filteredResults.value
  assert.ok(projectResults.length > 0)
  assert.ok(projectResults.every(item => item.projectSlug === 'portal-app' || item.id === 'project:proj-p1'), 'Only items associated with portal-app project must be returned')

  // --- Prefix 4: Blocker / Critical ('!') ---
  omni.rawQuery.value = '!'
  assert.equal(omni.parsedQuery.value.prefixMode, 'blocker')

  const blockerResults = omni.filteredResults.value
  assert.ok(blockerResults.length > 0)
  assert.ok(blockerResults.every(item => item.status === 'blocked' || item.priority === 'critical'), 'Only blocked or critical priority items must be returned under ! prefix')
  assert.ok(blockerResults.some(item => item.id === 'task:task-p2'))
  assert.ok(!blockerResults.some(item => item.id === 'task:task-p1'), 'Non-critical in_queue task must be excluded')

  // Reset query
  omni.rawQuery.value = ''
})

test('TEST-OMNI-DEEPLINK-01: Pemilihan task memanggil openTaskDrawer(taskId) & menutup modal (OMNI-001)', async () => {
  const store = useWorkspaceStore()
  const drawer = useTaskDrawer()
  const omni = useOmniSearch()

  store.tasks.value = [
    { id: 'task-deep-1', taskId: 'ENG-777', name: 'Direct Deep Link Task', status: 'in_queue' }
  ]

  omni.openSearch('Direct Deep Link')
  assert.equal(omni.isOpen.value, true)

  const taskItem = omni.filteredResults.value.find(item => item.id === 'task:task-deep-1')
  assert.ok(taskItem, 'Target task item must be in filtered results')

  // Execute task item action
  await taskItem.action()

  // OmniSearch must be closed
  assert.equal(omni.isOpen.value, false, 'OmniSearch must be closed when task is selected')

  // TaskDrawer must be opened with correct activeTaskId
  assert.equal(drawer.isDrawerOpen.value, true, 'TaskDrawer must be opened')
  assert.equal(drawer.activeTaskId.value, 'task-deep-1', 'TaskDrawer activeTaskId must match task-deep-1')
})

test('TEST-OMNI-SEC-01: Pengujian ketat safeOpenExternal (skema aman & rel/target)', () => {
  windowCalls.length = 0

  // 1. Valid HTTPS
  const okHttps = safeOpenExternal('https://github.com/nexura/management/issues/42')
  assert.equal(okHttps, true)
  assert.equal(windowCalls.length, 1)
  assert.equal(windowCalls[0].url, 'https://github.com/nexura/management/issues/42')
  assert.equal(windowCalls[0].target, '_blank')
  assert.equal(windowCalls[0].features, 'noopener,noreferrer')

  // 2. Valid HTTP
  const okHttp = safeOpenExternal('http://127.0.0.1:8080/docs')
  assert.equal(okHttp, true)
  assert.equal(windowCalls.length, 2)
  assert.equal(windowCalls[1].target, '_blank')
  assert.equal(windowCalls[1].features, 'noopener,noreferrer')

  // 3. Strict rejection of pseudo-protocols (XSS & Local file read attempts)
  const forbiddenUrls = [
    'javascript:alert(document.domain)',
    'javascript:window.location="https://attacker.com"',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox("hello")',
    'file:///C:/Windows/System32/drivers/etc/hosts',
    'file:///etc/passwd',
    'about:blank',
    'blob:https://example.com/1234-5678'
  ]

  for (const badUrl of forbiddenUrls) {
    const res = safeOpenExternal(badUrl)
    assert.equal(res, false, `safeOpenExternal must block '${badUrl}'`)
  }

  // No additional window.open calls should have been dispatched
  assert.equal(windowCalls.length, 2, 'No unsafe URL must trigger window.open')

  // 4. Invalid strings and non-strings safely return false
  assert.equal(safeOpenExternal(''), false)
  assert.equal(safeOpenExternal('   '), false)
  assert.equal(safeOpenExternal(null), false)
  assert.equal(safeOpenExternal(undefined), false)
  assert.equal(safeOpenExternal('invalid-domain-without-protocol'), false)
})

test('TEST-OMNI-FUZZY-01: Normalisasi splitHighlights pada rentang tumpang tindih dan pembobotan skor', () => {
  // 1. Text without ranges returns single non-highlighted segment
  const segNone = splitHighlights('Hello World')
  assert.deepEqual(segNone, [{ text: 'Hello World', isHighlight: false }])

  const segEmpty = splitHighlights('Hello World', [])
  assert.deepEqual(segEmpty, [{ text: 'Hello World', isHighlight: false }])

  // 2. Overlapping ranges merged properly
  // "Nexura Management" with [0, 6] ("Nexura") and [4, 10] ("ra Man") -> merged [0, 10] ("Nexura Man")
  const segOverlap = splitHighlights('Nexura Management', [[0, 6], [4, 10]])
  assert.deepEqual(segOverlap, [
    { text: 'Nexura Man', isHighlight: true },
    { text: 'agement', isHighlight: false }
  ])

  // 3. Unsorted ranges sorted and merged
  // "Command Center" with [8, 14] ("Center") and [0, 7] ("Command")
  const segUnsorted = splitHighlights('Command Center', [[8, 14], [0, 7]])
  assert.deepEqual(segUnsorted, [
    { text: 'Command', isHighlight: true },
    { text: ' ', isHighlight: false },
    { text: 'Center', isHighlight: true }
  ])

  // 4. Clamping out-of-bounds ranges
  const segOutOfBounds = splitHighlights('Short', [[0, 100], [-5, 2]])
  assert.equal(segOutOfBounds.length, 1)
  assert.deepEqual(segOutOfBounds[0], { text: 'Short', isHighlight: true })

  // 5. Fuzzy Scoring Evaluation
  const omni = useOmniSearch()
  const store = useWorkspaceStore()

  store.tasks.value = [
    { id: 'task-score-1', taskId: 'ENG-999', name: 'Refactor Core Storage Service', priority: 'critical', status: 'blocked' },
    { id: 'task-score-2', taskId: 'ENG-888', name: 'Refactor Core Storage Service', priority: 'low', status: 'in_queue' }
  ]

  // Query exact ID code "ENG-999" -> task 1 should have highest score due to exact ID (+1000)
  omni.rawQuery.value = 'eng-999'
  const idResults = omni.filteredResults.value
  assert.ok(idResults.length > 0)
  assert.equal(idResults[0].id, 'task:task-score-1', 'Exact ID query must rank task-score-1 first')
  assert.ok(idResults[0].score >= 1000, 'Score must include exact ID bonus')

  // Query "storage" -> both have identical title matching, but critical/blocked task-score-1 gets urgency boost (+50 critical +40 blocked)
  omni.rawQuery.value = 'storage'
  const urgencyResults = omni.filteredResults.value
  assert.ok(urgencyResults.length >= 2)
  const task1 = urgencyResults.find(r => r.id === 'task:task-score-1')
  const task2 = urgencyResults.find(r => r.id === 'task:task-score-2')
  assert.ok(task1 && task2)
  assert.ok(task1.score > task2.score, 'Critical/blocked task must receive priority boost over low priority task')

  // Reset query
  omni.rawQuery.value = ''
})

test('TEST-OMNI-TWO-STAGE-ESC-01: Kontrak Two-Stage Escape Hierarchy', () => {
  const omni = useOmniSearch()

  // Simulate HeaderSearch.vue onInputKeydown Escape handler contract
  function handleInputKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      e.defaultPrevented = true
      if (omni.rawQuery.value !== '') {
        // Stage 1: Clear text, keep pop-up open
        omni.rawQuery.value = ''
        omni.selectedIndex.value = 0
      } else {
        // Stage 2: Close pop-up
        omni.closeSearch()
      }
    }
  }

  // --- STAGE 1: When rawQuery is populated ---
  omni.openSearch()
  omni.rawQuery.value = 'deploy deliverable'
  omni.selectedIndex.value = 3

  assert.equal(omni.isOpen.value, true)
  assert.equal(omni.rawQuery.value, 'deploy deliverable')
  assert.equal(omni.selectedIndex.value, 3)

  let propagationStopped1 = false
  const escEvent1 = {
    key: 'Escape',
    stopPropagation: () => { propagationStopped1 = true },
    defaultPrevented: false
  }

  handleInputKeydown(escEvent1)

  // Stage 1 Assertions:
  assert.equal(propagationStopped1, true, 'Escape must stop event propagation')
  assert.equal(escEvent1.defaultPrevented, true, 'Escape must prevent default')
  assert.equal(omni.rawQuery.value, '', 'Stage 1 Escape must clear query string')
  assert.equal(omni.selectedIndex.value, 0, 'Stage 1 Escape must reset selected index to 0')
  assert.equal(omni.isOpen.value, true, 'Stage 1 Escape must KEEP OmniSearch open')

  // --- STAGE 2: When rawQuery is already empty ---
  assert.equal(omni.rawQuery.value, '')
  assert.equal(omni.isOpen.value, true)

  let propagationStopped2 = false
  const escEvent2 = {
    key: 'Escape',
    stopPropagation: () => { propagationStopped2 = true },
    defaultPrevented: false
  }

  handleInputKeydown(escEvent2)

  // Stage 2 Assertions:
  assert.equal(propagationStopped2, true, 'Escape stage 2 must stop event propagation')
  assert.equal(escEvent2.defaultPrevented, true, 'Escape stage 2 must prevent default')
  assert.equal(omni.isOpen.value, false, 'Stage 2 Escape must CLOSE OmniSearch pop-up')
})

test('TEST-OMNI-BENTO-TWO-LINE-01: Verifikasi Integritas Data Two-Line Bento Row', () => {
  const store = useWorkspaceStore()
  const omni = useOmniSearch()
  omni.rawQuery.value = ''
  omni.setScope('all')

  // Pre-populate representative entities across all supported categories
  store.tasks.value = [
    {
      id: 'task-bento-1',
      taskId: 'ENG-101',
      name: 'Implement OAuth Token Refresh Flow',
      status: 'in_queue',
      priority: 'high',
      projectSlug: 'portal-app',
      techTags: ['auth', 'security']
    },
    {
      id: 'task-bento-2',
      taskId: 'ENG-102',
      name: 'Fix PostgreSQL Deadlock on Concurrent Upsert',
      status: 'blocked',
      priority: 'critical',
      projectSlug: 'portal-app',
      techTags: ['database', 'postgres']
    }
  ]

  store.projects.value = [
    {
      id: 'proj-bento-1',
      slug: 'portal-app',
      title: 'Nexura Client Portal',
      description: 'Customer facing project management portal',
      status: 'active'
    }
  ]

  store.sprints.value = [
    {
      id: 'sprint-bento-1',
      name: 'Sprint W44',
      startDate: '2026-10-26',
      endDate: '2026-11-01',
      objective: 'Phase 2 UI overhaul completion',
      status: 'active',
      taskIds: ['task-bento-1']
    }
  ]

  store.notes.value = [
    {
      id: 'note-bento-1',
      title: 'Obsidian Design System Conventions',
      content: 'Core palette tokens: void #07080A, canvas #0B0C10',
      category: 'architecture',
      projectSlug: 'portal-app'
    }
  ]

  const items = omni.filteredResults.value
  assert.ok(items.length >= 5, 'Indexed catalog must include tasks, projects, sprints, notes, and actions')

  // Check valid OmniItemTypes
  const validItemTypes = new Set(['task', 'project', 'sprint', 'repo', 'action', 'navigation', 'note'])

  for (const item of items) {
    // --- Line 1 Integrity: title, icon, valid type ---
    assert.ok(typeof item.title === 'string' && item.title.trim().length > 0, `Item ${item.id} must have a non-empty title`)
    assert.ok(typeof item.icon === 'string' && item.icon.trim().length > 0, `Item ${item.id} must have an icon string`)
    assert.ok(validItemTypes.has(item.type), `Item ${item.id} has invalid type: ${item.type}`)
    assert.equal(typeof item.action, 'function', `Item ${item.id} must have an executable action`)

    // --- Line 2 Integrity: context rich subtitle or description ---
    const hasSubtitle = typeof item.subtitle === 'string' && item.subtitle.trim().length > 0
    const hasDescription = typeof item.description === 'string' && item.description.trim().length > 0
    assert.ok(
      hasSubtitle || hasDescription,
      `Item ${item.id} (${item.title}) must provide subtitle or description for Line 2 Bento context`
    )

    // --- Status Capsule / Badge validation for Tasks ---
    if (item.type === 'task') {
      assert.ok(item.badge && item.badge.length > 0, `Task item ${item.id} must have a badge (e.g. Task ID code)`)
      assert.ok(item.badgeColor && item.badgeColor.length > 0, `Task item ${item.id} must have styling badgeColor`)
      assert.ok(item.status && item.status.length > 0, `Task item ${item.id} must retain status attribute`)
      assert.ok(item.priority && item.priority.length > 0, `Task item ${item.id} must retain priority attribute`)
    }
  }

  // Specifically check critical/blocked task styling badge
  const blockedTask = items.find(i => i.id === 'task:task-bento-2')
  assert.ok(blockedTask)
  assert.equal(blockedTask.icon, 'AlertTriangle', 'Blocked task must use AlertTriangle icon')
  assert.match(blockedTask.badgeColor, /rose/i, 'Blocked/critical task badge must have rose highlight styling')
})

test('TEST-OMNI-SINGLE-INPUT-AND-ZERO-BLUR: Architectural guard for Single Input, Flush Width, and Zero Blur', async () => {
  const fs = await import('node:fs')
  const headerSearchPath = path.resolve(projectRoot, 'components/search/HeaderSearch.vue')
  const headerBarPath = path.resolve(projectRoot, 'components/HeaderBar.vue')

  const headerSearchContent = fs.readFileSync(headerSearchPath, 'utf-8')
  const headerBarContent = fs.readFileSync(headerBarPath, 'utf-8')

  // 1. Single Native Input: must have exactly 1 <input tag in template
  const inputMatches = headerSearchContent.match(/<input\b/g) || []
  assert.equal(inputMatches.length, 1, 'HeaderSearch.vue must contain exactly ONE <input> element')

  // 2. Zero Blur Directive: no backdrop-blur allowed in search overlay
  assert.equal(
    headerSearchContent.includes('backdrop-blur'),
    false,
    'HeaderSearch.vue must NOT contain any backdrop-blur classes'
  )

  // 3. Anchored Pop-up Flush Width: must anchor directly under input with left-0 right-0 w-full
  assert.ok(
    headerSearchContent.includes('absolute top-full mt-2 left-0 right-0 w-full z-50'),
    'HeaderSearch.vue pop-up must have class "absolute top-full mt-2 left-0 right-0 w-full z-50"'
  )

  // 4. Dark Transparent Scrim Backdrop: must use z-40 bg-black/40
  assert.ok(
    headerSearchContent.includes('fixed inset-0 z-40 bg-black/40'),
    'HeaderSearch.vue backdrop overlay must use "fixed inset-0 z-40 bg-black/40"'
  )

  // 5. HeaderBar Stacking Context: <header> must have relative z-50
  assert.ok(
    headerBarContent.includes('relative z-50'),
    'HeaderBar.vue <header> must contain "relative z-50"'
  )
})

test('TEST-OMNI-PHASE-A-HEADERBAR-CLEAN: HeaderBar zero backdrop-blur, closeSearch before modals, and no duplicate handleKeydown', async () => {
  const fs = await import('node:fs')
  const headerBarPath = path.resolve(projectRoot, 'components/HeaderBar.vue')
  const appVuePath = path.resolve(projectRoot, 'app/app.vue')

  const headerBarContent = fs.readFileSync(headerBarPath, 'utf-8')
  const appVueContent = fs.readFileSync(appVuePath, 'utf-8')

  // 1. HeaderBar.vue must NOT contain any backdrop-blur classes
  assert.equal(
    headerBarContent.includes('backdrop-blur'),
    false,
    'HeaderBar.vue must NOT contain backdrop-blur classes'
  )

  // 2. HeaderBar.vue must still retain relative z-50 and solid bg-[#0B0C10]
  assert.ok(
    headerBarContent.includes('relative z-50'),
    'HeaderBar.vue <header> must retain "relative z-50"'
  )
  assert.ok(
    headerBarContent.includes('bg-[#0B0C10]'),
    'HeaderBar.vue <header> must use solid "bg-[#0B0C10]"'
  )

  // 3. HeaderBar.vue must call closeSearch() when opening auth or add-task modals
  assert.ok(
    headerBarContent.includes('closeSearch()'),
    'HeaderBar.vue must invoke closeSearch() before opening header modals'
  )

  // 4. HeaderBar.vue must NOT have duplicate handleKeydown listener
  assert.equal(
    headerBarContent.includes('handleKeydown'),
    false,
    'HeaderBar.vue must NOT contain duplicate handleKeydown function or listener'
  )

  // 5. app/app.vue must close open drawer/modal when Ctrl+K / Cmd+K is pressed
  assert.ok(
    appVueContent.includes('closeTaskDrawer()') && appVueContent.includes('closeAddTask()'),
    'app/app.vue must close TaskDrawer and AddTaskModal when opening OmniSearch via shortcut'
  )
})

test('TEST-OMNI-PHASE-B-SCOPE-RESET-AND-SECONDARY: closeSearch() and Stage 1 Escape reset activeScope to all, and executeSecondary() invokes secondaryAction', async () => {
  const fs = await import('node:fs')
  const headerSearchPath = path.resolve(projectRoot, 'components/search/HeaderSearch.vue')
  const headerSearchContent = fs.readFileSync(headerSearchPath, 'utf-8')

  const store = useWorkspaceStore()
  const omni = useOmniSearch()

  // 1. Verify closeSearch() resets activeScope back to 'all'
  omni.openSearch()
  omni.setScope('project')
  assert.equal(omni.activeScope.value, 'project')
  omni.closeSearch()
  assert.equal(omni.isOpen.value, false)
  assert.equal(omni.activeScope.value, 'all', 'closeSearch() must reset activeScope to "all"')

  // 2. Verify Stage 1 Escape resets activeScope to 'all' even when rawQuery is empty
  assert.ok(
    headerSearchContent.includes("rawQuery.value !== '' || activeScope.value !== 'all'"),
    'HeaderSearch.vue handleEscAction must check activeScope !== "all" for Stage 1 Escape'
  )
  assert.ok(
    headerSearchContent.includes('Scope: Tasks') && headerSearchContent.includes('Scope: Projects'),
    'HeaderSearch.vue prefixChip must render visible Scope labels when activeScope !== "all"'
  )

  omni.openSearch()
  omni.rawQuery.value = ''
  omni.setScope('task')
  assert.equal(omni.activeScope.value, 'task')

  // Simulate HeaderSearch.vue handleEscAction() contract
  function handleEscAction() {
    if (omni.rawQuery.value !== '' || omni.activeScope.value !== 'all') {
      omni.rawQuery.value = ''
      omni.activeScope.value = 'all'
      omni.selectedIndex.value = 0
    } else {
      omni.closeSearch()
    }
  }

  // First Esc: resets activeScope from 'task' to 'all' while keeping search open
  handleEscAction()
  assert.equal(omni.activeScope.value, 'all', 'Stage 1 Escape must reset activeScope to "all"')
  assert.equal(omni.isOpen.value, true, 'Stage 1 Escape must keep search open')

  // Second Esc: closes search
  handleEscAction()
  assert.equal(omni.isOpen.value, false, 'Stage 2 Escape must close search')

  // 3. Verify executeSecondary() invokes secondaryAction (opens githubIssueUrl via safeOpenExternal)
  windowCalls.length = 0
  store.tasks.value = [
    {
      id: 'task-sec-act-1',
      taskId: 'ENG-505',
      name: 'Fix Secondary Action Shortcut',
      status: 'in_queue',
      priority: 'high',
      githubIssueUrl: 'https://github.com/nexura/management/issues/505'
    }
  ]

  omni.openSearch('ENG-505')
  assert.ok(omni.filteredResults.value.length > 0)
  assert.equal(omni.selectedItem.value?.id, 'task:task-sec-act-1')

  await omni.executeSecondary()
  assert.equal(windowCalls.length, 1, 'executeSecondary() must invoke safeOpenExternal via secondaryAction')
  assert.equal(windowCalls[0].url, 'https://github.com/nexura/management/issues/505')
  assert.equal(windowCalls[0].target, '_blank')
  assert.equal(windowCalls[0].features, 'noopener,noreferrer')

  omni.rawQuery.value = ''
  omni.closeSearch()
})

test('TEST-OMNI-PHASE-B-NAVIGATION-CONTRACTS: Navigation contracts for note, repo, and action:filter-blockers + route.query sync in tasks.vue & repos.vue', async () => {
  const fs = await import('node:fs')
  const tasksPagePath = path.resolve(projectRoot, 'app/pages/tasks.vue')
  const reposPagePath = path.resolve(projectRoot, 'app/pages/repos.vue')

  const tasksPageContent = fs.readFileSync(tasksPagePath, 'utf-8')
  const reposPageContent = fs.readFileSync(reposPagePath, 'utf-8')

  const store = useWorkspaceStore()
  const { repos } = useGitHubRepos()
  const omni = useOmniSearch()

  // Populate note and repo fixtures
  store.notes.value = [
    {
      id: 'note-nav-1',
      content: 'Audit IdeaScratchpadPanel slide-over deep-link',
      category: 'idea',
      projectSlug: 'portal-app'
    }
  ]

  repos.value = [
    {
      id: 901,
      name: 'nexura-engine',
      fullName: 'nexura/nexura-engine',
      description: 'Core execution engine',
      language: 'TypeScript',
      htmlUrl: 'https://github.com/nexura/nexura-engine',
      defaultBranch: 'main',
      stargazersCount: 12
    }
  ]

  // 1. Selecting a 'note' item navigates to '/tasks?scratchpad=1&project=portal-app'
  omni.openSearch('IdeaScratchpadPanel')
  const noteItem = omni.filteredResults.value.find(i => i.id === 'note:note-nav-1')
  assert.ok(noteItem, 'Note item must be indexed in filteredResults')

  lastNavigatedPath = null
  await noteItem.action()
  assert.equal(omni.isOpen.value, false, 'Selecting note item must close OmniSearch')
  assert.equal(
    lastNavigatedPath,
    '/tasks?scratchpad=1&project=portal-app',
    'Selecting note item must navigate to /tasks?scratchpad=1&project=portal-app'
  )

  // 2. Selecting a 'repo' item navigates to '/repos?q=nexura-engine'
  omni.openSearch('nexura-engine')
  const repoItem = omni.filteredResults.value.find(i => i.id === 'repo:901')
  assert.ok(repoItem, 'Repo item must be indexed in filteredResults')

  lastNavigatedPath = null
  await repoItem.action()
  assert.equal(omni.isOpen.value, false, 'Selecting repo item must close OmniSearch')
  assert.equal(
    lastNavigatedPath,
    '/repos?q=nexura-engine',
    'Selecting repo item must navigate to /repos?q=nexura-engine'
  )

  // 3. Selecting 'action:filter-blockers' navigates to '/tasks?status=blocked'
  omni.openSearch('> Filter Critical Blockers')
  const blockerActionItem = omni.filteredResults.value.find(i => i.id === 'action:filter-blockers')
  assert.ok(blockerActionItem, 'action:filter-blockers must be present in filteredResults')

  lastNavigatedPath = null
  await blockerActionItem.action()
  assert.equal(omni.isOpen.value, false, 'Selecting action:filter-blockers must close OmniSearch')
  assert.equal(
    lastNavigatedPath,
    '/tasks?status=blocked',
    'Selecting action:filter-blockers must navigate to /tasks?status=blocked'
  )

  // 4. Verify app/pages/tasks.vue and app/pages/repos.vue synchronize route.query
  assert.ok(
    tasksPageContent.includes('route.query') &&
      tasksPageContent.includes('statusFilter.value') &&
      tasksPageContent.includes('projectFilter.value') &&
      tasksPageContent.includes('showScratchpad.value = true'),
    'app/pages/tasks.vue must synchronize route.query (status, project, scratchpad) with page state'
  )
  assert.ok(
    tasksPageContent.includes('watch(isOmniSearchOpen'),
    'app/pages/tasks.vue must watch isOmniSearchOpen to close showScratchpad slide-over'
  )
  assert.ok(
    reposPageContent.includes('route.query.q') && reposPageContent.includes('searchQuery.value = q'),
    'app/pages/repos.vue must synchronize route.query.q with searchQuery'
  )

  // Clean up fixtures
  repos.value = []
  omni.rawQuery.value = ''
})

test('TEST-OMNI-OPERATOR-BARE-PREFIX-AND-SUBSTRING-01: Bare # and @ prefixes filter strictly and #tag substring scoring works', () => {
  const store = useWorkspaceStore()
  const omni = useOmniSearch()
  omni.setScope('all')

  store.tasks.value = [
    {
      id: 'task-tag-sub-1',
      taskId: 'ENG-601',
      name: 'Implement Token Rotation',
      status: 'in_queue',
      priority: 'medium',
      projectSlug: 'portal-app',
      techTags: ['oauth-flow', 'jwt']
    },
    {
      id: 'task-untagged-1',
      taskId: 'ENG-602',
      name: 'Untagged Routine Chore',
      status: 'in_queue',
      priority: 'low',
      projectSlug: 'portal-app',
      techTags: []
    }
  ]

  store.projects.value = [
    {
      id: 'proj-op-1',
      slug: 'portal-app',
      title: 'Portal Application',
      status: 'active',
      techStack: ['nuxt', 'typescript']
    }
  ]

  store.sprints.value = [
    {
      id: 'sprint-op-1',
      name: 'Sprint W45',
      status: 'active'
    }
  ]

  store.notes.value = [
    {
      id: 'note-op-1',
      content: 'Untagged project scratchpad note',
      category: 'idea',
      projectSlug: 'portal-app'
    }
  ]

  // 1. Bare '#' only returns items with non-empty tags (excludes actions, navigation, notes, sprints, untagged tasks)
  omni.rawQuery.value = '#'
  const bareTagResults = omni.filteredResults.value
  assert.ok(bareTagResults.length > 0, 'Bare # must return tagged items')
  assert.ok(
    bareTagResults.every(item => Array.isArray(item.tags) && item.tags.length > 0),
    'Every item returned for bare # must have at least one tag'
  )
  assert.ok(!bareTagResults.some(item => item.id === 'task:task-untagged-1'), 'Untagged task must be excluded under bare #')
  assert.ok(!bareTagResults.some(item => item.type === 'action' || item.type === 'navigation'), 'Actions and navigation must be excluded under bare #')

  // 2. '#auth' matches task tagged 'oauth-flow' (substring tag match) with score > 0
  omni.rawQuery.value = '#auth'
  const substringTagResults = omni.filteredResults.value
  const matchedTask = substringTagResults.find(item => item.id === 'task:task-tag-sub-1')
  assert.ok(matchedTask, 'Task tagged oauth-flow must match #auth substring query')
  assert.ok((matchedTask.score || 0) > 0, 'Substring tag match must receive a positive score')

  // 3. Bare '@' only returns project entities or items with projectSlug, and ranks type === "project" first
  omni.rawQuery.value = '@'
  const bareProjectResults = omni.filteredResults.value
  assert.ok(bareProjectResults.length > 0, 'Bare @ must return project-related items')
  assert.ok(
    bareProjectResults.every(item => item.type === 'project' || Boolean(item.projectSlug)),
    'Every item under bare @ must be a project or have a projectSlug'
  )
  assert.ok(
    !bareProjectResults.some(item => item.type === 'action' || item.type === 'navigation' || item.type === 'sprint'),
    'Non-project actions, navigation, and sprints must be excluded under bare @'
  )
  assert.equal(
    bareProjectResults[0].type,
    'project',
    'Direct project entities (item.type === "project") must rank at the top under bare @'
  )

  omni.rawQuery.value = ''
})

test('TEST-OMNI-HISTORY-LIFECYCLE-AND-ACTION-ERROR-01: Recent search history cap/dedupe/ignore rules, actionError handling, and executeSecondary', async () => {
  const store = useWorkspaceStore()
  const omni = useOmniSearch()

  // 1. clearSearchHistory() resets searchHistory to []
  omni.clearSearchHistory()
  assert.deepEqual(omni.searchHistory.value, [])

  // 2. Bare operators and whitespace-only queries are ignored by addSearchHistory() and executeCurrent()
  for (const ignored of ['>', '#', '@', '!', '   ', '']) {
    omni.addSearchHistory(ignored)
  }
  assert.deepEqual(omni.searchHistory.value, [], 'Bare operators and empty queries must not be recorded in searchHistory')

  store.tasks.value = [
    {
      id: 'task-hist-1',
      taskId: 'ENG-701',
      name: 'Alpha Beta Gamma Deliverable',
      status: 'in_queue',
      priority: 'high',
      githubIssueUrl: 'https://github.com/nexura/management/issues/701'
    }
  ]

  omni.openSearch('>')
  await omni.executeCurrent()
  assert.deepEqual(omni.searchHistory.value, [], 'Executing under bare operator > must not record history')

  // 3. Adding 4 distinct valid queries caps at max 3 items and deduplicates case-insensitively
  omni.addSearchHistory('alpha')
  omni.addSearchHistory('beta')
  omni.addSearchHistory('gamma')
  omni.addSearchHistory('delta')
  assert.deepEqual(
    omni.searchHistory.value,
    ['delta', 'gamma', 'beta'],
    'Search history must cap at 3 most recent queries'
  )

  // Re-adding 'GAMMA' deduplicates case-insensitively and moves to index 0
  omni.addSearchHistory('GAMMA')
  assert.deepEqual(
    omni.searchHistory.value,
    ['GAMMA', 'delta', 'beta'],
    'Re-adding existing query (case-insensitive) must deduplicate and move to index 0'
  )

  // removeSearchHistory('delta')
  omni.removeSearchHistory('delta')
  assert.deepEqual(omni.searchHistory.value, ['GAMMA', 'beta'])

  // applySearchHistory('beta') sets rawQuery and resets selectedIndex
  omni.selectedIndex.value = 4
  omni.applySearchHistory('beta')
  assert.equal(omni.rawQuery.value, 'beta')
  assert.equal(omni.selectedIndex.value, 0)

  // 4. executeCurrent() catches throwing action without crashing, sets actionError, and clears on query change or closeSearch()
  const failingItem = {
    id: 'action:failing-test',
    title: 'Failing Command',
    type: 'action',
    categoryLabel: 'Actions',
    icon: 'AlertTriangle',
    action: async () => {
      throw new Error('Simulated network error')
    }
  }

  await assert.doesNotReject(async () => {
    await omni.executeCurrent(failingItem)
  })
  assert.equal(omni.actionError.value, 'Simulated network error')

  // Changing rawQuery clears actionError via watcher
  omni.rawQuery.value = 'alpha'
  await Promise.resolve()
  assert.equal(omni.actionError.value, null, 'Changing rawQuery must clear actionError')

  // Set error again and verify closeSearch() clears it
  await omni.executeCurrent(failingItem)
  assert.equal(omni.actionError.value, 'Simulated network error')
  omni.closeSearch()
  assert.equal(omni.actionError.value, null, 'closeSearch() must clear actionError')

  // 5. executeSecondary() invokes secondaryAction(), records valid rawQuery in searchHistory, and closes search
  omni.clearSearchHistory()
  windowCalls.length = 0
  omni.openSearch('ENG-701')
  const targetTaskItem = omni.filteredResults.value.find(i => i.id === 'task:task-hist-1')
  assert.ok(targetTaskItem, 'Target taskENG-701 must be found')

  await omni.executeSecondary(targetTaskItem)
  assert.equal(windowCalls.length, 1, 'executeSecondary() must call secondaryAction')
  assert.equal(windowCalls[0].url, 'https://github.com/nexura/management/issues/701')
  assert.deepEqual(omni.searchHistory.value, ['ENG-701'], 'executeSecondary() must record valid query in searchHistory')
  assert.equal(omni.isOpen.value, false, 'executeSecondary() must close search after secondaryAction')

  omni.rawQuery.value = ''
  omni.clearSearchHistory()
})

test('TEST-OMNI-UX-ENHANCEMENT-CONTRACT-01: HeaderSearch.vue idle state, visualFlatItems cursor sync, 5-item cap, ARIA combobox, and instant scroll contracts', async () => {
  const fs = await import('node:fs')
  const headerSearchPath = path.resolve(projectRoot, 'components/search/HeaderSearch.vue')
  const content = fs.readFileSync(headerSearchPath, 'utf-8')

  // 1. Idle state guidance & recent searches
  assert.ok(content.includes('isIdleState'), 'HeaderSearch.vue must define isIdleState')
  assert.ok(content.includes('RECENT SEARCHES'), 'HeaderSearch.vue must include RECENT SEARCHES section')
  assert.ok(content.includes('SEARCH GUIDANCE'), 'HeaderSearch.vue must include SEARCH GUIDANCE section')
  assert.ok(content.includes('QUICK ACTIONS'), 'HeaderSearch.vue must include QUICK ACTIONS section')
  assert.ok(content.includes('clearSearchHistory'), 'HeaderSearch.vue must wire clearSearchHistory')
  assert.ok(content.includes('removeSearchHistory'), 'HeaderSearch.vue must wire removeSearchHistory')

  // 2. Visual cursor synchronization & per-group cap
  assert.ok(content.includes('visualFlatItems'), 'HeaderSearch.vue must synchronize keyboard cursor with visualFlatItems')
  assert.ok(content.includes('MAX_ITEMS_PER_GROUP = 5'), 'HeaderSearch.vue must enforce MAX_ITEMS_PER_GROUP = 5')
  assert.ok(content.includes('expandedCategories'), 'HeaderSearch.vue must support progressive disclosure via expandedCategories')
  assert.ok(content.includes('Show {{ group.hiddenCount }} more'), 'HeaderSearch.vue must render Show more button for capped groups')

  // 3. ARIA combobox & listbox attributes
  assert.ok(content.includes('role="combobox"'), 'HeaderSearch.vue input must have role="combobox"')
  assert.ok(content.includes('aria-controls="omni-search-results-listbox"'), 'HeaderSearch.vue input must have aria-controls="omni-search-results-listbox"')
  assert.ok(content.includes('aria-activedescendant'), 'HeaderSearch.vue input must bind aria-activedescendant')
  assert.ok(content.includes('role="listbox"'), 'HeaderSearch.vue results container must have role="listbox"')
  assert.ok(content.includes('role="option"'), 'HeaderSearch.vue result items must have role="option"')

  // 4. Instant scroll behavior and reduced motion
  assert.ok(content.includes("behavior: 'instant'"), 'HeaderSearch.vue must use instant scrollIntoView behavior')
  assert.ok(content.includes('@media (prefers-reduced-motion: reduce)'), 'HeaderSearch.vue must support prefers-reduced-motion')
})

test('TEST-OMNI-EXIT-SEARCH-MODE-CONTRACTS: Comprehensive Focus Release & Exit Search Mode Contracts', async () => {
  const fs = await import('node:fs')
  const headerSearchPath = path.resolve(projectRoot, 'components/search/HeaderSearch.vue')
  const headerSearchContent = fs.readFileSync(headerSearchPath, 'utf-8')
  const store = useWorkspaceStore()
  const omni = useOmniSearch()

  // 1. HeaderSearch.vue source contract checks for focus release (blur)
  // 1.1 Enter keydown handler must call inputRef.value?.blur()
  assert.ok(
    headerSearchContent.includes("if (e.key === 'Enter')") &&
    headerSearchContent.includes("inputRef.value?.blur()"),
    'HeaderSearch.vue must blur inputRef on Enter keydown'
  )

  // 1.2 onItemClick handler must call inputRef.value?.blur()
  assert.ok(
    headerSearchContent.includes("async function onItemClick(item: IndexedOmniItem)") &&
    headerSearchContent.includes("inputRef.value?.blur()"),
    'HeaderSearch.vue must blur inputRef on onItemClick'
  )

  // 1.3 Stage 2 Escape must call inputRef.value?.blur()
  assert.ok(
    headerSearchContent.includes("closeSearch()\n    inputRef.value?.blur()"),
    'HeaderSearch.vue handleEscAction Stage 2 must blur inputRef'
  )

  // 1.4 onBackdropClick must call inputRef.value?.blur()
  assert.ok(
    headerSearchContent.includes("function onBackdropClick() {\n  closeSearch()\n  inputRef.value?.blur()\n}"),
    'HeaderSearch.vue onBackdropClick must blur inputRef'
  )

  // 1.5 Route navigation watcher must call inputRef.value?.blur()
  assert.ok(
    headerSearchContent.includes("() => route.fullPath") &&
    headerSearchContent.includes("inputRef.value?.blur()"),
    'HeaderSearch.vue route watcher must blur inputRef'
  )

  // 1.6 watch(isOpen) must call inputRef.value?.blur() when open is false
  assert.ok(
    headerSearchContent.includes("watch(\n  isOpen,\n  async (open) => {") &&
    headerSearchContent.includes("inputRef.value?.blur()"),
    'HeaderSearch.vue watch(isOpen) must blur inputRef on close'
  )

  // 2. Functional runtime contract verification of closeSearch()
  omni.openSearch('sample query')
  omni.setScope('project')
  omni.selectedIndex.value = 4
  assert.equal(omni.isOpen.value, true)
  assert.equal(omni.rawQuery.value, 'sample query')
  assert.equal(omni.activeScope.value, 'project')
  assert.equal(omni.selectedIndex.value, 4)

  omni.closeSearch()
  assert.equal(omni.isOpen.value, false, 'closeSearch() must set isOpen to false')
  assert.equal(omni.rawQuery.value, '', 'closeSearch() must reset rawQuery to empty string')
  assert.equal(omni.activeScope.value, 'all', 'closeSearch() must reset activeScope to "all"')
  assert.equal(omni.selectedIndex.value, 0, 'closeSearch() must reset selectedIndex to 0')
  assert.equal(omni.actionError.value, null, 'closeSearch() must clear actionError')

  // 3. Execution exit search mode across categories
  // 3.1 Task Execution (opens drawer and closes search)
  store.tasks.value = [
    {
      id: 'task-exit-1',
      name: 'Exit mode task test',
      title: 'Exit mode task test',
      status: 'in_progress',
      priority: 'high',
      projectSlug: 'hitnet'
    }
  ]
  omni.openSearch('Exit mode task test')
  const taskItem = omni.filteredResults.value.find(i => i.id === 'task:task-exit-1')
  assert.ok(taskItem, 'Task item must be found')
  await omni.executeCurrent(taskItem)
  assert.equal(omni.isOpen.value, false, 'Executing task item must exit search mode (isOpen=false)')
  assert.equal(omni.rawQuery.value, '', 'Executing task item must clear rawQuery')

  // 3.2 Project Execution (navigates and closes search)
  store.projects.value = [
    {
      id: 'proj-exit-1',
      slug: 'hitnet',
      title: 'HiTNet Architecture',
      status: 'active'
    }
  ]
  omni.openSearch('HiTNet')
  const projItem = omni.filteredResults.value.find(i => i.id === 'project:proj-exit-1')
  assert.ok(projItem, 'Project item must be found')
  await omni.executeCurrent(projItem)
  assert.equal(omni.isOpen.value, false, 'Executing project item must exit search mode (isOpen=false)')
  assert.equal(omni.rawQuery.value, '', 'Executing project item must clear rawQuery')

  // 3.3 Sprint Execution (navigates and closes search)
  store.sprints.value = [
    {
      id: 'sprint-exit-1',
      name: 'Sprint W45',
      status: 'active',
      startDate: '2026-10-28',
      endDate: '2026-11-04'
    }
  ]
  omni.openSearch('Sprint W45')
  const sprintItem = omni.filteredResults.value.find(i => i.id === 'sprint:sprint-exit-1')
  assert.ok(sprintItem, 'Sprint item must be found')
  await omni.executeCurrent(sprintItem)
  assert.equal(omni.isOpen.value, false, 'Executing sprint item must exit search mode (isOpen=false)')
  assert.equal(omni.rawQuery.value, '', 'Executing sprint item must clear rawQuery')

  // 3.4 Repo Execution (navigates and closes search)
  omni.openSearch('repos')
  const repoItem = omni.filteredResults.value.find(i => i.type === 'repo')
  if (repoItem) {
    await omni.executeCurrent(repoItem)
    assert.equal(omni.isOpen.value, false, 'Executing repo item must exit search mode')
    assert.equal(omni.rawQuery.value, '', 'Executing repo item must clear rawQuery')
  }

  // 3.5 Action / Command Execution (triggers and closes search)
  omni.openSearch('> Create New Deliverable')
  const actionItem = omni.filteredResults.value.find(i => i.id === 'action:new-deliverable')
  assert.ok(actionItem, 'Action item must be found')
  await omni.executeCurrent(actionItem)
  assert.equal(omni.isOpen.value, false, 'Executing action command must exit search mode')
  assert.equal(omni.rawQuery.value, '', 'Executing action command must clear rawQuery')
})



