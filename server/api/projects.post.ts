import { projectRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import { validateBody } from '../schemas/helper'
import { createProjectSchema } from '../schemas/project.schema'

export default withApiHandler(async (event) => {
  const body = await validateBody(event, createProjectSchema)

  const defaultSlug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `proj-${Date.now()}`
  const slug = (body.slug || defaultSlug).toLowerCase().trim()

  const exists = await projectRepository.slugExists(slug)
  if (exists) {
    throw createError({
      statusCode: 409,
      statusMessage: `Project with slug "${slug}" already exists`
    })
  }

  const project = await projectRepository.create({
    slug,
    title: body.title,
    description: body.description,
    status: body.status,
    priority: body.priority,
    githubRepo: body.githubRepo,
    deployUrl: body.deployUrl,
    techStack: body.techStack,
    startDate: body.startDate,
    dueDate: body.dueDate
  })

  setResponseStatus(event, 201)
  return project
})
