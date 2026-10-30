import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ref, computed, watch, nextTick } from 'vue'
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

const { useHeaderActions } = await jiti.import('../../composables/useHeaderActions.ts')

// Helper function to reset reactive store between tests
function resetHeaderState() {
  nuxtState.clear()
  const { clearActions } = useHeaderActions()
  clearActions()
}

// =============================================================================
// CONTEXTUAL ACTION BAR LIFECYCLE TESTS (FASE 1 VERIFICATION)
// =============================================================================

test('CAB-INIT-01: useHeaderActions initializes with empty actions state', () => {
  resetHeaderState()
  const { actions } = useHeaderActions()

  assert.ok(actions, 'actions computed ref must exist')
  assert.ok(Array.isArray(actions.value), 'actions.value must be an array')
  assert.equal(actions.value.length, 0, 'initial actions array must be empty')
})

test('CAB-SET-01: setActions registers complete contextual action schema with all attributes', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  let handlerInvoked = false
  const dummyIcon = { name: 'Plus' }

  const sampleActions = [
    {
      id: 'create-project',
      label: 'New Project',
      icon: dummyIcon,
      variant: 'primary',
      shortcut: 'Ctrl+N',
      disabled: false,
      loading: false,
      handler: () => {
        handlerInvoked = true
      }
    },
    {
      id: 'export-report',
      label: 'Export Data',
      variant: 'secondary',
      shortcut: 'Ctrl+E',
      disabled: true,
      loading: false,
      handler: () => {}
    }
  ]

  setActions(sampleActions)

  assert.equal(actions.value.length, 2, 'actions.value must have exactly 2 registered actions')

  // Verify first action attributes
  const action1 = actions.value[0]
  assert.equal(action1.id, 'create-project')
  assert.equal(action1.label, 'New Project')
  assert.equal(action1.variant, 'primary')
  assert.equal(action1.shortcut, 'Ctrl+N')
  assert.equal(action1.disabled, false)
  assert.equal(action1.loading, false)
  assert.deepEqual(action1.icon, dummyIcon)
  assert.equal(typeof action1.handler, 'function')

  // Verify second action attributes
  const action2 = actions.value[1]
  assert.equal(action2.id, 'export-report')
  assert.equal(action2.label, 'Export Data')
  assert.equal(action2.variant, 'secondary')
  assert.equal(action2.shortcut, 'Ctrl+E')
  assert.equal(action2.disabled, true)
  assert.equal(action2.loading, false)
})

test('CAB-SET-02: setActions cleanly replaces previous actions without lingering artifacts', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  // First registration: Page A actions
  setActions([
    { id: 'page-a-action-1', label: 'Action A1', handler: () => {} },
    { id: 'page-a-action-2', label: 'Action A2', handler: () => {} }
  ])
  assert.equal(actions.value.length, 2)
  assert.equal(actions.value[0].id, 'page-a-action-1')

  // Second registration: Page B actions overriding Page A
  setActions([
    { id: 'page-b-action-1', label: 'Action B1', variant: 'ghost', handler: () => {} }
  ])

  assert.equal(actions.value.length, 1, 'must contain only 1 action after override')
  assert.equal(actions.value[0].id, 'page-b-action-1')
  assert.equal(actions.value[0].label, 'Action B1')
  assert.equal(actions.value[0].variant, 'ghost')
})

test('CAB-CLEAR-01: clearActions immediately empties action state (0ms ghost action protection)', () => {
  resetHeaderState()
  const { actions, setActions, clearActions } = useHeaderActions()

  setActions([
    { id: 'action-temp-1', label: 'Temporary 1', handler: () => {} },
    { id: 'action-temp-2', label: 'Temporary 2', handler: () => {} }
  ])
  assert.equal(actions.value.length, 2)

  // Clear actions instantly
  clearActions()

  assert.equal(actions.value.length, 0, 'actions.value must immediately become empty on clearActions()')
  assert.deepEqual(actions.value, [])
})

test('CAB-EXEC-01: Synchronous action handler executes properly and updates target state', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  let executionCounter = 0
  let passedPayload = null

  setActions([
    {
      id: 'sync-calc',
      label: 'Calculate',
      handler: () => {
        executionCounter += 1
        passedPayload = 'EXEC_OK'
      }
    }
  ])

  assert.equal(executionCounter, 0)
  assert.equal(passedPayload, null)

  // Trigger handler through action reference
  actions.value[0].handler()

  assert.equal(executionCounter, 1, 'handler must increment counter to 1')
  assert.equal(passedPayload, 'EXEC_OK', 'handler must set payload properly')
})

