import type { ITaskRepository, TaskFilterOptions } from '../contracts/task.repository'
import type { Task } from '~/types'
import {
  getArray,
  getById,
  createItem,
  updateItem,
  removeItem,
  normalizeTask,
  getNextTaskId
} from '../../utils/store'

export class NitroTaskRepository implements ITaskRepository {
  async findAll(filters?: TaskFilterOptions): Promise<Task[]> {
    const raw = await getArray<Task>('tasks')
    let tasks = raw.map(normalizeTask)

    if (filters?.projectSlug) {
      const p = filters.projectSlug.trim().toLowerCase()
      tasks = tasks.filter((t) => t.projectSlug?.toLowerCase() === p)
    }

    if (filters?.priority) {
      const pr = String(filters.priority).trim().toLowerCase()
      tasks = tasks.filter((t) => t.priority?.toLowerCase() === pr)
    }

    if (filters?.status) {
      const st = String(filters.status).trim().toLowerCase()
      tasks = tasks.filter((t) => t.status?.toLowerCase() === st)
    }

    if (filters?.sprintId) {
      const sId = filters.sprintId.trim().toLowerCase()
      tasks = tasks.filter((t) => t.sprintId?.toLowerCase() === sId)
    }

    return tasks.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime()
      const timeB = new Date(b.createdAt || b.date || 0).getTime()
      return timeB - timeA
    })
  }

  async findById(id: string): Promise<Task | null> {
    const item = await getById<Task>('tasks', id)
    return item ? normalizeTask(item) : null
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'taskId'> & { taskId?: string }): Promise<Task> {
    const taskId = taskData.taskId || (await this.nextTaskId())
    const item = await createItem<Task>('tasks', {
      ...taskData,
      taskId
    } as any)
    return normalizeTask(item)
  }

  async update(id: string, patch: Partial<Task>): Promise<Task | null> {
    const updated = await updateItem<Task>('tasks', id, patch)
    return updated ? normalizeTask(updated) : null
  }

  async delete(id: string): Promise<boolean> {
    return await removeItem('tasks', id)
  }

  async nextTaskId(): Promise<string> {
    return await getNextTaskId()
  }
}
