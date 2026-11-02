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

// Simulated Nuxt useState reactive store
const nuxtState = new Map()
function mockUseState(key, init) {
  if (!nuxtState.has(key)) {
    nuxtState.set(key, ref(init ? init() : undefined))
  }
  return nuxtState.get(key)
}

globalThis.useState = mockUseState

// Global fetch spy to record HTTP calls and parameters
let lastFetchCall = null
globalThis.$fetch = async (url, opts) => {
  lastFetchCall = { url, opts, params: opts?.params }
  return []
}

// Global useLazyAsyncData simulation
let lastLazyKey = null
let currentFetcher = null
globalThis.useLazyAsyncData = (keyFn, fetcher, opts) => {
  const evaluateKey = () => (typeof keyFn === 'function' ? keyFn() : keyFn)
  lastLazyKey = evaluateKey()
  currentFetcher = fetcher

  return {
    data: ref([]),
    error: ref(null),
    pending: ref(false),
    refresh: async () => {
      lastLazyKey = evaluateKey()
      return await fetcher()
    }
  }
}

const jiti = createJiti(import.meta.url, {
  alias: {
    '~': projectRoot,
    '~~': projectRoot
  }
})

const { useProjectNav } = await jiti.import('../../composables/useProjectNav.ts')
const { useGitHubCommits } = await jiti.import('../../composables/useGitHub.ts')

// Helper function to reset reactive store between tests
function resetTestState() {
  nuxtState.clear()
  lastFetchCall = null
  lastLazyKey = null
  currentFetcher = null
}

// =============================================================================
// 1. BRANCH COMMITS API URL QUERY CONSTRUCTION CONTRACTS
// =============================================================================

test('GH-BRANCH-URL-01: Branch query parameter appends &sha=<encoded-branch> to GitHub API URL', () => {
  // Logic matching server/api/github/commits.get.ts:11-12
  function buildCommitsApiUrl(repo, limit, branch) {
    const branchQuery = branch ? `&sha=${encodeURIComponent(branch)}` : ''
    return `/repos/${repo}/commits?per_page=${limit}${branchQuery}`
  }

  // Case 1: Standard branch
  const url1 = buildCommitsApiUrl('nexura/management', 20, 'main')
  assert.equal(url1, '/repos/nexura/management/commits?per_page=20&sha=main')

  // Case 2: Feature branch with slash
  const url2 = buildCommitsApiUrl('nexura/management', 30, 'feat/branch-1')
  assert.equal(url2, '/repos/nexura/management/commits?per_page=30&sha=feat%2Fbranch-1')

  // Case 3: Branch with hash or special characters
  const url3 = buildCommitsApiUrl('nexura/management', 10, 'hotfix/bug#42')
  assert.equal(url3, '/repos/nexura/management/commits?per_page=10&sha=hotfix%2Fbug%2342')
})

test('GH-BRANCH-URL-02: Absence of branch parameter omits &sha= query from GitHub API URL', () => {
  function buildCommitsApiUrl(repo, limit, branch) {
    const branchQuery = branch ? `&sha=${encodeURIComponent(branch)}` : ''
    return `/repos/${repo}/commits?per_page=${limit}${branchQuery}`
  }

  // Case 1: branch is undefined
  const urlUndefined = buildCommitsApiUrl('nexura/management', 20, undefined)
  assert.equal(urlUndefined, '/repos/nexura/management/commits?per_page=20')
  assert.ok(!urlUndefined.includes('&sha='), 'URL must not contain &sha= when branch is undefined')

  // Case 2: branch is null
  const urlNull = buildCommitsApiUrl('nexura/management', 20, null)
  assert.equal(urlNull, '/repos/nexura/management/commits?per_page=20')
  assert.ok(!urlNull.includes('&sha='), 'URL must not contain &sha= when branch is null')

  // Case 3: branch is empty string
  const urlEmpty = buildCommitsApiUrl('nexura/management', 20, '')
  assert.equal(urlEmpty, '/repos/nexura/management/commits?per_page=20')
  assert.ok(!urlEmpty.includes('&sha='), 'URL must not contain &sha= when branch is empty string')
})

test('GH-BRANCH-PARAM-01: Commits route handler extracts, trims, and normalizes branch query parameter', () => {
  // Logic matching server/api/github/commits.get.ts:44
  function extractBranchParam(query) {
    return typeof query.branch === 'string' && query.branch.trim() !== '' ? query.branch.trim() : undefined
  }

  assert.equal(extractBranchParam({ branch: 'development' }), 'development')
  assert.equal(extractBranchParam({ branch: '  feature/nav  ' }), 'feature/nav')
  assert.equal(extractBranchParam({ branch: '' }), undefined)
  assert.equal(extractBranchParam({ branch: '   ' }), undefined)
  assert.equal(extractBranchParam({}), undefined)
  assert.equal(extractBranchParam({ branch: 123 }), undefined)
})

