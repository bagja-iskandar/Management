import type { INoteRepository, PromoteNoteOverrides, PromoteNoteResult } from '../contracts/note.repository'
import type { ProjectNote, NoteCategory } from '~/types'
import type { CreateNoteInput, UpdateNoteInput } from '../../schemas/note.schema'
import { requireSupabaseClient, throwIfSupabaseError } from '../../utils/supabase'
import { mapNoteRow, mapNoteToRow } from './mappers'
import { promoteNoteToTask } from '../../utils/note'

export class SupabaseNoteRepository implements INoteRepository {
  protected get client() {
    return requireSupabaseClient()
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
    throwIfSupabaseError(error, 'SupabaseNoteRepository.findAll')

    return (data || []).map(mapNoteRow)
  }

  async findById(id: string): Promise<ProjectNote | null> {
    const { data, error } = await this.client
      .from('project_notes')
      .select('*')
      .eq('id', id.trim())
      .maybeSingle()

    throwIfSupabaseError(error, 'SupabaseNoteRepository.findById')

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

    throwIfSupabaseError(error, 'SupabaseNoteRepository.create')

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

    throwIfSupabaseError(error, 'SupabaseNoteRepository.update')

    return data ? mapNoteRow(data) : null
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id)
    if (!existing) return false

    const { error } = await this.client
      .from('project_notes')
      .delete()
      .eq('id', id.trim())

    throwIfSupabaseError(error, 'SupabaseNoteRepository.delete')

    return true
  }

  async promoteToTask(id: string, overrides?: PromoteNoteOverrides): Promise<PromoteNoteResult> {
    return promoteNoteToTask(this, id, overrides)
  }
}
