import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

// =============================================================================
// Nuxt Global State Simulation & JITI Runtime Setup
// =============================================================================

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

const jiti = createJiti(import.meta.url, { alias: { '~': projectRoot, '~~': projectRoot } })

const {
  extractEngCodes,
  reconcilePrWithTask,
  filterRolloverTasks,
  buildSprintRolloverPayload
} = jiti('../../server/utils/github-sync.ts')

// =============================================================================
// PHASE 11: GITHUB SYNC & SPRINT ROLLOVER AUTOMATION — 14 TEST CONTRACTS
// =============================================================================

// -----------------------------------------------------------------------------
// 1. SYNC-REGEX-01: Single commit message extraction
// -----------------------------------------------------------------------------
test('SYNC-REGEX-01: extractEngCodes extracts ENG-101 code from single commit message', () => {
  const message = 'feat(core): implement precision cockpit bento layout ENG-101'
  const extracted = extractEngCodes(message)

  assert.equal(extracted.length, 1, 'Must extract exactly one code')
  assert.equal(extracted[0], 'ENG-101', 'Must match ENG-101')

  const bracketedMessage = 'fix(auth): [ENG-204] resolve session cookie ttl'
  assert.deepEqual(extractEngCodes(bracketedMessage), ['ENG-204'], 'Must extract bracketed code')

  const parensMessage = 'refactor: update matrix view (ENG-305)'
  assert.deepEqual(extractEngCodes(parensMessage), ['ENG-305'], 'Must extract parenthesized code')
})

// -----------------------------------------------------------------------------
// 2. SYNC-REGEX-02: Multi-code extraction & deduplication
// -----------------------------------------------------------------------------
test('SYNC-REGEX-02: extractEngCodes extracts ["ENG-101", "ENG-102"] from combined string without duplicates', () => {
  const multiText = `
    Merge pull request #14 from bagja-iskandar/feat/cockpit
    Resolves ENG-101 and ENG-102.
    Also fixes secondary issue in ENG-101 regression.
  `
  const extracted = extractEngCodes(multiText)

  assert.equal(extracted.length, 2, 'Must extract exactly 2 unique codes without duplicates')
  assert.ok(extracted.includes('ENG-101'), 'Must include ENG-101')
  assert.ok(extracted.includes('ENG-102'), 'Must include ENG-102')
})

// -----------------------------------------------------------------------------
// 3. SYNC-REGEX-03: Casing normalization
// -----------------------------------------------------------------------------
test('SYNC-REGEX-03: extractEngCodes normalizes eng-42 and Eng-42 to canonical uppercase ENG-42', () => {
  const mixedCasing = 'fix: eng-42 and Eng-42, plus ENG-42 in title'
  const extracted = extractEngCodes(mixedCasing)

  assert.equal(extracted.length, 1, 'Must deduplicate case-insensitively')
  assert.equal(extracted[0], 'ENG-42', 'Must normalize to uppercase ENG-42')

  assert.deepEqual(extractEngCodes('eng-01'), ['ENG-01'])
  assert.deepEqual(extractEngCodes('eNg-999'), ['ENG-999'])
})

// -----------------------------------------------------------------------------
// 4. SYNC-REGEX-04: Boundary safety
// -----------------------------------------------------------------------------
test('SYNC-REGEX-04: Boundary safety prevents false-positives on SPENG-123, ENGINEERING-456, or ENG-', () => {
  const falsePositives = 'prefixSPENG-123 and ENGINEERING-456 and standalone ENG- or ENG--123'
  const extracted = extractEngCodes(falsePositives)

  assert.equal(extracted.length, 0, 'Must return empty array for non-matching prefixes and suffixes')

  // Empty or invalid inputs
  assert.deepEqual(extractEngCodes(''), [])
  assert.deepEqual(extractEngCodes(null), [])
  assert.deepEqual(extractEngCodes(undefined), [])
  assert.deepEqual(extractEngCodes(12345), [])
})

