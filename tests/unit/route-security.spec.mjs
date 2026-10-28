import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { createEvent, createError, defineEventHandler } from 'h3'

// Pure ESM Test Suite: Route & Middleware Integration Test (Phase 0 Acceptance)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

// Initialize global h3 / Nitro runtime mocks for test isolation
globalThis.createError = createError
globalThis.defineEventHandler = defineEventHandler
globalThis.useStorage = () => ({
  getItem: async () => null,
  setItem: async () => {},
  getKeys: async () => []
})
globalThis.useRuntimeConfig = () => ({
  githubUsername: 'bagja-iskandar',
  githubToken: 'ghp_mock_test_token_never_leaked'
})

// Set up deterministic environment variables for test execution
const TEST_ACCESS_KEY = 'nexura-test-access-key-phase0-review'
process.env.NEXURA_ACCESS_KEY = TEST_ACCESS_KEY
process.env.NODE_ENV = 'production'
delete process.env.NEXURA_DEV_AUTH_BYPASS

const jiti = createJiti(import.meta.url)
const authMiddleware = jiti('../../server/middleware/auth.ts').default
const { createSessionToken } = jiti('../../server/utils/auth.ts')
const { assertGitHubRepoAllowed } = jiti('../../server/utils/github-allowlist.ts')
const repos = jiti('../../server/repositories/index.ts')

// Configure project repo mock for allowlist checks
repos.getProjectRepo().findAll = async () => [
  { id: 'proj-1', title: 'Nexura Management', slug: 'management', githubRepo: 'bagja-iskandar/Management' },
  { id: 'proj-2', title: 'Client Portal', slug: 'client-portal', githubRepo: 'partner-org/client-portal' }
]

/**
 * Creates an H3Event test mock conforming to the H3 and Node HTTP interface.
 */
function createMockEvent({
  url = '/api/stats',
  method = 'GET',
  headers = {},
  cookies = {}
} = {}) {
  const reqHeaders = {
    host: 'localhost:3000',
    ...headers
  }

  const cookieEntries = Object.entries(cookies)
  if (cookieEntries.length > 0) {
    reqHeaders.cookie = cookieEntries.map(([k, v]) => `${k}=${v}`).join('; ')
  }

  const req = {
    url,
    method: method.toUpperCase(),
    headers: reqHeaders
  }

  return createEvent(req, {})
}

// =============================================================================
// SUITE 1: Explicitly Public Routes
// =============================================================================

test('1.1: GET /api/stats: Public route permits unauthenticated access without throwing', async () => {
  const event = createMockEvent({
    url: '/api/stats',
    method: 'GET',
    headers: { host: 'localhost:3000' }
  })

  // Middleware must return undefined and must not throw any error
  await assert.doesNotReject(async () => {
    const res = await authMiddleware(event)
    assert.equal(res, undefined, 'Public stats endpoint must return undefined to let handler execute')
  })
})

test('1.2: POST /api/auth/session: Handshake route permits unauthenticated access without throwing', async () => {
  const event = createMockEvent({
    url: '/api/auth/session',
    method: 'POST',
    headers: {
      host: 'localhost:3000',
      'content-type': 'application/json'
    }
  })

  // Middleware must pass through to allow session credential evaluation by handler
  await assert.doesNotReject(async () => {
    const res = await authMiddleware(event)
    assert.equal(res, undefined, 'Session handshake endpoint must pass without pre-middleware failure')
  })
})

// =============================================================================
// SUITE 2: Workspace Private Mutations Access Control & CSRF Protection
// =============================================================================

const privateMutationRoutes = [
  { method: 'POST', url: '/api/tasks' },
  { method: 'PUT', url: '/api/projects/test' },
  { method: 'DELETE', url: '/api/sprints/123' },
  { method: 'POST', url: '/api/notes' },
  { method: 'PUT', url: '/api/notes/note-456' },
  { method: 'DELETE', url: '/api/tasks/task-789' }
]

