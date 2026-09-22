<template>
  <div class="space-y-6">
    <!-- Header & Context -->
    <SprintHeader
      :is-current-week="isCurrentWeek"
      @prev-week="goToPrevWeek"
      @current-week="goToCurrentWeek"
      @next-week="goToNextWeek"
      @open-modal="openModalWithTab"
    />

    <!-- Feedback Toast -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <div
        v-if="feedbackMessage"
        class="p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 shadow-lg"
        :class="feedbackType === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-[#C98A4B]/10 border-[#C98A4B]/30 text-[#C98A4B]'"
        role="status"
      >
        <div class="flex items-center gap-2">
          <span>{{ feedbackType === 'error' ? '⚠️' : '✓' }}</span>
          <span>{{ feedbackMessage }}</span>
        </div>
        <button type="button" class="text-xs hover:underline shrink-0 cursor-pointer" @click="feedbackMessage = ''">✕</button>
      </div>
    </transition>

    <!-- Weekly Objective Banner -->
    <SprintObjectiveBanner
      :objective="currentObjective"
      @save="onSaveObjective"
    />

    <!-- Solo Telemetry 4-Column Bento Strip -->
    <WeeklyMetricsBento
      :week-label="weekLabel"
      :remaining-days-text="remainingDaysText"
      :completion-percentage="completionPercentage"
      :completed-count="completedCount"
      :total-deliverables-count="totalDeliverablesCount"
      :in-flight-count="inFlightCount"
      :pending-count="pendingCount"
    />

    <!-- Interactive Weekly Deliverables Matrix -->
    <DeliverablesMatrix
      v-model:filter="deliverablesFilter"
      v-model:search-query="deliverablesSearchQuery"
      :deliverables="filteredDeliverables"
      :total-targets-count="activeWeekTasks.length"
      :in-flight-count="inFlightCount"
      :pending-count="pendingCount"
      :completed-count="completedCount"
      @open-modal="openModalWithTab"
      @reset-filters="resetFilters"
      @update-status="updateTaskStatus"
      @remove-task="removeTaskFromWeek"
    />

    <!-- Add Target to This Week Modal -->
    <AddTargetModal
      v-if="showAddTargetModal"
      :initial-tab="activeModalTab"
      :week-label="weekLabel"
      :unassigned-tasks="unassignedBacklogTasks"
      :projects="projects || []"
      :submitting="isSubmittingDeliverable"
      @close="showAddTargetModal = false"
      @add-existing="addExistingTaskToWeek"
      @create-deliverable="onCreateDeliverable"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Sprint, Task, TaskStatus, TaskPriority, Project } from '~/types'

// Composables
const sprintsApi = useSprints()
const tasksApi = useTasks()
const projectsApi = useProjects()
const {
  weekOffset,
  baseDate,
  currentMonday,
  currentSunday,
  weekNum,
  isCurrentWeek,
  weekLabel,
  remainingDaysText,
  goToPrevWeek,
  goToNextWeek,
  goToCurrentWeek,
  toIsoDate
} = useSprintCalendar()

// Server Data Fetching
const { data: sprints, refresh: refreshSprints } = useLazyAsyncData<Sprint[]>(
  'sprints',
  () => sprintsApi.getSprints()
)

const { data: tasks, refresh: refreshTasks } = useLazyAsyncData<Task[]>(
  'tasks-all',
  () => tasksApi.getTasks()
)

const { data: projects } = useLazyAsyncData<Project[]>(
  'projects-list',
  () => projectsApi.getProjects()
)

// Active Sprint & Deliverables Linkage
const activeSprint = computed<Sprint | undefined>(() => {
  const list = sprints.value ?? []
  if (!list.length) return undefined

  const mondayIso = toIsoDate(currentMonday.value)
  const sundayIso = toIsoDate(currentSunday.value)

  const dateMatch = list.find((s) => {
    if (!s.startDate || !s.endDate) return false
    return s.startDate <= sundayIso && s.endDate >= mondayIso
  })
  if (dateMatch) return dateMatch

  const nameMatch = list.find((s) => s.name?.includes(`Week ${weekNum.value}`))
  if (nameMatch) return nameMatch

  if (weekOffset.value === 0) {
    const active = list.find((s) => s.status === 'active')
    if (active) return active
    return list[0]
  }

  return undefined
})

const activeWeekTasks = computed<Task[]>(() => {
  const allTasks = tasks.value ?? []
  if (!allTasks.length) return []

  const mondayIso = toIsoDate(currentMonday.value)
  const sundayIso = toIsoDate(currentSunday.value)

  if (activeSprint.value) {
    const sId = activeSprint.value.id
    const taskIds = activeSprint.value.taskIds || []
    return allTasks.filter((t) => {
      if (t.sprintId === sId || taskIds.includes(t.id)) return true
      if (t.dueDate && t.dueDate >= mondayIso && t.dueDate <= sundayIso) return true
      return false
    })
  }

  return allTasks.filter((t) => t.dueDate && t.dueDate >= mondayIso && t.dueDate <= sundayIso)
})

async function ensureSprintForCurrentWeek(): Promise<Sprint> {
  if (activeSprint.value) return activeSprint.value

  const mondayIso = toIsoDate(currentMonday.value)
  const sundayIso = toIsoDate(currentSunday.value)
  const newSprint = await sprintsApi.createSprint({
    name: weekLabel.value,
    startDate: mondayIso,
    endDate: sundayIso,
    status: 'active',
    objective: currentObjective.value
  })
  if (newSprint) {
    if (sprints.value) {
      sprints.value = [newSprint, ...sprints.value]
    } else {
      sprints.value = [newSprint]
    }
  }
  await refreshSprints()
  return newSprint
}

