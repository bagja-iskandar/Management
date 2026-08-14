<template>
  <section class="dashboard">
    <div class="dashboard-header">
      <div>
        <div class="page-badge">Dashboard</div>
        <h1>Management Dashboard</h1>
        <p>Ringkasan aktivitas, performa proyek, dan tugas terbaru dalam satu tampilan.</p>
      </div>

      <div class="dashboard-actions">
        <TaskForm class="task-form-top" v-model="taskName" @create="createTask" :disabled="isBusy" />
        <button class="button secondary" type="button" @click="createTask" :disabled="isBusy || !taskName.trim()">
          + Tambah Task
        </button>
      </div>
    </div>

    <div class="dashboard-toolbar">
      <input v-model="q" type="search" placeholder="Cari tugas..." aria-label="Cari tugas" />
      <NuxtLink to="/projects" class="button secondary">Lihat Projects</NuxtLink>
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
            <h2>Aktivitas Terbaru</h2>
            <p>Daftar tugas yang paling baru diupdate.</p>
          </div>
          <p class="activity-count">{{ filtered.length }} tugas</p>
        </div>

        <ActivityTable :rows="filtered" @toggle="toggleStatus" @delete="deleteTask" />
      </section>
    </div>

    <ConfirmDialog
      v-if="confirmOpen"
      :title="'Konfirmasi Hapus'"
      :message="`Hapus tugas: ${confirmTarget?.name}?`"
      :confirmText="'Hapus'"
      :cancelText="'Batal'"
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

function statusClass(status: Task['status']) {
  return {
    todo: 'todo',
    proses: 'proses',
    selesai: 'selesai'
  }[status]
}
</script>

<style src="../assets/css/dashboard.css" scoped></style>
