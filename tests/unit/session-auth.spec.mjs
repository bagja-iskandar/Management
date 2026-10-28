import test from 'node:test'
import assert from 'node:assert/strict'
import { ref, computed } from 'vue'
import { createJiti } from 'jiti'
import { createEvent, createError, defineEventHandler } from 'h3'

// =============================================================================
// Nuxt Global State Simulation & JITI Runtime Setup
// =============================================================================

globalThis.createError = createError
globalThis.defineEventHandler = defineEventHandler

// Emulate online browser environment in Node.js 24 runtime
if (typeof globalThis.navigator !== 'undefined') {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: true,
    configurable: true,
    writable: true
  })
}

const nuxtState = new Map()
function mockUseState(key, init) {
  if (!nuxtState.has(key)) {
    nuxtState.set(key, ref(init ? init() : undefined))
  }
  return nuxtState.get(key)
}

globalThis.useState = mockUseState
globalThis.$fetch = async () => ({})

const jiti = createJiti(import.meta.url)

// Set up server security key for backend token creation/verification
const TEST_SECRET = 'nexura-session-auth-unit-test-secret-2026'
process.env.NEXURA_ACCESS_KEY = TEST_SECRET
process.env.NODE_ENV = 'production'
delete process.env.NEXURA_DEV_AUTH_BYPASS

const { createSessionToken } = jiti('../../server/utils/auth.ts')
const sessionGetHandler = jiti('../../server/api/auth/session.get.ts').default
const { useSession } = jiti('../../composables/useSession.ts')
const { useWorkspaceStore } = jiti('../../composables/useWorkspaceStore.ts')

// Helper to construct mock H3Event for backend handler tests
function createMockEvent({ cookies = {}, headers = {}, method = 'GET', url = '/api/auth/session' } = {}) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')

  const reqHeaders = {
    host: 'localhost:3000',
    ...headers
  }
  if (cookieHeader) {
    reqHeaders.cookie = cookieHeader
  }

  return createEvent({ url, method, headers: reqHeaders }, {})
}

// =============================================================================
// TEST-AUTH-01: Kontrak Endpoint checkSession() Backend & Composable
// =============================================================================

test('TEST-AUTH-01: Kontrak Endpoint checkSession() Backend', async () => {
  // Case A: Valid session cookie produces authenticated: true
  const validToken = createSessionToken(TEST_SECRET)
  const validEvent = createMockEvent({ cookies: { nexura_session: validToken } })
  const validRes = await sessionGetHandler(validEvent)

  assert.equal(validRes.authenticated, true)
  assert.equal(validRes.message, 'Session valid')
  assert.ok(typeof validRes.expiresAt === 'string', 'expiresAt must be an ISO string')

  // Case B: Missing session cookie produces authenticated: false without throwing
  const emptyEvent = createMockEvent()
  const emptyRes = await sessionGetHandler(emptyEvent)

  assert.equal(emptyRes.authenticated, false)
  assert.match(emptyRes.message, /No session cookie provided/i)

  // Case C: Invalid / tampered session cookie produces authenticated: false without throwing
  const tamperedEvent = createMockEvent({ cookies: { nexura_session: 'v1.invalid.payload.tampered.sig' } })
  const tamperedRes = await sessionGetHandler(tamperedEvent)

  assert.equal(tamperedRes.authenticated, false)
  assert.ok(tamperedRes.message, 'Failure message must explain invalid session')
})

