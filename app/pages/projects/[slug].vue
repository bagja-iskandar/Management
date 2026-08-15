<template>
  <section class="project-detail-page">
    <!-- 1. Breadcrumbs -->
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <NuxtLink to="/projects" class="breadcrumb-link">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Projects</span>
      </NuxtLink>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">{{ currentProject.title }}</span>
    </nav>

    <!-- 2. Project Hero Card -->
    <div class="project-hero-card">
      <div class="hero-header-row">
        <div class="hero-title-group">
          <div class="project-badge-row">
            <span class="project-type-tag">Personal Workstream</span>
            <span class="status-badge" :class="statusClass">{{ currentProject.status || 'Active' }}</span>
            <span class="priority-pill" :class="priorityClass">{{ currentProject.priority || 'High' }} Priority</span>
          </div>
          <h1>{{ currentProject.title }}</h1>
          <p class="hero-description">{{ currentProject.description || 'High-performance architecture with derived task milestone velocity tracking.' }}</p>
        </div>

        <div class="hero-actions">
          <button type="button" class="button primary" @click="showTaskDrawer = !showTaskDrawer">
            <span>⊕ Add Task</span>
          </button>
          <NuxtLink to="/projects" class="button secondary">
            <span>Edit Project</span>
          </NuxtLink>
          <button type="button" class="button danger" @click="confirmDeleteProject = true">
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div class="hero-meta-footer">
        <div class="meta-item">
          <span class="meta-label">Timeline:</span>
          <span class="meta-val">Oct 15 - Dec 20, 2026</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Repository:</span>
          <span class="meta-val code">{{ currentProject.slug }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Lead Developer:</span>
          <span class="meta-val">Bagja Iskandar</span>
        </div>
      </div>
    </div>

    <!-- Quick Add Task Drawer if toggled -->
    <div v-if="showTaskDrawer" class="quick-task-drawer">
      <div class="drawer-header">
        <h3>Quick Add Task to {{ currentProject.title }}</h3>
        <button type="button" class="close-drawer-btn" @click="showTaskDrawer = false" aria-label="Close">✕</button>
      </div>
      <div class="drawer-inputs">
        <input v-model="newTaskName" type="text" placeholder="Task name (e.g. Implement EEG spatial pooling layer)..." />
        <button type="button" class="button primary small" :disabled="!newTaskName.trim()" @click="addTaskLocally">Create Task</button>
      </div>
    </div>

    <!-- 3. Metrics & Derived Progress Grid -->
    <div class="project-metrics-grid">
      <!-- Big Progress Card -->
      <div class="progress-metric-card">
        <div class="metric-card-header">
          <span class="metric-label">Overall Progress</span>
          <span class="derived-tag">Derived Metric</span>
        </div>
        <div class="progress-number-row">
          <strong class="big-progress-value">{{ derivedPercentage }}%</strong>
          <span class="progress-subtext">Derived from {{ localTasks.length }} associated tasks</span>
        </div>
        <div class="progress-track large">
          <div class="progress-fill" :style="{ width: `${derivedPercentage}%` }"></div>
        </div>
      </div>

      <!-- 4 Task Breakdown Chips -->
      <div class="breakdown-chips-card">
        <div class="breakdown-item violet">
          <span class="breakdown-count">{{ completedCount }}</span>
          <span class="breakdown-label">Completed</span>
        </div>
        <div class="breakdown-item cyan">
          <span class="breakdown-count">{{ inProgressCount }}</span>
          <span class="breakdown-label">In Progress</span>
        </div>
        <div class="breakdown-item slate">
          <span class="breakdown-count">{{ todoCount }}</span>
          <span class="breakdown-label">To Do</span>
        </div>
        <div class="breakdown-item total">
          <span class="breakdown-count">{{ localTasks.length }}</span>
          <span class="breakdown-label">Total Tasks</span>
        </div>
      </div>
    </div>

    <!-- 4. Associated Project Tasks Table -->
    <div class="project-tasks-card">
      <div class="tasks-card-header">
        <div class="tasks-title-group">
          <h2>Project Tasks</h2>
          <span class="tasks-count-pill">{{ filteredTasks.length }} tasks</span>
        </div>

        <div class="tasks-toolbar">
          <input v-model="taskSearch" type="search" placeholder="Search tasks in project..." aria-label="Search project tasks" />
          <div class="filter-tabs" role="tablist">
            <button type="button" class="filter-tab" :class="{ active: taskFilter === 'all' }" @click="taskFilter = 'all'">
              All ({{ localTasks.length }})
            </button>
            <button type="button" class="filter-tab" :class="{ active: taskFilter === 'todo' }" @click="taskFilter = 'todo'">
              To Do ({{ todoCount }})
            </button>
            <button type="button" class="filter-tab" :class="{ active: taskFilter === 'proses' }" @click="taskFilter = 'proses'">
              In Progress ({{ inProgressCount }})
            </button>
            <button type="button" class="filter-tab" :class="{ active: taskFilter === 'selesai' }" @click="taskFilter = 'selesai'">
              Completed ({{ completedCount }})
            </button>
          </div>
        </div>
      </div>

      <!-- Task Table -->
      <div class="project-tasks-table">
        <div class="task-row header">
          <span>TASK NAME & DESCRIPTION</span>
          <span>PRIORITY</span>
          <span>DUE DATE</span>
          <span>STATUS</span>
          <span class="actions-cell">ACTION</span>
        </div>

        <div v-if="!filteredTasks.length" class="empty-state">
          No tasks match your search or filter criteria.
        </div>

        <div v-for="(t, idx) in filteredTasks" :key="t.id || idx" class="task-row">
          <div class="task-info">
            <span class="task-name">{{ t.name }}</span>
            <span class="task-desc">{{ t.description || 'Milestone deliverable for personal workspace.' }}</span>
          </div>

          <div>
            <span class="priority-badge" :class="t.priority || 'high'">
              {{ (t.priority || 'high').toUpperCase() }}
            </span>
          </div>

          <div class="date-cell">{{ t.dueDate || 'Nov 15, 2026' }}</div>

          <div>
            <span class="status-badge" :class="t.status">
              {{ t.status === 'selesai' ? 'Completed' : t.status === 'proses' ? 'In Progress' : 'To Do' }}
            </span>
          </div>

          <div class="actions-cell">
            <button 
              class="action-btn toggle-btn" 
              type="button" 
              @click="toggleTaskStatus(idx)" 
              :aria-label="`Toggle status for ${t.name}`"
              title="Toggle task status"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
            <button 
              class="action-btn delete-btn" 
              type="button" 
              @click="removeTask(idx)" 
              :aria-label="`Delete ${t.name}`"
              title="Delete task"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Project Confirmation Modal -->
    <ConfirmDialog
      v-if="confirmDeleteProject"
      title="Delete Project?"
      :message="`Deleting '${currentProject.title}' will affect its ${localTasks.length} associated tasks. This action cannot be undone.`"
      confirmText="Delete Project"
      cancelText="Cancel"
      :busy="false"
      @confirm="onProjectDeleted"
      @cancel="confirmDeleteProject = false"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const slug = computed(() => (route.params.slug as string) || 'project-alpha')

const projectsApi = useProjects()
const { data: projects } = useLazyAsyncData('projects-detail', () => projectsApi.getProjects(), {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key]
})

