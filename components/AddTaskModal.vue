<template>
  <div class="modal-overlay" @click.self="onCancel" role="presentation">
    <div 
      ref="dialogRef" 
      class="modal-card" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-task-title"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h2 id="modal-task-title">Create New Task</h2>
          <p class="modal-subtitle">Assign a personal task to a project to track milestones and derived progress.</p>
        </div>
        <button type="button" class="close-btn" @click="onCancel" aria-label="Close modal">✕</button>
      </div>

      <!-- Form -->
      <form @submit.prevent="onSubmit" class="modal-form" novalidate>
        <!-- Validation Error Alert -->
        <div v-if="validationError" class="modal-alert" role="alert">
          {{ validationError }}
        </div>

        <!-- Project Selector (Combobox / Select) -->
        <div class="form-group">
          <label for="task-project-select">
            Project Association <span class="required">*</span>
          </label>
          <select id="task-project-select" v-model="selectedProject" class="modal-select" required>
            <option value="Project Alpha • TF-HiTNet">📁 Project Alpha • TF-HiTNet Fusion</option>
            <option value="Project Beta • Management Web">📁 Project Beta • Management SaaS Web</option>
            <option value="Project Gamma • Neural Signal">📁 Project Gamma • Neural Signal Transformer</option>
            <option value="Personal Portfolio & Docs">📁 Personal Portfolio & Docs</option>
          </select>
        </div>

        <!-- Task Name -->
        <div class="form-group">
          <label for="task-name-input">
            Task Name <span class="required">*</span>
          </label>
          <input 
            id="task-name-input"
            ref="nameInputRef"
            v-model="name"
            type="text" 
            placeholder="e.g. Implement neural co-attention module" 
            :class="{ 'has-error': !!validationError && !name.trim() }"
            required 
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="task-desc-input">Description</label>
          <textarea 
            id="task-desc-input"
            v-model="description"
            rows="3"
            placeholder="e.g. Build multi-head spatial attention mechanism to align multi-modal EEG feature maps."
          ></textarea>
        </div>

        <!-- Status Selector -->
        <div class="form-group">
          <label>Status</label>
          <div class="pill-selector" role="radiogroup" aria-label="Task Status">
            <button 
              type="button" 
              class="pill-choice" 
              :class="{ selected: status === 'todo' }" 
              @click="status = 'todo'"
              role="radio"
              :aria-checked="status === 'todo'"
            >
              To Do
            </button>
            <button 
              type="button" 
              class="pill-choice active-pill" 
              :class="{ selected: status === 'proses' }" 
              @click="status = 'proses'"
              role="radio"
              :aria-checked="status === 'proses'"
            >
              In Progress
            </button>
            <button 
              type="button" 
              class="pill-choice completed-pill" 
              :class="{ selected: status === 'selesai' }" 
              @click="status = 'selesai'"
              role="radio"
              :aria-checked="status === 'selesai'"
            >
              Completed
            </button>
          </div>
        </div>

        <!-- Priority Selector -->
        <div class="form-group">
          <label>Priority Level</label>
          <div class="pill-selector" role="radiogroup" aria-label="Priority Level">
            <button 
              type="button" 
              class="pill-choice" 
              :class="{ selected: priority === 'low' }" 
              @click="priority = 'low'"
              role="radio"
              :aria-checked="priority === 'low'"
            >
              🟢 Low
            </button>
            <button 
              type="button" 
              class="pill-choice" 
              :class="{ selected: priority === 'medium' }" 
              @click="priority = 'medium'"
              role="radio"
              :aria-checked="priority === 'medium'"
            >
              🟡 Medium
            </button>
            <button 
              type="button" 
              class="pill-choice high-priority-pill" 
              :class="{ selected: priority === 'high' }" 
              @click="priority = 'high'"
              role="radio"
              :aria-checked="priority === 'high'"
            >
              🔴 High
            </button>
          </div>
        </div>

        <!-- Due Date -->
        <div class="form-group">
          <label for="task-due-date">Due Date</label>
          <input id="task-due-date" v-model="dueDate" type="date" />
        </div>

        <!-- Dynamic Progress Notice Box -->
        <div class="derived-info-box">
          <div class="info-icon" aria-hidden="true">💡</div>
          <div class="info-text">
            <strong>Dynamic Progress:</strong> Creating this task will automatically link to <em>{{ selectedProject }}</em> and recalculate its derived milestone velocity.
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button type="button" class="button secondary" @click="onCancel">Cancel</button>
          <button type="submit" class="button primary" :disabled="isSubmitting || disabled">
            <span v-if="isSubmitting">Creating...</span>
            <span v-else>Create Task</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', task: { name: string; description: string; project: string; status: 'todo' | 'proses' | 'selesai'; priority: string; dueDate: string }): void
}>()

const selectedProject = ref('Project Alpha • TF-HiTNet')
const name = ref('')
const description = ref('')
const status = ref<'todo' | 'proses' | 'selesai'>('todo')
const priority = ref<'low' | 'medium' | 'high'>('medium')
const dueDate = ref('2026-11-20')
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

  isSubmitting.value = true
  emit('create', {
    name: name.value.trim(),
    description: description.value.trim(),
    project: selectedProject.value,
    status: status.value,
    priority: priority.value,
    dueDate: dueDate.value
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 8, 15, 0.78);
  backdrop-filter: blur(16px);
  z-index: 100;
  padding: 20px;
  overflow-y: auto;
}

.modal-card {
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-card);
  padding: 30px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.15);
  display: flex;
  flex-direction: column;
  gap: 20px;
  outline: none;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.modal-header h2 {
  margin: 0 0 6px;
  font-size: 1.45rem;
  font-weight: 800;
  color: #ffffff;
}

.modal-subtitle {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-alert {
  background: rgba(244, 63, 94, 0.15);
  border: 1px solid rgba(244, 63, 94, 0.35);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: var(--radius-input);
  font-size: 0.88rem;
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-heading);
}

.modal-select {
  background: var(--glass-input);
  color: var(--text-heading);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-input);
  padding: 11px 14px;
  font-size: 0.92rem;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.modal-select:focus {
  border-color: var(--glass-border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.required {
  color: #f43f5e;
}

.has-error {
  border-color: #f43f5e !important;
  box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.2) !important;
}

.pill-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill-choice {
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.pill-choice:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-heading);
}

.pill-choice.selected {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.6);
  color: #c0c1ff;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

.pill-choice.active-pill.selected {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.6);
  color: #c084fc;
}

.pill-choice.completed-pill.selected {
  background: rgba(6, 182, 212, 0.2);
  border-color: rgba(6, 182, 212, 0.6);
  color: #67e8f9;
}

.derived-info-box {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: var(--radius-input);
  font-size: 0.82rem;
  color: #cbd5e1;
  line-height: 1.5;
}

.info-icon {
  font-size: 1.1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--glass-border);
}
</style>