test('TEST-AUTH-01: Kontrak Composable useSession().checkSession()', async () => {
  const session = useSession()

  // Subcase A: Backend returns authenticated: true
  globalThis.$fetch = async (url) => {
    if (url === '/api/auth/session') {
      return { authenticated: true, expiresAt: new Date().toISOString() }
    }
    return {}
  }

  const ok = await session.checkSession()
  assert.equal(ok, true)
  assert.equal(session.authStatus.value, 'authenticated')
  assert.equal(session.isAuthenticated.value, true)

  // Subcase B: Backend returns authenticated: false
  globalThis.$fetch = async (url) => {
    if (url === '/api/auth/session') {
      return { authenticated: false, message: 'No session cookie provided' }
    }
    return {}
  }

  const notOk = await session.checkSession()
  assert.equal(notOk, false)
  assert.equal(session.authStatus.value, 'unauthenticated')
  assert.equal(session.isAuthenticated.value, false)

  // Subcase C: Backend returns 500 / network drop -> does NOT throw unhandled error
  globalThis.$fetch = async () => {
    throw new Error('Connection refused')
  }

  await assert.doesNotReject(async () => {
    const res = await session.checkSession()
    assert.equal(res, false)
    assert.equal(session.authStatus.value, 'unauthenticated')
  })
})

// =============================================================================
// TEST-AUTH-02: Pembersihan Input Access Key Terjamin (try...finally)
// =============================================================================

test('TEST-AUTH-02: Pembersihan Input Access Key Terjamin (try...finally)', async () => {
  const session = useSession()

  // Simulate component form lifecycle method matching SessionAuthModal.vue submitKey
  async function simulateModalSubmitKey(inputRef, sessionService) {
    const trimmed = inputRef.value.trim()
    if (!trimmed) return
    try {
      return await sessionService.loginWithAccessKey(trimmed)
    } finally {
      // Guaranteed zero memory retention of secret in local form state
      inputRef.value = ''
    }
  }

  // Case A: Successful login clears input
  const inputA = ref('correct-secret-key-123')
  globalThis.$fetch = async (url, opts) => {
    if (opts?.body?.accessKey === 'correct-secret-key-123') {
      return { success: true, message: 'Session established' }
    }
    throw new Error('Unauthorized')
  }

  const successResult = await simulateModalSubmitKey(inputA, session)
  assert.equal(successResult, true)
  assert.equal(inputA.value, '', 'Input state must be wiped clean in finally after success')

  // Case B: 401 Rejection clears input
  const inputB = ref('wrong-secret-key-456')
  globalThis.$fetch = async () => {
    const err = new Error('Invalid access key')
    err.statusCode = 401
    throw err
  }

  const failResult = await simulateModalSubmitKey(inputB, session)
  assert.equal(failResult, false)
  assert.equal(inputB.value, '', 'Input state must be wiped clean in finally after 401 rejection')

  // Case C: Unhandled network crash clears input
  const inputC = ref('crashing-attempt-789')
  globalThis.$fetch = async () => {
    throw new Error('Socket abruptly closed')
  }

  const crashResult = await simulateModalSubmitKey(inputC, session)
  assert.equal(crashResult, false)
  assert.equal(inputC.value, '', 'Input state must be wiped clean in finally after network crash')
})

// =============================================================================
// TEST-AUTH-03: Larangan Auto-Retry Pasca 401
// =============================================================================

test('TEST-AUTH-03: Larangan Auto-Retry Pasca 401 (Strict No Silent Retry Policy)', async () => {
  const session = useSession()
  const store = useWorkspaceStore()

  // Track dispatched API mutations
  let mutationDispatchedCount = 0
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT' || opts?.method === 'POST') {
      mutationDispatchedCount++
      if (mutationDispatchedCount === 1) {
        // First mutation attempt fails with 401
        const err = new Error('Unauthorized')
        err.statusCode = 401
        err.data = { code: 'UNAUTHORIZED' }
        throw err
      }
      return { success: true }
    }
    return {}
  }

  // 1. Trigger API failure
  const err401 = new Error('Unauthorized')
  err401.statusCode = 401
  err401.data = { code: 'UNAUTHORIZED' }
  session.handleApiError(err401)

  // 2. Verify modal opened and unauthenticated marked
  assert.equal(session.authStatus.value, 'unauthenticated')
  assert.equal(session.isAuthModalOpen.value, true)

  // 3. User authenticates successfully via loginWithAccessKey
  globalThis.$fetch = async (url, opts) => {
    if (url === '/api/auth/session' && opts?.method === 'POST') {
      return { success: true, message: 'Session established' }
    }
    // If any old mutation is silently retried, throw an error
    if (opts?.method === 'PUT' || (opts?.method === 'POST' && url !== '/api/auth/session')) {
      mutationDispatchedCount++
      throw new Error('Violation: Silent mutation retry detected!')
    }
    return {}
  }

  const loginOk = await session.loginWithAccessKey('valid-secret-key')
  assert.equal(loginOk, true)
  assert.equal(session.authStatus.value, 'authenticated')
  assert.equal(session.isAuthModalOpen.value, false)

  // 4. Verification: No queued mutations were secretly or automatically retried
  assert.equal(mutationDispatchedCount, 0, 'No old mutation may be auto-retried without explicit user action')
})

