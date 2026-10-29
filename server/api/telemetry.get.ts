import { taskRepository, projectRepository, sprintRepository, noteRepository, isSupabaseActive } from '../repositories'
import { withApiHandler } from '../utils/handler'
import { githubFetch } from '../utils/github'
import { getSupabaseClient } from '../utils/supabase'

export default withApiHandler(async () => {
  const config = useRuntimeConfig()

  // 1. Storage metrics across all 4 entity repositories
  const [tasks, projects, sprints, notes] = await Promise.all([
    taskRepository.findAll(),
    projectRepository.findAll(),
    sprintRepository.findAll(),
    noteRepository.findAll()
  ])

  // 2. GitHub API rate limit
  let githubStatus = {
    configured: Boolean(config.githubToken),
    username: config.public?.githubUsername || 'bagja-iskandar',
    rateLimit: {
      limit: 60,
      remaining: 60,
      reset: Math.floor(Date.now() / 1000) + 3600
    },
    error: null as string | null
  }

  try {
    const headers: Record<string, string> = {}
    if (config.githubToken) {
      headers.Authorization = `Bearer ${config.githubToken}`
    }
    const rateData: any = await githubFetch('/rate_limit', { headers })
    if (rateData?.resources?.core) {
      githubStatus.rateLimit = {
        limit: rateData.resources.core.limit,
        remaining: rateData.resources.core.remaining,
        reset: rateData.resources.core.reset
      }
    }
  } catch (err: any) {
    githubStatus.error = err.message || 'Unable to reach GitHub API'
  }

  // 3. Supabase live probe with AbortController and latency measurement
  let supabaseLatency: number | null = null
  let supabaseStatus = 'Not Configured'
  let supabaseHealthy = false
  let supabaseError: string | null = null

  const supabaseClient = getSupabaseClient()
  const supabaseConfigured = Boolean(supabaseClient)
  const supabaseActive = isSupabaseActive()

  if (!supabaseClient) {
    supabaseStatus = 'Not Configured'
  } else {
    const timeoutMs = 3000
    const latencyThresholdMs = 300
    const controller = new AbortController()
    const timerId = setTimeout(() => controller.abort(), timeoutMs)
    const start = performance.now()

    try {
      const { error } = await supabaseClient
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .abortSignal(controller.signal)

      clearTimeout(timerId)

      if (error) {
        throw error
      }

      supabaseLatency = Math.round(performance.now() - start)
      supabaseHealthy = true
      supabaseStatus = supabaseLatency < latencyThresholdMs ? 'Healthy' : 'Degraded'
    } catch (err: any) {
      clearTimeout(timerId)
      supabaseHealthy = false

      if (controller.signal.aborted || err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('timeout')) {
        supabaseStatus = 'Connection Timeout'
        supabaseError = `Probe exceeded ${timeoutMs}ms limit`
      } else if (err?.code === 'PGRST301' || String(err?.message || '').includes('JWT') || err?.status === 401 || err?.status === 403) {
        supabaseStatus = 'Authentication Error'
        supabaseError = err.message || 'Invalid Supabase API key or RLS rejection'
      } else {
        supabaseStatus = 'Unreachable'
        supabaseError = err.message || 'Network connection failed'
      }
    }
  }

  // 4. Honest Vercel runtime and environment detection
  const isVercelRuntime = Boolean(process.env.VERCEL === '1')
  const nodeEnv = process.env.NODE_ENV || 'development'
  const vercelEnv = process.env.VERCEL_ENV || (isVercelRuntime ? 'production' : 'development')
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || null
  const vercelConfigured = Boolean(config.vercelToken || isVercelRuntime)

  return {
    environment: nodeEnv,
    storage: {
      provider: supabaseActive ? 'Supabase PostgreSQL (Cloud)' : 'Nitro KV (Local)',
      routing: supabaseActive ? 'supabase' : 'nitro_kv',
      path: supabaseActive ? 'Remote PostgreSQL' : '.data/kv/',
      counts: {
        tasks: tasks.length,
        projects: projects.length,
        sprints: sprints.length,
        notes: notes.length
      }
    },
    github: githubStatus,
    supabase: {
      provider: 'Supabase PostgreSQL',
      configured: supabaseConfigured,
      active: supabaseActive,
      healthy: supabaseHealthy,
      latencyMs: supabaseLatency,
      status: supabaseStatus,
      error: supabaseError,
      url: config.supabaseUrl
        ? String(config.supabaseUrl).replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^[^.]+\./, '***.')
        : 'Not Configured'
    },
    vercel: {
      provider: 'Vercel Edge Platform',
      configured: vercelConfigured,
      status: isVercelRuntime ? `Live (${vercelEnv})` : 'Offline (Local Development)',
      url: isVercelRuntime && vercelUrl ? String(vercelUrl).replace(/^https?:\/\//, '') : null,
      isRuntime: isVercelRuntime
    }
  }
})
