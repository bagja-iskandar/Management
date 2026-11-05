import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// =============================================================================
// Micro-Animations & Motion Polish Unit & Contract Verification Suite (Wave 5)
// Validating 7 tactile micro-interaction contracts and accessibility guards:
// BaseButton, BaseSegmentedControl, BaseBadge, BaseSwitch, AlertBar,
// HeaderBar, Sidebar
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

// =============================================================================
// 1. ANIM-BTN-01: BaseButton Tactile Scale & Motion Reduction
// =============================================================================

test('ANIM-BTN-01: BaseButton.vue applies 150ms press feedback scale-[0.97] and motion-reduce guards', () => {
  const content = loadSource('components/ui/BaseButton.vue')

  // Verify transition duration and easing
  assert.ok(
    content.includes('duration-150'),
    'BaseButton must define duration-150 for fluid micro-interaction'
  )
  assert.ok(
    content.includes('ease-out'),
    'BaseButton must define ease-out curve for natural tactile feel'
  )

  // Verify active press scale
  assert.ok(
    content.includes('active:scale-[0.97]'),
    'BaseButton must apply active:scale-[0.97] press feedback'
  )

  // Verify disabled state suppression
  assert.ok(
    content.includes("isDisabled.value ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'active:scale-[0.97]'"),
    'BaseButton must suppress active press scale when disabled or loading'
  )

  // Verify accessibility reduced-motion overrides
  assert.ok(
    content.includes('motion-reduce:transition-none'),
    'BaseButton must disable transitions under prefers-reduced-motion'
  )
  assert.ok(
    content.includes('motion-reduce:transform-none'),
    'BaseButton must disable transforms under prefers-reduced-motion'
  )
})

// =============================================================================
// 2. ANIM-SEG-01: BaseSegmentedControl Tactile Scale & Motion Reduction
// =============================================================================

test('ANIM-SEG-01: BaseSegmentedControl.vue tab items apply 150ms press feedback scale-[0.98] and motion-reduce guards', () => {
  const content = loadSource('components/ui/BaseSegmentedControl.vue')

  // Verify duration and easing on tab items
  assert.ok(
    content.includes('duration-150'),
    'BaseSegmentedControl tabs must define duration-150'
  )
  assert.ok(
    content.includes('ease-out'),
    'BaseSegmentedControl tabs must define ease-out'
  )

  // Verify active press scale
  assert.ok(
    content.includes('active:scale-[0.98]'),
    'BaseSegmentedControl tabs must apply active:scale-[0.98] tactile feedback'
  )

  // Verify accessibility reduced-motion overrides
  assert.ok(
    content.includes('motion-reduce:transition-none'),
    'BaseSegmentedControl must disable transitions under prefers-reduced-motion'
  )
  assert.ok(
    content.includes('motion-reduce:transform-none'),
    'BaseSegmentedControl must disable transforms under prefers-reduced-motion'
  )
})

// =============================================================================
// 3. ANIM-BADGE-01: BaseBadge isPulseStatus & Motion Reduction
// =============================================================================

test('ANIM-BADGE-01: BaseBadge.vue implements isPulseStatus for running_sprint dot with motion-reduce guard', () => {
  const content = loadSource('components/ui/BaseBadge.vue')

  // Verify isPulseStatus computed property definition
  assert.ok(
    content.includes('const isPulseStatus = computed('),
    'BaseBadge must implement isPulseStatus computed'
  )
  assert.ok(
    content.includes("props.value === 'running_sprint'"),
    'isPulseStatus must evaluate true exclusively for running_sprint status'
  )
  assert.ok(
    content.includes("props.variant !== 'status'"),
    'isPulseStatus must be strictly constrained to status variant'
  )

  // Verify template animate-pulse conditional application
  assert.ok(
    content.includes(":class=\"isPulseStatus ? 'animate-pulse' : ''\""),
    'BaseBadge dot must apply animate-pulse when isPulseStatus is active'
  )

  // Verify accessibility reduced-motion guard on dot
  assert.ok(
    content.includes('motion-reduce:animate-none'),
    'BaseBadge dot must declare motion-reduce:animate-none for vestibular safety'
  )
})

// =============================================================================
// 4. ANIM-SWITCH-01: BaseSwitch Thumb Transition & Motion Reduction
// =============================================================================

test('ANIM-SWITCH-01: BaseSwitch.vue preserves thumb transform classes with 150ms ease-out and motion-reduce guards', () => {
  const content = loadSource('components/ui/BaseSwitch.vue')

  // Verify thumb class definition
  assert.ok(
    content.includes('duration-150 ease-out'),
    'BaseSwitch thumb must define duration-150 ease-out'
  )
  assert.ok(
    content.includes('motion-reduce:transition-none motion-reduce:transform-none'),
    'BaseSwitch thumb must guard against motion sickness with motion-reduce overrides'
  )

  // Verify thumb translation bindings are intact
  assert.ok(
    content.includes("modelValue ? thumbTranslateClasses : 'translate-x-0'"),
    'BaseSwitch thumb must conditionally toggle translation classes'
  )
  assert.ok(
    content.includes("return 'translate-x-3.5'") && content.includes("return 'translate-x-4.5'"),
    'BaseSwitch must compute size-dependent thumb translate classes'
  )
})