// =============================================================================
// TEST-AUTH-04: Pemisahan Respons 401 vs 403 CSRF vs Offline vs 500
// =============================================================================

test('TEST-AUTH-04: Pemisahan Respons 401 vs 403 CSRF vs Offline vs 500', () => {
  const session = useSession()
  const store = useWorkspaceStore()

  // Pre-populate store with mock items
  store.tasks.value = [
    { id: 'task-auth-1', taskId: 'ENG-801', name: 'Preserved Task', status: 'in_queue' }
  ]
  store.projects.value = [
    { id: 'proj-auth-1', slug: 'nexura', title: 'Nexura Core' }
  ]

  // --- Subcase 401: UNAUTHORIZED ---
  session.clearWarnings()
  session.closeAuthModal()
  const err401 = { statusCode: 401, data: { code: 'UNAUTHORIZED' } }
  session.handleApiError(err401)

  assert.equal(session.authStatus.value, 'unauthenticated')
  assert.equal(session.isAuthModalOpen.value, true, '401 MUST open auth modal')
  assert.equal(session.csrfWarning.value, null)
  assert.equal(session.networkWarning.value, null)
  assert.equal(store.tasks.value.length, 1, '401 must NOT destroy local workspace cache')

  // --- Subcase 403: CSRF_BLOCKED ---
  session.clearWarnings()
  session.closeAuthModal()
  const err403 = { statusCode: 403, data: { code: 'CSRF_BLOCKED' }, message: 'Origin mismatch' }
  session.handleApiError(err403)

  assert.equal(session.isAuthModalOpen.value, false, '403 CSRF MUST NOT open auth modal or prompt for password')
  assert.match(session.csrfWarning.value, /CSRF verification failed/i)
  assert.equal(session.networkWarning.value, null)
  assert.equal(store.tasks.value.length, 1, '403 must NOT destroy local workspace cache')

  // --- Subcase Offline / Network Interruption ---
  session.clearWarnings()
  session.closeAuthModal()
  const errNetwork = { message: 'fetch failed: ECONNREFUSED' }
  session.handleApiError(errNetwork)

  assert.equal(session.isAuthModalOpen.value, false, 'Network drop MUST NOT open auth modal')
  assert.match(session.networkWarning.value, /Network connection interrupted/i)
  assert.equal(session.csrfWarning.value, null)
  assert.equal(store.tasks.value.length, 1, 'Network drop MUST preserve local cache')

  // --- Subcase 500: Server Telemetry Error ---
  session.clearWarnings()
  session.closeAuthModal()
  const err500 = { statusCode: 500, message: 'Database connection timeout' }
  session.handleApiError(err500)

  assert.equal(session.isAuthModalOpen.value, false, '500 MUST NOT open auth modal')
  assert.equal(session.csrfWarning.value, null)
  assert.equal(session.networkWarning.value, null)
  assert.equal(store.tasks.value.length, 1, '500 must NOT destroy local workspace cache')
})
