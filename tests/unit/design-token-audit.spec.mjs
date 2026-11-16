import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// =============================================================================
// Design Token & Precision Obsidian Guardrail Audit Suite (Wave 3 / Wave 5)
// Validating Neutral Obsidian Palette, Elevation, Bento Surfaces, Typography
// Anti-Halation, Sub-12px Elimination, and Theme Isolation Contracts.
// =============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

function getFilesRecursively(dir, extension = '.vue') {
  let results = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, extension))
    } else if (file.endsWith(extension)) {
      results.push(fullPath)
    }
  }
  return results
}

function loadSource(relativeFilePath) {
  const fullPath = path.resolve(projectRoot, relativeFilePath)
  assert.ok(fs.existsSync(fullPath), `Target file must exist: ${relativeFilePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

// =============================================================================
// 1. GUARD-CSS-TOKENS-01: Neutral Obsidian Palette & Theme Isolation
// =============================================================================

test('GUARD-CSS-TOKENS-01: assets/css/main.css defines neutral Obsidian RGB channels and preserves theme isolation', () => {
  const css = loadSource('assets/css/main.css')

  // 1. Validate neutral RGB channels in :root
  const expectedChannels = [
    { name: '--obs-void-rgb', value: '7 8 10' },
    { name: '--obs-canvas-rgb', value: '11 12 16' },
    { name: '--obs-surface-rgb', value: '17 19 24' },
    { name: '--obs-elevated-rgb', value: '23 25 32' },
    { name: '--obs-hover-rgb', value: '29 32 41' },
    { name: '--obs-text-rgb', value: '243 244 246' },
    { name: '--obs-muted-rgb', value: '138 143 158' },
    { name: '--obs-dim-rgb', value: '118 123 138' },
    { name: '--obs-accent-rgb', value: '16 185 129' },
    { name: '--obs-accent-light-rgb', value: '52 211 153' },
    { name: '--obs-accent-dim-rgb', value: '5 150 105' }
  ]

  for (const { name, value } of expectedChannels) {
    const regex = new RegExp(`${name}:\\s*${value};`)
    assert.ok(regex.test(css), `:root must define ${name}: ${value}; for neutral obsidian palette`)
  }

  // 2. Anti-Green Surface Check: verify zero green-tinted hexes on surface tokens
  const forbiddenGreenHexes = [
    '#0E1411',
    '#040706',
    '#070B09',
    '#151D19',
    '#1C2621',
    '#78867E',
    '#85938B'
  ]

  for (const hex of forbiddenGreenHexes) {
    assert.ok(
      !css.toLowerCase().includes(hex.toLowerCase()),
      `assets/css/main.css must NOT contain deprecated green surface hex: ${hex}`
    )
  }

  // 3. Theme Isolation: Preset blocks (body[data-preset]) only mutate accent tokens
  const presetBlockRegex = /body\[data-preset=["']([^"']+)["']\]\s*\{([^}]+)\}/g
  let match
  let presetCount = 0

  while ((match = presetBlockRegex.exec(css)) !== null) {
    presetCount++
    const presetName = match[1]
    const blockBody = match[2]
    const lines = blockBody.split(';').map(l => l.trim()).filter(Boolean)

    for (const line of lines) {
      const [prop] = line.split(':').map(p => p.trim())
      assert.ok(
        prop.startsWith('--obs-accent'),
        `Preset "${presetName}" must only override accent tokens (--obs-accent*), found illegal property: ${prop}`
      )
      assert.ok(
        !prop.includes('surface') && !prop.includes('void') && !prop.includes('canvas') && !prop.includes('text'),
        `Preset "${presetName}" must NEVER mutate surface or background channels`
      )
    }
  }

  assert.ok(presetCount >= 4, `Must define at least 4 theme presets (emerald, indigo, amethyst, stealth), found: ${presetCount}`)
})

// =============================================================================
// 2. GUARD-CSS-SPECULAR-WORKSPACE-01: Specular Highlights & Neutral Inset Glow
// =============================================================================

test('GUARD-CSS-SPECULAR-WORKSPACE-01: assets/css/main.css defines specular highlights and zero green workspace glow', () => {
  const css = loadSource('assets/css/main.css')

  // Specular top highlight on .obs-card
  assert.ok(
    css.includes('inset 0 1px 0 0 rgba(255, 255, 255, 0.04)'),
    '.obs-card must define specular top border: inset 0 1px 0 0 rgba(255, 255, 255, 0.04)'
  )

  // Inset workspace container zero green glow (uses neutral diffuse radial gradient)
  assert.ok(
    css.includes('.obs-workspace'),
    'main.css must define .obs-workspace component'
  )
  assert.ok(
    !css.includes('rgba(16, 185, 129, 0.14)') || !css.match(/\.obs-workspace[\s\S]*?rgba\(16,\s*185,\s*129,\s*0\.14\)/),
    '.obs-workspace must not emit green radial glow rgba(16, 185, 129, 0.14)'
  )
  assert.ok(
    css.includes('rgba(255, 255, 255, 0.02)'),
    '.obs-workspace must utilize neutral diffuse specular gradient rgba(255, 255, 255, 0.02)'
  )
})

// =============================================================================
// 3. GUARD-DASHBOARD-SURFACES-01: Dashboard Bento Cards & Nominal Banner
// =============================================================================

test('GUARD-DASHBOARD-SURFACES-01: WorkspacePulse nominal banner and Dashboard Bento cards use neutral obsidian surfaces', () => {
  // 1. WorkspacePulse.vue nominal banner check
  const pulseSource = loadSource('components/dashboard/WorkspacePulse.vue')

  assert.ok(
    pulseSource.includes('bg-surface-elevated border border-white/[0.06] rounded-xl'),
    'WorkspacePulse nominal healthy banner must use bg-surface-elevated with subtle border'
  )
  assert.ok(
    !pulseSource.includes('bg-emerald-500/10 border-emerald-500/20 rounded-xl'),
    'WorkspacePulse nominal banner must NOT use full green container bg-emerald-500/10'
  )

  // 2. Bento Dashboard cards audit: all must use obs-card, bg-surface, and rounded-2xl
  const bentoCards = [
    'components/dashboard/InfrastructureMeshCard.vue',
    'components/dashboard/LiveDevOpsStream.vue',
    'components/dashboard/ProjectExecutionOverview.vue',
    'components/dashboard/RecentShipmentsCard.vue',
    'components/dashboard/UnifiedHeroBanner.vue',
    'components/dashboard/WorkspacePulse.vue'
  ]

  for (const cardPath of bentoCards) {
    const cardContent = loadSource(cardPath)
    assert.ok(
      cardContent.includes('obs-card'),
      `${cardPath} root container must implement class "obs-card"`
    )
    assert.ok(
      cardContent.includes('bg-surface'),
      `${cardPath} root container must implement class "bg-surface"`
    )
    assert.ok(
      cardContent.includes('rounded-2xl'),
      `${cardPath} root container must implement outer concentric radius "rounded-2xl"`
    )
  }

  // 3. Anti-Overflow and Viewport Constraint Guards (Option A)
  const recentShipmentsContent = loadSource('components/dashboard/RecentShipmentsCard.vue')
  assert.ok(
    recentShipmentsContent.includes('min-h-0 overflow-hidden'),
    'RecentShipmentsCard root section must use "min-h-0 overflow-hidden" to contain shipment list within card boundary'
  )
  assert.ok(
    recentShipmentsContent.includes('min-h-0') && recentShipmentsContent.includes('overflow-y-auto'),
    'RecentShipmentsCard inner shipment list container must use "min-h-0" and "overflow-y-auto" for scrolling'
  )
  assert.ok(
    !recentShipmentsContent.includes('min-h-[140px]'),
    'RecentShipmentsCard inner container must not use rigid "min-h-[140px]" that causes vertical parent overflow'
  )

  const liveDevOpsContent = loadSource('components/dashboard/LiveDevOpsStream.vue')
  assert.ok(
    liveDevOpsContent.includes('min-h-0 overflow-y-auto'),
    'LiveDevOpsStream list container must use "min-h-0 overflow-y-auto" to allow scroll without silent row truncation'
  )

  const infraMeshContent = loadSource('components/dashboard/InfrastructureMeshCard.vue')
  assert.ok(
    infraMeshContent.includes('grid-cols-3'),
    'InfrastructureMeshCard must use compact 3-column grid layout (grid-cols-3)'
  )
  assert.ok(
    infraMeshContent.includes('whitespace-nowrap'),
    'InfrastructureMeshCard header badge must use whitespace-nowrap to prevent text wrapping'
  )
})

// =============================================================================
// 4. GUARD-TYPOGRAPHY-HYGIENE-01: Zero Sub-12px Font Sizes
// =============================================================================

test('GUARD-TYPOGRAPHY-HYGIENE-01: Scans all Vue files in app/ and components/ for zero sub-12px font usage', () => {
  const vueFiles = [
    ...getFilesRecursively(path.resolve(projectRoot, 'app')),
    ...getFilesRecursively(path.resolve(projectRoot, 'components'))
  ]

  assert.ok(vueFiles.length > 50, `Expected at least 50 Vue files, discovered ${vueFiles.length}`)

  const violations = []
  const sub12pxRegex = /text-\[(?:9|10|11)px\]/g

  for (const filePath of vueFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    const matches = content.match(sub12pxRegex)
    if (matches && matches.length > 0) {
      const relPath = path.relative(projectRoot, filePath)
      violations.push({ file: relPath, count: matches.length })
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Strict Typography Guardrail: Found ${violations.length} files with sub-12px fonts (text-[9px], text-[10px], text-[11px]): ${JSON.stringify(violations)}`
  )
})

