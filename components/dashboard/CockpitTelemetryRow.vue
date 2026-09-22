<template>
  <div>
    <!-- 4 High-Density Stat Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <!-- 1. ACTIVE PROJECTS -->
      <div class="bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-3 transition-colors flex flex-col justify-between">
        <div class="flex items-center justify-between gap-1 mb-1.5">
          <span class="font-mono text-[10px] tracking-wider uppercase text-[#756F68] truncate font-medium">
            ACTIVE PROJECTS
          </span>
          <span class="font-mono text-[10px] text-[#C98A4B] bg-[#C98A4B]/10 border border-[#C98A4B]/20 rounded px-1.5 py-0.2 shrink-0">
            ↑ {{ activeProjectsDelta }}
          </span>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="font-mono text-2xl font-bold text-[#F5F2EB] tracking-tight">
            {{ activeProjects }}
          </span>
          <span class="font-mono text-[10px] text-[#756F68]">repos</span>
        </div>
      </div>

      <!-- 2. TASKS IN SPRINT -->
      <div class="bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-3 transition-colors flex flex-col justify-between">
        <div class="flex items-center justify-between gap-1 mb-1.5">
          <span class="font-mono text-[10px] tracking-wider uppercase text-[#756F68] truncate font-medium">
            TASKS IN SPRINT
          </span>
          <span class="font-mono text-[10px] text-[#756F68] bg-white/5 border border-white/[0.06] rounded px-1.5 py-0.2 shrink-0">
            curr sprint
          </span>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="font-mono text-2xl font-bold text-[#F5F2EB] tracking-tight">
            {{ tasksInSprint }}
          </span>
          <span class="font-mono text-[10px] text-[#756F68]">active</span>
        </div>
      </div>

      <!-- 3. BLOCKERS (with glowing pulsing red dot) -->
      <div
        class="bg-[#111114] border rounded-lg p-3 transition-colors flex flex-col justify-between"
        :class="blockers > 0 ? 'border-red-500/30' : 'border-white/[0.06] hover:border-white/[0.12]'"
      >
        <div class="flex items-center justify-between gap-1 mb-1.5">
          <div class="flex items-center gap-1.5 truncate">
            <span class="relative flex h-2 w-2 shrink-0">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"></span>
            </span>
            <span class="font-mono text-[10px] tracking-wider uppercase text-red-400 truncate font-medium">
              BLOCKERS
            </span>
          </div>
          <span class="font-mono text-[10px] text-red-400 bg-red-500/10 border border-red-500/25 rounded px-1.5 py-0.2 shrink-0">
            ↑ {{ blockersDelta }}
          </span>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="font-mono text-2xl font-bold text-red-400 tracking-tight">
            {{ blockers }}
          </span>
          <span class="font-mono text-[10px] text-red-400/80">critical</span>
        </div>
      </div>

      <!-- 4. VELOCITY -->
      <div class="bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] rounded-lg p-3 transition-colors flex flex-col justify-between">
        <div class="flex items-center justify-between gap-1 mb-1.5">
          <span class="font-mono text-[10px] tracking-wider uppercase text-[#756F68] truncate font-medium">
            VELOCITY
          </span>
          <span class="font-mono text-[10px] text-[#C98A4B] bg-[#C98A4B]/10 border border-[#C98A4B]/20 rounded px-1.5 py-0.2 shrink-0">
            points
          </span>
        </div>
        <div class="flex items-baseline justify-between">
          <span class="font-mono text-2xl font-bold text-[#F5F2EB] tracking-tight">
            {{ formattedVelocity }}
          </span>
          <span class="font-mono text-[10px] text-[#756F68]">throughput</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    activeProjects?: number
    activeProjectsDelta?: number | string
    tasksInSprint?: number
    blockers?: number
    blockersDelta?: number | string
    velocity?: string | number
    syncing?: boolean
  }>(),
  {
    activeProjects: 0,
    activeProjectsDelta: 0,
    tasksInSprint: 0,
    blockers: 0,
    blockersDelta: 0,
    velocity: '0 /week',
    syncing: false
  }
)

defineEmits<{
  (e: 'new-task'): void
  (e: 'new-project'): void
  (e: 'sync'): void
}>()

const formattedVelocity = computed(() => {
  return String(props.velocity)
})
</script>
