import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// =============================================================================
// Modals Architecture & Quality Verification Suite (Wave 3)
// Validating 15 modals, extraction of ConnectRepoModal, theme compliance,
// lifecycle guards, SSOT createTask integration, and WAI-ARIA accessibility.
// =============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

function loadFile(relativePath) {
  const fullPath = path.resolve(projectRoot, relativePath)
  assert.ok(fs.existsSync(fullPath), `Required file must exist at ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

// =============================================================================
// 1. CANONICAL MODAL DIRECTORY STRUCTURE (AC-1)
// =============================================================================

test('MODAL-DIR-01: 15 canonical modal files exist across components/modals/ directory tree', () => {
  const expectedModalFiles = [
    // General / Base
    'components/modals/ConfirmDialog.vue',
    'components/modals/SessionAuthModal.vue',

    // Task Modals
    'components/modals/task/AddTaskModal.vue',
    'components/modals/task/AddIdeaModal.vue',
    'components/modals/task/TaskDrawer.vue',

    // Project Modals
    'components/modals/project/AddProjectModal.vue',
    'components/modals/project/EditProjectModal.vue',
    'components/modals/project/ConnectRepoModal.vue',

    // Sprint Modals
    'components/modals/sprint/AddTargetModal.vue',
    'components/modals/sprint/SprintRolloverModal.vue',

    // DevOps Cockpit Modals
    'components/modals/devops/WorkflowLogModal.vue',
    'components/modals/devops/SecurityAlertModal.vue',
    'components/modals/devops/DeploymentModal.vue',
    'components/modals/devops/PackageModal.vue',
    'components/modals/devops/PullRequestsIssuesModal.vue'
  ]

  assert.equal(expectedModalFiles.length, 15, 'There must be exactly 15 canonical modal files defined')

  for (const modalPath of expectedModalFiles) {
    const fullPath = path.resolve(projectRoot, modalPath)
    assert.ok(
      fs.existsSync(fullPath),
      `Modal component must exist at canonical path: ${modalPath}`
    )
  }
})

// =============================================================================
// 2. CONNECT REPO MODAL EXTRACTION & REPOS.VUE WIREUP (AC-2)
// =============================================================================

test('MODAL-EXTRACT-01: ConnectRepoModal is extracted and rendered cleanly in app/pages/repos.vue', () => {
  const modalContent = loadFile('components/modals/project/ConnectRepoModal.vue')
  const reposContent = loadFile('app/pages/repos.vue')

  // ConnectRepoModal internal structure
  assert.ok(modalContent.includes('<BaseModal'), 'ConnectRepoModal must wrap BaseModal primitive')
  assert.ok(modalContent.includes('title="Connect to Project"'), 'Modal must have canonical title')
  assert.ok(modalContent.includes('form.title'), 'Form must bind form.title')
  assert.ok(modalContent.includes('form.slug'), 'Form must bind form.slug')
  assert.ok(modalContent.includes('form.primaryTech'), 'Form must bind form.primaryTech')
  assert.ok(modalContent.includes('form.description'), 'Form must bind form.description')
  assert.ok(modalContent.includes("emit('confirm'"), 'Must emit confirm event on submission')

  // repos.vue wireup
  assert.ok(reposContent.includes('<ConnectRepoModal'), 'repos.vue must render ConnectRepoModal')
  assert.ok(reposContent.includes(':is-open="Boolean(repoToConnect)"'), 'repos.vue must bind is-open state')
  assert.ok(reposContent.includes('@confirm="onConfirmConnectProject"'), 'repos.vue must wire confirm handler')
  assert.ok(reposContent.includes('@close="repoToConnect = null"'), 'repos.vue must wire close handler')
})

// =============================================================================
// 3. ZERO CHARCOAL-OCHRE RETIREMENT IN 6 MIGRATED MODALS (AC-3)
// =============================================================================

test('MODAL-THEME-01: 6 migrated modals are completely free from legacy Charcoal-Ochre color tokens and text close icons', () => {
  const migratedModals = [
    'components/modals/project/AddProjectModal.vue',
    'components/modals/project/EditProjectModal.vue',
    'components/modals/devops/DeploymentModal.vue',
    'components/modals/devops/PackageModal.vue',
    'components/modals/devops/SecurityAlertModal.vue',
    'components/modals/devops/WorkflowLogModal.vue'
  ]

  const forbiddenColorTokens = [
    '#C98A4B',
    '#c98a4b',
    '#F5F2EB',
    '#f5f2eb',
    '#756F68',
    '#756f68',
    '#111114',
    '#09090B',
    '#09090b'
  ]

  for (const modalPath of migratedModals) {
    const content = loadFile(modalPath)

    // Check for forbidden Charcoal-Ochre colors
    for (const token of forbiddenColorTokens) {
      assert.ok(
        !content.includes(token),
        `Migrated modal ${modalPath} must not contain retired color token: ${token}`
      )
    }

    // Verify close buttons use Lucide / NexuraIcon X rather than raw unicode ✕ button
    assert.ok(
      !content.includes('>✕</button>') && !content.includes('>✕</span></button>'),
      `Modal ${modalPath} must not use raw unicode ✕ character for modal close buttons`
    )
  }
})

// =============================================================================
// 4. TASK DRAWER USEMODALLIFECYCLE & USEMARKDOWNCHECKLIST INTEGRATION (AC-4)
// =============================================================================

test('MODAL-TASKDRAWER-01: TaskDrawer.vue integrates useModalLifecycle and useMarkdownChecklist composables', () => {
  const content = loadFile('components/modals/task/TaskDrawer.vue')

  // useModalLifecycle integration
  assert.ok(content.includes("from '~/composables/useModalLifecycle'"), 'Must import useModalLifecycle')
  assert.ok(content.includes('useModalLifecycle({'), 'Must invoke useModalLifecycle')
  assert.ok(content.includes('isOpen: effectiveIsOpen'), 'Must bind isOpen to effectiveIsOpen')
  assert.ok(content.includes('preventScroll: true'), 'Must enable preventScroll for modal hygiene')
  assert.ok(content.includes('trapFocus: true'), 'Must enable trapFocus for accessibility')

  // useMarkdownChecklist integration
  assert.ok(content.includes("from '~/composables/useMarkdownChecklist'"), 'Must import useMarkdownChecklist')
  assert.ok(content.includes('useMarkdownChecklist('), 'Must invoke useMarkdownChecklist')
  assert.ok(content.includes('checklistItems'), 'Must destructure checklistItems from useMarkdownChecklist')
  assert.ok(content.includes('toggle:') || content.includes('toggleChecklistStep'), 'Must destructure or bind toggle from useMarkdownChecklist')
  assert.ok(content.includes('add:') || content.includes('addChecklistStep'), 'Must destructure or bind add from useMarkdownChecklist')
  assert.ok(content.includes('toggleChecklist'), 'Must provide toggleChecklist handler')
  assert.ok(content.includes('appendChecklistItem'), 'Must provide appendChecklistItem handler')
})

// =============================================================================
// 5. SPRINT ROLLOVER MODAL ESCAPE LEAK ELIMINATION (AC-5)
// =============================================================================

test('MODAL-ROLLOVER-01: SprintRolloverModal.vue eliminates Escape key listener leakage using useModalLifecycle', () => {
  const content = loadFile('components/modals/sprint/SprintRolloverModal.vue')

  // Verify useModalLifecycle integration with show ref
  assert.ok(content.includes("from '~/composables/useModalLifecycle'"), 'Must import useModalLifecycle')
  assert.ok(content.includes('useModalLifecycle({'), 'Must invoke useModalLifecycle')
  assert.ok(content.includes("isOpen: toRef(props, 'show')"), 'Must bind isOpen to toRef(props, "show") so listeners are only active when open')
  assert.ok(content.includes("onClose: () => emit('close')"), 'Must dispatch emit("close") on escape key')

  // Verify absence of dangerous un-guarded global window keydown listener
  assert.ok(
    !content.includes("window.addEventListener('keydown'"),
    'Must not attach manual un-guarded global window keydown listener'
  )
})

// =============================================================================
// 6. PULL REQUESTS & ISSUES MODAL CREATETASK INTEGRATION (AC-6)
// =============================================================================

test('MODAL-PR-TASK-01: PullRequestsIssuesModal.vue uses useTasks().createTask() and useToastFeedback()', () => {
  const content = loadFile('components/modals/devops/PullRequestsIssuesModal.vue')

  // SSOT useTasks integration
  assert.ok(content.includes("from '~/composables/useTasks'"), 'Must import useTasks composable')
  assert.ok(content.includes('const tasksApi = useTasks()'), 'Must instantiate tasksApi from useTasks()')
  assert.ok(content.includes('await tasksApi.createTask('), 'Must invoke tasksApi.createTask for importing issue to Kanban')

  // Toast feedback integration
  assert.ok(content.includes("from '~/composables/useToastFeedback'"), 'Must import useToastFeedback')
  assert.ok(content.includes('toast.showSuccess('), 'Must call toast.showSuccess on successful import')
  assert.ok(content.includes('toast.showError('), 'Must call toast.showError on failure')
})

// =============================================================================
// 7. CLEANUP OF EXPLICIT MODAL IMPORTS IN PAGES & SHELL (AC-7)
// =============================================================================

test('MODAL-IMPORT-CLEANUP-01: app/app.vue, repos.vue, and sprints.vue rely on Nuxt auto-imports without explicit modal imports', () => {
  const appContent = loadFile('app/app.vue')
  const reposContent = loadFile('app/pages/repos.vue')
  const sprintsContent = loadFile('app/pages/sprints.vue')

  // app.vue checks: must not explicitly import AddTaskModal, AddIdeaModal, TaskDrawer, SessionAuthModal
  assert.ok(!appContent.includes("import AddTaskModal from"), 'app.vue must rely on auto-import for AddTaskModal')
  assert.ok(!appContent.includes("import AddIdeaModal from"), 'app.vue must rely on auto-import for AddIdeaModal')
  assert.ok(!appContent.includes("import TaskDrawer from"), 'app.vue must rely on auto-import for TaskDrawer')
  assert.ok(!appContent.includes("import SessionAuthModal from"), 'app.vue must rely on auto-import for SessionAuthModal')

  // repos.vue checks: must not explicitly import ConnectRepoModal or ConfirmDialog
  assert.ok(!reposContent.includes("import ConnectRepoModal from"), 'repos.vue must rely on auto-import for ConnectRepoModal')
  assert.ok(!reposContent.includes("import ConfirmDialog from"), 'repos.vue must rely on auto-import for ConfirmDialog')

  // sprints.vue checks: must not explicitly import AddTargetModal or SprintRolloverModal
  assert.ok(!sprintsContent.includes("import AddTargetModal from"), 'sprints.vue must rely on auto-import for AddTargetModal')
  assert.ok(!sprintsContent.includes("import SprintRolloverModal from"), 'sprints.vue must rely on auto-import for SprintRolloverModal')
})

// =============================================================================
// 8. WAI-ARIA ACCESSIBILITY CONTRACTS FOR ALL MODALS (AC-8)
// =============================================================================

test('MODAL-ACCESSIBILITY-01: All modals enforce WAI-ARIA role="dialog" or role="alertdialog" and aria-modal="true"', () => {
  const modalFiles = [
    'components/modals/ConfirmDialog.vue',
    'components/modals/SessionAuthModal.vue',
    'components/modals/task/AddTaskModal.vue',
    'components/modals/task/AddIdeaModal.vue',
    'components/modals/task/TaskDrawer.vue',
    'components/modals/project/AddProjectModal.vue',
    'components/modals/project/EditProjectModal.vue',
    'components/modals/project/ConnectRepoModal.vue',
    'components/modals/sprint/AddTargetModal.vue',
    'components/modals/sprint/SprintRolloverModal.vue',
    'components/modals/devops/WorkflowLogModal.vue',
    'components/modals/devops/SecurityAlertModal.vue',
    'components/modals/devops/DeploymentModal.vue',
    'components/modals/devops/PackageModal.vue',
    'components/modals/devops/PullRequestsIssuesModal.vue'
  ]

  for (const modalPath of modalFiles) {
    const content = loadFile(modalPath)

    // A modal either wraps BaseModal (which declares role="dialog" & aria-modal="true")
    // or directly declares role="dialog" / role="alertdialog" and aria-modal="true"
    const wrapsBaseModal = content.includes('<BaseModal')
    const hasRoleDialog = content.includes('role="dialog"') || content.includes('role="alertdialog"')
    const hasAriaModal = content.includes('aria-modal="true"')

    assert.ok(
      wrapsBaseModal || (hasRoleDialog && hasAriaModal),
      `Modal ${modalPath} must implement WAI-ARIA dialog accessibility (either via BaseModal or direct role & aria-modal)`
    )
  }
})
