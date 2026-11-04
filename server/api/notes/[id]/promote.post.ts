import { createError } from 'h3'
import { withApiHandler } from '../../../utils/handler'
import { requireRouterParam } from '../../../schemas/helper'
import { noteRepository } from '../../../repositories'

export default withApiHandler(async (event) => {
  const id = requireRouterParam(event, 'id', 'Note ID')

  const note = await noteRepository.findById(id)
  if (!note) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  }

  if (note.promotedTaskId) {
    throw createError({ statusCode: 409, statusMessage: 'Note has already been promoted to a task' })
  }

  const result = await noteRepository.promoteToTask(id)

  return {
    success: true,
    task: result.task,
    note: result.note
  }
})
