export function throwApiError(statusCode: number, code: string, message: string, details?: any): never {
  // Use Nitro's createError helper to produce a structured error
  throw createError({ statusCode, statusMessage: message, data: { code, details } })
}

export function formatError(err: any) {
  // Normalize error shape for logging or response consumers
  if (!err) return { status: 500, message: 'Unknown error' }
  return {
    status: err.statusCode ?? err.status ?? 500,
    code: err.data?.code ?? 'error',
    message: err.statusMessage ?? err.message ?? 'Internal error',
    details: err.data?.details ?? null
  }
}
