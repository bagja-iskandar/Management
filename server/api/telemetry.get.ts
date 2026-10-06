import { taskRepository, projectRepository, sprintRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'
import { githubFetch } from '../utils/github'
import { getSupabaseClient } from '../utils/supabase'

export default withApiHandler(async () => {
  const config = useRuntimeConfig()

  // 1. Storage metrics
  const tasks = await taskRepository.findAll()
  const projects = await projectRepository.findAll()
  const sprints = await sprintRepository.findAll()

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

  // 3. Supabase status
  const supabaseClient = getSupabaseClient()
  const supabaseConfigured = Boolean(supabaseClient)

  // 4. Vercel status
  const vercelConfigured = Boolean(config.vercelToken)

  return {
    storage: {
      provider: supabaseConfigured ? 'Supabase PostgreSQL (Cloud)' : 'Nitro KV (Local)',
      connected: true,
      path: supabaseConfigured ? 'Remote PostgreSQL' : '.data/kv/',
      counts: {
        tasks: tasks.length,
        projects: projects.length,
        sprints: sprints.length
      }
    },
    github: githubStatus,
    supabase: {
      provider: 'Supabase PostgreSQL',
      configured: supabaseConfigured,
      status: supabaseConfigured ? 'Connected' : 'Not Connected'
    },
    vercel: {
      provider: 'Vercel Deployment API',
      configured: vercelConfigured,
      status: vercelConfigured ? 'Connected' : 'Not Connected'
    }
  }
})
