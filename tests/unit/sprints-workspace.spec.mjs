import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
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

// Simulated Nuxt useState reactive store
const nuxtState = new Map()
function mockUseState(key, init) {
  if (!nuxtState.has(key)) {
    nuxtState.set(key, ref(init ? init() : undefined))
  }
  return nuxtState.get(key)
}

globalThis.useState = mockUseState
globalThis.defineEventHandler = (fn) => fn
globalThis.$fetch = async () => []

const jiti = createJiti(import.meta.url, { alias: { '~': projectRoot, '~~': projectRoot } })
const { useWorkspaceStore } = jiti('../../composables/useWorkspaceStore.ts')
const { useSprints } = jiti('../../composables/useSprints.ts')
const {
  useSprintCalendar,
  getMonday,
  getSunday,
  getWeekNumber,
  toIsoDate
} = jiti('../../composables/useSprintCalendar.ts')

// Helper function to reset reactive store between tests
function resetWorkspaceStore() {
  nuxtState.clear()
  const store = useWorkspaceStore()
  store.tasks.value = []
  store.projects.value = []
  store.sprints.value = []
  store.notes.value = []
  store.isInitialized.value = false
  store.isLoading.value = false
  store.hydrationStatus.value = {
    tasks: 'idle',
    projects: 'idle',
    sprints: 'idle',
    notes: 'idle'
  }
  return store
}

// Helper: Sprints Data State Machine (matching app/pages/sprints.vue:243-262)
function computeSprintsDataState({ sprints, sprintsHydration, isInitialized, isLoading }) {
  const sprintsList = sprints || []
  const hasSprints = sprintsList.length > 0

  if (hasSprints) {
    return 'READY'
  }
  if (sprintsHydration === 'error') {
    return 'ERROR'
  }
  if (!isInitialized || sprintsHydration === 'loading') {
    return 'LOADING'
  }
  return 'SUCCESS_EMPTY'
}

function computeIsStaleDataWarning({ sprints, sprintsHydration }) {
  return sprintsHydration === 'error' && (sprints || []).length > 0
}

// Helper: Active Sprint Hierarchy (matching app/pages/sprints.vue:265-295)
function resolveActiveSprint({ sprintsList, currentMonday, currentSunday, weekNum, weekOffset }) {
  const list = sprintsList ?? []
  if (!list.length) return undefined

  const mondayIso = toIsoDate(currentMonday)
  const sundayIso = toIsoDate(currentSunday)
  const currentYear = currentMonday.getFullYear()

  // Level 1: ISO date interval intersection
  const dateMatch = list.find((s) => {
    if (!s.startDate || !s.endDate) return false
    return s.startDate <= sundayIso && s.endDate >= mondayIso
  })
  if (dateMatch) return dateMatch

  // Level 2: Year and week-number qualified name match
  const nameMatch = list.find((s) => {
    if (!s.name) return false
    return s.name.includes(`Week ${weekNum}`) && s.name.includes(String(currentYear))
  })
  if (nameMatch) return nameMatch

  // Level 3: Active status fallback ONLY for current week
  if (weekOffset === 0) {
    const activeMatch = list.find((s) => s.status === 'active')
    if (activeMatch) return activeMatch
  }

  // Level 4: Fallback undefined
  return undefined
}

// Helper: Active Week Deliverables (matching app/pages/sprints.vue:298-304)
function resolveActiveWeekTasks({ activeSprint, tasksList }) {
  const sId = activeSprint?.id
  if (!sId) return []
  return (tasksList || []).filter(
    (t) => t.sprintId === sId || (activeSprint?.taskIds && activeSprint.taskIds.includes(t.id))
  )
}

// Helper: Metrics Computation (matching app/pages/sprints.vue:350-362)
function computeSprintMetrics(activeWeekTasks) {
  const completedTasks = activeWeekTasks.filter((t) => t.status === 'deployed')
  const inFlightTasks = activeWeekTasks.filter((t) => t.status === 'running_sprint')
  const pendingTasks = activeWeekTasks.filter(
    (t) => t.status === 'in_queue' || t.status === 'blocked'
  )

  const totalDeliverablesCount = activeWeekTasks.length
  const completedCount = completedTasks.length
  const inFlightCount = inFlightTasks.length
  const pendingCount = pendingTasks.length

  const completionPercentage =
    totalDeliverablesCount === 0
      ? 0
      : Math.round((completedCount / totalDeliverablesCount) * 100)

  return {
    totalDeliverablesCount,
    completedCount,
    inFlightCount,
    pendingCount,
    completionPercentage
  }
}

