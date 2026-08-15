<template>
  <section class="tasks-page">
    <!-- Header -->
    <div class="page-heading">
      <div>
        <div class="page-badge">Tasks Hub</div>
        <h1>Tasks</h1>
        <p>Manage personal tasks, track project deliverables, and monitor milestone progress.</p>
      </div>
      <div class="heading-actions">
        <button type="button" class="button primary" @click="showAddModal = true">
          <span>⊕ New Task</span>
        </button>
        <NuxtLink to="/" class="button secondary">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Back to Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Feedback Message -->
    <div v-if="successFeedback" class="feedback" role="status">
      {{ successFeedback }}
    </div>

    <!-- Multi-Filter & Search Toolbar -->
    <div class="tasks-toolbar-card">
      <div class="toolbar-top-row">
        <!-- Search -->
        <div class="search-wrap">
          <svg class="search-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            v-model="search" 
            type="search" 
            placeholder="Search tasks by name or description..." 
            aria-label="Search tasks" 
          />
        </div>

        <!-- Project Filter Dropdown -->
        <select v-model="projectFilter" class="filter-select" aria-label="Filter by Project">
          <option value="all">📁 All Projects</option>
          <option value="hitnet">Project Alpha • TF-HiTNet</option>
          <option value="portfolio">Project Beta • Management Web</option>
          <option value="gamma">Project Gamma • Neural Signal</option>
        </select>

        <!-- Priority Filter Dropdown -->
        <select v-model="priorityFilter" class="filter-select" aria-label="Filter by Priority">
          <option value="all">⚡ All Priorities</option>
          <option value="high">🔴 High Priority</option>
          <option value="medium">🟡 Medium Priority</option>
          <option value="low">🟢 Low Priority</option>
        </select>

        <!-- Sort Dropdown -->
        <select v-model="sortBy" class="filter-select" aria-label="Sort tasks">
          <option value="date-desc">Date: Newest First</option>
          <option value="date-asc">Date: Oldest First</option>
          <option value="priority-desc">Priority: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
        </select>
      </div>

      <!-- Status Filter Tabs -->
      <div class="status-tabs-row" role="tablist" aria-label="Task Status Filter">
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: statusFilter === 'all' }" 
          @click="statusFilter = 'all'"
        >
          <span>All</span>
          <span class="tab-badge">{{ allCount }}</span>
        </button>
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: statusFilter === 'todo' }" 
          @click="statusFilter = 'todo'"
        >
          <span>To Do</span>
          <span class="tab-badge">{{ todoCount }}</span>
        </button>
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: statusFilter === 'proses' }" 
          @click="statusFilter = 'proses'"
        >
          <span>In Progress</span>
          <span class="tab-badge">{{ inProgressCount }}</span>
        </button>
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: statusFilter === 'selesai' }" 
          @click="statusFilter = 'selesai'"
        >
          <span>Completed</span>
          <span class="tab-badge">{{ completedCount }}</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="tasksError" class="feedback error" role="alert">
      <span>Failed to load tasks from server.</span>
      <button type="button" class="retry-inline-btn" @click="refreshNuxtData('tasks-page')">Try Again</button>
    </div>

    <!-- Empty State / No Match -->
    <div v-if="!filteredTasks.length && !tasksError" class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">📋</div>
      <h3 class="empty-state-title">No tasks found</h3>
      <p class="empty-state-desc">No tasks match your current filter or query criteria.</p>
      <div class="empty-state-actions">
        <button type="button" class="button small secondary" @click="resetFilters">Clear Filters</button>
      </div>
    </div>

    <!-- Tasks Table Card -->
    <div v-else class="tasks-table-card">
      <div class="table-header-row">
        <span>TASK NAME & DESCRIPTION</span>
        <span>PROJECT</span>
        <span>PRIORITY</span>
        <span>DUE DATE</span>
        <span>STATUS</span>
        <span class="actions-cell">ACTION</span>
      </div>

      <div v-for="t in filteredTasks" :key="t.id" class="task-table-row">
        <!-- Task Info -->
        <div class="task-main-cell">
          <div class="task-icon-badge" aria-hidden="true">
            <span v-if="t.status === 'selesai'">✓</span>
            <span v-else-if="t.status === 'proses'">⚡</span>
            <span v-else>❖</span>
          </div>
          <div class="task-texts">
            <span class="task-title-text">{{ t.name }}</span>
            <span class="task-desc-text">{{ getTaskDescription(t) }}</span>
          </div>
        </div>

        <!-- Project Badge -->
        <div class="project-tag-cell">
          <span class="project-badge">{{ getProjectName(t) }}</span>
        </div>

        <!-- Priority -->
        <div>
          <span class="priority-pill" :class="getPriority(t)">
            {{ getPriority(t).toUpperCase() }}
          </span>
        </div>

        <!-- Due Date -->
        <div class="date-cell">{{ formatDate(t.date) }}</div>

        <!-- Status Pill -->
        <div>
          <span :class="['status-badge', t.status]">
            {{ t.status === 'selesai' ? 'Completed' : t.status === 'proses' ? 'In Progress' : 'To Do' }}
          </span>
        </div>

        <!-- Actions -->
        <div class="actions-cell">
          <button 
            class="action-btn toggle-btn" 
            type="button" 
            @click="toggleStatus(t)" 
            :aria-label="`Toggle status for ${t.name}`"
            title="Toggle status"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
          <button 
            class="action-btn delete-btn" 
            type="button" 
            @click="deleteTask(t)" 
            :aria-label="`Delete ${t.name}`"
            title="Delete task"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Panel -->
    <section class="tasks-summary-card">
      <h2>Tasks Analytics Summary</h2>
      <div class="summary-badges">
        <span class="summary-chip">Total Tasks: {{ allCount }}</span>
        <span class="summary-chip">Completed: {{ completedCount }}</span>
        <span class="summary-chip">In Progress: {{ inProgressCount }}</span>
        <span class="summary-chip">To Do: {{ todoCount }}</span>
      </div>
      <p>Tasks are automatically linked with managed projects to calculate derived milestone velocities.</p>
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
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task } from '../types'

