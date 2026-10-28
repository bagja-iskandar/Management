import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import { assertGitHubRepoAllowed } from '../../utils/github-allowlist'
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

  const fullRepo = await assertGitHubRepoAllowed(repoParam, event)

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  return await fetchCachedBranches(token, fullRepo)
})
