export type ProjectStatus = 'active' | 'maintenance' | 'planned' | 'on-hold' | 'completed' | 'archived'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Project {
  id: string
  slug: string
  title: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  githubRepo?: string | null
  deployUrl?: string | null
  techStack: string[]
  startDate?: string | null
  dueDate?: string | null
  releasePhase?: string
  createdAt: string
  updatedAt: string
}
