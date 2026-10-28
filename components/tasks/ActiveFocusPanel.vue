<template>
  <div class="bg-[#0D0E12] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-200">
    <!-- Panel Header -->
    <div class="px-5 py-3.5 border-b border-white/[0.08] bg-[#111318]/70 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <NexuraIcon name="Zap" size="sm" class="animate-pulse" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-[#F3F4F6] flex items-center gap-2">
            <span>Active Sprint Focus</span>
            <span
              v-if="effectiveTask"
              class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium"
            >
              RUNNING
            </span>
          </h2>
          <p class="text-[11px] text-[#8A8F9E]">Real-time execution & interactive checklist breakdown</p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <!-- Existing multiple running tasks switcher -->
        <div v-if="runningTasks.length > 1" class="flex items-center gap-1.5 overflow-x-auto max-w-[280px] no-scrollbar">
          <button
            v-for="t in runningTasks"
            :key="t.id"
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            :class="effectiveTask?.id === t.id
              ? 'bg-indigo-600 text-white font-medium shadow-[0_0_10px_rgba(99,102,241,0.3)]'
              : 'bg-white/5 text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/10 border border-white/[0.06]'"
            @click="selectedTaskId = t.id"
          >
            <span>#{{ getDisplayId(t) }}</span>
          </button>
        </div>

        <!-- Close button -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close focus panel"
          title="Close focus panel"
          @click="$emit('close')"
        >
          <NexuraIcon name="X" size="sm" />
        </button>
      </div>
    </div>

    <!-- Main Content Body -->
    <div v-if="effectiveTask" class="p-5 flex flex-col gap-4">
      <!-- Deliverable Overview Card -->
      <div class="bg-[#111318] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
        <!-- Top Info Row -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs tabular-nums text-[#8A8F9E] bg-white/5 border border-white/[0.08] px-2 py-0.5 rounded">
              #{{ getDisplayId(effectiveTask) }}
            </span>
            <span
              v-if="effectiveTask.projectSlug"
              class="font-mono text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1"
            >
              <NexuraIcon name="Folder" size="xs" />
              <span>{{ effectiveTask.projectSlug }}</span>
            </span>
            <span
              class="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border tracking-wider"
              :class="priorityBadgeClass(effectiveTask.priority)"
            >
              {{ effectiveTask.priority || 'medium' }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span v-if="effectiveTask.dueDate" class="text-[11px] font-mono text-[#8A8F9E] flex items-center gap-1 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
              <NexuraIcon name="Calendar" size="xs" />
              <span>Due: {{ effectiveTask.dueDate }}</span>
            </span>

            <button
              type="button"
              class="text-[11px] font-mono text-[#8A8F9E] hover:text-[#F3F4F6] bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/[0.08] transition-colors flex items-center gap-1 cursor-pointer"
              title="Open full drawer"
              @click="openTaskInDrawer(effectiveTask.id)"
            >
              <span>Edit Details</span>
              <NexuraIcon name="ExternalLink" size="xs" />
            </button>
          </div>
        </div>

        <!-- Task Title -->
        <div>
          <h3 class="text-base font-medium text-[#F3F4F6] leading-snug">
            {{ effectiveTask.name }}
          </h3>
          <!-- Non-checklist description preview if any -->
          <p v-if="cleanNarrativeDescription" class="text-xs text-[#8A8F9E] mt-1 line-clamp-2">
            {{ cleanNarrativeDescription }}
          </p>
        </div>

        <!-- Progress Bar & Ratio -->
        <div class="pt-2 border-t border-white/[0.06] space-y-1.5">
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="text-[#8A8F9E] flex items-center gap-1.5">
              <NexuraIcon name="CheckSquare" size="xs" class="text-indigo-400" />
              <span>Checklist Progress</span>
            </span>
            <span class="font-semibold tabular-nums" :class="checklistStats.percentage === 100 ? 'text-emerald-400' : 'text-[#F3F4F6]'">
              {{ checklistStats.completed }}/{{ checklistStats.total }} completed ({{ checklistStats.percentage }}%)
            </span>
          </div>

          <!-- Progress Bar Track -->
          <div class="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5 border border-white/[0.04]">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="checklistStats.percentage === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-400 to-sky-400 shadow-[0_0_12px_rgba(99,102,241,0.3)]'"
              :style="{ width: `${checklistStats.percentage}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Checklist Items Section -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-mono uppercase tracking-wider text-[#8A8F9E] font-semibold">
            Execution Steps
          </h4>
          <span v-if="checklistStats.total > 0 && checklistStats.percentage === 100" class="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <NexuraIcon name="CheckCircle2" size="xs" />
            <span>All steps finished! Ready to deploy.</span>
          </span>
        </div>

        <!-- Checklist List -->
        <div class="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          <!-- Empty Checklist Prompt -->
          <div
            v-if="!checklistItems.length"
            class="py-6 px-4 rounded-xl border border-dashed border-white/[0.08] text-center bg-[#07080A]/40"
          >
            <NexuraIcon name="ListTodo" size="sm" class="text-[#565B68] mx-auto mb-1.5" />
            <p class="text-xs font-mono text-[#8A8F9E]">No checklist steps found in task description</p>
            <p class="text-[11px] text-[#565B68] mt-0.5">Type steps below to break this deliverable into tangible progress.</p>
          </div>

          <!-- Items -->
          <div
            v-for="(item, index) in checklistItems"
            :key="item.index"
            class="group flex items-start justify-between gap-3 p-2.5 rounded-xl border transition-all duration-150"
            :class="item.completed
              ? 'bg-white/[0.02] border-white/[0.04] text-[#8A8F9E]'
              : 'bg-[#111318]/60 border-white/[0.06] hover:border-white/[0.14] text-[#F3F4F6]'"
          >
            <!-- Checkbox & Label -->
            <button
              type="button"
              class="flex items-start gap-2.5 text-left flex-1 min-w-0 cursor-pointer focus:outline-none"
              :aria-label="`Toggle step: ${item.text}`"
              @click="toggleStep(item)"
            >
              <!-- Custom Obsidian Checkbox Box -->
              <span
                class="w-4 h-4 rounded-md border mt-0.5 shrink-0 flex items-center justify-center transition-all duration-150"
                :class="item.completed
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-[#07080A] border-white/[0.15] group-hover:border-indigo-400 text-transparent'"
              >
                <NexuraIcon name="Check" size="xs" :stroke-width="2.5" />
              </span>

              <span
                class="text-xs font-sans leading-relaxed select-text transition-colors"
                :class="item.completed ? 'line-through text-[#8A8F9E]' : 'text-[#F3F4F6]'"
              >
                {{ item.text }}
              </span>
            </button>

            <!-- Delete Step Button (visible on hover) -->
            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 p-1 text-[#565B68] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all focus:opacity-100 cursor-pointer"
              title="Delete step"
              @click="deleteStep(item)"
            >
              <NexuraIcon name="Trash2" size="xs" />
            </button>
          </div>
        </div>

        <!-- Quick Add Step Input -->
        <div class="pt-2">
          <form class="flex items-center gap-2" @submit.prevent="addStep">
            <div class="relative flex-1">
              <input
                ref="newStepInputRef"
                v-model="newStepText"
                type="text"
                placeholder="+ Add step... (press Enter to commit)"
                class="w-full bg-[#111318] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:outline-none transition-all font-sans"
              />
            </div>
            <button
              type="submit"
              :disabled="!newStepText.trim() || isSaving"
              class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5"
            >
              <NexuraIcon name="Plus" size="xs" />
              <span>Add</span>
            </button>
          </form>
        </div>

        <!-- Mark Deployed Quick Button when 100% finished -->
        <div
          v-if="checklistStats.total > 0 && checklistStats.percentage === 100"
          class="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-3"
        >
          <div class="flex items-center gap-2">
            <NexuraIcon name="CheckCircle2" size="sm" class="text-emerald-400" />
            <div>
              <p class="text-xs font-medium text-emerald-300">Deliverable Ready</p>
              <p class="text-[10px] text-[#8A8F9E]">All verification steps passed</p>
            </div>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
            @click="markDeliverableDeployed"
          >
            Mark Deployed
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State: No active running task -->
    <div v-else class="p-8 text-center flex flex-col items-center justify-center gap-3">
      <div class="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#8A8F9E]">
        <NexuraIcon name="Inbox" size="md" />
      </div>
      <div class="space-y-1 max-w-sm">
        <h3 class="text-sm font-semibold text-[#F3F4F6]">No Deliverable in RUNNING Sprint</h3>
        <p class="text-xs text-[#8A8F9E] leading-relaxed">
          Drag a card from <strong class="text-indigo-300">IN QUEUE</strong> to <strong class="text-indigo-400">RUNNING</strong> on your Kanban board to focus execution and track interactive checklist steps here.
        </p>
      </div>

      <!-- Quick pick from in_queue if available -->
      <div v-if="queuedTasks.length" class="pt-2 w-full max-w-md">
        <p class="text-[11px] font-mono text-[#8A8F9E] mb-2 uppercase tracking-wider font-semibold">
          Or pick from queue:
        </p>
        <div class="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
          <button
            v-for="qt in queuedTasks.slice(0, 3)"
            :key="qt.id"
            type="button"
            class="w-full p-2.5 rounded-xl bg-[#111318] border border-white/[0.06] hover:border-indigo-500/40 text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
            @click="startTaskImmediately(qt)"
          >
            <div class="flex items-center gap-2 truncate">
              <span class="font-mono text-[#8A8F9E]">#{{ getDisplayId(qt) }}</span>
              <span class="text-[#F3F4F6] truncate">{{ qt.name }}</span>
            </div>
            <span class="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0 ml-2">
              Start & Focus
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskPriority } from '~/types'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useTasks } from '~/composables/useTasks'
import { useTaskDrawer } from '~/composables/useTaskDrawer'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = defineProps<{
  task?: Task | null
  projectSlug?: string
}>()

const emit = defineEmits<{
  (e: 'task-updated', task: Task): void
  (e: 'close'): void
}>()

const workspaceStore = useWorkspaceStore()
const tasksApi = useTasks()
const { openTaskDrawer } = useTaskDrawer()

const selectedTaskId = ref<string | null>(null)
const newStepText = ref('')
const isSaving = ref(false)
const newStepInputRef = ref<HTMLInputElement | null>(null)

// Tasks in 'running_sprint'
const runningTasks = computed(() => {
  let list = (workspaceStore.tasks.value || []).filter((t) => t.status === 'running_sprint')
  if (props.projectSlug) {
    list = list.filter((t) => t.projectSlug === props.projectSlug)
  }
  return list
})

// Tasks in 'in_queue' for fallback
const queuedTasks = computed(() => {
  let list = (workspaceStore.tasks.value || []).filter((t) => t.status === 'in_queue')
  if (props.projectSlug) {
    list = list.filter((t) => t.projectSlug === props.projectSlug)
  }
  return list
})

// Current focused task
const effectiveTask = computed<Task | null>(() => {
  if (props.task) return props.task
  if (selectedTaskId.value) {
    const found = workspaceStore.tasks.value.find((t) => t.id === selectedTaskId.value)
    if (found) return found
  }
  return runningTasks.value[0] || null
})

function getDisplayId(t: Task): string {
  if (t.taskId) {
    return t.taskId.startsWith('#') ? t.taskId.slice(1) : t.taskId
  }
  return t.id ? t.id.slice(0, 7).toUpperCase() : 'TASK'
}

function priorityBadgeClass(priority?: TaskPriority): string {
  switch (priority) {
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
}

// Checklist Item Interface
interface ParsedChecklistItem {
  index: number
  completed: boolean
  text: string
  rawLine: string
}

// Markdown checklist parser: extracts - [ ] and - [x]
const checklistItems = computed<ParsedChecklistItem[]>(() => {
  const desc = effectiveTask.value?.description || ''
  if (!desc) return []

  const lines = desc.split('\n')
  const results: ParsedChecklistItem[] = []

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('* [ ] ')) {
      results.push({
        index: idx,
        completed: false,
        text: trimmed.slice(6).trim(),
        rawLine: line
      })
    } else if (
      trimmed.startsWith('- [x] ') ||
      trimmed.startsWith('- [X] ') ||
      trimmed.startsWith('* [x] ') ||
      trimmed.startsWith('* [X] ')
    ) {
      results.push({
        index: idx,
        completed: true,
        text: trimmed.slice(6).trim(),
        rawLine: line
      })
    }
  })

  return results
})

