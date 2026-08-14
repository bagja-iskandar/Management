<template>
  <div class="cd-overlay" role="dialog" aria-modal="true" :aria-label="displayTitle">
    <div class="cd-panel" ref="panel" tabindex="-1" @keydown.esc="onCancel">
      <h3 class="cd-title">{{ displayTitle }}</h3>
      <p class="cd-message">{{ displayMessage }}</p>

      <div class="cd-actions">
        <button class="button" @click="onCancel" :disabled="displayBusy">{{ displayCancelText }}</button>
        <button class="button" @click="onConfirm" :disabled="displayBusy" aria-pressed="false">{{ displayConfirmText }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'

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

const displayTitle = computed(() => props.title ?? 'Konfirmasi')
const displayMessage = computed(() => props.message ?? 'Apakah Anda yakin?')
const displayConfirmText = computed(() => props.confirmText ?? 'Ya')
const displayCancelText = computed(() => props.cancelText ?? 'Batal')
const displayBusy = computed(() => props.busy ?? false)

const panel = ref<HTMLElement | null>(null)

function onConfirm() {
  emits('confirm')
}
function onCancel() {
  emits('cancel')
}

// Focus management: focus panel when mounted
onMounted(() => {
  if (panel.value) panel.value.focus()
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