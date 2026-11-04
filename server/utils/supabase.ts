import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createError } from 'h3'

let _client: SupabaseClient | null = null

export function isNetworkError(err: any): boolean {
  if (!err) return false
  const msg = (typeof err === 'string' ? err : err.message || err.details || JSON.stringify(err)).toLowerCase()
  return (
    msg.includes('fetch failed') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('network') ||
    msg.includes('connection')
  )
}

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client

  let config: any = {}
  try {
    if (typeof useRuntimeConfig === 'function') {
      config = useRuntimeConfig()
    }
  } catch {
    config = {}
  }

  const rawUrl = (config.supabaseUrl || process.env.SUPABASE_URL || '').trim()
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    config.supabaseKey ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim()

  if (!rawUrl || !key) {
    return null
  }

  // Sanitize URL by removing any trailing /rest/v1 or trailing slashes
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')

  _client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  return _client
}

export function requireSupabaseClient(): SupabaseClient {
  const c = getSupabaseClient()
  if (!c) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Supabase client is not configured or unavailable'
    })
  }
  return c
}

export function throwIfSupabaseError(error: any, context?: string): void {
  if (!error) return

  if (isNetworkError(error)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database connection temporarily unavailable',
      data: { error: error.message || error }
    })
  }

  if (context) {
    console.error(`[${context}] Error:`, error)
  }

  if (error.statusCode) throw error

  throw createError({
    statusCode: 500,
    statusMessage: `Database error: ${error.message || error}`,
    data: error
  })
}
