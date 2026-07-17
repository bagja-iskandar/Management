import { createItem } from '../utils/store'
import { withApiHandler } from '../utils/handler'
import { readJsonBody, requireString, validateStatus, validateDate } from '../utils/validation'
import type { Task } from '~/types'

export default withApiHandler(async (event) => {
  const body = await readJsonBody<{ name: string; status?: 'todo'|'proses'|'selesai'; date?: string }>(event)

  // Validate
  const name = requireString(body?.name, 'name')
  const status = validateStatus(body?.status) ?? 'todo'
  const date = validateDate(body?.date) ?? new Date().toISOString().slice(0,10)

  const task = await createItem<Task>('tasks', {
    name,
    status,
    date
  })

  return task
})