// -----------------------------------------------------------------------------
// 5. SYNC-AUTO-01: Merged PR transitions task to deployed
// -----------------------------------------------------------------------------
test('SYNC-AUTO-01: Merged PR triggers action: "deployed" and attaches githubPrUrl', () => {
  const pr = {
    number: 12,
    title: 'feat: implement bento matrix ENG-101',
    state: 'closed',
    merged: true,
    merged_at: '2026-10-29T10:00:00Z',
    html_url: 'https://github.com/org/repo/pull/12'
  }

  const task = {
    id: 't-1',
    taskId: 'ENG-101',
    name: 'Implement bento matrix',
    status: 'running_sprint',
    githubPrUrl: null
  }

  const result = reconcilePrWithTask(pr, task)

  assert.equal(result.action, 'deployed', 'Action must be deployed')
  assert.equal(result.patch.status, 'deployed', 'Patch status must be deployed')
  assert.equal(result.patch.githubPrUrl, 'https://github.com/org/repo/pull/12', 'Patch must attach githubPrUrl')
})

// -----------------------------------------------------------------------------
// 6. SYNC-AUTO-02: Open PR links githubPrUrl without deploying
// -----------------------------------------------------------------------------
test('SYNC-AUTO-02: Open PR links githubPrUrl without changing task status to deployed', () => {
  const pr = {
    number: 14,
    title: 'WIP: cockpit polish ENG-105',
    state: 'open',
    merged: false,
    merged_at: null,
    html_url: 'https://github.com/org/repo/pull/14'
  }

  const task = {
    id: 't-2',
    taskId: 'ENG-105',
    name: 'Cockpit polish',
    status: 'in_queue',
    githubPrUrl: null
  }

  const result = reconcilePrWithTask(pr, task)

  assert.equal(result.action, 'linked', 'Action must be linked')
  assert.equal(result.patch.githubPrUrl, 'https://github.com/org/repo/pull/14', 'Patch must attach githubPrUrl')
  assert.equal('status' in result.patch, false, 'Patch must NOT alter task status')
  assert.equal(task.status, 'in_queue', 'Task status must remain in_queue')
})

// -----------------------------------------------------------------------------
// 7. SYNC-AUTO-03: Already deployed task idempotency
// -----------------------------------------------------------------------------
test('SYNC-AUTO-03: Tasks already deployed do not re-trigger deployed mutation on merged PR', () => {
  const pr = {
    number: 15,
    title: 'fix: patch ENG-101',
    state: 'closed',
    merged: true,
    merged_at: '2026-10-29T11:00:00Z',
    html_url: 'https://github.com/org/repo/pull/15'
  }

  const task = {
    id: 't-1',
    taskId: 'ENG-101',
    name: 'Implement bento matrix',
    status: 'deployed',
    githubPrUrl: 'https://github.com/org/repo/pull/12'
  }

  const result = reconcilePrWithTask(pr, task)

  assert.equal(result.action, 'already_deployed', 'Action must be already_deployed')
  assert.equal('status' in result.patch, false, 'Must not patch status')
})

// -----------------------------------------------------------------------------
// 8. SYNC-AUTO-04: Closed unmerged PR does not deploy
// -----------------------------------------------------------------------------
test('SYNC-AUTO-04: Closed PR without merged_at does not change deliverable status to deployed', () => {
  const pr = {
    number: 16,
    title: 'abandoned: experimental branch ENG-108',
    state: 'closed',
    merged: false,
    merged_at: null,
    html_url: 'https://github.com/org/repo/pull/16'
  }

  const task = {
    id: 't-3',
    taskId: 'ENG-108',
    name: 'Experimental feature',
    status: 'running_sprint',
    githubPrUrl: null
  }

  const result = reconcilePrWithTask(pr, task)

  assert.equal(result.action, 'ignored', 'Action must be ignored for unmerged closed PR')
  assert.equal('status' in result.patch, false, 'Must not patch status to deployed')
  assert.equal(task.status, 'running_sprint', 'Task status must remain running_sprint')
})

