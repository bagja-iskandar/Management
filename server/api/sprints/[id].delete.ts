import { sprintRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Sprint ID is required' })
  }

  const removed = await sprintRepository.delete(id)
  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'Sprint not found' })
  }

  return { ok: true, message: 'Sprint deleted successfully' }
})
