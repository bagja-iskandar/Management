export type NoteCategory = 'idea' | 'bug' | 'maintenance'

export interface ProjectNote {
  id: string
  projectSlug: string
  category: NoteCategory
  content: string
  promotedTaskId?: string | null
  createdAt: string
  updatedAt: string
}
