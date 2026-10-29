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

// Global Nuxt error helper simulation
if (typeof globalThis.createError === 'undefined') {
  globalThis.createError = (err) => {
    const error = new Error(err.statusMessage || err.message || 'Server Error')
    Object.assign(error, err)
    return error
  }
}

const jiti = createJiti(import.meta.url, { alias: { '~': projectRoot, '~~': projectRoot } })

const { SupabaseTaskRepository } = jiti('../../server/repositories/supabase/supabase-task.repository.ts')

// Helper function to build an isolated mock Supabase query client
function createMockSupabaseClient(initialData = {}) {
  const calls = {
    from: [],
    select: [],
    eq: [],
    or: [],
    delete: [],
    update: [],
    insert: [],
    maybeSingle: 0,
    single: 0
  }

  const client = {
    from(tableName) {
      calls.from.push(tableName)
      let isDeleteOp = false
      let isUpdateOp = false
      let updateBody = null
      const currentEqs = []

      const queryBuilder = {
        select(fields = '*') {
          calls.select.push({ table: tableName, fields })
          return queryBuilder
        },
        eq(column, value) {
          calls.eq.push({ table: tableName, isDelete: isDeleteOp, column, value })
          currentEqs.push({ column, value })
          return queryBuilder
        },
        or(...args) {
          calls.or.push({ table: tableName, args })
          return queryBuilder
        },
        delete() {
          isDeleteOp = true
          calls.delete.push({ table: tableName })
          return queryBuilder
        },
        update(body) {
          isUpdateOp = true
          updateBody = body
          calls.update.push({ table: tableName, body })
          return queryBuilder
        },
        insert(body) {
          calls.insert.push({ table: tableName, body })
          return queryBuilder
        },
        maybeSingle() {
          calls.maybeSingle++
          return Promise.resolve(queryBuilder.then((res) => ({ data: res.data?.[0] || null, error: null })))
        },
        single() {
          calls.single++
          return Promise.resolve(queryBuilder.then((res) => ({ data: res.data?.[0] || null, error: null })))
        },
        then(resolve) {
          const tableRecords = initialData[tableName] || []
          let matched = tableRecords.filter((rec) => {
            for (const { column, value } of currentEqs) {
              if (rec[column] !== value) return false
            }
            return true
          })

          if (isDeleteOp) {
            return resolve({ data: null, error: null })
          }

          if (isUpdateOp) {
            return resolve({
              data: matched.length > 0 ? [{ ...matched[0], ...updateBody }] : [],
              error: null
            })
          }

          return resolve({ data: matched, error: null })
        }
      }

      return queryBuilder
    }
  }

  return { client, calls }
}

// =============================================================================
// PHASE 12: SUPABASE TASK REPOSITORY INJECTION IMMUNITY & ROUTING
// =============================================================================

// -----------------------------------------------------------------------------
// 1. SEC-INJ-01: Task ID Routing
// -----------------------------------------------------------------------------
test('SEC-INJ-01: Task ID Routing (ENG-001, #ENG-001, eng-042) strictly queries .eq("task_id", uppercase) without touching id column', async () => {
  const mockDb = {
    tasks: [
      { id: 'uuid-t1', task_id: 'ENG-001', name: 'Task One', status: 'idea' },
      { id: 'uuid-t2', task_id: 'ENG-042', name: 'Task Forty-Two', status: 'running_sprint' }
    ]
  }

  const { client, calls } = createMockSupabaseClient(mockDb)
  const repo = new SupabaseTaskRepository()
  Object.defineProperty(repo, 'client', { get: () => client })

  // 1. Standard ENG-001
  const t1 = await repo.findById('ENG-001')
  assert.ok(t1, 'Task ENG-001 must be found')
  assert.equal(t1.name, 'Task One')
  assert.equal(calls.eq.length, 1)
  assert.equal(calls.eq[0].column, 'task_id', 'Must query task_id column')
  assert.equal(calls.eq[0].value, 'ENG-001', 'Must query exact uppercase ENG-001')

  // Column 'id' must NOT be touched
  assert.equal(calls.eq.some((c) => c.column === 'id'), false, 'Column id must not be queried')

  // 2. Hash-prefixed #ENG-001
  calls.eq.length = 0
  const t1Hash = await repo.findById('#ENG-001')
  assert.ok(t1Hash, 'Hash-prefixed #ENG-001 must be normalized and found')
  assert.equal(calls.eq.length, 1)
  assert.equal(calls.eq[0].column, 'task_id')
  assert.equal(calls.eq[0].value, 'ENG-001', 'Must strip # prefix and uppercase to ENG-001')

  // 3. Lowercase eng-042
  calls.eq.length = 0
  const t2Lower = await repo.findById('eng-042')
  assert.ok(t2Lower, 'eng-042 must be normalized and found')
  assert.equal(calls.eq.length, 1)
  assert.equal(calls.eq[0].column, 'task_id')
  assert.equal(calls.eq[0].value, 'ENG-042', 'Must normalize to canonical uppercase ENG-042')

  // 4. Update routing via ENG code
  calls.eq.length = 0
  const updated = await repo.update('eng-042', { name: 'Updated Forty-Two' })
  assert.ok(updated)
  assert.equal(calls.eq.some((c) => c.column === 'task_id' && c.value === 'ENG-042'), true)
  assert.equal(calls.eq.some((c) => c.column === 'id'), false)
})

