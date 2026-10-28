import type { H3Event } from 'h3'
import { throwApiError } from './errors'
import { projectRepository } from '../repositories'

/**
 * Normalizes a GitHub repository parameter into standard `owner/repo` format.
 * Strips URLs, protocols, `.git` extensions, and prepends default owner if omitted.
 * Defends against path traversal, control characters, URL tampering, and malformed segments.
 */
export function normalizeGitHubRepo(repo: string, defaultOwner: string = 'bagja-iskandar'): string {
  if (!repo || typeof repo !== 'string') {
    return ''
  }

  const fallbackOwner = (defaultOwner || 'bagja-iskandar').trim()

  let cleaned = repo.trim()

  // Strip protocol and domain if present (http, https, git, ssh)
  cleaned = cleaned.replace(/^(?:https?|git):\/\/github\.com\//i, '')
  cleaned = cleaned.replace(/^git@github\.com:/i, '')

  // Strip query parameters and hash fragments if present
  cleaned = cleaned.split('?')[0]!.split('#')[0]!

  // Strip trailing .git
  cleaned = cleaned.replace(/\.git$/i, '')

  // Strip leading and trailing slashes
  cleaned = cleaned.replace(/^\/+|\/+$/g, '')

  if (!cleaned) {
    return ''
  }

  // Segment by slash and inspect each part
  const segments = cleaned.split('/').map((s) => s.trim()).filter(Boolean)

  // Defense against path traversal or malicious relative segments
  if (segments.some((seg) => seg === '.' || seg === '..' || seg.includes('\\') || seg.includes('%'))) {
    return ''
  }

  // GitHub naming conventions: alphanumeric, hyphen, period, underscore
  const GITHUB_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/

  if (segments.length === 1) {
    const repoName = segments[0]!
    if (!GITHUB_NAME_REGEX.test(repoName) || !GITHUB_NAME_REGEX.test(fallbackOwner)) {
      return ''
    }
    return `${fallbackOwner}/${repoName}`
  }

  if (segments.length === 2) {
    const [owner, repoName] = segments
    if (!owner || !repoName || !GITHUB_NAME_REGEX.test(owner) || !GITHUB_NAME_REGEX.test(repoName)) {
      return ''
    }
    return `${owner}/${repoName}`
  }

  // More than 2 segments (e.g. owner/repo/subpath or traversal payload) is invalid
  return ''
}

/**
 * Verifies whether a GitHub repository is allowed under the strict allowlist policy.
 * Permitted repositories:
 * 1. Repositories owned by the configured user (config.githubUsername || 'bagja-iskandar').
 * 2. Repositories whose exact normalized owner/repo matches a registered project in the database.
 */
export async function isGitHubRepoAllowed(repoParam: string, event?: H3Event): Promise<boolean> {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  const defaultOwner = (config.githubUsername || 'bagja-iskandar').trim()
  const normalized = normalizeGitHubRepo(repoParam, defaultOwner)

  if (!normalized) {
    return false
  }

  const [owner] = normalized.split('/')
  if (!owner) {
    return false
  }

  // Condition 1: Repository belongs to the configured default owner
  if (owner.toLowerCase() === defaultOwner.toLowerCase()) {
    return true
  }

  // Condition 2: Repository matches an exact registered project in the database
  try {
    const projects = await projectRepository.findAll()
    const isRegistered = projects.some((project) => {
      if (!project.githubRepo) return false
      const projectNormalized = normalizeGitHubRepo(project.githubRepo, defaultOwner)
      return Boolean(projectNormalized && projectNormalized.toLowerCase() === normalized.toLowerCase())
    })

    if (isRegistered) {
      return true
    }
  } catch (error) {
    console.error('[github-allowlist] Error verifying project allowlist:', error)
  }

  return false
}

/**
 * Validates repository against allowlist. Returns normalized full repository string (owner/repo).
 * Throws 400 BAD_REQUEST if repository parameter is missing, empty, or malformed.
 * Throws 403 FORBIDDEN if the repository is not allowed under the allowlist policy.
 */
export async function assertGitHubRepoAllowed(repoParam: string, event?: H3Event): Promise<string> {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  const defaultOwner = (config.githubUsername || 'bagja-iskandar').trim()

  if (!repoParam || !repoParam.trim()) {
    throwApiError(400, 'BAD_REQUEST', 'Repository parameter is required')
  }

  const normalized = normalizeGitHubRepo(repoParam, defaultOwner)
  if (!normalized) {
    throwApiError(400, 'BAD_REQUEST', `Invalid repository identifier: '${repoParam}'`)
  }

  const allowed = await isGitHubRepoAllowed(repoParam, event)

  if (!allowed) {
    throwApiError(
      403,
      'FORBIDDEN',
      `Repository '${normalized}' is not allowed. Only repositories owned by '${defaultOwner}' or registered in projects are permitted.`
    )
  }

  return normalized
}
