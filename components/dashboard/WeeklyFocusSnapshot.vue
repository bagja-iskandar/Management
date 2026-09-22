<template>
  <section class="bg-[#111114] border border-white/[0.07] rounded-xl p-3.5 sm:p-4 shadow-xl space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.07] pb-2">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-[#C98A4B]/15 border border-[#C98A4B]/30 flex items-center justify-center text-[#C98A4B] shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h2 class="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wide">
          WEEKLY FOCUS & SPRINT DELIVERABLES
        </h2>
      </div>
      <span class="font-mono text-[10px] text-[#C98A4B] bg-[#C98A4B]/15 px-2 py-0.5 rounded-full border border-[#C98A4B]/30 font-semibold whitespace-nowrap">
        {{ sprintBadgeLabel }}
      </span>
    </div>

    <!-- Objective & Progress Strip -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-[#18181C]/70 border border-white/[0.06] rounded-lg p-3">
      <div class="md:col-span-8 space-y-1">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[9px] uppercase tracking-wider text-[#C98A4B] font-bold">
            SPRINT TARGET
          </span>
          <span class="text-zinc-600">•</span>
          <span class="text-xs text-zinc-200 font-medium">
            "{{ objectiveText }}"
          </span>
        </div>
      </div>

      <div class="md:col-span-4 space-y-1.5">
        <div class="flex items-center justify-between text-[10px] font-mono">
          <span class="text-zinc-400">Progress</span>
          <span
            class="font-bold"
            :class="progressPercentage >= 100 ? 'text-emerald-400' : 'text-[#C98A4B]'"
          >
            {{ progressPercentage }}% ({{ deployedTasksCount }}/{{ totalTasks }} completed)
          </span>
        </div>
        <div class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-gradient-to-r from-[#C98A4B] to-emerald-400 h-1.5 rounded-full transition-all duration-500"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="flex justify-between text-[9px] font-mono text-zinc-500">
          <span>{{ deployedTasksCount }} done</span>
          <span>{{ inFlightTasksCount }} in-flight</span>
          <span>{{ inQueueTasksCount }} in-queue</span>
        </div>
      </div>
    </div>

    <!-- Active In-Flight Deliverables List -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="font-mono text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
          ACTIVE IN-FLIGHT DELIVERABLES ({{ displayedInFlightTasks.length }})
        </span>
        <span class="text-[9px] font-mono text-zinc-500">
          Click item to open drawer
        </span>
      </div>

      <!-- Real tasks list in responsive grid -->
      <div v-if="displayedInFlightTasks.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <div
          v-for="(task, idx) in displayedInFlightTasks"
          :key="task.id"
          class="bg-[#18181C] border border-white/[0.07] hover:border-[#C98A4B]/40 rounded-lg p-2.5 transition cursor-pointer group shadow-sm"
          @click="$emit('task-click', task)"
        >
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 min-w-0">
              <span
                class="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                :class="idx % 2 === 0 ? 'bg-[#C98A4B]' : 'bg-sky-400'"
              ></span>
              <span class="font-mono text-[11px] font-semibold text-zinc-200 group-hover:text-[#C98A4B] transition">
                #{{ task.taskId || task.id.slice(0, 7) }}
              </span>
              <span class="text-[9px] font-mono px-1 py-0.2 rounded border bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/20 truncate max-w-[90px]">
                {{ cleanProjectName(task.projectSlug) }}
              </span>
            </div>
            <span class="font-mono text-[9px] text-zinc-500 shrink-0">
              {{ task.priority || 'medium' }}
            </span>
          </div>

          <p class="text-xs text-zinc-300 line-clamp-1 group-hover:text-zinc-100 transition mt-1.5">
            {{ task.name }}
          </p>
        </div>
      </div>

      <!-- Empty state when no tasks are running (Compact 1-line strip, no giant void) -->
      <div
        v-else
        class="p-2.5 bg-[#18181C]/40 border border-white/[0.06] rounded-lg flex items-center justify-between font-mono text-xs"
      >
        <span class="text-zinc-400 text-[11px]">
          No active tasks in running sprint
        </span>
        <span class="text-[10px] text-zinc-500">
          Move queued deliverables to "Running Sprint" in Kanban to track progress here.
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task, Sprint } from '~/types'

const props = withDefaults(
  defineProps<{
    tasks?: Task[]
    sprint?: Sprint | null
    objective?: string
  }>(),
  {
    tasks: () => [],
    sprint: null,
    objective: undefined
  }
)

defineEmits<{
  (e: 'task-click', task: Task): void
}>()

// Calculate current ISO week
const sprintBadgeLabel = computed(() => {
  if (props.sprint?.name) {
    return props.sprint.name.toUpperCase()
  }
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `WEEK ${weekNo} · ${now.getFullYear()}`
})

const objectiveText = computed(() => {
  if (props.objective) return props.objective
  if (props.sprint?.objective) return props.sprint.objective
  return 'Deliver current sprint milestones and maintain operational readiness.'
})

const totalTasks = computed(() => {
  return props.tasks.length
})

const deployedTasksCount = computed(() => {
  return props.tasks.filter((t) => t.status === 'deployed').length
})

const inFlightTasksCount = computed(() => {
  return props.tasks.filter((t) => t.status === 'running_sprint').length
})

const inQueueTasksCount = computed(() => {
  return props.tasks.filter((t) => t.status === 'in_queue').length
})

const progressPercentage = computed(() => {
  const total = totalTasks.value
  if (total === 0) return 0
  return Math.round((deployedTasksCount.value / total) * 100)
})

const displayedInFlightTasks = computed(() => {
  return props.tasks.filter((t) => t.status === 'running_sprint').slice(0, 6)
})

function cleanProjectName(slug?: string): string {
  if (!slug) return 'Management'
  const parts = slug.split('/')
  return parts[parts.length - 1]
}
</script>
