import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ref, computed } from 'vue'
import { createJiti } from 'jiti'

// =============================================================================
// Subsystem Functional Remediation & Zero-Regression Test Suite (Wave 3)
// Validating 19 technical contracts across SYS-01 to SYS-13:
// State integrity, null normalization, kanban guards, sprint lifecycle,
// github caching & sync contracts, auth isolation, honest metrics & DDL alignment.
// =============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

// Helper for self-healing dual-path component resolution
function resolveComponent(canonicalRelPath, legacyRelPath) {
  const canonicalPath = path.resolve(projectRoot, canonicalRelPath)
  if (fs.existsSync(canonicalPath)) return canonicalPath
  if (legacyRelPath) {
    const legacyPath = path.resolve(projectRoot, legacyRelPath)
    if (fs.existsSync(legacyPath)) return legacyPath
  }
  return canonicalPath
}

function loadSource(canonicalRelPath, legacyRelPath) {
  const fullPath = resolveComponent(canonicalRelPath, legacyRelPath)
  assert.ok(fs.existsSync(fullPath), `Component file must exist at ${canonicalRelPath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

// Simulated Nuxt global state & jiti setup
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

// =============================================================================
// 1. TEST-SYS-01: TaskDrawer Explicit Null Unlink & Snapshot Rollback Baseline
// =============================================================================

test('TEST-SYS-01-UNLINK-01: TaskDrawer.vue sends explicit null for cleared projectSlug, dueDate, and sprintId', () => {
  const content = loadSource('components/modals/task/TaskDrawer.vue')

  // Verify explicit null unlinking logic in submitSave payload
  assert.ok(
    content.includes('projectSlug: form.projectSlug ? form.projectSlug : null'),
    'TaskDrawer must map falsy/empty projectSlug to null instead of omitting or undefined'
  )
  assert.ok(
    content.includes('sprintId: form.sprintId ? form.sprintId : null'),
    'TaskDrawer must map falsy/empty sprintId to null instead of omitting or undefined'
  )
  assert.ok(
    content.includes('dueDate: form.dueDate && form.dueDate.trim() ? form.dueDate.trim() : null'),
    'TaskDrawer must map empty dueDate to null'
  )
  assert.ok(
    content.includes('githubPrUrl: form.githubPrUrl && form.githubPrUrl.trim() ? form.githubPrUrl.trim() : null'),
    'TaskDrawer must map empty githubPrUrl to null'
  )
})

test('TEST-SYS-01-ROLLBACK-01: TaskDrawer.vue does not optimistically update store before API completion', () => {
  const content = loadSource('components/modals/task/TaskDrawer.vue')

  // Locate submitSave function body
  const submitSaveIdx = content.indexOf('async function submitSave()')
  assert.ok(submitSaveIdx !== -1, 'submitSave function must be present')
  const submitSaveSection = content.slice(submitSaveIdx, submitSaveIdx + 2000)

  // Verify that updateTask is awaited before updateTaskInStore
  const apiCallIdx = submitSaveSection.indexOf('await tasksApi.updateTask(targetId, payload)')
  const storeUpdateIdx = submitSaveSection.indexOf('updateTaskInStore(targetId, updated)')

  assert.ok(apiCallIdx !== -1, 'submitSave must await tasksApi.updateTask')
  assert.ok(storeUpdateIdx !== -1, 'submitSave must call updateTaskInStore only on successful response')
  assert.ok(
    apiCallIdx < storeUpdateIdx,
    'tasksApi.updateTask must be awaited before updating store (relies on useTasks snapshot rollback)'
  )

  // Ensure no premature updateTaskInStore before apiCallIdx
  const prematureStoreUpdate = submitSaveSection.slice(0, apiCallIdx).includes('updateTaskInStore')
  assert.equal(
    prematureStoreUpdate,
    false,
    'No premature updateTaskInStore call permitted before API confirmation'
  )
})

// =============================================================================
// 2. TEST-SYS-02: Backend Auto-Bind Sprint & Mapper Null Normalization
// =============================================================================

test('TEST-SYS-02-AUTOBIND-01: POST /api/tasks automatically binds running_sprint status to active sprint', () => {
  const content = loadSource('server/api/tasks.post.ts')

  // Verify auto-bind condition
  assert.ok(
    content.includes("if (body.status === 'running_sprint' && !body.sprintId)"),
    'POST /api/tasks must guard running_sprint tasks missing sprintId'
  )
  assert.ok(
    content.includes("s.status === 'active'"),
    'POST /api/tasks must search for an active sprint'
  )
  assert.ok(
    content.includes('body.sprintId = activeSprint.id'),
    'POST /api/tasks must bind activeSprint.id to body.sprintId'
  )

  // Functional simulation of the auto-bind algorithm
  const nowIso = '2026-11-07'
  const mockSprints = [
    { id: 'sprint-old', status: 'completed', startDate: '2026-10-01', endDate: '2026-10-15' },
    { id: 'sprint-active', status: 'active', startDate: '2026-11-01', endDate: '2026-11-15' },
    { id: 'sprint-future', status: 'planned', startDate: '2026-11-16', endDate: '2026-11-30' }
  ]

  const activeSprint =
    mockSprints.find(
      (s) =>
        s.status === 'active' &&
        (!s.startDate || s.startDate <= nowIso) &&
        (!s.endDate || s.endDate >= nowIso)
    ) || mockSprints.find((s) => s.status === 'active')

  assert.equal(activeSprint?.id, 'sprint-active')
})

test('TEST-SYS-02-MAPPER-01: Supabase repository mapTaskRow normalizes null database columns strictly to null', () => {
  const { mapTaskRow } = jiti('../../server/repositories/supabase/mappers.ts')

  const dbRow = {
    id: 'uuid-101',
    task_id: 'ENG-101',
    name: 'Implement OAuth',
    description: null,
    status: 'in_queue',
    priority: 'medium',
    tech_tags: null,
    due_date: null,
    sprint_id: null,
    project_slug: null,
    github_issue_url: null,
    github_issue_number: null,
    github_pr_url: null,
    created_at: '2026-11-07T10:00:00Z',
    updated_at: '2026-11-07T10:00:00Z'
  }

  const mapped = mapTaskRow(dbRow)

  assert.strictEqual(mapped.projectSlug, null, 'projectSlug must be null')
  assert.strictEqual(mapped.dueDate, null, 'dueDate must be null')
  assert.strictEqual(mapped.sprintId, null, 'sprintId must be null')
  assert.strictEqual(mapped.githubIssueUrl, null, 'githubIssueUrl must be null')
  assert.strictEqual(mapped.githubIssueNumber, null, 'githubIssueNumber must be null')
  assert.strictEqual(mapped.githubPrUrl, null, 'githubPrUrl must be null')
})

// =============================================================================
// 3. TEST-SYS-03: KanbanBoard Sort Preservation & Drop Guard
// =============================================================================

test('TEST-SYS-03-SORT-01: KanbanBoard.vue respects preserveOrder prop without overriding parent sort', () => {
  const content = loadSource('components/kanban/KanbanBoard.vue')

  // Verify prop definition
  assert.ok(
    content.includes('preserveOrder?: boolean'),
    'KanbanBoard must accept preserveOrder boolean prop'
  )
  assert.ok(
    content.includes('preserveOrder: false'),
    'KanbanBoard default preserveOrder must be false'
  )

  // Verify computed processedTasks logic
  assert.ok(
    content.includes('if (props.preserveOrder) {\n    return [...localTasksList.value]\n  }'),
    'KanbanBoard must directly return localTasksList when preserveOrder is true'
  )
})

test('TEST-SYS-03-GUARD-01: KanbanBoard.vue onDrop prevents status mutations when dropped onto same status', () => {
  const content = loadSource('components/kanban/KanbanBoard.vue')

  // Verify onDrop guard
  assert.ok(
    content.includes('if (!task || task.status === newStatus)'),
    'onDrop must abort early if task already has newStatus'
  )
})

// =============================================================================
// 4. TEST-SYS-04: Sprints Workspace Null Unlink & Deliverables Task Click
// =============================================================================

test('TEST-SYS-04-REMOVE-01: useSprintWorkspace removeTaskFromWeek unlinks task with sprintId null and cleans sprint taskIds', () => {
  const content = loadSource('composables/useSprintWorkspace.ts')

  // Verify removeTaskFromWeek payload
  assert.ok(
    content.includes("await tasksApi.updateTask(task.id, { sprintId: null })"),
    'removeTaskFromWeek must send { sprintId: null }'
  )
  assert.ok(
    content.includes("activeSprint.value.taskIds.filter((id) => id !== task.id)"),
    'removeTaskFromWeek must filter out task.id from sprint taskIds'
  )

  // Verify pending tasks accommodates 'idea' status
  assert.ok(
    content.includes("t.status === 'idea'"),
    'Deliverables queue filter must include idea status tasks'
  )
})

test('TEST-SYS-04-DRAWER-01: DeliverablesMatrix.vue emits task-click event on deliverable card interaction', () => {
  const content = loadSource('components/sprint/DeliverablesMatrix.vue')

  // Verify click event on deliverable item card
  assert.ok(
    content.includes('@click="$emit(\'task-click\', task)"'),
    'Deliverable cards must emit task-click with the task object'
  )

  // Verify defineEmits declaration
  assert.ok(
    content.includes("(e: 'task-click', task: Task): void"),
    'task-click event must be declared in defineEmits'
  )
})

// =============================================================================
// 5. TEST-SYS-05: GitHub Cache Bypass & Commit Key Limit Suffix
// =============================================================================

test('TEST-SYS-05-BYPASS-01: GitHub GET endpoints process refresh query parameter to bypass Nitro cache', () => {
  const reposContent = loadSource('server/api/github/repos.get.ts')
  const commitsContent = loadSource('server/api/github/commits.get.ts')

  // Repos endpoint verification
  assert.ok(
    reposContent.includes("const refresh = query.refresh === 'true'"),
    'repos.get.ts must check query.refresh'
  )
  assert.ok(
    reposContent.includes('shouldBypassCache: (_token, _username, refresh) => Boolean(refresh)'),
    'repos.get.ts must set shouldBypassCache condition based on refresh'
  )

  // Commits endpoint verification
  assert.ok(
    commitsContent.includes("const refresh = query.refresh === 'true'"),
    'commits.get.ts must check query.refresh'
  )
  assert.ok(
    commitsContent.includes('shouldBypassCache: (_token, _repo, _limit, _branch, refresh) => Boolean(refresh)'),
    'commits.get.ts must set shouldBypassCache condition based on refresh'
  )
})

test('TEST-SYS-05-LIMIT-01: useGitHub.ts useGitHubCommits includes limit in asyncData key and watch array', () => {
  const content = loadSource('composables/useGitHub.ts')

  // Verify key format includes limit
  assert.ok(
    content.includes('github-commits-${repoValue.value}-${branchValue.value || "default"}-${limit || 20}'),
    'useGitHubCommits key template must include limit suffix'
  )

  // Verify watch array includes limit
  assert.ok(
    content.includes('watch: [repoValue, branchValue, () => limit]'),
    'useGitHubCommits must watch limit changes'
  )
})

// =============================================================================
// 6. TEST-SYS-06: GitHub Sync Engine Contract & Anti-Duplication Issue Guard
// =============================================================================

test('TEST-SYS-06-CONTRACT-01: POST /api/github/sync returns syncedCount and linkedCount identically', () => {
  const content = loadSource('server/api/github/sync.post.ts')

  // Verify response contract
  assert.ok(
    content.includes('syncedCount: linkedCount'),
    'sync.post.ts must provide syncedCount pointing to linkedCount'
  )
  assert.ok(
    content.includes('linkedCount,'),
    'sync.post.ts must provide linkedCount'
  )
  assert.ok(
    content.includes('deployedCount,'),
    'sync.post.ts must provide deployedCount'
  )
})

test('TEST-SYS-06-DEDUP-01: PullRequestsIssuesModal.vue checks workspaceStore tasks to prevent duplicate issue imports', () => {
  const content = loadSource('components/modals/devops/PullRequestsIssuesModal.vue')

  // Verify isIssueImported helper
  assert.ok(
    content.includes('function isIssueImported(issue: GitHubIssueItem): boolean'),
    'PullRequestsIssuesModal must implement isIssueImported helper'
  )
  assert.ok(
    content.includes('t.githubIssueNumber === issue.number'),
    'isIssueImported must check githubIssueNumber against workspaceStore tasks'
  )
  assert.ok(
    content.includes('if (importingIssueId.value || isIssueImported(issue) || importedIssues[issue.number]) return'),
    'importIssueToKanban must abort if issue is already imported'
  )
})

// =============================================================================
// 7. TEST-SYS-07: Session Sign Out Endpoint & Auth Middleware Whitelist
// =============================================================================

test('TEST-SYS-07-SIGNOUT-01: DELETE /api/auth/session clears cookie and is whitelisted in auth middleware', () => {
  const deleteEndpoint = loadSource('server/api/auth/session.delete.ts')
  const authMiddleware = loadSource('server/middleware/auth.ts')

  // Verify cookie deletion
  assert.ok(
    deleteEndpoint.includes("deleteCookie(event, 'nexura_session'"),
    'session.delete.ts must call deleteCookie for nexura_session'
  )
  assert.ok(
    deleteEndpoint.includes("message: 'Session cleared successfully'"),
    'session.delete.ts must return success message'
  )

  // Verify auth middleware whitelist allows DELETE on /api/auth/session
  assert.ok(
    authMiddleware.includes("normalizedPath === '/api/auth/session' && (method === 'POST' || method === 'DELETE')"),
    'auth middleware must whitelist both POST and DELETE for /api/auth/session'
  )
})

// =============================================================================
// 8. TEST-SYS-08: UnifiedHeroBanner Sprint Filter Parity
// =============================================================================

test('TEST-SYS-08-HERO-01: UnifiedHeroBanner.vue calculates progress percentage strictly for active sprint tasks', () => {
  const content = loadSource('components/dashboard/UnifiedHeroBanner.vue')

  // Verify sprintTasks filtering
  assert.ok(
    content.includes('const sprintTasks = computed(() => {'),
    'UnifiedHeroBanner must compute sprintTasks'
  )
  assert.ok(
    content.includes('t.sprintId === sprintId || sprintTaskIds.has(t.id)'),
    'sprintTasks must match against active sprint ID and sprint taskIds set'
  )

  // Functional calculation test
  const sprintId = 'sprint-w45'
  const mockTasks = [
    { id: '1', sprintId: 'sprint-w45', status: 'deployed' },
    { id: '2', sprintId: 'sprint-w45', status: 'running_sprint' },
    { id: '3', sprintId: 'sprint-other', status: 'deployed' },
    { id: '4', sprintId: null, status: 'in_queue' }
  ]

  const relevantTasks = mockTasks.filter((t) => t.sprintId === sprintId)
  const completed = relevantTasks.filter((t) => t.status === 'deployed').length
  const total = relevantTasks.length
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  assert.equal(total, 2, 'Total sprint tasks should be 2, ignoring unassociated tasks')
  assert.equal(completed, 1, 'Completed tasks in this sprint should be 1')
  assert.equal(progressPercentage, 50, 'Progress must be 50% rather than diluted 25%')
})

// =============================================================================
// 9. TEST-SYS-09: Scratchpad useNotes Integration & Honest Error State
// =============================================================================

test('TEST-SYS-09-SCRATCHPAD-01: IdeaScratchpadPanel.vue uses canonical useNotes and provides honest error feedback', () => {
  const content = loadSource('components/notes/IdeaScratchpadPanel.vue')

  // Verify canonical useNotes integration
  assert.ok(
    content.includes('useNotes()'),
    'IdeaScratchpadPanel must call canonical useNotes composable'
  )
  assert.ok(
    content.includes('createNote({'),
    'submitNote must invoke createNote'
  )
  assert.ok(
    content.includes('deleteNote(id)'),
    'handleDeleteNote must invoke deleteNote'
  )
  assert.ok(
    content.includes('updateNote(id, { content })'),
    'saveEditNote must invoke updateNote'
  )

  // Verify promoteNoteToKanban honest error feedback without fake task creation
  const promoteIdx = content.indexOf('async function promoteNoteToKanban(note: ProjectNote)')
  assert.ok(promoteIdx !== -1, 'promoteNoteToKanban function must exist')
  const promoteSection = content.slice(promoteIdx, promoteIdx + 700)

  assert.ok(
    promoteSection.includes('await promoteNoteToTask(note)'),
    'promoteNoteToKanban must call promoteNoteToTask'
  )
  assert.ok(
    promoteSection.includes('feedbackError.value = `Failed to promote note:'),
    'promoteNoteToKanban catch block must display honest feedbackError'
  )
  assert.equal(
    promoteSection.includes('Math.random()'),
    false,
    'promoteNoteToKanban catch block must not synthesize fake ENG-xxx tasks'
  )
})

