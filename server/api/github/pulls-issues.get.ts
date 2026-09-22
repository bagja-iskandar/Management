import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import type { GitHubIssueItem, GitHubPullRequest, GitHubRepoActivitySummary } from '~/types'

const fetchCachedPullsAndIssues = defineCachedFunction(
  async (token: string, repo: string, limit: number): Promise<GitHubRepoActivitySummary> => {
    if (!token) {
      return {
        openPrCount: 0,
        closedPrCount: 0,
        openIssueCount: 0,
        closedIssueCount: 0,
        pullRequests: [],
        issues: []
      }
    }

    const client = createGitHubClient(token)
    let rawPulls: any[] = []
    let rawIssues: any[] = []

    await Promise.all([
      (async () => {
        try {
          const res = await client.fetch<any[]>(
            `/repos/${repo}/pulls?state=all&per_page=${limit}&sort=updated&direction=desc`
          )
          if (Array.isArray(res)) {
            rawPulls = res
          }
        } catch {
          rawPulls = []
        }
      })(),
      (async () => {
        try {
          const res = await client.fetch<any[]>(
            `/repos/${repo}/issues?state=all&per_page=${limit}&sort=updated&direction=desc`
          )
          if (Array.isArray(res)) {
            rawIssues = res
          }
        } catch {
          rawIssues = []
        }
      })()
    ])

    const pullRequests: GitHubPullRequest[] = rawPulls.map((p: any): GitHubPullRequest => {
      const state: 'open' | 'closed' | 'merged' = p.merged_at
        ? 'merged'
        : p.state === 'closed'
          ? 'closed'
          : 'open'

      return {
        id: p.id,
        number: p.number,
        title: p.title || '',
        state,
        draft: Boolean(p.draft),
        htmlUrl: p.html_url || '',
        authorName: p.user?.login || 'unknown',
        authorAvatar: p.user?.avatar_url,
        headBranch: p.head?.ref || '',
        baseBranch: p.base?.ref || '',
        headSha: p.head?.sha ? p.head.sha.slice(0, 7) : '',
        createdAt: p.created_at || '',
        updatedAt: p.updated_at || '',
        mergedAt: p.merged_at || undefined,
        closedAt: p.closed_at || undefined,
        commentsCount: Number(p.comments || 0)
      }
    })

    const issues: GitHubIssueItem[] = rawIssues
      .filter((item: any) => !item.pull_request)
      .map((item: any): GitHubIssueItem => {
        const labels = (item.labels || []).map((l: any) => ({
          name: typeof l === 'string' ? l : l.name || '',
          color: typeof l === 'string' ? '756F68' : l.color || '756F68'
        }))

        return {
          id: item.id,
          number: item.number,
          title: item.title || '',
          state: item.state === 'closed' ? 'closed' : 'open',
          htmlUrl: item.html_url || '',
          authorName: item.user?.login || 'unknown',
          authorAvatar: item.user?.avatar_url,
          labels,
          createdAt: item.created_at || '',
          updatedAt: item.updated_at || '',
          closedAt: item.closed_at || undefined,
          commentsCount: Number(item.comments || 0)
        }
      })

    const openPrCount = pullRequests.filter((p) => p.state === 'open').length
    const closedPrCount = pullRequests.filter((p) => p.state === 'closed' || p.state === 'merged').length
    const openIssueCount = issues.filter((i) => i.state === 'open').length
    const closedIssueCount = issues.filter((i) => i.state === 'closed').length

    return {
      openPrCount,
      closedPrCount,
      openIssueCount,
      closedIssueCount,
      pullRequests,
      issues
    }
  },
  {
    maxAge: 30,
    name: 'github-pulls-issues',
    getKey: (token: string, repo: string, limit: number) =>
      `${token ? 'auth' : 'anon'}:${repo}:${limit}`
  }
)

export default withApiHandler(async (event): Promise<GitHubRepoActivitySummary> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''

  if (!repoParam) {
    throwApiError(400, 'INVALID_REPO', 'Query parameter "repo" is required (format: owner/repo)')
  }

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  if (!token) {
    return {
      openPrCount: 0,
      closedPrCount: 0,
      openIssueCount: 0,
      closedIssueCount: 0,
      pullRequests: [],
      issues: []
    }
  }

  let fullRepo = repoParam
  if (!fullRepo.includes('/')) {
    const defaultOwner = config.githubUsername || 'bagja-iskandar'
    fullRepo = `${defaultOwner}/${fullRepo}`
  }

  const limitParam = query.limit ? Number(query.limit) : 10
  const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 10 : limitParam))

  return await fetchCachedPullsAndIssues(token, fullRepo, limit)
})
