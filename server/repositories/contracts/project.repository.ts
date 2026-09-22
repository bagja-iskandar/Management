import type { Project, ProjectPriority, ProjectStatus } from '~/types'

export interface ProjectFilterOptions {
  status?: ProjectStatus | string
  priority?: ProjectPriority | string
}

export interface IProjectRepository {
  findAll(filters?: ProjectFilterOptions): Promise<Project[]>
  findBySlug(slug: string): Promise<Project | null>
  findById(id: string): Promise<Project | null>
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>
  update(slug: string, patch: Partial<Project>): Promise<Project | null>
  delete(slug: string): Promise<boolean>
  slugExists(slug: string): Promise<boolean>
}
