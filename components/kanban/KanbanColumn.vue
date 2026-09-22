<template>
  <div
    class="flex flex-col bg-[#111114] rounded-2xl p-4 transition-all duration-150 h-[calc(100vh-240px)] min-h-[620px] shadow-lg"
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
          <p class="text-[10px] text-[#756F68] font-sans">{{ subtitle }}</p>
        </div>
        <span
          class="font-mono text-[11px] rounded-full px-2 py-0.5 ml-1"
          :class="badgeClass"
        >
          {{ tasks.length }}
        </span>
      </div>

      <button
        type="button"
        class="p-1.5 rounded-lg text-xs font-mono transition-colors focus:outline-none cursor-pointer"
        :class="topAddBtnClass"
        :title="`Add task to ${title}`"
        @click="$emit('add-task', status)"
      >
        ⊕ Add
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
          class="h-48 flex flex-col items-center justify-center border border-white/[0.08] rounded-xl text-[#756F68] text-xs font-mono gap-1.5 px-4 text-center bg-[#09090B]/40"
        >
          <span
            class="font-semibold flex items-center gap-1"
            :class="status === 'blocked' ? 'text-green-400' : (status === 'deployed' ? 'text-green-400' : 'text-[#756F68]')"
          >
            <span v-if="status === 'blocked'">✓</span>
            <span>{{ emptyTitle }}</span>
          </span>
          <span class="text-[10px] text-[#756F68]">{{ emptySubtitle }}</span>
        </div>
      </div>

      <!-- Bottom Quick Add Button -->
      <button
        type="button"
        class="mt-3 w-full py-2.5 px-3 rounded-xl transition-all text-xs font-mono flex items-center justify-center gap-1.5 focus:outline-none focus:ring-1 h-10 shrink-0 cursor-pointer"
        :class="quickAddBtnClass"
        @click="$emit('add-task', status)"
      >
        <span>{{ quickAddLabel }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task, TaskStatus } from '~/types'
import TaskCard from '../TaskCard.vue'

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
    if (props.status === 'blocked') return 'border-2 border-red-400 ring-2 ring-red-400/40 bg-[#18181C]'
    if (props.status === 'running_sprint') return 'border-2 border-[#C98A4B] ring-2 ring-[#C98A4B]/40 bg-[#18181C]'
    if (props.status === 'deployed') return 'border-2 border-green-400 ring-2 ring-green-400/40 bg-[#18181C]'
    return 'border-2 border-[#C98A4B] ring-2 ring-[#C98A4B]/40 bg-[#18181C]'
  }
  if (props.status === 'blocked') return 'border border-red-500/20'
  if (props.status === 'running_sprint') return 'border border-[#C98A4B]/30'
  if (props.status === 'deployed') return 'border border-green-500/20'
  return 'border border-white/[0.06]'
})

const headerBorderClass = computed(() => {
  if (props.status === 'blocked') return 'border-b border-red-500/20'
  if (props.status === 'running_sprint') return 'border-b border-[#C98A4B]/30'
  if (props.status === 'deployed') return 'border-b border-green-500/20'
  return 'border-b border-white/[0.06]'
})

const titleClass = computed(() => {
  if (props.status === 'blocked') return 'text-red-400'
  if (props.status === 'running_sprint') return 'text-[#C98A4B]'
  if (props.status === 'deployed') return 'text-green-400'
  return 'text-[#F5F2EB]'
})

const badgeClass = computed(() => {
  if (props.status === 'blocked') return 'bg-red-500/10 text-red-400 border border-red-500/25'
  if (props.status === 'running_sprint') return 'bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/30'
  if (props.status === 'deployed') return 'bg-green-500/10 text-green-400 border border-green-500/25'
  return 'bg-white/5 text-[#756F68] border border-white/[0.06]'
})

const topAddBtnClass = computed(() => {
  if (props.status === 'blocked') return 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
  if (props.status === 'running_sprint') return 'bg-[#C98A4B]/10 hover:bg-[#C98A4B]/20 text-[#C98A4B]'
  if (props.status === 'deployed') return 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
  return 'bg-white/5 hover:bg-[#C98A4B]/20 text-[#756F68] hover:text-[#C98A4B]'
})

const quickAddBtnClass = computed(() => {
  if (props.status === 'blocked') {
    return 'border border-red-500/30 text-red-400/80 hover:text-red-300 hover:border-red-400 hover:bg-[#18181C] focus:ring-red-400'
  }
  if (props.status === 'running_sprint') {
    return 'border border-[#C98A4B]/40 text-[#C98A4B] hover:text-[#F5F2EB] hover:border-[#C98A4B] hover:bg-[#18181C] focus:ring-[#C98A4B]'
  }
  return 'border border-white/[0.08] text-[#756F68] hover:text-[#F5F2EB] hover:border-[#C98A4B]/50 hover:bg-[#18181C] focus:ring-[#C98A4B]'
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 138, 75, 0.4);
}
</style>
