<template>
  <div class="space-y-2">
    <!-- Header Row -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="font-mono text-xs uppercase tracking-wider text-[#756F68] font-semibold">
          READY TO PICK UP
        </h3>
      </div>
      <span class="font-mono text-xs text-[#C98A4B] bg-[#C98A4B]/10 border border-[#C98A4B]/20 rounded-full px-2 py-0.2">
        {{ queueTasks.length }}
      </span>
    </div>

    <!-- Queue List -->
    <div v-if="queueTasks.length > 0" class="space-y-1.5">
      <div
        v-for="task in queueTasks"
        :key="task.id"
        class="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all cursor-pointer group"
        @click="onTaskClick(task)"
        role="button"
        tabindex="0"
        :aria-label="`Pick up task ${displayTaskId(task)}: ${task.name}`"
        @keydown.enter="onTaskClick(task)"
      >
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <!-- Priority Dot & Label -->
          <div class="flex items-center gap-1.5 shrink-0 font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border" :class="priorityBadgeClass(task.priority)">
            <span class="w-1.5 h-1.5 rounded-full" :class="priorityDotClass(task.priority)"></span>
            <span>{{ priorityLabel(task.priority) }}</span>
          </div>

          <!-- Task ID Monospace -->
          <span class="font-mono text-xs text-[#C98A4B] font-bold shrink-0">
            #{{ displayTaskId(task) }}
          </span>

          <!-- Task Title -->
          <span class="text-xs text-[#F5F2EB] font-medium truncate group-hover:text-[#C98A4B] transition-colors">
            {{ task.name }}
          </span>
        </div>

        <!-- Right Side: Tech tags or Due date -->
        <div class="flex items-center gap-2 shrink-0">
          <span v-if="task.dueDate" class="font-mono text-[10px] text-[#756F68] hidden sm:inline">
            📅 {{ task.dueDate }}
          </span>
          <span class="text-[#756F68] text-xs group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] font-mono text-xs text-[#756F68] flex items-center gap-2">
      <span>✅</span>
      <span>No tasks in queue</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Task, TaskPriority } from '../types'

const props = withDefaults(
  defineProps<{
    tasks: Task[]
    projectSlug: string
  }>(),
  {
    tasks: () => []
  }
)

const emit = defineEmits<{
  (e: 'task-click', task: Task): void
}>()

const router = useRouter()

const priorityOrder: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
}

const queueTasks = computed(() => {
  return props.tasks
    .filter((t) => t.status === 'in_queue')
    .sort((a, b) => {
      const pA = priorityOrder[a.priority] || 2
      const pB = priorityOrder[b.priority] || 2
      return pB - pA
    })
})

function displayTaskId(task: Task) {
  if (task.taskId) {
    return task.taskId.startsWith('#') ? task.taskId.slice(1) : task.taskId
  }
  return task.id.slice(0, 7).toUpperCase()
}

function priorityLabel(priority: TaskPriority) {
  switch (priority) {
    case 'critical':
      return 'CRIT'
    case 'high':
      return 'HIGH'
    case 'low':
      return 'LOW'
    case 'medium':
    default:
      return 'MED'
  }
}

function priorityBadgeClass(priority: TaskPriority) {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/10 text-red-400 border-red-500/30'
    case 'high':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
    case 'low':
      return 'bg-white/5 text-[#756F68] border-white/[0.08]'
    case 'medium':
    default:
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
  }
}

function priorityDotClass(priority: TaskPriority) {
  switch (priority) {
    case 'critical':
      return 'bg-red-400 animate-pulse'
    case 'high':
      return 'bg-orange-400'
    case 'low':
      return 'bg-[#756F68]'
    case 'medium':
    default:
      return 'bg-yellow-400'
  }
}

function onTaskClick(task: Task) {
  emit('task-click', task)
  if (props.projectSlug) {
    router.push(`/projects/${props.projectSlug}`)
  }
}
</script>
