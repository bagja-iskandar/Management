<template>
  <div class="activity-table">
    <div class="table-row header">
      <span>Task Name</span>
      <span>Status</span>
      <span>Date</span>
      <span class="actions-cell">Actions</span>
    </div>

    <div v-if="!rows?.length" class="empty-state">
      No tasks available. Add a new task to get started.
    </div>

    <div v-for="row in rows" :key="row.id" class="table-row">
      <span>{{ row.name }}</span>
      <span>
        <span :class="['status-badge', statusClass(row.status)]">
          <span class="sr-only">Status: </span>{{ statusLabel(row.status) }}
        </span>
      </span>
      <span class="date-cell">{{ row.date }}</span>
      <span class="actions-cell">
        <button class="button small secondary" type="button" @click="$emit('toggle', row)" :aria-label="`Update status for ${row.name}`">Update Status</button>
        <button class="button small danger" type="button" @click="$emit('delete', row)" :aria-label="`Delete ${row.name}`">Delete</button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '../types'
const props = defineProps<{ rows: Task[] }>()

function statusClass(status: Task['status']) {
  return {
    todo: 'todo',
    proses: 'proses',
    selesai: 'selesai'
  }[status]
}

function statusLabel(status: Task['status']) {
  return {
    todo: 'To Do',
    proses: 'In Progress',
    selesai: 'Completed'
  }[status] ?? status
}
</script>

<style scoped>
/* Reuse existing activity table styles in dashboard.css */
</style>