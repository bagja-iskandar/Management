<template>
  <div class="bg-[#111114] border border-white/[0.06] rounded-xl p-3.5 sm:p-4 overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06] shrink-0">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-[#C98A4B]"></span>
        <h2 class="font-mono text-xs tracking-wider uppercase text-[#756F68] font-semibold">
          UPCOMING DEADLINES
        </h2>
      </div>
      <span class="font-mono text-[10px] text-[#756F68] bg-white/5 border border-white/[0.06] rounded px-1.5 py-0.2">
        Critical Timeline
      </span>
    </div>

    <!-- Deadlines List (Directly beneath header) -->
    <div class="space-y-2 flex-1 min-h-0 overflow-y-auto">
      <div
        v-for="item in displayDeadlines"
        :key="item.id || item.title"
        class="group p-2 sm:p-2.5 rounded-lg bg-[#09090B]/70 border border-white/[0.05] hover:border-[#C98A4B]/40 hover:bg-white/[0.02] transition-all cursor-pointer flex items-center justify-between gap-2.5"
        tabindex="0"
        role="button"
        :aria-label="`Open deadline details for ${item.title}`"
        @click="$emit('task-click', item)"
        @keydown.enter="$emit('task-click', item)"
      >
        <!-- Left: Title + Project & Time subtitle -->
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-xs text-[#F5F2EB] font-medium truncate group-hover:text-bone transition-colors" :title="item.title">
            {{ item.title }}
          </span>
          <div class="flex items-center gap-1.5 mt-0.5 font-mono text-[11px] text-[#756F68]">
            <span class="text-[#756F68]/90">{{ item.timeInfo }}</span>
            <span>&bull;</span>
            <span class="text-[#C98A4B]/90">{{ item.project }}</span>
          </div>
        </div>

        <!-- Right: Status Badge -->
        <div class="shrink-0 flex items-center">
          <!-- Overdue Badge (Red bold font-mono) -->
          <span
            v-if="item.status === 'overdue'"
            class="font-mono text-xs font-bold uppercase text-red-400 bg-red-500/10 border border-red-500/25 rounded px-2 py-0.5 flex items-center gap-1"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>{{ item.badgeText }}</span>
          </span>

          <!-- Due Today / Urgent Badge -->
          <span
            v-else-if="item.status === 'urgent'"
            class="font-mono text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/25 rounded px-2 py-0.5"
          >
            {{ item.badgeText }}
          </span>

          <!-- Upcoming in X days Badge (Ochre font-mono) -->
          <span
            v-else
            class="font-mono text-xs font-medium text-[#C98A4B] bg-[#C98A4B]/10 border border-[#C98A4B]/20 rounded px-2 py-0.5"
          >
            {{ item.badgeText }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface DeadlineItem {
  id?: string
  title: string
  project: string
  timeInfo: string
  badgeText: string
  status: 'overdue' | 'urgent' | 'upcoming'
}

const props = defineProps<{
  deadlines?: DeadlineItem[]
}>()

defineEmits<{
  (e: 'task-click', item: DeadlineItem): void
}>()

const displayDeadlines = computed(() => {
  return props.deadlines && props.deadlines.length > 0 ? props.deadlines : []
})
</script>