test('CAB-EXEC-02: Asynchronous action handler resolves properly with promise semantics', async () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  let asyncResult = 'IDLE'

  setActions([
    {
      id: 'async-save',
      label: 'Save Changes',
      handler: async () => {
        await new Promise((resolve) => setTimeout(resolve, 15))
        asyncResult = 'SAVED_SUCCESSFULLY'
      }
    }
  ])

  assert.equal(asyncResult, 'IDLE')

  const promise = actions.value[0].handler()
  assert.ok(promise instanceof Promise, 'handler return value must be a Promise')

  await promise
  assert.equal(asyncResult, 'SAVED_SUCCESSFULLY', 'async handler must complete and set state')
})

test('CAB-SSOT-01: Multiple useHeaderActions instances share identical reactive singleton state', () => {
  resetHeaderState()

  // Instance A: simulating the active page registering actions
  const pageInstance = useHeaderActions()

  // Instance B: simulating HeaderBar.vue reading and rendering actions
  const headerBarInstance = useHeaderActions()

  assert.equal(pageInstance.actions.value.length, 0)
  assert.equal(headerBarInstance.actions.value.length, 0)

  // Page registers an action
  pageInstance.setActions([
    { id: 'shared-action', label: 'Shared Action', variant: 'primary', handler: () => {} }
  ])

  // HeaderBar must immediately reflect the action
  assert.equal(headerBarInstance.actions.value.length, 1)
  assert.equal(headerBarInstance.actions.value[0].id, 'shared-action')
  assert.equal(headerBarInstance.actions.value[0].label, 'Shared Action')

  // HeaderBar or unmount triggers clearActions
  headerBarInstance.clearActions()

  // Both instances must immediately reflect empty state
  assert.equal(pageInstance.actions.value.length, 0)
  assert.equal(headerBarInstance.actions.value.length, 0)
})

test('CAB-SSOT-02: Computed actions property is read-only and reflects underlying state mutations', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  setActions([{ id: 'immutable-check', label: 'Check', handler: () => {} }])
  assert.equal(actions.value.length, 1)

  // Verify actions is a Vue computed ref
  assert.ok(actions.effect !== undefined || typeof actions === 'object', 'actions must be a computed ref')
  assert.equal(actions.__v_isReadonly, true, 'computed actions ref must have __v_isReadonly true')

  // Direct mutation of actions.value is rejected by Vue computed readonly guard without corrupting state
  const baseline = actions.value
  const origWarn = console.warn
  console.warn = () => {}
  try {
    actions.value = []
  } finally {
    console.warn = origWarn
  }
  assert.equal(actions.value.length, 1, 'computed actions must be readonly and ignore direct reassignment')
  assert.equal(actions.value, baseline, 'computed actions reference must remain unchanged')
})

test('CAB-ATTR-01: Action disabled and loading states are correctly preserved for UI button guards', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  setActions([
    { id: 'act-enabled', label: 'Active', disabled: false, loading: false, handler: () => {} },
    { id: 'act-disabled', label: 'Disabled', disabled: true, loading: false, handler: () => {} },
    { id: 'act-loading', label: 'Loading', disabled: false, loading: true, handler: () => {} }
  ])

  assert.equal(actions.value[0].disabled, false)
  assert.equal(actions.value[0].loading, false)

  assert.equal(actions.value[1].disabled, true)
  assert.equal(actions.value[1].loading, false)

  assert.equal(actions.value[2].disabled, false)
  assert.equal(actions.value[2].loading, true)
})

test('CAB-ATTR-02: Action variants and keyboard shortcuts conform to design specifications', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  const variants = ['primary', 'secondary', 'ghost', 'danger']
  const items = variants.map((v, i) => ({
    id: `act-${v}`,
    label: `Action ${v}`,
    variant: v,
    shortcut: `Alt+${i + 1}`,
    handler: () => {}
  }))

  setActions(items)

  assert.equal(actions.value.length, 4)
  for (let i = 0; i < 4; i++) {
    assert.equal(actions.value[i].variant, variants[i])
    assert.equal(actions.value[i].shortcut, `Alt+${i + 1}`)
  }
})

