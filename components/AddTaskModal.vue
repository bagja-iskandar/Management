<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto" @click.self="onCancel" role="presentation">
    <div
      ref="dialogRef"
      class="w-full max-w-lg bg-[#111114] border border-white/[0.1] rounded-xl p-6 sm:p-7 shadow-[0_25px_50px_rgba(0,0,0,0.8)] flex flex-col gap-5 outline-none my-8 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-task-title"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h2 id="modal-task-title" class="font-mono text-lg font-semibold text-[#F5F2EB]">Create New Task</h2>
          <p class="font-sans text-xs text-[#756F68] mt-1">Assign an engineering task to a project to track milestones and velocity.</p>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
          aria-label="Close modal"
          @click="onCancel"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <form class="flex flex-col gap-4" @submit.prevent="onSubmit" novalidate>
        <!-- Validation Error Alert -->
        <div v-if="validationError" class="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono" role="alert">
          {{ validationError }}
        </div>

        <!-- Project Association (only shown if not already scoped to a specific project) -->
        <div v-if="!projectSlug" class="flex flex-col gap-1.5">
          <label for="task-project-select" class="font-sans text-xs font-semibold text-[#F5F2EB]">
            Project Association <span class="text-red-400">*</span>
          </label>
          <select
            id="task-project-select"
            v-model="selectedProject"
            class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
            required
          >
            <option value="management">📁 Nexura Management Workspace</option>
            <option value="tf-hitnet-eeg">📁 TF-HiTNet EEG Emotion</option>
            <option value="neural-signal-lab">📁 Neural Signal Lab</option>
          </select>
        </div>

        <!-- Task Name -->
        <div class="flex flex-col gap-1.5">
          <label for="task-name-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">
            Task Name <span class="text-red-400">*</span>
          </label>
          <input
            id="task-name-input"
            ref="nameInputRef"
            v-model="name"
            type="text"
            placeholder="e.g. Implement neural co-attention module"
            class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            :class="{ 'border-red-500/60 focus:ring-red-500': !!validationError && !name.trim() }"
            required
          />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label for="task-desc-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">Description</label>
          <textarea
            id="task-desc-input"
            v-model="description"
            rows="2"
            placeholder="Build multi-head spatial attention mechanism to align multi-modal EEG feature maps."
            class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          ></textarea>
        </div>

        <!-- Tech Tags (comma separated) -->
        <div class="flex flex-col gap-1.5">
          <label for="task-tags-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">Tech Tags (comma separated)</label>
          <input
            id="task-tags-input"
            v-model="techTagsInput"
            type="text"
            placeholder="e.g. vue, typescript, telemetry"
            class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          />
        </div>

        <!-- Priority Selector -->
        <div class="flex flex-col gap-1.5">
          <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Priority Level</label>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Priority Level">
            <button
              v-for="p in [
                { id: 'low', label: 'Low' },
                { id: 'medium', label: 'Medium' },
                { id: 'high', label: 'High' },
                { id: 'critical', label: 'Critical' }
              ]"
              :key="p.id"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border"
              :class="priority === p.id ? 'bg-[#C98A4B]/20 text-[#C98A4B] border-[#C98A4B]' : 'bg-[#09090B] text-[#756F68] border-white/[0.08] hover:text-[#F5F2EB]'"
              role="radio"
              :aria-checked="priority === p.id"
              @click="priority = p.id as any"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- Due Date -->
        <div class="flex flex-col gap-1.5">
          <label for="task-due-date" class="font-sans text-xs font-semibold text-[#F5F2EB]">Due Date</label>
          <input
            id="task-due-date"
            v-model="dueDate"
            type="date"
            class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          />
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-sans font-medium text-[#756F68] hover:text-[#F5F2EB] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            @click="onCancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-lg bg-[#C98A4B] hover:bg-[#8B6535] text-xs font-mono font-semibold text-[#09090B] transition-colors disabled:opacity-50 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            :disabled="isSubmitting || disabled"
          >
            <span v-if="isSubmitting">Creating...</span>
            <span v-else>⊕ Create Task</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    projectSlug?: string
  }>(),
  {
    disabled: false,
    projectSlug: ''
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
    priority: 'low' | 'medium' | 'high' | 'critical'
    dueDate: string
    techTags: string[]
  }): void
}>()

const selectedProject = ref(props.projectSlug || 'management')

watch(() => props.projectSlug, (newSlug) => {
  if (newSlug) {
    selectedProject.value = newSlug
  }
})

const name = ref('')
const description = ref('')
const techTagsInput = ref('')
const priority = ref<'low' | 'medium' | 'high' | 'critical'>('medium')
const dueDate = ref('2026-09-30')
const validationError = ref('')
const isSubmitting = ref(false)

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
    validationError.value = 'Task Name is required.'
    nameInputRef.value?.focus()
    return
  }

  const techTags = techTagsInput.value
    ? techTagsInput.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
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
