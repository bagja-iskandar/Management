import type { ProjectNote, NoteCategory, Task } from '~/types'
import type { CreateNoteInput, UpdateNoteInput } from '../../schemas/note.schema'

export interface PromoteNoteOverrides {
  priority?: string
  dueDate?: string
}

export interface PromoteNoteResult {
  note: ProjectNote
  task: Task
}

export interface INoteRepository {
  findAll(projectSlug?: string, category?: NoteCategory): Promise<ProjectNote[]>
  findById(id: string): Promise<ProjectNote | null>
  create(data: CreateNoteInput): Promise<ProjectNote>
  update(id: string, data: UpdateNoteInput): Promise<ProjectNote | null>
  delete(id: string): Promise<boolean>
  promoteToTask(id: string, overrides?: PromoteNoteOverrides): Promise<PromoteNoteResult>
}
