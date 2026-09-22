import type { H3Event } from 'h3'
import { throwApiError } from './errors'
import type { TaskStatus, TaskPriority, ProjectStatus, ProjectPriority, SprintStatus } from '~/types'

export async function readJsonBody<T = unknown>(event: H3Event): Promise<T> {
  const body = await readBody(event)
  if (body === undefined || body === null) {
    return {} as T
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T
    } catch {
      throwApiError(400, 'invalid_json', 'Request body must be valid JSON')
    }
  }

  if (typeof body === 'object') {
    return body as T
  }

  throwApiError(400, 'invalid_input', 'Request body must be a JSON object')
}

export function requireString(value: any, name = 'value'): string {
  if (typeof value !== 'string' || !value.trim()) {
    throwApiError(400, 'invalid_input', `${name} is required and must be a non-empty string`)
  }
  return value.trim()
}

export function optionalString(value: any, name = 'value'): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') {
    throwApiError(400, 'invalid_input', `${name} must be a string`)
  }
  return value.trim()
}

const legacyStatusMap: Record<string, TaskStatus> = {
  todo: 'in_queue',
  proses: 'running_sprint',
  selesai: 'deployed'
}

export function validateTaskStatus(value: any): TaskStatus | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string' && legacyStatusMap[value]) {
    return legacyStatusMap[value]
  }
  const allowed: TaskStatus[] = ['in_queue', 'running_sprint', 'deployed', 'blocked']
  if (!allowed.includes(value)) {
    throwApiError(400, 'invalid_input', `status must be one of ${allowed.join(', ')}`)
  }
  return value as TaskStatus
}

// Backward-compatible alias
export function validateStatus(value: any): TaskStatus | undefined {
  return validateTaskStatus(value)
}

export function validatePriority(value: any): TaskPriority | undefined {
  if (value === undefined || value === null) return undefined
  const allowed: TaskPriority[] = ['low', 'medium', 'high', 'critical']
  if (!allowed.includes(value)) {
    throwApiError(400, 'invalid_input', `priority must be one of ${allowed.join(', ')}`)
  }
  return value as TaskPriority
}

export function validateTechTags(value: any): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) {
    throwApiError(400, 'invalid_input', 'techTags must be an array of strings')
  }
  if (!value.every((tag) => typeof tag === 'string')) {
    throwApiError(400, 'invalid_input', 'techTags must only contain strings')
  }
  return value.map((tag: string) => tag.trim()).filter(Boolean)
}

export function validateProjectStatus(value: any): ProjectStatus | undefined {
  if (value === undefined || value === null) return undefined
  const allowed: ProjectStatus[] = ['active', 'maintenance', 'planned', 'on-hold', 'completed', 'archived']
  if (!allowed.includes(value)) {
    throwApiError(400, 'invalid_input', `status must be one of ${allowed.join(', ')}`)
  }
  return value as ProjectStatus
}

export function validateProjectPriority(value: any): ProjectPriority | undefined {
  if (value === undefined || value === null) return undefined
  const allowed: ProjectPriority[] = ['low', 'medium', 'high', 'critical']
  if (!allowed.includes(value)) {
    throwApiError(400, 'invalid_input', `priority must be one of ${allowed.join(', ')}`)
  }
  return value as ProjectPriority
}

export function validateSprintStatus(value: any): SprintStatus | undefined {
  if (value === undefined || value === null) return undefined
  const allowed: SprintStatus[] = ['planning', 'active', 'completed']
  if (!allowed.includes(value)) {
    throwApiError(400, 'invalid_input', `status must be one of ${allowed.join(', ')}`)
  }
  return value as SprintStatus
}

export function validateStringArray(value: any, name = 'array'): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) {
    throwApiError(400, 'invalid_input', `${name} must be an array of strings`)
  }
  if (!value.every((item) => typeof item === 'string')) {
    throwApiError(400, 'invalid_input', `${name} must only contain strings`)
  }
  return value.map((item: string) => item.trim()).filter(Boolean)
}

export function validateDate(value: any, name = 'date'): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    throwApiError(400, 'invalid_input', `${name} must be a valid ISO date string`)
  }
  return d.toISOString().slice(0, 10)
}
