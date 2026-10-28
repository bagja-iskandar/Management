import test from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'

// Pure ESM Test Suite: GitHub Repository Allowlist & Path Traversal Defense (Phase 0)

const jiti = createJiti(import.meta.url)

// Initialize mock global runtime and h3 error constructor
const { createError } = await import('h3')
globalThis.createError = createError

globalThis.useRuntimeConfig = () => ({
  githubUsername: 'bagja-iskandar'
})

// Configure project repository mock
const repos = jiti('../../server/repositories/index.ts')
repos.getProjectRepo().findAll = async () => [
  { id: 'proj-1', title: 'Nexura Management', slug: 'management', githubRepo: 'bagja-iskandar/Management' },
  { id: 'proj-2', title: 'Client Portal', slug: 'client-portal', githubRepo: 'partner-org/client-portal' },
  { id: 'proj-3', title: 'Internal Tooling', slug: 'internal-tooling', githubRepo: 'custom-org/internal-tool.git' }
]

const {
  normalizeGitHubRepo,
  isGitHubRepoAllowed,
  assertGitHubRepoAllowed
} = jiti('../../server/utils/github-allowlist.ts')

test('normalizeGitHubRepo: standardizes GitHub HTTPS, SSH, and shorthand URLs', () => {
  // Full HTTPS with .git
  assert.equal(
    normalizeGitHubRepo('https://github.com/bagja-iskandar/Management.git'),
    'bagja-iskandar/Management'
  )

  // HTTP without .git
  assert.equal(
    normalizeGitHubRepo('http://github.com/bagja-iskandar/Management'),
    'bagja-iskandar/Management'
  )

  // SSH clone format
  assert.equal(
    normalizeGitHubRepo('git@github.com:bagja-iskandar/Management.git'),
    'bagja-iskandar/Management'
  )

  // Trailing slashes
  assert.equal(
    normalizeGitHubRepo('https://github.com/bagja-iskandar/Management/'),
    'bagja-iskandar/Management'
  )

  // Query parameters and fragment hashes
  assert.equal(
    normalizeGitHubRepo('https://github.com/bagja-iskandar/Management?branch=main#readme'),
    'bagja-iskandar/Management'
  )
})

test('normalizeGitHubRepo: prepends default owner when only repo name is supplied', () => {
  assert.equal(normalizeGitHubRepo('Management'), 'bagja-iskandar/Management')
  assert.equal(normalizeGitHubRepo('Management.git'), 'bagja-iskandar/Management')
  assert.equal(normalizeGitHubRepo('docs-portal', 'custom-owner'), 'custom-owner/docs-portal')
})

test('normalizeGitHubRepo: rejects directory traversal, escape characters, and invalid inputs', () => {
  // Directory traversal
  assert.equal(normalizeGitHubRepo('../Management'), '')
  assert.equal(normalizeGitHubRepo('bagja-iskandar/../../etc/passwd'), '')
  assert.equal(normalizeGitHubRepo('bagja-iskandar/..'), '')

  // Backslash escapes
  assert.equal(normalizeGitHubRepo('bagja-iskandar\\Management'), '')
  assert.equal(normalizeGitHubRepo('..\\Management'), '')

  // URL-encoded traversal payloads
  assert.equal(normalizeGitHubRepo('bagja-iskandar/%2e%2e/Management'), '')

  // More than 2 path segments
  assert.equal(normalizeGitHubRepo('bagja-iskandar/Management/subfolder'), '')

  // Empty or invalid inputs
  assert.equal(normalizeGitHubRepo(''), '')
  assert.equal(normalizeGitHubRepo('   '), '')
  assert.equal(normalizeGitHubRepo(null), '')
  assert.equal(normalizeGitHubRepo(undefined), '')
  assert.equal(normalizeGitHubRepo(12345), '')
})

test('isGitHubRepoAllowed: permits default owner repositories and registered projects', async () => {
  // 1. Matches default owner (configured as bagja-iskandar)
  assert.equal(await isGitHubRepoAllowed('bagja-iskandar/Management'), true)
  assert.equal(await isGitHubRepoAllowed('Management'), true)
  assert.equal(await isGitHubRepoAllowed('bagja-iskandar/any-owned-repo'), true)

  // Case-insensitivity check
  assert.equal(await isGitHubRepoAllowed('BAGJA-ISKANDAR/MANAGEMENT'), true)

  // 2. Matches registered project in database with distinct third-party owner
  assert.equal(await isGitHubRepoAllowed('partner-org/client-portal'), true)
  assert.equal(await isGitHubRepoAllowed('custom-org/internal-tool'), true)
})

test('isGitHubRepoAllowed: Anti-Loose-Match Attack Test blocks spoofed repo names', async () => {
  // CRITICAL SECURITY REQUIREMENT:
  // An attacker creating `attacker/Management` MUST NOT be authorized simply because
  // the repository base name matches `Management`!
  const attackerResult = await isGitHubRepoAllowed('attacker/Management')
  assert.equal(attackerResult, false, 'attacker/Management MUST be rejected')

  // Attacker with prefix/suffix on owner name
  const prefixAttacker = await isGitHubRepoAllowed('bagja-iskandar-attacker/Management')
  assert.equal(prefixAttacker, false, 'bagja-iskandar-attacker/Management MUST be rejected')

  // Attacker targeting partner org repo
  const partnerAttacker = await isGitHubRepoAllowed('attacker/client-portal')
  assert.equal(partnerAttacker, false, 'attacker/client-portal MUST be rejected')

  // Unregistered third-party repository
  const unregistered = await isGitHubRepoAllowed('random-user/random-repo')
  assert.equal(unregistered, false, 'random-user/random-repo MUST be rejected')
})

test('assertGitHubRepoAllowed: succeeds on valid allowed repo and returns normalized string', async () => {
  const normalized1 = await assertGitHubRepoAllowed('https://github.com/bagja-iskandar/Management.git')
  assert.equal(normalized1, 'bagja-iskandar/Management')

  const normalized2 = await assertGitHubRepoAllowed('Management')
  assert.equal(normalized2, 'bagja-iskandar/Management')

  const normalized3 = await assertGitHubRepoAllowed('partner-org/client-portal')
  assert.equal(normalized3, 'partner-org/client-portal')
})

test('assertGitHubRepoAllowed: throws 400 Bad Request on missing or malformed inputs', async () => {
  // Empty string
  await assert.rejects(
    async () => {
      await assertGitHubRepoAllowed('')
    },
    (err) => {
      assert.equal(err.statusCode, 400)
      assert.match(err.statusMessage, /repository parameter is required/i)
      return true
    }
  )

  // Traversal attack string
  await assert.rejects(
    async () => {
      await assertGitHubRepoAllowed('../secret/repo')
    },
    (err) => {
      assert.equal(err.statusCode, 400)
      assert.match(err.statusMessage, /invalid repository identifier/i)
      return true
    }
  )
})

test('assertGitHubRepoAllowed: throws 403 Forbidden on unallowed or spoofed repo', async () => {
  await assert.rejects(
    async () => {
      await assertGitHubRepoAllowed('attacker/Management')
    },
    (err) => {
      assert.equal(err.statusCode, 403)
      assert.match(err.statusMessage, /not allowed/i)
      return true
    }
  )

  await assert.rejects(
    async () => {
      await assertGitHubRepoAllowed('evil-org/arbitrary-repo')
    },
    (err) => {
      assert.equal(err.statusCode, 403)
      assert.match(err.statusMessage, /not allowed/i)
      return true
    }
  )
})
