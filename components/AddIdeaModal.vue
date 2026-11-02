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
      aria-labelledby="modal-idea-title"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h2 id="modal-idea-title" class="font-sans text-base font-semibold text-[#F3F4F6] flex items-center gap-2">
            <NexuraIcon name="Lightbulb" size="sm" class="text-amber-400" />
            Capture New Idea
          </h2>
          <p class="font-sans text-xs text-[#8A8F9E] mt-1">
            Log inspiration, hypotheses, and architectural concepts to the idea backlog.
          </p>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500/40 cursor-pointer"
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

        <!-- Project Scope (compact dropdown) -->
        <div class="flex flex-col gap-1.5">
          <label for="idea-project-select" class="font-sans text-xs font-semibold text-[#F3F4F6]">
            Project Scope
          </label>
          <select
            id="idea-project-select"
            v-model="selectedProject"
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 focus:outline-none cursor-pointer"
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

        <!-- Idea Headline -->
        <div class="flex flex-col gap-1.5">
          <label for="idea-name-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">
            Idea Headline <span class="text-rose-400">*</span>
          </label>
          <input
            id="idea-name-input"
            ref="nameInputRef"
            v-model="name"
            type="text"
            placeholder="What's the spark? (e.g. Explore WebGPU for real-time visualization)"
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 focus:outline-none"
            :class="{ 'border-rose-500/60 focus:ring-rose-500/40': !!validationError && !name.trim() }"
            required
          />
        </div>

        <!-- Context & Notes -->
        <div class="flex flex-col gap-1.5">
          <label for="idea-desc-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">
            Context & Notes
          </label>
          <textarea
            id="idea-desc-input"
            v-model="description"
            rows="4"
            placeholder="Why does this matter? Add context, references, or raw notes..."
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 focus:outline-none custom-scrollbar"
          ></textarea>
        </div>

        <!-- Topic Tags (Quick Selectable Pills) -->
        <div class="flex flex-col gap-1.5">
          <label class="font-sans text-xs font-semibold text-[#F3F4F6]">Topic Tags</label>
          <div class="flex flex-wrap gap-2 pt-0.5">
            <button
              v-for="tag in AVAILABLE_TAGS"
              :key="tag"
              type="button"
              class="px-2.5 py-1 rounded-full text-xs font-mono transition-all border cursor-pointer select-none"
              :class="selectedTags.includes(tag)
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.08] hover:text-[#F3F4F6] hover:border-white/[0.15]'"
              @click="toggleTag(tag)"
            >
              #{{ tag }}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          <span class="text-[11px] font-mono text-[#565B68]">⌘ + Enter to capture</span>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-sans font-medium text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:ring-1 focus:ring-white/20 focus:outline-none cursor-pointer"
              @click="onCancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-sans font-semibold text-black shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
              :disabled="isSubmitting || disabled"
            >
              <span v-if="isSubmitting" class="flex items-center gap-1.5">
                <NexuraIcon name="Loader2" size="sm" class="animate-spin" />
                <span>Capturing...</span>
              </span>
              <span v-else class="flex items-center gap-1.5">
                <span>✨ Capture Idea</span>
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import NexuraIcon from './ui/NexuraIcon.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useProjects } from '~/composables/useProjects'

export interface ProjectItemOption {
  label: string
  value: string
}

const AVAILABLE_TAGS = ['architecture', 'feature', 'ui', 'dx', 'performance', 'research'] as const

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
  (e: 'create', idea: {
    name: string
    description: string
    projectSlug: string
    status: 'idea'
    priority: 'medium'
    techTags: string[]
  }): void
}>()

const workspaceStore = useWorkspaceStore()
const projectsApi = useProjects()
const { data: fetchedProjects } = useLazyAsyncData('add-idea-modal-projects', () => projectsApi.getProjects())

const resolvedProjectOptions = computed(() => {
  if (props.projects && props.projects.length > 0) {
    return props.projects
  }
  if (workspaceStore.projects.value && workspaceStore.projects.value.length > 0) {
    return workspaceStore.projects.value.map((p) => ({
      label: p.title || p.slug,
      value: p.slug
    }))
  }
  if (fetchedProjects.value && fetchedProjects.value.length > 0) {
    return fetchedProjects.value.map((p) => ({
      label: p.title || p.slug,
      value: p.slug
    }))
  }
  return [
    { label: 'Nexura Management Workspace', value: 'management' }
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

const name = ref('')
const description = ref('')
const selectedTags = ref<string[]>([])
const validationError = ref('')
const isSubmitting = ref(false)

function toggleTag(tag: string) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((t) => t !== tag)
  } else {
    selectedTags.value.push(tag)
  }
}

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

  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    onSubmit()
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
    validationError.value = 'Idea headline is required.'
    nameInputRef.value?.focus()
    return
  }

  const targetSlug = props.projectSlug || selectedProject.value || 'management'

  isSubmitting.value = true
  emit('create', {
    name: name.value.trim(),
    description: description.value.trim(),
    projectSlug: targetSlug,
    status: 'idea',
    priority: 'medium',
    techTags: [...selectedTags.value]
  })
}
</script>
