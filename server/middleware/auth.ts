import { defineEventHandler, getHeader, getCookie, getMethod, getRequestPath, type H3Event } from 'h3'
import { throwApiError } from '../utils/errors'
import {
  resolveSecurityKeys,
  createSessionToken,
  verifySessionToken,
  verifyAccessKey,
  type SessionTokenValidationResult,
  type CreateSessionTokenOptions
} from '../utils/auth'

export {
  resolveSecurityKeys,
  createSessionToken,
  verifySessionToken,
  verifyAccessKey,
  type SessionTokenValidationResult,
  type CreateSessionTokenOptions
}

/**
 * Validates request origin against Host header and browser metadata for state-changing requests.
 */
function isCsrfSafe(event: H3Event): boolean {
  const authHeader = getHeader(event, 'authorization') || ''
  const xRequestedWith = getHeader(event, 'x-requested-with')
  const secFetchSite = (getHeader(event, 'sec-fetch-site') || '').toLowerCase()
  const origin = getHeader(event, 'origin') || ''
  const referer = getHeader(event, 'referer') || ''
  const host = (getHeader(event, 'host') || '').toLowerCase()

  // 1. Programmatic API calls using Bearer token or custom AJAX header are exempt
  if (authHeader.toLowerCase().startsWith('bearer ') || Boolean(xRequestedWith)) {
    return true
  }

  // 2. Fetch metadata indicating same-origin or direct navigation
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none') {
    return true
  }

  // 3. Origin header matches current Host
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase()
      if (originHost === host) {
        return true
      }
    } catch {
      return false
    }
  }

  // 4. Referer header matches current Host
  if (referer) {
    try {
      const refererHost = new URL(referer).host.toLowerCase()
      if (refererHost === host) {
        return true
      }
    } catch {
      return false
    }
  }

  // 5. In local development, non-browser requests without origin/referer are allowed
  if (process.env.NODE_ENV !== 'production' && !origin && !referer && !secFetchSite) {
    return true
  }

  return false
}

export default defineEventHandler((event: H3Event) => {
  const path = getRequestPath(event) || event.path || ''

  // 1. Only inspect API routes under /api/**
  if (!path.startsWith('/api/') && path !== '/api') {
    return
  }

  const normalizedPath = path.replace(/\/+$/, '')
  const method = (event.node?.req?.method || getMethod(event) || 'GET').toUpperCase()

  // 2. Whitelist explicitly public endpoints
  // a) Handshake endpoint
  if (normalizedPath === '/api/auth/session' && method === 'POST') {
    return
  }
  // b) Aggregated dashboard stats
  if (normalizedPath === '/api/stats' && method === 'GET') {
    return
  }

  // 3. Determine if request requires authentication:
  // - All GitHub endpoints under /api/github/**
  // - All state-changing mutation methods (POST, PUT, PATCH, DELETE)
  const isGitHubEndpoint = normalizedPath.startsWith('/api/github')
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  const isMutation = mutationMethods.includes(method)

  if (!isGitHubEndpoint && !isMutation) {
    return
  }

  // 4. CSRF protection on mutation requests
  if (isMutation && !isCsrfSafe(event)) {
    throwApiError(403, 'CSRF_BLOCKED', 'Cross-site request blocked: Origin or Referer header mismatch.')
  }

  // 5. Resolve configured server security keys
  const { allKeys } = resolveSecurityKeys()

  if (allKeys.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throwApiError(
        500,
        'SERVER_SECURITY_UNCONFIGURED',
        'Server security configuration missing: NEXURA_ACCESS_KEY or SUPABASE_SERVICE_ROLE_KEY must be set in production.'
      )
    }

    if (process.env.NEXURA_DEV_AUTH_BYPASS === 'true') {
      console.warn(
        `[auth-middleware] [DEV] Warning: Request ${method} ${path} permitted via NEXURA_DEV_AUTH_BYPASS=true because no security keys are set in .env.`
      )
      return
    }

    throwApiError(
      401,
      'UNAUTHORIZED',
      'Authentication required: No security keys configured on server and dev bypass is disabled. Set NEXURA_ACCESS_KEY or enable NEXURA_DEV_AUTH_BYPASS=true.'
    )
  }

  // 6. Extract credentials from Authorization header or nexura_session cookie
  const authHeader = getHeader(event, 'authorization') || ''
  let bearerToken = ''
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    bearerToken = authHeader.slice(7).trim()
  }

  const cookieToken = (getCookie(event, 'nexura_session') || '').trim()

  if (!bearerToken && !cookieToken) {
    throwApiError(
      401,
      'UNAUTHORIZED',
      'Authentication required: Please provide Authorization: Bearer <key> header or nexura_session cookie.'
    )
  }

  let isAuthorized = false

  // 7. Validate Bearer token
  if (bearerToken) {
    if (bearerToken.startsWith('v1.')) {
      const sessionResult = verifySessionToken(bearerToken, allKeys)
      if (sessionResult.valid) {
        isAuthorized = true
      } else {
        throwApiError(401, 'UNAUTHORIZED', `Bearer token validation failed: ${sessionResult.error}`)
      }
    } else {
      if (verifyAccessKey(bearerToken, allKeys)) {
        isAuthorized = true
      } else if (!cookieToken) {
        throwApiError(401, 'UNAUTHORIZED', 'Invalid authentication credentials provided.')
      }
    }
  }

  // 8. Validate session cookie if bearer token did not authorize
  if (!isAuthorized && cookieToken) {
    const sessionResult = verifySessionToken(cookieToken, allKeys)
    if (sessionResult.valid) {
      isAuthorized = true
    } else {
      throwApiError(401, 'UNAUTHORIZED', `Session cookie validation failed: ${sessionResult.error}`)
    }
  }

  if (!isAuthorized) {
    throwApiError(401, 'UNAUTHORIZED', 'Invalid authentication credentials provided.')
  }
})
