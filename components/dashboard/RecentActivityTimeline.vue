<template>
  <div class="bg-[#111114] border border-white/[0.06] rounded-xl p-3.5 sm:p-4 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.06]">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-[#C98A4B]"></span>
        <h2 class="font-mono text-xs tracking-wider uppercase text-[#756F68] font-semibold">
          RECENT ACTIVITY
        </h2>
      </div>
      <span class="font-mono text-[10px] text-[#756F68] bg-white/5 border border-white/[0.06] rounded px-1.5 py-0.2">
        Stream Log
      </span>
    </div>

    <!-- Empty State -->
    <div v-if="displayItems.length === 0" class="py-6 text-center text-xs font-mono text-[#756F68]">
      No recent activity recorded
    </div>

    <!-- Vertical Timeline with Hairline Connecting Line -->
    <div v-else class="relative pl-5 space-y-4">
      <!-- Vertical connecting bar -->
      <div class="absolute left-2 top-2 bottom-2 w-0.5 bg-white/[0.08]" aria-hidden="true"></div>

      <div
        v-for="(item, idx) in displayItems"
        :key="idx"
        class="relative flex items-start justify-between gap-3 text-xs group"
      >
        <!-- Marker Node -->
        <div class="absolute -left-5 top-1 flex items-center justify-center">
          <span class="inline-flex rounded-full h-2 w-2 bg-[#C98A4B]"></span>
        </div>

        <!-- Content -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-mono text-xs font-semibold text-[#F5F2EB]">{{ item.title }}</span>
          </div>
          <div v-if="item.description" class="font-mono text-[10px] text-[#756F68] mt-0.5">
            {{ item.description }}
          </div>
        </div>

        <!-- Timestamp -->
        <span v-if="item.time" class="font-mono text-[10px] text-[#756F68] shrink-0">
          {{ item.time }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ActivityTimelineItem {
  id?: string
  title: string
  description?: string
  time?: string
  type?: string
}

const props = defineProps<{
  items?: ActivityTimelineItem[]
}>()

const displayItems = computed(() => props.items || [])
</script>
