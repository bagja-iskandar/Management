import { defineEventHandler, getQuery } from 'h3'
import { getArray } from '../../utils/store'
import { getSupabaseClient } from '../../utils/supabase'
import type { ProjectNote } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectSlug = query.projectSlug ? String(query.projectSlug) : undefined

  // Supabase if available
  const supabase = getSupabaseClient()
  if (supabase) {
    let q = supabase
      .from('project_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectSlug) {
      q = q.eq('project_slug', projectSlug)
    }

    const { data, error } = await q
    if (!error && data) {
      return data.map((item: any): ProjectNote => ({
        id: item.id,
        projectSlug: item.project_slug,
        category: item.category,
        content: item.content,
        promotedTaskId: item.promoted_task_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    }
  }

  // Fallback to storage adapter
  const notes = await getArray<ProjectNote>('project_notes')
  if (projectSlug) {
    return notes.filter((n) => n.projectSlug === projectSlug)
  }
  return notes
})
