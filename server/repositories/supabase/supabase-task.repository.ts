import { createError } from 'h3'
import type { ITaskRepository, TaskFilterOptions } from '../contracts/task.repository'
import type { Task } from '~/types'
import { requireSupabaseClient, throwIfSupabaseError } from '../../utils/supabase'
import { mapTaskRow, mapTaskToRow } from './mappers'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ENG_CODE_REGEX = /^#?ENG-\d+$/i

function resolveTaskIdFilter(id: string): { column: 'task_id' | 'id'; value: string } | null {
  const clean = id.trim()
  if (!clean) return null
  if (ENG_CODE_REGEX.test(clean)) {
    return { column: 'task_id', value: clean.replace(/^#/, '').toUpperCase() }
  }
  if (UUID_REGEX.test(clean)) {
    return { column: 'id', value: clean.toLowerCase() }
  }
  return { column: 'id', value: clean }
}

export class SupabaseTaskRepository implements ITaskRepository {
  protected get client() {
    return requireSupabaseClient()
  }

  async findAll(filters?: TaskFilterOptions): Promise<Task[]> {
    let query = this.client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.projectSlug) {
      query = query.ilike('project_slug', filters.projectSlug.trim())
    }

    if (filters?.priority) {
      query = query.eq('priority', String(filters.priority).trim().toLowerCase())
    }

    if (filters?.status) {
      query = query.eq('status', String(filters.status).trim().toLowerCase())
    }

    if (filters?.sprintId) {
      query = query.eq('sprint_id', filters.sprintId.trim())
    }

    const { data, error } = await query
    throwIfSupabaseError(error, 'SupabaseTaskRepository.findAll')

    return (data || []).map(mapTaskRow)
  }

  async findById(id: string): Promise<Task | null> {
    if (!id || !id.trim()) {
      return null
    }

    const filter = resolveTaskIdFilter(id)
    if (!filter) return null

    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq(filter.column, filter.value)
      .maybeSingle()

    throwIfSupabaseError(error, 'SupabaseTaskRepository.findById')

    return data ? mapTaskRow(data) : null
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'taskId'> & { taskId?: string }): Promise<Task> {
    const maxRetries = 3
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const taskId = taskData.taskId || (await this.nextTaskId())
        const row = mapTaskToRow({
          ...taskData,
          taskId
        })
        row.created_at = new Date().toISOString()
        row.updated_at = new Date().toISOString()

        const { data, error } = await this.client
          .from('tasks')
          .insert(row)
          .select()
          .single()

        if (error) throw error
        return mapTaskRow(data)
      } catch (err: any) {
        if (err?.code === '23505' && !taskData.taskId && attempt < maxRetries) {
          console.warn(`[SupabaseTaskRepository.create] Duplicate taskId collision on attempt ${attempt}, retrying...`)
          continue
        }
        throwIfSupabaseError(err, 'SupabaseTaskRepository.create')
      }
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create task in Supabase after multiple attempts.'
    })
  }

  async update(id: string, patch: Partial<Task>): Promise<Task | null> {
    if (!id || !id.trim()) {
      return null
    }

    const filter = resolveTaskIdFilter(id)
    if (!filter) return null

    const row = mapTaskToRow(patch)
    row.updated_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('tasks')
      .update(row)
      .eq(filter.column, filter.value)
      .select()
      .maybeSingle()

    throwIfSupabaseError(error, 'SupabaseTaskRepository.update')

    return data ? mapTaskRow(data) : null
  }

  async delete(id: string): Promise<boolean> {
    if (!id || !id.trim()) {
      return false
    }

    const existing = await this.findById(id)
    if (!existing) return false

    const { error } = await this.client
      .from('tasks')
      .delete()
      .eq('id', existing.id)

    throwIfSupabaseError(error, 'SupabaseTaskRepository.delete')

    // Cascade cleanup: bersihkan task ID dari array task_ids pada tabel sprints
    try {
      const { data: affectedSprints } = await this.client
        .from('sprints')
        .select('id, task_ids')

      if (affectedSprints && affectedSprints.length > 0) {
        for (const sprint of affectedSprints) {
          if (Array.isArray(sprint.task_ids)) {
            const updatedTaskIds = sprint.task_ids.filter(
              (tId: string) => tId !== existing.id && tId !== existing.taskId
            )
            if (updatedTaskIds.length !== sprint.task_ids.length) {
              await this.client
                .from('sprints')
                .update({ task_ids: updatedTaskIds, updated_at: new Date().toISOString() })
                .eq('id', sprint.id)
            }
          }
        }
      }
    } catch (cleanupErr) {
      console.warn('[SupabaseTaskRepository.delete] Sprint cascade cleanup warning:', cleanupErr)
    }

    return true
  }

  async nextTaskId(): Promise<string> {
    const { data, error } = await this.client
      .from('tasks')
      .select('task_id')

    throwIfSupabaseError(error, 'SupabaseTaskRepository.nextTaskId')

    if (!data || data.length === 0) {
      return 'ENG-001'
    }

    let maxNum = 0
    for (const row of data) {
      const match = String(row.task_id || '').match(/(\d+)/)
      if (match && match[1]) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxNum) {
          maxNum = num
        }
      }
    }

    return 'ENG-' + String(maxNum + 1).padStart(3, '0')
  }
}
