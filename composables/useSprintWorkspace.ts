import { ref, computed } from 'vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useSprints } from '~/composables/useSprints'
import { useTasks } from '~/composables/useTasks'
import {
  useSprintCalendar,
  getSunday,
  getWeekNumber,
  toIsoDate
} from '~/composables/useSprintCalendar'
import type { Sprint, Task, TaskStatus, TaskPriority } from '~/types'

export const DEFAULT_OBJECTIVE = 'Finalize core architecture deliverables and stabilize live production pipelines.'

export function useSprintWorkspace() {
  const workspaceStore = useWorkspaceStore()
  const sprintsApi = useSprints()
  const tasksApi = useTasks()

  const calendar = useSprintCalendar()
  const {
    weekOffset,
    currentMonday,
    currentSunday,
    weekNum,
    isCurrentWeek,
    weekLabel,
    remainingDaysText,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek
  } = calendar

  // GitHub Sync and Rollover States
  const isSyncingGitHub = ref(false)
  const isRolloverModalOpen = ref(false)
  const isRollingOver = ref(false)

  // Deterministic 4-State Machine with Cache Resilience
  const sprintsDataState = computed<'LOADING' | 'ERROR' | 'SUCCESS_EMPTY' | 'READY'>(() => {
    const sprintsList = workspaceStore.sprints.value || []
    const hasSprints = sprintsList.length > 0
    const sprintsHydration = workspaceStore.hydrationStatus.value.sprints

    if (hasSprints) {
      return 'READY'
    }
    if (sprintsHydration === 'error') {
      return 'ERROR'
    }
    if (!workspaceStore.isInitialized.value || sprintsHydration === 'loading') {
      return 'LOADING'
    }
    return 'SUCCESS_EMPTY'
  })

  const isStaleDataWarning = computed(() => {
    return (
      workspaceStore.hydrationStatus.value.sprints === 'error' &&
      (workspaceStore.sprints.value || []).length > 0
    )
  })

  // Deterministic Active Sprint Resolution Hierarchy
  const activeSprint = computed<Sprint | undefined>(() => {
    const list = workspaceStore.sprints.value ?? []
    if (!list.length) return undefined

    const mondayIso = toIsoDate(currentMonday.value)
    const sundayIso = toIsoDate(currentSunday.value)
    const currentYear = currentMonday.value.getFullYear()

    // Level 1: ISO date interval intersection
    const dateMatch = list.find((s) => {
      if (!s.startDate || !s.endDate) return false
      return s.startDate <= sundayIso && s.endDate >= mondayIso
    })
    if (dateMatch) return dateMatch

    // Level 2: Year and week-number qualified name match
    const nameMatch = list.find((s) => {
      if (!s.name) return false
      return s.name.includes(`Week ${weekNum.value}`) && s.name.includes(String(currentYear))
    })
    if (nameMatch) return nameMatch

    // Level 3: Active status fallback ONLY for current week
    if (weekOffset.value === 0) {
      const activeMatch = list.find((s) => s.status === 'active')
      if (activeMatch) return activeMatch
    }

    // Level 4: Fallback undefined
    return undefined
  })

  // Deliverable Single Source of Truth
  const activeWeekTasks = computed<Task[]>(() => {
    const sId = activeSprint.value?.id
    if (!sId) return []
    return (workspaceStore.tasks.value || []).filter(
      (t) => t.sprintId === sId || (activeSprint.value?.taskIds && activeSprint.value.taskIds.includes(t.id))
    )
  })

  // Incomplete deliverables in active week
  const incompleteDeliverables = computed<Task[]>(() => {
    return activeWeekTasks.value.filter((t) => t.status !== 'deployed')
  })

  // Next Week Calendar Geometry
  const nextWeekMonday = computed(() => {
    const d = new Date(currentMonday.value)
    d.setDate(d.getDate() + 7)
    return d
  })
  const nextWeekSunday = computed(() => getSunday(nextWeekMonday.value))
  const nextWeekNum = computed(() => getWeekNumber(nextWeekMonday.value))

  const nextWeekLabel = computed(() => {
    const start = nextWeekMonday.value
    const end = nextWeekSunday.value
    const startDay = start.getDate()
    const endDay = end.getDate()
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const startYear = start.getFullYear()
    const endYear = end.getFullYear()

    if (startYear !== endYear) {
      return `Week ${nextWeekNum.value} • ${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`
    }
    if (startMonth !== endMonth) {
      return `Week ${nextWeekNum.value} • ${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`
    }
    return `Week ${nextWeekNum.value} • ${startDay}–${endDay} ${startMonth} ${startYear}`
  })

  async function ensureSprintForWeek(monday: Date, sunday: Date, label: string): Promise<Sprint> {
    const mondayIso = toIsoDate(monday)
    const sundayIso = toIsoDate(sunday)
    const weekNumber = getWeekNumber(monday)
    const year = monday.getFullYear()

    const list = workspaceStore.sprints.value || []
    const existing = list.find((s) => {
      if (s.startDate && s.endDate && s.startDate <= sundayIso && s.endDate >= mondayIso) {
        return true
      }
      if (s.name && s.name.includes(`Week ${weekNumber}`) && s.name.includes(String(year))) {
        return true
      }
      return false
    })

    if (existing) {
      return existing
    }

    const newSprint = await sprintsApi.createSprint({
      name: label,
      startDate: mondayIso,
      endDate: sundayIso,
      status: 'active',
      objective: DEFAULT_OBJECTIVE
    })
    return newSprint
  }

  async function ensureSprintForCurrentWeek(customObjective?: string): Promise<Sprint> {
    if (activeSprint.value) return activeSprint.value

    const mondayIso = toIsoDate(currentMonday.value)
    const sundayIso = toIsoDate(currentSunday.value)
    const newSprint = await sprintsApi.createSprint({
      name: weekLabel.value,
      startDate: mondayIso,
      endDate: sundayIso,
      status: 'active',
      objective: customObjective || currentObjective.value
    })
    return newSprint
  }

  // Objective Management
  const isSavingObjective = ref(false)

  const currentObjective = computed<string>(() => {
    return activeSprint.value?.objective || DEFAULT_OBJECTIVE
  })

  async function onSaveObjective(text: string) {
    if (isSavingObjective.value) return
    isSavingObjective.value = true

    const finalObj = text.trim() || DEFAULT_OBJECTIVE

    try {
      if (activeSprint.value?.id) {
        await sprintsApi.updateSprint(activeSprint.value.id, { objective: finalObj })
      } else {
        await ensureSprintForCurrentWeek(finalObj)
      }
      showFeedback('Weekly objective updated')
    } catch (err: any) {
      showFeedback('Failed to update objective: ' + (err.message || 'Unknown error'), 'error')
    } finally {
      isSavingObjective.value = false
    }
  }

  // Metrics
  const completedTasks = computed(() => activeWeekTasks.value.filter((t) => t.status === 'deployed'))
  const inFlightTasks = computed(() => activeWeekTasks.value.filter((t) => t.status === 'running_sprint'))
  const pendingTasks = computed(() => activeWeekTasks.value.filter((t) => t.status === 'in_queue' || t.status === 'blocked'))

  const totalDeliverablesCount = computed(() => activeWeekTasks.value.length)
  const completedCount = computed(() => completedTasks.value.length)
  const inFlightCount = computed(() => inFlightTasks.value.length)
  const pendingCount = computed(() => pendingTasks.value.length)

  const completionPercentage = computed(() => {
    if (totalDeliverablesCount.value === 0) return 0
    return Math.round((completedCount.value / totalDeliverablesCount.value) * 100)
  })

  // Filter & Search
  const deliverablesFilter = ref<'all' | 'running' | 'queue' | 'deployed'>('all')
  const deliverablesSearchQuery = ref('')

  const filteredDeliverables = computed(() => {
    let list = activeWeekTasks.value

    if (deliverablesFilter.value === 'running') {
      list = list.filter((t) => t.status === 'running_sprint')
    } else if (deliverablesFilter.value === 'queue') {
      list = list.filter((t) => t.status === 'in_queue' || t.status === 'blocked')
    } else if (deliverablesFilter.value === 'deployed') {
      list = list.filter((t) => t.status === 'deployed')
    }

    if (deliverablesSearchQuery.value.trim()) {
      const q = deliverablesSearchQuery.value.toLowerCase().trim()
      list = list.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.taskId?.toLowerCase().includes(q) ||
          t.projectSlug?.toLowerCase().includes(q) ||
          (t.techTags || []).some((tag) => tag.toLowerCase().includes(q))
      )
    }
    return list
  })

  function resetFilters() {
    deliverablesFilter.value = 'all'
    deliverablesSearchQuery.value = ''
  }

  // Toast Feedback
  const feedbackMessage = ref('')
  const feedbackType = ref<'success' | 'error'>('success')
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null

  function showFeedback(msg: string, type: 'success' | 'error' = 'success') {
    feedbackMessage.value = msg
    feedbackType.value = type
    if (feedbackTimer) clearTimeout(feedbackTimer)
    feedbackTimer = setTimeout(() => {
      feedbackMessage.value = ''
    }, 4000)
  }

  // Task Status and Lifecycle via Tasks API (SSOT)
  async function updateTaskStatus(task: Task, newStatus: TaskStatus) {
    if (task.status === newStatus) return

    try {
      await tasksApi.updateTask(task.id, { status: newStatus })
      const statusLabels: Record<TaskStatus, string> = {
        idea: 'Idea',
        in_queue: 'In Queue',
        running_sprint: 'Running',
        deployed: 'Deployed',
        blocked: 'Blocked'
      }
      showFeedback(`#${task.taskId || 'Task'} marked as ${statusLabels[newStatus]}`)
    } catch (err: any) {
      showFeedback('Failed to update status: ' + (err.message || 'Unknown error'), 'error')
    }
  }

  async function removeTaskFromWeek(task: Task) {
    try {
      await tasksApi.updateTask(task.id, { sprintId: '' })
      showFeedback(`Returned #${task.taskId || 'Task'} to general backlog`)
    } catch (err: any) {
      showFeedback('Failed to remove task: ' + (err.message || 'Unknown error'), 'error')
    }
  }

  // Modal State & Handlers
  const showAddTargetModal = ref(false)
  const activeModalTab = ref<'backlog' | 'create'>('backlog')
  const isSubmittingDeliverable = ref(false)

  function openModalWithTab(tab: 'backlog' | 'create') {
    activeModalTab.value = tab
    showAddTargetModal.value = true
  }

  const unassignedBacklogTasks = computed(() => {
    const all = workspaceStore.tasks.value || []
    const currentAssignedIds = new Set(activeWeekTasks.value.map((t) => t.id))
    return all.filter((t) => !currentAssignedIds.has(t.id) && t.status !== 'deployed')
  })

  async function addExistingTaskToWeek(bt: Task) {
    try {
      const sprint = await ensureSprintForCurrentWeek()
      await tasksApi.updateTask(bt.id, { sprintId: sprint.id })
      showFeedback(`Added #${bt.taskId || 'Task'} to ${weekLabel.value}`)
    } catch (err: any) {
      showFeedback('Failed to assign task: ' + (err.message || 'Unknown error'), 'error')
    }
  }

  async function onCreateDeliverable(payload: {
    name: string
    projectSlug: string
    priority: TaskPriority
    status: TaskStatus
    dueDate?: string
    techTags: string[]
  }) {
    isSubmittingDeliverable.value = true
    try {
      const sprint = await ensureSprintForCurrentWeek()
      const deliverableDueDate = payload.dueDate || toIsoDate(currentSunday.value)

      const newTask = await tasksApi.createTask({
        name: payload.name.trim(),
        projectSlug: payload.projectSlug || 'management',
        priority: payload.priority,
        status: payload.status,
        techTags: payload.techTags,
        sprintId: sprint.id,
        dueDate: deliverableDueDate,
        date: toIsoDate(new Date())
      })

      showAddTargetModal.value = false
      showFeedback(`Created #${newTask?.taskId || 'deliverable'} and committed to focus`)
    } catch (err: any) {
      showFeedback('Failed to create deliverable: ' + (err.message || 'Unknown error'), 'error')
    } finally {
      isSubmittingDeliverable.value = false
    }
  }

  // GitHub Sync Action
  async function onSyncGitHub() {
    if (isSyncingGitHub.value) return
    isSyncingGitHub.value = true

    try {
      const res = await $fetch<{
        success?: boolean
        syncedCount?: number
        deployedCount?: number
        message?: string
      }>('/api/github/sync', { method: 'POST' })

      const synced = res?.syncedCount ?? 0
      const deployed = res?.deployedCount ?? 0
      showFeedback(res?.message || `GitHub Sync: ${synced} deliverables updated, ${deployed} deployed`)
      await workspaceStore.initializeWorkspace(true)
    } catch (err: any) {
      showFeedback(`GitHub sync failed: ${err.message || 'Network error'}`, 'error')
    } finally {
      isSyncingGitHub.value = false
    }
  }

  // Sprint Rollover Action
  async function onConfirmRollover(markCurrentCompleted: boolean) {
    if (isRollingOver.value || incompleteDeliverables.value.length === 0) return
    isRollingOver.value = true

    try {
      // 1. Ensure target next week's sprint exists
      const targetSprint = await ensureSprintForWeek(
        nextWeekMonday.value,
        nextWeekSunday.value,
        nextWeekLabel.value
      )

      // 2. Mutate incomplete deliverables to target sprint
      const tasksToMove = [...incompleteDeliverables.value]
      for (const task of tasksToMove) {
        await tasksApi.updateTask(task.id, { sprintId: targetSprint.id })
      }

      // 3. Mark current sprint as completed if checkbox was enabled
      if (markCurrentCompleted && activeSprint.value?.id) {
        await sprintsApi.updateSprint(activeSprint.value.id, { status: 'completed' })
      }

      showFeedback(`Successfully rolled over ${tasksToMove.length} deliverable${tasksToMove.length > 1 ? 's' : ''} to next sprint`)
      isRolloverModalOpen.value = false
    } catch (err: any) {
      showFeedback(`Rollover failed: ${err.message || 'Unknown error'}`, 'error')
    } finally {
      isRollingOver.value = false
    }
  }

  return {
    workspaceStore,
    calendar,
    weekOffset,
    currentMonday,
    currentSunday,
    weekNum,
    isCurrentWeek,
    weekLabel,
    remainingDaysText,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
    isSyncingGitHub,
    isRolloverModalOpen,
    isRollingOver,
    sprintsDataState,
    isStaleDataWarning,
    activeSprint,
    activeWeekTasks,
    incompleteDeliverables,
    nextWeekMonday,
    nextWeekSunday,
    nextWeekNum,
    nextWeekLabel,
    ensureSprintForWeek,
    ensureSprintForCurrentWeek,
    isSavingObjective,
    currentObjective,
    onSaveObjective,
    completedTasks,
    inFlightTasks,
    pendingTasks,
    totalDeliverablesCount,
    completedCount,
    inFlightCount,
    pendingCount,
    completionPercentage,
    deliverablesFilter,
    deliverablesSearchQuery,
    filteredDeliverables,
    resetFilters,
    feedbackMessage,
    feedbackType,
    showFeedback,
    updateTaskStatus,
    removeTaskFromWeek,
    showAddTargetModal,
    activeModalTab,
    isSubmittingDeliverable,
    openModalWithTab,
    unassignedBacklogTasks,
    addExistingTaskToWeek,
    onCreateDeliverable,
    onSyncGitHub,
    onConfirmRollover
  }
}
