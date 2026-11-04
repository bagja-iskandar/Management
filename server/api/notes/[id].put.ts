import { createError } from 'h3'
import { noteRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import { validateBody, requireRouterParam } from '../../schemas/helper'
import { updateNoteSchema } from '../../schemas/note.schema'

export default withApiHandler(async (event) => {
  const id = requireRouterParam(event, 'id', 'Note ID')

  const patch = await validateBody(event, updateNoteSchema)
  const updated = await noteRepository.update(id, patch)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  }

  return updated
})
