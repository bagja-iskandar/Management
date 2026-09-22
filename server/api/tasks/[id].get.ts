import { taskRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Task ID is required' })
  }

  const task = await taskRepository.findById(id)
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return task
})
