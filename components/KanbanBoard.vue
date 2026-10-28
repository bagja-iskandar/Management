<template>
  <div class="space-y-4">
    <!-- 5 ENLARGED KANBAN COLUMNS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 overflow-x-auto pb-4 snap-x">
      <!-- COLUMN 1: IDEA -->
      <KanbanColumn
        status="idea"
        title="IDEA"
        subtitle="Backlog & raw thoughts"
        dot-class="bg-amber-400"
        :tasks="ideaTasks"
        :is-drag-over="dragOverColumn === 'idea'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="false"
        :can-move-right="true"
        move-right-target="in_queue"
        empty-title="NO BACKLOG IDEAS"
        empty-subtitle="Add notes or ideas to spark new work"
        quick-add-label="+ Quick Add Idea"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drag-enter="onDragEnter"
        @drag-over="onDragOver"
        @drag-leave="onDragLeave"
        @drop="onDrop"
        @task-click="(t) => $emit('task-click', t)"
        @move-status="moveTaskStatus"
        @add-task="(st) => $emit('add-task', st)"
      />

      <!-- COLUMN 2: IN QUEUE -->
      <KanbanColumn
        status="in_queue"
        title="IN QUEUE"
        subtitle="Ready for execution"
        dot-class="bg-slate-400"
        :tasks="inQueueTasks"
        :is-drag-over="dragOverColumn === 'in_queue'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="true"
        :can-move-right="true"
        move-left-target="idea"
        move-right-target="running_sprint"
        empty-title="QUEUE EMPTY"
        empty-subtitle="Drag cards here or create a new task"
        quick-add-label="+ Quick Add Task"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drag-enter="onDragEnter"
        @drag-over="onDragOver"
        @drag-leave="onDragLeave"
        @drop="onDrop"
        @task-click="(t) => $emit('task-click', t)"
        @move-status="moveTaskStatus"
        @add-task="(st) => $emit('add-task', st)"
      />

      <!-- COLUMN 3: RUNNING -->
      <KanbanColumn
        status="running_sprint"
        title="RUNNING"
        subtitle="Active iteration"
        dot-class="bg-indigo-400"
        :tasks="runningSprintTasks"
        :is-drag-over="dragOverColumn === 'running_sprint'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="true"
        :can-move-right="true"
        move-left-target="in_queue"
        move-right-target="deployed"
        empty-title="NO ACTIVE SPRINT TASKS"
        empty-subtitle="Drag cards from queue to start working"
        quick-add-label="+ Quick Add Task"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drag-enter="onDragEnter"
        @drag-over="onDragOver"
        @drag-leave="onDragLeave"
        @drop="onDrop"
        @task-click="(t) => $emit('task-click', t)"
        @move-status="moveTaskStatus"
        @add-task="(st) => $emit('add-task', st)"
      />

      <!-- COLUMN 4: BLOCKED -->
      <KanbanColumn
        status="blocked"
        title="BLOCKED"
        subtitle="Impediments & errors"
        dot-class="bg-rose-400"
        :tasks="blockedTasks"
        :is-drag-over="dragOverColumn === 'blocked'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="true"
        :can-move-right="true"
        move-left-target="running_sprint"
        move-right-target="running_sprint"
        empty-title="NO BLOCKED TASKS"
        empty-subtitle="All deliverables running smoothly without blockers"
        quick-add-label="+ Report Blocker"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drag-enter="onDragEnter"
        @drag-over="onDragOver"
        @drag-leave="onDragLeave"
        @drop="onDrop"
        @task-click="(t) => $emit('task-click', t)"
        @move-status="moveTaskStatus"
        @add-task="(st) => $emit('add-task', st)"
      />

      <!-- COLUMN 5: DEPLOYED -->
      <KanbanColumn
        status="deployed"
        title="DEPLOYED"
        subtitle="Live & verified"
        dot-class="bg-emerald-400"
        :tasks="deployedTasks"
        :is-drag-over="dragOverColumn === 'deployed'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="true"
        :can-move-right="false"
        move-left-target="running_sprint"
        empty-title="NO DEPLOYED DELIVERABLES"
        empty-subtitle="Completed work and released tasks appear here"
        quick-add-label="+ Quick Add Task"
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @drag-enter="onDragEnter"
        @drag-over="onDragOver"
        @drag-leave="onDragLeave"
        @drop="onDrop"
        @task-click="(t) => $emit('task-click', t)"
        @move-status="moveTaskStatus"
        @add-task="(st) => $emit('add-task', st)"
      />
    </div>

    <!-- SOLID DRAGGING GHOST CARD -->
    <KanbanDragGhost
      :active-task="activeDragTask"
      :position="dragPosition"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Task, TaskStatus } from '~/types'
import KanbanColumn from './kanban/KanbanColumn.vue'
import KanbanDragGhost from './kanban/KanbanDragGhost.vue'

