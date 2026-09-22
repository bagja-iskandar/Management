import type { Sprint } from '~/types'

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
      refreshNuxtData(['sprints-list', 'tasks-page', 'project-tasks'])
    } catch {}
    return created
  }

  async function updateSprint(id: string, patch: Partial<Sprint>) {
    const updated = await $fetch<Sprint>(`/api/sprints/${id}`, { method: 'PUT', body: patch })
    try {
      refreshNuxtData(['sprints-list', 'tasks-page', 'project-tasks'])
    } catch {}
    return updated
  }

  return { getSprints, createSprint, updateSprint }
}
