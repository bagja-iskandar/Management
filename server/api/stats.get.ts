import type { Stat } from '~/types'
import { taskRepository, sprintRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'

export default withApiHandler(async (): Promise<Stat[]> => {
  const [tasks, sprints] = await Promise.all([
    taskRepository.findAll(),
    sprintRepository.findAll()
  ])

  // 1. Active Tasks: status != 'deployed'
  const activeTasks = tasks.filter((t) => t.status !== 'deployed').length

  // 2. Blockers: priority 'critical' or status 'blocked'
  const blockers = tasks.filter((t) => t.priority === 'critical' || t.status === 'blocked').length

  // 3. Velocity: tasks deployed in active sprint (or last 7 days fallback)
  const activeSprint = sprints.find((s) => s.status === 'active')
  let velocity = 0
  let velocityDelta = '0 deployed/7d'

  if (activeSprint) {
    const sprintTaskIds = new Set(activeSprint.taskIds || [])
    velocity = tasks.filter((t) =>
      (t.sprintId === activeSprint.id || sprintTaskIds.has(t.id)) &&
      t.status === 'deployed'
    ).length
    velocityDelta = `${velocity} deployed in ${activeSprint.name || 'Sprint'}`
  } else {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    velocity = tasks.filter((t) => {
      if (t.status !== 'deployed') return false
      const dateStr = t.updatedAt || t.date || t.createdAt
      if (!dateStr) return false
      const d = new Date(dateStr)
      return !Number.isNaN(d.getTime()) && d >= sevenDaysAgo
    }).length
    velocityDelta = `${velocity} deployed/7d`
  }

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
      delta: velocityDelta,
      trend: 'up'
    }
  ]
})