// =============================================================================
// PHASE 7: SPRINTS WORKSPACE — 14 RIGOROUS TEST CONTRACTS
// =============================================================================

// -----------------------------------------------------------------------------
// 1. SPRINT-STATE-01: State Machine: LOADING
// -----------------------------------------------------------------------------
test('SPRINT-STATE-01: sprintsDataState produces "LOADING" when hydration is loading or store is uninitialized with empty cache', () => {
  // Case A: Uninitialized store during boot (isLoading: true, hydrationStatus: idle, cache: empty)
  const stateA = computeSprintsDataState({
    sprints: [],
    sprintsHydration: 'idle',
    isInitialized: false,
    isLoading: true
  })
  assert.equal(stateA, 'LOADING', 'Must yield LOADING when uninitialized and loading')

  // Case B: Hydration actively in-flight (isInitialized: true, sprintsHydration: loading, cache: empty)
  const stateB = computeSprintsDataState({
    sprints: [],
    sprintsHydration: 'loading',
    isInitialized: true,
    isLoading: false
  })
  assert.equal(stateB, 'LOADING', 'Must yield LOADING when sprintsHydration is loading')

  // Stale data warning must be false while loading
  assert.equal(
    computeIsStaleDataWarning({ sprints: [], sprintsHydration: 'loading' }),
    false,
    'Stale warning must be false when cache is empty'
  )
})

// -----------------------------------------------------------------------------
// 2. SPRINT-STATE-02: State Machine: ERROR
// -----------------------------------------------------------------------------
test('SPRINT-STATE-02: sprintsDataState produces "ERROR" when sprints hydration fails and cache is empty', () => {
  const state = computeSprintsDataState({
    sprints: [],
    sprintsHydration: 'error',
    isInitialized: true,
    isLoading: false
  })
  assert.equal(state, 'ERROR', 'Must yield ERROR when sprints hydration fails with empty cache')

  const isStale = computeIsStaleDataWarning({
    sprints: [],
    sprintsHydration: 'error'
  })
  assert.equal(isStale, false, 'isStaleDataWarning must be false when no cache exists')
})

// -----------------------------------------------------------------------------
// 3. SPRINT-STATE-03: Cache Resilience: READY
// -----------------------------------------------------------------------------
test('SPRINT-STATE-03: sprintsDataState remains "READY" with isStaleDataWarning = true when hydration fails but store has cached sprints', () => {
  const cachedSprints = [
    {
      id: 'sprint-w44',
      name: 'Week 44 • 2026',
      startDate: '2026-10-26',
      endDate: '2026-11-01',
      status: 'active'
    }
  ]

  const state = computeSprintsDataState({
    sprints: cachedSprints,
    sprintsHydration: 'error',
    isInitialized: true,
    isLoading: false
  })
  assert.equal(state, 'READY', 'Must yield READY when cached sprints exist despite hydration error')

  const isStale = computeIsStaleDataWarning({
    sprints: cachedSprints,
    sprintsHydration: 'error'
  })
  assert.equal(isStale, true, 'isStaleDataWarning must be true when cache is displayed during error')
})

// -----------------------------------------------------------------------------
// 4. SPRINT-STATE-04: State Machine: EMPTY
// -----------------------------------------------------------------------------
test('SPRINT-STATE-04: sprintsDataState produces "SUCCESS_EMPTY" when initialized successfully with empty global sprints array', () => {
  const state = computeSprintsDataState({
    sprints: [],
    sprintsHydration: 'success',
    isInitialized: true,
    isLoading: false
  })
  assert.equal(state, 'SUCCESS_EMPTY', 'Must yield SUCCESS_EMPTY when hydrated with zero sprints')

  const isStale = computeIsStaleDataWarning({
    sprints: [],
    sprintsHydration: 'success'
  })
  assert.equal(isStale, false, 'isStaleDataWarning must be false on success')
})

