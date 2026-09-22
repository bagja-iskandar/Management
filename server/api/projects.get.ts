import { projectRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import type { Project } from '~/types'

export default withApiHandler(async (): Promise<Project[]> => {
  return await projectRepository.findAll()
})
