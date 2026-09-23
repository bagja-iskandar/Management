import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client

  const config = useRuntimeConfig()
  const rawUrl = (config.supabaseUrl || process.env.SUPABASE_URL || '').trim()
  const key = (config.supabaseKey || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '').trim()

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
