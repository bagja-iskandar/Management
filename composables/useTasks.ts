import type { Task } from '~/types'
import { useWorkspaceStore } from './useWorkspaceStore'
import { useSession } from './useSession'

export function useTasks() {
  const workspaceStore = useWorkspaceStore()
  const session = useSession()

  /**
   * Store-First Reading:
   * Returns store cache directly if available, or initiates shared hydration.
   * If specific query params are passed, queries the server endpoint directly.
   */
  async function getTasks(params?: Record<string, any>): Promise<Task[]> {
    if (params && Object.keys(params).length > 0) {
      return await $fetch<Task[]>('/api/tasks', { params })
    }

    if (workspaceStore.isInitialized.value) {
      return workspaceStore.tasks.value
    }

    await workspaceStore.initializeWorkspace()
    return workspaceStore.tasks.value
  }

  /**
   * Store-First single entity reader.
   * Checks local reactive store first before network round-trip.
   */
  async function getTask(id: string): Promise<Task> {
    const existing = workspaceStore.tasks.value.find(t => t.id === id || t.taskId === id)
    if (existing) {
      return existing
    }
    return await $fetch<Task>(`/api/tasks/${encodeURIComponent(id)}`)
  }

  async function getActivities(): Promise<Task[]> {
    return await $fetch<Task[]>('/api/activities')
  }

  /**
   * Optimistic create with authoritative server resolution.
   * Eliminates blanket refreshNuxtData mass invalidation.
   */
  async function createTask(payload: Partial<Task> & { name: string }): Promise<Task> {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const optimisticTask: Task = {
      id: tempId,
      taskId: 'TEMP',
      name: payload.name,
      description: payload.description,
      status: payload.status || 'in_queue',
      priority: payload.priority || 'medium',
      techTags: payload.techTags || [],
      dueDate: payload.dueDate || null,
      projectSlug: payload.projectSlug || null,
      sprintId: payload.sprintId || null,
      date: payload.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    }

    workspaceStore.addTaskToStore(optimisticTask)

    try {
      const created = await $fetch<Task>('/api/tasks', { method: 'POST', body: payload })
      workspaceStore.removeTaskFromStore(tempId)
      workspaceStore.addTaskToStore(created)
      return created
    } catch (err: any) {
      workspaceStore.removeTaskFromStore(tempId)
      session.handleApiError(err)
      throw err
    }
  }

  /**
   * Protected optimistic update with per-entity serial queue and targeted field rollback.
   */
  async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
    return await workspaceStore.enqueueEntityMutation(
      'task',
      id,
      async () => {
        try {
          const updated = await $fetch<Task>(`/api/tasks/${encodeURIComponent(id)}`, {
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
  async function deleteTask(id: string): Promise<any> {
    const existingTask = workspaceStore.tasks.value.find(t => t.id === id || t.taskId === id)
    const snapshot = existingTask ? JSON.parse(JSON.stringify(existingTask)) : null
    workspaceStore.removeTaskFromStore(id)

    return await workspaceStore.enqueueEntityMutation(
      'task',
      id,
      async () => {
        try {
          const res = await $fetch(`/api/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' })
          return res
        } catch (err: any) {
          if (snapshot) {
            workspaceStore.addTaskToStore(snapshot)
          }
          session.handleApiError(err)
          throw err
        }
      }
    )
  }

  return { getTasks, getTask, getActivities, createTask, updateTask, deleteTask }
}
