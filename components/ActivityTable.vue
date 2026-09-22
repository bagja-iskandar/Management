<template>
  <div class="w-full space-y-2">
    <!-- Table Header (desktop) -->
    <div class="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2.5 font-mono text-xs tracking-wider uppercase text-[#756F68] border-b border-white/[0.06]">
      <span class="col-span-2">Task ID</span>
      <span class="col-span-3">Task Name</span>
      <span class="col-span-2">Project</span>
      <span class="col-span-2">Priority</span>
      <span class="col-span-1">Status</span>
      <span class="col-span-1">Date</span>
      <span class="col-span-1 text-right">Actions</span>
    </div>

    <!-- Empty State -->
    <div v-if="!rows?.length" class="py-12 px-4 text-center rounded-xl bg-[#111114] border border-white/[0.06]">
      <div class="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#756F68] text-lg font-mono" aria-hidden="true">
        ∅
      </div>
      <h3 class="font-mono text-sm font-semibold text-[#F5F2EB]">No tasks recorded</h3>
      <p class="font-sans text-xs text-[#756F68] mt-1 max-w-sm mx-auto">No tasks match your current filter or query. Create a new task to see activity telemetry.</p>
    </div>

    <!-- Rows -->
    <div
      v-for="row in rows"
      :key="row.id"
      class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-3.5 md:px-4 rounded-lg bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
    >
      <!-- Task ID -->
      <div class="col-span-2 flex items-center gap-2">
        <span class="font-mono text-xs font-semibold text-[#C98A4B] bg-[#C98A4B]/10 px-2 py-0.5 rounded border border-[#C98A4B]/20">
          #{{ formatTaskId(row) }}
        </span>
      </div>

      <!-- Task Name & Tech tags -->
      <div class="col-span-3 min-w-0">
        <div class="font-sans text-sm font-medium text-[#F5F2EB] truncate" :title="row.name">
          {{ row.name }}
        </div>
        <div v-if="row.techTags?.length" class="flex items-center gap-1.5 mt-1 flex-wrap">
          <span
            v-for="tag in row.techTags.slice(0, 3)"
            :key="tag"
            class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] rounded px-1.5 py-0.2"
          >
            {{ tag }}
          </span>
          <span v-if="row.techTags.length > 3" class="font-mono text-[10px] text-[#756F68]">
            +{{ row.techTags.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Project Badge -->
      <div class="col-span-2">
        <span class="inline-flex items-center gap-1 font-mono text-xs bg-white/5 text-[#F5F2EB] px-2 py-0.5 rounded border border-white/[0.06] truncate max-w-full">
          📁 {{ getProjectLabel(row) }}
        </span>
      </div>

      <!-- Priority Pill -->
      <div class="col-span-2">
        <span
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-xs uppercase"
          :class="getPriorityClass(row)"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="[getPriorityDotClass(row), isCritical(row) ? 'animate-pulse' : '']"
            aria-hidden="true"
          ></span>
          <span>{{ getPriorityLabel(row) }}</span>
        </span>
      </div>

      <!-- Status Pill -->
      <div class="col-span-1">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono capitalize"
          :class="getStatusClass(row.status)"
        >
          {{ getStatusLabel(row.status) }}
        </span>
      </div>

      <!-- Date -->
      <div class="col-span-1 font-mono text-xs text-[#756F68] whitespace-nowrap">
        {{ formatDate(row.date || row.createdAt) }}
      </div>

      <!-- Actions -->
      <div class="col-span-1 flex items-center justify-end gap-1.5">
        <button
          type="button"
          class="p-1.5 rounded bg-white/[0.03] border border-white/[0.08] text-[#756F68] hover:text-[#C98A4B] hover:border-[#C98A4B]/40 hover:bg-[#C98A4B]/10 transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          :aria-label="`Update status for ${row.name}`"
          title="Toggle status (Queue → Sprint → Deployed)"
          @click="$emit('toggle', row)"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <button
          type="button"
          class="p-1.5 rounded bg-white/[0.03] border border-white/[0.08] text-[#756F68] hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors focus:ring-1 focus:ring-red-500 focus:outline-none"
          :aria-label="`Delete ${row.name}`"
          title="Delete task"
          @click="$emit('delete', row)"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '../types'

defineProps<{ rows: Task[] }>()

defineEmits<{
  (e: 'toggle', row: Task): void
  (e: 'delete', row: Task): void
}>()

function formatTaskId(row: Task): string {
  if (row.taskId) {
    return row.taskId.replace(/^#/, '')
  }
  return `ENG-${String(row.id).slice(-3).padStart(3, '0')}`
}

function getProjectLabel(row: Task): string {
  if (row.projectSlug) {
    return row.projectSlug
  }
  const n = row.name.toLowerCase()
  if (n.includes('hitnet') || n.includes('eeg')) return 'tf-hitnet'
  if (n.includes('management') || n.includes('telemetry') || n.includes('token')) return 'management'
  if (n.includes('signal') || n.includes('impedance')) return 'neural-signal'
  return 'general'
}

function getPriorityLabel(row: Task): string {
  const p = (row.priority || '').toLowerCase()
  if (p === 'critical') return 'Critical'
  if (p === 'high') return 'High'
  if (p === 'medium') return 'Medium'
  if (p === 'low') return 'Low'
  const n = row.name.toLowerCase()
  if (n.includes('hitnet') || n.includes('attention') || n.includes('critical')) return 'High'
  return 'Medium'
}

function isCritical(row: Task): boolean {
  return getPriorityLabel(row) === 'Critical'
}

function getPriorityClass(row: Task): string {
  const p = getPriorityLabel(row).toLowerCase()
  if (p === 'critical') return 'bg-red-500/15 text-red-400 border border-red-500/30'
  if (p === 'high') return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
  if (p === 'medium') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  return 'bg-white/5 text-[#756F68] border border-white/[0.06]'
}

function getPriorityDotClass(row: Task): string {
  const p = getPriorityLabel(row).toLowerCase()
  if (p === 'critical') return 'bg-red-500'
  if (p === 'high') return 'bg-orange-500'
  if (p === 'medium') return 'bg-yellow-500'
  return 'bg-[#756F68]'
}

function getStatusLabel(status?: string): string {
  if (!status) return 'Queue'
  const s = status.toLowerCase()
  if (s === 'deployed' || s === 'selesai') return 'Deployed'
  if (s === 'running_sprint' || s === 'proses') return 'Running'
  if (s === 'blocked') return 'Blocked'
  return 'In Queue'
}

function getStatusClass(status?: string): string {
  if (!status) return 'bg-white/5 text-[#756F68] border border-white/[0.06]'
  const s = status.toLowerCase()
  if (s === 'deployed' || s === 'selesai') return 'bg-green-500/15 text-green-400 border border-green-500/30'
  if (s === 'running_sprint' || s === 'proses') return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
  if (s === 'blocked') return 'bg-red-500/15 text-red-400 border border-red-500/30'
  return 'bg-white/5 text-[#756F68] border border-white/[0.06]'
}

function formatDate(d?: string) {
  if (!d) return 'Recent'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}
</script>