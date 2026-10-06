import { z } from 'zod'

export const sprintStatusSchema = z.enum(['planning', 'active', 'completed'])

const baseSprintFields = {
  name: z.string().trim().min(1, 'Sprint name is required'),
  status: sprintStatusSchema,
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().min(1, 'End date is required'),
  taskIds: z.array(z.string().trim()),
  velocity: z.coerce.number().optional(),
  objective: z.string().trim().optional()
}

export const createSprintSchema = z.object({
  ...baseSprintFields,
  status: sprintStatusSchema.default('planning'),
  taskIds: z.array(z.string().trim()).default([])
})

export const updateSprintSchema = z.object(baseSprintFields).partial()

export type CreateSprintInput = z.infer<typeof createSprintSchema>
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>
