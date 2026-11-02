import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// =============================================================================
// Settings and Dashboard Polish Unit & Contract Verification Suite
// =============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

// =============================================================================
// 1. DASHBOARD LAYOUT & VIEWPORT POLISH
// =============================================================================

test('DASH-LAYOUT-01: components/Dashboard.vue root container is free of pb-6 to eliminate double padding clashes', () => {
  const filePath = path.resolve(projectRoot, 'components/Dashboard.vue')
  const content = fs.readFileSync(filePath, 'utf8')

  // Extract root container template tag
  const rootMatch = content.match(/<template>\s*<div([^>]+)>/)
  assert.ok(rootMatch, 'Dashboard.vue must contain a root template div')

  const rootAttributes = rootMatch[1]
  assert.ok(
    !rootAttributes.includes('pb-6'),
    'Root container in Dashboard.vue must not contain pb-6 to prevent double vertical padding'
  )
  assert.ok(
    rootAttributes.includes('space-y-4'),
    'Root container must preserve space-y-4 bento grid spacing'
  )
  assert.ok(
    rootAttributes.includes('xl:h-full') && rootAttributes.includes('xl:flex-col'),
    'Root container must maintain single-viewport height and flex layout'
  )
})

// =============================================================================
// 2. LIVE DEVOPS STREAM ENRICHMENT CONTRACTS
// =============================================================================

test('DEVOPS-ENRICH-01: DevOpsStreamItem interface and commitItems mapping in LiveDevOpsStream.vue include authorName', () => {
  const filePath = path.resolve(projectRoot, 'components/dashboard/LiveDevOpsStream.vue')
  const content = fs.readFileSync(filePath, 'utf8')

  // Verify DevOpsStreamItem interface contains authorName
  assert.ok(
    content.includes('authorName?: string'),
    'DevOpsStreamItem interface must declare authorName optional property'
  )

  // Verify commitItems computed mapping extracts authorName
  assert.ok(
    content.includes('authorName: c.authorName') || content.includes('authorName:'),
    'commitItems mapping must map authorName from commit object'
  )
  assert.ok(
    content.includes('htmlUrl: c.htmlUrl'),
    'commitItems mapping must map htmlUrl from commit object'
  )
})

test('DEVOPS-ENRICH-02: LiveDevOpsStream.vue template renders authorName and direct external commit link item.htmlUrl', () => {
  const filePath = path.resolve(projectRoot, 'components/dashboard/LiveDevOpsStream.vue')
  const content = fs.readFileSync(filePath, 'utf8')

  // Verify authorName rendering with conditional display
  assert.ok(
    content.includes('item.authorName'),
    'Template must conditionally render item.authorName'
  )

  // Verify direct external link anchor binding
  assert.ok(
    content.includes(':href="item.htmlUrl"') && content.includes('target="_blank"'),
    'Template must render external anchor targeting item.htmlUrl in new tab'
  )
  assert.ok(
    content.includes('rel="noopener noreferrer"'),
    'External link must enforce rel="noopener noreferrer" security standard'
  )
})

// =============================================================================
// 3. SHIPPED DELIVERABLES HONEST COPY & EMPTY STATE
// =============================================================================

test('SHIPMENTS-COPY-01: RecentShipmentsCard.vue displays header "Shipped Deliverables" and badge "Shipped Wins"', () => {
  const filePath = path.resolve(projectRoot, 'components/dashboard/RecentShipmentsCard.vue')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(
    content.includes('Shipped Deliverables'),
    'Header title must strictly display "Shipped Deliverables"'
  )
  assert.ok(
    content.includes('Shipped Wins'),
    'Metric badge must display "Shipped Wins" representing verified completions'
  )
  assert.ok(
    content.includes('Verified Live'),
    'Delivered items must display "Verified Live" badge'
  )
})

test('SHIPMENTS-COPY-02: RecentShipmentsCard.vue empty state displays honest, helpful copy', () => {
  const filePath = path.resolve(projectRoot, 'components/dashboard/RecentShipmentsCard.vue')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(
    content.includes('No deliverables marked as deployed yet.'),
    'Empty state must state "No deliverables marked as deployed yet."'
  )
  assert.ok(
    content.includes('Move tasks to DONE in Kanban to showcase wins here.'),
    'Empty state helper must state "Move tasks to DONE in Kanban to showcase wins here."'
  )
})

// =============================================================================
// 4. GLOBAL SETTINGS PAGE ARCHITECTURE & BENTO SYSTEM
// =============================================================================

test('SETTINGS-GLOBAL-01: app/pages/settings.vue exists and integrates useSession, telemetry endpoint, and useHeaderActions', () => {
  const filePath = path.resolve(projectRoot, 'app/pages/settings.vue')
  assert.ok(fs.existsSync(filePath), 'app/pages/settings.vue must exist in workspace')

  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(content.includes('useSession()') || content.includes('useSession'), 'Must integrate useSession composable')
  assert.ok(content.includes('/api/telemetry'), 'Must query /api/telemetry endpoint for infrastructure health')
  assert.ok(content.includes('useHeaderActions()') || content.includes('useHeaderActions'), 'Must integrate useHeaderActions composable')
})

