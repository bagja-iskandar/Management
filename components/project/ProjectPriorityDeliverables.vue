<template>
  <div class="obs-card p-4 sm:p-5 rounded-2xl bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] shadow-sm space-y-3 transition-all">
    <div class="flex items-center justify-between pb-2 border-b border-white/[0.06]">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <h3 class="font-mono text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider">
          Priority Deliverables
        </h3>
      </div>
      <button
        type="button"
        class="font-mono text-[11px] text-[#8A8F9E] hover:text-indigo-400 transition-colors cursor-pointer inline-flex items-center gap-1"
        @click="$emit('open-matrix')"
      >
        <span>Open task matrix</span>
        <NexuraIcon name="ArrowRight" size="xs" />
      </button>
    </div>

    <div class="space-y-2">
      <div
        v-for="task in priorityTasks.slice(0, 3)"
        :key="task.id"
        class="flex items-center justify-between p-2.5 rounded-xl bg-[#07080A]/60 border border-white/[0.05] hover:border-white/[0.12] transition-colors cursor-pointer group"
        @click="$emit('task-click', task)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="font-mono text-[10px] tabular-nums font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            #{{ task.taskId || 'ENG' }}
          </span>
          <span class="font-sans text-xs text-[#F3F4F6] group-hover:text-indigo-300 transition-colors truncate">
            {{ task.name }}
          </span>
        </div>
        <span
          class="font-mono text-[10px] capitalize px-2 py-0.5 rounded-full shrink-0 border flex items-center gap-1"
          :class="getPriorityBadgeClass(task.priority)"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-current" :class="task.priority === 'critical' ? 'animate-pulse' : ''"></span>
          <span>{{ task.priority }}</span>
        </span>
      </div>

      <div v-if="!priorityTasks.length" class="py-6 text-center text-xs font-mono text-[#8A8F9E]">
        No high priority deliverables pending.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskPriority } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

defineProps<{
  priorityTasks: Task[]
}>()

defineEmits<{
  (e: 'open-matrix'): void
  (e: 'task-click', task: Task): void
}>()

function getPriorityBadgeClass(priority: TaskPriority | string) {
  if (priority === 'critical') return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  if (priority === 'high') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (priority === 'medium') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  return 'bg-white/5 text-[#8A8F9E] border-white/10'
}
</script>
