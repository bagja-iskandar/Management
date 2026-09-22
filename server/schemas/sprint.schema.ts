import { z } from 'zod'

export const sprintStatusSchema = z.enum(['planning', 'active', 'completed'])

export const createSprintSchema = z.object({
  name: z.string().trim().min(1, 'Sprint name is required'),
  status: sprintStatusSchema.default('planning'),
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().min(1, 'End date is required'),
  taskIds: z.array(z.string().trim()).default([]),
  velocity: z.coerce.number().optional(),
  objective: z.string().trim().optional()
})

export const updateSprintSchema = createSprintSchema.partial()

export type CreateSprintInput = z.infer<typeof createSprintSchema>
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>
