import type { H3Event } from 'h3'
import { throwApiError } from './errors'

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

export function requireString(value: any, name = 'value') {
  if (typeof value !== 'string' || !value.trim()) {
    throwApiError(400, 'invalid_input', `${name} is required and must be a non-empty string`)
  }
  return value.trim()
}

export function validateStatus(value: any) {
  if (value === undefined || value === null) return undefined
  const allowed = ['todo', 'proses', 'selesai']
  if (!allowed.includes(value)) throwApiError(400, 'invalid_input', `status must be one of ${allowed.join(', ')}`)
  return value as 'todo' | 'proses' | 'selesai'
}

export function validateDate(value: any) {
  if (!value) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throwApiError(400, 'invalid_input', 'date must be a valid ISO date string')
  return d.toISOString().slice(0, 10)
}