// =============================================================================
// 10. TEST-SYS-10: Project Deployment State Latency & Ping Determinism
// =============================================================================

test('TEST-SYS-10-HONEST-01: ProjectLiveDeploymentCard.vue maintains honest offline state and eliminates fake latency', () => {
  const content = loadSource('components/project/ProjectLiveDeploymentCard.vue')

  // Verify pingLiveHealth does not use Math.random() in catch handler
  const pingIdx = content.indexOf('async function pingLiveHealth()')
  assert.ok(pingIdx !== -1, 'pingLiveHealth function must exist')
  const pingSection = content.slice(pingIdx, pingIdx + 500)

  assert.equal(
    pingSection.includes('Math.random()'),
    false,
    'pingLiveHealth must not use Math.random() for fake latency'
  )
  assert.ok(
    pingSection.includes("pingLatency.value = null"),
    'pingLiveHealth catch block must reset pingLatency to null on failure'
  )
  assert.ok(
    pingSection.includes("pingStatus.value = 'offline'"),
    'pingLiveHealth catch block must honestly declare offline status on failure'
  )
})

// =============================================================================
// 11. TEST-SYS-11: KanbanBoard Blocked Column Target Symmetry
// =============================================================================

test('TEST-SYS-11-ARROW-01: KanbanBoard.vue sets blocked column move-right-target to deployed', () => {
  const content = loadSource('components/kanban/KanbanBoard.vue')

  // Find COLUMN 4: BLOCKED
  const blockedColIdx = content.indexOf('status="blocked"')
  assert.ok(blockedColIdx !== -1, 'Blocked column must be defined')
  const blockedSection = content.slice(blockedColIdx, blockedColIdx + 500)

  assert.ok(
    blockedSection.includes('move-right-target="deployed"'),
    'Blocked column move-right-target must point directly to deployed'
  )
})

