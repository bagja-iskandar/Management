<template>
  <div class="h-full flex flex-col gap-4 min-h-0">
    <!-- Top Alert Bar (Only shown if blockers or overdue/due tomorrow exist) -->
    <AlertBar
      :blocked-tasks="blockedTasks"
      :urgent-tasks="urgentTasks"
      @task-click="openTaskModal"
    />

    <!-- Error State -->
    <div
      v-if="tasksError || projectsError"
      class="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between text-xs text-red-400 font-mono shrink-0"
      role="alert"
    >
      <span>Failed to synchronize mission briefing data from server.</span>
      <button type="button" class="underline hover:no-underline font-medium" @click="refreshData">Retry</button>
    </div>

    <!-- Main Content Area: Stacked & Bento Grid Layout -->
    <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 pb-4">
      <!-- 1. Global Recent Commits Stream Table (Full width / Lebih panjang, max 6 items) -->
      <GlobalCommitsTable
        :projects="activeProjects"
      />

      <!-- 2. Middle Row: Priority Tasks Radar (7 cols) + Compact Projects Hub (5 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div class="lg:col-span-7">
          <!-- High Priority & Error Tasks Radar (Max 6 items) -->
          <PriorityTasksRadar
            :tasks="tasks || []"
            @task-click="openTaskModal"
          />
        </div>
        <div class="lg:col-span-5">
          <!-- Compact Projects Command Hub (Bento) -->
          <CompactProjectsHub
            :projects="activeProjects"
            :tasks="tasks || []"
            @create-project="showAddProjectModal = true"
          />
        </div>
      </div>

      <!-- 3. Bottom: Weekly Focus & In-Flight Snapshot (Moved to bottom per user request) -->
      <WeeklyFocusSnapshot
        :tasks="tasks || []"
        :sprint="activeSprint"
        @task-click="openTaskModal"
      />
    </div>

    <!-- Centered Full-Rounded Task Modal -->
    <TaskDrawer
      v-if="activeDrawerTask"
      :task="activeDrawerTask"
      :busy="isBusy"
      @close="activeDrawerTask = null"
      @save="onSaveDrawerTask"
      @delete="deleteTaskFromDrawer"
    />

    <!-- Add Task Modal -->
    <AddTaskModal
      v-if="showAddTaskModal"
      :initial-status="selectedStatus"
      :projects="projectOptions"
      @close="showAddTaskModal = false"
      @create="onTaskModalCreated"
    />

    <!-- Add Project Modal -->
    <AddProjectModal
      v-if="showAddProjectModal"
      @close="showAddProjectModal = false"
      @create="onProjectModalCreated"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmDialog
      v-if="confirmOpen"
      title="Delete Task Deliverable"
      :message="`Are you sure you want to permanently delete '${confirmTarget?.name}'? This action cannot be reversed.`"
      confirm-text="Delete Deliverable"
      cancel-text="Keep Task"
      :busy="isBusy"
      @confirm="onConfirmDelete"
      @cancel="confirmOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskStatus, Project, Sprint } from '../types'
import AlertBar from './AlertBar.vue'
import GlobalCommitsTable from './dashboard/GlobalCommitsTable.vue'
import PriorityTasksRadar from './dashboard/PriorityTasksRadar.vue'
import WeeklyFocusSnapshot from './dashboard/WeeklyFocusSnapshot.vue'
import CompactProjectsHub from './dashboard/CompactProjectsHub.vue'
import TaskDrawer from './TaskDrawer.vue'
import AddTaskModal from './AddTaskModal.vue'
import AddProjectModal from './AddProjectModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'

// Composables
const tasksApi = useTasks()
const projectsApi = useProjects()
const sprintsApi = useSprints()

// State
const isBusy = ref(false)
const showAddTaskModal = ref(false)
const showAddProjectModal = ref(false)
const selectedStatus = ref<TaskStatus>('in_queue')
const activeDrawerTask = ref<Task | null>(null)
const confirmOpen = ref(false)
const confirmTarget = ref<Task | null>(null)

// Fetch tasks
const { data: tasks, error: tasksError, refresh: refreshTasks } = useLazyAsyncData<Task[]>(
  'tasks-data',
  () => tasksApi.getTasks()
)

// Fetch projects
const { data: projects, error: projectsError, pending, refresh: refreshProjects } = useLazyAsyncData<Project[]>(
  'projects-data',
  () => projectsApi.getProjects()
)

// Fetch sprints
const { data: sprints, refresh: refreshSprints } = useLazyAsyncData<Sprint[]>(
  'sprints-data',
  () => sprintsApi.getSprints()
)

const activeSprint = computed(() => {
  if (!sprints.value || sprints.value.length === 0) return null
  return sprints.value.find((s) => s.status === 'active') || sprints.value[0] || null
})

const activeProjects = computed(() => {
  return (projects.value || []).filter(
    (p) => p.status === 'active' || !p.status
  )
})

const projectOptions = computed(() => {
  return (projects.value || []).map((p) => ({
    slug: p.slug,
    title: p.title
  }))
})

// Blocked Tasks (across all active projects)
const blockedTasks = computed(() => {
  if (!tasks.value) return []
  return tasks.value.filter((t) => t.status === 'blocked')
})

// Critical Tasks Count (excluding deployed)
const criticalTasksCount = computed(() => {
  if (!tasks.value) return 0
  return tasks.value.filter((t) => t.priority === 'critical' && t.status !== 'deployed').length
})

// Urgent / Overdue Tasks (across all active projects)
const urgentTasks = computed(() => {
  if (!tasks.value) return []
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const list: { task: Task; label: string }[] = []

  for (const t of tasks.value) {
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

function openTaskModal(task: Task) {
  activeDrawerTask.value = task
}

async function refreshData() {
  isBusy.value = true
  try {
    await Promise.all([refreshTasks(), refreshProjects(), refreshSprints()])
  } finally {
    isBusy.value = false
  }
}

async function onSaveDrawerTask(payload: Partial<Task>) {
  if (!activeDrawerTask.value) return
  const currentId = activeDrawerTask.value.id
  isBusy.value = true

  // Optimistic update in-memory (0ms)
  if (tasks.value) {
    tasks.value = tasks.value.map(t => t.id === currentId ? { ...t, ...payload } : t)
  }

  try {
    await tasksApi.updateTask(currentId, payload)
    activeDrawerTask.value = null
    await refreshData()
  } catch (err) {
    console.error('Failed to save drawer task:', err)
  } finally {
    isBusy.value = false
  }
}

function deleteTaskFromDrawer(task: Task) {
  activeDrawerTask.value = null
  confirmTarget.value = task
  confirmOpen.value = true
}

async function onConfirmDelete() {
  if (!confirmTarget.value) return
  const deleteId = confirmTarget.value.id
  isBusy.value = true

  // Optimistic deletion in-memory (0ms)
  if (tasks.value) {
    tasks.value = tasks.value.filter(t => t.id !== deleteId)
  }

  try {
    await tasksApi.deleteTask(deleteId)
    confirmOpen.value = false
    confirmTarget.value = null
    await refreshData()
  } catch (err) {
    console.error('Failed to delete task:', err)
  } finally {
    isBusy.value = false
  }
}

async function onTaskModalCreated(data: any) {
  isBusy.value = true
  try {
    const created = await tasksApi.createTask({
      name: data.name,
      description: data.description,
      projectSlug: data.projectSlug,
      status: data.status || 'in_queue',
      priority: data.priority || 'medium',
      techTags: data.techTags || [],
      dueDate: data.dueDate
    })

    // Instant optimistic in-memory insertion (0ms)
    if (created) {
      if (tasks.value) {
        tasks.value = [created, ...tasks.value.filter(t => t.id !== created.id)]
      } else {
        tasks.value = [created]
      }
    }

    showAddTaskModal.value = false
    await refreshData()
  } catch (err) {
    console.error('Failed to create task:', err)
  } finally {
    isBusy.value = false
  }
}

async function onProjectModalCreated(data: any) {
  isBusy.value = true
  const title = (data.title || data.name || '').trim()
  const derivedSlug = (data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `proj-${Date.now()}`).trim()

  try {
    const created = await projectsApi.createProject({
      title,
      slug: derivedSlug,
      description: data.description,
      status: data.status || 'active',
      priority: data.priority || 'medium',
      githubRepo: data.githubRepo,
      deployUrl: data.deployUrl,
      techStack: data.techStack || []
    })

    // Instant optimistic in-memory insertion (0ms)
    const newProj = created || {
      id: String(Date.now()),
      slug: derivedSlug,
      title,
      description: data.description,
      status: data.status || 'active',
      priority: data.priority || 'medium',
      githubRepo: data.githubRepo,
      deployUrl: data.deployUrl,
      techStack: data.techStack || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (projects.value) {
      projects.value = [newProj, ...projects.value.filter(p => p.slug !== newProj.slug)]
    } else {
      projects.value = [newProj]
    }

    showAddProjectModal.value = false
    await refreshData()
  } catch (err) {
    console.error('Failed to create project:', err)
  } finally {
    isBusy.value = false
  }
}
</script>
