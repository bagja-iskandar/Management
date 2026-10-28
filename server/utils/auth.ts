import crypto from 'node:crypto'

export interface SessionTokenValidationResult {
  valid: boolean
  error?: string
  issuedAt?: number
  expiresAt?: number
}

export interface CreateSessionTokenOptions {
  ttlMs?: number
}

/**
 * Resolves configured security keys in order of precedence:
 * 1. NEXURA_ACCESS_KEY
 * 2. SUPABASE_SERVICE_ROLE_KEY
 * 3. SUPABASE_SERVICE_KEY / SUPABASE_KEY (fallback)
 */
export function resolveSecurityKeys(): { primaryKey: string; allKeys: string[] } {
  const accessKey = (process.env.NEXURA_ACCESS_KEY || '').trim()
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const fallbackServiceKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '').trim()

  const allKeys = Array.from(new Set([accessKey, serviceRoleKey, fallbackServiceKey].filter(Boolean)))
  const primaryKey = accessKey || serviceRoleKey || fallbackServiceKey || ''

  return { primaryKey, allKeys }
}

/**
 * Creates a cryptographically signed v1 session token.
 * Format: `v1.<nonce>.<issuedAt>.<expiresAt>.<signature>`
 * - Nonce: 32 hex characters (16 cryptographically random bytes)
 * - Signature: HMAC-SHA256 signature of `v1.<nonce>.<issuedAt>.<expiresAt>` using the secret key.
 */
export function createSessionToken(secretKey: string, options?: CreateSessionTokenOptions): string {
  if (!secretKey || typeof secretKey !== 'string') {
    throw new Error('createSessionToken: secretKey is required.')
  }

  const ttlMs = options?.ttlMs ?? 7 * 24 * 60 * 60 * 1000 // 7 days
  const now = Date.now()
  const expiresAt = now + ttlMs
  const nonce = crypto.randomBytes(16).toString('hex') // 32 hex chars
  const payload = `v1.${nonce}.${now}.${expiresAt}`
  const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')

  return `${payload}.${signature}`
}

/**
 * Verifies a v1 session token against one or more allowed secret keys.
 * Enforces:
 * - Exactly 5 segments separated by `.`
 * - Version must be `v1`
 * - Nonce must be 32 hexadecimal characters
 * - Valid numeric timestamps with 60s future skew tolerance
 * - Active expiration (Date.now() < expiresAt)
 * - HMAC-SHA256 signature verification using timing-safe buffer comparison
 */
export function verifySessionToken(
  token: string,
  secretKeys: string | string[]
): SessionTokenValidationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Session token is missing or empty' }
  }

  const parts = token.trim().split('.')
  if (parts.length !== 5) {
    return {
      valid: false,
      error: 'Malformed session token: expected exactly 5 segments (v1.nonce.issuedAt.expiresAt.signature)'
    }
  }

  const [version, nonce, issuedAtStr, expiresAtStr, signature] = parts

  if (version !== 'v1') {
    return { valid: false, error: `Unsupported session token version: '${version}'` }
  }

  if (!nonce || !/^[a-fA-F0-9]{32}$/.test(nonce)) {
    return { valid: false, error: 'Invalid session token: nonce must be 32 hexadecimal characters' }
  }

  const issuedAt = parseInt(issuedAtStr || '', 10)
  const expiresAt = parseInt(expiresAtStr || '', 10)

  if (Number.isNaN(issuedAt) || Number.isNaN(expiresAt)) {
    return { valid: false, error: 'Invalid session token: timestamps must be numeric' }
  }

  const now = Date.now()
  // 60-second clock skew tolerance on issue time
  if (now < issuedAt - 60_000) {
    return { valid: false, error: 'Invalid session token: issuedAt is in the future beyond allowable skew' }
  }

  if (now >= expiresAt) {
    return { valid: false, error: 'Session token has expired' }
  }

  if (!signature || !/^[a-fA-F0-9]{64}$/.test(signature)) {
    return { valid: false, error: 'Invalid session token: signature must be 64 hexadecimal characters' }
  }

  const keys = Array.isArray(secretKeys) ? secretKeys : [secretKeys]
  const validKeys = keys.filter(Boolean)

  if (validKeys.length === 0) {
    return { valid: false, error: 'No server secret keys configured for signature verification' }
  }

  const payload = `${version}.${nonce}.${issuedAtStr}.${expiresAtStr}`
  const signatureBuffer = Buffer.from(signature, 'hex')

  let signatureValid = false
  for (const key of validKeys) {
    const expectedSigHex = crypto.createHmac('sha256', key).update(payload).digest('hex')
    const expectedSigBuffer = Buffer.from(expectedSigHex, 'hex')

    if (
      expectedSigBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedSigBuffer, signatureBuffer)
    ) {
      signatureValid = true
      break
    }
  }

  if (!signatureValid) {
    return { valid: false, error: 'Invalid session token: signature verification failed' }
  }

  return { valid: true, issuedAt, expiresAt }
}

/**
 * Validates a raw access key against valid server keys using constant-time SHA-256 comparison.
 */
export function verifyAccessKey(providedKey: string, validKeys: string | string[]): boolean {
  if (!providedKey || typeof providedKey !== 'string') {
    return false
  }

  const keys = Array.isArray(validKeys) ? validKeys : [validKeys]
  const nonEmpties = keys.filter(Boolean)
  if (nonEmpties.length === 0) {
    return false
  }

  const providedHash = crypto.createHash('sha256').update(providedKey.trim()).digest()

  for (const key of nonEmpties) {
    const keyHash = crypto.createHash('sha256').update(key.trim()).digest()
    if (crypto.timingSafeEqual(providedHash, keyHash)) {
      return true
    }
  }

  return false
}
