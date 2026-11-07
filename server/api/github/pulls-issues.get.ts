import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import { assertGitHubRepoAllowed } from '../../utils/github-allowlist'
import type { GitHubIssueItem, GitHubPullRequest, GitHubRepoActivitySummary } from '~/types'

const fetchCachedPullsAndIssues = defineCachedFunction(
  async (token: string, repo: string, limit: number, _refresh?: boolean): Promise<GitHubRepoActivitySummary> => {
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

    // SYS-12: Fetch pulls and issues with a paging buffer (100 for issues) before filtering
    // and rethrow fatal errors so Nitro does NOT cache false empty results.
    const [rawPulls, rawIssues] = await Promise.all([
      client.fetch<any[]>(
        `/repos/${repo}/pulls?state=all&per_page=${Math.max(limit, 30)}&sort=updated&direction=desc`
      ),
      client.fetch<any[]>(
        `/repos/${repo}/issues?state=all&per_page=100&sort=updated&direction=desc`
      )
    ])

    const allPullRequests: any[] = Array.isArray(rawPulls) ? rawPulls : []
    const allFilteredIssues: any[] = (Array.isArray(rawIssues) ? rawIssues : [])
      .filter((item: any) => !item.pull_request)

    const pullRequests: GitHubPullRequest[] = allPullRequests
      .slice(0, limit)
      .map((p: any): GitHubPullRequest => {
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

    const issues: GitHubIssueItem[] = allFilteredIssues
      .slice(0, limit)
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

    const openPrCount = allPullRequests.filter((p: any) => p.state === 'open' && !p.merged_at).length
    const closedPrCount = allPullRequests.filter((p: any) => p.state === 'closed' || p.merged_at).length
    const openIssueCount = allFilteredIssues.filter((i: any) => i.state === 'open').length
    const closedIssueCount = allFilteredIssues.filter((i: any) => i.state === 'closed').length

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
      `${token ? 'auth' : 'anon'}:${repo}:${limit}`,
    shouldBypassCache: (_token, _repo, _limit, refresh) => Boolean(refresh)
  }
)

export default withApiHandler(async (event): Promise<GitHubRepoActivitySummary> => {
  const query = getQuery(event)
  const refresh = query.refresh === 'true'
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''

  const fullRepo = await assertGitHubRepoAllowed(repoParam, event)

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

  const limitParam = query.limit ? Number(query.limit) : 10
  const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 10 : limitParam))

  return await fetchCachedPullsAndIssues(token, fullRepo, limit, refresh)
})
