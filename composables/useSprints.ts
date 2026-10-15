import type { Sprint } from '~/types'

const SPRINT_REFRESH_KEYS = [
  'sprints',
  'sprints-data',
  'sprints-list',
  'tasks-data',
  'tasks-all',
  'tasks-page',
  'project-tasks',
  'stats'
]

export function useSprints() {
  async function getSprints() {
    return await $fetch<Sprint[]>('/api/sprints')
  }

  async function createSprint(payload: {
    name: string
    startDate: string
    endDate: string
    status?: Sprint['status']
    taskIds?: string[]
    velocity?: number
    objective?: string
  }) {
    const created = await $fetch<Sprint>('/api/sprints', { method: 'POST', body: payload })
    try {
      refreshNuxtData(SPRINT_REFRESH_KEYS)
    } catch {}
    return created
  }

  async function getSprint(id: string) {
    try {
      return await $fetch<Sprint>(`/api/sprints/${encodeURIComponent(id)}`)
    } catch {
      return null
    }
  }

  async function updateSprint(id: string, patch: Partial<Sprint>) {
    const updated = await $fetch<Sprint>(`/api/sprints/${id}`, { method: 'PUT', body: patch })
    try {
      refreshNuxtData(SPRINT_REFRESH_KEYS)
    } catch {}
    return updated
  }

  async function deleteSprint(id: string) {
    const res = await $fetch(`/api/sprints/${id}`, { method: 'DELETE' })
    try {
      refreshNuxtData(SPRINT_REFRESH_KEYS)
    } catch {}
    return res
  }

  return { getSprints, getSprint, createSprint, updateSprint, deleteSprint }
}
