import type { IProjectRepository, ProjectFilterOptions } from '../contracts/project.repository'
import type { Project } from '~/types'
import { requireSupabaseClient, throwIfSupabaseError } from '../../utils/supabase'
import { mapProjectRow, mapProjectToRow } from './mappers'

export class SupabaseProjectRepository implements IProjectRepository {
  protected get client() {
    return requireSupabaseClient()
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
    throwIfSupabaseError(error, 'SupabaseProjectRepository.findAll')

    return (data || []).map(mapProjectRow)
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .ilike('slug', slug.trim())
      .maybeSingle()

    throwIfSupabaseError(error, 'SupabaseProjectRepository.findBySlug')

    return data ? mapProjectRow(data) : null
  }

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id.trim())
      .maybeSingle()

    throwIfSupabaseError(error, 'SupabaseProjectRepository.findById')

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

    throwIfSupabaseError(error, 'SupabaseProjectRepository.create')

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

    throwIfSupabaseError(error, 'SupabaseProjectRepository.update')

    return data ? mapProjectRow(data) : null
  }

  async delete(slug: string): Promise<boolean> {
    const { error } = await this.client
      .from('projects')
      .delete()
      .ilike('slug', slug.trim())

    throwIfSupabaseError(error, 'SupabaseProjectRepository.delete')

    return true
  }

  async slugExists(slug: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('projects')
      .select('id')
      .ilike('slug', slug.trim())
      .maybeSingle()

    throwIfSupabaseError(error, 'SupabaseProjectRepository.slugExists')

    return Boolean(data)
  }
}
