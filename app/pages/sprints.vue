<template>
  <div class="space-y-6">
    <!-- ================================================================= -->
    <!-- STATE 1: LOADING SKELETON BENTO LOADER                            -->
    <!-- ================================================================= -->
    <div
      v-if="sprintsDataState === 'LOADING'"
      class="space-y-6 animate-pulse select-none"
      role="status"
      aria-label="Loading sprints workspace"
    >
      <!-- Skeleton Header -->
      <div class="obs-card p-6 rounded-2xl bg-[#111318] border border-white/[0.07] space-y-4">
        <div class="h-6 bg-white/[0.08] rounded w-1/4"></div>
        <div class="h-4 bg-white/[0.04] rounded w-1/2"></div>
      </div>

      <!-- Skeleton Objective Banner -->
      <div class="obs-card p-4 rounded-xl bg-[#111318] border border-white/[0.07] space-y-2">
        <div class="h-4 bg-white/[0.08] rounded w-1/6"></div>
        <div class="h-4 bg-white/[0.04] rounded w-3/4"></div>
      </div>

      <!-- Skeleton Metrics Bento -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
      </div>

      <!-- Skeleton Matrix -->
      <div class="h-64 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 2: CONNECTION ERROR CARD                                    -->
    <!-- ================================================================= -->
    <div
      v-else-if="sprintsDataState === 'ERROR'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-rose-500/30 p-8 space-y-4 max-w-lg mx-auto my-12"
      role="alert"
    >
      <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
        <NexuraIcon name="AlertTriangle" size="lg" />
      </div>
      <h2 class="font-mono text-lg font-semibold text-[#F3F4F6]">Connection Failed</h2>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">
        Failed to synchronize sprint telemetry from the server.
      </p>
      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#F3F4F6] border border-white/[0.08] transition-colors cursor-pointer"
          @click="workspaceStore.initializeWorkspace(true)"
        >
          <NexuraIcon name="RefreshCw" size="xs" />
          <span>Retry</span>
        </button>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 3: GLOBAL EMPTY STATE CARD                                  -->
    <!-- ================================================================= -->
    <div
      v-else-if="sprintsDataState === 'SUCCESS_EMPTY'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-white/[0.08] p-8 space-y-4 max-w-lg mx-auto my-12"
    >
      <div class="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
        <NexuraIcon name="Target" size="lg" />
      </div>
      <h2 class="font-mono text-lg font-semibold text-[#F3F4F6]">No Sprint Cycles Found</h2>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">
        No active or planned sprint cycles currently exist in this workspace. Initialize your first cycle to track weekly execution.
      </p>
      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white font-semibold transition-colors cursor-pointer"
          @click="ensureSprintForCurrentWeek()"
        >
          <NexuraIcon name="Zap" size="xs" />
          <span>Initialize Week {{ weekNum }} Sprint</span>
        </button>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 4: READY STATE (FULL SPRINT WORKSPACE)                      -->
    <!-- ================================================================= -->
    <div v-else-if="sprintsDataState === 'READY'" class="space-y-6">
      <!-- Stale Data Warning Banner -->
      <div
        v-if="isStaleDataWarning"
        class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono flex items-center justify-between"
        role="status"
      >
        <div class="flex items-center gap-2">
          <NexuraIcon name="AlertTriangle" size="xs" class="text-amber-400" />
          <span>Warning: Displaying cached sprint telemetry. Background synchronization failed.</span>
        </div>
        <button
          type="button"
          class="text-xs underline hover:no-underline font-medium cursor-pointer"
          @click="workspaceStore.initializeWorkspace(true)"
        >
          Retry Sync
        </button>
      </div>

      <!-- Header & Context -->
      <SprintHeader
        :is-current-week="isCurrentWeek"
        :week-label="weekLabel"
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
          :class="feedbackType === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'"
          role="status"
        >
          <div class="flex items-center gap-2">
            <NexuraIcon
              :name="feedbackType === 'error' ? 'AlertTriangle' : 'CheckCircle2'"
              size="sm"
              class="shrink-0"
              :class="feedbackType === 'error' ? 'text-rose-400' : 'text-emerald-400'"
            />
            <span>{{ feedbackMessage }}</span>
          </div>
          <button
            type="button"
            class="text-xs hover:opacity-80 shrink-0 cursor-pointer p-1 rounded hover:bg-white/[0.04]"
            aria-label="Dismiss feedback"
            @click="feedbackMessage = ''"
          >
            <NexuraIcon name="X" size="xs" />
          </button>
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
        :week-offset="weekOffset"
        @return-current-week="goToCurrentWeek"
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
        :projects="workspaceStore.projects.value || []"
        :submitting="isSubmittingDeliverable"
        @close="showAddTargetModal = false"
        @add-existing="addExistingTaskToWeek"
        @create-deliverable="onCreateDeliverable"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useSprints } from '~/composables/useSprints'
import { useTasks } from '~/composables/useTasks'
import { useSprintCalendar } from '~/composables/useSprintCalendar'
import type { Sprint, Task, TaskStatus, TaskPriority } from '~/types'

// Single Source of Truth Workspace Store
const workspaceStore = useWorkspaceStore()
const sprintsApi = useSprints()
const tasksApi = useTasks()

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
  goToCurrentWeek,
  toIsoDate
} = useSprintCalendar()

// Initialize workspace on mount if not yet initialized
onMounted(async () => {
  if (!workspaceStore.isInitialized.value) {
    await workspaceStore.initializeWorkspace()
  }
})

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
  return workspaceStore.hydrationStatus.value.sprints === 'error' && (workspaceStore.sprints.value || []).length > 0
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

  // Level 4: Fallback undefined (DeliverablesMatrix renders contextual empty state)
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

// Objective Management (Zero localStorage)
const DEFAULT_OBJECTIVE = 'Finalize core architecture deliverables and stabilize live production pipelines.'
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
</script>
