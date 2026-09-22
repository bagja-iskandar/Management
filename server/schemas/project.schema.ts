import { z } from 'zod'

export const projectStatusSchema = z.enum(['active', 'maintenance', 'planned', 'on-hold', 'completed', 'archived'])
export const projectPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required'),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  status: projectStatusSchema.default('active'),
  priority: projectPrioritySchema.default('medium'),
  githubRepo: z.string().trim().optional(),
  deployUrl: z.string().trim().optional(),
  techStack: z.array(z.string().trim().min(1)).default([]),
  startDate: z.string().trim().optional(),
  dueDate: z.string().trim().optional()
})

export const updateProjectSchema = createProjectSchema.partial()

export const projectQuerySchema = z.object({
  status: z.string().trim().optional(),
  priority: z.string().trim().optional()
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
