import test from 'node:test'
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'
import {
  verifyAccessKey,
  createSessionToken,
  verifySessionToken,
  resolveSecurityKeys
} from '../../server/utils/auth.ts'

// Pure ESM Test Suite: Authentication & Session Token Safety (Phase 0)

test('verifyAccessKey: exact match returns true', () => {
  const secret = 'nexura-super-secret-key-2026'
  assert.equal(verifyAccessKey(secret, secret), true)
  assert.equal(verifyAccessKey('key-b', ['key-a', 'key-b', 'key-c']), true)
  assert.equal(verifyAccessKey('  key-with-spaces  ', 'key-with-spaces'), true)
})

test('verifyAccessKey: mismatch returns false', () => {
  assert.equal(verifyAccessKey('wrong-key', 'correct-key'), false)
  assert.equal(verifyAccessKey('key-d', ['key-a', 'key-b']), false)
  assert.equal(verifyAccessKey('attacker-key', 'legitimate-server-key'), false)
})

test('verifyAccessKey: length mismatch returns false without throwing RangeError', () => {
  // Direct crypto.timingSafeEqual throws RangeError if buffer lengths differ.
  // verifyAccessKey hashes with SHA-256 first, guaranteeing equal 32-byte buffers.
  assert.doesNotThrow(() => {
    const res1 = verifyAccessKey('short', 'much-longer-secret-key-1234567890')
    assert.equal(res1, false)

    const res2 = verifyAccessKey('much-longer-secret-key-1234567890', 'short')
    assert.equal(res2, false)

    const res3 = verifyAccessKey('a', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    assert.equal(res3, false)
  })
})

test('verifyAccessKey: empty and invalid inputs return false safely', () => {
  assert.equal(verifyAccessKey('', 'key'), false)
  assert.equal(verifyAccessKey('key', ''), false)
  assert.equal(verifyAccessKey(null, 'key'), false)
  assert.equal(verifyAccessKey(undefined, 'key'), false)
  assert.equal(verifyAccessKey('key', null), false)
  assert.equal(verifyAccessKey('key', undefined), false)
  assert.equal(verifyAccessKey('key', []), false)
  assert.equal(verifyAccessKey(123, '123'), false)
  assert.equal(verifyAccessKey({}, 'key'), false)
})

test('createSessionToken & verifySessionToken: token structure validation', () => {
  const secretKey = 'test-session-secret-key'
  const token = createSessionToken(secretKey)

  assert.ok(typeof token === 'string', 'Token must be a string')
  const parts = token.split('.')
  assert.equal(parts.length, 5, 'Session token must have exactly 5 dot-separated segments')

  const [version, nonce, issuedAtStr, expiresAtStr, signature] = parts
  assert.equal(version, 'v1', 'First segment must be version v1')
  assert.match(nonce, /^[a-fA-F0-9]{32}$/, 'Nonce must be 32 hexadecimal characters (16 bytes)')

  const issuedAt = parseInt(issuedAtStr, 10)
  const expiresAt = parseInt(expiresAtStr, 10)
  assert.ok(!Number.isNaN(issuedAt), 'issuedAt must be numeric')
  assert.ok(!Number.isNaN(expiresAt), 'expiresAt must be numeric')
  assert.ok(expiresAt > issuedAt, 'expiresAt must be greater than issuedAt')

  assert.match(signature, /^[a-fA-F0-9]{64}$/, 'Signature must be 64 hexadecimal characters (HMAC-SHA256)')
})

test('createSessionToken & verifySessionToken: valid token verification succeeds', () => {
  const secretKey = 'test-session-secret-key'
  const token = createSessionToken(secretKey)

  const result = verifySessionToken(token, secretKey)
  assert.equal(result.valid, true)
  assert.ok(typeof result.issuedAt === 'number')
  assert.ok(typeof result.expiresAt === 'number')
  assert.equal(result.error, undefined)

  // Also valid when secretKey is provided inside an array
  const multiKeyResult = verifySessionToken(token, ['other-key', secretKey])
  assert.equal(multiKeyResult.valid, true)
})

test('createSessionToken & verifySessionToken: signature tampering is rejected', () => {
  const secretKey = 'test-session-secret-key'
  const token = createSessionToken(secretKey)
  const parts = token.split('.')

  // Corrupt signature segment
  const tamperedSig = parts[4].endsWith('a') ? parts[4].slice(0, -1) + 'b' : parts[4].slice(0, -1) + 'a'
  const tamperedToken = `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}.${tamperedSig}`

  const result = verifySessionToken(tamperedToken, secretKey)
  assert.equal(result.valid, false)
  assert.match(result.error, /signature verification failed/i)
})

test('createSessionToken & verifySessionToken: payload tampering is rejected', () => {
  const secretKey = 'test-session-secret-key'
  const token = createSessionToken(secretKey)
  const parts = token.split('.')

  // Tamper with expiresAt to extend session without resigning
  const extendedExpiry = String(parseInt(parts[3], 10) + 1_000_000)
  const tamperedToken = `${parts[0]}.${parts[1]}.${parts[2]}.${extendedExpiry}.${parts[4]}`

  const result = verifySessionToken(tamperedToken, secretKey)
  assert.equal(result.valid, false)
  assert.match(result.error, /signature verification failed/i)
})

test('createSessionToken & verifySessionToken: malformed tokens are rejected', () => {
  const secretKey = 'test-session-secret-key'

  // Fewer than 5 segments
  assert.equal(verifySessionToken('v1.abc.123', secretKey).valid, false)
  assert.equal(verifySessionToken('', secretKey).valid, false)
  assert.equal(verifySessionToken(null, secretKey).valid, false)

  // Corrupted nonce (not 32-hex)
  assert.equal(verifySessionToken('v1.short.123.456.aabbccdd', secretKey).valid, false)

  // Non-numeric timestamps
  const validNonce = '0123456789abcdef0123456789abcdef'
  const fakeSig = 'a'.repeat(64)
  assert.equal(verifySessionToken(`v1.${validNonce}.not-a-number.456.${fakeSig}`, secretKey).valid, false)

  // Unsupported version
  assert.equal(verifySessionToken(`v2.${validNonce}.1000.2000.${fakeSig}`, secretKey).valid, false)
})

test('createSessionToken & verifySessionToken: expired tokens are rejected', () => {
  const secretKey = 'test-session-secret-key'
  // Create token with past expiration
  const expiredToken = createSessionToken(secretKey, { ttlMs: -10_000 })

  const result = verifySessionToken(expiredToken, secretKey)
  assert.equal(result.valid, false)
  assert.match(result.error, /expired/i)
})

test('createSessionToken & verifySessionToken: secret rotation semantics', () => {
  const keyAlpha = 'key-alpha-old-secret'
  const keyBeta = 'key-beta-new-secret'

  const tokenAlpha = createSessionToken(keyAlpha)

  // Verification fails against new key alone
  const singleFail = verifySessionToken(tokenAlpha, keyBeta)
  assert.equal(singleFail.valid, false)

  // Verification succeeds when allowed keys array includes the old key during rotation
  const rotationSuccess = verifySessionToken(tokenAlpha, [keyBeta, keyAlpha])
  assert.equal(rotationSuccess.valid, true)
})

test('Development Bypass rules: default, development, and production protection', async () => {
  function evaluateDevAuthBypass(env) {
    if (!env || env.NODE_ENV === 'production') {
      return false
    }
    return env.NEXURA_DEV_AUTH_BYPASS === 'true'
  }

  // 1. Default (env undefined or NEXURA_DEV_AUTH_BYPASS unset) -> bypass inactive
  assert.equal(evaluateDevAuthBypass({}), false)
  assert.equal(evaluateDevAuthBypass({ NODE_ENV: 'development' }), false)
  assert.equal(evaluateDevAuthBypass(undefined), false)

  // 2. Explicit active (NEXURA_DEV_AUTH_BYPASS='true' & NODE_ENV='development') -> bypass active
  assert.equal(evaluateDevAuthBypass({ NODE_ENV: 'development', NEXURA_DEV_AUTH_BYPASS: 'true' }), true)

  // 3. Inactive when set to false or other value
  assert.equal(evaluateDevAuthBypass({ NODE_ENV: 'development', NEXURA_DEV_AUTH_BYPASS: 'false' }), false)
  assert.equal(evaluateDevAuthBypass({ NODE_ENV: 'development', NEXURA_DEV_AUTH_BYPASS: '1' }), false)

  // 4. Production protection (NEXURA_DEV_AUTH_BYPASS='true' & NODE_ENV='production') -> bypass strictly blocked
  assert.equal(evaluateDevAuthBypass({ NODE_ENV: 'production', NEXURA_DEV_AUTH_BYPASS: 'true' }), false)

  // 5. Test auth middleware execution behavior with jiti
  const jiti = createJiti(import.meta.url)
  const { createError } = await import('h3')
  globalThis.createError = createError

  const authMiddleware = jiti('../../server/middleware/auth.ts').default

  // Save current env
  const origEnv = { ...process.env }

  try {
    delete process.env.NEXURA_ACCESS_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_KEY
    delete process.env.SUPABASE_KEY

    // In development with bypass active: no error thrown
    process.env.NODE_ENV = 'development'
    process.env.NEXURA_DEV_AUTH_BYPASS = 'true'

    const devEvent = {
      path: '/api/tasks',
      node: {
        req: {
          url: '/api/tasks',
          method: 'POST',
          headers: { 'x-requested-with': 'XMLHttpRequest' }
        }
      }
    }

    await assert.doesNotReject(async () => {
      await authMiddleware(devEvent)
    })

    // In production with bypass attempt: strictly throws 500 SERVER_SECURITY_UNCONFIGURED
    process.env.NODE_ENV = 'production'
    process.env.NEXURA_DEV_AUTH_BYPASS = 'true'

    await assert.rejects(
      async () => {
        await authMiddleware(devEvent)
      },
      (err) => {
        assert.equal(err.statusCode, 500)
        assert.equal(err.data?.code, 'SERVER_SECURITY_UNCONFIGURED')
        return true
      }
    )
  } finally {
    // Restore env
    process.env = origEnv
  }
})