for (const { method, url } of privateMutationRoutes) {
  test(`2.A: ${method} ${url}: Request without Bearer or Cookie throws 401 UNAUTHORIZED`, async () => {
    const event = createMockEvent({
      url,
      method,
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000' // Same-origin, passes CSRF check
      }
    })

    await assert.rejects(
      async () => {
        await authMiddleware(event)
      },
      (err) => {
        assert.equal(err.statusCode, 401, `Expected 401 for unauthenticated ${method} ${url}`)
        assert.equal(err.data?.code, 'UNAUTHORIZED')
        return true
      }
    )
  })

  test(`2.B: ${method} ${url}: CSRF attack throws 403 CSRF_BLOCKED`, async () => {
    const validSession = createSessionToken(TEST_ACCESS_KEY)
    const event = createMockEvent({
      url,
      method,
      headers: {
        host: 'localhost:3000',
        origin: 'https://attacker.com' // Untrusted cross-origin
      },
      cookies: {
        nexura_session: validSession
      }
    })

    await assert.rejects(
      async () => {
        await authMiddleware(event)
      },
      (err) => {
        assert.equal(err.statusCode, 403, `Expected 403 CSRF_BLOCKED for ${method} ${url} from attacker.com`)
        assert.equal(err.data?.code, 'CSRF_BLOCKED')
        return true
      }
    )
  })

  test(`2.C: ${method} ${url}: Request with valid nexura_session cookie passes middleware`, async () => {
    const validSession = createSessionToken(TEST_ACCESS_KEY)
    const event = createMockEvent({
      url,
      method,
      headers: {
        host: 'localhost:3000',
        origin: 'http://localhost:3000'
      },
      cookies: {
        nexura_session: validSession
      }
    })

    await assert.doesNotReject(async () => {
      const res = await authMiddleware(event)
      assert.equal(res, undefined)
    })
  })

  test(`2.D: ${method} ${url}: Request with valid Authorization: Bearer <key> passes middleware`, async () => {
    const event = createMockEvent({
      url,
      method,
      headers: {
        host: 'localhost:3000',
        authorization: `Bearer ${TEST_ACCESS_KEY}`
      }
    })

    await assert.doesNotReject(async () => {
      const res = await authMiddleware(event)
      assert.equal(res, undefined)
    })
  })

  test(`2.E: ${method} ${url}: Request with valid Authorization: Bearer <sessionToken> passes middleware`, async () => {
    const validSession = createSessionToken(TEST_ACCESS_KEY)
    const event = createMockEvent({
      url,
      method,
      headers: {
        host: 'localhost:3000',
        authorization: `Bearer ${validSession}`
      }
    })

    await assert.doesNotReject(async () => {
      const res = await authMiddleware(event)
      assert.equal(res, undefined)
    })
  })
}

// =============================================================================
// SUITE 3: GitHub Endpoints Access Control
// =============================================================================

const gitHubRoutes = [
  '/api/github/branches',
  '/api/github/security',
  '/api/github/commit-detail',
  '/api/github/repos',
  '/api/github/commits',
  '/api/github/deployments'
]

for (const ep of gitHubRoutes) {
  test(`3.A: GET ${ep}: Without Bearer or Cookie throws 401 UNAUTHORIZED`, async () => {
    const event = createMockEvent({
      url: ep,
      method: 'GET',
      headers: { host: 'localhost:3000' }
    })

    await assert.rejects(
      async () => {
        await authMiddleware(event)
      },
      (err) => {
        assert.equal(err.statusCode, 401, `Expected 401 for unauthenticated ${ep}`)
        assert.equal(err.data?.code, 'UNAUTHORIZED')
        return true
      }
    )
  })

  test(`3.B: GET ${ep}: With valid Bearer passes middleware`, async () => {
    const event = createMockEvent({
      url: ep,
      method: 'GET',
      headers: {
        host: 'localhost:3000',
        authorization: `Bearer ${TEST_ACCESS_KEY}`
      }
    })

    await assert.doesNotReject(async () => {
      const res = await authMiddleware(event)
      assert.equal(res, undefined)
    })
  })

  test(`3.C: GET ${ep}: With valid nexura_session cookie passes middleware`, async () => {
    const validSession = createSessionToken(TEST_ACCESS_KEY)
    const event = createMockEvent({
      url: ep,
      method: 'GET',
      headers: { host: 'localhost:3000' },
      cookies: { nexura_session: validSession }
    })

    await assert.doesNotReject(async () => {
      const res = await authMiddleware(event)
      assert.equal(res, undefined)
    })
  })
}

