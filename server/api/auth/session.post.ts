import { setCookie } from 'h3'
import { z } from 'zod'
import { withApiHandler } from '../../utils/handler'
import { validateBody } from '../../schemas/helper'
import { resolveSecurityKeys, verifyAccessKey, createSessionToken } from '../../utils/auth'
import { throwApiError } from '../../utils/errors'

const sessionSchema = z.object({
  accessKey: z.string().min(1, 'Access key is required')
})

export default withApiHandler(async (event) => {
  const body = await validateBody(event, sessionSchema)

  const { primaryKey, allKeys } = resolveSecurityKeys()

  if (allKeys.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throwApiError(
        500,
        'SERVER_SECURITY_UNCONFIGURED',
        'Server security configuration missing: NEXURA_ACCESS_KEY or SUPABASE_SERVICE_ROLE_KEY must be set in production.'
      )
    }
    throwApiError(401, 'UNAUTHORIZED', 'Invalid access key provided')
  }

  const isValid = verifyAccessKey(body.accessKey, allKeys)
  if (!isValid) {
    throwApiError(401, 'UNAUTHORIZED', 'Invalid access key provided')
  }

  const activeKey = primaryKey || body.accessKey
  const rawToken = createSessionToken(activeKey, {
    ttlMs: 30 * 24 * 60 * 60 * 1000
  })

  const tokenString = typeof rawToken === 'string' ? rawToken : (rawToken as any).token
  const expiresAt =
    typeof rawToken === 'object' && (rawToken as any)?.expiresAt
      ? (rawToken as any).expiresAt
      : parseInt(tokenString.split('.')[3] || '0', 10)

  setCookie(event, 'nexura_session', tokenString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60
  })

  return {
    success: true,
    message: 'Session established',
    expiresAt: new Date(expiresAt).toISOString()
  }
})
