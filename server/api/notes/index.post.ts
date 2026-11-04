import { setResponseStatus } from 'h3'
import { withApiHandler } from '../../utils/handler'
import { validateBody } from '../../schemas/helper'
import { createNoteSchema } from '../../schemas/note.schema'
import { noteRepository } from '../../repositories'

export default withApiHandler(async (event) => {
  const body = await validateBody(event, createNoteSchema)
  const created = await noteRepository.create(body)
  setResponseStatus(event, 201)
  return created
})
