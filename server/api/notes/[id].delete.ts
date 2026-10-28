import { defineEventHandler, getRouterParam, createError } from 'h3'
import { removeItem } from '../../utils/store'
import { getSupabaseClient } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Note ID is required' })
  }

  const supabase = getSupabaseClient()
  if (supabase) {
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', id)

    if (!error) {
      return { success: true, id }
    }
  }

  const success = await removeItem('project_notes', id)
  return { success, id }
})
