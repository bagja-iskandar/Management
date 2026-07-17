import { removeItem } from '../../utils/store'
import { withApiHandler } from '../../utils/handler'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const removed = await removeItem('tasks', id)
  if (!removed) throw createError({ statusCode: 404, statusMessage: 'task not found' })
  return { ok: true }
})
