import type { ITaskRepository, TaskFilterOptions } from '../contracts/task.repository'
import type { Task } from '~/types'
import { getSupabaseClient } from '../../utils/supabase'

function mapTaskRow(row: any): Task {
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

function mapTaskToRow(t: Partial<Task>): Record<string, any> {
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

export class SupabaseTaskRepository implements ITaskRepository {
  private get client() {
    const c = getSupabaseClient()
    if (!c) throw new Error('Supabase client is not configured.')
    return c
  }

  async findAll(filters?: TaskFilterOptions): Promise<Task[]> {
    let query = this.client
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.projectSlug) {
      query = query.ilike('project_slug', filters.projectSlug.trim())
    }

    if (filters?.priority) {
      query = query.eq('priority', String(filters.priority).trim().toLowerCase())
    }

    if (filters?.status) {
      query = query.eq('status', String(filters.status).trim().toLowerCase())
    }

    if (filters?.sprintId) {
      query = query.eq('sprint_id', filters.sprintId.trim())
    }

    const { data, error } = await query
    if (error) {
      console.error('[SupabaseTaskRepository.findAll] Error:', error)
      return []
    }

    return (data || []).map(mapTaskRow)
  }

  async findById(id: string): Promise<Task | null> {
    const clean = id.trim()
    const isEng = clean.toUpperCase().startsWith('ENG-') || clean.startsWith('#')
    const cleanTaskId = clean.replace(/^#/, '').toUpperCase()

    let query = this.client.from('tasks').select('*')
    if (isEng) {
      query = query.or(`id.eq.${clean},task_id.eq.${cleanTaskId}`)
    } else {
      query = query.eq('id', clean)
    }

    const { data, error } = await query.maybeSingle()
    if (error) {
      console.error('[SupabaseTaskRepository.findById] Error:', error)
      return null
    }

    return data ? mapTaskRow(data) : null
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'taskId'> & { taskId?: string }): Promise<Task> {
    const taskId = taskData.taskId || (await this.nextTaskId())
    const row = mapTaskToRow({
      ...taskData,
      taskId
    })
    row.created_at = new Date().toISOString()
    row.updated_at = new Date().toISOString()

    const { data, error } = await this.client
      .from('tasks')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error('[SupabaseTaskRepository.create] Error:', error)
      throw new Error(`Failed to create task in Supabase: ${error.message}`)
    }

    return mapTaskRow(data)
  }

  async update(id: string, patch: Partial<Task>): Promise<Task | null> {
    const clean = id.trim()
    const isEng = clean.toUpperCase().startsWith('ENG-') || clean.startsWith('#')
    const cleanTaskId = clean.replace(/^#/, '').toUpperCase()

    const row = mapTaskToRow(patch)
    row.updated_at = new Date().toISOString()

    let query = this.client.from('tasks').update(row)
    if (isEng) {
      query = query.or(`id.eq.${clean},task_id.eq.${cleanTaskId}`)
    } else {
      query = query.eq('id', clean)
    }

    const { data, error } = await query.select().maybeSingle()
    if (error) {
      console.error('[SupabaseTaskRepository.update] Error:', error)
      return null
    }

    return data ? mapTaskRow(data) : null
  }

  async delete(id: string): Promise<boolean> {
    const clean = id.trim()
    const isEng = clean.toUpperCase().startsWith('ENG-') || clean.startsWith('#')
    const cleanTaskId = clean.replace(/^#/, '').toUpperCase()

    let query = this.client.from('tasks').delete()
    if (isEng) {
      query = query.or(`id.eq.${clean},task_id.eq.${cleanTaskId}`)
    } else {
      query = query.eq('id', clean)
    }

    const { error } = await query
    if (error) {
      console.error('[SupabaseTaskRepository.delete] Error:', error)
      return false
    }

    return true
  }

  async nextTaskId(): Promise<string> {
    const { data, error } = await this.client
      .from('tasks')
      .select('task_id')

    if (error || !data || data.length === 0) {
      return 'ENG-001'
    }

    let maxNum = 0
    for (const row of data) {
      const match = String(row.task_id || '').match(/(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    }

    return 'ENG-' + String(maxNum + 1).padStart(3, '0')
  }
}