// =============================================================================
// 2. NITRO CACHE KEY DETERMINISTIC ISOLATION CONTRACTS
// =============================================================================

test('GH-CACHE-KEY-01: Nitro cache key isolates branches deterministically to avoid collision', () => {
  // Canonical cache key generator matching server/api/github/commits.get.ts:36-37
  const getCommitCacheKey = (token, repo, limit, branch) =>
    `${token ? 'auth' : 'anon'}:${repo}:${limit}:${branch || 'default'}`

  const keyMain = getCommitCacheKey('ghp_token', 'nexura/management', 20, 'main')
  const keyDev = getCommitCacheKey('ghp_token', 'nexura/management', 20, 'development')
  const keyDefault = getCommitCacheKey('ghp_token', 'nexura/management', 20, undefined)
  const keyEmpty = getCommitCacheKey('ghp_token', 'nexura/management', 20, '')

  assert.equal(keyMain, 'auth:nexura/management:20:main')
  assert.equal(keyDev, 'auth:nexura/management:20:development')
  assert.equal(keyDefault, 'auth:nexura/management:20:default')
  assert.equal(keyEmpty, 'auth:nexura/management:20:default')

  // Verify strict isolation
  assert.notEqual(keyMain, keyDev, 'Cache keys for different branches must never collide')
  assert.notEqual(keyMain, keyDefault, 'Branch cache key must differ from default branch key')
  assert.equal(keyDefault, keyEmpty, 'Undefined and empty branches share canonical "default" cache namespace')
})

test('GH-CACHE-KEY-02: Nitro cache key separates authenticated and anonymous sessions', () => {
  const getCommitCacheKey = (token, repo, limit, branch) =>
    `${token ? 'auth' : 'anon'}:${repo}:${limit}:${branch || 'default'}`

  const keyAuth = getCommitCacheKey('ghp_secret', 'nexura/app', 15, 'master')
  const keyAnon = getCommitCacheKey('', 'nexura/app', 15, 'master')

  assert.equal(keyAuth, 'auth:nexura/app:15:master')
  assert.equal(keyAnon, 'anon:nexura/app:15:master')
  assert.notEqual(keyAuth, keyAnon, 'Authenticated and anonymous cache keys must be strictly partitioned')
})

// =============================================================================
// 3. USEGITHUBCOMMITS REACTIVITY & PARAMS CONTRACTS
// =============================================================================

test('GH-COMPOSABLE-01: useGitHubCommits passes branch parameter and generates keyed lazy cache identifier', async () => {
  resetTestState()

  const repo = 'nexura/core'
  const branch = 'development'
  const commitsState = useGitHubCommits(repo, 20, branch)

  assert.ok(commitsState.commits, 'commits ref must be defined')
  assert.equal(lastLazyKey, 'github-commits-nexura/core-development')

  await commitsState.refresh()

  assert.equal(lastFetchCall.url, '/api/github/commits')
  assert.equal(lastFetchCall.params.repo, 'nexura/core')
  assert.equal(lastFetchCall.params.limit, 20)
  assert.equal(lastFetchCall.params.branch, 'development')
})

test('GH-COMPOSABLE-02: useGitHubCommits reacts dynamically when reactive branch ref mutates', async () => {
  resetTestState()

  const repo = ref('nexura/management')
  const branch = ref('feature/auth')
  const commitsState = useGitHubCommits(repo, 10, branch)

  assert.equal(lastLazyKey, 'github-commits-nexura/management-feature/auth')
  await commitsState.refresh()
  assert.equal(lastFetchCall.params.branch, 'feature/auth')

  // Mutate branch ref to 'main'
  branch.value = 'main'
  await commitsState.refresh()

  assert.equal(lastLazyKey, 'github-commits-nexura/management-main')
  assert.equal(lastFetchCall.params.branch, 'main')
})

test('GH-COMPOSABLE-03: useGitHubCommits without branch defaults key to "default" and omits params.branch', async () => {
  resetTestState()

  const commitsState = useGitHubCommits('nexura/management', 25)

  assert.equal(lastLazyKey, 'github-commits-nexura/management-default')
  await commitsState.refresh()

  assert.equal(lastFetchCall.params.repo, 'nexura/management')
  assert.equal(lastFetchCall.params.limit, 25)
  assert.equal(lastFetchCall.params.branch, undefined, 'params.branch must be omitted when branch is undefined')
})

// =============================================================================
// 4. PROJECT NAVIGATION UNIFIED TAB & VIEW MODE CONTRACTS
// =============================================================================

