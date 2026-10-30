<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
    <h1 class="text-xl sm:text-2xl font-semibold text-[#F3F4F6] tracking-tight font-sans">
      Weekly Sprints
    </h1>

    <!-- Action Controls & Calendar Navigation -->
    <div class="flex items-center gap-2.5 flex-wrap">
      <!-- Week Navigation Controls -->
      <div class="inline-flex items-center bg-[#111318] border border-white/[0.08] rounded-xl p-1 gap-1 shadow-sm">
        <button
          type="button"
          class="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F4F6] font-sans text-xs transition border border-white/[0.08] flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          title="Previous Week"
          @click="$emit('prev-week')"
        >
          <NexuraIcon name="ChevronLeft" size="xs" />
          <span class="hidden sm:inline">Prev</span>
        </button>

        <button
          type="button"
          class="px-2.5 py-1.5 rounded-lg font-sans text-xs transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          :class="isCurrentWeek ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium' : 'bg-transparent text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'"
          :title="isCurrentWeek ? 'Currently viewing active calendar week' : 'Click to return to Current Week'"
          @click="$emit('current-week')"
        >
          <span v-if="isCurrentWeek" class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          <span>Current Week</span>
        </button>

        <button
          type="button"
          class="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F4F6] font-sans text-xs transition border border-white/[0.08] flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          title="Next Week"
          @click="$emit('next-week')"
        >
          <span class="hidden sm:inline">Next</span>
          <NexuraIcon name="ChevronRight" size="xs" />
        </button>
      </div>

      <!-- Date Pill Monospace -->
      <div
        v-if="weekLabel"
        class="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111318] border border-white/[0.08] text-[#8A8F9E] font-mono tabular-nums text-xs shadow-sm"
      >
        <NexuraIcon name="Calendar" size="xs" class="text-indigo-400" />
        <span>{{ weekLabel }}</span>
      </div>

      <!-- + Add Target to Sprint Linear Button -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F3F4F6] hover:bg-white text-[#07080A] font-sans text-xs font-medium transition shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        @click="$emit('open-modal', 'backlog')"
      >
        <NexuraIcon name="Plus" size="xs" :stroke-width="2.2" />
        <span>Add Target to Sprint</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'

withDefaults(
  defineProps<{
    isCurrentWeek: boolean
    weekLabel?: string
  }>(),
  {
    weekLabel: ''
  }
)

defineEmits<{
  (e: 'prev-week'): void
  (e: 'current-week'): void
  (e: 'next-week'): void
  (e: 'open-modal', tab: 'backlog' | 'create'): void
}>()
</script>