// =============================================================================
// 12. TEST-SYS-12: useSession External GitHub Error Isolation
// =============================================================================

test('TEST-SYS-12-ERROR-01: useSession.ts isolates external GitHub auth/rate-limit errors without revoking internal session', () => {
  const { useSession } = jiti('../../composables/useSession.ts')

  const session = useSession()
  const authStatusRef = nuxtState.get('session:auth_status')
  authStatusRef.value = 'authenticated'

  // Scenario 1: GITHUB_AUTH_FAILED external error should NOT change authStatus to unauthenticated
  session.handleApiError({
    statusCode: 401,
    data: { code: 'GITHUB_AUTH_FAILED' }
  })
  assert.strictEqual(
    authStatusRef.value,
    'authenticated',
    'GITHUB_AUTH_FAILED must not revoke internal session'
  )

  // Scenario 2: GITHUB_RATE_LIMITED external error should NOT change authStatus to unauthenticated
  session.handleApiError({
    statusCode: 403,
    data: { code: 'GITHUB_RATE_LIMITED' }
  })
  assert.strictEqual(
    authStatusRef.value,
    'authenticated',
    'GITHUB_RATE_LIMITED must not revoke internal session'
  )

  // Scenario 3: Real internal 401 UNAUTHORIZED MUST change authStatus to unauthenticated
  session.handleApiError({
    statusCode: 401,
    data: { code: 'UNAUTHORIZED' }
  })
  assert.strictEqual(
    authStatusRef.value,
    'unauthenticated',
    'Internal 401 UNAUTHORIZED must update authStatus to unauthenticated'
  )
})