// -----------------------------------------------------------------------------
// 2. SEC-INJ-02: UUID Routing
// -----------------------------------------------------------------------------
test('SEC-INJ-02: UUID Routing strictly queries .eq("id", lowercase) without touching task_id column', async () => {
  const testUuid = '123e4567-e89b-12d3-a456-426614174000'
  const mockDb = {
    tasks: [{ id: testUuid, task_id: 'ENG-999', name: 'UUID Task', status: 'deployed' }]
  }

  const { client, calls } = createMockSupabaseClient(mockDb)
  const repo = new SupabaseTaskRepository()
  Object.defineProperty(repo, 'client', { get: () => client })

  // 1. Lowercase 36-char standard UUID
  const foundLower = await repo.findById(testUuid)
  assert.ok(foundLower, 'Task must be found by UUID')
  assert.equal(calls.eq.length, 1)
  assert.equal(calls.eq[0].column, 'id', 'Must query id column')
  assert.equal(calls.eq[0].value, testUuid, 'Must pass lowercase UUID')
  assert.equal(calls.eq.some((c) => c.column === 'task_id'), false, 'Column task_id must not be queried')

  // 2. Uppercase 36-char UUID normalization
  calls.eq.length = 0
  const upperUuid = testUuid.toUpperCase()
  const foundUpper = await repo.findById(upperUuid)
  assert.ok(foundUpper)
  assert.equal(calls.eq.length, 1)
  assert.equal(calls.eq[0].column, 'id')
  assert.equal(calls.eq[0].value, testUuid, 'Uppercase UUID must be normalized to lowercase')
})

// -----------------------------------------------------------------------------
// 3. SEC-INJ-03: PostgREST DSL Grammar Immunity
// -----------------------------------------------------------------------------
test('SEC-INJ-03: PostgREST DSL Grammar payloads are routed to parameterized .eq("id", literal); .or() is NEVER called', async () => {
  const { client, calls } = createMockSupabaseClient({ tasks: [] })
  const repo = new SupabaseTaskRepository()
  Object.defineProperty(repo, 'client', { get: () => client })

  const dslAttackVectors = [
    'ENG-001.is.null',
    'ENG-001,task_id.neq.null',
    'ENG-001.or.id.not.is.null',
    'ENG-001) or (1=1',
    'task_id=in.(ENG-001,ENG-002)'
  ]

  for (const attack of dslAttackVectors) {
    calls.eq.length = 0
    calls.or.length = 0

    const res = await repo.findById(attack)
    assert.equal(res, null, `Attack vector '${attack}' must return null when no literal ID matches`)

    // Verify .or() was NEVER called
    assert.equal(calls.or.length, 0, `Query builder .or() must NEVER be invoked for attack vector: ${attack}`)

    // Verify query was safely routed to .eq('id', literalValue)
    assert.equal(calls.eq.length, 1)
    assert.equal(calls.eq[0].column, 'id', 'DSL strings must be treated as literal id values')
    assert.equal(calls.eq[0].value, attack, 'DSL payload must remain strict uninterpreted literal string')
  }
})

