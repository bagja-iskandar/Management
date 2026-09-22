<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
      <div>
        <div class="inline-flex items-center gap-1.5 font-mono text-xs text-[#C98A4B] bg-[#C98A4B]/10 px-2.5 py-0.5 rounded border border-[#C98A4B]/20 uppercase tracking-wider mb-2">
          <span>❖</span>
          <span>Tasks Hub</span>
        </div>
        <h1 class="font-mono text-2xl font-bold text-[#F5F2EB]">Tasks Matrix</h1>
        <p class="font-sans text-xs text-[#756F68] mt-1">Manage personal tasks, track project deliverables, and monitor milestone progress.</p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-semibold transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          @click="showAddModal = true"
        >
          <span>⊕</span>
          <span>New Task</span>
        </button>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-sans text-xs font-medium border border-white/[0.08] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
        >
          <svg class="w-3.5 h-3.5 text-[#756F68]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Success Feedback Alert -->
    <div
      v-if="successFeedback"
      class="p-3 rounded-lg bg-[#C98A4B]/10 border border-[#C98A4B]/30 text-[#C98A4B] text-xs font-mono flex items-center justify-between"
      role="status"
    >
      <span>{{ successFeedback }}</span>
      <button type="button" class="text-xs text-[#C98A4B] hover:underline" @click="successFeedback = ''">Dismiss</button>
    </div>

    <!-- Multi-Filter & Search Toolbar Card -->
    <div class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <!-- Search -->
        <div class="lg:col-span-5 relative">
          <input
            v-model="search"
            type="search"
            placeholder="Search tasks by name, ID, or description..."
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            aria-label="Search tasks"
          />
        </div>

        <!-- Project Selector -->
        <div class="lg:col-span-3">
          <select
            v-model="projectFilter"
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
            aria-label="Filter by Project"
          >
            <option value="all">📁 All Projects</option>
            <option value="management">management</option>
            <option value="tf-hitnet-eeg">tf-hitnet-eeg</option>
            <option value="neural-signal-lab">neural-signal-lab</option>
          </select>
        </div>

        <!-- Priority Selector -->
        <div class="lg:col-span-2">
          <select
            v-model="priorityFilter"
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
            aria-label="Filter by Priority"
          >
            <option value="all">⚡ All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <!-- Sort Dropdown -->
        <div class="lg:col-span-2">
          <select
            v-model="sortBy"
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
            aria-label="Sort tasks"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="priority-desc">Priority: High to Low</option>
            <option value="status">By Status</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pt-3 border-t border-white/[0.04]" role="tablist" aria-label="Task Status Filter">
        <button
          v-for="tab in [
            { id: 'all', label: 'All', count: allCount },
            { id: 'in_queue', label: 'In Queue', count: inQueueCount },
            { id: 'running_sprint', label: 'Running Sprint', count: runningSprintCount },
            { id: 'deployed', label: 'Deployed', count: deployedCount },
            { id: 'blocked', label: 'Blocked', count: blockedCount }
          ]"
          :key="tab.id"
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="statusFilter === tab.id ? 'bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/40 font-semibold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="statusFilter = tab.id as any"
        >
          <span>{{ tab.label }}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5">{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="tasksError" class="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono flex items-center justify-between" role="alert">
      <span>Failed to load tasks from server.</span>
      <button type="button" class="underline hover:no-underline" @click="refreshNuxtData('tasks-page')">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-if="!filteredTasks.length && !tasksError" class="py-16 text-center rounded-xl bg-[#111114] border border-white/[0.06] space-y-3">
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#756F68] text-xl font-mono">
        ∅
      </div>
      <h3 class="font-mono text-sm font-semibold text-[#F5F2EB]">No tasks match query</h3>
      <p class="font-sans text-xs text-[#756F68] max-w-sm mx-auto">Try resetting your status or project filters.</p>
      <button
        type="button"
        class="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-sans text-[#F5F2EB] border border-white/[0.08] transition-colors"
        @click="resetFilters"
      >
        Clear Filters
      </button>
    </div>

    <!-- Tasks Table Card -->
    <div v-else class="rounded-xl bg-[#111114] border border-white/[0.06] p-4 sm:p-5 space-y-3">
      <!-- Table Header (Desktop) -->
      <div class="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 font-mono text-xs tracking-wider uppercase text-[#756F68] border-b border-white/[0.06]">
        <span class="col-span-2">Task ID</span>
        <span class="col-span-4">Task Name & Tech</span>
        <span class="col-span-2">Project</span>
        <span class="col-span-1">Priority</span>
        <span class="col-span-1">Status</span>
        <span class="col-span-1">Date</span>
        <span class="col-span-1 text-right">Action</span>
      </div>

      <!-- Rows -->
      <div
        v-for="t in filteredTasks"
        :key="t.id"
        class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-3.5 md:px-4 rounded-lg bg-[#09090B] border border-white/[0.04] hover:border-white/[0.1] transition-colors"
      >
        <!-- Task ID Monospace -->
        <div class="col-span-2 flex items-center gap-2">
          <span class="font-mono text-xs font-semibold text-[#C98A4B] bg-[#C98A4B]/10 px-2 py-0.5 rounded border border-[#C98A4B]/20">
            #{{ formatTaskId(t) }}
          </span>
        </div>

        <!-- Task Title & Description -->
        <div class="col-span-4 min-w-0">
          <div class="font-sans text-sm font-medium text-[#F5F2EB] truncate" :title="t.name">
            {{ t.name }}
          </div>
          <div class="font-sans text-xs text-[#756F68] truncate mt-0.5" :title="t.description">
            {{ t.description || 'Milestone deliverable for personal engineering workspace.' }}
          </div>
          <!-- Tech Tags -->
          <div v-if="t.techTags?.length" class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span
              v-for="tag in t.techTags"
              :key="tag"
              class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] rounded px-1.5 py-0.2 border border-[#C98A4B]/20"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Project Badge -->
        <div class="col-span-2">
          <span class="inline-flex items-center gap-1 font-mono text-xs bg-white/5 text-[#F5F2EB] px-2 py-0.5 rounded border border-white/[0.06] truncate max-w-full">
            📁 {{ getProjectName(t) }}
          </span>
        </div>

        <!-- Priority Pill -->
        <div class="col-span-1">
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-xs uppercase"
            :class="getPriorityBadgeClass(t.priority)"
          >
            <span
              class="w-1.5 h-1.5 rounded-full bg-current"
              :class="t.priority === 'critical' ? 'animate-pulse' : ''"
              aria-hidden="true"
            ></span>
            <span>{{ t.priority || 'Medium' }}</span>
          </span>
        </div>

        <!-- Status Pill -->
        <div class="col-span-1">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono capitalize"
            :class="getStatusBadgeClass(t.status)"
          >
            {{ getStatusLabel(t.status) }}
          </span>
        </div>

        <!-- Date -->
        <div class="col-span-1 font-mono text-xs text-[#756F68] whitespace-nowrap">
          {{ formatDate(t.date || t.dueDate) }}
        </div>

        <!-- Actions -->
        <div class="col-span-1 flex items-center justify-end gap-1.5">
          <button
            type="button"
            class="p-1.5 rounded bg-white/5 hover:bg-[#C98A4B]/15 hover:text-[#C98A4B] text-[#756F68] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            :aria-label="`Toggle status for ${t.name}`"
            title="Toggle status (Queue → Sprint → Deployed)"
            @click="toggleStatus(t)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button
            type="button"
            class="p-1.5 rounded bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-[#756F68] transition-colors focus:ring-1 focus:ring-red-500 focus:outline-none"
            :aria-label="`Delete ${t.name}`"
            title="Delete task"
            @click="deleteTask(t)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Analytics Summary Panel -->
    <section class="p-5 rounded-xl bg-[#111114] border border-white/[0.06] space-y-3">
      <h2 class="font-mono text-sm font-semibold text-[#F5F2EB] uppercase tracking-wider">Tasks Analytics Summary</h2>
      <div class="flex items-center gap-3 flex-wrap font-mono text-xs">
        <span class="px-2.5 py-1 rounded bg-white/5 text-[#F5F2EB] border border-white/[0.08]">
          Total Tasks: {{ allCount }}
        </span>
        <span class="px-2.5 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30">
          Deployed: {{ deployedCount }}
        </span>
        <span class="px-2.5 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
          Running Sprint: {{ runningSprintCount }}
        </span>
        <span class="px-2.5 py-1 rounded bg-white/5 text-[#756F68] border border-white/[0.06]">
          In Queue: {{ inQueueCount }}
        </span>
        <span v-if="blockedCount > 0" class="px-2.5 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30">
          Blocked: {{ blockedCount }}
        </span>
      </div>
      <p class="font-sans text-xs text-[#756F68] leading-relaxed">
        Tasks are systematically linked with managed projects to calculate derived milestone velocities and burn-down rates.
      </p>
    </section>

    <!-- Add Task Modal Dialog -->
    <AddTaskModal
      v-if="showAddModal"
      :disabled="isBusy"
      @close="showAddModal = false"
      @create="onTaskCreated"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmDialog
      v-if="confirmOpen"
      title="Delete Task?"
      :message="`Are you sure you want to delete '${confirmTarget?.name}'? This action cannot be undone.`"
      confirmText="Delete"
      cancelText="Cancel"
      :busy="isBusy"
      @confirm="onConfirmDelete"
      @cancel="() => { confirmOpen = false; confirmTarget = null }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskPriority, TaskStatus } from '~/types'

const search = ref('')
const projectFilter = ref('all')
const priorityFilter = ref('all')
const statusFilter = ref<'all' | 'in_queue' | 'running_sprint' | 'deployed' | 'blocked'>('all')
const sortBy = ref<'date-desc' | 'date-asc' | 'priority-desc' | 'status' | 'name-asc'>('date-desc')

const showAddModal = ref(false)
const confirmOpen = ref(false)
const confirmTarget = ref<Task | null>(null)
const isBusy = ref(false)
const successFeedback = ref('')

const tasksApi = useTasks()
const { data: tasks, error: tasksError } = useLazyAsyncData<Task[]>('tasks-page', () => tasksApi.getTasks())

function formatTaskId(t: Task): string {
  if (t.taskId) return t.taskId.replace(/^#/, '')
  return `ENG-${String(t.id).slice(-3).padStart(3, '0')}`
}

function getProjectName(task: Task): string {
  if (task.projectSlug) return task.projectSlug
  const n = task.name.toLowerCase()
  if (n.includes('hitnet') || n.includes('eeg')) return 'tf-hitnet-eeg'
  if (n.includes('management') || n.includes('telemetry')) return 'management'
  if (n.includes('signal') || n.includes('impedance')) return 'neural-signal-lab'
  return 'management'
}

function getStatusLabel(status?: string): string {
  if (!status) return 'In Queue'
  const s = status.toLowerCase()
  if (s === 'deployed' || s === 'selesai') return 'Deployed'
  if (s === 'running_sprint' || s === 'proses') return 'Running Sprint'
  if (s === 'blocked') return 'Blocked'
  return 'In Queue'
}

function normalizeStatus(status?: string): TaskStatus {
  if (!status) return 'in_queue'
  const s = status.toLowerCase()
  if (s === 'deployed' || s === 'selesai') return 'deployed'
  if (s === 'running_sprint' || s === 'proses') return 'running_sprint'
  if (s === 'blocked') return 'blocked'
  return 'in_queue'
}

function getStatusBadgeClass(status?: string): string {
  const s = normalizeStatus(status)
  if (s === 'deployed') return 'bg-green-500/15 text-green-400 border border-green-500/30'
  if (s === 'running_sprint') return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
  if (s === 'blocked') return 'bg-red-500/15 text-red-400 border border-red-500/30'
  return 'bg-white/5 text-[#756F68] border border-white/[0.06]'
}

function getPriorityBadgeClass(priority?: string): string {
  const p = (priority || '').toLowerCase()
  if (p === 'critical') return 'bg-red-500/15 text-red-400 border border-red-500/30'
  if (p === 'high') return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
  if (p === 'medium') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  return 'bg-white/5 text-[#756F68] border border-white/[0.06]'
}

function formatDate(d?: string) {
  if (!d) return 'Sep 2026'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}

// Counts
const allCount = computed(() => (tasks.value ?? []).length)
const inQueueCount = computed(() => (tasks.value ?? []).filter(t => normalizeStatus(t.status) === 'in_queue').length)
const runningSprintCount = computed(() => (tasks.value ?? []).filter(t => normalizeStatus(t.status) === 'running_sprint').length)
const deployedCount = computed(() => (tasks.value ?? []).filter(t => normalizeStatus(t.status) === 'deployed').length)
const blockedCount = computed(() => (tasks.value ?? []).filter(t => normalizeStatus(t.status) === 'blocked').length)

// Filter & Sort
const filteredTasks = computed(() => {
  let list = [...(tasks.value ?? [])]

  // Status Filter
  if (statusFilter.value !== 'all') {
    list = list.filter(t => normalizeStatus(t.status) === statusFilter.value)
  }

  // Project Filter
  if (projectFilter.value !== 'all') {
    list = list.filter(t => getProjectName(t).toLowerCase() === projectFilter.value.toLowerCase())
  }

  // Priority Filter
  if (priorityFilter.value !== 'all') {
    list = list.filter(t => (t.priority || 'medium').toLowerCase() === priorityFilter.value.toLowerCase())
  }

  // Search Filter
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q) ||
      (t.taskId ?? '').toLowerCase().includes(q) ||
      getProjectName(t).toLowerCase().includes(q)
    )
  }

  // Sort
  list.sort((a, b) => {
    if (sortBy.value === 'name-asc') return a.name.localeCompare(b.name)
    if (sortBy.value === 'priority-desc') {
      const pMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
      return (pMap[b.priority || 'medium'] || 0) - (pMap[a.priority || 'medium'] || 0)
    }
    if (sortBy.value === 'status') {
      const sMap: Record<string, number> = { blocked: 4, in_queue: 3, running_sprint: 2, deployed: 1 }
      return (sMap[normalizeStatus(b.status)] || 0) - (sMap[normalizeStatus(a.status)] || 0)
    }
    if (sortBy.value === 'date-asc') {
      return (a.date || a.createdAt || '').localeCompare(b.date || b.createdAt || '')
    }
    // Default date-desc
    return (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || '')
  })

  return list
})

