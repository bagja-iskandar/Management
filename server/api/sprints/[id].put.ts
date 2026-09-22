import { sprintRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import { validateBody } from '../../schemas/helper'
import { updateSprintSchema } from '../../schemas/sprint.schema'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Sprint ID is required' })
  }

  const patch = await validateBody(event, updateSprintSchema)

  const updated = await sprintRepository.update(id, patch)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Sprint not found' })
  }

  return updated
})
