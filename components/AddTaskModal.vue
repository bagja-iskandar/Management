<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    @click.self="onCancel"
    role="presentation"
  >
    <div
      ref="dialogRef"
      class="w-full max-w-lg bg-[#111318] border border-white/[0.1] shadow-2xl rounded-2xl p-6 sm:p-7 flex flex-col gap-5 outline-none my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-task-title"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h2 id="modal-task-title" class="font-sans text-base font-semibold text-[#F3F4F6] flex items-center gap-2">
            <NexuraIcon name="CheckSquare" size="sm" class="text-indigo-400" />
            Create New Deliverable
          </h2>
          <p class="font-sans text-xs text-[#8A8F9E] mt-1">
            Assign an engineering deliverable to a project to track milestones and velocity.
          </p>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer"
          aria-label="Close modal"
          @click="onCancel"
        >
          <NexuraIcon name="X" size="sm" />
        </button>
      </div>

      <!-- Form -->
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit" novalidate>
        <!-- Validation Error Alert -->
        <div
          v-if="validationError"
          class="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono tabular-nums flex items-center gap-2"
          role="alert"
        >
          <NexuraIcon name="AlertCircle" size="sm" class="shrink-0 text-rose-400" />
          <span>{{ validationError }}</span>
        </div>

        <!-- Project Association (shown if not scoped to a specific project) -->
        <div v-if="!projectSlug" class="flex flex-col gap-1.5">
          <label for="task-project-select" class="font-sans text-xs font-semibold text-[#F3F4F6]">
            Project Association <span class="text-rose-400">*</span>
          </label>
          <select
            id="task-project-select"
            v-model="selectedProject"
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
            required
          >
            <option
              v-for="p in resolvedProjectOptions"
              :key="p.value"
              :value="p.value"
              class="bg-[#111318] text-[#F3F4F6]"
            >
              {{ p.label }}
            </option>
          </select>
        </div>

        <!-- Deliverable Name -->
        <div class="flex flex-col gap-1.5">
          <label for="task-name-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">
            Deliverable Name <span class="text-rose-400">*</span>
          </label>
          <input
            id="task-name-input"
            ref="nameInputRef"
            v-model="name"
            type="text"
            placeholder="e.g. Implement neural co-attention module"
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
            :class="{ 'border-rose-500/60 focus:ring-rose-500/40': !!validationError && !name.trim() }"
            required
          />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label for="task-desc-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">Description</label>
          <textarea
            id="task-desc-input"
            v-model="description"
            rows="2"
            placeholder="Build multi-head spatial attention mechanism to align multi-modal EEG feature maps."
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none custom-scrollbar"
          ></textarea>
        </div>

        <!-- Tech Tags (comma separated) -->
        <div class="flex flex-col gap-1.5">
          <label for="task-tags-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">Tech Tags (comma separated)</label>
          <input
            id="task-tags-input"
            v-model="techTagsInput"
            type="text"
            placeholder="e.g. vue, typescript, telemetry"
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-xs font-mono tabular-nums focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
          />
        </div>

        <!-- Priority Level -->
        <div class="flex flex-col gap-1.5">
          <label class="font-sans text-xs font-semibold text-[#F3F4F6]">Priority Level</label>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Priority Level">
            <button
              v-for="p in priorityOptions"
              :key="p.id"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums capitalize transition-all border cursor-pointer select-none"
              :class="priority === p.id ? p.activeClass : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.08] hover:text-[#F3F4F6] hover:border-white/[0.15]'"
              role="radio"
              :aria-checked="priority === p.id"
              @click="priority = p.id"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- Due Date -->
        <div class="flex flex-col gap-1.5">
          <label for="task-due-date" class="font-sans text-xs font-semibold text-[#F3F4F6]">Due Date</label>
          <input
            id="task-due-date"
            v-model="dueDate"
            type="date"
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-xs font-mono tabular-nums focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
          />
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-sans font-medium text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:ring-1 focus:ring-white/20 focus:outline-none cursor-pointer"
            @click="onCancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-lg bg-[#F3F4F6] hover:bg-white text-xs font-sans font-medium text-[#07080A] shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
            :disabled="isSubmitting || disabled"
          >
            <span v-if="isSubmitting" class="flex items-center gap-1.5">
              <NexuraIcon name="Loader2" size="sm" class="animate-spin" />
              <span>Creating...</span>
            </span>
            <span v-else class="flex items-center gap-1.5">
              <NexuraIcon name="Plus" size="sm" :stroke-width="2.2" />
              <span>Create Deliverable</span>
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import NexuraIcon from './ui/NexuraIcon.vue'
import type { TaskPriority } from '~/types'

