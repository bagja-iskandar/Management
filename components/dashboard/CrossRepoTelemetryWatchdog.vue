<template>
  <section class="space-y-1.5">
    <!-- Header strip -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-mono text-[10px] font-semibold text-[#C98A4B] uppercase tracking-wider">
          TELEMETRY WATCHDOG
        </span>
        <span class="text-zinc-600 text-xs">•</span>
        <span class="text-[11px] text-zinc-400">
          Live multi-repo infrastructure pulse
        </span>
      </div>
      <span class="text-[10px] font-mono text-zinc-500 hidden sm:inline-block">
        Auto-syncs 60s
      </span>
    </div>

    <!-- 4 Modules Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <!-- Module 1: CI/CD Workflows -->
      <div
        class="bg-[#111114] border border-white/[0.07] hover:border-white/[0.14] rounded-lg p-2.5 flex items-center justify-between transition-all group shadow-sm"
      >
        <div class="space-y-0.5 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] shrink-0"></span>
            <span class="font-mono text-xs font-semibold text-zinc-200 truncate">CI/CD Pipeline</span>
          </div>
          <p class="text-[10px] text-zinc-400 font-mono truncate">
            {{ repoCount }} repos • {{ runsDisplay }}
          </p>
        </div>
        <div class="text-right shrink-0 ml-2">
          <span
            class="text-[10px] font-mono text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded"
          >
            {{ ciStatus }}
          </span>
        </div>
      </div>

      <!-- Module 2: Deployments -->
      <div
        class="bg-[#111114] border border-white/[0.07] hover:border-white/[0.14] rounded-lg p-2.5 flex items-center justify-between transition-all group shadow-sm"
      >
        <div class="space-y-0.5 min-w-0">
          <div class="flex items-center gap-1.5">
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :class="liveDeploymentsInfo.isLive ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]' : 'bg-zinc-600'"
            ></span>
            <span class="font-mono text-xs font-semibold text-zinc-200 truncate">Deployments</span>
          </div>
          <p class="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">
            {{ liveDeploymentsInfo.provider }}
          </p>
        </div>
        <div class="text-right shrink-0 ml-2">
          <span
            class="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border"
            :class="liveDeploymentsInfo.isLive ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700'"
          >
            {{ liveDeploymentsInfo.status }}
          </span>
        </div>
      </div>

      <!-- Module 3: Security & Dependabot -->
      <div
        class="bg-[#111114] border border-white/[0.07] hover:border-white/[0.14] rounded-lg p-2.5 flex items-center justify-between transition-all group shadow-sm"
      >
        <div class="space-y-0.5 min-w-0">
          <div class="flex items-center gap-1.5">
            <span
              class="w-1.5 h-1.5 rounded-full shrink-0"
              :class="criticalAlertsCount > 0 ? 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)]' : moderateAlertsCount > 0 ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'"
            ></span>
            <span class="font-mono text-xs font-semibold text-zinc-200 truncate">Security Shield</span>
          </div>
          <p class="text-[10px] text-zinc-400 font-mono truncate">
            {{ criticalAlertsCount }} Crit • {{ moderateAlertsCount }} Attn
          </p>
        </div>
        <div class="text-right shrink-0 ml-2">
          <span
            class="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded"
            :class="
              criticalAlertsCount > 0
                ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                : moderateAlertsCount > 0
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            "
          >
            {{ securityBadgeText }}
          </span>
        </div>
      </div>

      <!-- Module 4: Active Repos & GitHub Sync -->
      <div
        class="bg-[#111114] border border-white/[0.07] hover:border-white/[0.14] rounded-lg p-2.5 flex items-center justify-between transition-all group shadow-sm"
      >
        <div class="space-y-0.5 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#C98A4B] shadow-[0_0_6px_rgba(201,138,75,0.6)] shrink-0"></span>
            <span class="font-mono text-xs font-semibold text-zinc-200 truncate">GitHub Sync</span>
          </div>
          <p class="text-[10px] text-zinc-400 font-mono truncate max-w-[120px]">
            {{ repoScope }} ({{ repoCount }} repos)
          </p>
        </div>
        <div class="text-right shrink-0 ml-2">
          <span
            class="text-[10px] font-mono text-[#C98A4B] font-medium bg-[#C98A4B]/10 border border-[#C98A4B]/20 px-1.5 py-0.2 rounded"
          >
            {{ syncStatus }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '~/types'

const props = withDefaults(
  defineProps<{
    projects?: Project[]
    ciStatus?: string
    runsToday?: number
    deployStatus?: string
    deploymentProvider?: string
    lastDeployTime?: string
    criticalAlertsCount?: number
    moderateAlertsCount?: number
    syncStatus?: string
  }>(),
  {
    projects: () => [],
    ciStatus: 'ALL PASS',
    runsToday: undefined,
    deployStatus: undefined,
    deploymentProvider: undefined,
    lastDeployTime: undefined,
    criticalAlertsCount: 0,
    moderateAlertsCount: 0,
    syncStatus: 'SYNCED'
  }
)

const repoCount = computed(() => {
  return props.projects.length
})

const runsDisplay = computed(() => {
  if (props.runsToday !== undefined) {
    return `${props.runsToday} runs`
  }
  return 'Healthy'
})

const liveDeploymentsInfo = computed(() => {
  const deployed = props.projects.find((p) => p.deployUrl)
  if (deployed && deployed.deployUrl) {
    return {
      isLive: true,
      status: props.deployStatus || 'ONLINE',
      provider: props.deploymentProvider || (deployed.deployUrl.includes('vercel') ? 'Vercel Production' : 'Live Deploy')
    }
  }
  return {
    isLive: false,
    status: props.deployStatus || 'READY',
    provider: props.deploymentProvider || 'No live deploy URL'
  }
})

const repoScope = computed(() => {
  if (props.projects.length > 0) {
    const firstWithRepo = props.projects.find((p) => p.githubRepo)
    if (firstWithRepo?.githubRepo) {
      const parts = firstWithRepo.githubRepo.split('/')
      if (parts.length > 1) {
        return `${parts[0]}/*`
      }
    }
  }
  return 'All Repos'
})

const securityBadgeText = computed(() => {
  if (props.criticalAlertsCount > 0) {
    return `${props.criticalAlertsCount} CRIT`
  }
  if (props.moderateAlertsCount > 0) {
    return `${props.moderateAlertsCount} ATTN`
  }
  return 'CLEAN'
})
</script>
