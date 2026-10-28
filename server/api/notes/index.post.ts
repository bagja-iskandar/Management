import { defineEventHandler } from 'h3'
import { validateBody } from '../../schemas/helper'
import { createNoteSchema } from '../../schemas/note.schema'
import { createItem } from '../../utils/store'
import { getSupabaseClient } from '../../utils/supabase'
import type { ProjectNote } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, createNoteSchema)
  const now = new Date().toISOString()

  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('project_notes')
      .insert({
        project_slug: body.projectSlug,
        category: body.category,
        content: body.content,
        promoted_task_id: body.promotedTaskId || null
      })
      .select()
      .single()

    if (!error && data) {
      return {
        id: data.id,
        projectSlug: data.project_slug,
        category: data.category,
        content: data.content,
        promotedTaskId: data.promoted_task_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as ProjectNote
    }
  }

  // Fallback to storage adapter
  const created = await createItem<ProjectNote>('project_notes', {
    projectSlug: body.projectSlug,
    category: body.category,
    content: body.content,
    promotedTaskId: body.promotedTaskId || null
  })

  return created
})
