import { taskRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import { validateBody } from '../../schemas/helper'
import { updateTaskSchema } from '../../schemas/task.schema'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Task ID is required' })
  }

  const patch = await validateBody(event, updateTaskSchema)

  const updated = await taskRepository.update(id, patch)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return updated
})
