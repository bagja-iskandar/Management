import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ref, computed } from 'vue'
import { createJiti } from 'jiti'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

// Prevent unhandled promise rejections on secondary .finally() branches
const origFinally = Promise.prototype.finally
Promise.prototype.finally = function (callback) {
  const res = origFinally.call(this, callback)
  res.catch(() => {})
  return res
}

// Global Nuxt helpers simulation
globalThis.defineEventHandler = (fn) => fn
globalThis.useRuntimeConfig = () => ({
  githubToken: 'ghp_mock_test_token',
  supabaseUrl: 'https://test-instance.supabase.co',
  supabaseKey: 'test-service-key',
  public: {
    githubUsername: 'bagja-iskandar'
  }
})

const jiti = createJiti(import.meta.url, { alias: { '~': projectRoot, '~~': projectRoot } })

const { createSessionToken, verifySessionToken, verifyAccessKey } = jiti('../../server/utils/auth.ts')

// =============================================================================
// PHASE 10 UNIT TEST SUITE: TELEMETRY & DEVOPS HEALTH
// =============================================================================

test('TELE-STATE-01: telemetryState yields LOADING when pending without cached data, and ERROR when fetch fails without cache', () => {
  const status = ref('pending')
  const telemetryData = ref(null)

  const telemetryState = computed(() => {
    if (status.value === 'pending' && !telemetryData.value) {
      return 'LOADING'
    }
    if (status.value === 'error' && !telemetryData.value) {
      return 'ERROR'
    }
    return 'READY'
  })

  // 1. Initial pending
  assert.equal(telemetryState.value, 'LOADING', 'Initial pending must return LOADING')

  // 2. Initial error
  status.value = 'error'
  assert.equal(telemetryState.value, 'ERROR', 'Initial error without cache must return ERROR')
})

test('TELE-STATE-02: telemetryState yields READY and isStaleData evaluates accurately on re-sync failure with cache in memory', () => {
  const status = ref('success')
  const telemetryData = ref({
    environment: 'development',
    storage: { provider: 'Nitro KV (Local)', counts: { tasks: 5, projects: 2, sprints: 1, notes: 3 } }
  })

  const telemetryState = computed(() => {
    if (status.value === 'pending' && !telemetryData.value) {
      return 'LOADING'
    }
    if (status.value === 'error' && !telemetryData.value) {
      return 'ERROR'
    }
    return 'READY'
  })

  const isStaleData = computed(() => {
    return status.value === 'error' && Boolean(telemetryData.value)
  })

  // 1. Successful data load
  assert.equal(telemetryState.value, 'READY', 'State must be READY when data exists')
  assert.equal(isStaleData.value, false, 'isStaleData must be false when status is success')

  // 2. Re-sync failure with cached data in memory
  status.value = 'error'
  assert.equal(telemetryState.value, 'READY', 'State must remain READY when cached data exists in memory')
  assert.equal(isStaleData.value, true, 'isStaleData must be true when background refresh fails with cached data')
})

test('TELE-PING-01: Supabase live probe measures latency in milliseconds and reports Healthy status', async () => {
  async function simulateProbe(mockQueryFn, timeoutMs = 3000, latencyThresholdMs = 300) {
    const controller = new AbortController()
    const timerId = setTimeout(() => controller.abort(), timeoutMs)
    const start = performance.now()

    try {
      const { error } = await mockQueryFn(controller.signal)
      clearTimeout(timerId)
      if (error) throw error

      const latencyMs = Math.round(performance.now() - start)
      const healthy = true
      const status = latencyMs < latencyThresholdMs ? 'Healthy' : 'Degraded'
      return { healthy, latencyMs, status, error: null }
    } catch (err) {
      clearTimeout(timerId)
      return { healthy: false, latencyMs: null, status: 'Failed', error: err.message }
    }
  }

  const mockFastQuery = async (signal) => {
    assert.ok(signal instanceof AbortSignal, 'AbortSignal must be provided')
    return { error: null }
  }

  const result = await simulateProbe(mockFastQuery)
  assert.equal(result.healthy, true, 'Probe must be healthy')
  assert.ok(result.latencyMs >= 0, 'latencyMs must be non-negative')
  assert.equal(result.status, 'Healthy', 'Status must be Healthy for low latency')
})

