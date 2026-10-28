export function useQuickTask() {
  const isAddTaskOpen = useState<boolean>('global-add-task-open', () => false)
  const isAddProjectOpen = useState<boolean>('global-add-project-open', () => false)

  function openAddTask() {
    isAddTaskOpen.value = true
  }

  function closeAddTask() {
    isAddTaskOpen.value = false
  }

  function openAddProject() {
    isAddProjectOpen.value = true
  }

  function closeAddProject() {
    isAddProjectOpen.value = false
  }

  return {
    isAddTaskOpen,
    openAddTask,
    closeAddTask,
    isAddProjectOpen,
    openAddProject,
    closeAddProject
  }
}
