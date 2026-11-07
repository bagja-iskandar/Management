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

  // Cache invalidation for workflows
  try {
    const storage = typeof useStorage === 'function' ? useStorage('cache') : null
    if (storage) {
      const keys = await storage.getKeys()
      const matchingKeys = keys.filter((k) => k.includes('github-workflows'))
      for (const key of matchingKeys) {
        await storage.removeItem(key)
      }
    }
  } catch {
    // Non-blocking cache clear
  }

  return {
    ok: true,
    message: 'Workflow rerun triggered successfully'
  }
})