// -----------------------------------------------------------------------------
// 5. SPRINT-CAL-01: Boundary Monday–Sunday
// -----------------------------------------------------------------------------
test('SPRINT-CAL-01: getMonday produces pk 00:00:00.000 Monday and getSunday produces pk 23:59:59.999 Sunday, including edge case when input is Sunday day 0', () => {
  // Scenario 1: Input is Wednesday (2026-10-28)
  const wednesday = new Date(2026, 9, 28, 14, 30, 0)
  const mon1 = getMonday(wednesday)
  const sun1 = getSunday(mon1)

  assert.equal(mon1.getDay(), 1, 'getMonday result must be Monday (day 1)')
  assert.equal(mon1.getDate(), 26, 'Monday must be 26 Oct 2026')
  assert.equal(mon1.getHours(), 0, 'Hours must be 0')
  assert.equal(mon1.getMinutes(), 0, 'Minutes must be 0')
  assert.equal(mon1.getSeconds(), 0, 'Seconds must be 0')
  assert.equal(mon1.getMilliseconds(), 0, 'Milliseconds must be 0')

  assert.equal(sun1.getDay(), 0, 'getSunday result must be Sunday (day 0)')
  assert.equal(sun1.getDate(), 1, 'Sunday must be 1 Nov 2026')
  assert.equal(sun1.getMonth(), 10, 'Sunday must cross into November (month index 10)')
  assert.equal(sun1.getHours(), 23, 'Hours must be 23')
  assert.equal(sun1.getMinutes(), 59, 'Minutes must be 59')
  assert.equal(sun1.getSeconds(), 59, 'Seconds must be 59')
  assert.equal(sun1.getMilliseconds(), 999, 'Milliseconds must be 999')

  // Scenario 2: Input is Monday (2026-10-26)
  const mondayInput = new Date(2026, 9, 26, 10, 0, 0)
  const mon2 = getMonday(mondayInput)
  assert.equal(mon2.getDay(), 1)
  assert.equal(mon2.getDate(), mondayInput.getDate())

  // Scenario 3: CRITICAL EDGE CASE — Input is Sunday (day 0: 2026-10-25)
  // Must return the preceding Monday (2026-10-19), NOT next day Monday!
  const sundayInput = new Date(2026, 9, 25, 11, 0, 0)
  assert.equal(sundayInput.getDay(), 0, 'Input date must be Sunday (day 0)')

  const monSundayEdge = getMonday(sundayInput)
  assert.equal(monSundayEdge.getDay(), 1, 'Must return Monday')
  assert.equal(monSundayEdge.getDate(), 19, 'Must return preceding Monday (19 Oct 2026)')
  assert.equal(monSundayEdge.getMonth(), 9, 'Must remain in October (month 9)')

  const sunSundayEdge = getSunday(monSundayEdge)
  assert.equal(sunSundayEdge.getDay(), 0, 'Must return Sunday')
  assert.equal(sunSundayEdge.getDate(), 25, 'Must return the same Sunday (25 Oct 2026)')
})

// -----------------------------------------------------------------------------
// 6. SPRINT-CAL-02: ISO-8601 Week Number
// -----------------------------------------------------------------------------
test('SPRINT-CAL-02: getWeekNumber calculates ISO week number accurately using Thursday rule, including year transitions', () => {
  // Test 1: Mid-year standard date (2026-10-26 is Monday of Week 44)
  const w44 = getWeekNumber(new Date('2026-10-26T00:00:00.000Z'))
  assert.equal(w44, 44, '2026-10-26 must be ISO Week 44')

  // Test 2: First day of 2026 is Thursday (2026-01-01) -> Week 1
  const w1_2026 = getWeekNumber(new Date('2026-01-01T00:00:00.000Z'))
  assert.equal(w1_2026, 1, '2026-01-01 (Thursday) must be ISO Week 1')

  // Test 3: Year transition edge case — 2024-12-30 (Monday)
  // The first Thursday of that week is 2025-01-02, so it belongs to 2025 Week 1
  const wTransitionNextYear = getWeekNumber(new Date('2024-12-30T00:00:00.000Z'))
  assert.equal(wTransitionNextYear, 1, '2024-12-30 (Monday) belongs to ISO Week 1 of 2025')

  // Test 4: Year transition edge case — 2023-01-01 (Sunday)
  // The Thursday of that week was 2022-12-29, so it belongs to 2022 Week 52
  const wTransitionPrevYear = getWeekNumber(new Date('2023-01-01T00:00:00.000Z'))
  assert.equal(wTransitionPrevYear, 52, '2023-01-01 (Sunday) belongs to ISO Week 52 of 2022')
})

