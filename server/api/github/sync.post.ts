import { withApiHandler } from '../../utils/handler'
import { createGitHubClient } from '../../utils/github'
import { taskRepository, projectRepository } from '../../repositories'
import { assertGitHubRepoAllowed, normalizeGitHubRepo } from '../../utils/github-allowlist'
import { reconcileTaskWithPr } from '../../utils/github-sync'

export default withApiHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const token = (config.githubToken || '').trim()

  if (!token) {
    return {
      ok: false,
      message: 'GitHub token not configured on server',
      syncedCount: 0
    }
  }

  const defaultOwner = (config.githubUsername || 'bagja-iskandar').trim()

  // 1. Fetch current workspace tasks and projects
  const [tasks, projects] = await Promise.all([
    taskRepository.findAll(),
    projectRepository.findAll()
  ])

  // 2. Resolve unique, allowlisted GitHub repositories from projects
  const rawRepos = projects
    .map((p) => p.githubRepo?.trim())
    .filter((r): r is string => Boolean(r))

  const uniqueRepos = Array.from(new Set(rawRepos))
  const allowedRepos: string[] = []

  for (const repo of uniqueRepos) {
    try {
      const normalized = await assertGitHubRepoAllowed(repo, event)
      allowedRepos.push(normalized)
    } catch {
      // Unallowed or malformed repository skipped
    }
  }

  // Fallback: if no project repos, check default repository
  if (allowedRepos.length === 0) {
    try {
      const defaultRepo = await assertGitHubRepoAllowed(`${defaultOwner}/Management`, event)
      allowedRepos.push(defaultRepo)
    } catch {
      // Default repo not allowed or failed
    }
  }

  const client = createGitHubClient(token)
  let deployedCount = 0
  let linkedCount = 0
  const updatedTaskIds: string[] = []

  // 3. Fetch PRs across all allowed repositories
  const allPullRequests: any[] = []

  for (const repo of allowedRepos) {
    try {
      const prs = await client.fetch<any[]>(`/repos/${repo}/pulls?state=all&per_page=30`)
      if (Array.isArray(prs)) {
        allPullRequests.push(...prs)
      }
    } catch (err) {
      console.warn(`[github-sync] Error fetching pull requests for repo ${repo}:`, err)
    }
  }

  // 4. Reconcile tasks against pull requests
  for (const pr of allPullRequests) {
    for (const task of tasks) {
      const result = reconcileTaskWithPr(task, pr)
      if (!result) continue

      if (result.action === 'deployed') {
        await taskRepository.update(task.id, {
          status: 'deployed',
          githubPrUrl: result.prUrl
        })
        task.status = 'deployed'
        task.githubPrUrl = result.prUrl
        deployedCount++
        updatedTaskIds.push(task.taskId || task.name)
      } else if (result.action === 'linked') {
        await taskRepository.update(task.id, {
          githubPrUrl: result.prUrl
        })
        task.githubPrUrl = result.prUrl
        linkedCount++
        updatedTaskIds.push(task.taskId || task.name)
      }
    }
  }

  return {
    ok: true,
    deployedCount,
    linkedCount,
    updatedTasks: Array.from(new Set(updatedTaskIds)),
    timestamp: new Date().toISOString()
  }
})
