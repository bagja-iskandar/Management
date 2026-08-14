<template>
  <div class="cd-overlay" role="alertdialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="descId">
    <div class="cd-panel" ref="panel" tabindex="-1" @keydown="handleKeydown">
      <h3 :id="titleId" class="cd-title">{{ displayTitle }}</h3>
      <p :id="descId" class="cd-message">{{ displayMessage }}</p>

      <div class="cd-actions">
        <button ref="cancelButton" class="button" @click="onCancel" :disabled="displayBusy">{{ displayCancelText }}</button>
        <button class="button" @click="onConfirm" :disabled="displayBusy">{{ displayConfirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, useId } from 'vue'

const props = defineProps<{
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  busy?: boolean
}>()

const emits = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

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

<style scoped>
.cd-overlay{
  position: fixed; inset: 0; display:flex; align-items:center; justify-content:center;
  background: rgba(56,75,112,0.12); z-index: 60;
}
.cd-panel{
  background: var(--surface); color: var(--text); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 24px; width: 96%; max-width: 520px; outline: none;
  box-shadow: var(--shadow);
}
.cd-title{ margin: 0 0 10px; font-size: 1.2rem; }
.cd-message{ margin:0 0 18px; color: var(--muted); }
.cd-actions{ display:flex; gap:12px; justify-content:flex-end }

/* focus styles for buttons inside dialog */
.cd-actions .button:focus{ outline: 3px solid rgba(56,75,112,0.28); outline-offset: 3px }
</style>