test('SETTINGS-GLOBAL-02: app/pages/settings.vue renders 3 Bento Cards: Session Cockpit, Telemetry & Allowlist, and Theme Presets', () => {
  const filePath = path.resolve(projectRoot, 'app/pages/settings.vue')
  const content = fs.readFileSync(filePath, 'utf8')

  // Card 1: Session Cockpit
  assert.ok(
    content.includes('Security & Session'),
    'Must render Bento Card 1 for Security & Session management'
  )
  assert.ok(
    content.includes('loginWithAccessKey'),
    'Card 1 must wire loginWithAccessKey authentication action'
  )

  // Card 2: Telemetry & Allowlist
  assert.ok(
    content.includes('Telemetry & Allowlist'),
    'Must render Bento Card 2 for Infrastructure Telemetry & Allowlist'
  )
  assert.ok(
    content.includes('Supabase Live Probe'),
    'Card 2 must render Supabase Live Probe connectivity status'
  )
  assert.ok(
    content.includes('Allowed GitHub Repositories'),
    'Card 2 must list SSR-enforced Allowed GitHub Repositories'
  )

  // Card 3: Theme Presets
  assert.ok(
    content.includes('Theme & Appearance'),
    'Must render Bento Card 3 for Precision Dark Obsidian Theme & Appearance'
  )
  assert.ok(
    content.includes('themePresets') && content.includes('onSelectTheme'),
    'Card 3 must wire themePresets and onSelectTheme handler'
  )
})

// =============================================================================
// 5. PROJECT SETTINGS COCKPIT & DANGER ZONE
// =============================================================================

test('SETTINGS-PROJECT-01: Tab "settings" is canonically registered in projectTabs on app/pages/projects/[slug].vue', () => {
  const filePath = path.resolve(projectRoot, 'app/pages/projects/[slug].vue')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(
    content.includes("id: 'settings', label: 'Settings', icon: 'Settings'"),
    'projectTabs must register tab { id: \'settings\', label: \'Settings\', icon: \'Settings\' }'
  )
})

test('SETTINGS-PROJECT-02: app/pages/projects/[slug].vue renders Project Settings section with metadata form calling updateProject', () => {
  const filePath = path.resolve(projectRoot, 'app/pages/projects/[slug].vue')
  const content = fs.readFileSync(filePath, 'utf8')

  // Section conditioning
  assert.ok(
    content.includes("v-else-if=\"activeTab === 'settings'\""),
    'Must contain section conditioned on activeTab === \'settings\''
  )

  // Metadata Form Fields
  assert.ok(content.includes('editProjectForm.title'), 'Form must bind editProjectForm.title')
  assert.ok(content.includes('editProjectForm.githubRepo'), 'Form must bind editProjectForm.githubRepo')
  assert.ok(content.includes('editProjectForm.description'), 'Form must bind editProjectForm.description')
  assert.ok(content.includes('editProjectForm.deployUrl'), 'Form must bind editProjectForm.deployUrl')

  // Mutation invocation
  assert.ok(
    content.includes('projectsApi.updateProject(currentProject.value.slug'),
    'Form submission must invoke projectsApi.updateProject with slug and payload'
  )
})

test('SETTINGS-DANGER-01: app/pages/projects/[slug].vue renders Danger Zone card triggering openDeleteProjectModal()', () => {
  const filePath = path.resolve(projectRoot, 'app/pages/projects/[slug].vue')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(content.includes('Danger Zone'), 'Settings section must include Danger Zone heading')
  assert.ok(
    content.includes('@click="openDeleteProjectModal"'),
    'Danger Zone delete button must trigger openDeleteProjectModal'
  )
})

// =============================================================================
// 6. SIDEBAR SETTINGS INTEGRATION (NAVIGATION RAIL & ACCORDION)
// =============================================================================

test('SIDEBAR-SETTINGS-01: components/Sidebar.vue Navigation Rail registers /settings route with Settings icon', () => {
  const filePath = path.resolve(projectRoot, 'components/Sidebar.vue')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(
    content.includes('to="/settings"'),
    'Sidebar Navigation Rail must contain NuxtLink to /settings'
  )
  assert.ok(
    content.includes("isRouteActive('/settings')"),
    'Sidebar must track active state for /settings route'
  )
})

test('SIDEBAR-SETTINGS-02: components/Sidebar.vue Project Tree Accordion registers Settings sub-item invoking selectProjectTab(project.slug, "settings")', () => {
  const filePath = path.resolve(projectRoot, 'components/Sidebar.vue')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(
    content.includes("selectProjectTab(project.slug, 'settings')"),
    'Project Tree Accordion must wire click handler to selectProjectTab(project.slug, \'settings\')'
  )
  assert.ok(
    content.includes("isSubItemActive(project.slug, 'settings')"),
    'Project Tree Accordion must track active state for settings sub-item'
  )
})
