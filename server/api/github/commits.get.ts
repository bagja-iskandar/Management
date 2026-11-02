import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import { assertGitHubRepoAllowed } from '../../utils/github-allowlist'
import type { GitHubCommitItem } from '~/types'

const fetchCachedCommits = defineCachedFunction(
  async (token: string, repo: string, limit: number, branch?: string): Promise<GitHubCommitItem[]> => {
    const client = createGitHubClient(token)
    try {
      const branchQuery = branch ? `&sha=${encodeURIComponent(branch)}` : ''
      const rawCommits = await client.fetch<any[]>(`/repos/${repo}/commits?per_page=${limit}${branchQuery}`)

      return (rawCommits || []).map((c: any): GitHubCommitItem => {
        const message = (c.commit?.message || '').split('\n')[0]
        return {
          sha: c.sha || '',
          shortSha: c.sha ? c.sha.slice(0, 7) : '',
          message,
          authorName: c.commit?.author?.name || c.author?.login || 'Unknown',
          date: c.commit?.author?.date || '',
          htmlUrl: c.html_url || '',
          repoName: repo
        }
      })
    } catch (err: any) {
      if (!token) {
        return []
      }
      throw err
    }
  },
  {
    maxAge: 300,
    name: 'github-commits',
    getKey: (token: string, repo: string, limit: number, branch?: string) =>
      `${token ? 'auth' : 'anon'}:${repo}:${limit}:${branch || 'default'}`
  }
)

export default withApiHandler(async (event): Promise<GitHubCommitItem[]> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''
  const branchParam = typeof query.branch === 'string' && query.branch.trim() !== '' ? query.branch.trim() : undefined

  const fullRepo = await assertGitHubRepoAllowed(repoParam, event)

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  const limitParam = query.limit ? Number(query.limit) : 20
  const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 20 : limitParam))

  return await fetchCachedCommits(token, fullRepo, limit, branchParam)
})
