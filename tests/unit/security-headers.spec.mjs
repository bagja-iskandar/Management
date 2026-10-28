import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Pure ESM Test Suite: Security Headers, Credentials Lockdown & Migration Idempotency (Phase 0)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')

test('Test 1: Nuxt config credentials leak check and security headers', () => {
  const nuxtConfigPath = path.join(projectRoot, 'nuxt.config.ts')
  assert.ok(fs.existsSync(nuxtConfigPath), 'nuxt.config.ts must exist')

  const content = fs.readFileSync(nuxtConfigPath, 'utf8')

  // Hardcoded supabase reference must NOT exist
  assert.ok(
    !content.includes('iklvthppfigprjhqmrlo.supabase.co'),
    'nuxt.config.ts must NEVER contain hardcoded Supabase project reference iklvthppfigprjhqmrlo.supabase.co'
  )

  // runtimeConfig.public.supabaseUrl must reference environment variable
  assert.match(
    content,
    /public:\s*\{[\s\S]*supabaseUrl:\s*process\.env\.SUPABASE_URL/,
    'runtimeConfig.public.supabaseUrl must dynamically pull from process.env.SUPABASE_URL'
  )

  // Security response headers must be configured in nitro routeRules
  assert.match(content, /'X-Content-Type-Options':\s*'nosniff'/, 'Nitro routeRules must enforce X-Content-Type-Options: nosniff')
  assert.match(content, /'X-Frame-Options':\s*'SAMEORIGIN'/, 'Nitro routeRules must enforce X-Frame-Options: SAMEORIGIN')
  assert.match(content, /'Referrer-Policy':\s*'strict-origin-when-cross-origin'/, 'Nitro routeRules must enforce Referrer-Policy')
})

test('Test 2: Migration 003 idempotency and RLS lockdown audit', () => {
  const migrationPath = path.join(
    projectRoot,
    'server/database/migrations/003_system_alignment_and_rls_lockdown.sql'
  )
  assert.ok(fs.existsSync(migrationPath), 'Migration 003 must exist')

  const sql = fs.readFileSync(migrationPath, 'utf8')

  // 1. Transaction wrapping
  const trimmed = sql.trim()
  assert.ok(trimmed.startsWith('BEGIN;'), 'Migration 003 must start with BEGIN; for atomic transaction safety')
  assert.ok(trimmed.endsWith('COMMIT;'), 'Migration 003 must end with COMMIT; for atomic transaction safety')

  // 2. Strict policy idempotency: every CREATE POLICY must be preceded by DROP POLICY IF EXISTS
  const createPolicyRegex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+public\.([a-zA-Z0-9_]+)/gi
  let match
  let policyCount = 0

  while ((match = createPolicyRegex.exec(sql)) !== null) {
    policyCount++
    const policyName = match[1]
    const tableName = match[2]
    const expectedDrop = `DROP POLICY IF EXISTS "${policyName}" ON public.${tableName};`

    assert.ok(
      sql.includes(expectedDrop),
      `Every CREATE POLICY must have a preceding idempotent drop statement: '${expectedDrop}'`
    )

    // Ensure DROP appears before CREATE in the SQL file
    const dropIndex = sql.indexOf(expectedDrop)
    const createIndex = match.index
    assert.ok(
      dropIndex < createIndex,
      `DROP statement for '${policyName}' must appear before its CREATE statement`
    )
  }

  assert.ok(policyCount >= 4, `Expected at least 4 policies to be protected, found ${policyCount}`)

  // 3. RLS enablement check
  const requiredRlsTables = ['projects', 'sprints', 'tasks', 'project_notes']
  for (const table of requiredRlsTables) {
    assert.match(
      sql,
      new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i'),
      `Table public.${table} must have ENABLE ROW LEVEL SECURITY`
    )
  }

  // 4. Revocation of anon privileges
  assert.match(
    sql,
    /REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;/i,
    'Migration 003 must explicitly REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;'
  )
})

test('Test 3: GitHub API route security audit (assertGitHubRepoAllowed enforcement)', () => {
  const githubApiDir = path.join(projectRoot, 'server/api/github')
  assert.ok(fs.existsSync(githubApiDir), 'server/api/github directory must exist')

  const files = fs.readdirSync(githubApiDir).filter((f) => f.endsWith('.ts'))
  assert.equal(files.length, 13, 'There must be exactly 13 .ts route handlers in server/api/github')

  // repos.get.ts is the global endpoint listing authenticated user's repos and does NOT accept a target repo parameter
  const globalEndpoints = ['repos.get.ts']

  const repoTargetingEndpoints = files.filter((f) => !globalEndpoints.includes(f))

  for (const filename of repoTargetingEndpoints) {
    const filePath = path.join(githubApiDir, filename)
    const code = fs.readFileSync(filePath, 'utf8')

    // 1. Must import assertGitHubRepoAllowed
    assert.match(
      code,
      /import\s+\{[^}]*assertGitHubRepoAllowed[^}]*\}\s+from\s+['"][^'"]*github-allowlist['"]/,
      `Route handler '${filename}' must import assertGitHubRepoAllowed from github-allowlist`
    )

    // 2. Must call assertGitHubRepoAllowed
    assert.match(
      code,
      /await\s+assertGitHubRepoAllowed\(/,
      `Route handler '${filename}' must invoke await assertGitHubRepoAllowed(...) before interacting with GitHub API`
    )
  }

  // Verify repos.get.ts does not accept user repo parameter
  const reposCode = fs.readFileSync(path.join(githubApiDir, 'repos.get.ts'), 'utf8')
  assert.ok(
    !reposCode.includes('getQuery(event).repo') && !reposCode.includes('readBody(event)'),
    'repos.get.ts must remain a pure user-scoped repository list without dynamic repo targeting'
  )
})

test('Test 4: Telemetry endpoint credentials sanitization check', () => {
  const telemetryPath = path.join(projectRoot, 'server/api/telemetry.get.ts')
  assert.ok(fs.existsSync(telemetryPath), 'server/api/telemetry.get.ts must exist')

  const code = fs.readFileSync(telemetryPath, 'utf8')

  // Hardcoded supabase hostname check
  assert.ok(
    !code.includes('iklvthppfigprjhqmrlo.supabase.co'),
    'telemetry.get.ts must NEVER contain hardcoded Supabase project reference iklvthppfigprjhqmrlo.supabase.co'
  )

  // Supabase URL sanitization / masking logic check
  assert.match(
    code,
    /replace\(\/\^\[\^\.\]\+\\\.\/,\s*['"]\*\*\*\.['"]\)/,
    'telemetry.get.ts must mask the Supabase project subdomain before exposing in telemetry response'
  )
})
