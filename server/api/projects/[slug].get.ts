import { projectRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import type { Project } from '~/types'

export default withApiHandler(async (event): Promise<Project> => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Project slug is required' })
  }

  const project = await projectRepository.findBySlug(slug)
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: `Project with slug "${slug}" not found` })
  }

  return project
})
