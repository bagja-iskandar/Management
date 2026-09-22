<template>
  <div class="space-y-4">
    <!-- KANBAN BOARD COMMAND TOOLBAR -->
    <KanbanToolbar
      v-model:search-query="localSearchQuery"
      v-model:selected-priority="selectedPriority"
      v-model:selected-tag="selectedTag"
      v-model:sort-by="sortBy"
      :priority-options="priorityOptions"
      :available-tags="availableTags"
      :total-tasks-count="(tasks || []).length"
      :filtered-count="processedTasks.length"
      :has-active-filters="hasActiveFilters"
      @reset-filters="resetFilters"
      @add-task="(status) => $emit('add-task', status)"
    />

    <!-- 4 ENLARGED KANBAN COLUMNS -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      <!-- COLUMN 1: ERROR -->
      <KanbanColumn
        status="blocked"
        title="ERROR"
        subtitle="Bugs & failing tasks"
        dot-class="bg-red-400 animate-pulse"
        :tasks="blockedTasks"
        :is-drag-over="dragOverColumn === 'blocked'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="false"
        :can-move-right="true"
        move-right-target="in_queue"
        empty-title="NO ACTIVE ERRORS"
        empty-subtitle="Semua deliverable berjalan lancar tanpa error"
        quick-add-label="+ Report Error / Bug"
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

      <!-- COLUMN 2: IN_QUEUE -->
      <KanbanColumn
        status="in_queue"
        title="IN_QUEUE"
        subtitle="Ready to pick up"
        dot-class="bg-slate-400"
        :tasks="inQueueTasks"
        :is-drag-over="dragOverColumn === 'in_queue'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="true"
        :can-move-right="true"
        move-left-target="blocked"
        move-right-target="running_sprint"
        empty-title="QUEUE EMPTY"
        empty-subtitle="Tarik kartu ke sini atau buat task baru"
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
        subtitle="Currently building"
        dot-class="bg-[#C98A4B] animate-pulse"
        :tasks="runningSprintTasks"
        :is-drag-over="dragOverColumn === 'running_sprint'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="true"
        :can-move-right="true"
        move-left-target="in_queue"
        move-right-target="deployed"
        empty-title="NO ACTIVE SPRINT TASKS"
        empty-subtitle="Tarik kartu dari queue untuk mulai sprint"
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

      <!-- COLUMN 4: DEPLOYED -->
      <KanbanColumn
        status="deployed"
        title="DEPLOYED"
        subtitle="Completed & live"
        dot-class="bg-green-400"
        :tasks="deployedTasks"
        :is-drag-over="dragOverColumn === 'deployed'"
        :dragging-task-id="draggingTaskId"
        :can-move-left="true"
        :can-move-right="false"
        move-left-target="running_sprint"
        empty-title="NO DEPLOYED DELIVERABLES"
        empty-subtitle="Kode yang siap atau rilis akan tampil di sini"
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
import KanbanToolbar from './kanban/KanbanToolbar.vue'
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

// Filters state
const localSearchQuery = ref('')
const selectedPriority = ref<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
const selectedTag = ref('all')
const sortBy = ref<'default' | 'priority' | 'dueDate' | 'title'>('default')

// Unique tech tags
const availableTags = computed(() => {
  const set = new Set<string>()
  for (const t of localTasksList.value) {
    if (t.techTags && Array.isArray(t.techTags)) {
      for (const tag of t.techTags) {
        if (tag) set.add(tag)
      }
    }
  }
  return Array.from(set).sort()
})

// Priority options with counts
const priorityOptions = computed(() => {
  const allTasks = localTasksList.value
  return [
    { value: 'all', label: 'All', count: allTasks.length },
    { value: 'critical', label: 'Critical', dot: 'bg-red-400 animate-pulse', count: allTasks.filter(t => t.priority === 'critical').length },
    { value: 'high', label: 'High', dot: 'bg-orange-400', count: allTasks.filter(t => t.priority === 'high').length },
    { value: 'medium', label: 'Medium', dot: 'bg-yellow-400', count: allTasks.filter(t => t.priority === 'medium').length },
    { value: 'low', label: 'Low', dot: 'bg-slate-400', count: allTasks.filter(t => t.priority === 'low').length }
  ]
})

const hasActiveFilters = computed(() => {
  return Boolean(
    localSearchQuery.value.trim() ||
    selectedPriority.value !== 'all' ||
    selectedTag.value !== 'all' ||
    sortBy.value !== 'default'
  )
})

function resetFilters() {
  localSearchQuery.value = ''
  selectedPriority.value = 'all'
  selectedTag.value = 'all'
  sortBy.value = 'default'
}

const priorityOrder: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
}

// Filtered and sorted tasks
const processedTasks = computed(() => {
  let list = localTasksList.value

  const query = localSearchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(query)
      const idMatch = (t.taskId || '').toLowerCase().includes(query)
      const tagMatch = (t.techTags || []).some((tag) => tag.toLowerCase().includes(query))
      const descMatch = (t.description || '').toLowerCase().includes(query)
      return nameMatch || idMatch || tagMatch || descMatch
    })
  }

  if (selectedPriority.value !== 'all') {
    list = list.filter((t) => t.priority === selectedPriority.value)
  }

  if (selectedTag.value !== 'all') {
    list = list.filter((t) => (t.techTags || []).includes(selectedTag.value))
  }

  if (sortBy.value === 'dueDate') {
    list = [...list].sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  } else if (sortBy.value === 'title') {
    list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } else {
    list = [...list].sort((a, b) => {
      const pA = priorityOrder[a.priority] || 0
      const pB = priorityOrder[b.priority] || 0
      if (pB !== pA) return pB - pA
      return (a.taskId || a.id).localeCompare(b.taskId || b.id)
    })
  }

  return list
})

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
