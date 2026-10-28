export type TaskStatus = 'idea' | 'in_queue' | 'running_sprint' | 'deployed' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  taskId: string            // "ENG-001" sequential
  projectSlug?: string | null
  name: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  techTags: string[]
  dueDate?: string | null
  sprintId?: string | null
  date: string
  createdAt: string
  updatedAt: string
  githubIssueUrl?: string | null
  githubIssueNumber?: number
  githubPrUrl?: string | null
}