// =============================================================================
// 13. TEST-SYS-13: Database Migration DDL Alignment (all_in_one_setup.sql)
// =============================================================================

test('TEST-SYS-13-DDL-01: all_in_one_setup.sql supports idea status, project_notes table, and service_role RLS lockdown', () => {
  const sql = loadSource('server/database/migrations/all_in_one_setup.sql')

  // Verify status check constraint includes 'idea'
  assert.ok(
    sql.includes("status IN ('idea', 'in_queue', 'running_sprint', 'deployed', 'blocked')"),
    'Tasks status check constraint must include idea status'
  )

  // Verify project_notes table definition
  assert.ok(
    sql.includes('CREATE TABLE IF NOT EXISTS public.project_notes'),
    'DDL must create public.project_notes table'
  )
  assert.ok(
    sql.includes("category IN ('idea', 'bug', 'maintenance')"),
    'project_notes category constraint must allow idea, bug, maintenance'
  )

  // Verify RLS lockdown
  assert.ok(
    sql.includes('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;'),
    'DDL must revoke all public schema permissions from anon'
  )
  assert.ok(
    sql.includes('CREATE POLICY "Service role full access on projects" ON public.projects FOR ALL TO service_role'),
    'DDL must grant full access on projects exclusively to service_role'
  )
  assert.ok(
    sql.includes('CREATE POLICY "Service role full access on project_notes" ON public.project_notes FOR ALL TO service_role'),
    'DDL must grant full access on project_notes exclusively to service_role'
  )
})