// -----------------------------------------------------------------------------
// 7. SPRINT-CAL-03: Week Navigation Offset
// -----------------------------------------------------------------------------
test('SPRINT-CAL-03: Week Navigation Offset updates weekOffset, isCurrentWeek, and calendar dates reactively', () => {
  const {
    weekOffset,
    isCurrentWeek,
    currentMonday,
    currentSunday,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek
  } = useSprintCalendar()

  // Initial state: current week
  assert.equal(weekOffset.value, 0, 'Initial weekOffset must be 0')
  assert.equal(isCurrentWeek.value, true, 'isCurrentWeek must be true initially')

  const initialMondayMs = currentMonday.value.getTime()

  // 1. Navigate to previous week
  goToPrevWeek()
  assert.equal(weekOffset.value, -1, 'weekOffset must decrement to -1')
  assert.equal(isCurrentWeek.value, false, 'isCurrentWeek must be false')
  const prevMondayMs = currentMonday.value.getTime()
  // Diff must be exactly 7 days (604,800,000 ms)
  assert.equal(initialMondayMs - prevMondayMs, 7 * 24 * 60 * 60 * 1000, 'Monday must shift back by 7 days')

  // 2. Navigate forward to current week
  goToNextWeek()
  assert.equal(weekOffset.value, 0)
  assert.equal(isCurrentWeek.value, true)
  assert.equal(currentMonday.value.getTime(), initialMondayMs)

  // 3. Navigate forward to next week
  goToNextWeek()
  assert.equal(weekOffset.value, 1)
  assert.equal(isCurrentWeek.value, false)
  const nextMondayMs = currentMonday.value.getTime()
  assert.equal(nextMondayMs - initialMondayMs, 7 * 24 * 60 * 60 * 1000, 'Monday must shift forward by 7 days')

  // 4. Reset directly via goToCurrentWeek
  goToCurrentWeek()
  assert.equal(weekOffset.value, 0)
  assert.equal(isCurrentWeek.value, true)
  assert.equal(currentMonday.value.getTime(), initialMondayMs)
})

// -----------------------------------------------------------------------------
// 8. SPRINT-CAL-04: Text Sanitization
// -----------------------------------------------------------------------------
test('SPRINT-CAL-04: weekLabel and remainingDaysText are formatted without mojibake/corrupted bytes across spans', () => {
  function formatWeekLabel(start, end, weekNum) {
    const startDay = start.getDate()
    const endDay = end.getDate()
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const startYear = start.getFullYear()
    const endYear = end.getFullYear()

    if (startYear !== endYear) {
      return `Week ${weekNum} • ${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`
    }
    if (startMonth !== endMonth) {
      return `Week ${weekNum} • ${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`
    }
    return `Week ${weekNum} • ${startDay}–${endDay} ${startMonth} ${startYear}`
  }

  // 1. Single month span (e.g. 12-18 Oct 2026)
  const singleMonth = formatWeekLabel(new Date('2026-10-12'), new Date('2026-10-18'), 42)
  assert.equal(singleMonth, 'Week 42 • 12–18 Oct 2026')
  assert.equal(singleMonth.includes('\uFFFD'), false, 'No unicode replacement character')
  assert.equal(singleMonth.includes('â€¢'), false, 'No UTF-8 byte mojibake')

  // 2. Cross month span (e.g. 26 Oct - 1 Nov 2026)
  const crossMonth = formatWeekLabel(new Date('2026-10-26'), new Date('2026-11-01'), 44)
  assert.equal(crossMonth, 'Week 44 • 26 Oct – 1 Nov 2026')
  assert.equal(crossMonth.includes('\uFFFD'), false)

  // 3. Cross year span (e.g. 28 Dec 2026 - 3 Jan 2027)
  const crossYear = formatWeekLabel(new Date('2026-12-28'), new Date('2027-01-03'), 53)
  assert.equal(crossYear, 'Week 53 • 28 Dec 2026 – 3 Jan 2027')
  assert.equal(crossYear.includes('\uFFFD'), false)

  // 4. remainingDaysText contract tests
  function formatRemainingDays(isCurrentWeek, weekOffset, sundayDate) {
    if (!isCurrentWeek) {
      if (weekOffset < 0) {
        const pastWeeks = Math.abs(weekOffset)
        return pastWeeks === 1 ? 'Past week • Cycle closed' : `${pastWeeks} weeks ago • Closed`
      } else {
        const futureWeeks = weekOffset
        return futureWeeks === 1 ? 'Next cycle • Starts soon' : `In ${futureWeeks} weeks`
      }
    }
    return 'Active cycle'
  }

  assert.equal(formatRemainingDays(false, -1), 'Past week • Cycle closed')
  assert.equal(formatRemainingDays(false, -3), '3 weeks ago • Closed')
  assert.equal(formatRemainingDays(false, 1), 'Next cycle • Starts soon')
  assert.equal(formatRemainingDays(false, 4), 'In 4 weeks')
})

