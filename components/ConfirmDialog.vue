<template>
  <div class="cd-overlay" role="alertdialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="descId">
    <div class="cd-panel" ref="panel" tabindex="-1" @keydown="handleKeydown">
      <div class="cd-header-row">
        <div class="cd-warning-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h3 :id="titleId" class="cd-title">{{ displayTitle }}</h3>
      </div>

      <p :id="descId" class="cd-message">{{ displayMessage }}</p>

      <div class="cd-actions">
        <button ref="cancelButton" class="button secondary" @click="onCancel" :disabled="displayBusy">{{ displayCancelText }}</button>
        <button class="button danger" @click="onConfirm" :disabled="displayBusy">{{ displayConfirmText }}</button>
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

<style scoped>
.cd-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 8, 15, 0.8);
  backdrop-filter: blur(12px);
  z-index: 90;
  padding: 16px;
}

.cd-panel {
  background: rgba(15, 19, 29, 0.95);
  color: var(--text-heading);
  border: 1px solid var(--glass-border-highlight);
  border-radius: var(--radius-card);
  padding: 26px;
  width: 100%;
  max-width: 480px;
  outline: none;
  box-shadow: var(--shadow-card), 0 0 35px rgba(0, 0, 0, 0.6);
  backdrop-filter: var(--glass-blur);
}

.cd-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.cd-warning-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.35);
  color: #fca5a5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(244, 63, 94, 0.25);
}

.cd-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
}

.cd-message {
  margin: 0 0 24px;
  color: var(--text-body);
  font-size: 0.92rem;
  line-height: 1.5;
}

.cd-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>