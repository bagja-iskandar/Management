<template>
  <div
    class="bg-[#111114] border rounded-xl p-5 flex items-center justify-between transition-all duration-200 hover:border-white/[0.15] hover:shadow-[0_0_16px_rgba(201,138,75,0.06)] relative overflow-hidden group"
    :class="isBlocker && numericValue > 0 ? 'border-red-500/30' : 'border-white/[0.06]'"
  >
    <!-- Left: Icon + Text -->
    <div class="flex items-center gap-3.5">
      <!-- Icon Container -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
        :class="iconBgClass"
      >
        <!-- Active Tasks Icon: Clipboard -->
        <svg
          v-if="cardType === 'active'"
          class="w-5 h-5 text-[#C98A4B]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>

        <!-- Blockers Icon: Alert Circle -->
        <svg
          v-else-if="cardType === 'blockers'"
          class="w-5 h-5"
          :class="numericValue > 0 ? 'text-red-400' : 'text-[#756F68]'"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>

        <!-- Velocity Icon: Trend / Activity -->
        <svg
          v-else
          class="w-5 h-5 text-[#C98A4B]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      </div>

      <!-- Content -->
      <div>
        <div class="flex items-baseline gap-2">
          <span class="font-sans text-sm text-[#756F68] font-normal group-hover:text-[#F5F2EB]/90 transition-colors">
            {{ stat.label }}:
          </span>
          <span class="font-mono text-2xl font-bold text-[#F5F2EB] tracking-tight">
            {{ formattedValue }}
          </span>
        </div>
        <p class="font-mono text-[11px] text-[#756F68]/80 mt-0.5">
          {{ subtitleText }}
        </p>
      </div>
    </div>

    <!-- Right: Status Indicator or Delta -->
    <div class="flex items-center gap-2">
      <!-- Pulsing Red Dot for Blockers (as seen in Mockup 1) -->
      <div v-if="isBlocker && numericValue > 0" class="flex items-center gap-2">
        <span class="relative flex h-3.5 w-3.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"></span>
        </span>
      </div>

      <!-- Trend Delta for others -->
      <span
        v-else
        class="font-mono text-xs px-2 py-0.5 rounded-full border"
        :class="isNegative ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/20'"
      >
        {{ stat.delta }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Stat } from '../types'

const props = defineProps<{
  stat: Stat
}>()

const cardType = computed<'active' | 'blockers' | 'velocity'>(() => {
  const l = (props.stat.label || '').toLowerCase()
  if (l.includes('blocker')) return 'blockers'
  if (l.includes('velocity')) return 'velocity'
  return 'active'
})

const isBlocker = computed(() => cardType.value === 'blockers')

const numericValue = computed(() => {
  if (typeof props.stat.value === 'number') return props.stat.value
  const parsed = parseFloat(String(props.stat.value))
  return isNaN(parsed) ? 0 : parsed
})

const formattedValue = computed(() => {
  if (cardType.value === 'velocity' && typeof props.stat.value === 'number') {
    return `${props.stat.value.toFixed(1)} pts`
  }
  if (typeof props.stat.value === 'number') {
    return props.stat.value.toLocaleString()
  }
  return String(props.stat.value)
})

const isNegative = computed(() => {
  if (props.stat.trend === 'down') return true
  const d = String(props.stat.delta || '').toLowerCase()
  if (d.startsWith('-') || (d.includes('blocked') && !d.startsWith('0'))) return true
  return false
})

const iconBgClass = computed(() => {
  if (cardType.value === 'blockers' && numericValue.value > 0) {
    return 'bg-red-500/15 border border-red-500/30'
  }
  return 'bg-[#C98A4B]/10 border border-[#C98A4B]/20'
})

const subtitleText = computed(() => {
  if (props.stat.subtitle) return props.stat.subtitle
  const l = (props.stat.label || '').toLowerCase()
  if (l.includes('active')) return 'Sprint backlog & active tasks'
  if (l.includes('blocker')) return numericValue.value > 0 ? 'Requires engineering attention' : '0 blockers detected'
  if (l.includes('velocity')) return 'Weekly delivery throughput'
  return 'Telemetry metric'
})
</script>