import { z } from 'zod'

export const projectStatusSchema = z.enum(['active', 'maintenance', 'planned', 'on-hold', 'completed', 'archived'])
export const projectPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

const baseProjectFields = {
  title: z.string().trim().min(1, 'Project title is required'),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  status: projectStatusSchema,
  priority: projectPrioritySchema,
  githubRepo: z.string().trim().optional(),
  deployUrl: z.string().trim().optional(),
  techStack: z.array(z.string().trim().min(1)),
  startDate: z.string().trim().optional(),
  dueDate: z.string().trim().optional()
}

export const createProjectSchema = z.object({
  ...baseProjectFields,
  status: projectStatusSchema.default('active'),
  priority: projectPrioritySchema.default('medium'),
  techStack: z.array(z.string().trim().min(1)).default([])
})

export const updateProjectSchema = z.object(baseProjectFields).partial()

export const projectQuerySchema = z.object({
  status: z.string().trim().optional(),
  priority: z.string().trim().optional()
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
