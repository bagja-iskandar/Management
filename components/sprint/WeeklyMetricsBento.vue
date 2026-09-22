<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Tile 1: Active Week Range -->
    <div class="rounded-xl bg-[#111114] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-[#C98A4B]/30">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Active Week Range</span>
          <span class="text-xs">📅</span>
        </div>
        <div class="font-mono text-base sm:text-lg font-bold text-[#F5F2EB] mt-2">
          {{ weekLabel }}
        </div>
      </div>
      <div class="pt-3 border-t border-white/[0.04] flex items-center gap-1.5 font-mono text-xs text-[#C98A4B]">
        <span class="w-1.5 h-1.5 rounded-full bg-[#C98A4B]"></span>
        <span>{{ remainingDaysText }}</span>
      </div>
    </div>

    <!-- Tile 2: Target Progress -->
    <div class="rounded-xl bg-[#111114] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-[#C98A4B]/30">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Target Progress</span>
          <span class="font-mono text-xs text-[#C98A4B] font-semibold">{{ completionPercentage }}%</span>
        </div>
        <div class="font-mono text-xl sm:text-2xl font-bold text-[#F5F2EB] mt-2">
          {{ completedCount }} / {{ totalDeliverablesCount }} Completed
        </div>
      </div>

      <div class="pt-3 border-t border-white/[0.04]">
        <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            class="h-full bg-[#C98A4B] rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(201,138,75,0.4)]"
            :style="{ width: `${completionPercentage}%` }"
          ></div>
        </div>
        <div class="flex justify-between font-mono text-[10px] text-[#756F68] mt-1.5">
          <span>{{ totalDeliverablesCount - completedCount }} remaining</span>
          <span>{{ completionPercentage }}% finished</span>
        </div>
      </div>
    </div>

    <!-- Tile 3: In Flight -->
    <div class="rounded-xl bg-[#111114] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-[#C98A4B]/30">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">In Flight</span>
          <span class="w-2 h-2 rounded-full bg-blue-500" :class="{ 'animate-ping': inFlightCount > 0 }"></span>
        </div>
        <div class="font-mono text-2xl sm:text-3xl font-bold text-blue-400 mt-2">
          {{ inFlightCount }}
        </div>
      </div>
      <div class="pt-3 border-t border-white/[0.04] font-sans text-xs text-[#756F68]">
        Tasks actively executing right now
      </div>
    </div>

    <!-- Tile 4: Pending Focus -->
    <div class="rounded-xl bg-[#111114] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-[#C98A4B]/30">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Pending Focus</span>
          <span class="font-mono text-[10px] bg-white/5 text-[#756F68] px-1.5 py-0.5 rounded">In Queue</span>
        </div>
        <div class="font-mono text-2xl sm:text-3xl font-bold text-[#F5F2EB] mt-2">
          {{ pendingCount }}
        </div>
      </div>
      <div class="pt-3 border-t border-white/[0.04] font-sans text-xs text-[#756F68]">
        Queued deliverables ready for kickoff
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  weekLabel: string
  remainingDaysText: string
  completionPercentage: number
  completedCount: number
  totalDeliverablesCount: number
  inFlightCount: number
  pendingCount: number
}>()
</script>
