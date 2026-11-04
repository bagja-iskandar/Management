import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// =============================================================================
// UI Primitives Unit & Contract Verification Suite
// Validating 9 atomic components in components/ui/:
// BaseButton, BaseCard, BaseModal, BaseDrawer, BaseInput, BaseSelect,
// BaseBadge, BaseSegmentedControl, BaseEmptyState
// =============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

function loadComponentSource(relativePath) {
  const fullPath = path.resolve(projectRoot, relativePath)
  assert.ok(fs.existsSync(fullPath), `Component file must exist at ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

// =============================================================================
// 1. BASE BUTTON (components/ui/BaseButton.vue)
// =============================================================================

test('UI-BUTTON-01: BaseButton supports polymorphic rendering (button / a / NuxtLink) and security attributes', () => {
  const content = loadComponentSource('components/ui/BaseButton.vue')

  // Polymorphic rendering check
  assert.ok(content.includes(":is=\"componentTag\""), 'Must render dynamic polymorphic component tag')
  assert.ok(content.includes("resolveComponent('NuxtLink')"), 'Must resolve NuxtLink when "to" prop is present')
  assert.ok(content.includes("return 'a'"), 'Must render anchor tag when "href" prop is present')
  assert.ok(content.includes("return 'button'"), 'Must default to button tag')

  // Security attributes for external links
  assert.ok(
    content.includes("target || '_blank'") && content.includes("rel || 'noopener noreferrer'"),
    'Must enforce secure target and rel attributes for external links'
  )
})

test('UI-BUTTON-02: BaseButton supports all 5 Obsidian Bento variants, sizes, and loading state', () => {
  const content = loadComponentSource('components/ui/BaseButton.vue')

  // Variants contract
  assert.ok(content.includes("'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'"), 'Must declare ButtonVariant union')
  assert.ok(content.includes('variantClasses: Record<ButtonVariant, string>'), 'Must map all ButtonVariant classes')
  assert.ok(content.includes('bg-indigo-600'), 'Accent variant must utilize indigo theme accent')
  assert.ok(content.includes('bg-rose-500/10'), 'Danger variant must utilize subtle rose backdrop')

  // Sizes contract
  assert.ok(content.includes("'sm' | 'md' | 'lg' | 'icon'"), 'Must declare ButtonSize union')
  assert.ok(content.includes('w-8 h-8 rounded-lg flex items-center justify-center p-0'), 'Icon size must have fixed 32px dimensions')

  // Loading spinner & disabled state
  assert.ok(content.includes('name="Loader2"') && content.includes('animate-spin'), 'Must render Loader2 spinner when loading')
  assert.ok(content.includes('props.disabled || props.loading'), 'Disabled state must be triggered by disabled or loading prop')
  assert.ok(content.includes(':aria-disabled="isDisabled ? \'true\' : undefined"'), 'Must set aria-disabled attribute')
})

// =============================================================================
// 2. BASE CARD (components/ui/BaseCard.vue)
// =============================================================================

test('UI-CARD-01: BaseCard supports polymorphic container tag, variants, and padding scales', () => {
  const content = loadComponentSource('components/ui/BaseCard.vue')

  // Polymorphic container
  assert.ok(content.includes(':is="as"'), 'Must render dynamic polymorphic container tag "as"')
  assert.ok(content.includes("as: 'div'"), 'Default container tag must be div')

  // Variants contract
  assert.ok(content.includes("'default' | 'interactive' | 'inset'"), 'Must declare CardVariant union')
  assert.ok(content.includes('obs-card rounded-2xl bg-[#111318] border border-white/[0.07]'), 'Default card must use obsidian #111318 surface')
  assert.ok(content.includes('obs-card-interactive'), 'Interactive card must apply interactive elevation styling')
  assert.ok(content.includes('bg-[#0B0C10] border border-white/[0.06] rounded-xl'), 'Inset card must use deeper #0B0C10 void background')

  // Padding scales
  assert.ok(content.includes("'none' | 'sm' | 'md' | 'lg'"), 'Must declare CardPadding scale')
  assert.ok(content.includes("none: 'p-0'"), 'Padding none must map to p-0')
})

test('UI-CARD-02: BaseCard structures header, actions, default content, and footer slots', () => {
  const content = loadComponentSource('components/ui/BaseCard.vue')

  assert.ok(content.includes('<slot name="header">'), 'Must support custom header slot')
  assert.ok(content.includes('<slot name="actions" />'), 'Must support dedicated actions header slot')
  assert.ok(content.includes('<slot />'), 'Must render default content slot')
  assert.ok(content.includes('<slot name="footer" />'), 'Must support footer slot with border separation')
  assert.ok(content.includes('class="font-sans text-sm font-semibold text-[#F3F4F6] truncate"'), 'Header title must follow typography standard')
})

// =============================================================================
// 3. BASE MODAL (components/ui/BaseModal.vue)
// =============================================================================

test('UI-MODAL-01: BaseModal teleports to body with backdrop blur and accessible dialog roles', () => {
  const content = loadComponentSource('components/ui/BaseModal.vue')

  // Teleportation and Backdrop
  assert.ok(content.includes('<Teleport to="body">'), 'Must teleport dialog to document body')
  assert.ok(content.includes('bg-black/80 backdrop-blur-md'), 'Must apply dark obsidian backdrop blur')

  // ARIA Accessibility
  assert.ok(content.includes('role="dialog"'), 'Must define role="dialog"')
  assert.ok(content.includes('aria-modal="true"'), 'Must declare aria-modal="true"')
  assert.ok(content.includes(':aria-labelledby="titleId"'), 'Must connect aria-labelledby with title ID')
  assert.ok(content.includes('@click.self="handleBackdropClick"'), 'Must handle backdrop dismissal safely')
})

test('UI-MODAL-02: BaseModal integrates useModalLifecycle and maxWidth scale', () => {
  const content = loadComponentSource('components/ui/BaseModal.vue')

  // Modal lifecycle integration
  assert.ok(content.includes('useModalLifecycle({'), 'Must integrate useModalLifecycle composable')
  assert.ok(content.includes('panelRef,'), 'Must pass panelRef to lifecycle trap')
  assert.ok(content.includes("emit('close')"), 'Must emit close event on dismissal')
  assert.ok(content.includes("emit('update:modelValue', false)"), 'Must emit update:modelValue for two-way binding')

  // Max width scale
  assert.ok(content.includes("'max-w-sm'") && content.includes("'max-w-2xl'") && content.includes("'max-w-3xl'"), 'Must support responsive maxWidth scale')
})

// =============================================================================
// 4. BASE DRAWER (components/ui/BaseDrawer.vue)
// =============================================================================

test('UI-DRAWER-01: BaseDrawer renders right-sheet slide drawer with accessible backdrop and useModalLifecycle', () => {
  const content = loadComponentSource('components/ui/BaseDrawer.vue')

  // Teleportation and Right-aligned layout
  assert.ok(content.includes('<Teleport to="body">'), 'Must teleport drawer to body')
  assert.ok(content.includes('flex justify-end'), 'Drawer container must align panel to the right edge')
  assert.ok(content.includes('bg-[#111318] border-l border-white/[0.1]'), 'Drawer panel must use obsidian surface with left border')

  // Transition classes
  assert.ok(content.includes('transform: translateX(100%)'), 'Drawer slide transition must animate from 100% X offset')
  assert.ok(content.includes('transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1)'), 'Must apply smooth spring cubic-bezier curve')

  // Lifecycle & events
  assert.ok(content.includes('useModalLifecycle'), 'Must integrate useModalLifecycle for drawer focus and scroll lock')
  assert.ok(content.includes("emit('close')"), 'Must emit close event on dismissal')
})

// =============================================================================
// 5. BASE INPUT (components/ui/BaseInput.vue)
// =============================================================================

test('UI-INPUT-01: BaseInput supports text and textarea modes, prefix/suffix slots, and clearable action', () => {
  const content = loadComponentSource('components/ui/BaseInput.vue')

  // Mode detection
  assert.ok(content.includes('v-if="isTextarea"'), 'Must render textarea element when textarea mode is active')
  assert.ok(content.includes('props.type === \'textarea\' || typeof props.rows === \'number\''), 'Textarea mode must activate via type or rows prop')
  assert.ok(content.includes('<input'), 'Must render standard input element when in text mode')

  // Slots & Clearable
  assert.ok(content.includes('<slot name="prefix">'), 'Must support prefix slot')
  assert.ok(content.includes('<slot name="suffix" />'), 'Must support suffix slot')
  assert.ok(content.includes('clearable && Boolean(modelValue)'), 'Must conditionally render clear button when clearable and has value')
  assert.ok(content.includes("emit('update:modelValue', '')"), 'Clear button must clear value')
  assert.ok(content.includes("emit('clear')"), 'Clear button must emit clear event')
})

test('UI-INPUT-02: BaseInput applies Obsidian Bento focus and validation error styles', () => {
  const content = loadComponentSource('components/ui/BaseInput.vue')

  assert.ok(content.includes('bg-[#0B0C10] rounded-xl text-xs font-sans text-[#F3F4F6]'), 'Input must use void #0B0C10 styling')
  assert.ok(content.includes('border-rose-500/40 text-rose-300'), 'Error state must apply subtle rose borders and text')
  assert.ok(content.includes('border-white/[0.08] focus:border-indigo-500/50'), 'Standard state must apply obsidian border and indigo focus ring')
  assert.ok(content.includes('v-if="error" class="font-sans text-xs text-rose-400'), 'Must render error feedback paragraph')
})

// =============================================================================
// 6. BASE SELECT (components/ui/BaseSelect.vue)
// =============================================================================

test('UI-SELECT-01: BaseSelect applies appearance-none, custom ChevronDown, and Dark Obsidian option styling', () => {
  const content = loadComponentSource('components/ui/BaseSelect.vue')

  // Native appearance replacement
  assert.ok(content.includes('appearance-none'), 'Select element must hide native dropdown arrow with appearance-none')
  assert.ok(content.includes('name="ChevronDown"'), 'Must render custom NexuraIcon ChevronDown')
  assert.ok(content.includes('pointer-events-none'), 'ChevronDown container must pass clicks to underlying select')

  // Option dropdown styling
  assert.ok(content.includes('class="bg-[#111318] text-[#565B68] py-1.5"'), 'Placeholder option must use #111318 surface')
  assert.ok(content.includes('class="bg-[#111318] text-[#F3F4F6] py-1.5"'), 'Standard options must use #111318 surface and #F3F4F6 text')
})

test('UI-SELECT-02: BaseSelect normalizes primitive string options and structured option objects', () => {
  const content = loadComponentSource('components/ui/BaseSelect.vue')

  assert.ok(content.includes('normalizedOptions = computed<SelectOptionObject[]>'), 'Must normalize options into uniform object array')
  assert.ok(content.includes("return { value: opt, label: String(opt) }"), 'Must map string/number primitive options to { value, label }')
  assert.ok(content.includes("emit('change', target.value)"), 'Must emit change event on selection')
})

// =============================================================================
// 7. BASE BADGE (components/ui/BaseBadge.vue)
// =============================================================================

test('UI-BADGE-01: BaseBadge enforces minimum font text-xs (12px) and integrates utils/badges.ts', () => {
  const content = loadComponentSource('components/ui/BaseBadge.vue')

  // Strict typography check (Anti-10px rule)
  assert.ok(content.includes('text-xs'), 'BaseBadge must enforce text-xs (12px) font size')
  assert.ok(!content.includes('text-[10px]'), 'BaseBadge must not use tiny text-[10px]')

  // utils/badges integration
  assert.ok(content.includes("from '~/utils/badges'"), 'Must import pure helpers from ~/utils/badges')
  assert.ok(content.includes('getStatusLabel'), 'Must use getStatusLabel for status variant')
  assert.ok(content.includes('getStatusBadgeClass'), 'Must use getStatusBadgeClass for status variant')
  assert.ok(content.includes('getPriorityBadgeClass'), 'Must use getPriorityBadgeClass for priority variant')
  assert.ok(content.includes('getPriorityColor'), 'Must use getPriorityColor for priority dot styling')
})

test('UI-BADGE-02: BaseBadge supports status, priority, tech, phase, and custom variants with dot indicators', () => {
  const content = loadComponentSource('components/ui/BaseBadge.vue')

  assert.ok(content.includes("'status' | 'priority' | 'tech' | 'phase' | 'custom'"), 'Must declare BadgeVariant union')
  assert.ok(content.includes('v-if="dot"'), 'Must conditionally render status/priority dot indicator')
  assert.ok(content.includes("raw.startsWith('#') ? raw : `#${raw}`"), 'Tech tag variant must ensure single hash prefix')
  assert.ok(content.includes('bg-indigo-500/10 text-indigo-300'), 'Phase variant must use subtle indigo branding')
})