// =============================================================================
// 5. GUARD-TYPOGRAPHY-WEIGHT-CEILING-01: Anti-Halation Weight Ceiling (<= 600)
// =============================================================================

test('GUARD-TYPOGRAPHY-WEIGHT-CEILING-01: Scans all Vue files for zero bold/extrabold/black halation classes', () => {
  const vueFiles = [
    ...getFilesRecursively(path.resolve(projectRoot, 'app')),
    ...getFilesRecursively(path.resolve(projectRoot, 'components'))
  ]

  const violations = []
  const boldRegex = /\bfont-(?:bold|extrabold|black)\b/g

  for (const filePath of vueFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    const matches = content.match(boldRegex)
    if (matches && matches.length > 0) {
      const relPath = path.relative(projectRoot, filePath)
      violations.push({ file: relPath, count: matches.length })
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Anti-Halation Guardrail: Weight ceiling <= 600 violated in ${violations.length} files. bold/extrabold/black classes detected: ${JSON.stringify(violations)}`
  )
})

// =============================================================================
// 6. GUARD-HEX-COLOR-CLEANLINESS-01: Zero Arbitrary Dark Hex Overrides
// =============================================================================

test('GUARD-HEX-COLOR-CLEANLINESS-01: Scans all Vue files for zero hardcoded background and text hex colors', () => {
  const vueFiles = [
    ...getFilesRecursively(path.resolve(projectRoot, 'app')),
    ...getFilesRecursively(path.resolve(projectRoot, 'components'))
  ]

  const bgHexViolations = []
  const textHexViolations = []
  const bgHexRegex = /bg-\[#[0-9a-fA-F]{3,8}\]/g
  const textHexRegex = /text-\[#[0-9a-fA-F]{3,8}\]/g

  for (const filePath of vueFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    const bgMatches = content.match(bgHexRegex)
    if (bgMatches && bgMatches.length > 0) {
      const relPath = path.relative(projectRoot, filePath)
      bgHexViolations.push({ file: relPath, matches: bgMatches })
    }
    const textMatches = content.match(textHexRegex)
    if (textMatches && textMatches.length > 0) {
      const relPath = path.relative(projectRoot, filePath)
      textHexViolations.push({ file: relPath, matches: textMatches })
    }
  }

  assert.deepEqual(
    bgHexViolations,
    [],
    `Zero Arbitrary Hex Guard: Discovered hardcoded background hexes in: ${JSON.stringify(bgHexViolations)}`
  )
  assert.deepEqual(
    textHexViolations,
    [],
    `Zero Arbitrary Hex Guard: Discovered hardcoded text hexes in: ${JSON.stringify(textHexViolations)}`
  )
})

// =============================================================================
// 7. GUARD-INTERACTIVE-ACCENT-HYGIENE-01: Zero Stray Interactive Indigo/Purple
// =============================================================================

test('GUARD-INTERACTIVE-ACCENT-HYGIENE-01: Vue components have zero indigo-* classes and zero interactive purple on controls', () => {
  const vueFiles = [
    ...getFilesRecursively(path.resolve(projectRoot, 'app')),
    ...getFilesRecursively(path.resolve(projectRoot, 'components'))
  ]

  // 1. Strict elimination of legacy indigo-* classes across all Vue files
  const indigoViolations = []
  const legacyIndigoRegex = /\bindigo-[0-9]{2,3}\b/g

  for (const filePath of vueFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    const matches = content.match(legacyIndigoRegex)
    if (matches && matches.length > 0) {
      const relPath = path.relative(projectRoot, filePath)
      indigoViolations.push({ file: relPath, matches })
    }
  }

  assert.deepEqual(
    indigoViolations,
    [],
    `Legacy Indigo Elimination Guardrail: Found lingering indigo-* classes in: ${JSON.stringify(indigoViolations)}`
  )

  // 2. Strict prevention of purple/indigo on interactive focus rings, rails, and CTA buttons
  const interactiveViolations = []
  const interactiveColorRegex = /\b(?:focus:ring-|focus-visible:ring-|hover:bg-|active:bg-)(?:indigo|purple)-[3-9]00\b/g

  for (const filePath of vueFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    const matches = content.match(interactiveColorRegex)
    if (matches && matches.length > 0) {
      const relPath = path.relative(projectRoot, filePath)
      interactiveViolations.push({ file: relPath, matches })
    }
  }

  assert.deepEqual(
    interactiveViolations,
    [],
    `Interactive Accent Guardrail: Found stray interactive indigo/purple classes in: ${JSON.stringify(interactiveViolations)}`
  )
})

// =============================================================================
// 8. GUARD-TAILWIND-CONFIG-01: Alpha-Value Semantic Channels & Font Stacks
// =============================================================================

test('GUARD-TAILWIND-CONFIG-01: tailwind.config.ts exports alpha-value CSS channels and Geist font stacks', () => {
  const config = loadSource('tailwind.config.ts')

  // Verify semantic CSS variables with alpha-value support
  const requiredSemanticChannels = [
    "void: 'rgb(var(--obs-void-rgb) / <alpha-value>)'",
    "canvas: 'rgb(var(--obs-canvas-rgb) / <alpha-value>)'",
    "foreground: 'rgb(var(--obs-text-rgb) / <alpha-value>)'",
    "muted: 'rgb(var(--obs-muted-rgb) / <alpha-value>)'",
    "dim: 'rgb(var(--obs-dim-rgb) / <alpha-value>)'"
  ]

  for (const channel of requiredSemanticChannels) {
    assert.ok(
      config.includes(channel),
      `tailwind.config.ts must map color using alpha-value channel: ${channel}`
    )
  }

  // Verify font stacks
  assert.ok(
    config.includes('Geist Sans Variable') || config.includes('Geist Sans'),
    'tailwind.config.ts must configure Geist Sans in fontFamily.sans'
  )
  assert.ok(
    config.includes('Geist Mono Variable') || config.includes('Geist Mono'),
    'tailwind.config.ts must configure Geist Mono in fontFamily.mono'
  )
})