const search = ref('')
const projectFilter = ref('all')
const priorityFilter = ref('all')
const statusFilter = ref<'all' | 'todo' | 'proses' | 'selesai'>('all')
const sortBy = ref<'date-desc' | 'date-asc' | 'priority-desc' | 'name-asc'>('date-desc')

const showAddModal = ref(false)
const confirmOpen = ref(false)
const confirmTarget = ref<Task | null>(null)
const isBusy = ref(false)
const successFeedback = ref('')

const tasksApi = useTasks()
const { data: tasks, error: tasksError } = useLazyAsyncData<Task[]>('tasks-page', () => tasksApi.getActivities(), {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key]
})

function getProjectName(task: Task): string {
  const n = task.name.toLowerCase()
  if (n.includes('hitnet') || n.includes('eeg')) return 'Project Alpha • TF-HiTNet'
  if (n.includes('portfolio') || n.includes('web') || n.includes('deploy')) return 'Project Beta • Management Web'
  if (n.includes('gamma') || n.includes('neural')) return 'Project Gamma • Neural Signal'
  return 'Personal Portfolio & Docs'
}

function getTaskDescription(task: Task): string {
  const n = task.name.toLowerCase()
  if (n.includes('hitnet')) return 'Spatial pyramid pooling and depth inference refinement.'
  if (n.includes('portfolio')) return 'Nuxt 4 Dark Polymorphism interface integration.'
  return 'Milestone deliverable for personal engineering workspace.'
}

function getPriority(task: Task): 'high' | 'medium' | 'low' {
  const n = task.name.toLowerCase()
  if (n.includes('hitnet') || n.includes('eeg') || n.includes('attention')) return 'high'
  if (n.includes('portfolio') || n.includes('web')) return 'medium'
  return 'low'
}

function formatDate(d?: string) {
  if (!d) return 'Nov 15, 2026'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}

