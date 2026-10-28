<template>
  <div class="space-y-2">
    <!-- Header Row -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="font-sans text-xs uppercase tracking-wider text-[#8A8F9E] font-semibold">
          READY TO PICK UP
        </h3>
      </div>
      <span class="font-mono text-xs tabular-nums text-indigo-300 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-2 py-0.5">
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
          <div class="flex items-center gap-1.5 shrink-0 font-mono text-[10px] tabular-nums uppercase font-semibold px-2 py-0.5 rounded border" :class="priorityBadgeClass(task.priority)">
            <span class="w-1.5 h-1.5 rounded-full" :class="priorityDotClass(task.priority)"></span>
            <span>{{ priorityLabel(task.priority) }}</span>
          </div>

          <!-- Task ID Monospace -->
          <span class="font-mono text-xs tabular-nums text-indigo-400 font-semibold shrink-0">
            #{{ displayTaskId(task) }}
          </span>

          <!-- Task Title -->
          <span class="font-sans text-xs text-[#F3F4F6] font-medium truncate group-hover:text-indigo-300 transition-colors">
            {{ task.name }}
          </span>
        </div>

        <!-- Right Side: Tech tags or Due date -->
        <div class="flex items-center gap-2 shrink-0">
          <span v-if="task.dueDate" class="font-mono text-[10px] tabular-nums text-[#8A8F9E] hidden sm:inline-flex items-center gap-1">
            <NexuraIcon name="Calendar" size="xs" />
            <span>{{ task.dueDate }}</span>
          </span>
          <span class="text-[#8A8F9E] group-hover:text-[#F3F4F6] group-hover:translate-x-0.5 transition-all">
            <NexuraIcon name="ArrowRight" size="xs" />
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] font-sans text-xs text-[#8A8F9E] flex items-center gap-2">
      <NexuraIcon name="CheckCircle2" size="sm" class="text-emerald-400" />
      <span>No tasks in queue</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import NexuraIcon from './ui/NexuraIcon.vue'
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
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    case 'high':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'low':
      return 'bg-white/5 text-[#8A8F9E] border-white/[0.08]'
    case 'medium':
    default:
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  }
}

function priorityDotClass(priority: TaskPriority) {
  switch (priority) {
    case 'critical':
      return 'bg-rose-400 animate-pulse'
    case 'high':
      return 'bg-amber-400'
    case 'low':
      return 'bg-[#8A8F9E]'
    case 'medium':
    default:
      return 'bg-indigo-400'
  }
}

function onTaskClick(task: Task) {
  emit('task-click', task)
  if (props.projectSlug) {
    router.push(`/projects/${props.projectSlug}`)
  }
}
</script>