// =============================================================================
// 8. BASE SEGMENTED CONTROL (components/ui/BaseSegmentedControl.vue)
// =============================================================================

test('UI-SEGMENTED-01: BaseSegmentedControl renders tablist with active pill states and two-way binding', () => {
  const content = loadComponentSource('components/ui/BaseSegmentedControl.vue')

  // Container & ARIA
  assert.ok(content.includes('role="tablist"'), 'Container must declare role="tablist"')
  assert.ok(content.includes('role="tab"'), 'Pill buttons must declare role="tab"')
  assert.ok(content.includes(':aria-selected="modelValue === opt.value ? \'true\' : \'false\'"'), 'Must set aria-selected accurately')

  // Active vs Inactive visual styling
  assert.ok(
    content.includes("bg-white/[0.08] text-[#F3F4F6] font-medium shadow-sm border border-white/[0.08]"),
    'Active pill must apply elevated glass styling'
  )
  assert.ok(
    content.includes("text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border border-transparent"),
    'Inactive pill must apply muted text and transparent border'
  )

  // Emits
  assert.ok(content.includes("emit('update:modelValue', val)"), 'Must emit update:modelValue on selection')
  assert.ok(content.includes("emit('change', val)"), 'Must emit change event on selection')
})

// =============================================================================
// 9. BASE EMPTY STATE (components/ui/BaseEmptyState.vue)
// =============================================================================

test('UI-EMPTY-01: BaseEmptyState supports empty, error, and skeleton variants with slot composition', () => {
  const content = loadComponentSource('components/ui/BaseEmptyState.vue')

  // Variants contract
  assert.ok(content.includes("'empty' | 'error' | 'skeleton'"), 'Must declare EmptyStateVariant union')

  // Skeleton variant
  assert.ok(content.includes("variant === 'skeleton'"), 'Must handle skeleton loading mode')
  assert.ok(content.includes('animate-pulse'), 'Skeleton mode must apply animate-pulse')

  // Error variant
  assert.ok(content.includes("variant === 'error'"), 'Must handle error mode')
  assert.ok(content.includes('role="alert"'), 'Error mode must declare role="alert"')
  assert.ok(content.includes('border-rose-500/30 bg-rose-500/[0.03]'), 'Error mode must use rose alerting palette')

  // Standard empty mode & slots
  assert.ok(content.includes('<slot />'), 'Must support custom content slot')
  assert.ok(content.includes('<slot name="actions" />'), 'Must support actions slot for recovery buttons')
})
