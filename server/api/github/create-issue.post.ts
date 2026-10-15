import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import { validateBody, createIssueSchema } from '../../schemas'
import { taskRepository } from '../../repositories'

export default withApiHandler(async (event) => {
  const body = await validateBody(event, createIssueSchema)
  const repoParam = body.repo
  const title = body.title
  const issueBody = body.body
  const labels = body.labels
  const taskId = body.taskId

  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  if (!token) {
    throwApiError(401, 'UNAUTHORIZED', 'GitHub token is required to create an issue')
  }

  let fullRepo = repoParam
  if (!fullRepo.includes('/')) {
    const defaultOwner = config.githubUsername || 'bagja-iskandar'
    fullRepo = `${defaultOwner}/${fullRepo}`
  }

  const client = createGitHubClient(token)
  const payload: Record<string, any> = {
    title
  }

  if (issueBody !== undefined) {
    payload.body = issueBody
  }

  if (labels && labels.length > 0) {
    payload.labels = labels
  }

  const createdIssue = await client.fetch<any>(`/repos/${fullRepo}/issues`, {
    method: 'POST',
    body: payload
  })

  if (taskId) {
    try {
      await taskRepository.update(taskId, {
        githubIssueUrl: createdIssue.html_url,
        githubIssueNumber: createdIssue.number
      })
    } catch (err) {
      console.error('[create-issue] Failed to update task with issue info:', err)
    }
  }

  return {
    ok: true,
    issue: {
      number: createdIssue.number,
      title: createdIssue.title,
      htmlUrl: createdIssue.html_url
    }
  }
})