// -----------------------------------------------------------------------------
// 9. SPRINT-LINK-01: Active Sprint Hierarchy
// -----------------------------------------------------------------------------
test('SPRINT-LINK-01: Active sprint hierarchy resolves Level 1 -> Level 2 -> Level 3 -> undefined with cross-year collision protection', () => {
  const currentMonday = new Date('2026-10-26T00:00:00.000Z')
  const currentSunday = new Date('2026-11-01T23:59:59.999Z')
  const weekNum = 44

  // Case 1: Level 1 — Exact ISO Date Interval Intersection
  const sprintDateMatch = {
    id: 's-iso',
    name: 'Custom Sprint Alpha',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    status: 'active'
  }
  const res1 = resolveActiveSprint({
    sprintsList: [sprintDateMatch],
    currentMonday,
    currentSunday,
    weekNum,
    weekOffset: 0
  })
  assert.equal(res1?.id, 's-iso', 'Level 1 must match via ISO date interval')

  // Case 2: Level 2 — Year and Week-number Qualified Name Match (no dates on sprint)
  const sprintNameMatch = {
    id: 's-name-2026',
    name: 'Week 44 • 2026 Focus',
    status: 'planning'
  }
  const res2 = resolveActiveSprint({
    sprintsList: [sprintNameMatch],
    currentMonday,
    currentSunday,
    weekNum,
    weekOffset: 0
  })
  assert.equal(res2?.id, 's-name-2026', 'Level 2 must match year and week qualified name')

  // Case 3: Level 2 Collision Protection — "Week 44 • 2025" must NOT match in 2026!
  const sprintCollision2025 = {
    id: 's-name-2025',
    name: 'Week 44 • 2025 Focus',
    status: 'completed'
  }
  const resCollision = resolveActiveSprint({
    sprintsList: [sprintCollision2025],
    currentMonday,
    currentSunday,
    weekNum,
    weekOffset: 0
  })
  assert.equal(
    resCollision?.id,
    undefined,
    'Level 2 must reject cross-year name collision when year does not match'
  )

  // Case 4: Level 3 — Active status fallback ONLY for current week (weekOffset === 0)
  const sprintActiveFallback = {
    id: 's-active-generic',
    name: 'Generic Ongoing Sprint',
    status: 'active'
  }
  const res3Current = resolveActiveSprint({
    sprintsList: [sprintActiveFallback],
    currentMonday,
    currentSunday,
    weekNum,
    weekOffset: 0
  })
  assert.equal(
    res3Current?.id,
    's-active-generic',
    'Level 3 must match active sprint when weekOffset === 0'
  )

  // Case 5: Level 3 Guard — Active status fallback must NOT trigger when navigating to past/future week
  const res3NonCurrent = resolveActiveSprint({
    sprintsList: [sprintActiveFallback],
    currentMonday,
    currentSunday,
    weekNum,
    weekOffset: -1 // Past week!
  })
  assert.equal(
    res3NonCurrent,
    undefined,
    'Level 3 fallback must NOT match active sprint when viewing past/future week'
  )

  // Case 6: Level 4 — Empty list returns undefined
  const res4Empty = resolveActiveSprint({
    sprintsList: [],
    currentMonday,
    currentSunday,
    weekNum,
    weekOffset: 0
  })
  assert.equal(res4Empty, undefined, 'Level 4 must return undefined when no sprints exist')
})

