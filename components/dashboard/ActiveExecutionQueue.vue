<template>
  <section class="obs-card rounded-xl overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 shrink-0">
      <div>
        <div class="flex items-center gap-2">
          <NexuraIcon name="Zap" size="sm" class="text-indigo-400 shrink-0" />
          <h2 class="text-sm font-semibold text-[#F3F4F6]">Active Execution Queue &amp; Focus Targets</h2>
          <span class="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {{ inFlightCount }} In Flight
          </span>
        </div>
        <p class="text-xs text-[#8A8F9E] mt-0.5">
          Immediate deliverables currently in flight
        </p>
      </div>

      <!-- Segmented Tabs -->
      <div class="flex items-center gap-1 p-0.5 rounded-lg bg-[#0B0C10] border border-white/[0.06] text-xs">
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium cursor-pointer"
          :class="activeTab === 'inflight' ? 'bg-white/[0.09] text-[#F3F4F6]' : 'text-[#8A8F9E] hover:text-white'"
          @click="activeTab = 'inflight'"
        >
          In Flight ({{ inFlightCount }})
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium cursor-pointer"
          :class="activeTab === 'critical' ? 'bg-white/[0.09] text-[#F3F4F6]' : 'text-[#8A8F9E] hover:text-white'"
          @click="activeTab = 'critical'"
        >
          Critical / High ({{ criticalCount }})
        </button>
        <button
          type="button"
          class="px-2.5 py-1 rounded-md transition font-medium cursor-pointer"
          :class="activeTab === 'all' ? 'bg-white/[0.09] text-[#F3F4F6]' : 'text-[#8A8F9E] hover:text-white'"
          @click="activeTab = 'all'"
        >
          All Queue ({{ allTasks.length }})
        </button>
      </div>
    </div>

    <!-- Execution Queue Task List -->
    <div v-if="filteredTasks.length > 0" class="divide-y divide-white/[0.05]">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="px-4 py-2.5 hover:bg-white/[0.03] flex items-center justify-between gap-3 cursor-pointer transition group"
        @click="$emit('task-click', task)"
      >
        <!-- Left: Glowing Priority Dot + Task ID + Task Name -->
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="getPriorityDotClass(task)"
            :title="`Priority: ${task.priority}`"
          ></span>

          <span class="font-mono text-xs text-[#8A8F9E] shrink-0">
            {{ task.taskId || `#${task.id.slice(0, 7)}` }}
          </span>

          <span
            class="text-sm font-medium truncate group-hover:text-white transition"
            :class="task.status === 'deployed' ? 'text-[#8A8F9E] line-through' : 'text-[#F3F4F6]'"
            :title="task.name"
          >
            {{ task.name }}
          </span>
        </div>

        <!-- Right: Project Pill + Status Badge + Due Date + Open Button -->
        <div class="flex items-center gap-2.5 shrink-0">
          <span
            v-if="task.projectSlug"
            class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-[#8A8F9E] font-mono"
          >
            {{ task.projectSlug }}
          </span>

          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium"
            :class="getStatusBadge(task.status).class"
          >
            {{ getStatusBadge(task.status).label }}
          </span>

          <span class="font-mono text-xs text-[#8A8F9E] min-w-[50px] text-right">
            {{ formatDueOrDate(task) }}
          </span>

          <!-- Open Drawer Icon -->
          <button
            type="button"
            class="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition opacity-0 group-hover:opacity-100"
            title="Open Task Drawer"
            @click.stop="$emit('task-click', task)"
          >
            <NexuraIcon name="ArrowUpRight" size="xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Honest Empty State -->
    <div
      v-else
      class="p-6 text-center text-xs text-[#8A8F9E] font-mono flex flex-col items-center justify-center space-y-2"
    >
      <div class="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#565B68]">
        <NexuraIcon name="Inbox" size="sm" class="text-[#8A8F9E]" />
      </div>
      <div class="text-[#F3F4F6] font-medium">
        {{ activeTab === 'inflight' ? 'No active tasks in flight.' : 'No deliverables found.' }}
      </div>
      <p class="text-[11px] text-[#8A8F9E]">
        {{ activeTab === 'inflight' ? 'Pick a deliverable from In Queue to start execution.' : 'Select another queue or stage deliverables for execution.' }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskStatus } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    tasks?: Task[]
  }>(),
  {
    tasks: () => []
  }
)

defineEmits<{
  (e: 'task-click', task: Task): void
}>()

const activeTab = ref<'inflight' | 'critical' | 'all'>('inflight')

const allTasks = computed(() => {
  return props.tasks || []
})

// In-Flight tasks: running_sprint or in_queue
const inFlightTasks = computed(() => {
  return allTasks.value.filter((t) => t.status === 'running_sprint')
})

const inFlightCount = computed(() => inFlightTasks.value.length)

// Critical / High priority tasks
const criticalTasks = computed(() => {
  return allTasks.value.filter(
    (t) => (t.priority === 'critical' || t.priority === 'high' || t.status === 'blocked') && t.status !== 'deployed'
  )
})

const criticalCount = computed(() => criticalTasks.value.length)

// Active filter list capped at 7 items
const filteredTasks = computed(() => {
  if (activeTab.value === 'inflight') {
    return inFlightTasks.value.slice(0, 7)
  }
  if (activeTab.value === 'critical') {
    return criticalTasks.value.slice(0, 7)
  }
  return allTasks.value.slice(0, 7)
})

function getPriorityDotClass(task: Task): string {
  if (task.status === 'deployed') {
    return 'bg-emerald-400'
  }
  if (task.priority === 'critical' || task.status === 'blocked') {
    return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
  }
  if (task.priority === 'high') {
    return 'bg-amber-400'
  }
  if (task.priority === 'medium') {
    return 'bg-indigo-400'
  }
  return 'bg-zinc-400'
}

function getStatusBadge(status: TaskStatus) {
  switch (status) {
    case 'running_sprint':
      return { label: 'In Progress', class: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' }
    case 'blocked':
      return { label: 'Blocked', class: 'bg-rose-500/15 text-rose-300 border border-rose-500/30' }
    case 'deployed':
      return { label: 'Deployed', class: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' }
    case 'in_queue':
    default:
      return { label: 'Queued', class: 'bg-white/[0.06] text-[#8A8F9E] border border-white/[0.08]' }
  }
}

function formatDueOrDate(task: Task): string {
  if (task.status === 'deployed') return 'Deployed'
  if (task.dueDate) {
    const todayStr = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const due = task.dueDate.slice(0, 10)
    if (due === todayStr) return 'Today'
    if (due === tomorrow) return 'Tomorrow'
    if (due < todayStr) return 'Overdue'
    const parts = due.split('-')
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const m = months[parseInt(parts[1], 10) - 1]
      return `${m} ${parseInt(parts[2], 10)}`
    }
    return task.dueDate
  }
  return 'No Due Date'
}
</script>
