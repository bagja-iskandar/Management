import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import { assertGitHubRepoAllowed } from '../../utils/github-allowlist'
import type { GitHubWorkflowJob } from '~/types'

const fetchCachedWorkflowJobs = defineCachedFunction(
  async (token: string, repo: string, runId: number): Promise<GitHubWorkflowJob[]> => {
    const client = createGitHubClient(token)
    try {
      const raw = await client.fetch<any>(`/repos/${repo}/actions/runs/${runId}/jobs`)
      const jobs = Array.isArray(raw) ? raw : (raw?.jobs || [])

      return jobs.map((j: any): GitHubWorkflowJob => ({
        id: j.id,
        name: j.name || '',
        status: j.status || '',
        conclusion: j.conclusion ?? null,
        startedAt: j.started_at || '',
        completedAt: j.completed_at ?? null,
        steps: (j.steps || []).map((s: any) => ({
          name: s.name || '',
          status: s.status || '',
          conclusion: s.conclusion ?? null,
          number: s.number || 0
        }))
      }))
    } catch (err: any) {
      if (!token || err?.status === 404 || err?.statusCode === 404) {
        return []
      }
      throw err
    }
  },
  {
    maxAge: 30,
    name: 'github-workflow-jobs',
    getKey: (token: string, repo: string, runId: number) => `${token ? 'auth' : 'anon'}:${repo}:${runId}`
  }
)

export default withApiHandler(async (event): Promise<GitHubWorkflowJob[]> => {
  const query = getQuery(event)
  const repoParam = typeof query.repo === 'string' ? query.repo.trim() : ''
  const runIdParam = query.runId ? Number(query.runId) : NaN

  if (!query.runId || isNaN(runIdParam)) {
    throwApiError(400, 'INVALID_RUN_ID', 'Query parameter "runId" is required and must be a number')
  }

  const fullRepo = await assertGitHubRepoAllowed(repoParam, event)

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  return await fetchCachedWorkflowJobs(token, fullRepo, runIdParam)
})