// Counts
const allCount = computed(() => (tasks.value ?? []).length)
const todoCount = computed(() => (tasks.value ?? []).filter(t => t.status === 'todo').length)
const inProgressCount = computed(() => (tasks.value ?? []).filter(t => t.status === 'proses').length)
const completedCount = computed(() => (tasks.value ?? []).filter(t => t.status === 'selesai').length)

// Filter & Sort
const filteredTasks = computed(() => {
  let list = [...(tasks.value ?? [])]

  // Status
  if (statusFilter.value !== 'all') {
    list = list.filter(t => t.status === statusFilter.value)
  }

  // Project
  if (projectFilter.value !== 'all') {
    list = list.filter(t => getProjectName(t).toLowerCase().includes(projectFilter.value))
  }

  // Priority
  if (priorityFilter.value !== 'all') {
    list = list.filter(t => getPriority(t) === priorityFilter.value)
  }

  // Search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(q) || getProjectName(t).toLowerCase().includes(q))
  }

  // Sort
  list.sort((a, b) => {
    if (sortBy.value === 'name-asc') return a.name.localeCompare(b.name)
    if (sortBy.value === 'priority-desc') {
      const pMap = { high: 3, medium: 2, low: 1 }
      return pMap[getPriority(b)] - pMap[getPriority(a)]
    }
    return 0
  })

  return list
})

function resetFilters() {
  search.value = ''
  projectFilter = ref('all')
  priorityFilter = ref('all')
  statusFilter.value = 'all'
  sortBy.value = 'date-desc'
}

async function onTaskCreated(payload: { name: string; description: string; project: string; status: 'todo' | 'proses' | 'selesai'; priority: string; dueDate: string }) {
  isBusy.value = true
  try {
    await tasksApi.createTask({ name: payload.name })
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
  const next: Record<Task['status'], Task['status']> = {
    todo: 'proses',
    proses: 'selesai',
    selesai: 'todo'
  }
  try {
    await tasksApi.updateTask(task.id, { status: next[task.status] })
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

<style scoped>
.tasks-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1450px;
  margin: 0 auto;
  box-sizing: border-box;
}

.heading-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Toolbar Card */
.tasks-toolbar-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 20px 24px;
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-wrap {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-svg {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-wrap input {
  width: 100%;
  padding-left: 36px;
}

.filter-select {
  background: var(--glass-input);
  color: var(--text-heading);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-input);
  padding: 10px 14px;
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  backdrop-filter: var(--glass-blur);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-select:focus {
  border-color: var(--glass-border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.status-tabs-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Table Card */
.tasks-table-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 20px 24px;
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.table-header-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 0.8fr 1fr 1fr 0.8fr;
  gap: 16px;
  align-items: center;
  padding: 8px 16px 14px;
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.task-table-row {
  display: grid;
  grid-template-columns: 2fr 1.2fr 0.8fr 1fr 1fr 0.8fr;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition: all 0.15s ease;
}

.task-table-row:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.task-main-cell {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.task-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: #c084fc;
  flex-shrink: 0;
}

.task-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.task-title-text {
  font-size: 0.92rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-desc-text {
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-badge {
  font-size: 0.78rem;
  font-weight: 500;
  color: #c0c1ff;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.priority-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.priority-pill.high {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fca5a5;
}

.priority-pill.medium {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fde047;
}

.priority-pill.low {
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.4);
  color: #cbd5e1;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.toggle-btn {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
}

.toggle-btn:hover {
  background: rgba(99, 102, 241, 0.25);
  color: #ffffff;
}

.delete-btn {
  background: rgba(244, 63, 94, 0.1);
  border-color: rgba(244, 63, 94, 0.25);
  color: #fca5a5;
}

.delete-btn:hover {
  background: rgba(244, 63, 94, 0.25);
  color: #ffffff;
}

/* Tasks Summary Card */
.tasks-summary-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 24px 28px;
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-ambient);
}

.tasks-summary-card h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
  color: var(--text-heading);
}

@media (max-width: 900px) {
  .table-header-row {
    display: none;
  }
  .task-table-row {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .project-tag-cell {
    grid-column: 1 / -1;
  }
  .actions-cell {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