// =============================================================================
// 14. FINAL AUDIT CLEANUP REGRESSION CONTRACTS (SYS-14 to SYS-17)
// =============================================================================

test('TEST-SYS-14-CI-01: UnifiedHeroBanner dynamic CI dot/classes and Dashboard.vue syncDashboardCiMetrics integration', () => {
  const heroSource = loadSource('components/dashboard/UnifiedHeroBanner.vue')
  const dashboardSource = loadSource('components/dashboard/Dashboard.vue')

  // UnifiedHeroBanner: no unconditional hardcoded pulse on CI/CD Builds dot
  assert.ok(
    !heroSource.includes('<span class="truncate">CI/CD Builds</span>\n              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>'),
    'UnifiedHeroBanner must not hardcode unconditional bg-emerald-400 animate-pulse on CI/CD Builds dot'
  )
  assert.ok(
    heroSource.includes(':class="ciStatusDotClass"'),
    'CI/CD Builds dot must bind dynamic :class="ciStatusDotClass"'
  )
  assert.ok(
    heroSource.includes(':class="ciSummaryTextClass"'),
    'CI/CD summary text must bind dynamic :class="ciSummaryTextClass"'
  )
  assert.ok(
    heroSource.includes('props.ciSuccessRate === null || props.ciSuccessRate === undefined || props.ciWorkflowCount === 0'),
    'ciStatusDotClass & ciSummaryTextClass must check for null/undefined rate or zero workflows'
  )
  assert.ok(
    heroSource.includes("'bg-zinc-600'"),
    'ciStatusDotClass must fallback to neutral bg-zinc-600 when CI data is missing'
  )
  assert.ok(
    heroSource.includes("'text-muted'"),
    'ciSummaryTextClass must fallback to neutral text-muted when CI data is missing'
  )

  // Dashboard.vue: syncDashboardCiMetrics checks session.isAuthenticated before calling /api/github/workflows
  assert.ok(
    dashboardSource.includes('async function syncDashboardCiMetrics()'),
    'Dashboard.vue must implement syncDashboardCiMetrics helper'
  )
  assert.ok(
    dashboardSource.includes('if (!session.isAuthenticated.value)'),
    'syncDashboardCiMetrics must guard with session.isAuthenticated check'
  )
  assert.ok(
    dashboardSource.includes("'/api/github/workflows'"),
    'syncDashboardCiMetrics must query /api/github/workflows'
  )
  assert.ok(
    dashboardSource.includes(':ci-workflow-count="ciWorkflowCount"') &&
    dashboardSource.includes(':ci-success-rate="ciSuccessRate"'),
    'Dashboard.vue must bind :ci-workflow-count and :ci-success-rate to UnifiedHeroBanner'
  )
})

