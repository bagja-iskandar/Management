import type { H3Event } from 'h3'

export function withApiHandler<T = unknown>(handler: (event: H3Event) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error: any) {
      if (error?.statusCode) {
        throw error
      }

      throw createError({
        statusCode: 500,
        statusMessage: error?.message ?? 'Internal server error',
        data: {
          code: 'internal_error',
          details: process.env.NODE_ENV === 'development' ? error?.stack ?? error : undefined
        }
      })
    }
  })
}
