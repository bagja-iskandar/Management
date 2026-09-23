import type { IProjectRepository, ProjectFilterOptions } from '../contracts/project.repository'
import type { Project } from '~/types'
import { getSupabaseClient } from '../../utils/supabase'

function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    githubRepo: row.github_repo || undefined,
    deployUrl: row.deploy_url || undefined,
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    startDate: row.start_date || undefined,
    dueDate: row.due_date || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapProjectToRow(p: Partial<Project>): Record<string, any> {
  const row: Record<string, any> = {}
  if (p.slug !== undefined) row.slug = p.slug
  if (p.title !== undefined) row.title = p.title
  if (p.description !== undefined) row.description = p.description
  if (p.status !== undefined) row.status = p.status
  if (p.priority !== undefined) row.priority = p.priority
  if (p.githubRepo !== undefined) row.github_repo = p.githubRepo
  if (p.deployUrl !== undefined) row.deploy_url = p.deployUrl
  if (p.techStack !== undefined) row.tech_stack = p.techStack
  if (p.startDate !== undefined) row.start_date = p.startDate || null
  if (p.dueDate !== undefined) row.due_date = p.dueDate || null
  return row
}

export class SupabaseProjectRepository implements IProjectRepository {
  private get client() {
    const c = getSupabaseClient()
    if (!c) throw new Error('Supabase client is not configured.')
    return c
  }

  async findAll(filters?: ProjectFilterOptions): Promise<Project[]> {
    let query = this.client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', String(filters.status).trim().toLowerCase())
    }

    if (filters?.priority) {
      query = query.eq('priority', String(filters.priority).trim().toLowerCase())
    }

    const { data, error } = await query
    if (error) {
      console.error('[SupabaseProjectRepository.findAll] Error:', error)
      return []
    }

    return (data || []).map(mapProjectRow)
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .ilike('slug', slug.trim())
      .maybeSingle()

    if (error) {
      console.error('[SupabaseProjectRepository.findBySlug] Error:', error)
      return null
    }

    return data ? mapProjectRow(data) : null
  }

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id.trim())
      .maybeSingle()

    if (error) {
      console.error('[SupabaseProjectRepository.findById] Error:', error)
      return null
    }

    return data ? mapProjectRow(data) : null
  }

  async create(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const row = mapProjectToRow(projectData)
    row.created_at = new Date().toISOString()
    row.updated_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('projects')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error('[SupabaseProjectRepository.create] Error:', error)
      throw new Error(`Failed to create project in Supabase: ${error.message}`)
    }

    return mapProjectRow(data)
  }

  async update(slug: string, patch: Partial<Project>): Promise<Project | null> {
    const row = mapProjectToRow(patch)
    row.updated_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('projects')
      .update(row)
      .ilike('slug', slug.trim())
      .select()
      .maybeSingle()

    if (error) {
      console.error('[SupabaseProjectRepository.update] Error:', error)
      return null
    }

    return data ? mapProjectRow(data) : null
  }

  async delete(slug: string): Promise<boolean> {
    const { error } = await this.client
      .from('projects')
      .delete()
      .ilike('slug', slug.trim())

    if (error) {
      console.error('[SupabaseProjectRepository.delete] Error:', error)
      return false
    }

    return true
  }

  async slugExists(slug: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('projects')
      .select('id')
      .ilike('slug', slug.trim())
      .maybeSingle()

    if (error) return false
    return Boolean(data)
  }
}
