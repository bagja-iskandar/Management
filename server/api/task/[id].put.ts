import { updateItem } from '../../utils/store'
import { withApiHandler } from '../../utils/handler'
import { readJsonBody, requireString, validateStatus, validateDate } from '../../utils/validation'
import type { Task } from '~/types'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const patch = await readJsonBody<Partial<{ name: string; status: 'todo' | 'proses' | 'selesai'; date: string }>>(event)

  // Validate patch fields if present
  const validatedPatch: Partial<Task> = {}
  if (patch.name !== undefined) validatedPatch.name = requireString(patch.name, 'name')
  if (patch.status !== undefined) validatedPatch.status = validateStatus(patch.status) as Task['status']
  if (patch.date !== undefined) {
    const d = validateDate(patch.date)
    if (d) validatedPatch.date = d
  }

  const updated = await updateItem<Task>('tasks', id, validatedPatch)
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'task not found' })
  return updated
})
