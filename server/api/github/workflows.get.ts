import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import type { GitHubWorkflowRun } from '~/types'

const fetchCachedWorkflows = defineCachedFunction(
  async (token: string, repo: string, limit: number): Promise<GitHubWorkflowRun[]> => {
    const client = createGitHubClient(token)
    try {
      const raw = await client.fetch<any>(`/repos/${repo}/actions/runs?per_page=${limit}`)
      const runs = Array.isArray(raw) ? raw : (raw?.workflow_runs || [])

      return runs.map((run: any): GitHubWorkflowRun => {
        const startTime = new Date(run.run_started_at || run.created_at || 0).getTime()
        const endTime = new Date(run.updated_at || run.created_at || 0).getTime()
        const durationSeconds = startTime > 0 && endTime >= startTime
          ? Math.round((endTime - startTime) / 1000)
          : 0

        return {
          id: run.id,
          name: run.name || '',
          status: run.status,
          conclusion: run.conclusion ?? null,
          runNumber: run.run_number || 0,
          htmlUrl: run.html_url || '',
          branch: run.head_branch || '',
          commitSha: run.head_sha || '',
          commitMessage: run.head_commit?.message || '',
          event: run.event || '',
          createdAt: run.created_at || '',
          updatedAt: run.updated_at || '',
          durationSeconds
        }
      })
    } catch {
      // Gracefully return empty array on missing token, 404 repo, or empty workflow runs
      return []
    }
  },
  {
    maxAge: 30,
    name: 'github-workflows',
    getKey: (token: string, repo: string, limit: number) => `${token ? 'auth' : 'anon'}:${repo}:${limit}`
  }
)

export default withApiHandler(async (event): Promise<GitHubWorkflowRun[]> => {
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

  const limitParam = query.limit ? Number(query.limit) : 5
  const limit = Math.max(1, Math.min(100, isNaN(limitParam) ? 5 : limitParam))

  return await fetchCachedWorkflows(token, fullRepo, limit)
})
