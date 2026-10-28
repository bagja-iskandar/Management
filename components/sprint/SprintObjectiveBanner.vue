<template>
  <div class="obs-card relative overflow-hidden rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 sm:p-6 shadow-xl shadow-black/40">
    <!-- Ambient Radial Top-Glow -->
    <div class="absolute -right-8 -top-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
      <div class="space-y-2 max-w-3xl flex-1">
        <!-- Eyebrow with Target Icon -->
        <div class="flex items-center gap-2">
          <NexuraIcon name="Target" size="xs" class="text-indigo-400" />
          <span class="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-400">
            WEEKLY OBJECTIVE // MILESTONE COMMITMENT
          </span>
        </div>

        <!-- Display Mode -->
        <div v-if="!isEditing" class="space-y-1">
          <blockquote class="font-sans text-base sm:text-lg text-[#F3F4F6] font-medium leading-relaxed italic">
            “{{ objective || 'No specific objective committed for this week yet. Click Edit to define focus.' }}”
          </blockquote>
        </div>

        <!-- Inline Edit Mode -->
        <div v-else class="space-y-3 pt-1">
          <textarea
            v-model="draft"
            rows="3"
            class="w-full bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 rounded-lg p-3 text-sm font-sans outline-none transition"
            placeholder="What is your primary engineering objective for this week?"
            @keydown.enter.ctrl="onSave"
            @keydown.esc="onCancel"
          ></textarea>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[#F3F4F6] font-sans text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              @click="onSave"
            >
              <NexuraIcon name="CheckCircle2" size="xs" />
              <span>Save Objective</span>
            </button>
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.08] font-sans text-xs transition cursor-pointer"
              @click="onCancel"
            >
              Cancel
            </button>
            <span class="font-mono text-xs text-[#565B68] hidden sm:inline ml-2">Press Ctrl+Enter to save · Esc to cancel</span>
          </div>
        </div>
      </div>

      <!-- Inline Edit Trigger Button -->
      <div v-if="!isEditing" class="shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] font-sans text-xs font-medium border border-white/[0.08] hover:border-indigo-500/30 transition focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          @click="onStartEdit"
        >
          <NexuraIcon name="Pencil" size="xs" class="text-indigo-400" />
          <span>Edit Objective</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'

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
