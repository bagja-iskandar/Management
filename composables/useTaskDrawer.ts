import { computed } from 'vue'
import { useWorkspaceStore } from './useWorkspaceStore'
import type { Task } from '~/types'

export function useTaskDrawer() {
  const isDrawerOpen = useState<boolean>('task_drawer:open', () => false)
  const activeTaskId = useState<string | null>('task_drawer:active_id', () => null)

  const { tasks } = useWorkspaceStore()

  const activeTask = computed<Task | null>(() => {
    if (!activeTaskId.value) return null
    return (
      tasks.value.find(
        (t) => t.id === activeTaskId.value || t.taskId === activeTaskId.value
      ) || null
    )
  })

  function openTaskDrawer(taskId: string) {
    activeTaskId.value = taskId
    isDrawerOpen.value = true
  }

  function closeTaskDrawer() {
    isDrawerOpen.value = false
    activeTaskId.value = null
  }

  return {
    isDrawerOpen,
    activeTaskId,
    activeTask,
    openTaskDrawer,
    closeTaskDrawer
  }
}
