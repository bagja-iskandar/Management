import { taskRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import { validateBody } from '../schemas/helper'
import { createTaskSchema } from '../schemas/task.schema'

export default withApiHandler(async (event) => {
  const body = await validateBody(event, createTaskSchema)

  const task = await taskRepository.create({
    name: body.name,
    projectSlug: body.projectSlug,
    description: body.description,
    status: body.status,
    priority: body.priority,
    techTags: body.techTags,
    dueDate: body.dueDate,
    sprintId: body.sprintId,
    date: body.date,
    githubIssueUrl: body.githubIssueUrl,
    githubIssueNumber: body.githubIssueNumber,
    githubPrUrl: body.githubPrUrl
  })

  setResponseStatus(event, 201)
  return task
})