const props = defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  (e: 'update-status', taskId: string, newStatus: TaskStatus): void
  (e: 'add-task', status: TaskStatus): void
  (e: 'task-click', task: Task): void
}>()

// Drag and drop state
const dragOverColumn = ref<TaskStatus | null>(null)
const draggingTaskId = ref<string | null>(null)
const activeDragTask = ref<Task | null>(null)
const dragPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })

// Realtime optimistic task state (0ms instant move)
const localTasksList = ref<Task[]>([...(props.tasks || [])])

watch(
  () => props.tasks,
  (newTasks) => {
    if (newTasks && !draggingTaskId.value) {
      localTasksList.value = [...newTasks]
    }
  },
  { deep: true, immediate: true }
)

const priorityOrder: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
}

const processedTasks = computed(() => {
  return [...localTasksList.value].sort((a, b) => {
    const pA = priorityOrder[a.priority || 'medium'] || 0
    const pB = priorityOrder[b.priority || 'medium'] || 0
    if (pB !== pA) return pB - pA
    return (a.taskId || a.id).localeCompare(b.taskId || b.id)
  })
})

const ideaTasks = computed(() => processedTasks.value.filter((t) => t.status === 'idea'))
const inQueueTasks = computed(() => processedTasks.value.filter((t) => t.status === 'in_queue'))
const runningSprintTasks = computed(() => processedTasks.value.filter((t) => t.status === 'running_sprint'))
const blockedTasks = computed(() => processedTasks.value.filter((t) => t.status === 'blocked'))
const deployedTasks = computed(() => processedTasks.value.filter((t) => t.status === 'deployed'))

function moveTaskStatus(taskId: string, newStatus: TaskStatus) {
  localTasksList.value = localTasksList.value.map(t => {
    if (t.id === taskId || t.taskId === taskId) {
      return { ...t, status: newStatus }
    }
    return t
  })
  emit('update-status', taskId, newStatus)
}

let kanbanRafId: number | null = null
let kanbanLatestCoord: { x: number; y: number } | null = null

function updateKanbanDragPosition(x: number, y: number) {
  if (x === 0 && y === 0) return
  kanbanLatestCoord = { x, y }
  if (kanbanRafId === null) {
    kanbanRafId = requestAnimationFrame(() => {
      if (kanbanLatestCoord) {
        dragPosition.value = kanbanLatestCoord
      }
      kanbanRafId = null
    })
  }
}

function onWindowDragOver(event: DragEvent) {
  updateKanbanDragPosition(event.clientX, event.clientY)
}

function onDragStart(event: DragEvent, task: Task) {
  activeDragTask.value = task
  draggingTaskId.value = task.id
  dragPosition.value = { x: event.clientX, y: event.clientY }

  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', task.id)
    event.dataTransfer.effectAllowed = 'move'

    const transparentCanvas = document.createElement('canvas')
    transparentCanvas.width = 1
    transparentCanvas.height = 1
    event.dataTransfer.setDragImage(transparentCanvas, 0, 0)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('dragover', onWindowDragOver, { passive: false })
  }
}

function onDragEnd() {
  if (kanbanRafId !== null) {
    cancelAnimationFrame(kanbanRafId)
    kanbanRafId = null
  }
  draggingTaskId.value = null
  activeDragTask.value = null
  dragOverColumn.value = null
  if (typeof window !== 'undefined') {
    window.removeEventListener('dragover', onWindowDragOver)
  }
}

onUnmounted(() => {
  if (kanbanRafId !== null) {
    cancelAnimationFrame(kanbanRafId)
    kanbanRafId = null
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('dragover', onWindowDragOver)
  }
})

function onDragEnter(column: TaskStatus) {
  dragOverColumn.value = column
}

function onDragOver(column: TaskStatus, event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  if (dragOverColumn.value !== column) {
    dragOverColumn.value = column
  }
  updateKanbanDragPosition(event.clientX, event.clientY)
}

function onDragLeave(column: TaskStatus, event: DragEvent) {
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null
  if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
    return
  }
  if (dragOverColumn.value === column) {
    dragOverColumn.value = null
  }
}

function onDrop(newStatus: TaskStatus, event: DragEvent) {
  event.preventDefault()
  if (kanbanRafId !== null) {
    cancelAnimationFrame(kanbanRafId)
    kanbanRafId = null
  }
  dragOverColumn.value = null
  const taskId = draggingTaskId.value || event.dataTransfer?.getData('text/plain')
  
  if (taskId) {
    localTasksList.value = localTasksList.value.map(t => {
      if (t.id === taskId || t.taskId === taskId) {
        return { ...t, status: newStatus }
      }
      return t
    })
    emit('update-status', taskId, newStatus)
  }

  draggingTaskId.value = null
  activeDragTask.value = null
  if (typeof window !== 'undefined') {
    window.removeEventListener('dragover', onWindowDragOver)
  }
}
</script>