// =============================================================================
// 5. ANIM-ALERT-01: AlertBar Transition, -translate-y-2 Fade, class Prop & Guards
// =============================================================================

test('ANIM-ALERT-01: AlertBar.vue wraps banner in Transition with -translate-y-2 fade, supports custom class prop, and motion-reduce guards', () => {
  const content = loadSource('components/layout/AlertBar.vue', 'components/AlertBar.vue')

  // Verify Transition wrapper
  assert.ok(
    content.includes('<Transition'),
    'AlertBar must wrap aside in a Vue Transition element'
  )
  assert.ok(
    content.includes('enter-active-class="transition duration-150 ease-out"'),
    'Transition enter must use duration-150 ease-out'
  )
  assert.ok(
    content.includes('enter-from-class="transform -translate-y-2 opacity-0"'),
    'Transition enter-from must start at -translate-y-2 opacity-0'
  )
  assert.ok(
    content.includes('enter-to-class="transform translate-y-0 opacity-100"'),
    'Transition enter-to must reach translate-y-0 opacity-100'
  )
  assert.ok(
    content.includes('leave-active-class="transition duration-100 ease-in"'),
    'Transition leave must use duration-100 ease-in'
  )
  assert.ok(
    content.includes('leave-to-class="transform -translate-y-2 opacity-0"'),
    'Transition leave-to must dismiss upward with -translate-y-2 opacity-0'
  )

  // Verify class prop support on root aside
  assert.ok(
    content.includes(':class="props.class"') || content.includes(':class="[props.class'),
    'AlertBar aside must bind props.class to support external layout composition'
  )
  assert.ok(
    content.includes('class?: string'),
    'AlertBar defineProps must declare optional class prop'
  )

  // Verify motion-reduce guards on aside
  assert.ok(
    content.includes('motion-reduce:transition-none motion-reduce:transform-none'),
    'AlertBar aside must include motion-reduce overrides'
  )
})

// =============================================================================
// 6. ANIM-HEADER-01: HeaderBar Action Button Tactile Scale & Motion Reduction
// =============================================================================

test('ANIM-HEADER-01: HeaderBar.vue contextual action buttons apply tactile press scale-[0.97] and motion-reduce guards', () => {
  const content = loadSource('components/layout/HeaderBar.vue', 'components/HeaderBar.vue')

  // Verify action button classes
  assert.ok(
    content.includes('active:scale-[0.97]'),
    'HeaderBar action buttons must apply active:scale-[0.97] tactile feedback'
  )
  assert.ok(
    content.includes('duration-150 ease-out'),
    'HeaderBar action buttons must define duration-150 ease-out'
  )
  assert.ok(
    content.includes('motion-reduce:transition-none motion-reduce:transform-none'),
    'HeaderBar action buttons must declare motion-reduce overrides'
  )
  assert.ok(
    content.includes('disabled:pointer-events-none'),
    'HeaderBar action buttons must disable interactions when disabled or loading'
  )
})

// =============================================================================
// 7. ANIM-SIDEBAR-01: Sidebar Accordion & Chevron Transitions & Motion Reduction
// =============================================================================

test('ANIM-SIDEBAR-01: Sidebar.vue project tree accordion and chevron apply 200ms ease-out transitions and motion-reduce guards', () => {
  const content = loadSource('components/layout/Sidebar.vue', 'components/Sidebar.vue')

  // Verify Chevron button rotation transitions
  assert.ok(
    content.includes('transition-transform duration-200 ease-out'),
    'Sidebar project chevron must define transition-transform duration-200 ease-out'
  )
  assert.ok(
    content.includes("isExpanded(project.slug) ? 'rotate-90 text-[#F3F4F6]' : 'rotate-0'"),
    'Sidebar project chevron must rotate 90 degrees when expanded'
  )
  assert.ok(
    content.includes('motion-reduce:transition-none motion-reduce:transform-none'),
    'Sidebar project chevron must declare motion-reduce overrides'
  )

  // Verify Accordion container grid-template-rows expansion
  assert.ok(
    content.includes('transition-[grid-template-rows] duration-200 ease-out'),
    'Sidebar accordion container must transition grid-template-rows with duration-200 ease-out'
  )
  assert.ok(
    content.includes("isExpanded(project.slug) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'"),
    'Sidebar accordion container must toggle between grid-rows-[1fr] and grid-rows-[0fr]'
  )
  assert.ok(
    content.includes('motion-reduce:transition-none'),
    'Sidebar accordion container must declare motion-reduce:transition-none'
  )
})