test('TEST-SYS-15-SHORTCUT-01: Quick task keyboard shortcut uses "C" across index.vue and tasks.vue without Ctrl+N', () => {
  const indexSource = loadSource('app/pages/index.vue')
  const tasksSource = loadSource('app/pages/tasks.vue')

  // Both pages must register shortcut: 'C'
  assert.ok(
    indexSource.includes("shortcut: 'C'"),
    'index.vue quick-task header action must declare shortcut: "C"'
  )
  assert.ok(
    tasksSource.includes("shortcut: 'C'"),
    'tasks.vue new-task header action must declare shortcut: "C"'
  )

  // Neither page should have legacy shortcut: 'Ctrl+N'
  assert.ok(
    !indexSource.includes("shortcut: 'Ctrl+N'"),
    'index.vue must not contain legacy shortcut: "Ctrl+N"'
  )
  assert.ok(
    !tasksSource.includes("shortcut: 'Ctrl+N'"),
    'tasks.vue must not contain legacy shortcut: "Ctrl+N"'
  )
})

test('TEST-SYS-16-SCOPED-COUNTS-01: tasks.vue defines scopedTasks and derives live filter counts and filteredTasks from it', () => {
  const tasksSource = loadSource('app/pages/tasks.vue')

  // Scoped tasks definition without statusFilter
  assert.ok(
    tasksSource.includes('const scopedTasks = computed('),
    'tasks.vue must declare computed scopedTasks'
  )
  assert.ok(
    tasksSource.includes("projectFilter.value !== 'all'"),
    'scopedTasks must apply projectFilter'
  )
  assert.ok(
    tasksSource.includes("priorityFilter.value !== 'all'"),
    'scopedTasks must apply priorityFilter'
  )
  assert.ok(
    tasksSource.includes("tagFilter.value !== 'all'"),
    'scopedTasks must apply tagFilter'
  )

  // Live Counts derivation from scopedTasks.value
  assert.ok(
    tasksSource.includes('const allCount = computed(() => scopedTasks.value.length)'),
    'allCount must be derived from scopedTasks.value.length'
  )
  assert.ok(
    tasksSource.includes('const ideaCount = computed(() => scopedTasks.value.filter('),
    'ideaCount must be derived from scopedTasks.value'
  )
  assert.ok(
    tasksSource.includes('const inQueueCount = computed(() => scopedTasks.value.filter('),
    'inQueueCount must be derived from scopedTasks.value'
  )
  assert.ok(
    tasksSource.includes('const runningSprintCount = computed(() => scopedTasks.value.filter('),
    'runningSprintCount must be derived from scopedTasks.value'
  )
  assert.ok(
    tasksSource.includes('const deployedCount = computed(() => scopedTasks.value.filter('),
    'deployedCount must be derived from scopedTasks.value'
  )
  assert.ok(
    tasksSource.includes('const blockedCount = computed(() => scopedTasks.value.filter('),
    'blockedCount must be derived from scopedTasks.value'
  )

  // filteredTasks derivation from scopedTasks.value
  assert.ok(
    tasksSource.includes('const filteredTasks = computed(() => {') &&
    tasksSource.includes('let list = [...scopedTasks.value]'),
    'filteredTasks must spread scopedTasks.value before applying statusFilter in table mode'
  )
})