// Checklist statistics
const checklistStats = computed(() => {
  const total = checklistItems.value.length
  const completed = checklistItems.value.filter((i) => i.completed).length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, percentage }
})

// Non-checklist narrative description lines
const cleanNarrativeDescription = computed(() => {
  const desc = effectiveTask.value?.description || ''
  if (!desc) return ''
  return desc
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      return !t.startsWith('- [ ] ') && !t.startsWith('- [x] ') && !t.startsWith('- [X] ') && !t.startsWith('* [ ] ') && !t.startsWith('* [x] ')
    })
    .join(' ')
    .trim()
})

// Toggle a checklist step with 0ms optimistic update via tasksApi.updateTask
async function toggleStep(item: ParsedChecklistItem) {
  if (!effectiveTask.value) return
  const current = effectiveTask.value
  const previousDesc = current.description || ''

  const lines = previousDesc.split('\n')
  if (item.index < lines.length) {
    const targetLine = lines[item.index]
    if (item.completed) {
      lines[item.index] = targetLine.replace(/(\*|\-)\s*\[(x|X)\]/, '$1 [ ]')
    } else {
      lines[item.index] = targetLine.replace(/(\*|\-)\s*\[ \]/, '$1 [x]')
    }
  }

  const updatedDesc = lines.join('\n')

  try {
    const updated = await tasksApi.updateTask(current.id, { description: updatedDesc })
    emit('task-updated', updated)
  } catch (err) {
    console.error('[ActiveFocusPanel] Failed to update checklist step:', err)
  }
}

