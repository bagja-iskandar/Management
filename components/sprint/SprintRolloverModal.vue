<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rollover-modal-title"
        @click.self="$emit('close')"
      >
        <div
          class="obs-card w-full max-w-lg rounded-2xl bg-[#111318] border border-white/[0.1] shadow-2xl p-5 sm:p-6 space-y-5 text-[#F3F4F6] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <!-- Ambient Indigo Specular Glow -->
          <div class="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <!-- Modal Header -->
          <div class="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <NexuraIcon name="FastForward" size="md" />
              </div>
              <div>
                <h3 id="rollover-modal-title" class="font-sans text-base sm:text-lg font-semibold text-[#F3F4F6]">
                  Rollover Incomplete Deliverables
                </h3>
                <p class="font-sans text-xs text-[#8A8F9E] mt-0.5">
                  Move uncompleted deliverables from current sprint to next week's cycle.
                </p>
              </div>
            </div>
            <button
              type="button"
              class="text-[#8A8F9E] hover:text-[#F3F4F6] p-1.5 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
              aria-label="Close modal"
              @click="$emit('close')"
            >
              <NexuraIcon name="X" size="sm" />
            </button>
          </div>

          <!-- Transition Cycle Pill Grid -->
          <div class="bg-[#07080A] rounded-xl p-3 border border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span class="text-[10px] text-[#8A8F9E] uppercase tracking-wider block">Current Sprint</span>
              <span class="text-[#F3F4F6] font-medium block truncate mt-0.5">
                {{ currentWeekLabel || 'Active Week' }}
              </span>
            </div>
            <div>
              <span class="text-[10px] text-indigo-400 uppercase tracking-wider block">Target Next Sprint</span>
              <span class="text-indigo-300 font-medium block truncate mt-0.5">
                {{ nextWeekLabel || 'Next Week' }}
              </span>
            </div>
          </div>

          <!-- Deliverables Preview Container -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-[#8A8F9E]">Deliverables to Rollover</span>
              <span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold tabular-nums">
                {{ incompleteDeliverables.length }} task{{ incompleteDeliverables.length === 1 ? '' : 's' }}
              </span>
            </div>

            <!-- Scrollable Deliverables List -->
            <div class="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 p-1 rounded-xl bg-[#07080A]/60 border border-white/[0.04]">
              <div
                v-for="task in incompleteDeliverables"
                :key="task.id"
                class="p-2.5 rounded-lg bg-[#111318] border border-white/[0.06] flex items-center justify-between gap-3 text-xs"
              >
                <div class="min-w-0 flex items-center gap-2">
                  <span class="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
                    #{{ task.taskId || 'ENG-000' }}
                  </span>
                  <span class="font-sans text-xs text-[#F3F4F6] truncate">
                    {{ task.name }}
                  </span>
                </div>
                <span
                  class="font-mono text-[10px] px-2 py-0.5 rounded border shrink-0"
                  :class="getStatusBadge(task.status).class"
                >
                  {{ getStatusBadge(task.status).text }}
                </span>
              </div>
            </div>
          </div>

          <!-- Mark Current Sprint as Completed Checkbox -->
          <div class="pt-2 border-t border-white/[0.06]">
            <label class="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                v-model="markCurrentCompleted"
                type="checkbox"
                class="mt-0.5 rounded bg-[#07080A] border-white/[0.14] text-indigo-600 focus:ring-indigo-500/40 focus:ring-offset-0 cursor-pointer"
              />
              <div class="space-y-0.5">
                <span class="font-sans text-xs font-medium text-[#F3F4F6] block">
                  Mark current sprint cycle as Completed
                </span>
                <span class="font-sans text-[11px] text-[#8A8F9E] block">
                  Closes current sprint status after migrating incomplete deliverables.
                </span>
              </div>
            </label>
          </div>

          <!-- Action Footer -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] font-mono text-xs border border-white/[0.08] transition cursor-pointer"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="isRollingOver || incompleteDeliverables.length === 0"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              @click="$emit('confirm', markCurrentCompleted)"
            >
              <NexuraIcon
                :name="isRollingOver ? 'RotateCw' : 'FastForward'"
                size="xs"
                :class="{ 'animate-spin': isRollingOver }"
              />
              <span>{{ isRollingOver ? 'Rolling Over...' : 'Confirm Rollover' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import type { Task, TaskStatus } from '~/types'

withDefaults(
  defineProps<{
    show: boolean
    currentWeekLabel: string
    nextWeekLabel: string
    incompleteDeliverables: Task[]
    isRollingOver?: boolean
  }>(),
  {
    isRollingOver: false
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', markCompleted: boolean): void
}>()

const markCurrentCompleted = ref(true)

function getStatusBadge(status?: TaskStatus) {
  if (status === 'running_sprint') {
    return { text: 'In-Flight', class: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' }
  }
  if (status === 'blocked') {
    return { text: 'Blocked', class: 'bg-rose-500/15 text-rose-400 border-rose-500/30' }
  }
  return { text: 'In Queue', class: 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.06]' }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }
})
</script>
