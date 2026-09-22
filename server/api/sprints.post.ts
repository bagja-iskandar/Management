import { sprintRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import { validateBody } from '../schemas/helper'
import { createSprintSchema } from '../schemas/sprint.schema'

export default withApiHandler(async (event) => {
  const body = await validateBody(event, createSprintSchema)

  const sprint = await sprintRepository.create({
    name: body.name,
    status: body.status,
    startDate: body.startDate,
    endDate: body.endDate,
    taskIds: body.taskIds,
    velocity: body.velocity,
    objective: body.objective
  })

  setResponseStatus(event, 201)
  return sprint
})
