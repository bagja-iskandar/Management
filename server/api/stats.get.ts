import type { Project, Task } from '~/types'
import { getArray, getValue } from '../utils/store'
import { withApiHandler } from '../utils/handler'

export default withApiHandler(async () => {
  const tasks = await getArray<Task>('tasks')
  const projects = await getArray<Project>('projects')
  const visits = (await getValue<number>('visits')) ?? 0

  const selesai = tasks.filter((t) => t.status === 'selesai').length
  const openTasks = tasks.filter((t) => t.status === 'todo').length

  return [
    { label: 'Total Projects', value: projects.length, delta: '+2', trend: 'up' },
    { label: 'Completed Tasks', value: selesai, delta: '+1', trend: 'up' },
    { label: 'Open Tasks', value: openTasks, delta: '-1', trend: 'down' },
    { label: 'Total Visitors', value: visits, delta: '+10', trend: 'up' },
  ]
})
