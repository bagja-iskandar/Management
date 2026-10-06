import { projectRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import { validateQuery } from '../schemas/helper'
import { projectQuerySchema } from '../schemas/project.schema'
import type { Project } from '~/types'

export default withApiHandler(async (event): Promise<Project[]> => {
  const query = validateQuery(event, projectQuerySchema)
  return await projectRepository.findAll({
    status: query.status,
    priority: query.priority
  })
})
