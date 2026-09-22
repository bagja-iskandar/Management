<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto" @click.self="onCancel" role="presentation">
    <div
      ref="dialogRef"
      class="w-full max-w-xl bg-[#111114] border border-white/[0.1] rounded-xl p-6 sm:p-7 shadow-[0_25px_50px_rgba(0,0,0,0.8)] flex flex-col gap-5 outline-none my-8 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h2 id="modal-project-title" class="font-mono text-lg font-semibold text-[#F5F2EB]">Create New Project</h2>
          <p class="font-sans text-xs text-[#756F68] mt-1">Define repository scope, tech stack, and milestone targets.</p>
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
        <!-- Validation Alert -->
        <div v-if="validationError" class="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono" role="alert">
          {{ validationError }}
        </div>

        <!-- Project Title -->
        <div class="flex flex-col gap-1.5">
          <label for="project-name-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">
            Project Name <span class="text-red-400">*</span>
          </label>
          <input
            id="project-name-input"
            ref="nameInputRef"
            v-model="name"
            type="text"
            placeholder="e.g. TF-HiTNet EEG Transformer"
            class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            :class="{ 'border-red-500/60 focus:ring-red-500': !!validationError && !name.trim() }"
            required
          />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label for="project-desc-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">Description</label>
          <textarea
            id="project-desc-input"
            v-model="description"
            rows="2"
            placeholder="High-performance architecture with derived task milestone velocity tracking."
            class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          ></textarea>
        </div>

        <!-- GitHub Repo & Deploy URL (Row) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="project-repo-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">GitHub Repository</label>
            <input
              id="project-repo-input"
              v-model="githubRepo"
              type="text"
              placeholder="e.g. bagja-iskandar/TF-HiTNet"
              class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="project-deploy-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">Deployment URL</label>
            <input
              id="project-deploy-input"
              v-model="deployUrl"
              type="url"
              placeholder="https://app.vercel.app"
              class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            />
          </div>
        </div>

        <!-- Tech Stack Tags (comma separated) -->
        <div class="flex flex-col gap-1.5">
          <label for="project-tech-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">Tech Stack (comma-separated)</label>
          <input
            id="project-tech-input"
            v-model="techStackInput"
            type="text"
            placeholder="e.g. Nuxt 4, Vue 3, Tailwind, TypeScript"
            class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          />
        </div>

        <!-- Status Selector -->
        <div class="flex flex-col gap-1.5">
          <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Status</label>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Project Status">
            <button
              v-for="s in ['active', 'maintenance', 'planned', 'on-hold', 'completed']"
              :key="s"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border"
              :class="status === s ? 'bg-[#C98A4B]/20 text-[#C98A4B] border-[#C98A4B]' : 'bg-[#09090B] text-[#756F68] border-white/[0.08] hover:text-[#F5F2EB]'"
              role="radio"
              :aria-checked="status === s"
              @click="status = s as any"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Priority Selector -->
        <div class="flex flex-col gap-1.5">
          <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Priority</label>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Project Priority">
            <button
              v-for="p in ['low', 'medium', 'high', 'critical']"
              :key="p"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border"
              :class="priority === p ? 'bg-[#C98A4B]/20 text-[#C98A4B] border-[#C98A4B]' : 'bg-[#09090B] text-[#756F68] border-white/[0.08] hover:text-[#F5F2EB]'"
              role="radio"
              :aria-checked="priority === p"
              @click="priority = p as any"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <!-- Timeline: Start & Target Date -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="start-date-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">Start Date</label>
            <input
              id="start-date-input"
              v-model="startDate"
              type="date"
              class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="due-date-input" class="font-sans text-xs font-semibold text-[#F5F2EB]">Target Due Date</label>
            <input
              id="due-date-input"
              v-model="dueDate"
              type="date"
              class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            />
          </div>
        </div>

        <!-- Modal Actions -->
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
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Creating...</span>
            <span v-else>⊕ Create Project</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', project: {
    title: string
    description: string
    status: 'active' | 'planned' | 'on-hold' | 'completed' | 'archived'
    priority: 'low' | 'medium' | 'high' | 'critical'
    startDate: string
    dueDate: string
    githubRepo?: string
    deployUrl?: string
    techStack?: string[]
  }): void
}>()

const name = ref('')
const description = ref('')
const status = ref<'active' | 'planned' | 'on-hold' | 'completed' | 'archived'>('active')
const priority = ref<'low' | 'medium' | 'high' | 'critical'>('high')
const githubRepo = ref('')
const deployUrl = ref('')
const techStackInput = ref('')
const startDate = ref('2026-09-01')
const dueDate = ref('2026-12-31')
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
    validationError.value = 'Project Name is required.'
    nameInputRef.value?.focus()
    return
  }

  const techStack = techStackInput.value
    ? techStackInput.value.split(',').map(s => s.trim()).filter(Boolean)
    : []

  isSubmitting.value = true
  emit('create', {
    title: name.value.trim(),
    description: description.value.trim(),
    status: status.value,
    priority: priority.value,
    startDate: startDate.value,
    dueDate: dueDate.value,
    githubRepo: githubRepo.value.trim() || undefined,
    deployUrl: deployUrl.value.trim() || undefined,
    techStack
  })
}
</script>
