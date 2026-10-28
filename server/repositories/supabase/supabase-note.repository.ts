import { createError } from 'h3'
import type { INoteRepository, PromoteNoteOverrides, PromoteNoteResult } from '../contracts/note.repository'
import type { ProjectNote, NoteCategory } from '~/types'
import type { CreateNoteInput, UpdateNoteInput } from '../../schemas/note.schema'
import { getSupabaseClient } from '../../utils/supabase'
import { isNetworkError, taskRepository } from '../index'
import { extractNoteTitle } from '../../utils/note'

function mapNoteRow(row: any): ProjectNote {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    category: row.category,
    content: row.content || '',
    promotedTaskId: row.promoted_task_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapNoteToRow(n: Partial<ProjectNote> | Partial<CreateNoteInput> | Partial<UpdateNoteInput>): Record<string, any> {
  const row: Record<string, any> = {}
  if (n.projectSlug !== undefined) row.project_slug = n.projectSlug
  if (n.category !== undefined) row.category = n.category
  if (n.content !== undefined) row.content = n.content
  if (n.promotedTaskId !== undefined) row.promoted_task_id = n.promotedTaskId
  return row
}

export class SupabaseNoteRepository implements INoteRepository {
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

  async findAll(projectSlug?: string, category?: NoteCategory): Promise<ProjectNote[]> {
    let query = this.client
      .from('project_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectSlug) {
      query = query.ilike('project_slug', projectSlug.trim())
    }

    if (category) {
      query = query.eq('category', category.trim().toLowerCase())
    }

    const { data, error } = await query
    if (error) {
      if (isNetworkError(error)) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Database connection temporarily unavailable',
          data: { error: error.message || error }
        })
      }
      console.error('[SupabaseNoteRepository.findAll] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
        data: error
      })
    }

    return (data || []).map(mapNoteRow)
  }

  async findById(id: string): Promise<ProjectNote | null> {
    const { data, error } = await this.client
      .from('project_notes')
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
      console.error('[SupabaseNoteRepository.findById] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
        data: error
      })
    }

    return data ? mapNoteRow(data) : null
  }

  async create(noteData: CreateNoteInput): Promise<ProjectNote> {
    const row = mapNoteToRow(noteData)
    const now = new Date().toISOString()
    row.created_at = now
    row.updated_at = now

    const { data, error } = await this.client
      .from('project_notes')
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
      console.error('[SupabaseNoteRepository.create] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create note in Supabase: ${error.message}`,
        data: error
      })
    }

    return mapNoteRow(data)
  }

  async update(id: string, patch: UpdateNoteInput): Promise<ProjectNote | null> {
    const row = mapNoteToRow(patch)
    row.updated_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('project_notes')
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
      console.error('[SupabaseNoteRepository.update] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
        data: error
      })
    }

    return data ? mapNoteRow(data) : null
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id)
    if (!existing) return false

    const { error } = await this.client
      .from('project_notes')
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
      console.error('[SupabaseNoteRepository.delete] Error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`,
        data: error
      })
    }

    return true
  }

  async promoteToTask(id: string, overrides?: PromoteNoteOverrides): Promise<PromoteNoteResult> {
    const note = await this.findById(id)
    if (!note) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Note not found'
      })
    }

    if (note.promotedTaskId) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Note has already been promoted to a task'
      })
    }

    const cleanTitle = extractNoteTitle(note.content)
    const priority = (overrides?.priority as any) || 'medium'

    const task = await taskRepository.create({
      name: cleanTitle,
      description: note.content,
      status: 'idea',
      priority,
      dueDate: overrides?.dueDate,
      projectSlug: note.projectSlug,
      techTags: ['scratchpad', note.category]
    })

    const updatedNote = await this.update(id, {
      promotedTaskId: task.id
    })

    if (!updatedNote) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update note with promoted task ID'
      })
    }

    return {
      note: updatedNote,
      task
    }
  }
}
