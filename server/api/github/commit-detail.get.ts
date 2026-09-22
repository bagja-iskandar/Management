import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import type { GitHubCommitDetail, GitHubCommitFile } from '~/types'

const fetchCachedCommitDetail = defineCachedFunction(
  async (token: string, repo: string, sha: string): Promise<GitHubCommitDetail | null> => {
    const client = createGitHubClient(token)
    try {
      const raw = await client.fetch<any>(`/repos/${repo}/commits/${sha}`)
      if (!raw) return null

      const files: GitHubCommitFile[] = (raw.files || []).map((f: any) => ({
        filename: f.filename || '',
        status: f.status || 'modified',
        additions: f.additions || 0,
        deletions: f.deletions || 0,
        changes: f.changes || 0,
        patch: f.patch || undefined
      }))

      const message = (raw.commit?.message || '').split('\n')[0]

      return {
        sha: raw.sha || sha,
        shortSha: (raw.sha || sha).slice(0, 7),
        message,
        authorName: raw.commit?.author?.name || raw.author?.login || 'Unknown',
        date: raw.commit?.author?.date || '',
        htmlUrl: raw.html_url || '',
        stats: raw.stats
          ? {
              total: raw.stats.total || 0,
              additions: raw.stats.additions || 0,
              deletions: raw.stats.deletions || 0
            }
          : undefined,
        files
      }
    } catch (err: any) {
      if (!token) {
        return null
      }
      throw err
    }
  },
  {
    maxAge: 300,
    name: 'github-commit-detail',
    getKey: (token: string, repo: string, sha: string) => `${token ? 'auth' : 'anon'}:${repo}:${sha}`
  }
)

export default withApiHandler(async (event): Promise<GitHubCommitDetail | null> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''
  const shaParam = typeof query.sha === 'string' ? query.sha.trim() : ''

  if (!repoParam) {
    throwApiError(400, 'INVALID_REPO', 'Query parameter "repo" is required (format: owner/repo)')
  }
  if (!shaParam) {
    throwApiError(400, 'INVALID_SHA', 'Query parameter "sha" is required')
  }

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  let fullRepo = repoParam
  if (!fullRepo.includes('/')) {
    const defaultOwner = config.githubUsername || 'bagja-iskandar'
    fullRepo = `${defaultOwner}/${fullRepo}`
  }

  return await fetchCachedCommitDetail(token, fullRepo, shaParam)
})
