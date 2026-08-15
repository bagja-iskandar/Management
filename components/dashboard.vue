<template>
  <section class="dashboard-wrapper">
    <!-- 1. Welcome Header Banner -->
    <div class="welcome-banner">
      <h1>Welcome back, <span class="highlight-name">Bagja</span></h1>
      <p>Here is the overview of your projects and tasks.</p>
    </div>

    <!-- Feedback / Alert Banner if error -->
    <div v-if="statsError || activitiesError" class="feedback error" role="alert">
      <span>Failed to synchronize dashboard data from server.</span>
      <button type="button" class="retry-inline-btn" @click="refreshData">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span>Try Again</span>
      </button>
    </div>

    <!-- 2. KPI Stat Cards Row -->
    <div class="stats-grid">
      <StatCard v-for="s in stats" :key="s.label" :stat="s" />
    </div>

    <!-- 3. Action Pills Toolbar -->
    <div class="action-pills-bar">
      <div class="pills-group">
        <button type="button" class="pill-btn primary" @click="showAddTaskModal = true">
          <span class="pill-icon">⊕</span>
          <span>New Task</span>
        </button>
        <NuxtLink to="/projects" class="pill-btn">
          <svg class="pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Manage Projects</span>
        </NuxtLink>
        <NuxtLink to="/tasks" class="pill-btn">
          <svg class="pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span>All Tasks</span>
        </NuxtLink>
        <button type="button" class="pill-btn" @click="refreshData" title="Refresh metrics">
          <svg class="pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          <span>Sync</span>
        </button>
      </div>

      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input v-model="q" type="search" placeholder="Search tasks..." aria-label="Search tasks" />
      </div>
    </div>

    <!-- 4. Middle Section: Task Overview + Project Status -->
    <div class="middle-analytics-grid">
      <!-- Task Overview Card -->
      <div class="analytics-card task-overview-card">
        <div class="card-header-row">
          <h3>Task Overview</h3>
          <div class="period-toggle" role="group" aria-label="Chart Period Toggle">
            <button 
              type="button" 
              class="toggle-chip" 
              :class="{ active: chartPeriod === 'weekly' }" 
              @click="chartPeriod = 'weekly'"
            >
              Weekly
            </button>
            <button 
              type="button" 
              class="toggle-chip" 
              :class="{ active: chartPeriod === 'monthly' }" 
              @click="chartPeriod = 'monthly'"
            >
              Monthly
            </button>
          </div>
        </div>

        <!-- Glowing Neon Curves Visual Container -->
        <div class="curve-chart-wrapper">
          <svg class="curve-svg" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="glow-violet-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#a855f7" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="glow-cyan-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
              </linearGradient>
              <filter id="neon-glow-violet" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <!-- Background area fills -->
            <path 
              :d="chartPeriod === 'weekly' ? 'M 0,165 C 130,150 250,110 380,75 S 500,45 600,28 L 600,220 L 0,220 Z' : 'M 0,180 C 140,160 260,85 390,60 S 520,30 600,15 L 600,220 L 0,220 Z'" 
              fill="url(#glow-violet-grad)" 
            />

            <!-- Dashed cyan bottom wave -->
            <path 
              :d="chartPeriod === 'weekly' ? 'M 0,185 C 140,130 280,185 410,175 S 520,115 600,70' : 'M 0,195 C 150,140 270,165 420,150 S 530,95 600,50'" 
              fill="none" 
              stroke="#06b6d4" 
              stroke-width="2.5" 
              stroke-dasharray="6,6" 
              opacity="0.85" 
            />

            <!-- Solid glowing violet top line -->
            <path 
              :d="chartPeriod === 'weekly' ? 'M 0,165 C 130,150 250,110 380,75 S 500,45 600,28' : 'M 0,180 C 140,160 260,85 390,60 S 520,30 600,15'" 
              fill="none" 
              stroke="#c084fc" 
              stroke-width="3" 
              filter="url(#neon-glow-violet)" 
            />
          </svg>

          <span class="compact-view-text" aria-hidden="true">COMPACT VIEW</span>
        </div>
      </div>

      <!-- Project Status Donut Card -->
      <div class="analytics-card project-status-card">
        <div class="card-header-row">
          <h3>Project Status</h3>
        </div>

        <div class="donut-section">
          <!-- Circular Donut SVG -->
          <div class="donut-chart-box">
            <svg class="donut-svg" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="12" />
              <!-- Slate arc (To Do) -->
              <circle 
                cx="60" cy="60" r="46" 
                fill="none" 
                stroke="#475569" 
                stroke-width="12" 
                :stroke-dasharray="`${todoArc} 289`" 
                stroke-dashoffset="0"
                stroke-linecap="round"
              />
              <!-- Cyan arc (In Progress) -->
              <circle 
                cx="60" cy="60" r="46" 
                fill="none" 
                stroke="#06b6d4" 
                stroke-width="12" 
                :stroke-dasharray="`${inProgressArc} 289`" 
                :stroke-dashoffset="`-${todoArc}`"
                stroke-linecap="round"
              />
              <!-- Violet arc (Completed) -->
              <circle 
                cx="60" cy="60" r="46" 
                fill="none" 
                stroke="#c084fc" 
                stroke-width="12" 
                :stroke-dasharray="`${completedArc} 289`" 
                :stroke-dashoffset="`-${todoArc + inProgressArc}`"
                stroke-linecap="round"
              />
            </svg>
            <div class="donut-center">
              <span class="donut-total">{{ totalTasksCount }}</span>
              <span class="donut-label">TOTAL</span>
            </div>
          </div>

          <!-- Legend List -->
          <div class="donut-legend">
            <div class="legend-item">
              <div class="legend-dot-label">
                <span class="legend-dot violet" aria-hidden="true"></span>
                <span>Completed</span>
              </div>
              <strong class="legend-value">{{ completedCount }}</strong>
            </div>

            <div class="legend-item">
              <div class="legend-dot-label">
                <span class="legend-dot cyan" aria-hidden="true"></span>
                <span>In Progress</span>
              </div>
              <strong class="legend-value">{{ inProgressCount }}</strong>
            </div>

            <div class="legend-item">
              <div class="legend-dot-label">
                <span class="legend-dot slate" aria-hidden="true"></span>
                <span>To Do</span>
              </div>
              <strong class="legend-value">{{ todoCount }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Bottom Section: Recent Activity Container -->
    <div class="recent-activity-card">
      <div class="card-header-row">
        <h2>Recent Activity</h2>
        <NuxtLink to="/projects" class="view-all-link">View All</NuxtLink>
      </div>

      <ActivityTable :rows="filtered" @toggle="toggleStatus" @delete="deleteTask" />
    </div>

    <!-- Accessible Confirmation Alertdialog -->
    <ConfirmDialog
      v-if="confirmOpen"
      :title="'Confirm Delete'"
      :message="`Are you sure you want to delete '${confirmTarget?.name}'?`"
      :confirmText="'Delete'"
      :cancelText="'Cancel'"
      :busy="isBusy"
      @confirm="onConfirmDelete"
      @cancel="() => { confirmOpen = false; confirmTarget = null }"
    />

    <!-- Add Task Modal Dialog -->
    <AddTaskModal
      v-if="showAddTaskModal"
      :disabled="isBusy"
      @close="showAddTaskModal = false"
      @create="onTaskModalCreated"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'
import AddTaskModal from './AddTaskModal.vue'
import StatCard from './StatCard.vue'
import ActivityTable from './ActivityTable.vue'
import { useTasks } from '../composables/useTasks'
import { useStats } from '../composables/useStats'
import type { Task, Stat } from '../types'

const q = ref('')
const isBusy = ref(false)
const showAddTaskModal = ref(false)
const chartPeriod = ref<'weekly' | 'monthly'>('weekly')

const confirmOpen = ref(false)
const confirmTarget = ref<Task | null>(null)

const tasksApi = useTasks()
const statsApi = useStats()

const { data: stats, error: statsError } = useLazyAsyncData<Stat[]>('stats', () => statsApi.getStats(), {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key]
})
const { data: activities, error: activitiesError } = useLazyAsyncData<Task[]>('activities', () => tasksApi.getActivities(), {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key]
})