// -----------------------------------------------------------------------------
// 4. SEC-INJ-04: Meta-char & Empty Input Handling
// -----------------------------------------------------------------------------
test('SEC-INJ-04: Empty input returns null/false immediately without querying; SQL injection payloads are treated as literal values', async () => {
  const { client, calls } = createMockSupabaseClient({ tasks: [] })
  const repo = new SupabaseTaskRepository()
  Object.defineProperty(repo, 'client', { get: () => client })

  // 1. Empty string / whitespace immediate short-circuit (zero queries executed)
  calls.from.length = 0
  const emptyRes1 = await repo.findById('')
  assert.equal(emptyRes1, null)
  assert.equal(calls.from.length, 0, 'No DB query must be made for empty string')

  const emptyRes2 = await repo.findById('   ')
  assert.equal(emptyRes2, null)
  assert.equal(calls.from.length, 0, 'No DB query must be made for whitespace')

  const emptyDel = await repo.delete('   ')
  assert.equal(emptyDel, false)
  assert.equal(calls.from.length, 0, 'delete must return false immediately on whitespace')

  const emptyUpdate = await repo.update('', { name: 'X' })
  assert.equal(emptyUpdate, null)
  assert.equal(calls.from.length, 0, 'update must return null immediately on empty string')

  // 2. Classical SQL Injection payloads treated as literal string parameters
  const sqlPayloads = ["' OR '1'='1", "'; DROP TABLE tasks; --", "admin' --", "' UNION SELECT * FROM tasks --"]

  for (const sql of sqlPayloads) {
    calls.eq.length = 0
    const res = await repo.findById(sql)
    assert.equal(res, null)
    assert.equal(calls.eq.length, 1)
    assert.equal(calls.eq[0].column, 'id')
    assert.equal(calls.eq[0].value, sql, 'SQL injection string must be bound as safe parameter value')
  }
})

// -----------------------------------------------------------------------------
// 5. SEC-INJ-05: Scoped Primary-Key Targeted Deletion
// -----------------------------------------------------------------------------
test('SEC-INJ-05: Scoped Primary-Key Targeted Deletion finds record first, then executes .delete().eq("id", existing.id)', async () => {
  const mockDb = {
    tasks: [
      {
        id: 'primary-key-uuid-999',
        task_id: 'ENG-101',
        name: 'Target Deletion Task',
        status: 'idea'
      }
    ],
    sprints: []
  }

  const { client, calls } = createMockSupabaseClient(mockDb)
  const repo = new SupabaseTaskRepository()
  Object.defineProperty(repo, 'client', { get: () => client })

  // Case A: Successful deletion by ENG-101
  const deleteResult = await repo.delete('ENG-101')
  assert.equal(deleteResult, true, 'delete must return true on success')

  // Verify findById step used task_id
  const findCall = calls.eq.find((c) => c.table === 'tasks' && !c.isDelete)
  assert.ok(findCall, 'Must perform lookup before deletion')
  assert.equal(findCall.column, 'task_id')
  assert.equal(findCall.value, 'ENG-101')

  // Verify delete step executed strictly on Primary Key UUID
  const deleteCall = calls.eq.find((c) => c.table === 'tasks' && c.isDelete)
  assert.ok(deleteCall, 'Must perform delete query on tasks table')
  assert.equal(deleteCall.column, 'id', 'Deletion must be strictly scoped to Primary Key "id"')
  assert.equal(
    deleteCall.value,
    'primary-key-uuid-999',
    'Deletion must target existing.id UUID, never arbitrary filters'
  )

  // Case B: Non-existent record deletion returns false without issuing delete query
  calls.delete.length = 0
  calls.eq.length = 0
  const nonExistentResult = await repo.delete('ENG-99999')
  assert.equal(nonExistentResult, false, 'Non-existent task delete must return false')
  assert.equal(calls.delete.length, 0, 'No delete query must be issued when task is not found')
})
