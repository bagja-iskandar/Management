<template>
  <div class="space-y-4 pb-6 select-none xl:h-full xl:flex xl:flex-col xl:min-h-0">
    <!-- Header -->
    <div class="flex items-center justify-between pb-0.5 shrink-0">
      <h1 class="text-xl sm:text-2xl font-semibold text-[#F3F4F6] tracking-tight font-sans">
        Command Center
      </h1>
    </div>

    <!-- Top Alert Bar (Only shown if blockers or overdue/due tomorrow exist) -->
    <AlertBar
      :blocked-tasks="blockedTasks"
      :urgent-tasks="urgentTasks"
      class="shrink-0"
      @task-click="openTaskModal"
    />

    <!-- Error State -->
    <div
      v-if="tasksDataState === 'ERROR'"
      class="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between text-xs text-red-400 font-mono shrink-0"
      role="alert"
    >
      <div class="flex items-center gap-2">
        <NexuraIcon name="AlertTriangle" size="sm" class="text-rose-400 shrink-0" />
        <span>Failed to synchronize mission briefing data from server.</span>
      </div>
      <button type="button" class="underline hover:no-underline font-medium cursor-pointer" @click="refreshData">Retry</button>
    </div>

    <!-- UNIFIED HERO BANNER (Weekly Focus + 4 KPI Metrics) -->
    <UnifiedHeroBanner
      :tasks="workspaceStore.tasks.value || []"
      :sprint="activeSprint"
      :projects="activeProjects"
      :ci-workflow-count="0"
      :ci-success-rate="null"
      :open-pr-count="openPrCount"
      class="shrink-0"
    />

    <!-- ASYMMETRIC BENTO GRID (8 Cols Left + 4 Cols Right) -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0">
      <!-- 8 Kolom Kiri: Chart (Atas) + Live DevOps Stream (Bawah) -->
      <div class="xl:col-span-8 flex flex-col space-y-4 min-h-0">
        <ProjectExecutionOverview
          :projects="activeProjects"
          :tasks="workspaceStore.tasks.value || []"
          class="shrink-0"
        />
        <LiveDevOpsStream
          :projects="activeProjects"
          class="flex-1 min-h-[200px]"
        />
      </div>

      <!-- 4 Kolom Kanan: Recent Shipments (Atas) + Mesh (Tengah) + Pulse (Bawah) -->
      <div class="xl:col-span-4 flex flex-col space-y-4 min-h-0">
        <RecentShipmentsCard
          :tasks="workspaceStore.tasks.value || []"
          class="flex-1 min-h-[180px]"
          @task-click="openTaskModal"
        />
        <InfrastructureMeshCard class="shrink-0" />
        <WorkspacePulse
          :tasks="workspaceStore.tasks.value || []"
          :projects="activeProjects"
          :hydration-status="workspaceStore.hydrationStatus.value"
          class="shrink-0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Task } from '../types'
import AlertBar from './AlertBar.vue'
import LiveDevOpsStream from './dashboard/LiveDevOpsStream.vue'
import InfrastructureMeshCard from './dashboard/InfrastructureMeshCard.vue'
import RecentShipmentsCard from './dashboard/RecentShipmentsCard.vue'
import UnifiedHeroBanner from './dashboard/UnifiedHeroBanner.vue'
import ProjectExecutionOverview from './dashboard/ProjectExecutionOverview.vue'
import WorkspacePulse from './dashboard/WorkspacePulse.vue'
import NexuraIcon from './ui/NexuraIcon.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useTaskDrawer } from '~/composables/useTaskDrawer'

export type WorkspaceDataState = 'NOT_LOADED' | 'LOADING' | 'SUCCESS_WITH_DATA' | 'SUCCESS_EMPTY' | 'ERROR'

// Workspace Store SSOT
const workspaceStore = useWorkspaceStore()
const { openTaskDrawer } = useTaskDrawer()

// Local Busy State
const isBusy = ref(false)

// SSOT Data State Computed
const tasksDataState = computed<WorkspaceDataState>(() => {
  const taskStatus = workspaceStore.hydrationStatus.value.tasks
  if (taskStatus === 'error') return 'ERROR'
  if (taskStatus === 'loading' || (workspaceStore.isLoading.value && taskStatus === 'idle')) {
    return 'LOADING'
  }
  if (taskStatus === 'idle' && !workspaceStore.isInitialized.value) {
    return 'NOT_LOADED'
  }
  if (taskStatus === 'success') {
    return (workspaceStore.tasks.value || []).length === 0 ? 'SUCCESS_EMPTY' : 'SUCCESS_WITH_DATA'
  }
  return 'NOT_LOADED'
})

// Auto-hydrate workspace if not initialized
onMounted(async () => {
  if (!workspaceStore.isInitialized.value) {
    await workspaceStore.initializeWorkspace()
  }
})

// Refresh Workspace SSOT
async function refreshData() {
  isBusy.value = true
  try {
    await workspaceStore.refreshWorkspace()
  } finally {
    isBusy.value = false
  }
}

// Active Sprint SSOT
const activeSprint = computed(() => {
  const sprints = workspaceStore.sprints.value || []
  if (sprints.length === 0) return null
  return sprints.find((s) => s.status === 'active') || sprints[0] || null
})

// Active Projects SSOT
const activeProjects = computed(() => {
  return (workspaceStore.projects.value || []).filter(
    (p) => p.status === 'active' || !p.status
  )
})

// KPI Metrics: Honest Mathematical Calculations (Zero Fake Numbers)
const inFlightCount = computed(() => (workspaceStore.tasks.value || []).filter(t => t.status === 'running_sprint').length)
const highPriorityCount = computed(() => (workspaceStore.tasks.value || []).filter(t => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'deployed').length)
const deployedTasksCount = computed(() => (workspaceStore.tasks.value || []).filter(t => t.status === 'deployed').length)
const totalSprintTasksCount = computed(() => (workspaceStore.tasks.value || []).length)
const completionRate = computed(() => totalSprintTasksCount.value === 0 ? 0 : Math.round((deployedTasksCount.value / totalSprintTasksCount.value) * 100))
const openPrCount = computed(() => (workspaceStore.tasks.value || []).filter(t => Boolean(t.githubPrUrl)).length)

// Blocked Tasks SSOT
const blockedTasks = computed(() => {
  return (workspaceStore.tasks.value || []).filter((t) => t.status === 'blocked')
})

// Urgent / Overdue Tasks SSOT
const urgentTasks = computed(() => {
  const tasks = workspaceStore.tasks.value || []
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const list: { task: Task; label: string }[] = []

  for (const t of tasks) {
    if (t.status === 'deployed') continue
    if (!t.dueDate) continue

    const due = t.dueDate.slice(0, 10)
    if (due < todayStr) {
      list.push({ task: t, label: 'OVERDUE' })
    } else if (due === todayStr) {
      list.push({ task: t, label: 'due today' })
    } else if (due === tomorrowStr) {
      list.push({ task: t, label: 'due tomorrow' })
    }
  }

  return list
})

// Global Drawer Bridge
function openTaskModal(task: Task) {
  openTaskDrawer(task.id)
}
</script>
