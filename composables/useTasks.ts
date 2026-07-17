import type { Task } from '~/types'

export function useTasks() {
  async function getTasks() {
    return await $fetch<Task[]>('/api/tasks')
  }

  async function getActivities() {
    return await $fetch<Task[]>('/api/activities')
  }

  async function createTask(payload: { name: string; status?: Task['status']; date?: string }) {
    return await $fetch<Task>('/api/tasks', { method: 'POST', body: payload })
  }

  async function updateTask(id: string, patch: Partial<Pick<Task, 'name' | 'status' | 'date'>>) {
    return await $fetch<Task>(`/api/task/${id}`, { method: 'PUT', body: patch })
  }

  async function deleteTask(id: string) {
    return await $fetch(`/api/task/${id}`, { method: 'DELETE' })
  }

  return { getTasks, getActivities, createTask, updateTask, deleteTask }
}