const currentProject = computed(() => {
  const list = projects.value ?? []
  const found = list.find(p => p.slug === slug.value)
  if (found) return found
  return {
    slug: slug.value,
    title: slug.value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'High-performance stereoscopic depth estimation and neural signal processing architecture.',
    status: 'Active',
    priority: 'High'
  }
})

const statusClass = computed(() => {
  const s = (currentProject.value.status || 'Active').toLowerCase()
  if (s === 'completed') return 'selesai'
  if (s === 'on hold') return 'proses'
  return 'selesai'
})

const priorityClass = computed(() => {
  const p = (currentProject.value.priority || 'High').toLowerCase()
  if (p === 'high') return 'high'
  if (p === 'medium') return 'medium'
  return 'low'
})

// Associated Tasks data
interface LocalTask {
  id: string
  name: string
  description?: string
  status: 'todo' | 'proses' | 'selesai'
  priority?: 'high' | 'medium' | 'low'
  dueDate?: string
}

const localTasks = ref<LocalTask[]>([
  { id: '1', name: 'Refactor TF-HiTNet fusion layer', description: 'Build spatial feature pyramid pooling for stereoscopic inference.', status: 'selesai', priority: 'high', dueDate: 'Oct 24, 2026' },
  { id: '2', name: 'Implement co-attention EEG module', description: 'Align multi-modal latent representations across temporal steps.', status: 'proses', priority: 'high', dueDate: 'Oct 28, 2026' },
  { id: '3', name: 'Optimize spatial pyramid pooling', description: 'Reduce memory footprint on high-resolution feature tensors.', status: 'proses', priority: 'medium', dueDate: 'Nov 02, 2026' },
  { id: '4', name: 'Write latency and throughput benchmarks', description: 'Evaluate TensorRT runtime latency under batch size 16.', status: 'todo', priority: 'low', dueDate: 'Nov 10, 2026' },
  { id: '5', name: 'Update technical architecture documentation', description: 'Complete API reference and Unstorage schema guides.', status: 'todo', priority: 'low', dueDate: 'Nov 15, 2026' }
])

const showTaskDrawer = ref(false)
const newTaskName = ref('')
const confirmDeleteProject = ref(false)
const taskSearch = ref('')
const taskFilter = ref<'all' | 'todo' | 'proses' | 'selesai'>('all')

