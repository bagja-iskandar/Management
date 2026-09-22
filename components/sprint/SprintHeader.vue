<template>
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
    <div>
      <div class="inline-flex items-center gap-1.5 font-mono text-xs text-[#C98A4B] bg-[#C98A4B]/10 px-2.5 py-0.5 rounded border border-[#C98A4B]/20 uppercase tracking-wider mb-2">
        <span>◆</span>
        <span>WEEKLY EXECUTION CYCLE</span>
      </div>
      <h1 class="font-mono text-xl sm:text-2xl font-bold text-[#F5F2EB]">Weekly Focus</h1>
      <p class="font-sans text-xs sm:text-sm text-[#756F68] mt-1">
        Personal weekly deliverables, milestone focus, and tactical execution targets.
      </p>
    </div>

    <!-- Action Buttons & Calendar Navigation -->
    <div class="flex items-center gap-2.5 flex-wrap">
      <!-- Week Navigation Calendar Controls -->
      <div class="inline-flex items-center bg-[#111114] border border-white/[0.08] rounded-lg p-1 gap-1">
        <button
          type="button"
          class="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-mono text-xs transition-colors flex items-center gap-1 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          title="Previous Week"
          @click="$emit('prev-week')"
        >
          <span>◀</span>
          <span class="hidden sm:inline">Prev Week</span>
        </button>

        <button
          type="button"
          class="px-2.5 py-1.5 rounded-md font-mono text-xs transition-all flex items-center gap-1.5 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          :class="isCurrentWeek ? 'bg-[#C98A4B]/15 text-[#C98A4B] border border-[#C98A4B]/30 font-semibold' : 'bg-transparent text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5'"
          :title="isCurrentWeek ? 'Currently viewing active calendar week' : 'Click to return to Current Week'"
          @click="$emit('current-week')"
        >
          <span v-if="isCurrentWeek" class="w-1.5 h-1.5 rounded-full bg-[#C98A4B] animate-pulse"></span>
          <span>Current Week</span>
        </button>

        <button
          type="button"
          class="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-mono text-xs transition-colors flex items-center gap-1 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          title="Next Week"
          @click="$emit('next-week')"
        >
          <span class="hidden sm:inline">Next Week</span>
          <span>▶</span>
        </button>
      </div>

      <!-- + Set Focus Target Button -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-semibold transition-all shadow-md hover:shadow-glow-ochre focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
        @click="$emit('open-modal', 'backlog')"
      >
        <span>⊕</span>
        <span>Set Focus Target</span>
      </button>

      <NuxtLink
        to="/"
        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-sans text-xs font-medium border border-white/[0.08] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
      >
        <svg class="w-3.5 h-3.5 text-[#756F68]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span class="hidden sm:inline">Dashboard</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isCurrentWeek: boolean
}>()

defineEmits<{
  (e: 'prev-week'): void
  (e: 'current-week'): void
  (e: 'next-week'): void
  (e: 'open-modal', tab: 'backlog' | 'create'): void
}>()
</script>
