<template>
  <div class="activity-table">
    <div class="table-row header">
      <span>Nama tugas</span>
      <span>Status</span>
      <span>Tanggal</span>
      <span class="actions-cell">Aksi</span>
    </div>

    <div v-if="!rows?.length" class="empty-state">
      Tidak ada tugas saat ini. Tambahkan tugas baru untuk memulai.
    </div>

    <div v-for="row in rows" :key="row.id" class="table-row">
      <span>{{ row.name }}</span>
      <span>
        <span :class="['status-badge', statusClass(row.status)]">{{ row.status }}</span>
      </span>
      <span class="date-cell">{{ row.date }}</span>
      <span class="actions-cell">
        <button class="button small secondary" type="button" @click="$emit('toggle', row)" :aria-label="`Ubah status ${row.name}`" :aria-pressed="row.status === 'selesai'">Ubah Status</button>
        <button class="button small danger" type="button" @click="$emit('delete', row)" :aria-label="`Hapus ${row.name}`">Hapus</button>
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
</script>

<style scoped>
/* Reuse existing activity table styles in dashboard.css */
</style>