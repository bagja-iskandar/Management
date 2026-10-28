import { createError } from 'h3'
import type { ISprintRepository } from '../contracts/sprint.repository'
import type { Sprint } from '~/types'
import { getSupabaseClient } from '../../utils/supabase'
import { isNetworkError } from '../index'

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
    if (!c) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Supabase client is not configured or unavailable'
      })
    }
    return c
  }

  async findAll(): Promise<Sprint[]> {
    const { data, error } = await this.client
      .from('sprints')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      if (isNetworkError(error)) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Database connection temporarily unavailable',
          data: { error: error.message || error }
        })
      }
      console.error('[SupabaseSprintRepository.findAll] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
        data: error
      })
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
      if (isNetworkError(error)) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Database connection temporarily unavailable',
          data: { error: error.message || error }
        })
      }
      console.error('[SupabaseSprintRepository.findById] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
        data: error
      })
    }

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

    if (error) {
      if (isNetworkError(error)) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Database connection temporarily unavailable',
          data: { error: error.message || error }
        })
      }
      console.error('[SupabaseSprintRepository.create] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create sprint in Supabase: ${error.message}`,
        data: error
      })
    }

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

    if (error) {
      if (isNetworkError(error)) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Database connection temporarily unavailable',
          data: { error: error.message || error }
        })
      }
      console.error('[SupabaseSprintRepository.update] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
        data: error
      })
    }

    return data ? mapSprintRow(data) : null
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.client
      .from('sprints')
      .delete()
      .eq('id', id.trim())

    if (error) {
      if (isNetworkError(error)) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Database connection temporarily unavailable',
          data: { error: error.message || error }
        })
      }
      console.error('[SupabaseSprintRepository.delete] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
        data: error
      })
    }

    return true
  }
}
