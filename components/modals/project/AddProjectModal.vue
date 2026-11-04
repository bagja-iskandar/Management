<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    @click.self="onCancel"
    role="presentation"
  >
    <div
      ref="dialogRef"
      class="w-full max-w-xl bg-[#111318] border border-white/[0.1] rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 outline-none my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-project-title"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div>
          <h2 id="modal-project-title" class="font-sans text-base font-semibold text-[#F3F4F6] flex items-center gap-2">
            <NexuraIcon name="FolderPlus" size="sm" class="text-indigo-400" />
            Create New Project
          </h2>
          <p class="font-sans text-xs text-[#8A8F9E] mt-1">
            Define repository scope, tech stack, and milestone targets.
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
        <!-- Validation Alert -->
        <div
          v-if="validationError"
          class="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono tabular-nums flex items-center gap-2"
          role="alert"
        >
          <NexuraIcon name="AlertCircle" size="sm" class="shrink-0 text-rose-400" />
          <span>{{ validationError }}</span>
        </div>

        <!-- Project Title -->
        <div class="flex flex-col gap-1.5">
          <label for="project-name-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">
            Project Name <span class="text-rose-400">*</span>
          </label>
          <input
            id="project-name-input"
            ref="nameInputRef"
            v-model="name"
            type="text"
            placeholder="e.g. TF-HiTNet EEG Transformer"
            class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
            :class="{ 'border-rose-500/60 focus:ring-rose-500/40': !!validationError && !name.trim() }"
            required
          />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label for="project-desc-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">Description</label>
          <textarea
            id="project-desc-input"
            v-model="description"
            rows="2"
            placeholder="High-performance architecture with derived task milestone velocity tracking."
            class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none custom-scrollbar"
          ></textarea>
        </div>

        <!-- GitHub Repo & Deploy URL (Row) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="project-repo-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">GitHub Repository</label>
            <input
              id="project-repo-input"
              v-model="githubRepo"
              type="text"
              placeholder="e.g. bagja-iskandar/TF-HiTNet"
              class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-xs font-mono tabular-nums focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="project-deploy-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">Deployment URL</label>
            <input
              id="project-deploy-input"
              v-model="deployUrl"
              type="url"
              placeholder="https://app.vercel.app"
              class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-xs font-mono tabular-nums focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
            />
          </div>
        </div>

        <!-- Tech Stack Tags (comma separated) -->
        <div class="flex flex-col gap-1.5">
          <label for="project-tech-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">Tech Stack (comma-separated)</label>
          <input
            id="project-tech-input"
            v-model="techStackInput"
            type="text"
            placeholder="e.g. Nuxt 4, Vue 3, Tailwind, TypeScript"
            class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] rounded-lg px-3.5 py-2 text-sm focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
          />
        </div>

        <!-- Status Selector -->
        <div class="flex flex-col gap-1.5">
          <label class="font-sans text-xs font-semibold text-[#F3F4F6]">Status</label>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Project Status">
            <button
              v-for="s in ['active', 'maintenance', 'planned', 'on-hold', 'completed']"
              :key="s"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border cursor-pointer select-none"
              :class="status === s ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 font-medium shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.08] hover:text-[#F3F4F6] hover:border-white/[0.15]'"
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
          <label class="font-sans text-xs font-semibold text-[#F3F4F6]">Priority</label>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Project Priority">
            <button
              v-for="p in ['low', 'medium', 'high', 'critical']"
              :key="p"
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all border cursor-pointer select-none"
              :class="priority === p ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 font-medium shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.08] hover:text-[#F3F4F6] hover:border-white/[0.15]'"
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
            <label for="start-date-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">Start Date</label>
            <input
              id="start-date-input"
              v-model="startDate"
              type="date"
              class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-lg px-3.5 py-2 text-xs font-mono tabular-nums focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="due-date-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">Target Due Date</label>
            <input
              id="due-date-input"
              v-model="dueDate"
              type="date"
              class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-lg px-3.5 py-2 text-xs font-mono tabular-nums focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <!-- Modal Actions -->
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
            class="px-4 py-2 rounded-lg bg-[#F3F4F6] hover:bg-white text-xs font-sans font-semibold text-[#07080A] shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
            :disabled="isSubmitting"
          >
            <NexuraIcon v-if="isSubmitting" name="Loader2" size="sm" class="animate-spin text-[#07080A]" />
            <NexuraIcon v-else name="Plus" size="sm" :stroke-width="2.2" />
            <span>{{ isSubmitting ? 'Creating...' : 'Create Project' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import NexuraIcon from '~/components/ui/NexuraIcon.vue'

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
const startDate = ref('')
const dueDate = ref('')
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