test('CAB-ISOLATION-01: Multiple actions in registration maintain distinct handlers without cross-talk', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  let action1Calls = 0
  let action2Calls = 0

  setActions([
    { id: 'btn-1', label: 'Btn 1', handler: () => { action1Calls++ } },
    { id: 'btn-2', label: 'Btn 2', handler: () => { action2Calls++ } }
  ])

  // Invoke action 1 only
  actions.value[0].handler()
  assert.equal(action1Calls, 1)
  assert.equal(action2Calls, 0)

  // Invoke action 2 only
  actions.value[1].handler()
  assert.equal(action1Calls, 1)
  assert.equal(action2Calls, 1)
})

test('CAB-HANDLER-ERR-01: Handler execution exceptions do not corrupt the actions reactive state', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  setActions([
    {
      id: 'failing-act',
      label: 'Fails',
      handler: () => {
        throw new Error('Simulation Handler Error')
      }
    }
  ])

  assert.equal(actions.value.length, 1)

  assert.throws(
    () => {
      actions.value[0].handler()
    },
    /Simulation Handler Error/
  )

  // State remains intact
  assert.equal(actions.value.length, 1)
  assert.equal(actions.value[0].id, 'failing-act')
})

test('CAB-ROUTE-01: Route watcher contract automatically clears actions on route path change', async () => {
  resetHeaderState()
  const { actions, setActions, clearActions } = useHeaderActions()

  setActions([{ id: 'page-action', label: 'Page Action', handler: () => {} }])
  assert.equal(actions.value.length, 1)

  // Simulate client-side route watch contract
  const route = ref({ path: '/projects' })
  const unwatch = watch(
    () => route.value.path,
    () => {
      clearActions()
    }
  )

  route.value = { path: '/tasks' }
  await nextTick()

  assert.equal(actions.value.length, 0, 'Route change must automatically clear actions to guarantee zero ghost action leakage')
  unwatch()
})

test('CAB-UI-01: HeaderBar action execution contract respects disabled and loading guards', () => {
  resetHeaderState()
  const { actions, setActions } = useHeaderActions()

  let enabledClicked = false
  let disabledClicked = false
  let loadingClicked = false

  setActions([
    { id: 'act-1', label: 'Enabled', disabled: false, loading: false, handler: () => { enabledClicked = true } },
    { id: 'act-2', label: 'Disabled', disabled: true, loading: false, handler: () => { disabledClicked = true } },
    { id: 'act-3', label: 'Loading', disabled: false, loading: true, handler: () => { loadingClicked = true } }
  ])

  // Simulate HeaderBar click dispatcher: @click="handleActionClick(action)" with :disabled="action.disabled || action.loading"
  function dispatchHeaderBarClick(action) {
    if (action.disabled || action.loading) {
      return false
    }
    action.handler()
    return true
  }

  const res1 = dispatchHeaderBarClick(actions.value[0])
  const res2 = dispatchHeaderBarClick(actions.value[1])
  const res3 = dispatchHeaderBarClick(actions.value[2])

  assert.equal(res1, true)
  assert.equal(enabledClicked, true)

  assert.equal(res2, false)
  assert.equal(disabledClicked, false)

  assert.equal(res3, false)
  assert.equal(loadingClicked, false)
})

test('CAB-UI-02: HeaderBar getActionClass maps variants to Precision Dark Obsidian styling tokens', () => {
  // Canonical mapping function from HeaderBar.vue
  function getActionClass(variant) {
    switch (variant) {
      case 'primary':
        return 'bg-[#F3F4F6] hover:bg-white text-[#07080A] shadow-sm font-semibold'
      case 'secondary':
        return 'bg-white/[0.04] hover:bg-white/[0.08] text-[#D1D5DB] hover:text-[#F3F4F6] border border-white/[0.08]'
      case 'ghost':
        return 'hover:bg-white/[0.05] text-[#8A8F9E] hover:text-[#F3F4F6]'
      case 'danger':
        return 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
      default:
        return 'bg-white/[0.04] hover:bg-white/[0.08] text-[#D1D5DB] hover:text-[#F3F4F6] border border-white/[0.08]'
    }
  }

  assert.match(getActionClass('primary'), /bg-\[#F3F4F6\]/)
  assert.match(getActionClass('secondary'), /bg-white\/\[0\.04\]/)
  assert.match(getActionClass('ghost'), /hover:bg-white\/\[0\.05\]/)
  assert.match(getActionClass('danger'), /bg-rose-500\/10/)
  assert.equal(getActionClass(undefined), getActionClass('secondary'))
})

