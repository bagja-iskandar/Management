import { getArray } from '../utils/store'
import { withApiHandler } from '../utils/handler'
import type { Task } from '~/types'

export default withApiHandler(async () => {
  const tasks = await getArray<Task>('tasks')

  return tasks
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => ({ id: t.id, name: t.name, status: t.status, date: t.date }))
})
