/**
 * Server Utility: GitHub Sync & Sprint Rollover Automation
 *
 * Implements:
 * - ENG code extraction with boundary safety and normalization
 * - PR reconciliation with automated task status transition to deployed
 * - Sprint rollover filtering and mutex protection
 */

export interface GitHubPullRequestInfo {
  number: number
  title: string
  body?: string | null
  state: 'open' | 'closed'
  merged: boolean
  merged_at?: string | null
  html_url: string
}

export interface TaskSyncCandidate {
  id: string
  taskId?: string
  name: string
  status: 'idea' | 'in_queue' | 'running_sprint' | 'deployed' | 'blocked'
  projectSlug?: string
  sprintId?: string
  githubPrUrl?: string | null
  githubIssueUrl?: string | null
  [key: string]: any
}

export interface ReconciliationResult {
  action: 'deployed' | 'linked' | 'already_deployed' | 'ignored'
  task: TaskSyncCandidate
  patch: Partial<TaskSyncCandidate>
}

/**
 * Extracts distinct ENG-xxx codes from commit messages, PR titles, or bodies.
 * Normalizes to uppercase 'ENG-<number>'.
 * Enforces boundary safety to avoid false positives (e.g. SPENG-123 or ENGINEERING-456).
 */
export function extractEngCodes(text?: string | null): string[] {
  if (!text || typeof text !== 'string') {
    return []
  }

  const regex = /\bENG-(\d+)\b/gi
  const codes: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    codes.push(`ENG-${match[1]}`)
  }

  return Array.from(new Set(codes))
}

/**
 * Reconciles a single task against a pull request, returning an action descriptor
 * compatible with server/api/github/sync.post.ts.
 */
export function reconcileTaskWithPr(
  task: TaskSyncCandidate,
  pr: GitHubPullRequestInfo
): { action: 'deployed' | 'linked'; prUrl: string; taskId: string } | null {
  const codes = extractEngCodes(`${pr.title} ${pr.body || ''}`)
  const taskCode = (task.taskId || task.name || '').trim().toUpperCase()

  const isMatched = codes.some((code) => {
    return taskCode === code || taskCode.includes(code)
  })

  if (!isMatched) {
    return null
  }

  const isMerged = Boolean(pr.merged || pr.merged_at)

  if (isMerged) {
    if (task.status === 'deployed') {
      return null
    }
    return {
      action: 'deployed',
      prUrl: pr.html_url,
      taskId: task.taskId || task.id
    }
  }

  if (pr.state === 'open') {
    if (task.githubPrUrl === pr.html_url) {
      return null
    }
    return {
      action: 'linked',
      prUrl: pr.html_url,
      taskId: task.taskId || task.id
    }
  }

  return null
}

/**
 * Reconciles a GitHub Pull Request against a target deliverable task.
 *
 * Rules:
 * - Merged PR: transitions task to 'deployed' (if not already deployed) and attaches githubPrUrl.
 * - Open PR: links githubPrUrl without changing status to 'deployed'.
 * - Closed (unmerged) PR: does NOT deploy task.
 * - Already deployed task: does NOT re-trigger deployed mutation.
 */
export function reconcilePrWithTask(
  pr: GitHubPullRequestInfo,
  task: TaskSyncCandidate
): ReconciliationResult {
  const isMerged = Boolean(pr.merged || pr.merged_at)

  if (isMerged) {
    if (task.status === 'deployed') {
      const patch: Partial<TaskSyncCandidate> = {}
      if (!task.githubPrUrl && pr.html_url) {
        patch.githubPrUrl = pr.html_url
      }
      return { action: 'already_deployed', task, patch }
    }

    return {
      action: 'deployed',
      task,
      patch: {
        status: 'deployed',
        githubPrUrl: pr.html_url
      }
    }
  }

  if (pr.state === 'open') {
    if (task.githubPrUrl === pr.html_url) {
      return { action: 'ignored', task, patch: {} }
    }
    return {
      action: 'linked',
      task,
      patch: {
        githubPrUrl: pr.html_url
      }
    }
  }

  // Closed without merge: do not transition to deployed
  return { action: 'ignored', task, patch: {} }
}

/**
 * Filters deliverables eligible for sprint rollover.
 * Strictly selects tasks where status !== 'deployed'.
 */
export function filterRolloverTasks(tasks: TaskSyncCandidate[]): TaskSyncCandidate[] {
  return (tasks || []).filter((t) => t.status !== 'deployed')
}

/**
 * Executes sprint rollover mutation payload generation.
 * Moves incomplete tasks to target sprint and closes source sprint.
 */
export function buildSprintRolloverPayload(
  sourceSprintId: string,
  targetSprintId: string,
  sourceTasks: TaskSyncCandidate[]
) {
  const rolloverTasks = filterRolloverTasks(sourceTasks)
  const taskUpdates = rolloverTasks.map((t) => ({
    id: t.id,
    patch: { sprintId: targetSprintId }
  }))

  const sourceSprintUpdate = {
    id: sourceSprintId,
    patch: { status: 'completed' as const }
  }

  return {
    rolloverCount: rolloverTasks.length,
    taskUpdates,
    sourceSprintUpdate
  }
}
