import { sprintRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import type { Sprint } from '~/types'

export default withApiHandler(async (event): Promise<Sprint> => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Sprint ID is required' })
  }

  const sprint = await sprintRepository.findById(id)
  if (!sprint) {
    throw createError({ statusCode: 404, statusMessage: `Sprint not found` })
  }

  return sprint
})
