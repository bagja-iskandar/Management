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
import { promoteNoteToTask } from '../../utils/note'

const CANONICAL_KEY = 'project_notes'
const LEGACY_KEY = 'notes'

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

async function getStoredNotes(): Promise<ProjectNote[]> {
  const canonical = await getArray<ProjectNote>(CANONICAL_KEY)
  if (canonical.length > 0) {
    return canonical
  }
  return await getArray<ProjectNote>(LEGACY_KEY)
}

export class NitroNoteRepository implements INoteRepository {
  async findAll(projectSlug?: string, category?: NoteCategory): Promise<ProjectNote[]> {
    const raw = await getStoredNotes()
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
    const item = (await getById<ProjectNote>(CANONICAL_KEY, id)) || (await getById<ProjectNote>(LEGACY_KEY, id))
    return item ? normalizeNote(item) : null
  }

  async create(noteData: CreateNoteInput): Promise<ProjectNote> {
    const item = await createItem<ProjectNote>(CANONICAL_KEY, {
      projectSlug: noteData.projectSlug,
      category: noteData.category,
      content: noteData.content,
      promotedTaskId: noteData.promotedTaskId ?? null
    } as any)
    return normalizeNote(item)
  }

  async update(id: string, patch: UpdateNoteInput): Promise<ProjectNote | null> {
    let updated = await updateItem<ProjectNote>(CANONICAL_KEY, id, patch as any)
    if (!updated) {
      updated = await updateItem<ProjectNote>(LEGACY_KEY, id, patch as any)
    }
    return updated ? normalizeNote(updated) : null
  }

  async delete(id: string): Promise<boolean> {
    const deletedCanonical = await removeItem(CANONICAL_KEY, id)
    const deletedLegacy = await removeItem(LEGACY_KEY, id)
    return deletedCanonical || deletedLegacy
  }

  async promoteToTask(id: string, overrides?: PromoteNoteOverrides): Promise<PromoteNoteResult> {
    return promoteNoteToTask(this, id, overrides)
  }
}
