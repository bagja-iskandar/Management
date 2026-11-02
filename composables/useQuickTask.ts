import type { TaskStatus } from '~/types'

export interface TaskModalContext {
  projectSlug?: string | null
  status?: TaskStatus
}

export function useQuickTask() {
  const isAddTaskOpen = useState<boolean>('global-add-task-open', () => false)
  const isAddIdeaOpen = useState<boolean>('global-add-idea-open', () => false)
  const isAddProjectOpen = useState<boolean>('global-add-project-open', () => false)
  const taskContext = useState<TaskModalContext>('global-task-context', () => ({}))

  function openAddTask(projectSlug?: string | null, status?: TaskStatus) {
    taskContext.value = {
      projectSlug: projectSlug || null,
      status: status || 'in_queue'
    }
    isAddTaskOpen.value = true
  }

  function closeAddTask() {
    isAddTaskOpen.value = false
  }

  function openAddIdea(projectSlug?: string | null) {
    taskContext.value = {
      projectSlug: projectSlug || null,
      status: 'idea'
    }
    isAddIdeaOpen.value = true
  }

  function closeAddIdea() {
    isAddIdeaOpen.value = false
  }

  function openAddProject() {
    isAddProjectOpen.value = true
  }

  function closeAddProject() {
    isAddProjectOpen.value = false
  }

  return {
    isAddTaskOpen,
    isAddIdeaOpen,
    taskContext,
    openAddTask,
    closeAddTask,
    openAddIdea,
    closeAddIdea,
    isAddProjectOpen,
    openAddProject,
    closeAddProject
  }
}
