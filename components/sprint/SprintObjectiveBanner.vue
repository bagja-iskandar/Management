<template>
  <div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#111114] via-[#161412] to-[#18181C] border border-[#C98A4B]/30 p-5 sm:p-6 shadow-xl shadow-black/40">
    <div class="absolute -right-8 -top-8 w-40 h-40 bg-[#C98A4B]/5 rounded-full blur-3xl pointer-events-none"></div>

    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
      <div class="space-y-2 max-w-3xl">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#C98A4B]"></span>
          <span class="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#C98A4B]">
            Weekly Objective · Milestone Commitment
          </span>
        </div>

        <!-- Display Mode -->
        <div v-if="!isEditing" class="space-y-1">
          <blockquote class="font-sans text-base sm:text-lg text-[#F5F2EB] font-medium leading-relaxed italic">
            “{{ objective || 'No specific objective committed for this week yet. Click Edit to define focus.' }}”
          </blockquote>
        </div>

        <!-- Inline Edit Mode -->
        <div v-else class="space-y-3 pt-1">
          <textarea
            v-model="draft"
            rows="3"
            class="w-full bg-[#09090B] border border-[#C98A4B]/50 rounded-lg p-3 text-sm text-[#F5F2EB] font-sans placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none transition-all"
            placeholder="What is your primary engineering objective for this week?"
            @keydown.enter.ctrl="onSave"
            @keydown.esc="onCancel"
          ></textarea>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-semibold transition-colors cursor-pointer"
              @click="onSave"
            >
              Save Objective
            </button>
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] font-mono text-xs transition-colors cursor-pointer"
              @click="onCancel"
            >
              Cancel
            </button>
            <span class="font-mono text-[10px] text-[#756F68] hidden sm:inline ml-2">Press Ctrl+Enter to save</span>
          </div>
        </div>
      </div>

      <!-- Inline Edit Trigger Button -->
      <div v-if="!isEditing" class="shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#C98A4B] hover:text-[#F5F2EB] font-mono text-xs border border-white/[0.08] hover:border-[#C98A4B]/30 transition-all focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          @click="onStartEdit"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Edit Objective</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  objective: string
}>()

const emit = defineEmits<{
  (e: 'save', newObjective: string): void
}>()

const isEditing = ref(false)
const draft = ref('')

function onStartEdit() {
  draft.value = props.objective
  isEditing.value = true
}

function onCancel() {
  isEditing.value = false
}

function onSave() {
  emit('save', draft.value)
  isEditing.value = false
}
</script>
