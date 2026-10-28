<template>
  <div class="obs-card bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <NexuraIcon name="ShieldCheck" size="xs" />
        </div>
        <div>
          <h3 class="font-mono text-xs font-bold text-[#F3F4F6] uppercase tracking-wide flex items-center gap-2">
            <span>SECURITY AUDIT</span>
            <span
              class="px-2 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider"
              :class="isClean ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'"
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
          class="p-1 rounded-lg bg-[#07080A] hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.07] transition cursor-pointer"
          :disabled="pending"
          title="Refresh Security Audit"
          @click="$emit('refresh')"
        >
          <NexuraIcon
            name="RotateCw"
            size="xs"
            :class="{ 'animate-spin text-indigo-400': pending }"
          />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-3 flex-1 flex flex-col justify-between">
      <!-- 3 Pillars Mini Strip: Dependabot | Secret Scanning | CodeQL -->
      <div class="grid grid-cols-3 gap-2 font-mono text-[10px]">
        <!-- Dependabot -->
        <div class="bg-[#07080A]/60 border border-white/[0.06] rounded-xl p-2.5 space-y-1">
          <span class="text-[#8A8F9E] block text-[9px]">DEPENDABOT</span>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-[#F3F4F6] font-semibold">Active</span>
          </div>
          <span class="text-[9px] text-[#565B68] block">CVE checks</span>
        </div>

        <!-- Secret Scanning -->
        <div class="bg-[#07080A]/60 border border-white/[0.06] rounded-xl p-2.5 space-y-1">
          <span class="text-[#8A8F9E] block text-[9px]">SECRET SCAN</span>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-[#F3F4F6] font-semibold">Clean</span>
          </div>
          <span class="text-[9px] text-[#565B68] block">0 credentials</span>
        </div>

        <!-- CodeQL -->
        <div class="bg-[#07080A]/60 border border-white/[0.06] rounded-xl p-2.5 space-y-1">
          <span class="text-[#8A8F9E] block text-[9px]">CODE SCANNING</span>
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-[#F3F4F6] font-semibold">Protected</span>
          </div>
          <span class="text-[9px] text-[#565B68] block">SAST pass</span>
        </div>
      </div>

      <!-- Vulnerability Severity Breakdown Bar -->
      <div class="bg-[#07080A]/60 border border-white/[0.06] rounded-xl p-2.5 flex items-center justify-between font-mono text-[10px]">
        <div class="flex items-center gap-3 tabular-nums">
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span class="text-[#8A8F9E]">Crit:</span>
            <span :class="criticalCount > 0 ? 'text-rose-400 font-bold' : 'text-[#565B68]'">{{ criticalCount }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span class="text-[#8A8F9E]">High:</span>
            <span :class="highCount > 0 ? 'text-amber-400 font-bold' : 'text-[#565B68]'">{{ highCount }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span class="text-[#8A8F9E]">Med:</span>
            <span class="text-[#565B68]">{{ mediumCount }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-zinc-600"></span>
            <span class="text-[#8A8F9E]">Low:</span>
            <span class="text-[#565B68]">{{ lowCount }}</span>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition font-semibold shrink-0 cursor-pointer group"
          @click="$emit('open-modal')"
        >
          <span>Advisories</span>
          <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubSecuritySummary } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

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
const criticalCount = computed(() => props.security?.criticalCount || 0)
const highCount = computed(() => props.security?.highCount || 0)
const mediumCount = computed(() => props.security?.mediumCount || 0)
const lowCount = computed(() => props.security?.lowCount || 0)

const isClean = computed(() => {
  return totalAlerts.value === 0
})
</script>
