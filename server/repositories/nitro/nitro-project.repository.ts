import type { IProjectRepository, ProjectFilterOptions } from '../contracts/project.repository'
import type { Project } from '~/types'
import {
  getArray,
  getById,
  getBySlug,
  createItem,
  updateItemBySlug,
  removeItemBySlug,
  normalizeProject
} from '../../utils/store'

export class NitroProjectRepository implements IProjectRepository {
  async findAll(filters?: ProjectFilterOptions): Promise<Project[]> {
    const raw = await getArray<Project>('projects')
    let projects = raw.map(normalizeProject)

    if (filters?.status) {
      const st = String(filters.status).trim().toLowerCase()
      projects = projects.filter((p) => p.status?.toLowerCase() === st)
    }

    if (filters?.priority) {
      const pr = String(filters.priority).trim().toLowerCase()
      projects = projects.filter((p) => p.priority?.toLowerCase() === pr)
    }

    return projects
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const item = await getBySlug<Project>('projects', slug)
    return item ? normalizeProject(item) : null
  }

  async findById(id: string): Promise<Project | null> {
    const item = await getById<Project>('projects', id)
    return item ? normalizeProject(item) : null
  }

  async create(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const item = await createItem<Project>('projects', projectData as any)
    return normalizeProject(item)
  }

  async update(slug: string, patch: Partial<Project>): Promise<Project | null> {
    const updated = await updateItemBySlug<Project>('projects', slug, patch)
    return updated ? normalizeProject(updated) : null
  }

  async delete(slug: string): Promise<boolean> {
    return await removeItemBySlug('projects', slug)
  }

  async slugExists(slug: string): Promise<boolean> {
    const raw = await getArray<Project>('projects')
    const lower = slug.toLowerCase().trim()
    return raw.some((p) => p.slug.toLowerCase().trim() === lower)
  }
}
