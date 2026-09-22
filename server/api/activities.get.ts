import { taskRepository } from '../repositories'
import { withApiHandler } from '../utils/handler'

export default withApiHandler(async () => {
  const tasks = await taskRepository.findAll()

  return tasks
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((t) => ({ id: t.id, name: t.name, status: t.status, date: t.date }))
})
