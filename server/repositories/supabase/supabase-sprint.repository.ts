import type { ISprintRepository } from '../contracts/sprint.repository'
import type { Sprint } from '~/types'
import { getSupabaseClient } from '../../utils/supabase'

function mapSprintRow(row: any): Sprint {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    taskIds: Array.isArray(row.task_ids) ? row.task_ids : [],
    velocity: row.velocity !== null && row.velocity !== undefined ? Number(row.velocity) : undefined,
    objective: row.objective || undefined,
    createdAt: row.created_at
  }
}

function mapSprintToRow(s: Partial<Sprint>): Record<string, any> {
  const row: Record<string, any> = {}
  if (s.name !== undefined) row.name = s.name
  if (s.status !== undefined) row.status = s.status
  if (s.startDate !== undefined) row.start_date = s.startDate
  if (s.endDate !== undefined) row.end_date = s.endDate
  if (s.taskIds !== undefined) row.task_ids = s.taskIds
  if (s.velocity !== undefined) row.velocity = s.velocity
  if (s.objective !== undefined) row.objective = s.objective
  return row
}

export class SupabaseSprintRepository implements ISprintRepository {
  private get client() {
    const c = getSupabaseClient()
    if (!c) throw new Error('Supabase client is not configured.')
    return c
  }

  async findAll(): Promise<Sprint[]> {
    const { data, error } = await this.client
      .from('sprints')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('[SupabaseSprintRepository.findAll] Error:', error)
      return []
    }

    return (data || []).map(mapSprintRow)
  }

  async findById(id: string): Promise<Sprint | null> {
    const { data, error } = await this.client
      .from('sprints')
      .select('*')
      .eq('id', id.trim())
      .maybeSingle()

    if (error) {
      console.error('[SupabaseSprintRepository.findById] Error:', error)
      return null
    }

    return data ? mapSprintRow(data) : null
  }

  async create(sprintData: Omit<Sprint, 'id' | 'createdAt'>): Promise<Sprint> {
    const row = mapSprintToRow(sprintData)
    row.created_at = new Date().toISOString()
    row.updated_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('sprints')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error('[SupabaseSprintRepository.create] Error:', error)
      throw new Error(`Failed to create sprint in Supabase: ${error.message}`)
    }

    return mapSprintRow(data)
  }

  async update(id: string, patch: Partial<Sprint>): Promise<Sprint | null> {
    const row = mapSprintToRow(patch)
    row.updated_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('sprints')
      .update(row)
      .eq('id', id.trim())
      .select()
      .maybeSingle()

    if (error) {
      console.error('[SupabaseSprintRepository.update] Error:', error)
      return null
    }

    return data ? mapSprintRow(data) : null
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('sprints')
      .delete()
      .eq('id', id.trim())

    if (error) {
      console.error('[SupabaseSprintRepository.delete] Error:', error)
      return false
    }

    return true
  }
}
