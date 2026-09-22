import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import type { GitHubCommitItem } from '~/types'

const fetchCachedCommits = defineCachedFunction(
  async (token: string, repo: string, limit: number): Promise<GitHubCommitItem[]> => {
    const client = createGitHubClient(token)
    try {
      const rawCommits = await client.fetch<any[]>(`/repos/${repo}/commits?per_page=${limit}`)

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
    getKey: (token: string, repo: string, limit: number) => `${token ? 'auth' : 'anon'}:${repo}:${limit}`
  }
)

export default withApiHandler(async (event): Promise<GitHubCommitItem[]> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''

  if (!repoParam) {
    throwApiError(400, 'INVALID_REPO', 'Query parameter "repo" is required (format: owner/repo)')
  }

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  let fullRepo = repoParam
  if (!fullRepo.includes('/')) {
    const defaultOwner = config.githubUsername || 'bagja-iskandar'
    fullRepo = `${defaultOwner}/${fullRepo}`
  }

  const limitParam = query.limit ? Number(query.limit) : 20
  const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 20 : limitParam))

  return await fetchCachedCommits(token, fullRepo, limit)
})
