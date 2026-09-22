import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import type { GitHubPackageItem, GitHubPackageSummary, GitHubPackageType } from '~/types'

const fetchCachedPackages = defineCachedFunction(
  async (token: string, repo?: string): Promise<GitHubPackageSummary> => {
    if (!token) {
      return {
        hasScope: false,
        totalPackages: 0,
        packages: [],
        message: 'GitHub token required'
      }
    }

    const client = createGitHubClient(token)

    const isForbidden = (err: any) => {
      const status = err?.statusCode || err?.status || err?.response?.status
      return status === 403
    }

    let rawContainers: any[] = []
    let rawNpms: any[] = []

    try {
      const [containers, npms] = await Promise.all([
        client.fetch<any[]>('/user/packages?package_type=container').catch((err) => {
          if (isForbidden(err)) throw err
          const status = err?.statusCode || err?.status || err?.response?.status
          if (status === 401) throwApiError(401, 'GITHUB_AUTH_FAILED', 'Invalid GitHub token')
          return []
        }),
        client.fetch<any[]>('/user/packages?package_type=npm').catch((err) => {
          if (isForbidden(err)) throw err
          const status = err?.statusCode || err?.status || err?.response?.status
          if (status === 401) throwApiError(401, 'GITHUB_AUTH_FAILED', 'Invalid GitHub token')
          return []
        })
      ])

      rawContainers = Array.isArray(containers) ? containers : []
      rawNpms = Array.isArray(npms) ? npms : []
    } catch (err: any) {
      if (isForbidden(err)) {
        return {
          hasScope: false,
          totalPackages: 0,
          packages: [],
          message: 'The read:packages scope is required in your GitHub PAT to view packages.'
        }
      }
      const status = err?.statusCode || err?.status || err?.response?.status
      if (status === 401) {
        throwApiError(401, 'GITHUB_AUTH_FAILED', 'Invalid GitHub token')
      }
      throw err
    }

    const combined = [...rawContainers, ...rawNpms]
    const seenIds = new Set<number>()
    const deduplicated = combined.filter((p: any) => {
      if (!p || typeof p.id === 'undefined') return false
      if (seenIds.has(p.id)) return false
      seenIds.add(p.id)
      return true
    })

    const mapped: GitHubPackageItem[] = deduplicated.map((p: any): GitHubPackageItem => ({
      id: p.id,
      name: p.name || '',
      packageType: (p.package_type || 'container') as GitHubPackageType,
      owner: p.owner?.login || '',
      versionCount: typeof p.version_count === 'number' ? p.version_count : (p.version_count || 1),
      visibility: p.visibility === 'private' ? 'private' : 'public',
      htmlUrl: p.html_url || '',
      createdAt: p.created_at || '',
      updatedAt: p.updated_at || '',
      repositoryName: p.repository?.name || p.repository?.full_name || undefined
    }))

    let packages = mapped

    if (repo && repo.trim()) {
      const target = repo.trim().toLowerCase()
      const targetBase = target.includes('/') ? target.split('/')[1] : target

      packages = packages.filter((pkg) => {
        if (!pkg.repositoryName) return false
        const repoName = pkg.repositoryName.toLowerCase()
        const repoNameBase = repoName.includes('/') ? repoName.split('/')[1] : repoName
        return (
          repoName === target ||
          repoName === targetBase ||
          repoNameBase === target ||
          repoNameBase === targetBase
        )
      })
    }

    packages.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())

    return {
      hasScope: true,
      totalPackages: packages.length,
      packages
    }
  },
  {
    maxAge: 60,
    name: 'github-packages',
    getKey: (token: string, repo?: string) => `${token ? token.slice(-8) : 'anon'}:${repo || 'all'}`
  }
)

export default withApiHandler(async (event): Promise<GitHubPackageSummary> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : undefined

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  if (!token) {
    return {
      hasScope: false,
      totalPackages: 0,
      packages: [],
      message: 'GitHub token required'
    }
  }

  return await fetchCachedPackages(token, repoParam)
})
