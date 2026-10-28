<template>
  <div
    class="bg-[#111318] border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:border-indigo-500/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.14)] cursor-pointer group relative select-none w-full h-[180px] min-h-[180px] max-h-[180px] box-border"
    :class="[
      task.status === 'blocked'
        ? 'border-rose-500/50 hover:border-rose-500 bg-rose-950/10'
        : task.status === 'idea'
        ? 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/5'
        : 'border-white/[0.06]',
      isDragging ? 'border-indigo-500 bg-[#151821] ring-1 ring-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.2)]' : ''
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
      <span class="font-mono text-xs tabular-nums text-[#8A8F9E] font-medium tracking-tight group-hover:text-[#F3F4F6] transition-colors">
        #{{ displayTaskId }}
      </span>

      <!-- Priority Badge with icon -->
      <div class="flex items-center gap-1.5">
        <div
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] tabular-nums uppercase tracking-wider font-semibold border shrink-0"
          :class="priorityClasses"
        >
          <span>{{ task.priority || 'medium' }}</span>
          <NexuraIcon name="Zap" size="xs" :class="task.priority === 'critical' ? 'text-rose-400' : task.priority === 'high' ? 'text-amber-400' : 'opacity-80'" />
        </div>

        <!-- Quick Status Transfer Arrows (visible by default on touch screens, hover on desktop) -->
        <div class="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1 shrink-0">
          <button
            v-if="canMoveLeft"
            type="button"
            class="p-1 rounded bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:outline-none cursor-pointer"
            title="Move left"
            aria-label="Move left"
            @click.stop="$emit('move-left', task)"
          >
            <NexuraIcon name="ChevronLeft" size="xs" />
          </button>
          <button
            v-if="canMoveRight"
            type="button"
            class="p-1 rounded bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:outline-none cursor-pointer"
            title="Move right"
            aria-label="Move right"
            @click.stop="$emit('move-right', task)"
          >
            <NexuraIcon name="ChevronRight" size="xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Middle Section: Task Title & Description -->
    <div class="my-auto py-0.5 space-y-0.5 overflow-hidden">
      <h4 class="text-[#F3F4F6] font-sans font-medium text-sm leading-snug line-clamp-2 h-[38px] flex items-center" :title="task.name">
        <span class="line-clamp-2">{{ task.name }}</span>
      </h4>

      <p class="text-xs text-[#8A8F9E] line-clamp-1 font-sans h-[16px] truncate" :title="task.description || ''">
        {{ task.description || '' }}
      </p>
    </div>

    <!-- Bottom Section: Date & Tags/Badges -->
    <div class="pt-2 border-t border-white/[0.04] space-y-1.5 shrink-0">
      <!-- Due Date & Sprint Pill -->
      <div class="flex items-center gap-2 text-[10px] font-mono tabular-nums h-4">
        <span
          v-if="task.dueDate"
          class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border"
          :class="dueDateBadgeClass"
          :title="`Due: ${task.dueDate}`"
        >
          <NexuraIcon name="Calendar" size="xs" />
          <span>{{ formattedDueDate }}</span>
        </span>
        <span
          v-if="task.sprintId"
          class="text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 rounded font-mono text-[10px] tabular-nums"
        >
          Sprint
        </span>
        <span
          v-if="task.projectSlug"
          class="text-[#8A8F9E] bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 rounded font-mono text-[10px] truncate max-w-[85px]"
          :title="`Project: ${task.projectSlug}`"
        >
          {{ task.projectSlug }}
        </span>
      </div>

      <!-- Bottom Row: Tech Tags in Badges & Status badges -->
      <div class="flex items-center gap-1.5 overflow-hidden h-5">
        <template v-if="task.techTags && task.techTags.length">
          <span
            v-for="tag in task.techTags.slice(0, 3)"
            :key="tag"
            class="font-mono text-[10px] tabular-nums bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded px-2 py-0.5 font-medium transition-colors hover:bg-indigo-500/20 shrink-0 truncate max-w-[85px]"
          >
            {{ tag }}
          </span>
          <span
            v-if="task.techTags.length > 3"
            class="font-mono text-[9px] tabular-nums text-[#8A8F9E] shrink-0"
          >
            +{{ task.techTags.length - 3 }}
          </span>
        </template>

        <!-- Status Badge if Idea or Blocked -->
        <span
          v-if="task.status === 'idea'"
          class="ml-auto font-mono text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 uppercase tracking-wider font-bold shrink-0"
        >
          IDEA
        </span>
        <span
          v-else-if="task.status === 'blocked'"
          class="ml-auto font-mono text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded px-1.5 py-0.5 uppercase tracking-wider font-bold animate-pulse shrink-0"
        >
          BLOCKED
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NexuraIcon from './ui/NexuraIcon.vue'
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
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    case 'high':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'low':
      return 'bg-white/5 text-[#8A8F9E] border-white/[0.08]'
    case 'medium':
    default:
      return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
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
  if (!props.task.dueDate) return 'text-[#8A8F9E]'
  try {
    const d = new Date(props.task.dueDate)
    if (isNaN(d.getTime())) return 'text-[#8A8F9E] bg-white/5 border-white/[0.06]'
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(d)
    target.setHours(0, 0, 0, 0)
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    if (diffDays <= 1) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    return 'text-[#8A8F9E] bg-white/5 border-white/[0.06]'
  } catch {
    return 'text-[#8A8F9E] bg-white/5 border-white/[0.06]'
  }
})
</script>
