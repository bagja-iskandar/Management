import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import type {
  GitHubDeploymentSummary,
  GitHubDeploymentItem,
  GitHubDeploymentState,
  GitHubCommitCheck
} from '~/types'

const fetchCachedDeployments = defineCachedFunction(
  async (token: string, repo: string, limit: number): Promise<GitHubDeploymentSummary> => {
    if (!token) {
      return {
        latestDeployment: null,
        commitStatus: {
          state: 'neutral',
          totalCount: 0,
          checks: []
        },
        deployments: []
      }
    }

    const client = createGitHubClient(token)
    let rawDeployments: any[] = []
    let statusData: any = null

    await Promise.all([
      // a. Ambil daftar deployment
      (async () => {
        try {
          const res = await client.fetch<any[]>(`/repos/${repo}/deployments?per_page=${limit}`)
          if (Array.isArray(res)) {
            rawDeployments = res
          }
        } catch {
          rawDeployments = []
        }
      })(),

      // c. Ambil commit status checks untuk default branch (master atau main)
      (async () => {
        try {
          statusData = await client.fetch<any>(`/repos/${repo}/commits/master/status`)
        } catch {
          try {
            statusData = await client.fetch<any>(`/repos/${repo}/commits/main/status`)
          } catch {
            statusData = null
          }
        }
      })()
    ])

    // b. Untuk setiap deployment (maksimal 3 teratas secara paralel), ambil status terbarunya
    const deployments: GitHubDeploymentItem[] = await Promise.all(
      rawDeployments.map(async (d: any, index: number) => {
        let latestStatus: any = null
        if (index < 3) {
          try {
            const statuses = await client.fetch<any[]>(`/repos/${repo}/deployments/${d.id}/statuses?per_page=1`)
            if (Array.isArray(statuses) && statuses.length > 0) {
              latestStatus = statuses[0]
            }
          } catch {
            latestStatus = null
          }
        }

        const sha = d.sha || ''
        const rawState = latestStatus?.state || 'pending'
        const validStates: GitHubDeploymentState[] = [
          'success',
          'failure',
          'in_progress',
          'queued',
          'pending',
          'error',
          'inactive'
        ]
        const state: GitHubDeploymentState = validStates.includes(rawState) ? rawState : 'pending'

        return {
          id: d.id,
          environment: d.environment || 'production',
          state,
          commitSha: sha,
          shortSha: sha.slice(0, 7),
          ref: d.ref || '',
          description: latestStatus?.description || d.description || undefined,
          environmentUrl: latestStatus?.environment_url || undefined,
          logUrl: latestStatus?.log_url || undefined,
          createdAt: d.created_at || '',
          updatedAt: latestStatus?.updated_at || d.updated_at || d.created_at || ''
        }
      })
    )

    const commitChecks: GitHubCommitCheck[] = (statusData?.statuses || []).map((s: any) => ({
      id: s.id,
      context: s.context || '',
      state: s.state || 'pending',
      description: s.description || undefined,
      targetUrl: s.target_url || undefined,
      createdAt: s.created_at || ''
    }))

    const rawCommitState = statusData?.state
    const commitState: 'success' | 'failure' | 'pending' | 'neutral' =
      rawCommitState === 'success' || rawCommitState === 'failure' || rawCommitState === 'pending'
        ? rawCommitState
        : 'neutral'

    return {
      latestDeployment: deployments[0] || null,
      commitStatus: {
        state: commitState,
        totalCount: statusData?.total_count || 0,
        checks: commitChecks
      },
      deployments
    }
  },
  {
    maxAge: 30,
    name: 'github-deployments',
    getKey: (token: string, repo: string, limit: number) => `${token ? 'auth' : 'anon'}:${repo}:${limit}`
  }
)

export default withApiHandler(async (event): Promise<GitHubDeploymentSummary> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''

  if (!repoParam) {
    throwApiError(400, 'INVALID_REPO', 'Query parameter "repo" is required (format: owner/repo)')
  }

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  if (!token) {
    return {
      latestDeployment: null,
      commitStatus: {
        state: 'neutral',
        totalCount: 0,
        checks: []
      },
      deployments: []
    }
  }

  let fullRepo = repoParam
  if (!fullRepo.includes('/')) {
    const defaultOwner = config.githubUsername || 'bagja-iskandar'
    fullRepo = `${defaultOwner}/${fullRepo}`
  }

  const limitParam = query.limit ? Number(query.limit) : 5
  const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 5 : limitParam))

  return await fetchCachedDeployments(token, fullRepo, limit)
})