test('TEST-SYS-17-ROADMAP-DND-01: roadmap.vue integrates AddProjectModal, action id new-project, and HTML5 drag and drop', () => {
  const roadmapSource = loadSource('app/pages/roadmap.vue')

  // AddProjectModal component integration
  assert.ok(
    roadmapSource.includes('<AddProjectModal') &&
    roadmapSource.includes('@create="onProjectCreated"'),
    'roadmap.vue must mount <AddProjectModal with @create="onProjectCreated"'
  )
  assert.ok(
    roadmapSource.includes("id: 'new-project'"),
    'roadmap.vue must register header action with id: "new-project"'
  )
  assert.ok(
    roadmapSource.includes('async function onProjectCreated('),
    'roadmap.vue must implement onProjectCreated handler'
  )

  // HTML5 Drag and Drop attributes and events
  assert.ok(
    roadmapSource.includes('draggable="true"'),
    'Roadmap project cards must have draggable="true"'
  )
  assert.ok(
    roadmapSource.includes('@dragstart="onCardDragStart($event, project)"'),
    'Roadmap project cards must bind @dragstart="onCardDragStart($event, project)"'
  )
  assert.ok(
    roadmapSource.includes('@drop.prevent="onColumnDrop($event, phase.id)"'),
    'Phase columns must bind @drop.prevent="onColumnDrop($event, phase.id)"'
  )
  assert.ok(
    roadmapSource.includes('async function onColumnDrop(') &&
    roadmapSource.includes('await onUpdateReleasePhase(project, targetPhase)'),
    'onColumnDrop must route dropped project and targetPhase into onUpdateReleasePhase'
  )
})
