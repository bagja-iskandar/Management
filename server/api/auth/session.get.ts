import { getCookie } from 'h3'
import { withApiHandler } from '../../utils/handler'
import { resolveSecurityKeys, verifySessionToken } from '../../utils/auth'

export default withApiHandler(async (event) => {
  const cookieToken = (getCookie(event, 'nexura_session') || '').trim()

  if (!cookieToken) {
    return {
      authenticated: false,
      message: 'No session cookie provided'
    }
  }

  const { allKeys } = resolveSecurityKeys()

  if (allKeys.length === 0) {
    return {
      authenticated: false,
      message: 'Server security unconfigured'
    }
  }

  const sessionResult = verifySessionToken(cookieToken, allKeys)

  if (sessionResult.valid) {
    const rawExp = sessionResult.expiresAt ?? (sessionResult as any).payload?.exp
    const expiresAt = rawExp ? new Date(rawExp).toISOString() : new Date().toISOString()

    return {
      authenticated: true,
      expiresAt,
      message: 'Session valid'
    }
  }

  return {
    authenticated: false,
    message: sessionResult.error || 'Invalid session token'
  }
})
