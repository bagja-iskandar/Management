<template>
  <section class="dashboard">
    <div class="dashboard-header">
      <div>
        <div class="page-badge">Dashboard</div>
        <h1>Management Dashboard</h1>
        <p>Overview of recent activity, project performance, and tasks in one place.</p>
      </div>

      <div class="dashboard-actions">
        <TaskForm class="task-form-top" v-model="taskName" @create="createTask" :disabled="isBusy" />
        <button class="button secondary" type="button" @click="createTask" :disabled="isBusy || !taskName.trim()">
          + Add Task
        </button>
      </div>
    </div>

    <div class="dashboard-toolbar">
      <input v-model="q" type="search" placeholder="Search tasks..." aria-label="Search tasks" />
      <NuxtLink to="/projects" class="button secondary">View Projects</NuxtLink>
    </div>

    <div v-if="statsError || activitiesError" class="feedback error" role="alert">
      Failed to load dashboard data. Please refresh the page.
    </div>

    <div class="stats-grid">
      <StatCard v-for="s in stats" :key="s.label" :stat="s" />
    </div>

    <div class="dashboard-body">
      <QuickPanel :disabled="isBusy" @add="createTask" />

      <section class="activity-panel">
        <div class="activity-title">
          <div>
            <h2>Recent Activity</h2>
            <p>List of most recently updated tasks.</p>
          </div>
          <p class="activity-count">{{ filtered.length }} tasks</p>
        </div>

        <ActivityTable :rows="filtered" @toggle="toggleStatus" @delete="deleteTask" />
      </section>
    </div>

    <ConfirmDialog
      v-if="confirmOpen"
      :title="'Confirm Delete'"
      :message="`Delete task: ${confirmTarget?.name}?`"
      :confirmText="'Delete'"
      :cancelText="'Cancel'"
      :busy="isBusy"
      @confirm="onConfirmDelete"
      @cancel="() => { confirmOpen = false; confirmTarget = null }"
    />
  </section>
</template>

<script setup lang="ts">
import ConfirmDialog from './ConfirmDialog.vue'
import TaskForm from './TaskForm.vue'
import StatCard from './StatCard.vue'
import ActivityTable from './ActivityTable.vue'
import QuickPanel from './QuickPanel.vue'
import { useTasks } from '../composables/useTasks'
import { useStats } from '../composables/useStats'
import type { Task, Stat } from '../types'

const q = ref('')
const taskName = ref('')
const isBusy = ref(false)
const confirmOpen = ref(false)
const confirmTarget = ref<Task | null>(null)

const tasksApi = useTasks()
const statsApi = useStats()

const { data: stats, error: statsError } = await useAsyncData<Stat[]>('stats', () => statsApi.getStats())
const { data: activities, error: activitiesError } = await useAsyncData<Task[]>('activities', () => tasksApi.getActivities())

const filtered = computed(() => {
  return (activities.value ?? []).filter((row) =>
    row.name.toLowerCase().includes(q.value.toLowerCase())
  )
})

async function refreshData() {
  await Promise.all([
    refreshNuxtData('activities'),
    refreshNuxtData('stats')
  ])
}

async function createTask(name?: string) {
  const finalName = (name ?? taskName.value).trim()
  if (!finalName) return
  isBusy.value = true
  try {
    await tasksApi.createTask({ name: finalName })
    // clear the bound input only when no explicit name passed (e.g., QuickPanel)
    taskName.value = ''
    await refreshData()
  } finally {
    isBusy.value = false
  }
}

async function toggleStatus(row: Task) {
  const next: Task['status'] = row.status === 'todo' ? 'proses' : row.status === 'proses' ? 'selesai' : 'todo'
  isBusy.value = true
  try {
    await tasksApi.updateTask(row.id, { status: next })
    await refreshData()
  } finally {
    isBusy.value = false
  }
}

// Open confirm dialog instead of using window.confirm()
function deleteTask(row: Task) {
  confirmTarget.value = row
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
