<template>
  <div
    class="bg-[#111114] border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:border-[#C98A4B] hover:shadow-[0_0_16px_rgba(201,138,75,0.14)] cursor-pointer group relative select-none w-full h-[180px] min-h-[180px] max-h-[180px] box-border"
    :class="[
      task.status === 'blocked' ? 'border-red-500/50 hover:border-red-500 bg-red-950/10' : 'border-white/[0.06]',
      isDragging ? 'border-[#C98A4B] bg-[#18181C] ring-1 ring-[#C98A4B]/50 shadow-[0_0_16px_rgba(201,138,75,0.2)]' : ''
    ]"
    @click="$emit('click', task)"
    role="button"
    tabindex="0"
    :aria-label="`Task ${displayTaskId}: ${task.name}`"
    @keydown.enter.self="$emit('click', task)"
    @keydown.space.self.prevent="$emit('click', task)"
  >
    <!-- Top Row: #ENG-xxx & Priority Badge -->
    <div class="flex items-center justify-between h-5 shrink-0">
      <!-- Monospace Task ID -->
      <span class="font-mono text-xs text-[#756F68] font-medium tracking-tight group-hover:text-[#F5F2EB] transition-colors">
        #{{ displayTaskId }}
      </span>

      <!-- Priority Badge with icon -->
      <div class="flex items-center gap-1.5">
        <div
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider font-semibold border shrink-0"
          :class="priorityClasses"
        >
          <span>{{ task.priority || 'medium' }}</span>
          <span v-if="task.priority === 'critical'" class="text-red-400">⚡</span>
          <span v-else-if="task.priority === 'high'" class="text-orange-400">⚡</span>
          <span v-else class="opacity-80">⚡</span>
        </div>

        <!-- Quick Status Transfer Hover Arrows -->
        <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1 shrink-0">
          <button
            v-if="canMoveLeft"
            type="button"
            class="p-1 rounded bg-white/5 hover:bg-[#C98A4B]/20 text-[#756F68] hover:text-[#C98A4B] transition-colors focus:outline-none"
            title="Move left"
            aria-label="Move left"
            @click.stop="$emit('move-left', task)"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            v-if="canMoveRight"
            type="button"
            class="p-1 rounded bg-white/5 hover:bg-[#C98A4B]/20 text-[#756F68] hover:text-[#C98A4B] transition-colors focus:outline-none"
            title="Move right"
            aria-label="Move right"
            @click.stop="$emit('move-right', task)"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Middle Section: Task Title & Description -->
    <div class="my-auto py-0.5 space-y-0.5 overflow-hidden">
      <h4 class="text-[#F5F2EB] font-medium text-sm leading-snug line-clamp-2 h-[38px] flex items-center" :title="task.name">
        <span class="line-clamp-2">{{ task.name }}</span>
      </h4>

      <p class="text-xs text-[#756F68] line-clamp-1 font-sans h-[16px] truncate" :title="task.description || ''">
        {{ task.description || '' }}
      </p>
    </div>

    <!-- Bottom Section: Date & Tags/Badges -->
    <div class="pt-2 border-t border-white/[0.04] space-y-1.5 shrink-0">
      <!-- Due Date & Sprint Pill -->
      <div class="flex items-center gap-2 text-[10px] font-mono h-4">
        <span
          v-if="task.dueDate"
          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border"
          :class="dueDateBadgeClass"
          :title="`Due: ${task.dueDate}`"
        >
          <span>📅</span>
          <span>{{ formattedDueDate }}</span>
        </span>
        <span
          v-if="task.sprintId"
          class="text-[#C98A4B]/80 bg-[#C98A4B]/10 border border-[#C98A4B]/20 px-1.5 py-0.5 rounded font-mono"
        >
          Sprint
        </span>
      </div>

      <!-- Bottom Row: Tech Tags in Ochre Badges & Blocked status -->
      <div class="flex items-center gap-1.5 overflow-hidden h-5">
        <template v-if="task.techTags && task.techTags.length">
          <span
            v-for="tag in task.techTags.slice(0, 3)"
            :key="tag"
            class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/25 rounded px-2 py-0.2 font-medium transition-colors hover:bg-[#C98A4B]/20 shrink-0 truncate max-w-[85px]"
          >
            {{ tag }}
          </span>
          <span
            v-if="task.techTags.length > 3"
            class="font-mono text-[9px] text-[#756F68] shrink-0"
          >
            +{{ task.techTags.length - 3 }}
          </span>
        </template>
        <span
          v-else
          class="font-mono text-[10px] text-[#756F68]/60 italic shrink-0"
        >
          #core
        </span>

        <!-- Error Badge if task has error -->
        <span
          v-if="task.status === 'blocked'"
          class="ml-auto font-mono text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 rounded px-1.5 py-0.5 uppercase tracking-wider font-bold animate-pulse shrink-0"
        >
          ERROR
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../types'

const props = withDefaults(
  defineProps<{
    task: Task
    canMoveLeft?: boolean
    canMoveRight?: boolean
    canMoveBlocked?: boolean
    isDragging?: boolean
  }>(),
  {
    canMoveLeft: false,
    canMoveRight: false,
    canMoveBlocked: false,
    isDragging: false
  }
)

defineEmits<{
  (e: 'click', task: Task): void
  (e: 'move-left', task: Task): void
  (e: 'move-right', task: Task): void
  (e: 'toggle-blocked', task: Task): void
}>()

const displayTaskId = computed(() => {
  if (props.task.taskId) {
    return props.task.taskId.startsWith('#') ? props.task.taskId.slice(1) : props.task.taskId
  }
  return props.task.id ? props.task.id.slice(0, 7).toUpperCase() : 'TASK'
})

const priorityClasses = computed(() => {
  switch (props.task.priority) {
    case 'critical':
      return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'high':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    case 'low':
      return 'bg-white/5 text-[#756F68] border-white/[0.08]'
    case 'medium':
    default:
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  }
})

const formattedDueDate = computed(() => {
  if (!props.task.dueDate) return ''
  try {
    const d = new Date(props.task.dueDate)
    if (isNaN(d.getTime())) return props.task.dueDate
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(d)
    target.setHours(0, 0, 0, 0)
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `Overdue (${Math.abs(diffDays)}d)`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return props.task.dueDate
  }
})

const dueDateBadgeClass = computed(() => {
  if (!props.task.dueDate) return 'text-[#756F68]'
  try {
    const d = new Date(props.task.dueDate)
    if (isNaN(d.getTime())) return 'text-[#756F68] bg-white/5 border-white/[0.06]'
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(d)
    target.setHours(0, 0, 0, 0)
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'text-red-400 bg-red-500/10 border-red-500/30'
    if (diffDays <= 1) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    return 'text-[#756F68] bg-white/5 border-white/[0.06]'
  } catch {
    return 'text-[#756F68] bg-white/5 border-white/[0.06]'
  }
})
</script>
