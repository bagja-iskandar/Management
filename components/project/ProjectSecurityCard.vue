<template>
  <div class="bg-[#111114] border border-white/[0.07] rounded-xl p-4 space-y-3.5 shadow-lg relative overflow-hidden flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <div>
          <h3 class="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <span>SECURITY AUDIT</span>
            <span
              class="px-1.5 py-0.2 rounded text-[9px] font-mono border"
              :class="isClean ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'"
            >
              {{ isClean ? 'CLEAN • 0 VULN' : `${totalAlerts} ALERTS` }}
            </span>
          </h3>
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="flex items-center gap-1.5 font-mono text-xs">
        <button
          type="button"
          class="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-white/[0.07] transition cursor-pointer"
          :disabled="pending"
          title="Refresh Security Audit"
          @click="$emit('refresh')"
        >
          <svg
            class="w-3 h-3"
            :class="{ 'animate-spin text-[#C98A4B]': pending }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-3 flex-1 flex flex-col justify-between">
      <!-- 3 Pillars Mini Strip: Dependabot | Secret Scanning | CodeQL -->
      <div class="grid grid-cols-3 gap-2 font-mono text-[10px]">
        <!-- Dependabot -->
        <div class="bg-[#18181C] border border-white/[0.06] rounded-lg p-2.5 space-y-1">
          <span class="text-zinc-500 block text-[9px]">DEPENDABOT</span>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-zinc-200 font-semibold">Active</span>
          </div>
          <span class="text-[9px] text-zinc-500 block">CVE checks</span>
        </div>

        <!-- Secret Scanning -->
        <div class="bg-[#18181C] border border-white/[0.06] rounded-lg p-2.5 space-y-1">
          <span class="text-zinc-500 block text-[9px]">SECRET SCAN</span>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-zinc-200 font-semibold">Clean</span>
          </div>
          <span class="text-[9px] text-zinc-500 block">0 credentials</span>
        </div>

        <!-- CodeQL -->
        <div class="bg-[#18181C] border border-white/[0.06] rounded-lg p-2.5 space-y-1">
          <span class="text-zinc-500 block text-[9px]">CODE SCANNING</span>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-zinc-200 font-semibold">Protected</span>
          </div>
          <span class="text-[9px] text-zinc-500 block">SAST pass</span>
        </div>
      </div>

      <!-- Vulnerability Severity Breakdown Bar -->
      <div class="bg-[#18181C] border border-white/[0.06] rounded-lg p-2.5 flex items-center justify-between font-mono text-[10px]">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-red-500"></span>
            <span class="text-zinc-400">Crit:</span>
            <span :class="criticalCount > 0 ? 'text-red-400 font-bold' : 'text-zinc-500'">{{ criticalCount }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-orange-500"></span>
            <span class="text-zinc-400">High:</span>
            <span :class="highCount > 0 ? 'text-orange-400 font-bold' : 'text-zinc-500'">{{ highCount }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-zinc-400">Med:</span>
            <span class="text-zinc-500">{{ mediumCount }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
            <span class="text-zinc-400">Low:</span>
            <span class="text-zinc-500">{{ lowCount }}</span>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1 text-[#C98A4B] hover:text-[#F5F2EB] transition font-semibold shrink-0 cursor-pointer group"
          @click="$emit('open-modal')"
        >
          <span>Advisories</span>
          <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubSecuritySummary } from '~/types'

const props = withDefaults(
  defineProps<{
    repo?: string
    security?: GitHubSecuritySummary | null
    pending?: boolean
  }>(),
  {
    repo: '',
    security: null,
    pending: false
  }
)

defineEmits<{
  (e: 'open-modal'): void
  (e: 'refresh'): void
}>()

const totalAlerts = computed(() => props.security?.totalAlerts || 0)
const isClean = computed(() => totalAlerts.value === 0)
const criticalCount = computed(() => props.security?.criticalCount || 0)
const highCount = computed(() => props.security?.highCount || 0)
const mediumCount = computed(() => props.security?.mediumCount || 0)
const lowCount = computed(() => props.security?.lowCount || 0)
</script>
