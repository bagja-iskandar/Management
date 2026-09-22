<template>
  <div class="p-4 sm:p-5 rounded-xl bg-[#09090B] border border-white/[0.06] space-y-4">
    <!-- Panel Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full shrink-0" :class="statusDotClass"></span>
        <div>
          <h3 class="font-mono text-xs uppercase tracking-wider text-[#F5F2EB] font-bold flex items-center gap-2">
            <span>Security & Vulnerability Audit</span>
            <span
              v-if="security && security.totalAlerts > 0"
              class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30"
            >
              {{ security.totalAlerts }} Alert{{ security.totalAlerts > 1 ? 's' : '' }}
            </span>
            <span
              v-else-if="security && security.totalAlerts === 0 && security.enabled.dependabot"
              class="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              Clean
            </span>
          </h3>
          <p class="font-sans text-[11px] text-[#756F68]">
            Real-time security posture across Secret Scanning, Dependabot CVEs, and CodeQL analysis.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Inspect Security Details Button -->
        <button
          type="button"
          class="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C98A4B]/10 hover:bg-[#C98A4B]/20 text-[#C98A4B] font-mono text-[11px] font-semibold border border-[#C98A4B]/30 transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          title="Inspect security audit in modal"
          @click="$emit('open-modal')"
        >
          <span>Inspect Security Details</span>
          <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] font-mono text-[11px] border border-white/[0.06] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          :disabled="pending"
          title="Refresh security telemetry"
          @click="$emit('refresh')"
        >
          <svg
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': pending }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ pending ? 'Syncing...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- Security Scanners Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Scanner 1: Secret Scanning -->
      <div class="p-3.5 rounded-xl bg-[#111114] border border-white/[0.04] space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs text-[#F5F2EB] font-medium">Secret Scanning</span>
          <span
            class="font-mono text-[10px] px-2 py-0.5 rounded-full border"
            :class="scannerSecretClass"
          >
            {{ scannerSecretStatusText }}
          </span>
        </div>
        <div class="font-mono text-[11px] text-[#756F68]">
          Automated leak detection for API tokens and private keys.
        </div>
      </div>

      <!-- Scanner 2: Dependabot -->
      <div class="p-3.5 rounded-xl bg-[#111114] border border-white/[0.04] space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs text-[#F5F2EB] font-medium">Dependabot</span>
          <span
            class="font-mono text-[10px] px-2 py-0.5 rounded-full border"
            :class="security?.enabled.dependabot ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-[#C98A4B]/30 bg-[#C98A4B]/10 text-[#C98A4B]'"
          >
            {{ security?.enabled.dependabot ? 'Active' : 'Disabled' }}
          </span>
        </div>
        <div class="font-mono text-[11px] text-[#756F68]">
          Package vulnerability & dependency graph monitoring.
        </div>
      </div>

      <!-- Scanner 3: CodeQL / SAST -->
      <div class="p-3.5 rounded-xl bg-[#111114] border border-white/[0.04] space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs text-[#F5F2EB] font-medium">CodeQL / SAST</span>
          <span
            class="font-mono text-[10px] px-2 py-0.5 rounded-full border"
            :class="security?.enabled.codeScanning ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.06] bg-white/[0.02] text-[#756F68]'"
          >
            {{ security?.enabled.codeScanning ? 'Active' : 'Not Configured' }}
          </span>
        </div>
        <div class="font-mono text-[11px] text-[#756F68]">
          Semantic static analysis for security vulnerabilities.
        </div>
      </div>
    </div>

    <!-- Severity Breakdown Strip -->
    <div class="p-3 rounded-lg bg-[#111114] border border-white/[0.04] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
      <span class="text-[#756F68]">Vulnerability Breakdown:</span>
      <div class="flex items-center gap-2 flex-wrap">
        <span
          class="px-2 py-0.5 rounded text-[10px] font-semibold border"
          :class="security?.criticalCount ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-white/5 text-[#756F68] border-white/5'"
        >
          {{ security?.criticalCount || 0 }} Critical
        </span>
        <span
          class="px-2 py-0.5 rounded text-[10px] font-semibold border"
          :class="security?.highCount ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' : 'bg-white/5 text-[#756F68] border-white/5'"
        >
          {{ security?.highCount || 0 }} High
        </span>
        <span
          class="px-2 py-0.5 rounded text-[10px] font-semibold border"
          :class="security?.mediumCount ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' : 'bg-white/5 text-[#756F68] border-white/5'"
        >
          {{ security?.mediumCount || 0 }} Medium
        </span>
        <span
          class="px-2 py-0.5 rounded text-[10px] font-semibold border"
          :class="security?.lowCount ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-white/5 text-[#756F68] border-white/5'"
        >
          {{ security?.lowCount || 0 }} Low
        </span>
      </div>
    </div>

    <!-- Dependabot Disabled Hint Callout -->
    <div
      v-if="security && !security.enabled.dependabot"
      class="p-3 rounded-lg border border-[#C98A4B]/20 bg-[#C98A4B]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
    >
      <div class="flex items-center gap-2 text-[#756F68]">
        <span class="text-[#C98A4B]">⚡</span>
        <span>Dependabot is disabled for this repository. Enable it on GitHub to detect package CVEs.</span>
      </div>
      <a
        :href="`https://github.com/${repo}/settings/security_analysis`"
        target="_blank"
        rel="noopener noreferrer"
        class="group font-mono text-xs text-[#C98A4B] hover:underline flex items-center gap-1 shrink-0 self-start sm:self-center"
      >
        <span>Enable on GitHub</span>
        <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubSecurityOverview } from '~/types'
import IconArrowUpRight from '../IconArrowUpRight.vue'

defineProps<{
  security: GitHubSecurityOverview | null
  pending: boolean
  repo: string
  statusDotClass: string
  scannerSecretClass: string
  scannerSecretStatusText: string
}>()

defineEmits<{
  (e: 'open-modal'): void
  (e: 'refresh'): void
}>()
</script>
