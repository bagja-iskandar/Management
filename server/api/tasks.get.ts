import { getArray } from '../utils/store'
import { withApiHandler } from '../utils/handler'
import type { Task } from '~/types'

export default withApiHandler(async () => {
  const tasks = await getArray<Task>('tasks')
  return tasks.slice().sort((a, b) => b.date.localeCompare(a.date))
})