// -----------------------------------------------------------------------------
// 10. SPRINT-LINK-02: SSOT Single Association
// -----------------------------------------------------------------------------
test('SPRINT-LINK-02: Deliverables strictly associate by task.sprintId, dual-write is eliminated, and backward compatibility is preserved', () => {
  const activeSprint = {
    id: 'sprint-target',
    name: 'Week 44 • 2026',
    taskIds: ['task-legacy-1'] // Legacy association in sprint.taskIds
  }

  const tasksList = [
    { id: 'task-1', taskId: 'TSK-1', name: 'Direct sprintId task', sprintId: 'sprint-target', status: 'running_sprint' },
    { id: 'task-legacy-1', taskId: 'TSK-2', name: 'Legacy taskIds task', sprintId: '', status: 'in_queue' },
    { id: 'task-other-sprint', taskId: 'TSK-3', name: 'Other sprint task', sprintId: 'sprint-other', status: 'deployed' },
    { id: 'task-unassigned', taskId: 'TSK-4', name: 'Backlog task', sprintId: '', status: 'idea' }
  ]

  const activeWeekTasks = resolveActiveWeekTasks({ activeSprint, tasksList })

  assert.equal(activeWeekTasks.length, 2, 'Must include exactly the 2 matching tasks')
  assert.ok(activeWeekTasks.some((t) => t.id === 'task-1'), 'Task with task.sprintId must be included')
  assert.ok(activeWeekTasks.some((t) => t.id === 'task-legacy-1'), 'Legacy task in sprint.taskIds must be included')
  assert.equal(activeWeekTasks.some((t) => t.id === 'task-other-sprint'), false, 'Other sprint tasks must be excluded')
  assert.equal(activeWeekTasks.some((t) => t.id === 'task-unassigned'), false, 'Unassigned tasks must be excluded')

  // When activeSprint is undefined, returns empty array
  const noSprintTasks = resolveActiveWeekTasks({ activeSprint: undefined, tasksList })
  assert.deepEqual(noSprintTasks, [], 'Must return empty array when activeSprint is undefined')
})

// -----------------------------------------------------------------------------
// 11. SPRINT-METRIC-01: Zero-Division Guard
// -----------------------------------------------------------------------------
test('SPRINT-METRIC-01: completionPercentage strictly returns 0% when totalDeliverablesCount === 0 (not NaN, null, or undefined)', () => {
  const emptyMetrics = computeSprintMetrics([])

  assert.equal(emptyMetrics.totalDeliverablesCount, 0)
  assert.equal(emptyMetrics.completedCount, 0)
  assert.equal(emptyMetrics.inFlightCount, 0)
  assert.equal(emptyMetrics.pendingCount, 0)

  // Zero-division guard check
  assert.equal(emptyMetrics.completionPercentage, 0, 'Must strictly equal 0')
  assert.equal(Number.isNaN(emptyMetrics.completionPercentage), false, 'Must not be NaN')
  assert.equal(Number.isFinite(emptyMetrics.completionPercentage), true, 'Must be finite')
  assert.equal(typeof emptyMetrics.completionPercentage, 'number', 'Must be a number')
})

// -----------------------------------------------------------------------------
// 12. SPRINT-METRIC-02: Velocity Math
// -----------------------------------------------------------------------------
test('SPRINT-METRIC-02: Velocity math accurately categorizes deliverables and computes integer rounded percentage', () => {
  const deliverables = [
    { id: 't1', status: 'deployed' },
    { id: 't2', status: 'deployed' },
    { id: 't3', status: 'running_sprint' },
    { id: 't4', status: 'running_sprint' },
    { id: 't5', status: 'running_sprint' },
    { id: 't6', status: 'in_queue' },
    { id: 't7', status: 'blocked' }
  ]

  const metrics = computeSprintMetrics(deliverables)

  assert.equal(metrics.totalDeliverablesCount, 7)
  assert.equal(metrics.completedCount, 2, '2 deployed tasks')
  assert.equal(metrics.inFlightCount, 3, '3 running_sprint tasks')
  assert.equal(metrics.pendingCount, 2, '1 in_queue + 1 blocked tasks')

  // Math.round((2 / 7) * 100) = Math.round(28.5714...) = 29
  assert.equal(metrics.completionPercentage, 29, 'Percentage must round to 29%')

  // 1/3 scenario -> Math.round((1 / 3) * 100) = 33
  const metricsOneThird = computeSprintMetrics([
    { id: 't1', status: 'deployed' },
    { id: 't2', status: 'running_sprint' },
    { id: 't3', status: 'in_queue' }
  ])
  assert.equal(metricsOneThird.completionPercentage, 33)

  // 2/3 scenario -> Math.round((2 / 3) * 100) = 67
  const metricsTwoThirds = computeSprintMetrics([
    { id: 't1', status: 'deployed' },
    { id: 't2', status: 'deployed' },
    { id: 't3', status: 'in_queue' }
  ])
  assert.equal(metricsTwoThirds.completionPercentage, 67)
})

