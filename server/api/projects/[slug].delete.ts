import { projectRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'

export default withApiHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Project slug is required' })
  }

  const removed = await projectRepository.delete(slug)
  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return { ok: true, message: 'Project deleted successfully' }
})
