<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    role="alertdialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    :aria-describedby="descId"
    @click.self="onCancel"
  >
    <div
      ref="panel"
      class="w-full max-w-md p-6 rounded-2xl bg-[#111318] border border-white/[0.1] shadow-2xl text-[#F3F4F6] space-y-4 focus:outline-none"
      tabindex="-1"
      @keydown="handleKeydown"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(244,63,94,0.15)]" aria-hidden="true">
          <NexuraIcon name="AlertTriangle" size="md" class="text-rose-400" />
        </div>
        <h3 :id="titleId" class="font-sans text-base font-semibold text-[#F3F4F6]">{{ displayTitle }}</h3>
      </div>

      <p :id="descId" class="font-sans text-sm text-[#8A8F9E] leading-relaxed">{{ displayMessage }}</p>

      <div class="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
        <button
          ref="cancelButton"
          type="button"
          class="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#8A8F9E] hover:text-[#F3F4F6] font-sans text-xs font-medium border border-white/[0.08] transition-colors disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer"
          :disabled="displayBusy"
          @click="onCancel"
        >
          {{ displayCancelText }}
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-sans text-xs font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-500/40 shadow-sm flex items-center gap-1.5 cursor-pointer"
          :disabled="displayBusy"
          @click="onConfirm"
        >
          <NexuraIcon v-if="displayBusy" name="Loader2" size="xs" class="animate-spin text-white" />
          <span>{{ displayConfirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, useId } from 'vue'
import NexuraIcon from './ui/NexuraIcon.vue'

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