// =============================================================================
// SUITE 4: GitHub Repository Allowlist Pre-Access Validation & Rejection
// =============================================================================

test('4.1: assertGitHubRepoAllowed: Rejects spoofed or unregistered repos with 403 Forbidden', async () => {
  // Attacker creating same repo name on their own account
  await assert.rejects(
    async () => {
      await assertGitHubRepoAllowed('attacker/Management')
    },
    (err) => {
      assert.equal(err.statusCode, 403)
      assert.match(err.statusMessage, /not allowed/i)
      return true
    }
  )

  // Unregistered third-party organization
  await assert.rejects(
    async () => {
      await assertGitHubRepoAllowed('unknown-org/secret-repo')
    },
    (err) => {
      assert.equal(err.statusCode, 403)
      assert.match(err.statusMessage, /not allowed/i)
      return true
    }
  )
})

test('4.2: assertGitHubRepoAllowed: Validates before cache and Octokit client in all route handlers', () => {
  const githubApiDir = path.join(projectRoot, 'server/api/github')
  const files = fs.readdirSync(githubApiDir).filter((f) => f.endsWith('.ts'))

  // All endpoints accepting a repo parameter must invoke assertGitHubRepoAllowed in the outer handler
  const endpointsWithRepo = files.filter((f) => f !== 'repos.get.ts')

  for (const filename of endpointsWithRepo) {
    const filePath = path.join(githubApiDir, filename)
    const content = fs.readFileSync(filePath, 'utf8')

    // Find the default handler definition
    const handlerIndex = content.indexOf('export default withApiHandler')
    assert.ok(handlerIndex !== -1, `${filename} must export default withApiHandler`)

    const handlerBody = content.slice(handlerIndex)
    const allowlistCallIndex = handlerBody.indexOf('assertGitHubRepoAllowed(')
    assert.ok(
      allowlistCallIndex !== -1,
      `${filename} handler must call assertGitHubRepoAllowed in its execution flow`
    )

    // Check that cache call (fetchCached*) happens AFTER allowlist call
    const cachedCallMatch = handlerBody.match(/fetchCached[A-Za-z0-9_]*\(/)
    if (cachedCallMatch && cachedCallMatch.index !== undefined) {
      assert.ok(
        allowlistCallIndex < cachedCallMatch.index,
        `${filename}: assertGitHubRepoAllowed must precede ${cachedCallMatch[0]} cache access`
      )
    }

    // Check that createGitHubClient is NOT called before allowlist check in the handler
    const clientCallIndex = handlerBody.indexOf('createGitHubClient(')
    if (clientCallIndex !== -1) {
      assert.ok(
        allowlistCallIndex < clientCallIndex,
        `${filename}: assertGitHubRepoAllowed must precede createGitHubClient`
      )
    }
  }
})

// =============================================================================
// SUITE 5: Public Stats Endpoint Honesty & Data Leak Defense
// =============================================================================

test('5.1: server/api/stats.get.ts: Handler returns aggregated metric counts only without secret leaks', async () => {
  // Set up controlled mock dataset
  repos.getTaskRepo().findAll = async () => [
    { id: 't-1', title: 'Task 1', status: 'in_progress', priority: 'medium' },
    { id: 't-2', title: 'Task 2', status: 'blocked', priority: 'low' },
    { id: 't-3', title: 'Task 3', status: 'ready', priority: 'critical' },
    { id: 't-4', title: 'Task 4', status: 'deployed', priority: 'high', sprintId: 'sprint-active' },
    { id: 't-5', title: 'Task 5', status: 'deployed', priority: 'low', sprintId: 'sprint-other' }
  ]

  repos.getSprintRepo().findAll = async () => [
    { id: 'sprint-active', name: 'Sprint 2026-Q4', status: 'active', taskIds: ['t-4'] }
  ]

  const statsHandler = jiti('../../server/api/stats.get.ts').default
  const event = createMockEvent({ url: '/api/stats', method: 'GET' })

  const result = await statsHandler(event)

  // 1. Structure validation
  assert.ok(Array.isArray(result), 'Stats response must be an array')
  assert.equal(result.length, 3, 'Stats response must contain exactly 3 metric cards')

  const labels = result.map((r) => r.label)
  assert.deepEqual(labels, ['Active Tasks', 'Blockers', 'Sprint Velocity'])

  // 2. Metric calculation verification
  // Active tasks: status != 'deployed' -> t-1, t-2, t-3 = 3
  const activeStat = result.find((r) => r.label === 'Active Tasks')
  assert.equal(activeStat.value, 3)
  assert.equal(activeStat.delta, '3 active')

  // Blockers: priority === 'critical' (t-3) or status === 'blocked' (t-2) = 2
  const blockerStat = result.find((r) => r.label === 'Blockers')
  assert.equal(blockerStat.value, 2)
  assert.equal(blockerStat.delta, '2 blocked')

  // Sprint Velocity: deployed in active sprint -> t-4 = 1
  const velocityStat = result.find((r) => r.label === 'Sprint Velocity')
  assert.equal(velocityStat.value, 1)
  assert.equal(velocityStat.delta, '1 deployed in Sprint 2026-Q4')

  // 3. Strict credentials & code leak audit
  const serialized = JSON.stringify(result)
  const forbiddenKeywords = [
    'token',
    'secret',
    'password',
    'access_key',
    'supabase',
    'diff',
    'patch',
    'commit',
    'email',
    'bearer'
  ]

  for (const keyword of forbiddenKeywords) {
    assert.ok(
      !serialized.toLowerCase().includes(keyword),
      `Stats output must not contain sensitive string or property '${keyword}'`
    )
  }
})

test('5.2: server/api/stats.get.ts: Source code contains zero secrets, Octokit references, or tokens', () => {
  const statsSourcePath = path.join(projectRoot, 'server/api/stats.get.ts')
  const code = fs.readFileSync(statsSourcePath, 'utf8')

  // Must not import github client or octokit
  assert.ok(!code.includes('createGitHubClient'), 'stats.get.ts must not import createGitHubClient')
  assert.ok(!code.includes('octokit'), 'stats.get.ts must not import octokit')
  assert.ok(!code.includes('githubToken'), 'stats.get.ts must not access githubToken')
  assert.ok(!code.includes('process.env'), 'stats.get.ts must not read process.env')
  assert.ok(!code.includes('SUPABASE_SERVICE_ROLE_KEY'), 'stats.get.ts must not access Supabase service role key')
})

// =============================================================================
// SUITE 6: Undocumented Access Exemption Audit
// =============================================================================

test('6.1: Complete Route Audit: No hidden bypasses exist in server/middleware/auth.ts', () => {
  const authMiddlewarePath = path.join(projectRoot, 'server/middleware/auth.ts')
  const code = fs.readFileSync(authMiddlewarePath, 'utf8')

  // Scan for any whitelisted routes in auth middleware
  const whitelistMatches = code.match(/normalizedPath === '([^']+)'/g) || []
  const whitelistedPaths = whitelistMatches.map((m) => {
    const match = m.match(/'([^']+)'/)
    return match ? match[1] : ''
  })

  // The ONLY whitelisted public endpoints permitted by specification are /api/auth/session and /api/stats
  const expectedWhitelist = ['/api/auth/session', '/api/stats']
  for (const wp of whitelistedPaths) {
    assert.ok(
      expectedWhitelist.includes(wp),
      `Unexpected public endpoint exemption found in auth.ts: '${wp}'`
    )
  }

  // Ensure non-API routes return early without executing auth
  // but all /api/** mutations and GitHub routes require authorization
  assert.match(code, /!path\.startsWith\('\/api\/'\)/)
  assert.match(code, /isGitHubEndpoint/)
  assert.match(code, /isMutation/)
})
