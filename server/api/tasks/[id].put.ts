import { createError } from 'h3'
import { taskRepository, sprintRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import { validateBody, requireRouterParam } from '../../schemas/helper'
import { updateTaskSchema } from '../../schemas/task.schema'

export default withApiHandler(async (event) => {
  const id = requireRouterParam(event, 'id', 'Task ID')

  const patch = await validateBody(event, updateTaskSchema)
  const existing = await taskRepository.findById(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  // AUTO-BIND: Jika task beralih ke 'running_sprint' dan belum punya sprintId
  if (patch.status === 'running_sprint' && !existing.sprintId && !patch.sprintId) {
    const allSprints = await sprintRepository.findAll()
    const nowIso = new Date().toISOString().slice(0, 10)

    // Cari sprint aktif yang mencakup tanggal hari ini, atau fallback ke sprint active manapun
    const activeSprint =
      allSprints.find(
        (s) =>
          s.status === 'active' &&
          (!s.startDate || s.startDate <= nowIso) &&
          (!s.endDate || s.endDate >= nowIso)
      ) || allSprints.find((s) => s.status === 'active')

    if (activeSprint) {
      patch.sprintId = activeSprint.id
    }
  }

  const updated = await taskRepository.update(id, patch)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return updated
})
