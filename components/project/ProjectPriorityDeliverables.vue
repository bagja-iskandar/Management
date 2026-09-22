<template>
  <div class="p-5 rounded-2xl bg-[#111114] border border-white/[0.06] space-y-3">
    <div class="flex items-center justify-between pb-2 border-b border-white/[0.06]">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-red-400"></span>
        <h3 class="font-mono text-xs font-semibold text-[#F5F2EB] uppercase tracking-wider">
          Priority Deliverables
        </h3>
      </div>
      <button
        type="button"
        class="font-mono text-[11px] text-[#756F68] hover:text-[#C98A4B] transition-colors cursor-pointer"
        @click="$emit('open-matrix')"
      >
        Open task matrix →
      </button>
    </div>

    <div class="space-y-2">
      <div
        v-for="task in priorityTasks.slice(0, 3)"
        :key="task.id"
        class="flex items-center justify-between p-2.5 rounded-lg bg-[#09090B]/70 border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-pointer group"
        @click="$emit('task-click', task)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="font-mono text-[10px] font-semibold text-[#C98A4B] bg-[#C98A4B]/10 px-1.5 py-0.5 rounded">
            #{{ task.taskId || 'ENG' }}
          </span>
          <span class="font-sans text-xs text-[#F5F2EB] group-hover:text-[#C98A4B] transition-colors truncate">
            {{ task.name }}
          </span>
        </div>
        <span
          class="font-mono text-[10px] capitalize px-2 py-0.5 rounded shrink-0 border"
          :class="getPriorityBadgeClass(task.priority)"
        >
          {{ task.priority }}
        </span>
      </div>

      <div v-if="!priorityTasks.length" class="py-6 text-center text-xs font-mono text-[#756F68]">
        No high priority deliverables pending.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskPriority } from '~/types'

defineProps<{
  priorityTasks: Task[]
}>()

defineEmits<{
  (e: 'open-matrix'): void
  (e: 'task-click', task: Task): void
}>()

function getPriorityBadgeClass(priority: TaskPriority | string) {
  if (priority === 'critical') return 'bg-red-500/10 text-red-400 border-red-500/20'
  if (priority === 'high') return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  if (priority === 'medium') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}
</script>
