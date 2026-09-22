import type { Stat } from '~/types'
import { taskRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'

export default withApiHandler(async (): Promise<Stat[]> => {
  const tasks = await taskRepository.findAll()

  // 1. Active Tasks: status != 'deployed'
  const activeTasks = tasks.filter((t) => t.status !== 'deployed').length

  // 2. Blockers: priority 'critical' or status 'blocked'
  const blockers = tasks.filter((t) => t.priority === 'critical' || t.status === 'blocked').length

  // 3. Velocity: tasks deployed in the last 7 days
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const velocity = tasks.filter((t) => {
    if (t.status !== 'deployed') return false
    const dateStr = t.updatedAt || t.date || t.createdAt
    if (!dateStr) return false
    const d = new Date(dateStr)
    return !Number.isNaN(d.getTime()) && d >= sevenDaysAgo
  }).length

  return [
    {
      label: 'Active Tasks',
      value: activeTasks,
      delta: `${activeTasks} active`,
      trend: 'up'
    },
    {
      label: 'Blockers',
      value: blockers,
      delta: blockers > 0 ? `${blockers} blocked` : '0 blockers',
      trend: blockers > 0 ? 'down' : 'up'
    },
    {
      label: 'Sprint Velocity',
      value: velocity,
      delta: `${velocity} deployed/7d`,
      trend: 'up'
    }
  ]
})