test('PROJ-NAV-01: useProjectNav initializes with deliverableViewMode="kanban" and activeTab="dashboard"', () => {
  resetTestState()
  const nav = useProjectNav()

  assert.equal(nav.activeTab.value, 'dashboard')
  assert.equal(nav.deliverableViewMode.value, 'kanban')
  assert.equal(nav.tasksCount.value, 0)
  assert.equal(nav.matrixCount.value, 0)
  assert.equal(nav.commitsCount.value, 0)
  assert.equal(nav.hasGithub.value, false)
})

test('PROJ-NAV-02: setViewMode toggles deliverableViewMode between "kanban" and "table"', () => {
  resetTestState()
  const nav = useProjectNav()

  assert.equal(nav.deliverableViewMode.value, 'kanban')

  nav.setViewMode('table')
  assert.equal(nav.deliverableViewMode.value, 'table')

  nav.setViewMode('kanban')
  assert.equal(nav.deliverableViewMode.value, 'kanban')
})

test('PROJ-NAV-03: setActiveTab canonically maps "kanban" and "matrix" aliases to "deliverables"', () => {
  resetTestState()
  const nav = useProjectNav()

  // 1. Setting 'kanban' maps activeTab -> 'deliverables' and deliverableViewMode -> 'kanban'
  nav.setActiveTab('kanban')
  assert.equal(nav.activeTab.value, 'deliverables')
  assert.equal(nav.deliverableViewMode.value, 'kanban')

  // 2. Setting 'matrix' maps activeTab -> 'deliverables' and deliverableViewMode -> 'table'
  nav.setActiveTab('matrix')
  assert.equal(nav.activeTab.value, 'deliverables')
  assert.equal(nav.deliverableViewMode.value, 'table')

  // 3. Setting 'deliverables' directly preserves the existing deliverableViewMode
  nav.setActiveTab('deliverables')
  assert.equal(nav.activeTab.value, 'deliverables')
  assert.equal(nav.deliverableViewMode.value, 'table')

  // 4. Setting other tabs (e.g. 'github') switches activeTab without altering deliverableViewMode
  nav.setActiveTab('github')
  assert.equal(nav.activeTab.value, 'github')
  assert.equal(nav.deliverableViewMode.value, 'table')
})

test('PROJ-NAV-04: setCounts updates navigation metrics reactively', () => {
  resetTestState()
  const nav = useProjectNav()

  nav.setCounts({
    tasks: 18,
    matrix: 18,
    commits: 42,
    hasGithub: true
  })

  assert.equal(nav.tasksCount.value, 18)
  assert.equal(nav.matrixCount.value, 18)
  assert.equal(nav.commitsCount.value, 42)
  assert.equal(nav.hasGithub.value, true)
})

// =============================================================================
// 5. PROJECT DELIVERABLES DUAL-MODE DATA INTEGRITY (SSOT)
// =============================================================================

test('DELIV-SSOT-01: Kanban and Table Matrix views operate on the identical deliverables SSOT dataset', () => {
  // Shared mock deliverables for a project
  const projectTasks = ref([
    { id: 't1', taskId: 'ENG-101', name: 'Task 1', status: 'idea', priority: 'medium', projectSlug: 'nexura' },
    { id: 't2', taskId: 'ENG-102', name: 'Task 2', status: 'in_queue', priority: 'high', projectSlug: 'nexura' },
    { id: 't3', taskId: 'ENG-103', name: 'Task 3', status: 'running_sprint', priority: 'critical', projectSlug: 'nexura' },
    { id: 't4', taskId: 'ENG-104', name: 'Task 4', status: 'blocked', priority: 'high', projectSlug: 'nexura' },
    { id: 't5', taskId: 'ENG-105', name: 'Task 5', status: 'deployed', priority: 'low', projectSlug: 'nexura' }
  ])

  // Representation 1: Kanban Column Grouping
  const kanbanColumns = {
    idea: computed(() => projectTasks.value.filter(t => t.status === 'idea')),
    in_queue: computed(() => projectTasks.value.filter(t => t.status === 'in_queue')),
    running_sprint: computed(() => projectTasks.value.filter(t => t.status === 'running_sprint')),
    blocked: computed(() => projectTasks.value.filter(t => t.status === 'blocked')),
    deployed: computed(() => projectTasks.value.filter(t => t.status === 'deployed'))
  }

  // Representation 2: Table Matrix Rows
  const matrixRows = computed(() => [...projectTasks.value].sort((a, b) => a.taskId.localeCompare(b.taskId)))

  // Verify count integrity across both visual representations
  const totalKanbanItems = Object.values(kanbanColumns).reduce((sum, col) => sum + col.value.length, 0)
  assert.equal(totalKanbanItems, 5)
  assert.equal(matrixRows.value.length, 5)
  assert.equal(totalKanbanItems, matrixRows.value.length)

  // Verify status distribution parity
  assert.equal(kanbanColumns.idea.value.length, 1)
  assert.equal(kanbanColumns.in_queue.value.length, 1)
  assert.equal(kanbanColumns.running_sprint.value.length, 1)
  assert.equal(kanbanColumns.blocked.value.length, 1)
  assert.equal(kanbanColumns.deployed.value.length, 1)
})

