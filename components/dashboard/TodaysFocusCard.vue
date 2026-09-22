<template>
  <div class="bg-[#111114] border border-white/[0.06] rounded-xl p-3.5 sm:p-4 overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06] shrink-0">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-[#C98A4B]"></span>
        <h2 class="font-mono text-xs tracking-wider uppercase text-[#756F68] font-semibold">
          TODAY'S FOCUS
        </h2>
      </div>
      <span class="font-mono text-[10px] text-[#C98A4B] bg-[#C98A4B]/10 border border-[#C98A4B]/20 rounded px-1.5 py-0.2 font-medium">
        {{ displayTasks.length }} priorities
      </span>
    </div>

    <!-- Task List (Directly beneath header) -->
    <div class="space-y-2 flex-1 min-h-0 overflow-y-auto">
      <div
        v-for="task in displayTasks"
        :key="task.id || task.taskId"
        class="group p-2 sm:p-2.5 rounded-lg bg-[#09090B]/70 border border-white/[0.05] hover:border-[#C98A4B]/40 hover:bg-white/[0.02] transition-all cursor-pointer flex items-center justify-between gap-2"
        tabindex="0"
        role="button"
        :aria-label="`Open task details for ${task.name}`"
        @click="$emit('task-click', task)"
        @keydown.enter="$emit('task-click', task)"
      >
        <!-- Left: ID + Title + Deliverable Tag -->
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <!-- Monospace ID -->
          <span class="font-mono text-xs font-semibold text-[#C98A4B] bg-[#C98A4B]/10 border border-[#C98A4B]/20 rounded px-1.5 py-0.5 shrink-0">
            {{ formatTaskId(task) }}
          </span>

          <!-- Task Title -->
          <span class="text-xs text-[#F5F2EB] font-medium truncate group-hover:text-bone transition-colors" :title="task.name">
            {{ task.name }}
          </span>

          <!-- Deliverable Tag -->
          <span
            v-if="task.deliverableTag || task.taskId"
            class="hidden sm:inline-block font-mono text-[10px] bg-white/5 border border-white/[0.06] text-[#756F68] rounded px-1.5 py-0.5 shrink-0"
          >
            {{ task.deliverableTag || task.taskId }}
          </span>
        </div>

        <!-- Right: Priority Badge -->
        <div class="shrink-0 flex items-center">
          <!-- CRITICAL with Pulsing Red Dot -->
          <span
            v-if="isCritical(task.priority)"
            class="font-mono text-[10px] uppercase font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded px-2 py-0.5 flex items-center gap-1.5"
          >
            <span class="relative flex h-1.5 w-1.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span>CRITICAL</span>
          </span>

          <!-- HIGH with Static Orange Dot -->
          <span
            v-else
            class="font-mono text-[10px] uppercase font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/25 rounded px-2 py-0.5 flex items-center gap-1.5"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            <span>HIGH</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface FocusTaskItem {
  id?: string
  taskId: string
  name: string
  priority: 'critical' | 'high' | 'medium' | 'low' | string
  deliverableTag?: string
  projectSlug?: string
  status?: string
}

const props = defineProps<{
  tasks?: FocusTaskItem[]
}>()

defineEmits<{
  (e: 'task-click', task: FocusTaskItem): void
}>()

const displayTasks = computed(() => {
  return props.tasks && props.tasks.length > 0 ? props.tasks : []
})

function formatTaskId(task: FocusTaskItem): string {
  if (task.taskId.startsWith('#')) return task.taskId
  return `#${task.taskId}`
}

function isCritical(priority?: string): boolean {
  return (priority || '').toLowerCase() === 'critical'
}
</script>
