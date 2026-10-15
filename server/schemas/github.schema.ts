import { z } from 'zod'

export const createIssueSchema = z.object({
  repo: z.string().trim().min(1, 'Repository is required'),
  title: z.string().trim().min(1, 'Issue title is required'),
  body: z.string().optional(),
  taskId: z.string().optional(),
  labels: z.array(z.string().trim()).optional()
})

export type CreateIssueInput = z.infer<typeof createIssueSchema>

export const workflowRerunSchema = z.object({
  repo: z.string().trim().min(1, 'Repository is required'),
  runId: z.coerce.number().int().positive('Workflow Run ID must be a positive integer')
})

export type WorkflowRerunInput = z.infer<typeof workflowRerunSchema>