function resetFilters() {
  search.value = ''
  projectFilter.value = 'all'
  priorityFilter.value = 'all'
  statusFilter.value = 'all'
  sortBy.value = 'date-desc'
}

async function onTaskCreated(payload: {
  name: string
  description: string
  projectSlug: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  techTags: string[]
}) {
  isBusy.value = true
  try {
    const created = await tasksApi.createTask({
      name: payload.name,
      description: payload.description,
      projectSlug: payload.projectSlug,
      status: payload.status,
      priority: payload.priority,
      dueDate: payload.dueDate,
      techTags: payload.techTags,
      date: new Date().toISOString().slice(0, 10)
    })
    if (created && tasks.value) {
      tasks.value = [created, ...tasks.value.filter(t => t.id !== created.id)]
    }
    showAddModal.value = false
    successFeedback.value = `Task '${payload.name}' created successfully.`
    await Promise.all([
      refreshNuxtData('tasks-page'),
      refreshNuxtData('activities'),
      refreshNuxtData('stats')
    ])
    setTimeout(() => { successFeedback.value = '' }, 5000)
  } finally {
    isBusy.value = false
  }
}

async function toggleStatus(task: Task) {
  isBusy.value = true
  const current = normalizeStatus(task.status)
  // Transition: in_queue → running_sprint → deployed → in_queue (and blocked → in_queue)
  const nextMap: Record<TaskStatus, TaskStatus> = {
    in_queue: 'running_sprint',
    running_sprint: 'deployed',
    deployed: 'in_queue',
    blocked: 'in_queue'
  }
  const nextStatus = nextMap[current]

  try {
    await tasksApi.updateTask(task.id, { status: nextStatus })
    await Promise.all([
      refreshNuxtData('tasks-page'),
      refreshNuxtData('activities'),
      refreshNuxtData('stats')
    ])
  } finally {
    isBusy.value = false
  }
}

function deleteTask(task: Task) {
  confirmTarget.value = task
  confirmOpen.value = true
}

async function onConfirmDelete() {
  if (!confirmTarget.value) return
  isBusy.value = true
  try {
    await tasksApi.deleteTask(confirmTarget.value.id)
    confirmOpen.value = false
    confirmTarget.value = null
    successFeedback.value = 'Task deleted successfully.'
    await Promise.all([
      refreshNuxtData('tasks-page'),
      refreshNuxtData('activities'),
      refreshNuxtData('stats')
    ])
    setTimeout(() => { successFeedback.value = '' }, 5000)
  } finally {
    isBusy.value = false
  }
}
</script>
