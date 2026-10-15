export type TaskStatus = 'in_queue' | 'running_sprint' | 'deployed' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  taskId: string            // "ENG-001" sequential
  projectSlug?: string
  name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  techTags: string[]
  dueDate?: string
  sprintId?: string
  date: string
  createdAt: string
  updatedAt: string
  githubIssueUrl?: string
  githubIssueNumber?: number
  githubPrUrl?: string
}
