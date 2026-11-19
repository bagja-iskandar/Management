<template>
  <div class="space-y-4 select-none xl:h-full xl:flex xl:flex-col xl:min-h-0">
    <!-- Header -->
    <div class="flex items-center justify-between pb-0.5 shrink-0">
      <h1 class="text-xl sm:text-2xl font-semibold text-foreground tracking-tight font-sans">
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
      :ci-workflow-count="ciWorkflowCount"
      :ci-success-rate="ciSuccessRate"
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
          class="flex-1 min-h-0"
        />
      </div>

      <!-- 4 Kolom Kanan: Recent Shipments (Atas) + Mesh (Tengah) + Pulse (Bawah) -->
      <div class="xl:col-span-4 flex flex-col space-y-4 min-h-0">
        <RecentShipmentsCard
          :tasks="workspaceStore.tasks.value || []"
          class="flex-1 min-h-0"
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
import { ref, computed, watch, onMounted } from 'vue'
import type { Task } from '~/types'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useTaskDrawer } from '~/composables/useTaskDrawer'
import { toIsoDate } from '~/composables/useSprintCalendar'
import { useSession } from '~/composables/useSession'

export type WorkspaceDataState = 'NOT_LOADED' | 'LOADING' | 'SUCCESS_WITH_DATA' | 'SUCCESS_EMPTY' | 'ERROR'

// Workspace Store SSOT
const workspaceStore = useWorkspaceStore()
const { openTaskDrawer } = useTaskDrawer()
const session = useSession()

// Live CI/CD Aggregation State
const ciWorkflowCount = ref(0)
const ciSuccessRate = ref<number | null>(null)

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

// Live CI/CD Aggregation Helper (Honest Live Metrics)
async function syncDashboardCiMetrics() {
  if (!session.isAuthenticated.value) {
    ciWorkflowCount.value = 0
    ciSuccessRate.value = null
    return
  }

  const rawRepos = activeProjects.value
    .map((p) => p.githubRepo?.trim())
    .filter((r): r is string => Boolean(r))
  const repos = Array.from(new Set(rawRepos)).slice(0, 5)

  if (repos.length === 0) {
    ciWorkflowCount.value = 0
    ciSuccessRate.value = null
    return
  }

  try {
    const results = await Promise.allSettled(
      repos.map((repo) => $fetch<any[]>('/api/github/workflows', { params: { repo, limit: 10 } }))
    )

    const allRuns: any[] = []
    for (const res of results) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allRuns.push(...res.value)
      }
    }

    if (allRuns.length === 0) {
      ciWorkflowCount.value = 0
      ciSuccessRate.value = null
      return
    }

    const completedRuns = allRuns.filter((r) => Boolean(r?.conclusion))
    const denom = completedRuns.length || allRuns.length
    const passed = completedRuns.filter((r) => r.conclusion === 'success').length

    ciWorkflowCount.value = allRuns.length
    ciSuccessRate.value = Math.round((passed / denom) * 100)
  } catch {
    ciWorkflowCount.value = 0
    ciSuccessRate.value = null
  }
}

// Auto-hydrate workspace if not initialized
onMounted(async () => {
  if (!workspaceStore.isInitialized.value) {
    await workspaceStore.initializeWorkspace()
  }
  await syncDashboardCiMetrics()
})

// Refresh Workspace SSOT
async function refreshData() {
  isBusy.value = true
  try {
    await Promise.allSettled([
      workspaceStore.refreshWorkspace(),
      syncDashboardCiMetrics()
    ])
  } finally {
    isBusy.value = false
  }
}

watch(
  [() => session.isAuthenticated.value, () => activeProjects.value.map((p) => p.githubRepo || '').join(',')],
  () => {
    syncDashboardCiMetrics()
  }
)

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
  const todayStr = toIsoDate(now)
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const tomorrowStr = toIsoDate(tomorrow)

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