export interface ProjectItemOption {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    projectSlug?: string
    projects?: ProjectItemOption[]
  }>(),
  {
    disabled: false,
    projectSlug: '',
    projects: () => []
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', task: {
    name: string
    description: string
    project?: string
    projectSlug: string
    status: 'in_queue'
    priority: TaskPriority
    dueDate: string
    techTags: string[]
  }): void
}>()

const projectsApi = useProjects()
const { data: fetchedProjects } = useLazyAsyncData('add-task-modal-projects', () => projectsApi.getProjects())

const resolvedProjectOptions = computed(() => {
  if (props.projects && props.projects.length > 0) {
    return props.projects
  }
  if (fetchedProjects.value && fetchedProjects.value.length > 0) {
    return fetchedProjects.value.map((p) => ({
      label: p.title || p.slug,
      value: p.slug
    }))
  }
  return [
    { label: 'Nexura Management Workspace', value: 'management' },
    { label: 'TF-HiTNet EEG Emotion', value: 'tf-hitnet-eeg' },
    { label: 'Neural Signal Lab', value: 'neural-signal-lab' }
  ]
})

const selectedProject = ref(props.projectSlug || 'management')

watch(() => props.projectSlug, (newSlug) => {
  if (newSlug) {
    selectedProject.value = newSlug
  }
})

watch(resolvedProjectOptions, (opts) => {
  if (!selectedProject.value && opts.length > 0) {
    selectedProject.value = opts[0].value
  }
}, { immediate: true })

function getDefaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

const name = ref('')
const description = ref('')
const techTagsInput = ref('')
const priority = ref<TaskPriority>('medium')
const dueDate = ref(getDefaultDueDate())
const validationError = ref('')
const isSubmitting = ref(false)

const priorityOptions = [
  { id: 'low', label: 'Low', activeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/40' },
  { id: 'medium', label: 'Medium', activeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm' },
  { id: 'high', label: 'High', activeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
  { id: 'critical', label: 'Critical', activeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40' }
] as const

const dialogRef = ref<HTMLElement | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
let previousActiveElement: HTMLElement | null = null

onMounted(() => {
  previousActiveElement = document.activeElement as HTMLElement | null
  window.addEventListener('keydown', onKeyDown)
  nextTick(() => {
    nameInputRef.value?.focus()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  previousActiveElement?.focus()
})

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    onCancel()
    return
  }

  if (e.key === 'Tab' && dialogRef.value) {
    const focusable = dialogRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

function onCancel() {
  emit('close')
}

function onSubmit() {
  validationError.value = ''
  if (!name.value.trim()) {
    validationError.value = 'Deliverable Name is required.'
    nameInputRef.value?.focus()
    return
  }

  const techTags = techTagsInput.value
    ? techTagsInput.value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    : []

  const targetSlug = props.projectSlug || selectedProject.value || 'management'

  isSubmitting.value = true
  emit('create', {
    name: name.value.trim(),
    description: description.value.trim(),
    project: targetSlug,
    projectSlug: targetSlug,
    status: 'in_queue',
    priority: priority.value,
    dueDate: dueDate.value,
    techTags
  })
}
</script>