// Derived calculation
const completedCount = computed(() => localTasks.value.filter(t => t.status === 'selesai').length)
const inProgressCount = computed(() => localTasks.value.filter(t => t.status === 'proses').length)
const todoCount = computed(() => localTasks.value.filter(t => t.status === 'todo').length)
const derivedPercentage = computed(() => {
  if (!localTasks.value.length) return 0
  return Math.round((completedCount.value / localTasks.value.length) * 100)
})

// Filtered tasks
const filteredTasks = computed(() => {
  let list = localTasks.value
  if (taskFilter.value !== 'all') {
    list = list.filter(t => t.status === taskFilter.value)
  }
  if (taskSearch.value.trim()) {
    const q = taskSearch.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
  }
  return list
})

function toggleTaskStatus(idx: number) {
  const target = filteredTasks.value[idx]
  if (!target) return
  const next: Record<LocalTask['status'], LocalTask['status']> = {
    todo: 'proses',
    proses: 'selesai',
    selesai: 'todo'
  }
  target.status = next[target.status]
}

function removeTask(idx: number) {
  const target = filteredTasks.value[idx]
  if (!target) return
  localTasks.value = localTasks.value.filter(t => t.id !== target.id)
}

function addTaskLocally() {
  if (!newTaskName.value.trim()) return
  localTasks.value.unshift({
    id: String(Date.now()),
    name: newTaskName.value.trim(),
    description: 'Newly created milestone task.',
    status: 'todo',
    priority: 'medium',
    dueDate: 'Nov 20, 2026'
  })
  newTaskName.value = ''
  showTaskDrawer.value = false
}

function onProjectDeleted() {
  confirmDeleteProject.value = false
  router.push('/projects')
}
</script>

<style scoped>
.project-detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1450px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Breadcrumb */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #c0c1ff;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #ffffff;
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.2);
}

.breadcrumb-current {
  color: var(--text-heading);
  font-weight: 600;
}

/* Hero Card */
.project-hero-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 30px;
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.hero-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.hero-title-group {
  flex: 1;
  min-width: 320px;
}

.project-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.project-type-tag {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #c0c1ff;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 2px 8px;
  border-radius: 4px;
}

.priority-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
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

.hero-title-group h1 {
  margin: 0 0 10px;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
}

.hero-description {
  margin: 0;
  color: var(--text-body);
  font-size: 0.95rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-meta-footer {
  display: flex;
  align-items: center;
  gap: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--glass-border);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.meta-label {
  color: var(--text-muted);
}

.meta-val {
  color: var(--text-heading);
  font-weight: 600;
}

.meta-val.code {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* Quick Add Task Drawer */
.quick-task-drawer {
  background: rgba(15, 19, 29, 0.95);
  border: 1px solid var(--glass-border-highlight);
  border-radius: var(--radius-card);
  padding: 20px 24px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #ffffff;
}

.close-drawer-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px 8px;
}

.drawer-inputs {
  display: flex;
  gap: 12px;
  align-items: center;
}

.drawer-inputs input {
  flex: 1;
}

/* Metrics & Progress Grid */
.project-metrics-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.progress-metric-card,
.breakdown-chips-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 24px;
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-ambient);
}

.progress-metric-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.metric-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
}

.derived-tag {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
}

.progress-number-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.big-progress-value {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #ffffff;
  line-height: 1;
}

.progress-subtext {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.progress-track.large {
  height: 10px;
}

.breakdown-chips-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.breakdown-count {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.2;
}

.breakdown-item.violet .breakdown-count { color: #c084fc; }
.breakdown-item.cyan .breakdown-count { color: #38bdf8; }
.breakdown-item.slate .breakdown-count { color: #94a3b8; }
.breakdown-item.total .breakdown-count { color: #ffffff; }

.breakdown-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 4px;
}

/* Associated Tasks Card */
.project-tasks-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 24px;
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-ambient);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tasks-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.tasks-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tasks-title-group h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #ffffff;
}

.tasks-count-pill {
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-heading);
  padding: 2px 8px;
  border-radius: 999px;
}

.tasks-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tasks-toolbar input {
  width: 220px;
}

/* Tasks Table */
.project-tasks-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.task-row {
  display: grid;
  grid-template-columns: 2fr 0.8fr 1fr 1fr 0.8fr;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition: all 0.15s ease;
}

.task-row.header {
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: transparent;
  padding: 8px 16px 12px;
  border-top: none;
  border-left: none;
  border-right: none;
}

.task-row:not(.header):hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.task-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: #ffffff;
}

.task-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.priority-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.priority-badge.high {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.4);
  color: #fca5a5;
}

.priority-badge.medium {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fde047;
}

.priority-badge.low {
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.4);
  color: #cbd5e1;
}

.actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-heading);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.action-btn.delete-btn:hover {
  background: rgba(244, 63, 94, 0.25);
  border-color: rgba(244, 63, 94, 0.5);
  color: #fca5a5;
}

@media (max-width: 900px) {
  .project-metrics-grid {
    grid-template-columns: 1fr;
  }
  .task-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .task-row.header {
    display: none;
  }
}
</style>
