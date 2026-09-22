import { taskRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import { validateQuery } from '../schemas/helper'
import { taskQuerySchema } from '../schemas/task.schema'
import type { Task } from '~/types'

export default withApiHandler(async (event): Promise<Task[]> => {
  const query = validateQuery(event, taskQuerySchema)

  return await taskRepository.findAll({
    projectSlug: query.project,
    priority: query.priority,
    status: query.status,
    sprintId: query.sprintId
  })
})
