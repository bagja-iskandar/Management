<template>
  <section aria-label="Task Matrix" class="obs-card p-4 sm:p-6 rounded-2xl bg-[#111318] border border-white/[0.07] shadow-sm space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <h2 class="font-mono text-base font-semibold text-[#F3F4F6]">Associated Tasks Matrix</h2>
        <span class="font-mono text-xs tabular-nums px-2.5 py-0.5 rounded-full bg-white/5 text-[#8A8F9E] border border-white/[0.06]">
          {{ filteredMatrixTasks.length }}
        </span>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <input
          v-model="matrixSearch"
          type="search"
          placeholder="Search tasks..."
          class="bg-[#07080A] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none w-44 transition-all"
          aria-label="Search project tasks"
        />

        <!-- Filter tabs -->
        <div class="flex items-center gap-1.5 p-1 rounded-xl bg-[#07080A] border border-white/[0.06]" role="tablist">
          <button
            v-for="filter in matrixFilterOptions"
            :key="filter.value"
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all border cursor-pointer"
            :class="matrixFilter === filter.value ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold' : 'bg-transparent text-[#8A8F9E] border-transparent hover:text-[#F3F4F6]'"
            @click="matrixFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Task Table -->
    <div class="space-y-2">
      <div class="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 font-mono text-xs tracking-wider uppercase text-[#8A8F9E] border-b border-white/[0.06]">
        <span class="col-span-2">Task ID</span>
        <span class="col-span-4">Task Name & Tech</span>
        <span class="col-span-2">Priority</span>
        <span class="col-span-2">Status</span>
        <span class="col-span-1">Due Date</span>
        <span class="col-span-1 text-right">Actions</span>
      </div>

      <div v-if="!filteredMatrixTasks.length" class="py-12 text-center text-xs font-mono text-[#8A8F9E]">
        No tasks match your search or filter criteria.
      </div>

      <div
        v-for="(t, idx) in filteredMatrixTasks"
        :key="t.id || idx"
        class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-3.5 rounded-xl bg-[#07080A]/60 border border-white/[0.05] hover:border-white/[0.12] transition-colors cursor-pointer group"
        @click="$emit('task-click', t)"
      >
        <div class="col-span-2 flex items-center gap-2">
          <span class="font-mono text-xs tabular-nums font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            #{{ t.taskId || `ENG-${String(idx + 1).padStart(3, '0')}` }}
          </span>
        </div>

        <div class="col-span-4 min-w-0">
          <div class="font-sans text-sm font-medium text-[#F3F4F6] group-hover:text-indigo-300 transition-colors truncate" :title="t.name">
            {{ t.name }}
          </div>
          <div class="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              v-for="tag in (t.techTags?.length ? t.techTags : ['core'])"
              :key="tag"
              class="font-mono text-[10px] bg-white/5 text-[#8A8F9E] rounded px-1.5 py-0.5 border border-white/[0.06]"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="col-span-2">
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs uppercase border"
            :class="getPriorityBadgeClass(t.priority)"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current" :class="t.priority === 'critical' ? 'animate-pulse' : ''"></span>
            <span>{{ t.priority || 'Medium' }}</span>
          </span>
        </div>

        <div class="col-span-2">
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono capitalize border"
            :class="getStatusBadgeClass(t.status)"
          >
            {{ t.status === 'deployed' ? 'Deployed' : t.status === 'running_sprint' ? 'Running' : t.status === 'blocked' ? 'Blocked' : 'In Queue' }}
          </span>
        </div>

        <div class="col-span-1 font-mono text-xs text-[#8A8F9E] tabular-nums whitespace-nowrap">
          {{ t.dueDate || 'Nov 15, 2026' }}
        </div>

        <div class="col-span-1 flex items-center justify-end gap-1.5" @click.stop>
          <button
            type="button"
            class="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/15 hover:text-indigo-400 text-[#8A8F9E] transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            title="Cycle status"
            @click="$emit('toggle-status', t)"
          >
            <NexuraIcon name="RotateCw" size="xs" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/15 hover:text-rose-400 text-[#8A8F9E] transition-colors focus:ring-1 focus:ring-rose-500 focus:outline-none cursor-pointer"
            title="Delete task"
            @click="$emit('delete-task', t)"
          >
            <NexuraIcon name="Trash2" size="xs" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskPriority, TaskStatus } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

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
  if (priority === 'critical') return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  if (priority === 'high') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (priority === 'medium') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  return 'bg-white/5 text-[#8A8F9E] border-white/10'
}

function getStatusBadgeClass(status: TaskStatus | string) {
  if (status === 'deployed') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (status === 'running_sprint') return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
  if (status === 'blocked') return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  return 'bg-white/5 text-[#8A8F9E] border-white/10'
}
</script>