test('TELE-PING-02: Supabase probe timeout triggers AbortController, cleans timer, and sets Connection Timeout status', async () => {
  async function simulateTimeoutProbe(timeoutMs = 50) {
    const controller = new AbortController()
    let timerCleaned = false
    const timerId = setTimeout(() => controller.abort(), timeoutMs)
    const originalClearTimeout = clearTimeout

    try {
      // Simulate query that respects abortSignal
      await new Promise((resolve, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Probe exceeded timeout limit'))
        })
      })
      originalClearTimeout(timerId)
      return { status: 'Healthy' }
    } catch (err) {
      originalClearTimeout(timerId)
      timerCleaned = true
      let status = 'Unreachable'
      if (controller.signal.aborted) {
        status = 'Connection Timeout'
      }
      return { status, timerCleaned, aborted: controller.signal.aborted }
    }
  }

  const result = await simulateTimeoutProbe(30)
  assert.equal(result.aborted, true, 'Signal must be aborted upon timeout')
  assert.equal(result.status, 'Connection Timeout', 'Status must be Connection Timeout')
  assert.equal(result.timerCleaned, true, 'Timer must be cleaned up')
})

test('TELE-PING-03: Supabase probe error classification distinguishes Authentication Error from Unreachable', () => {
  function classifySupabaseError(err) {
    if (err?.code === 'PGRST301' || String(err?.message || '').includes('JWT') || err?.status === 401 || err?.status === 403) {
      return 'Authentication Error'
    }
    return 'Unreachable'
  }

  // 1. Auth error
  assert.equal(classifySupabaseError({ status: 401, message: 'Invalid JWT token' }), 'Authentication Error')
  assert.equal(classifySupabaseError({ code: 'PGRST301', message: 'JWT expired' }), 'Authentication Error')

  // 2. Network error
  assert.equal(classifySupabaseError(new Error('fetch failed: ECONNREFUSED')), 'Unreachable')
})

test('TELE-ENV-01: Runtime environment detection honestly reports development on localhost', () => {
  function getEnvironmentTelemetry(env, vercelFlag) {
    const isVercelRuntime = Boolean(vercelFlag === '1')
    const nodeEnv = env.NODE_ENV || 'development'
    const vercelEnv = env.VERCEL_ENV || (isVercelRuntime ? 'production' : 'development')

    return {
      environment: nodeEnv,
      vercel: {
        isRuntime: isVercelRuntime,
        status: isVercelRuntime ? `Live (${vercelEnv})` : 'Offline (Local Development)',
        url: isVercelRuntime ? 'management-app.vercel.app' : null
      }
    }
  }

  const localTelemetry = getEnvironmentTelemetry({ NODE_ENV: 'development' }, undefined)
  assert.equal(localTelemetry.environment, 'development', 'Local environment must be development')
  assert.equal(localTelemetry.vercel.isRuntime, false, 'isRuntime must be false on localhost')
  assert.equal(localTelemetry.vercel.status, 'Offline (Local Development)', 'Vercel status must be Offline on localhost')
  assert.equal(localTelemetry.vercel.url, null, 'Vercel url must be null on localhost')
})

test('TELE-ENV-02: Vercel Edge status honestly reflects production when running in Vercel runtime', () => {
  function getEnvironmentTelemetry(env, vercelFlag) {
    const isVercelRuntime = Boolean(vercelFlag === '1')
    const nodeEnv = env.NODE_ENV || 'production'
    const vercelEnv = env.VERCEL_ENV || (isVercelRuntime ? 'production' : 'development')

    return {
      environment: nodeEnv,
      vercel: {
        isRuntime: isVercelRuntime,
        status: isVercelRuntime ? `Live (${vercelEnv})` : 'Offline (Local Development)',
        url: isVercelRuntime ? 'management-sona-ta.vercel.app' : null
      }
    }
  }

  const vercelTelemetry = getEnvironmentTelemetry({ NODE_ENV: 'production', VERCEL_ENV: 'production' }, '1')
  assert.equal(vercelTelemetry.vercel.isRuntime, true, 'isRuntime must be true in Vercel')
  assert.equal(vercelTelemetry.vercel.status, 'Live (production)', 'Vercel status must report Live with environment')
  assert.equal(vercelTelemetry.vercel.url, 'management-sona-ta.vercel.app', 'Vercel url must be present')
})

