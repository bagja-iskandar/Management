import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import { readJsonBody, requireString } from '../../utils/validation'

export default withApiHandler(async (event) => {
  const body = await readJsonBody<{ repo?: string; runId?: number | string }>(event)

  const repoParam = requireString(body?.repo, 'repo')
  const runId = Number(body?.runId)
  if (!body?.runId || isNaN(runId)) {
    throwApiError(400, 'INVALID_RUN_ID', 'Body parameter "runId" is required and must be a number')
  }

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  if (!token) {
    throwApiError(401, 'UNAUTHORIZED', 'Token required to rerun workflow')
  }

  let fullRepo = repoParam
  if (!fullRepo.includes('/')) {
    const defaultOwner = config.githubUsername || 'bagja-iskandar'
    fullRepo = `${defaultOwner}/${fullRepo}`
  }

  const client = createGitHubClient(token)
  await client.fetch(`/repos/${fullRepo}/actions/runs/${runId}/rerun`, {
    method: 'POST'
  })

  return {
    ok: true,
    message: 'Workflow rerun triggered successfully'
  }
})
