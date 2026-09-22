<template>
  <section aria-label="Task Matrix" class="p-6 rounded-2xl bg-[#111114] border border-white/[0.06] space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h2 class="font-mono text-base font-semibold text-[#F5F2EB]">Associated Tasks Matrix</h2>
        <span class="font-mono text-xs px-2 py-0.5 rounded-full bg-white/5 text-[#756F68] border border-white/[0.06]">
          {{ filteredMatrixTasks.length }}
        </span>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <input
          v-model="matrixSearch"
          type="search"
          placeholder="Search tasks..."
          class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none w-44"
          aria-label="Search project tasks"
        />

        <!-- Filter tabs -->
        <div class="flex items-center gap-1.5" role="tablist">
          <button
            v-for="filter in matrixFilterOptions"
            :key="filter.value"
            type="button"
            class="px-2.5 py-1 rounded text-xs font-mono capitalize transition-all border cursor-pointer"
            :class="matrixFilter === filter.value ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40' : 'bg-white/5 text-[#756F68] border-transparent hover:text-[#F5F2EB]'"
            @click="matrixFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Task Table -->
    <div class="space-y-2">
      <div class="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 font-mono text-xs tracking-wider uppercase text-[#756F68] border-b border-white/[0.06]">
        <span class="col-span-2">Task ID</span>
        <span class="col-span-4">Task Name & Tech</span>
        <span class="col-span-2">Priority</span>
        <span class="col-span-2">Status</span>
        <span class="col-span-1">Due Date</span>
        <span class="col-span-1 text-right">Actions</span>
      </div>

      <div v-if="!filteredMatrixTasks.length" class="py-12 text-center text-xs font-mono text-[#756F68]">
        No tasks match your search or filter criteria.
      </div>

      <div
        v-for="(t, idx) in filteredMatrixTasks"
        :key="t.id || idx"
        class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-3.5 rounded-lg bg-[#09090B] border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-pointer group"
        @click="$emit('task-click', t)"
      >
        <div class="col-span-2 flex items-center gap-2">
          <span class="font-mono text-xs font-semibold text-[#C98A4B] bg-[#C98A4B]/10 px-2 py-0.5 rounded border border-[#C98A4B]/20">
            #{{ t.taskId || `ENG-${String(idx + 1).padStart(3, '0')}` }}
          </span>
        </div>

        <div class="col-span-4 min-w-0">
          <div class="font-sans text-sm font-medium text-[#F5F2EB] group-hover:text-[#C98A4B] transition-colors truncate" :title="t.name">
            {{ t.name }}
          </div>
          <div class="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              v-for="tag in (t.techTags?.length ? t.techTags : ['core'])"
              :key="tag"
              class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] rounded px-1.5 py-0.2 border border-[#C98A4B]/20"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="col-span-2">
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-xs uppercase"
            :class="getPriorityBadgeClass(t.priority)"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current" :class="t.priority === 'critical' ? 'animate-pulse' : ''"></span>
            <span>{{ t.priority || 'Medium' }}</span>
          </span>
        </div>

        <div class="col-span-2">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono capitalize"
            :class="getStatusBadgeClass(t.status)"
          >
            {{ t.status === 'deployed' ? 'Deployed' : t.status === 'running_sprint' ? 'Running' : t.status === 'blocked' ? 'Blocked' : 'In Queue' }}
          </span>
        </div>

        <div class="col-span-1 font-mono text-xs text-[#756F68] whitespace-nowrap">
          {{ t.dueDate || 'Nov 15, 2026' }}
        </div>

        <div class="col-span-1 flex items-center justify-end gap-1.5" @click.stop>
          <button
            type="button"
            class="p-1.5 rounded bg-white/5 hover:bg-[#C98A4B]/15 hover:text-[#C98A4B] text-[#756F68] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
            title="Cycle status"
            @click="$emit('toggle-status', t)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button
            type="button"
            class="p-1.5 rounded bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-[#756F68] transition-colors focus:ring-1 focus:ring-red-500 focus:outline-none cursor-pointer"
            title="Delete task"
            @click="$emit('delete-task', t)"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskPriority, TaskStatus } from '~/types'

const props = defineProps<{
  tasks: Task[]
}>()

defineEmits<{
  (e: 'task-click', task: Task): void
  (e: 'toggle-status', task: Task): void
  (e: 'delete-task', task: Task): void
}>()

const matrixSearch = ref('')
const matrixFilter = ref('all')

const matrixFilterOptions = [
  { value: 'all', label: 'All Tasks' },
  { value: 'running_sprint', label: 'Running' },
  { value: 'in_queue', label: 'In Queue' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'blocked', label: 'Blocked' }
]

const filteredMatrixTasks = computed(() => {
  let list = props.tasks || []
  if (matrixFilter.value !== 'all') {
    list = list.filter((t) => t.status === matrixFilter.value)
  }
  const query = matrixSearch.value.trim().toLowerCase()
  if (query) {
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        (t.taskId || '').toLowerCase().includes(query) ||
        (t.techTags || []).some((tag) => tag.toLowerCase().includes(query))
    )
  }
  return list
})

function getPriorityBadgeClass(priority: TaskPriority | string) {
  if (priority === 'critical') return 'bg-red-500/10 text-red-400 border-red-500/20'
  if (priority === 'high') return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  if (priority === 'medium') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

function getStatusBadgeClass(status: TaskStatus | string) {
  if (status === 'deployed') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  if (status === 'running_sprint') return 'bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/20'
  if (status === 'blocked') return 'bg-red-500/10 text-red-400 border border-red-500/20'
  return 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
}
</script>