const filtered = computed(() => {
  const list = activities.value ?? []
  if (!q.value.trim()) return list
  const query = q.value.toLowerCase()
  return list.filter((row) => row.name.toLowerCase().includes(query))
})

// Calculations for Donut Chart
const totalTasksCount = computed(() => (activities.value ?? []).length || 8)
const completedCount = computed(() => (activities.value ?? []).filter(t => t.status === 'selesai').length || 4)
const inProgressCount = computed(() => (activities.value ?? []).filter(t => t.status === 'proses').length || 3)
const todoCount = computed(() => (activities.value ?? []).filter(t => t.status === 'todo').length || 1)

const circumference = 289 // 2 * pi * 46
const completedArc = computed(() => Math.max(10, (completedCount.value / totalTasksCount.value) * circumference))
const inProgressArc = computed(() => Math.max(10, (inProgressCount.value / totalTasksCount.value) * circumference))
const todoArc = computed(() => Math.max(10, (todoCount.value / totalTasksCount.value) * circumference))

async function refreshData() {
  await Promise.all([
    refreshNuxtData('activities'),
    refreshNuxtData('stats'),
    refreshNuxtData('tasks-page')
  ])
}

async function onTaskModalCreated(payload: { name: string; description: string; project: string; status: 'todo' | 'proses' | 'selesai'; priority: string; dueDate: string }) {
  isBusy.value = true
  try {
    await tasksApi.createTask({ name: payload.name })
    showAddTaskModal.value = false
    await refreshData()
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
    await refreshData()
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
    await refreshData()
  } finally {
    isBusy.value = false
  }
}
</script>

<style src="../assets/css/dashboard.css" scoped></style>