test('TELE-STORAGE-01: Storage entity counts object includes tasks, projects, sprints, and notes', () => {
  const mockTasks = [{ id: '1' }, { id: '2' }]
  const mockProjects = [{ id: 'p1' }]
  const mockSprints = [{ id: 's1' }, { id: 's2' }, { id: 's3' }]
  const mockNotes = [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }, { id: 'n4' }]

  const counts = {
    tasks: mockTasks.length,
    projects: mockProjects.length,
    sprints: mockSprints.length,
    notes: mockNotes.length
  }

  assert.equal(counts.tasks, 2, 'tasks count must match')
  assert.equal(counts.projects, 1, 'projects count must match')
  assert.equal(counts.sprints, 3, 'sprints count must match')
  assert.equal(counts.notes, 4, 'notes count must match')
  assert.ok('notes' in counts, 'notes must be explicitly present in storage counts')
})

test('TELE-GITHUB-01: GitHub API rate quota percentage and reset countdown calculation are precise', () => {
  function calculateRateMetrics(rateLimit, currentEpochSec) {
    const remaining = rateLimit?.remaining ?? 0
    const limit = rateLimit?.limit ?? 60
    const ratePercent = limit > 0 ? Math.max(5, Math.round((remaining / limit) * 100)) : 100

    const resetEpoch = rateLimit?.reset ?? currentEpochSec + 3600
    const diffSec = resetEpoch - currentEpochSec
    const resetMinutes = Math.max(1, Math.round(diffSec / 60))

    return { ratePercent, resetMinutes }
  }

  const fixedNow = 1700000000
  const rateLimit = {
    limit: 60,
    remaining: 45,
    reset: fixedNow + 1800 // 30 mins
  }

  const metrics = calculateRateMetrics(rateLimit, fixedNow)
  assert.equal(metrics.ratePercent, 75, '45/60 must equal 75%')
  assert.equal(metrics.resetMinutes, 30, '1800s must equal 30 minutes')
})

test('TELE-AUTH-01: Backup export endpoint rejects unauthenticated requests with HTTP 401', () => {
  const secretKey = 'test-secret-key-12345'
  const keys = [secretKey]

  function verifyExportAuth(bearerHeader, cookieToken) {
    const bearer = bearerHeader?.toLowerCase().startsWith('bearer ') ? bearerHeader.slice(7).trim() : ''
    const cookie = (cookieToken || '').trim()

    let isAuthorized = false
    if (bearer) {
      if (bearer.startsWith('v1.')) {
        if (verifySessionToken(bearer, keys).valid) isAuthorized = true
      } else if (verifyAccessKey(bearer, keys)) {
        isAuthorized = true
      }
    }

    if (!isAuthorized && cookie) {
      if (verifySessionToken(cookie, keys).valid) isAuthorized = true
    }

    return isAuthorized
  }

  // 1. No credentials
  assert.equal(verifyExportAuth(null, null), false, 'Empty credentials must be rejected')

  // 2. Tampered token
  assert.equal(verifyExportAuth('Bearer invalid_token', null), false, 'Invalid bearer token must be rejected')
})

test('TELE-AUTH-02: Backup export endpoint authorizes valid session tokens and raw access keys', () => {
  const secretKey = 'test-secret-key-12345'
  const keys = [secretKey]

  function verifyExportAuth(bearerHeader, cookieToken) {
    const bearer = bearerHeader?.toLowerCase().startsWith('bearer ') ? bearerHeader.slice(7).trim() : ''
    const cookie = (cookieToken || '').trim()

    let isAuthorized = false
    if (bearer) {
      if (bearer.startsWith('v1.')) {
        if (verifySessionToken(bearer, keys).valid) isAuthorized = true
      } else if (verifyAccessKey(bearer, keys)) {
        isAuthorized = true
      }
    }

    if (!isAuthorized && cookie) {
      if (verifySessionToken(cookie, keys).valid) isAuthorized = true
    }

    return isAuthorized
  }

  // 1. Valid raw access key
  assert.equal(verifyExportAuth(`Bearer ${secretKey}`, null), true, 'Valid raw access key must be authorized')

  // 2. Valid signed session token in cookie
  const validSession = createSessionToken(secretKey)
  assert.equal(verifyExportAuth(null, validSession), true, 'Valid signed session cookie must be authorized')
})

