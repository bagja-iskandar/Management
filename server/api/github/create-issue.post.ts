import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { throwApiError } from '../../utils/errors'
import { readJsonBody, requireString, optionalString, validateStringArray } from '../../utils/validation'
import { taskRepository } from '../../repositories'

export default withApiHandler(async (event) => {
  const body = await readJsonBody<{
    repo?: string
    taskId?: string
    title?: string
    body?: string
    labels?: string[]
  }>(event)

  const repoParam = requireString(body?.repo, 'repo')
  const title = requireString(body?.title, 'title')
  const issueBody = optionalString(body?.body, 'body')
  const labels = validateStringArray(body?.labels, 'labels')
  const taskId = optionalString(body?.taskId, 'taskId')

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
