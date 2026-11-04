import { withApiHandler } from '../../utils/handler'
import { requireRouterParam } from '../../schemas/helper'
import { noteRepository } from '../../repositories'

export default withApiHandler(async (event) => {
  const id = requireRouterParam(event, 'id', 'Note ID')
  const success = await noteRepository.delete(id)
  return { success, id }
})
