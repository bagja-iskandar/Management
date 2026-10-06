import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { projectRepository } from '../../repositories'
import type { GitHubCommitItem, Project } from '~/types'

const fetchCachedGlobalCommits = defineCachedFunction(
  async (token: string, repos: string[], limit: number): Promise<GitHubCommitItem[]> => {
    const client = createGitHubClient(token)

    const results = await Promise.allSettled(
      repos.map(async (repo) => {
        try {
          const rawCommits = await client.fetch<any[]>(`/repos/${repo}/commits?per_page=15`)
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
        } catch {
          return []
        }
      })
    )

    const allCommits: GitHubCommitItem[] = []
    for (const res of results) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allCommits.push(...res.value)
      }
    }

    allCommits.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0
      const timeB = b.date ? new Date(b.date).getTime() : 0
      return timeB - timeA
    })

    return allCommits.slice(0, limit)
  },
  {
    maxAge: 180,
    name: 'github-global-commits',
    getKey: (token: string, repos: string[], limit: number) =>
      `${token ? 'auth' : 'anon'}:${[...repos].sort().join(',')}:${limit}`
  }
)

export default withApiHandler(async (event): Promise<GitHubCommitItem[]> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()
  const defaultOwner = config.githubUsername || 'bagja-iskandar'

  let repos: string[] = []

  if (repoParam) {
    const fullRepo = repoParam.includes('/') ? repoParam : `${defaultOwner}/${repoParam}`
    repos = [fullRepo]
  } else {
    const projects = await projectRepository.findAll()
    const projectRepos = projects
      .map((p: Project) => p.githubRepo?.trim())
      .filter((r): r is string => Boolean(r))

    const uniqueRepos = Array.from(new Set(projectRepos))
    repos = uniqueRepos.map((r) => (r.includes('/') ? r : `${defaultOwner}/${r}`))

    if (repos.length === 0) {
      repos = [`${config.githubUsername || 'bagja-iskandar'}/Management`]
    }
  }

  const limitParam = query.limit ? Number(query.limit) : 25
  const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 25 : limitParam))

  return await fetchCachedGlobalCommits(token, repos, limit)
})
