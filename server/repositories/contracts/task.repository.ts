import type { Task, TaskPriority, TaskStatus } from '~/types'

export interface TaskFilterOptions {
  projectSlug?: string
  priority?: TaskPriority | string
  status?: TaskStatus | string
  sprintId?: string
}

export interface ITaskRepository {
  findAll(filters?: TaskFilterOptions): Promise<Task[]>
  findById(id: string): Promise<Task | null>
  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'taskId'> & { taskId?: string }): Promise<Task>
  update(id: string, patch: Partial<Task>): Promise<Task | null>
  delete(id: string): Promise<boolean>
  nextTaskId(): Promise<string>
}
