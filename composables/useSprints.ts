import type { Sprint } from '~/types'
import { useWorkspaceStore } from './useWorkspaceStore'
import { useSession } from './useSession'

export function useSprints() {
  const workspaceStore = useWorkspaceStore()
  const session = useSession()

  /**
   * Store-First Reading:
   * Returns reactive workspace store sprints or initializes workspace once.
   */
  async function getSprints(): Promise<Sprint[]> {
    if (workspaceStore.isInitialized.value) {
      return workspaceStore.sprints.value
    }

    await workspaceStore.initializeWorkspace()
    return workspaceStore.sprints.value
  }

  /**
   * Store-First single sprint reader.
   * Resolves instantly from store if matched by id.
   */
  async function getSprint(id: string): Promise<Sprint | null> {
    const existing = workspaceStore.sprints.value.find(s => s.id === id)
    if (existing) {
      return existing
    }

    try {
      return await $fetch<Sprint>(`/api/sprints/${encodeURIComponent(id)}`)
    } catch (err: any) {
      session.handleApiError(err)
      return null
    }
  }

  /**
   * Optimistic create with authoritative server resolution.
   * Eliminates blanket refreshNuxtData mass invalidation.
   */
  async function createSprint(payload: {
    name: string
    startDate: string
    endDate: string
    status?: Sprint['status']
    taskIds?: string[]
    velocity?: number
    objective?: string
  }): Promise<Sprint> {
    const tempId = `temp-${Date.now()}`
    const optimisticSprint: Sprint = {
      id: tempId,
      name: payload.name,
      status: payload.status || 'planning',
      startDate: payload.startDate,
      endDate: payload.endDate,
      taskIds: payload.taskIds || [],
      velocity: payload.velocity,
      objective: payload.objective,
      createdAt: new Date().toISOString()
    }

    workspaceStore.addSprintToStore(optimisticSprint)

    try {
      const created = await $fetch<Sprint>('/api/sprints', { method: 'POST', body: payload })
      workspaceStore.removeSprintFromStore(tempId)
      workspaceStore.addSprintToStore(created)
      return created
    } catch (err: any) {
      workspaceStore.removeSprintFromStore(tempId)
      session.handleApiError(err)
      throw err
    }
  }

  /**
   * Protected optimistic update with per-entity serial queue and targeted field rollback.
   */
  async function updateSprint(id: string, patch: Partial<Sprint>): Promise<Sprint> {
    return await workspaceStore.enqueueEntityMutation(
      'sprint',
      id,
      async () => {
        try {
          const updated = await $fetch<Sprint>(`/api/sprints/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: patch
          })
          return updated
        } catch (err: any) {
          session.handleApiError(err)
          throw err
        }
      },
      patch
    )
  }

  /**
   * Optimistic deletion with per-entity serial queue and snapshot recovery on failure.
   */
  async function deleteSprint(id: string): Promise<any> {
    const existingSprint = workspaceStore.sprints.value.find(s => s.id === id)
    const snapshot = existingSprint ? JSON.parse(JSON.stringify(existingSprint)) : null
    workspaceStore.removeSprintFromStore(id)

    return await workspaceStore.enqueueEntityMutation(
      'sprint',
      id,
      async () => {
        try {
          const res = await $fetch(`/api/sprints/${encodeURIComponent(id)}`, { method: 'DELETE' })
          return res
        } catch (err: any) {
          if (snapshot) {
            workspaceStore.addSprintToStore(snapshot)
          }
          session.handleApiError(err)
          throw err
        }
      }
    )
  }

  return { getSprints, getSprint, createSprint, updateSprint, deleteSprint }
}
