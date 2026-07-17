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
    { label: 'Total Project', value: projects.length, delta: '+2', trend: 'up' },
    { label: 'Task Selesai', value: selesai, delta: '+1', trend: 'up' },
    { label: 'Task Terbuka', value: openTasks, delta: '-1', trend: 'down' },
    { label: 'Pengunjung', value: visits, delta: '+10', trend: 'up' },
  ]
})
