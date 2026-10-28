import { noteRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import { validateBody } from '../../schemas/helper'
import { updateNoteSchema } from '../../schemas/note.schema'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Note ID is required' })
  }

  const patch = await validateBody(event, updateNoteSchema)
  const updated = await noteRepository.update(id, patch)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  }

  return updated
})