// Objective
const DEFAULT_OBJECTIVE = 'Finalize core architecture deliverables and stabilize live production pipelines.'
const activeWeekKey = computed(() => `week_${weekNum.value}_${currentMonday.value.getFullYear()}`)

const currentObjective = computed<string>(() => {
  if (activeSprint.value?.objective) {
    return activeSprint.value.objective
  }
  if (import.meta.client) {
    const saved = localStorage.getItem(`weekly_objective_${activeWeekKey.value}`)
    if (saved) return saved
  }
  return DEFAULT_OBJECTIVE
})

async function onSaveObjective(text: string) {
  const finalObj = text.trim() || DEFAULT_OBJECTIVE
  if (import.meta.client) {
    localStorage.setItem(`weekly_objective_${activeWeekKey.value}`, finalObj)
  }

  try {
    if (activeSprint.value?.id) {
      await sprintsApi.updateSprint(activeSprint.value.id, { objective: finalObj })
    } else {
      await ensureSprintForCurrentWeek()
    }
    showFeedback('Weekly objective updated')
    await refreshSprints()
  } catch (err: any) {
    showFeedback('Failed to update objective: ' + (err.message || 'Unknown error'), 'error')
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

async function updateTaskStatus(task: Task, newStatus: TaskStatus) {
  if (task.status === newStatus) return
  const oldStatus = task.status
  task.status = newStatus
  if (tasks.value) tasks.value = [...tasks.value]

  try {
    await tasksApi.updateTask(task.id, { status: newStatus })
    const statusLabels: Record<TaskStatus, string> = {
      in_queue: 'In Queue',
      running_sprint: 'Running',
      deployed: 'Deployed',
      blocked: 'Error'
    }
    showFeedback(`#${task.taskId || 'Task'} marked as ${statusLabels[newStatus]}`)
    await Promise.all([refreshTasks(), refreshSprints()])
  } catch (err: any) {
    task.status = oldStatus
    if (tasks.value) tasks.value = [...tasks.value]
    showFeedback('Failed to update status: ' + (err.message || 'Unknown error'), 'error')
  }
}

async function removeTaskFromWeek(task: Task) {
  try {
    task.sprintId = ''
    if (activeSprint.value && activeSprint.value.taskIds) {
      activeSprint.value.taskIds = activeSprint.value.taskIds.filter((id) => id !== task.id)
    }
    if (tasks.value) tasks.value = [...tasks.value]
    if (sprints.value) sprints.value = [...sprints.value]

    await tasksApi.updateTask(task.id, { sprintId: '' })
    if (activeSprint.value) {
      const remainingIds = (activeSprint.value.taskIds || []).filter((id) => id !== task.id)
      await sprintsApi.updateSprint(activeSprint.value.id, { taskIds: remainingIds })
    }
    showFeedback(`Returned #${task.taskId || 'Task'} to general backlog`)
    await Promise.all([refreshTasks(), refreshSprints()])
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
  const all = tasks.value || []
  const currentAssignedIds = new Set(activeWeekTasks.value.map((t) => t.id))
  return all.filter((t) => !currentAssignedIds.has(t.id) && t.status !== 'deployed')
})

async function addExistingTaskToWeek(bt: Task) {
  try {
    const sprint = await ensureSprintForCurrentWeek()
    bt.sprintId = sprint.id
    const currentTaskIds = Array.isArray(sprint.taskIds) ? [...sprint.taskIds] : []
    if (!currentTaskIds.includes(bt.id)) {
      currentTaskIds.push(bt.id)
      sprint.taskIds = currentTaskIds
    }
    if (tasks.value) tasks.value = [...tasks.value]
    if (sprints.value) {
      const sIdx = sprints.value.findIndex((s) => s.id === sprint.id)
      if (sIdx !== -1) {
        sprints.value[sIdx] = { ...sprint, taskIds: currentTaskIds }
        sprints.value = [...sprints.value]
      }
    }

    await tasksApi.updateTask(bt.id, { sprintId: sprint.id })
    await sprintsApi.updateSprint(sprint.id, { taskIds: currentTaskIds })
    showFeedback(`Added #${bt.taskId || 'Task'} to ${weekLabel.value}`)
    await Promise.all([refreshTasks(), refreshSprints()])
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

    if (newTask) {
      const currentList = tasks.value ? [...tasks.value] : []
      const filtered = currentList.filter((t) => t.id !== newTask.id)
      tasks.value = [newTask, ...filtered]

      if (sprint) {
        const currentTaskIds = Array.isArray(sprint.taskIds) ? [...sprint.taskIds] : []
        if (!currentTaskIds.includes(newTask.id)) {
          currentTaskIds.push(newTask.id)
          sprint.taskIds = currentTaskIds
        }

        if (sprints.value) {
          const sIdx = sprints.value.findIndex((s) => s.id === sprint.id)
          if (sIdx !== -1) {
            sprints.value[sIdx] = { ...sprint, taskIds: currentTaskIds }
            sprints.value = [...sprints.value]
          } else {
            sprints.value = [sprint, ...sprints.value]
          }
        }

        await sprintsApi.updateSprint(sprint.id, { taskIds: currentTaskIds })
      }
    }

    showAddTargetModal.value = false
    showFeedback(`Created #${newTask?.taskId || 'deliverable'} and committed to focus`)
    await Promise.all([refreshTasks(), refreshSprints()])
  } catch (err: any) {
    showFeedback('Failed to create deliverable: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    isSubmittingDeliverable.value = false
  }
}
</script>
