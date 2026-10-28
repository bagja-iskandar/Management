<template>
  <Teleport to="body">
    <div
      v-if="effectiveIsOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto bg-black/80 backdrop-blur-md transition-all"
      aria-labelledby="modal-task-title"
      role="dialog"
      aria-modal="true"
      @click.self="handleClose"
    >
      <!-- Loading State -->
      <div
        v-if="isLoadingTask"
        class="relative w-full max-w-sm bg-[#111318] border border-white/[0.1] rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center gap-3 text-[#F3F4F6] my-auto"
      >
        <NexuraIcon name="Loader2" size="lg" class="animate-spin text-indigo-400" />
        <span class="font-mono text-xs text-[#8A8F9E]">Loading deliverable details...</span>
      </div>

      <!-- Not Found State -->
      <div
        v-else-if="!currentTask"
        class="relative w-full max-w-sm bg-[#111318] border border-white/[0.1] rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center gap-4 text-[#F3F4F6] my-auto"
      >
        <div class="text-center space-y-1">
          <h3 class="font-sans text-sm font-semibold text-[#F3F4F6]">Deliverable Not Found</h3>
          <p class="font-mono text-xs text-[#8A8F9E]">The requested deliverable could not be loaded.</p>
        </div>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-[#F3F4F6] border border-white/[0.08] transition-colors cursor-pointer"
          @click="handleClose"
        >
          Close Drawer
        </button>
      </div>

      <!-- Centered Full-Rounded Modal Container -->
      <div
        v-else
        class="relative w-full max-w-2xl bg-[#111318] border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#F3F4F6] my-auto outline-none transition-all"
        @keydown.esc="handleClose"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-white/[0.06] bg-[#0B0C10]/60 flex items-start justify-between gap-4 shrink-0 rounded-t-2xl">
          <div class="space-y-2 flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs tabular-nums text-[#8A8F9E] bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 rounded-full inline-flex items-center">
                #{{ displayTaskId }}
              </span>
              <span
                class="font-mono text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full border tracking-wider tabular-nums"
                :class="statusBadgeClass"
              >
                {{ form.status.replace('_', ' ') }}
              </span>
              <span v-if="form.projectSlug" class="font-mono text-[10px] tabular-nums text-[#8A8F9E] bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06] inline-flex items-center gap-1.5">
                <NexuraIcon name="Folder" size="xs" class="text-[#8A8F9E]" />
                <span>{{ form.projectSlug }}</span>
              </span>
              <!-- Linked GitHub Issue Badge -->
              <a
                v-if="form.githubIssueUrl"
                :href="form.githubIssueUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-[10px] tabular-nums text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/25 inline-flex items-center gap-1.5 transition-colors group cursor-pointer"
                title="Open linked issue on GitHub"
              >
                <span>Linked Issue #{{ form.githubIssueNumber || '' }}</span>
                <NexuraIcon name="ExternalLink" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <!-- Create GitHub Issue Button -->
              <button
                v-else-if="effectiveRepo"
                type="button"
                class="font-mono text-[10px] text-[#8A8F9E] hover:text-[#F3F4F6] bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-0.5 rounded-full border border-white/[0.06] hover:border-white/[0.15] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                :disabled="isCreatingIssue || busy || isBusyAction"
                title="Create linked issue on GitHub"
                @click="handleCreateIssue"
              >
                <NexuraIcon v-if="isCreatingIssue" name="Loader2" size="xs" class="animate-spin text-indigo-400" />
                <NexuraIcon v-else name="Github" size="xs" />
                <span>{{ isCreatingIssue ? 'Creating Issue...' : 'Create GitHub Issue' }}</span>
              </button>
            </div>
            <input
              id="modal-task-title"
              v-model="form.name"
              type="text"
              class="w-full bg-transparent font-sans font-semibold text-lg text-[#F3F4F6] border-b border-transparent hover:border-white/[0.15] focus:border-indigo-500/60 focus:outline-none transition-colors py-0.5 placeholder-[#565B68]"
              placeholder="Task deliverable title..."
            />
          </div>

          <!-- Close Button -->
          <button
            type="button"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-[#8A8F9E] hover:text-[#F3F4F6] bg-white/[0.03] hover:bg-white/[0.08] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/40 shrink-0 border border-white/[0.08] cursor-pointer"
            @click="handleClose"
            aria-label="Close dialog"
          >
            <NexuraIcon name="X" size="sm" />
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1 font-sans text-xs custom-scrollbar">
          <!-- 1. Status Selector Capsules -->
          <div class="space-y-2">
            <label class="font-sans text-xs font-semibold text-[#8A8F9E] uppercase tracking-wider block">
              Execution Status
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="s in statusOptions"
                :key="s.value"
                type="button"
                class="py-2 px-3 rounded-lg font-sans text-xs border text-center transition-all flex items-center justify-center gap-2 cursor-pointer"
                :class="form.status === s.value ? s.activeClass : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.08] hover:text-[#F3F4F6] hover:bg-white/[0.04]'"
                @click="form.status = s.value"
              >
                <NexuraIcon :name="s.icon" size="xs" />
                <span>{{ s.label }}</span>
              </button>
            </div>
          </div>

          <!-- 2. Priority Selector Capsules -->
          <div class="space-y-2">
            <label class="font-sans text-xs font-semibold text-[#8A8F9E] uppercase tracking-wider block">
              Priority Level
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="p in priorityOptions"
                :key="p.value"
                type="button"
                class="py-2 px-3 rounded-lg font-mono text-xs tabular-nums border text-center transition-all flex items-center justify-center gap-2 cursor-pointer"
                :class="form.priority === p.value ? p.activeClass : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.08] hover:text-[#F3F4F6] hover:bg-white/[0.04]'"
                @click="form.priority = p.value"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="p.dotClass"></span>
                <span>{{ p.label }}</span>
              </button>
            </div>
          </div>

          <!-- 3. Project Slug & Due Date Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="font-sans text-xs font-semibold text-[#8A8F9E] uppercase tracking-wider block">
                Linked Project
              </label>
              <div class="relative">
                <select
                  v-model="form.projectSlug"
                  class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer appearance-none"
                >
                  <option
                    v-for="p in availableProjects"
                    :key="p.slug"
                    :value="p.slug"
                    class="bg-[#111318] text-[#F3F4F6]"
                  >
                    {{ p.slug }} ({{ p.title }})
                  </option>
                  <option value="" class="bg-[#111318] text-[#8A8F9E]">(None / General)</option>
                </select>
                <NexuraIcon name="ChevronDown" size="xs" class="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A8F9E]" />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="font-sans text-xs font-semibold text-[#8A8F9E] uppercase tracking-wider block">
                Due Date
              </label>
              <input
                v-model="form.dueDate"
                type="date"
                class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none font-mono tabular-nums cursor-pointer"
              />
            </div>
          </div>

          <!-- 4. Tech Tags Editor -->
          <div class="space-y-1.5">
            <label class="font-sans text-xs font-semibold text-[#8A8F9E] uppercase tracking-wider block">
              Tech Tags
            </label>
            <div class="flex items-center gap-2 flex-wrap">
              <span
                v-for="(tag, idx) in form.techTags"
                :key="tag"
                class="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 rounded-md px-2.5 py-1"
              >
                <span>{{ tag }}</span>
                <button
                  type="button"
                  class="hover:text-rose-400 text-[#8A8F9E] transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                  @click="removeTag(idx)"
                  title="Remove tag"
                >
                  <NexuraIcon name="X" size="xs" />
                </button>
              </span>

              <div class="inline-flex items-center gap-1 bg-[#07080A] border border-white/[0.08] rounded-md px-2.5 py-1 focus-within:border-indigo-500/60">
                <input
                  v-model="newTagInput"
                  type="text"
                  placeholder="+ add tag"
                  class="bg-transparent text-xs font-mono tabular-nums text-[#F3F4F6] placeholder-[#565B68] focus:outline-none w-20"
                  @keydown.enter.prevent="addTag"
                />
                <button
                  type="button"
                  class="w-5 h-5 rounded bg-white/[0.05] hover:bg-indigo-500 hover:text-white text-[#8A8F9E] flex items-center justify-center transition-colors cursor-pointer"
                  @click="addTag"
                  title="Add tag"
                >
                  <NexuraIcon name="Plus" size="xs" />
                </button>
              </div>
            </div>
          </div>

          <!-- 5. Task Description & Interactive Checklist -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-sans text-xs font-semibold text-[#8A8F9E] uppercase tracking-wider">
                Description & Checklist
              </label>
              <button
                type="button"
                class="font-mono text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                @click="appendChecklistItem"
              >
                <NexuraIcon name="Plus" size="xs" />
                <span>Add checklist item</span>
              </button>
            </div>

            <!-- Description Textarea -->
            <textarea
              v-model="form.description"
              rows="4"
              class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 rounded-lg p-3.5 text-xs font-mono tabular-nums leading-relaxed custom-scrollbar"
              placeholder="Write Markdown notes or task checklists (- [ ] Item)..."
            ></textarea>

            <!-- Parsed Interactive Checklist Items (if any) -->
            <div v-if="checklistItems.length" class="space-y-1.5 pt-3 border-t border-white/[0.06]">
              <div class="font-mono text-xs text-[#8A8F9E] mb-1">Interactive Checklist:</div>
              <div
                v-for="(item, i) in checklistItems"
                :key="i"
                class="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#07080A]/60 border border-white/[0.06] cursor-pointer hover:bg-white/[0.03] transition-colors"
                @click="toggleChecklist(i)"
              >
                <input
                  type="checkbox"
                  :checked="item.completed"
                  class="rounded bg-[#07080A] border-white/20 text-indigo-500 focus:ring-indigo-500/40 cursor-pointer"
                  @click.stop="toggleChecklist(i)"
                />
                <span
                  class="font-mono text-xs tabular-nums"
                  :class="item.completed ? 'line-through text-[#8A8F9E]' : 'text-[#F3F4F6]'"
                >
                  {{ item.text }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-4 border-t border-white/[0.06] bg-[#0B0C10]/60 flex items-center justify-between gap-4 shrink-0 rounded-b-2xl">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              class="font-sans text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-500/20 inline-flex items-center gap-1.5 cursor-pointer"
              :disabled="busy || isBusyAction"
              @click="handleDelete"
            >
              <NexuraIcon name="Trash2" size="xs" />
              <span>Delete Task</span>
            </button>

            <!-- Linked Issue in footer -->
            <a
              v-if="form.githubIssueUrl"
              :href="form.githubIssueUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="hidden sm:inline-flex font-mono text-xs tabular-nums text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-3 py-1.5 rounded-lg items-center gap-1.5 transition-colors group cursor-pointer"
              title="Open linked issue on GitHub"
            >
              <span>Linked Issue #{{ form.githubIssueNumber || '' }}</span>
              <NexuraIcon name="ExternalLink" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <!-- Create Issue button in footer -->
            <button
              v-else-if="effectiveRepo"
              type="button"
              class="hidden sm:inline-flex font-sans text-xs text-[#8A8F9E] hover:text-[#F3F4F6] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] px-3 py-1.5 rounded-lg items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              :disabled="isCreatingIssue || busy || isBusyAction"
              title="Create GitHub Issue"
              @click="handleCreateIssue"
            >
              <NexuraIcon v-if="isCreatingIssue" name="Loader2" size="xs" class="animate-spin text-indigo-400" />
              <NexuraIcon v-else name="Github" size="xs" />
              <span>{{ isCreatingIssue ? 'Creating...' : 'Create GitHub Issue' }}</span>
            </button>
          </div>

          <div class="flex items-center gap-2.5">
            <button
              type="button"
              class="px-4 py-2 rounded-lg font-sans text-xs font-medium text-[#8A8F9E] hover:text-[#F3F4F6] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors cursor-pointer"
              :disabled="busy || isBusyAction"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-5 py-2 rounded-lg font-sans text-xs font-medium bg-[#F3F4F6] hover:bg-white text-[#07080A] shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              :disabled="busy || isBusyAction"
              @click="submitSave"
            >
              <NexuraIcon v-if="busy || isBusyAction" name="Loader2" size="xs" class="animate-spin text-[#07080A]" />
              <NexuraIcon v-else name="Check" size="xs" :stroke-width="2.2" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import NexuraIcon from './ui/NexuraIcon.vue'
import { createGitHubIssue } from '../composables/useGitHub'
import { useTaskDrawer } from '../composables/useTaskDrawer'
import { useWorkspaceStore } from '../composables/useWorkspaceStore'
import { useTasks } from '../composables/useTasks'
import type { Task, TaskStatus, TaskPriority, Project } from '../types'

const props = withDefaults(
  defineProps<{
    isOpen?: boolean
    taskId?: string | null
    task?: Task | null
    busy?: boolean
    repo?: string
  }>(),
  {
    isOpen: undefined,
    taskId: undefined,
    task: undefined,
    busy: false,
    repo: undefined
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: Partial<Task>): void
  (e: 'delete', task: Task): void
}>()

const { isDrawerOpen, activeTaskId, closeTaskDrawer } = useTaskDrawer()
const { tasks, projects, updateTaskInStore, removeTaskFromStore } = useWorkspaceStore()
const tasksApi = useTasks()

const effectiveIsOpen = computed(() => {
  if (typeof props.isOpen === 'boolean') {
    return props.isOpen
  }
  return isDrawerOpen.value
})

const effectiveTaskId = computed(() => {
  return props.taskId !== undefined ? props.taskId : activeTaskId.value
})

const internalTask = ref<Task | null>(null)
const isLoadingTask = ref(false)
const isBusyAction = ref(false)

const currentTask = computed<Task | null>(() => {
  if (props.task) return props.task
  if (!effectiveTaskId.value) return null
  const fromStore = tasks.value.find(
    (t) => t.id === effectiveTaskId.value || t.taskId === effectiveTaskId.value
  )
  if (fromStore) return fromStore
  return internalTask.value
})

// Fetch task if not in store
watch(
  [effectiveTaskId, effectiveIsOpen],
  async ([id, open]) => {
    if (!open || !id) {
      if (!open) {
        internalTask.value = null
      }
      return
    }
    if (props.task) return

    const fromStore = tasks.value.find((t) => t.id === id || t.taskId === id)
    if (!fromStore) {
      try {
        isLoadingTask.value = true
        const fetched = await tasksApi.getTask(id)
        internalTask.value = fetched
      } catch (err) {
        console.error('[TaskDrawer] Failed to fetch task by id:', id, err)
        internalTask.value = null
      } finally {
        isLoadingTask.value = false
      }
    }
  },
  { immediate: true }
)

// Lock background body scroll when open
watch(
  effectiveIsOpen,
  (open) => {
    if (typeof document !== 'undefined') {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
  },
  { immediate: true }
)

const effectiveRepo = computed(() => {
  if (props.repo) return props.repo
  if (currentTask.value?.projectSlug) {
    const slug = currentTask.value.projectSlug.toLowerCase()
    if (slug === 'management') return 'bagja-iskandar/Management'
    return `bagja-iskandar/${currentTask.value.projectSlug}`
  }
  return 'bagja-iskandar/Management'
})

const availableProjects = computed<Project[]>(() => {
  const list = [...projects.value]
  if (form.projectSlug && !list.some((p) => p.slug === form.projectSlug)) {
    list.unshift({
      id: form.projectSlug,
      slug: form.projectSlug,
      title: form.projectSlug,
      status: 'active',
      priority: 'medium',
      techStack: [],
      createdAt: '',
      updatedAt: ''
    })
  }
  return list
})

const isCreatingIssue = ref(false)
const newTagInput = ref('')

const form = reactive({
  name: '',
  description: '',
  status: 'in_queue' as TaskStatus,
  priority: 'medium' as TaskPriority,
  projectSlug: '',
  techTags: [] as string[],
  dueDate: '',
  githubIssueUrl: '',
  githubIssueNumber: undefined as number | undefined,
  githubPrUrl: ''
})

watch(
  currentTask,
  (t) => {
    if (!t) return
    form.name = t.name || ''
    form.description = t.description || ''
    form.status = t.status || 'in_queue'
    form.priority = t.priority || 'medium'
    form.projectSlug = t.projectSlug || ''
    form.techTags = [...(t.techTags || [])]
    form.dueDate = t.dueDate || ''
    form.githubIssueUrl = t.githubIssueUrl || ''
    form.githubIssueNumber = t.githubIssueNumber
    form.githubPrUrl = t.githubPrUrl || ''
  },
  { deep: true, immediate: true }
)

const displayTaskId = computed(() => {
  if (!currentTask.value) return ''
  if (currentTask.value.taskId) {
    return currentTask.value.taskId.startsWith('#')
      ? currentTask.value.taskId.slice(1)
      : currentTask.value.taskId
  }
  return currentTask.value.id.slice(0, 7).toUpperCase()
})

const statusOptions: { label: string; value: TaskStatus; icon: string; activeClass: string }[] = [
  { label: 'In Queue', value: 'in_queue', icon: 'Clock', activeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 font-medium shadow-[0_0_12px_rgba(99,102,241,0.15)]' },
  { label: 'Running', value: 'running_sprint', icon: 'Zap', activeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40 font-medium shadow-[0_0_12px_rgba(14,165,233,0.15)]' },
  { label: 'Deployed', value: 'deployed', icon: 'CheckCircle2', activeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-medium shadow-[0_0_12px_rgba(16,185,129,0.15)]' },
  { label: 'Blocked', value: 'blocked', icon: 'AlertTriangle', activeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-medium shadow-[0_0_12px_rgba(244,63,94,0.15)]' }
]

const priorityOptions: { label: string; value: TaskPriority; dotClass: string; activeClass: string }[] = [
  { label: 'Critical', value: 'critical', dotClass: 'bg-rose-400', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-medium shadow-[0_0_12px_rgba(244,63,94,0.15)]' },
  { label: 'High', value: 'high', dotClass: 'bg-amber-400', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium shadow-[0_0_12px_rgba(245,158,11,0.15)]' },
  { label: 'Medium', value: 'medium', dotClass: 'bg-indigo-400', activeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-medium shadow-[0_0_12px_rgba(99,102,241,0.15)]' },
  { label: 'Low', value: 'low', dotClass: 'bg-slate-400', activeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40 font-medium shadow-[0_0_12px_rgba(148,163,184,0.15)]' }
]

const statusBadgeClass = computed(() => {
  switch (form.status) {
    case 'deployed':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'running_sprint':
      return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
    case 'blocked':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    case 'in_queue':
    default:
      return 'bg-white/[0.05] text-[#8A8F9E] border-white/[0.08]'
  }
})

// Checklist parser
interface ChecklistItem {
  completed: boolean
  text: string
  rawLine: string
}

const checklistItems = computed<ChecklistItem[]>(() => {
  if (!form.description) return []
  const lines = form.description.split('\n')
  const items: ChecklistItem[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('* [ ] ')) {
      items.push({ completed: false, text: trimmed.slice(6), rawLine: line })
    } else if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ') || trimmed.startsWith('* [x] ')) {
      items.push({ completed: true, text: trimmed.slice(6), rawLine: line })
    }
  }

  return items
})

function toggleChecklist(index: number) {
  const item = checklistItems.value[index]
  if (!item) return
  const lines = form.description.split('\n')
  const updatedLines = lines.map((line) => {
    if (line === item.rawLine) {
      if (item.completed) {
        return line.replace(/(\*|\-)\s*\[(x|X)\]/, '$1 [ ]')
      } else {
        return line.replace(/(\*|\-)\s*\[ \]/, '$1 [x]')
      }
    }
    return line
  })
  form.description = updatedLines.join('\n')
}

function appendChecklistItem() {
  const newline = form.description && !form.description.endsWith('\n') ? '\n' : ''
  form.description += `${newline}- [ ] New deliverable item`
}

function addTag() {
  const tag = newTagInput.value.trim().toLowerCase()
  if (tag && !form.techTags.includes(tag)) {
    form.techTags.push(tag)
  }
  newTagInput.value = ''
}

function removeTag(index: number) {
  form.techTags.splice(index, 1)
}

function handleClose() {
  emit('close')
  closeTaskDrawer()
}

async function handleDelete() {
  if (!currentTask.value) return
  const taskToDelete = currentTask.value
  emit('delete', taskToDelete)

  try {
    isBusyAction.value = true
    await tasksApi.deleteTask(taskToDelete.id)
    removeTaskFromStore(taskToDelete.id)
    handleClose()
  } catch (err) {
    console.error('[TaskDrawer] Failed to delete task:', err)
  } finally {
    isBusyAction.value = false
  }
}

async function submitSave() {
  if (!currentTask.value) return
  const targetId = currentTask.value.id
  const payload: Partial<Task> = {
    name: form.name.trim() || currentTask.value.name,
    description: form.description,
    status: form.status,
    priority: form.priority,
    projectSlug: form.projectSlug || undefined,
    techTags: form.techTags,
    dueDate: form.dueDate || undefined,
    githubIssueUrl: form.githubIssueUrl || undefined,
    githubIssueNumber: form.githubIssueNumber || undefined,
    githubPrUrl: form.githubPrUrl || undefined
  }

  emit('save', payload)
  updateTaskInStore(targetId, payload)

  try {
    isBusyAction.value = true
    const updated = await tasksApi.updateTask(targetId, payload)
    if (updated) {
      updateTaskInStore(targetId, updated)
    }
    handleClose()
  } catch (err) {
    console.error('[TaskDrawer] Failed to update task:', err)
  } finally {
    isBusyAction.value = false
  }
}

async function handleCreateIssue() {
  if (!effectiveRepo.value || isCreatingIssue.value || !currentTask.value) return
  isCreatingIssue.value = true
  try {
    const res = await createGitHubIssue({
      repo: effectiveRepo.value,
      taskId: currentTask.value.id,
      title: form.name.trim() || currentTask.value.name,
      body: form.description || undefined,
      labels: form.techTags && form.techTags.length ? form.techTags : undefined
    })

    if (res?.ok && res?.issue) {
      form.githubIssueUrl = res.issue.htmlUrl
      form.githubIssueNumber = res.issue.number

      const patch: Partial<Task> = {
        name: form.name.trim() || currentTask.value.name,
        description: form.description,
        status: form.status,
        priority: form.priority,
        projectSlug: form.projectSlug || undefined,
        techTags: form.techTags,
        dueDate: form.dueDate || undefined,
        githubIssueUrl: res.issue.htmlUrl,
        githubIssueNumber: res.issue.number,
        githubPrUrl: form.githubPrUrl || undefined
      }

      emit('save', patch)
      updateTaskInStore(currentTask.value.id, patch)
      await tasksApi.updateTask(currentTask.value.id, patch)
    }
  } catch (err) {
    console.error('Failed to create GitHub issue from task:', err)
  } finally {
    isCreatingIssue.value = false
  }
}
</script>