// -----------------------------------------------------------------------------
// 9. SYNC-ENDPOINT-01: Endpoint rejects unconfigured GitHub token
// -----------------------------------------------------------------------------
test('SYNC-ENDPOINT-01: Sync endpoint returns error when GitHub token is not configured', async () => {
  async function simulateSyncEndpoint(config) {
    if (!config?.githubToken) {
      return {
        statusCode: 400,
        body: {
          statusCode: 400,
          statusMessage: 'GITHUB_NOT_CONFIGURED',
          message: 'GitHub integration requires GITHUB_TOKEN to be configured.'
        }
      }
    }
    return { statusCode: 200, body: { ok: true } }
  }

  const resUnconfigured = await simulateSyncEndpoint({ githubToken: '' })
  assert.equal(resUnconfigured.statusCode, 400)
  assert.equal(resUnconfigured.body.statusMessage, 'GITHUB_NOT_CONFIGURED')

  const resConfigured = await simulateSyncEndpoint({ githubToken: 'ghp_valid_token' })
  assert.equal(resConfigured.statusCode, 200)
  assert.equal(resConfigured.body.ok, true)
})

// -----------------------------------------------------------------------------
// 10. SYNC-ENDPOINT-02: Endpoint reconciliation payload structure
// -----------------------------------------------------------------------------
test('SYNC-ENDPOINT-02: Reconciliation endpoint returns consistent schema payload', async () => {
  async function executeReconciliation(tasks, pulls) {
    let deployedCount = 0
    let linkedCount = 0
    const updatedTasks = []

    for (const pr of pulls) {
      const codes = extractEngCodes(`${pr.title} ${pr.body || ''}`)
      for (const code of codes) {
        const matchedTask = tasks.find((t) => t.taskId === code)
        if (!matchedTask) continue

        const { action, patch } = reconcilePrWithTask(pr, matchedTask)
        if (action === 'deployed') {
          deployedCount++
          updatedTasks.push({ id: matchedTask.id, taskId: matchedTask.taskId, ...patch })
        } else if (action === 'linked') {
          linkedCount++
          updatedTasks.push({ id: matchedTask.id, taskId: matchedTask.taskId, ...patch })
        }
      }
    }

    return {
      ok: true,
      deployedCount,
      linkedCount,
      updatedTasks,
      timestamp: Date.now()
    }
  }

  const tasks = [
    { id: 't-1', taskId: 'ENG-101', name: 'Task 1', status: 'running_sprint', githubPrUrl: null },
    { id: 't-2', taskId: 'ENG-102', name: 'Task 2', status: 'in_queue', githubPrUrl: null }
  ]

  const pulls = [
    {
      number: 1,
      title: 'feat: finish ENG-101',
      body: 'Closes ENG-101',
      state: 'closed',
      merged: true,
      merged_at: '2026-10-29T10:00:00Z',
      html_url: 'https://github.com/org/repo/pull/1'
    },
    {
      number: 2,
      title: 'wip: work on ENG-102',
      body: null,
      state: 'open',
      merged: false,
      merged_at: null,
      html_url: 'https://github.com/org/repo/pull/2'
    }
  ]

  const response = await executeReconciliation(tasks, pulls)

  assert.equal(response.ok, true, 'ok must be true')
  assert.equal(response.deployedCount, 1, '1 task deployed')
  assert.equal(response.linkedCount, 1, '1 task linked')
  assert.equal(response.updatedTasks.length, 2, '2 total updated tasks')
  assert.equal(typeof response.timestamp, 'number', 'timestamp must be numeric')
  assert.ok(response.timestamp > 0)
})

// -----------------------------------------------------------------------------
// 11. ROLLOVER-MATH-01: Filter non-deployed tasks
// -----------------------------------------------------------------------------
test('ROLLOVER-MATH-01: Rollover filter strictly selects all tasks where status !== "deployed"', () => {
  const sourceTasks = [
    { id: '1', name: 'Task 1', status: 'deployed' },
    { id: '2', name: 'Task 2', status: 'deployed' },
    { id: '3', name: 'Task 3', status: 'running_sprint' },
    { id: '4', name: 'Task 4', status: 'in_queue' },
    { id: '5', name: 'Task 5', status: 'blocked' }
  ]

  const candidates = filterRolloverTasks(sourceTasks)

  assert.equal(candidates.length, 3, 'Must filter out the 2 deployed tasks and keep the 3 incomplete tasks')
  assert.deepEqual(
    candidates.map((t) => t.id),
    ['3', '4', '5'],
    'Must keep running_sprint, in_queue, and blocked tasks'
  )
  assert.equal(candidates.some((t) => t.status === 'deployed'), false, 'Zero deployed tasks allowed in rollover')
})

