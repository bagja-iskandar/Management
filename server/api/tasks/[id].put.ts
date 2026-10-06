import { taskRepository, sprintRepository } from '../../repositories'
import { withApiHandler } from '../../utils/handler'
import { validateBody } from '../../schemas/helper'
import { updateTaskSchema } from '../../schemas/task.schema'

export default withApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Task ID is required' })
  }

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

      // Sinkronkan juga sprint.taskIds jika ada
      const currentTaskIds = Array.isArray(activeSprint.taskIds) ? [...activeSprint.taskIds] : []
      if (!currentTaskIds.includes(existing.id)) {
        currentTaskIds.push(existing.id)
        await sprintRepository.update(activeSprint.id, { taskIds: currentTaskIds })
      }
    }
  }

  const updated = await taskRepository.update(id, patch)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found' })
  }

  return updated
})
