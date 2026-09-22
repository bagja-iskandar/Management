export type ProjectStatus = 'active' | 'maintenance' | 'planned' | 'on-hold' | 'completed' | 'archived'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Project {
  id: string
  slug: string
  title: string
  description?: string
  status: 'active' | 'maintenance' | 'planned' | 'on-hold' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  githubRepo?: string
  deployUrl?: string
  techStack: string[]
  startDate?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}