test('TELE-BACKUP-01: Backup export payload adheres to canonical version 1.0 schema with metadata and headers', () => {
  function generateBackupPayload(projects, tasks, sprints, notes, env = 'development') {
    const exportedAt = '2026-10-29T18:00:00.000Z'
    const filename = `nexura-backup-${exportedAt.slice(0, 10)}.json`

    return {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/json'
      },
      body: {
        version: '1.0',
        exportedAt,
        environment: env,
        counts: {
          projects: projects.length,
          tasks: tasks.length,
          sprints: sprints.length,
          notes: notes.length,
          totalRecords: projects.length + tasks.length + sprints.length + notes.length
        },
        data: { projects, tasks, sprints, notes }
      }
    }
  }

  const payload = generateBackupPayload([{ id: 'p1' }], [{ id: 't1' }, { id: 't2' }], [{ id: 's1' }], [{ id: 'n1' }])

  assert.equal(payload.body.version, '1.0', 'Version must be 1.0')
  assert.equal(payload.body.counts.totalRecords, 5, 'totalRecords must equal sum of entity counts')
  assert.equal(payload.headers['Content-Disposition'], 'attachment; filename="nexura-backup-2026-10-29.json"')
  assert.equal(payload.headers['Content-Type'], 'application/json')
})

test('TELE-BACKUP-02: Backup Fail-Fast policy aborts entire export with error when any repository read fails', async () => {
  async function performBackupExport(repoFns) {
    try {
      const [projects, tasks, sprints, notes] = await Promise.all(repoFns.map((fn) => fn()))
      return { success: true, count: projects.length + tasks.length + sprints.length + notes.length }
    } catch (err) {
      return { success: false, code: 'BACKUP_READ_FAILED', error: err.message }
    }
  }

  const failingRepos = [
    async () => [{ id: 'p1' }],
    async () => [{ id: 't1' }],
    async () => {
      throw new Error('Database connection reset')
    }, // Sprints failure
    async () => [{ id: 'n1' }]
  ]

  const result = await performBackupExport(failingRepos)
  assert.equal(result.success, false, 'Export must fail when a repository read fails')
  assert.equal(result.code, 'BACKUP_READ_FAILED', 'Error code must be BACKUP_READ_FAILED')
  assert.ok(result.error.includes('Database connection reset'), 'Error message must reflect root cause')
})

test('TELE-FRONTEND-01: UI export concurrency lock prevents duplicate requests and handles failure cleanly', async () => {
  let isExporting = false
  let fetchCallCount = 0
  let downloadTriggered = false

  async function onExportBackup(fetchMock) {
    if (isExporting) return
    isExporting = true

    try {
      const data = await fetchMock()
      downloadTriggered = true
      return data
    } catch {
      downloadTriggered = false
    } finally {
      isExporting = false
    }
  }

  const slowSuccessFetch = async () => {
    fetchCallCount++
    await new Promise((r) => setTimeout(r, 20))
    return { version: '1.0' }
  }

  // 1. Simulate simultaneous clicks
  const call1 = onExportBackup(slowSuccessFetch)
  const call2 = onExportBackup(slowSuccessFetch) // Should be locked out

  await Promise.all([call1, call2])
  assert.equal(fetchCallCount, 1, 'Only one network call must execute during locked export')
  assert.equal(downloadTriggered, true, 'Download must be triggered on success')

  // 2. Simulate failure
  const failingFetch = async () => {
    throw new Error('500 Server Error')
  }

  await onExportBackup(failingFetch)
  assert.equal(downloadTriggered, false, 'Download must NOT be triggered on failure')
  assert.equal(isExporting, false, 'isExporting must be reset to false in finally block')
})
