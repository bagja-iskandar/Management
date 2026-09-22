import { sprintRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import type { Sprint } from '~/types'

export default withApiHandler(async (): Promise<Sprint[]> => {
  return await sprintRepository.findAll()
})
