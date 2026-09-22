import { projectRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import { validateBody } from '../../schemas/helper'
import { updateProjectSchema } from '../../schemas/project.schema'

export default withApiHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Project slug is required' })
  }

  const patch = await validateBody(event, updateProjectSchema)

  const updated = await projectRepository.update(slug, patch)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  return updated
})
