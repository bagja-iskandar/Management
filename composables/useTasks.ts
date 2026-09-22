import type { Task } from '~/types'

export function useTasks() {
  async function getTasks(params?: Record<string, any>) {
    return await $fetch<Task[]>('/api/tasks', { params })
  }

  async function getTask(id: string) {
    return await $fetch<Task>(`/api/tasks/${id}`)
  }

  async function getActivities() {
    return await $fetch<Task[]>('/api/activities')
  }

  async function createTask(payload: Partial<Task> & { name: string }) {
    const created = await $fetch<Task>('/api/tasks', { method: 'POST', body: payload })
    try {
      refreshNuxtData(['tasks-page', 'project-tasks', 'roadmap-tasks', 'activities', 'stats', 'sprints-list'])
    } catch {
      // safe fallback in test/isolated env
    }
    return created
  }

  async function updateTask(id: string, patch: Partial<Task>) {
    const updated = await $fetch<Task>(`/api/tasks/${id}`, { method: 'PUT', body: patch })
    try {
      refreshNuxtData(['tasks-page', 'project-tasks', 'roadmap-tasks', 'activities', 'stats', 'sprints-list'])
    } catch {
      // safe fallback
    }
    return updated
  }

  async function deleteTask(id: string) {
    const res = await $fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    try {
      refreshNuxtData(['tasks-page', 'project-tasks', 'roadmap-tasks', 'activities', 'stats', 'sprints-list'])
    } catch {
      // safe fallback
    }
    return res
  }

  return { getTasks, getTask, getActivities, createTask, updateTask, deleteTask }
}
