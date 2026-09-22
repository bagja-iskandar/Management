import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import type { GitHubRepoSummary } from '~/types'

const fetchCachedRepos = defineCachedFunction(
  async (token: string, username: string): Promise<GitHubRepoSummary[]> => {
    const client = createGitHubClient(token)
    try {
      const endpoint = token
        ? '/user/repos?per_page=100&sort=pushed&direction=desc'
        : `/users/${username}/repos?per_page=100&sort=pushed&direction=desc`

      const rawRepos = await client.fetch<any[]>(endpoint)

      return (rawRepos || [])
        .map((r: any): GitHubRepoSummary => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          private: Boolean(r.private),
          htmlUrl: r.html_url,
          description: r.description ?? undefined,
          language: r.language ?? undefined,
          defaultBranch: r.default_branch || 'main',
          pushedAt: r.pushed_at || '',
          stargazersCount: r.stargazers_count || 0
        }))
        .sort((a, b) => new Date(b.pushedAt || 0).getTime() - new Date(a.pushedAt || 0).getTime())
    } catch {
      return []
    }
  },
  {
    maxAge: 300,
    name: 'github-repos',
    getKey: (token: string, username: string) => `${token ? token.slice(-8) : 'anon'}:${username}`
  }
)

export default withApiHandler(async (event): Promise<GitHubRepoSummary[]> => {
  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()
  const username = (config.githubUsername || 'bagja-iskandar').trim()

  if (!token && !username) {
    return []
  }

  return await fetchCachedRepos(token, username)
})
