import { getQuery } from 'h3'
import { withApiHandler } from '../../utils/handler'
import { noteRepository } from '../../repositories'
import type { NoteCategory } from '~/types'

export default withApiHandler(async (event) => {
  const query = getQuery(event)
  const projectSlug = query.projectSlug ? String(query.projectSlug) : undefined
  const category = query.category ? (String(query.category) as NoteCategory) : undefined

  return await noteRepository.findAll(projectSlug, category)
})
