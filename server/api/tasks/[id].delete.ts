import { taskRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Task ID is required' })
  }

  const removed = await taskRepository.delete(id)
  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return { ok: true, message: 'Task deleted successfully' }
})
