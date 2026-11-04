import type { H3Event } from 'h3'
import { readBody, getQuery, getRouterParams, getRouterParam, createError } from 'h3'
import type { z } from 'zod'

export async function validateBody<T>(event: H3Event, schema: z.ZodType<T>): Promise<T> {
  const body = await readBody(event)
  return schema.parse(body || {})
}

export function validateQuery<T>(event: H3Event, schema: z.ZodType<T>): T {
  const query = getQuery(event)
  return schema.parse(query || {})
}

export function validateParams<T>(event: H3Event, schema: z.ZodType<T>): T {
  const params = getRouterParams(event)
  return schema.parse(params || {})
}

export function requireRouterParam(event: H3Event, name: string, label?: string): string {
  const value = getRouterParam(event, name)
  if (!value || !value.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: `${label || name} is required`
    })
  }
  return value.trim()
}
