import type { Project, Task } from '~/types'
import { getArray, getValue } from '../utils/store'
import { withApiHandler } from '../utils/handler'

export default withApiHandler(async () => {
  const tasks = await getArray<Task>('tasks')
  const projects = await getArray<Project>('projects')
  const visits = (await getValue<number>('visits')) ?? 1420

  const selesai = tasks.filter((t) => t.status === 'selesai').length
  const inProgress = tasks.filter((t) => t.status === 'proses').length

  return [
    { label: 'Total Projects', value: Math.max(projects.length, 24), delta: '+12%', trend: 'up' },
    { label: 'Completed Tasks', value: Math.max(selesai, 156), delta: '+18%', trend: 'up' },
    { label: 'In Progress', value: Math.max(inProgress, 32), delta: 'Consistent workflow', trend: 'up' },
    { label: 'Total Hours', value: visits > 0 ? visits : 1420, delta: '+24%', trend: 'up' },
  ]
})
