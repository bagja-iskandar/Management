import type { Task, Project, Sprint, ProjectNote } from '~/types'
import type { CreateNoteInput, UpdateNoteInput } from '../../schemas/note.schema'

export function mapTaskRow(row: any): Task {
  return {
    id: row.id,
    taskId: row.task_id,
    projectSlug: row.project_slug || undefined,
    name: row.name,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    techTags: Array.isArray(row.tech_tags) ? row.tech_tags : [],
    dueDate: row.due_date || undefined,
    sprintId: row.sprint_id || undefined,
    date: row.date || (row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    githubIssueUrl: row.github_issue_url || undefined,
    githubIssueNumber: row.github_issue_number || undefined,
    githubPrUrl: row.github_pr_url || undefined
  }
}

export function mapTaskToRow(t: Partial<Task>): Record<string, any> {
  const row: Record<string, any> = {}
  if (t.taskId !== undefined) row.task_id = t.taskId
  if (t.projectSlug !== undefined) row.project_slug = t.projectSlug || null
  if (t.name !== undefined) row.name = t.name
  if (t.description !== undefined) row.description = t.description
  if (t.status !== undefined) row.status = t.status
  if (t.priority !== undefined) row.priority = t.priority
  if (t.techTags !== undefined) row.tech_tags = t.techTags
  if (t.dueDate !== undefined) row.due_date = t.dueDate || null
  if (t.sprintId !== undefined) row.sprint_id = t.sprintId || null
  if (t.date !== undefined) row.date = t.date
  if (t.githubIssueUrl !== undefined) row.github_issue_url = t.githubIssueUrl || null
  if (t.githubIssueNumber !== undefined) row.github_issue_number = t.githubIssueNumber || null
  if (t.githubPrUrl !== undefined) row.github_pr_url = t.githubPrUrl || null
  return row
}

export function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    githubRepo: row.github_repo || undefined,
    deployUrl: row.deploy_url || undefined,
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    startDate: row.start_date || undefined,
    dueDate: row.due_date || undefined,
    releasePhase: row.release_phase || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function mapProjectToRow(p: Partial<Project>): Record<string, any> {
  const row: Record<string, any> = {}
  if (p.slug !== undefined) row.slug = p.slug
  if (p.title !== undefined) row.title = p.title
  if (p.description !== undefined) row.description = p.description
  if (p.status !== undefined) row.status = p.status
  if (p.priority !== undefined) row.priority = p.priority
  if (p.githubRepo !== undefined) row.github_repo = p.githubRepo
  if (p.deployUrl !== undefined) row.deploy_url = p.deployUrl
  if (p.techStack !== undefined) row.tech_stack = p.techStack
  if (p.startDate !== undefined) row.start_date = p.startDate || null
  if (p.dueDate !== undefined) row.due_date = p.dueDate || null
  if (p.releasePhase !== undefined) row.release_phase = p.releasePhase || null
  return row
}

export function mapSprintRow(row: any): Sprint {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    taskIds: Array.isArray(row.task_ids) ? row.task_ids : [],
    velocity: row.velocity !== null && row.velocity !== undefined ? Number(row.velocity) : undefined,
    objective: row.objective || undefined,
    createdAt: row.created_at
  }
}

export function mapSprintToRow(s: Partial<Sprint>): Record<string, any> {
  const row: Record<string, any> = {}
  if (s.name !== undefined) row.name = s.name
  if (s.status !== undefined) row.status = s.status
  if (s.startDate !== undefined) row.start_date = s.startDate
  if (s.endDate !== undefined) row.end_date = s.endDate
  if (s.taskIds !== undefined) row.task_ids = s.taskIds
  if (s.velocity !== undefined) row.velocity = s.velocity
  if (s.objective !== undefined) row.objective = s.objective
  return row
}

export function mapNoteRow(row: any): ProjectNote {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    category: row.category,
    content: row.content || '',
    promotedTaskId: row.promoted_task_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function mapNoteToRow(
  n: Partial<ProjectNote> | Partial<CreateNoteInput> | Partial<UpdateNoteInput>
): Record<string, any> {
  const row: Record<string, any> = {}
  if (n.projectSlug !== undefined) row.project_slug = n.projectSlug
  if (n.category !== undefined) row.category = n.category
  if (n.content !== undefined) row.content = n.content
  if (n.promotedTaskId !== undefined) row.promoted_task_id = n.promotedTaskId
  return row
}
