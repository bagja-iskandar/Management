<template>
  <div
    class="flex flex-col bg-[#111318]/70 rounded-2xl p-3.5 transition-all duration-150 h-[calc(100vh-240px)] min-h-[620px] shadow-sm backdrop-blur-sm"
    :class="containerBorderClass"
    @dragover.prevent="$emit('drag-over', status, $event)"
    @dragenter.prevent="$emit('drag-enter', status)"
    @dragleave="$emit('drag-leave', status, $event)"
    @drop.prevent="$emit('drop', status, $event)"
  >
    <!-- Column Header -->
    <div
      class="flex items-center justify-between pb-3 mb-3 shrink-0"
      :class="headerBorderClass"
    >
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full" :class="dotClass" aria-hidden="true"></span>
        <div>
          <h3
            class="font-mono text-xs tracking-wider uppercase font-bold"
            :class="titleClass"
          >
            {{ title }}
          </h3>
          <p class="text-[10px] text-[#8A8F9E] font-sans">{{ subtitle }}</p>
        </div>
        <span
          class="font-mono text-[11px] tabular-nums rounded-full px-2 py-0.5 ml-1"
          :class="badgeClass"
        >
          {{ tasks.length }}
        </span>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono transition-colors focus:outline-none cursor-pointer"
        :class="topAddBtnClass"
        :title="`Add task to ${title}`"
        @click="$emit('add-task', status)"
      >
        <NexuraIcon name="Plus" size="xs" />
        <span>Add</span>
      </button>
    </div>

    <!-- Task List Container -->
    <div
      class="rounded-xl p-1 flex flex-col justify-between transition-all flex-1 min-h-0 overflow-hidden"
      @dragover.prevent
    >
      <div class="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :can-move-left="canMoveLeft"
          :can-move-right="canMoveRight"
          :is-dragging="draggingTaskId === task.id"
          draggable="true"
          @dragstart="$emit('drag-start', $event, task)"
          @dragend="$emit('drag-end')"
          @click="$emit('task-click', task)"
          @move-left="moveLeftTarget ? $emit('move-status', task.id, moveLeftTarget) : null"
          @move-right="moveRightTarget ? $emit('move-status', task.id, moveRightTarget) : null"
        />

        <!-- Empty State -->
        <div
          v-if="!tasks.length"
          class="h-48 flex flex-col items-center justify-center border border-white/[0.06] rounded-xl text-[#8A8F9E] text-xs font-mono gap-1.5 px-4 text-center bg-[#07080A]/40"
        >
          <span
            class="font-semibold flex items-center gap-1.5"
            :class="status === 'blocked' || status === 'deployed' ? 'text-emerald-400' : status === 'idea' ? 'text-amber-400' : 'text-[#8A8F9E]'"
          >
            <NexuraIcon v-if="status === 'blocked' || status === 'deployed'" name="CheckCircle2" size="sm" class="text-emerald-400" />
            <NexuraIcon v-else-if="status === 'idea'" name="Sparkles" size="sm" class="text-amber-400" />
            <span>{{ emptyTitle }}</span>
          </span>
          <span class="text-[10px] text-[#565B68]">{{ emptySubtitle }}</span>
        </div>
      </div>

      <!-- Bottom Quick Add Button -->
      <button
        type="button"
        class="mt-3 w-full py-2.5 px-3 rounded-xl transition-all text-xs font-mono flex items-center justify-center gap-1.5 focus:outline-none focus:ring-1 h-10 shrink-0 cursor-pointer active:scale-[0.99]"
        :class="quickAddBtnClass"
        @click="$emit('add-task', status)"
      >
        <NexuraIcon name="Plus" size="xs" />
        <span>{{ quickAddLabel }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task, TaskStatus } from '~/types'
import TaskCard from '../TaskCard.vue'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = defineProps<{
  status: TaskStatus
  title: string
  subtitle: string
  dotClass: string
  tasks: Task[]
  isDragOver: boolean
  draggingTaskId: string | null
  canMoveLeft: boolean
  canMoveRight: boolean
  moveLeftTarget?: TaskStatus
  moveRightTarget?: TaskStatus
  emptyTitle: string
  emptySubtitle: string
  quickAddLabel: string
}>()

