<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    role="alertdialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    :aria-describedby="descId"
    @click.self="onCancel"
  >
    <div
      ref="panel"
      class="w-full max-w-md p-6 rounded-2xl bg-[#111114] border border-white/[0.08] shadow-2xl shadow-black/80 space-y-4 focus:outline-none"
      tabindex="-1"
      @keydown="handleKeydown"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(239,68,68,0.2)]" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 :id="titleId" class="font-mono text-lg font-bold text-[#F5F2EB]">{{ displayTitle }}</h3>
      </div>

      <p :id="descId" class="text-sm text-[#756F68] leading-relaxed">{{ displayMessage }}</p>

      <div class="flex items-center justify-end gap-3 pt-2">
        <button
          ref="cancelButton"
          type="button"
          class="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#F5F2EB] font-mono text-xs font-medium border border-white/[0.08] transition-colors disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
          :disabled="displayBusy"
          @click="onCancel"
        >
          {{ displayCancelText }}
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-mono text-xs font-semibold border border-red-500/30 transition-colors disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-red-400"
          :disabled="displayBusy"
          @click="onConfirm"
        >
          {{ displayConfirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, useId } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Confirmation' },
  message: { type: String, default: 'Are you sure?' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  busy: { type: Boolean, default: false }
})

const emits = defineEmits(['confirm', 'cancel'])

const displayTitle = computed(() => props.title ?? 'Confirmation')
const displayMessage = computed(() => props.message ?? 'Are you sure?')
const displayConfirmText = computed(() => props.confirmText ?? 'Confirm')
const displayCancelText = computed(() => props.cancelText ?? 'Cancel')
const displayBusy = computed(() => props.busy ?? false)

const titleId = useId()
const descId = useId()

const panel = ref<HTMLElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null

function getFocusableElements(): HTMLElement[] {
  if (!panel.value) return []
  const selector = 'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(panel.value.querySelectorAll<HTMLElement>(selector))
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    onCancel()
    return
  }

  if (e.key === 'Tab') {
    const focusable = getFocusableElements()
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const firstElement = focusable[0]
    const lastElement = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement || document.activeElement === panel.value) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }
}

function onConfirm() {
  emits('confirm')
}
function onCancel() {
  emits('cancel')
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    previouslyFocusedElement = document.activeElement as HTMLElement | null
  }
  nextTick(() => {
    if (cancelButton.value) {
      cancelButton.value.focus()
    } else if (panel.value) {
      panel.value.focus()
    }
  })
})

onUnmounted(() => {
  if (typeof window === 'undefined') return
  window.setTimeout(() => {
    if (previouslyFocusedElement && document.body.contains(previouslyFocusedElement)) {
      previouslyFocusedElement.focus()
    } else {
      const nextInteractiveTarget = document.querySelector<HTMLElement>('.activity-table button, .dashboard-toolbar input')
      nextInteractiveTarget?.focus()
    }
  }, 0)
})
</script>