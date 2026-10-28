import { z } from 'zod'

export const noteCategorySchema = z.enum(['idea', 'bug', 'maintenance'])

export const createNoteSchema = z.object({
  projectSlug: z.string().trim().min(1, 'Project slug is required'),
  category: noteCategorySchema,
  content: z.string().trim().min(1, 'Content is required'),
  promotedTaskId: z.string().trim().nullable().optional()
})

export const updateNoteSchema = z.object({
  category: noteCategorySchema.optional(),
  content: z.string().trim().min(1, 'Content cannot be empty').optional(),
  promotedTaskId: z.string().trim().nullable().optional()
})

export const noteQuerySchema = z.object({
  projectSlug: z.string().trim().optional(),
  project: z.string().trim().optional(),
  category: noteCategorySchema.optional()
})

export const promoteNoteSchema = z.object({
  priority: z.string().trim().optional(),
  dueDate: z.string().trim().optional()
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type NoteQueryInput = z.infer<typeof noteQuerySchema>
export type PromoteNoteInput = z.infer<typeof promoteNoteSchema>

