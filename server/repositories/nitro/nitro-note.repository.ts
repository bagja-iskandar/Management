import { createError } from 'h3'
import type { INoteRepository, PromoteNoteOverrides, PromoteNoteResult } from '../contracts/note.repository'
import type { ProjectNote, NoteCategory } from '~/types'
import type { CreateNoteInput, UpdateNoteInput } from '../../schemas/note.schema'
import {
  getArray,
  getById,
  createItem,
  updateItem,
  removeItem,
  genId
} from '../../utils/store'
import { taskRepository } from '../index'
import { extractNoteTitle } from '../../utils/note'

export function normalizeNote(note: any): ProjectNote {
  return {
    id: String(note.id || genId()),
    projectSlug: note.projectSlug || '',
    category: note.category || 'idea',
    content: note.content || '',
    promotedTaskId: note.promotedTaskId ?? null,
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: note.updatedAt || new Date().toISOString()
  }
}

export class NitroNoteRepository implements INoteRepository {
  async findAll(projectSlug?: string, category?: NoteCategory): Promise<ProjectNote[]> {
    const raw = await getArray<ProjectNote>('notes')
    let notes = raw.map(normalizeNote)

    if (projectSlug) {
      const slug = projectSlug.trim().toLowerCase()
      notes = notes.filter((n) => n.projectSlug?.toLowerCase() === slug)
    }

    if (category) {
      const cat = category.trim().toLowerCase()
      notes = notes.filter((n) => n.category?.toLowerCase() === cat)
    }

    return notes.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime()
      const timeB = new Date(b.createdAt || 0).getTime()
      return timeB - timeA
    })
  }

  async findById(id: string): Promise<ProjectNote | null> {
    const item = await getById<ProjectNote>('notes', id)
    return item ? normalizeNote(item) : null
  }

  async create(noteData: CreateNoteInput): Promise<ProjectNote> {
    const item = await createItem<ProjectNote>('notes', {
      projectSlug: noteData.projectSlug,
      category: noteData.category,
      content: noteData.content,
      promotedTaskId: noteData.promotedTaskId ?? null
    } as any)
    return normalizeNote(item)
  }

  async update(id: string, patch: UpdateNoteInput): Promise<ProjectNote | null> {
    const updated = await updateItem<ProjectNote>('notes', id, patch as any)
    return updated ? normalizeNote(updated) : null
  }

  async delete(id: string): Promise<boolean> {
    return await removeItem('notes', id)
  }

  async promoteToTask(id: string, overrides?: PromoteNoteOverrides): Promise<PromoteNoteResult> {
    const note = await this.findById(id)
    if (!note) {
      throw createError({ statusCode: 404, statusMessage: 'Note not found' })
    }

    if (note.promotedTaskId) {
      throw createError({ statusCode: 409, statusMessage: 'Note has already been promoted to a task' })
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