// Add a new step to the task description
async function addStep() {
  const text = newStepText.value.trim()
  if (!text || !effectiveTask.value || isSaving.value) return

  const current = effectiveTask.value
  const previousDesc = current.description || ''
  const newline = previousDesc && !previousDesc.endsWith('\n') ? '\n' : ''
  const updatedDesc = `${previousDesc}${newline}- [ ] ${text}`

  newStepText.value = ''
  isSaving.value = true

  try {
    const updated = await tasksApi.updateTask(current.id, { description: updatedDesc })
    emit('task-updated', updated)
  } catch (err) {
    console.error('[ActiveFocusPanel] Failed to append step:', err)
  } finally {
    isSaving.value = false
    newStepInputRef.value?.focus()
  }
}

// Delete an existing checklist step
async function deleteStep(item: ParsedChecklistItem) {
  if (!effectiveTask.value) return
  const current = effectiveTask.value
  const previousDesc = current.description || ''

  const lines = previousDesc.split('\n')
  lines.splice(item.index, 1)
  const updatedDesc = lines.join('\n')

  try {
    const updated = await tasksApi.updateTask(current.id, { description: updatedDesc })
    emit('task-updated', updated)
  } catch (err) {
    console.error('[ActiveFocusPanel] Failed to delete step:', err)
  }
}

// Mark deliverable as deployed when finished
async function markDeliverableDeployed() {
  if (!effectiveTask.value) return
  const current = effectiveTask.value

  try {
    const updated = await tasksApi.updateTask(current.id, { status: 'deployed' })
    emit('task-updated', updated)
  } catch (err) {
    console.error('[ActiveFocusPanel] Failed to mark deployed:', err)
  }
}

// Start a task immediately from the queue
async function startTaskImmediately(task: Task) {
  selectedTaskId.value = task.id

  try {
    const updated = await tasksApi.updateTask(task.id, { status: 'running_sprint' })
    emit('task-updated', updated)
  } catch (err) {
    console.error('[ActiveFocusPanel] Failed to start task:', err)
  }
}

function openTaskInDrawer(taskId: string) {
  openTaskDrawer(taskId)
}
</script>
