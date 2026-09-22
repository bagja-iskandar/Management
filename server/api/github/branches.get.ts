import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import type { GitHubBranch } from '~/types'

const fetchCachedBranches = defineCachedFunction(
  async (token: string, repo: string): Promise<GitHubBranch[]> => {
    const client = createGitHubClient(token)
    try {
      const rawBranches = await client.fetch<any[]>(`/repos/${repo}/branches`)

      return (rawBranches || []).map((b: any): GitHubBranch => ({
        name: b.name || '',
        commitSha: b.commit?.sha || '',
        protected: Boolean(b.protected)
      }))
    } catch (err: any) {
      if (!token) {
        return []
      }
      throw err
    }
  },
  {
    maxAge: 300,
    name: 'github-branches',
    getKey: (token: string, repo: string) => `${token ? 'auth' : 'anon'}:${repo}`
  }
)

export default withApiHandler(async (event): Promise<GitHubBranch[]> => {
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

  return await fetchCachedBranches(token, fullRepo)
})
