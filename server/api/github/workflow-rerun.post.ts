import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import { validateBody, workflowRerunSchema } from '../../schemas'
import { assertGitHubRepoAllowed } from '../../utils/github-allowlist'

export default withApiHandler(async (event) => {
  const body = await validateBody(event, workflowRerunSchema)
  const repoParam = body.repo
  const runId = body.runId

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  if (!token) {
    throwApiError(401, 'UNAUTHORIZED', 'Token required to rerun workflow')
  }

  const fullRepo = await assertGitHubRepoAllowed(repoParam, event)

  const client = createGitHubClient(token)
  await client.fetch(`/repos/${fullRepo}/actions/runs/${runId}/rerun`, {
    method: 'POST'
  })

  return {
    ok: true,
    message: 'Workflow rerun triggered successfully'
  }
})
