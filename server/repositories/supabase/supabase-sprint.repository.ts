import type { ISprintRepository } from '../contracts/sprint.repository'
import type { Sprint } from '~/types'
import { requireSupabaseClient, throwIfSupabaseError } from '../../utils/supabase'
import { mapSprintRow, mapSprintToRow } from './mappers'

export class SupabaseSprintRepository implements ISprintRepository {
  protected get client() {
    return requireSupabaseClient()
  }

  async findAll(): Promise<Sprint[]> {
    const { data, error } = await this.client
      .from('sprints')
      .select('*')
      .order('start_date', { ascending: false })

    throwIfSupabaseError(error, 'SupabaseSprintRepository.findAll')

    return (data || []).map(mapSprintRow)
  }

  async findById(id: string): Promise<Sprint | null> {
    const { data, error } = await this.client
      .from('sprints')
      .select('*')
      .eq('id', id.trim())
      .maybeSingle()

    throwIfSupabaseError(error, 'SupabaseSprintRepository.findById')

    return data ? mapSprintRow(data) : null
  }

  async create(sprintData: Omit<Sprint, 'id' | 'createdAt'>): Promise<Sprint> {
    const row = mapSprintToRow(sprintData)
    row.created_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('sprints')
      .insert(row)
      .select()
      .single()

    throwIfSupabaseError(error, 'SupabaseSprintRepository.create')

    return mapSprintRow(data)
  }

  async update(id: string, patch: Partial<Sprint>): Promise<Sprint | null> {
    const row = mapSprintToRow(patch)

    const { data, error } = await this.client
      .from('sprints')
      .update(row)
      .eq('id', id.trim())
      .select()
      .maybeSingle()

    throwIfSupabaseError(error, 'SupabaseSprintRepository.update')

    return data ? mapSprintRow(data) : null
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('sprints')
      .delete()
      .eq('id', id.trim())

    throwIfSupabaseError(error, 'SupabaseSprintRepository.delete')

    return true
  }
}