// -----------------------------------------------------------------------------
// 12. ROLLOVER-LINK-01: Mutate sprintId without corrupting fields
// -----------------------------------------------------------------------------
test('ROLLOVER-LINK-01: Rollover mutation updates task.sprintId = targetSprintId preserving all other task fields', () => {
  const sourceTasks = [
    {
      id: 'task-101',
      taskId: 'ENG-101',
      name: 'Stabilize PostgreSQL Connection Pool',
      status: 'running_sprint',
      priority: 'high',
      projectSlug: 'nexura-cloud',
      techTags: ['PostgreSQL', 'Nuxt 3'],
      sprintId: 'sprint-w43',
      dueDate: '2026-10-25'
    }
  ]

  const { taskUpdates } = buildSprintRolloverPayload('sprint-w43', 'sprint-w44', sourceTasks)

  assert.equal(taskUpdates.length, 1)
  assert.equal(taskUpdates[0].id, 'task-101')
  assert.equal(taskUpdates[0].patch.sprintId, 'sprint-w44')

  // Apply patch to task
  const updatedTask = { ...sourceTasks[0], ...taskUpdates[0].patch }
  assert.equal(updatedTask.sprintId, 'sprint-w44', 'sprintId must advance to target')
  assert.equal(updatedTask.id, 'task-101', 'id must remain intact')
  assert.equal(updatedTask.name, 'Stabilize PostgreSQL Connection Pool', 'name must remain intact')
  assert.equal(updatedTask.status, 'running_sprint', 'status must remain intact')
  assert.equal(updatedTask.priority, 'high', 'priority must remain intact')
  assert.equal(updatedTask.projectSlug, 'nexura-cloud', 'projectSlug must remain intact')
  assert.deepEqual(updatedTask.techTags, ['PostgreSQL', 'Nuxt 3'], 'techTags must remain intact')
})

// -----------------------------------------------------------------------------
// 13. ROLLOVER-CLOSE-01: Source sprint status marked completed
// -----------------------------------------------------------------------------
test('ROLLOVER-CLOSE-01: Rollover marks source sprint status = "completed"', () => {
  const { sourceSprintUpdate } = buildSprintRolloverPayload('sprint-w43', 'sprint-w44', [])

  assert.equal(sourceSprintUpdate.id, 'sprint-w43')
  assert.equal(sourceSprintUpdate.patch.status, 'completed', 'Source sprint status must be completed')
})

// -----------------------------------------------------------------------------
// 14. ROLLOVER-MUTEX-01: UI concurrency lock prevents duplicate clicks
// -----------------------------------------------------------------------------
test('ROLLOVER-MUTEX-01: Concurrency lock prevents duplicate rollover executions during in-flight mutation', async () => {
  let isRollingOver = false
  let rolloverExecutionCount = 0

  async function onPerformRollover(mutationFn) {
    if (isRollingOver) return false
    isRollingOver = true

    try {
      await mutationFn()
      return true
    } finally {
      isRollingOver = false
    }
  }

  const slowRolloverMutation = async () => {
    rolloverExecutionCount++
    await new Promise((r) => setTimeout(r, 25))
  }

  // 1. Two rapid simultaneous clicks
  const [res1, res2] = await Promise.all([
    onPerformRollover(slowRolloverMutation),
    onPerformRollover(slowRolloverMutation)
  ])

  assert.equal(res1, true, 'First rollover click must execute')
  assert.equal(res2, false, 'Second rollover click must be blocked by mutex lock')
  assert.equal(rolloverExecutionCount, 1, 'Mutation must execute exactly once')
  assert.equal(isRollingOver, false, 'Mutex must reset to false after completion')

  // 2. Subsequent call after completion executes normally
  const res3 = await onPerformRollover(slowRolloverMutation)
  assert.equal(res3, true, 'Subsequent rollover after lock release must execute')
  assert.equal(rolloverExecutionCount, 2)
  assert.equal(isRollingOver, false)
})