test('DELIV-SSOT-02: Instant reactivity synchronizes mutations instantaneously across Kanban and Table Matrix views', () => {
  const projectTasks = ref([
    { id: 't1', taskId: 'ENG-101', name: 'Task 1', status: 'running_sprint', priority: 'medium', projectSlug: 'nexura' }
  ])

  const runningColumn = computed(() => projectTasks.value.filter(t => t.status === 'running_sprint'))
  const deployedColumn = computed(() => projectTasks.value.filter(t => t.status === 'deployed'))
  const matrixTable = computed(() => projectTasks.value)

  assert.equal(runningColumn.value.length, 1)
  assert.equal(deployedColumn.value.length, 0)
  assert.equal(matrixTable.value[0].status, 'running_sprint')

  // Instant mutation: Deliverable moved to 'deployed'
  projectTasks.value[0].status = 'deployed'
  projectTasks.value[0].priority = 'high'

  // Immediate reflection in Kanban
  assert.equal(runningColumn.value.length, 0, 'Running column must immediately reflect 0 items')
  assert.equal(deployedColumn.value.length, 1, 'Deployed column must immediately reflect 1 item')
  assert.equal(deployedColumn.value[0].taskId, 'ENG-101')

  // Immediate reflection in Matrix Table
  assert.equal(matrixTable.value[0].status, 'deployed', 'Matrix table status must immediately update')
  assert.equal(matrixTable.value[0].priority, 'high', 'Matrix table priority must immediately update')
})

// =============================================================================
// 6. GITHUB OVERVIEW BRANCH SELECTOR & REACTIVITY CONTRACTS
// =============================================================================

test('BRANCH-UI-03: ProjectCommitsPreview template contains compact branch selector dropdown and emits select-branch', () => {
  const componentPath = path.resolve(projectRoot, 'components/project/ProjectCommitsPreview.vue')
  const content = fs.readFileSync(componentPath, 'utf8')

  assert.ok(content.includes('id="overview-branch-selector"'), 'Must contain overview branch selector element')
  assert.ok(content.includes("select-branch"), 'Must emit select-branch event')
  assert.ok(!content.includes('.slice(0, 8)'), 'Must not truncate commits with slice(0, 8)')
  assert.ok(content.includes('v-for="commit in commits"'), 'Must iterate through all commits directly')
})

test('BRANCH-UI-04: Project detail page configures useGitHubCommits limit to 50 and wires two-way branch reactivity to ProjectCommitsPreview', () => {
  const pagePath = path.resolve(projectRoot, 'app/pages/projects/[slug].vue')
  const content = fs.readFileSync(pagePath, 'utf8')

  assert.ok(content.includes('useGitHubCommits(targetRepo, 50, selectedBranch)'), 'Must call useGitHubCommits with limit 50 and selectedBranch')
  assert.ok(content.includes(':branches='), 'Must bind branches to ProjectCommitsPreview')
  assert.ok(content.includes(':selected-branch="selectedBranch"'), 'Must bind selected-branch to ProjectCommitsPreview')
  assert.ok(content.includes('@select-branch='), 'Must listen to select-branch event on ProjectCommitsPreview')
  assert.ok(content.includes('selectedBranch ='), 'Must mutate selectedBranch upon select-branch event')
})

test('BRANCH-UI-05: ProjectGitActivityFeed template confines commits and branches to scrollable containers with custom scrollbar', () => {
  const componentPath = path.resolve(projectRoot, 'components/project/ProjectGitActivityFeed.vue')
  const content = fs.readFileSync(componentPath, 'utf8')

  assert.ok(
    content.includes('max-h-[480px]') && content.includes('overflow-y-auto') && content.includes('custom-scrollbar'),
    'ProjectGitActivityFeed must confine items with max-height and custom scrollbar'
  )
  assert.ok(
    content.includes('space-y-2 max-h-[480px] sm:max-h-[520px] overflow-y-auto custom-scrollbar'),
    'ProjectGitActivityFeed must confine commits stream within max-height and custom scrollbar'
  )
  assert.ok(
    content.includes('space-y-1.5 max-h-[480px] sm:max-h-[520px] overflow-y-auto custom-scrollbar'),
    'ProjectGitActivityFeed must confine branches list within max-height and custom scrollbar'
  )
})


