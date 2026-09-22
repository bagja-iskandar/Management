import { z } from 'zod'

const legacyStatusMap: Record<string, 'in_queue' | 'running_sprint' | 'deployed' | 'blocked'> = {
  todo: 'in_queue',
  proses: 'running_sprint',
  selesai: 'deployed'
}

export const taskStatusSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase()
    return legacyStatusMap[trimmed] ?? trimmed
  }
  return val
}, z.enum(['in_queue', 'running_sprint', 'deployed', 'blocked']))

export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

export const createTaskSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required'),
  projectSlug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: taskStatusSchema.default('in_queue'),
  priority: taskPrioritySchema.default('medium'),
  techTags: z.array(z.string().trim().min(1)).default([]),
  dueDate: z.string().trim().optional(),
  sprintId: z.string().trim().optional(),
  date: z.string().trim().default(() => new Date().toISOString().slice(0, 10)),
  githubIssueUrl: z.string().trim().optional(),
  githubIssueNumber: z.coerce.number().optional(),
  githubPrUrl: z.string().trim().optional()
})

export const updateTaskSchema = createTaskSchema.partial()

export const taskQuerySchema = z.object({
  project: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  status: z.string().trim().optional(),
  sprintId: z.string().trim().optional()
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type TaskQueryInput = z.infer<typeof taskQuerySchema>