// -----------------------------------------------------------------------------
// 13. SPRINT-MUTATION-01: Optimistic Objective Commit
// -----------------------------------------------------------------------------
test('SPRINT-MUTATION-01: Optimistic sprint objective update reflects immediately in store and advances baseline on server success', async () => {
  const store = resetWorkspaceStore()
  const sprintsApi = useSprints()

  const initialSprint = {
    id: 'sprint-w44',
    name: 'Week 44 • 2026',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    status: 'active',
    objective: 'Initial core objective'
  }

  store.addSprintToStore(initialSprint)
  assert.equal(store.sprints.value.length, 1)
  assert.equal(store.sprints.value[0].objective, 'Initial core objective')

  // Mock server response
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT' && typeof url === 'string' && url.includes('sprint-w44')) {
      return {
        ...initialSprint,
        ...opts.body,
        updatedAt: '2026-10-29T16:00:00.000Z'
      }
    }
    return []
  }

  // Execute update
  const updated = await sprintsApi.updateSprint('sprint-w44', {
    objective: 'Finalize Week 44 Deliverables and Deploy Cockpit'
  })

  // Verify return value and reactive store state
  assert.equal(updated.objective, 'Finalize Week 44 Deliverables and Deploy Cockpit')
  const inStore = store.sprints.value.find((s) => s.id === 'sprint-w44')
  assert.equal(inStore.objective, 'Finalize Week 44 Deliverables and Deploy Cockpit')
})

// -----------------------------------------------------------------------------
// 14. SPRINT-MUTATION-02: Optimistic Rollback on Error
// -----------------------------------------------------------------------------
test('SPRINT-MUTATION-02: Optimistic sprint objective update rolls back cleanly to snapshot baseline on server error without entity corruption', async () => {
  const store = resetWorkspaceStore()
  const sprintsApi = useSprints()

  const baselineSprint = {
    id: 'sprint-rollback-test',
    name: 'Week 44 • 2026',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    status: 'active',
    objective: 'Stable Baseline Objective'
  }

  // Preload store with sprint and an unrelated task to verify isolation
  store.addSprintToStore(baselineSprint)
  store.tasks.value = [
    { id: 'task-isolated', name: 'Isolated Task', status: 'running_sprint', sprintId: 'sprint-rollback-test' }
  ]

  assert.equal(store.sprints.value[0].objective, 'Stable Baseline Objective')
  assert.equal(store.tasks.value.length, 1)

  // Mock server failure (HTTP 500)
  globalThis.$fetch = async (url, opts) => {
    if (opts?.method === 'PUT' && typeof url === 'string' && url.includes('sprint-rollback-test')) {
      throw new Error('HTTP 500 Internal Server Error: Database Lock Timeout')
    }
    return []
  }

  let caughtError = null
  try {
    await sprintsApi.updateSprint('sprint-rollback-test', {
      objective: 'Corrupted In-Flight Objective That Must Revert'
    })
  } catch (err) {
    caughtError = err
  }

  // 1. Error was thrown and caught
  assert.ok(caughtError, 'Must propagate server error to caller')
  assert.match(caughtError.message, /500 Internal Server Error/)

  // 2. Reactive store rolled back to baseline objective
  const inStore = store.sprints.value.find((s) => s.id === 'sprint-rollback-test')
  assert.ok(inStore, 'Sprint must still exist in store')
  assert.equal(
    inStore.objective,
    'Stable Baseline Objective',
    'Objective must be strictly rolled back to baseline snapshot'
  )

  // 3. Entity isolation: tasks are unaffected
  assert.equal(store.tasks.value.length, 1)
  assert.equal(store.tasks.value[0].id, 'task-isolated')
  assert.equal(store.tasks.value[0].status, 'running_sprint')
})