defineEmits<{
  (e: 'drag-start', event: DragEvent, task: Task): void
  (e: 'drag-end'): void
  (e: 'drag-enter', status: TaskStatus): void
  (e: 'drag-over', status: TaskStatus, event: DragEvent): void
  (e: 'drag-leave', status: TaskStatus, event: DragEvent): void
  (e: 'drop', status: TaskStatus, event: DragEvent): void
  (e: 'task-click', task: Task): void
  (e: 'move-status', taskId: string, newStatus: TaskStatus): void
  (e: 'add-task', status: TaskStatus): void
}>()

const containerBorderClass = computed(() => {
  if (props.isDragOver) {
    if (props.status === 'idea') return 'border-2 border-amber-500 ring-2 ring-amber-500/40 bg-[#171920]'
    if (props.status === 'blocked') return 'border-2 border-rose-500 ring-2 ring-rose-500/40 bg-[#171920]'
    if (props.status === 'running_sprint') return 'border-2 border-indigo-500 ring-2 ring-indigo-500/40 bg-[#171920]'
    if (props.status === 'deployed') return 'border-2 border-emerald-500 ring-2 ring-emerald-500/40 bg-[#171920]'
    return 'border-2 border-indigo-500 ring-2 ring-indigo-500/40 bg-[#171920]'
  }
  if (props.status === 'idea') return 'border border-amber-500/25'
  if (props.status === 'blocked') return 'border border-rose-500/25'
  if (props.status === 'running_sprint') return 'border border-indigo-500/25'
  if (props.status === 'deployed') return 'border border-emerald-500/25'
  return 'border border-white/[0.06]'
})

const headerBorderClass = computed(() => {
  if (props.status === 'idea') return 'border-b border-amber-500/20'
  if (props.status === 'blocked') return 'border-b border-rose-500/20'
  if (props.status === 'running_sprint') return 'border-b border-indigo-500/20'
  if (props.status === 'deployed') return 'border-b border-emerald-500/20'
  return 'border-b border-white/[0.06]'
})

const titleClass = computed(() => {
  if (props.status === 'idea') return 'text-amber-400'
  if (props.status === 'blocked') return 'text-rose-400'
  if (props.status === 'running_sprint') return 'text-indigo-400'
  if (props.status === 'deployed') return 'text-emerald-400'
  return 'text-[#F3F4F6]'
})

const badgeClass = computed(() => {
  if (props.status === 'idea') return 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
  if (props.status === 'blocked') return 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
  if (props.status === 'running_sprint') return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25'
  if (props.status === 'deployed') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
  return 'bg-white/5 text-[#8A8F9E] border border-white/[0.06]'
})

const topAddBtnClass = computed(() => {
  if (props.status === 'idea') return 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
  if (props.status === 'blocked') return 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
  if (props.status === 'running_sprint') return 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
  if (props.status === 'deployed') return 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
  return 'bg-white/5 hover:bg-indigo-500/20 text-[#8A8F9E] hover:text-indigo-300'
})

const quickAddBtnClass = computed(() => {
  if (props.status === 'idea') {
    return 'border border-amber-500/30 text-amber-400/80 hover:text-amber-300 hover:border-amber-400 hover:bg-amber-950/20 focus:ring-amber-400'
  }
  if (props.status === 'blocked') {
    return 'border border-rose-500/30 text-rose-400/80 hover:text-rose-300 hover:border-rose-400 hover:bg-rose-950/20 focus:ring-rose-400'
  }
  if (props.status === 'running_sprint') {
    return 'border border-indigo-500/30 text-indigo-400 hover:text-white hover:border-indigo-400 hover:bg-indigo-600/20 focus:ring-indigo-500'
  }
  if (props.status === 'deployed') {
    return 'border border-emerald-500/30 text-emerald-400/80 hover:text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/20 focus:ring-emerald-400'
  }
  return 'border border-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] hover:border-indigo-500/40 hover:bg-white/[0.02] focus:ring-indigo-500'
})
</script>
