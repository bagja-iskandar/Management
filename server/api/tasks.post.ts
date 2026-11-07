import { taskRepository, sprintRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import { validateBody } from '../schemas/helper'
import { createTaskSchema } from '../schemas/task.schema'

export default withApiHandler(async (event) => {
  const body = await validateBody(event, createTaskSchema)

  // AUTO-BIND: Jika status task adalah 'running_sprint' dan belum punya sprintId
  if (body.status === 'running_sprint' && !body.sprintId) {
    const allSprints = await sprintRepository.findAll()
    const nowIso = new Date().toISOString().slice(0, 10)

    const activeSprint =
      allSprints.find(
        (s) =>
          s.status === 'active' &&
          (!s.startDate || s.startDate <= nowIso) &&
          (!s.endDate || s.endDate >= nowIso)
      ) || allSprints.find((s) => s.status === 'active')

    if (activeSprint) {
      body.sprintId = activeSprint.id
    }
  }

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
