<template>
  <div class="p-4 sm:p-5 rounded-2xl bg-[#07080A]/80 border border-white/[0.06] space-y-4">
    <!-- Panel Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full shrink-0" :class="deploymentStatusDotClass"></span>
        <div>
          <h3 class="font-mono text-xs uppercase tracking-wider text-[#F3F4F6] font-bold flex items-center gap-2">
            <span>Deployments & Environments Cockpit</span>
            <span
              v-if="deployments?.latestDeployment"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border"
              :class="getDeploymentBadgeClass(deployments.latestDeployment.state)"
            >
              {{ deployments.latestDeployment.environment || 'Production' }}
            </span>
            <span
              v-else-if="deployUrl"
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              Live Production
            </span>
          </h3>
          <p class="font-sans text-[11px] text-[#8A8F9E]">
            Real-time deployment telemetry, live environment routing, and commit status checks.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Inspect Environments Button -->
        <button
          type="button"
          class="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-mono text-[11px] font-semibold border border-indigo-500/30 transition-colors focus:ring-1 focus:ring-indigo-500/50 focus:outline-none cursor-pointer"
          title="Inspect deployment telemetry in modal"
          @click="$emit('open-modal')"
        >
          <span>Inspect Environments</span>
          <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] font-mono text-[11px] border border-white/[0.06] transition-colors focus:ring-1 focus:ring-indigo-500/50 focus:outline-none cursor-pointer"
          :disabled="pending"
          title="Refresh deployments realtime"
          @click="$emit('refresh')"
        >
          <NexuraIcon
            name="RotateCw"
            size="xs"
            :class="{ 'animate-spin text-indigo-400': pending }"
          />
          <span>Refresh</span>
        </button>
      </div>
    </div>

    <!-- Cockpit Overview Bento: Live Environment Card & Commit Checks Counter -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <!-- Live Environment Card -->
      <div class="md:col-span-2 p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E] flex items-center gap-1.5">
              <span>Target Environment</span>
              <span class="w-1.5 h-1.5 rounded-full" :class="deploymentStatusDotClass"></span>
            </div>
            <div class="font-mono text-sm font-bold text-[#F3F4F6] flex items-center gap-2">
              <span>{{ targetEnvironmentName }}</span>
              <span
                v-if="deployments?.latestDeployment?.shortSha"
                class="text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 tabular-nums"
              >
                #{{ deployments.latestDeployment.shortSha }}
              </span>
            </div>
          </div>

          <!-- Open Live URL Action if available -->
          <a
            v-if="liveUrl"
            :href="liveUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold border border-emerald-500/30 transition-colors shrink-0"
          >
            <span>Open Live Site</span>
            <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <div class="font-mono text-xs text-[#8A8F9E] bg-[#07080A] px-3 py-2 rounded-lg border border-white/[0.04] truncate flex items-center justify-between gap-2">
          <span class="truncate text-[#F3F4F6]">{{ liveUrl || 'No public URL recorded' }}</span>
          <span v-if="deployments?.latestDeployment?.ref" class="text-[10px] text-[#8A8F9E] shrink-0 font-mono">
            branch: {{ deployments.latestDeployment.ref }}
          </span>
        </div>
      </div>

      <!-- Commit Checks Counter Card -->
      <div class="p-4 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-3">
        <div class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E] flex items-center justify-between">
          <span>Commit Status Checks</span>
          <span
            class="font-mono text-[10px] px-2 py-0.5 rounded border uppercase font-medium"
            :class="commitCheckBadgeClass"
          >
            {{ deployments?.commitStatus?.state || 'Neutral' }}
          </span>
        </div>

        <div>
          <div class="font-mono text-2xl font-bold text-[#F3F4F6] tabular-nums">
            {{ passedChecksCount }}<span class="text-xs text-[#8A8F9E] font-normal">/{{ totalChecksCount }} passed</span>
          </div>
          <div class="font-mono text-[11px] text-[#8A8F9E] mt-0.5">
            {{ commitCheckSummaryText }}
          </div>
        </div>

        <button
          type="button"
          class="w-full text-center py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-[#8A8F9E] hover:text-[#F3F4F6] font-mono text-[11px] border border-white/[0.06] transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
          @click="$emit('open-modal')"
        >
          <span>View Telemetry Details</span>
          <NexuraIcon name="ArrowRight" size="xs" />
        </button>
      </div>
    </div>

    <!-- Recent Deployment Log List -->
    <div v-if="deployments?.deployments && deployments.deployments.length > 0" class="space-y-2 pt-2 border-t border-white/[0.04]">
      <div class="font-mono text-[11px] text-[#8A8F9E] uppercase tracking-wider">
        Recent Deployment Records ({{ deployments.deployments.length }})
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <div
          v-for="d in deployments.deployments.slice(0, 3)"
          :key="d.id"
          class="p-3 rounded-xl bg-[#111318] border border-white/[0.04] space-y-1.5"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full" :class="getDeploymentDotClass(d.state)"></span>
              <span class="font-mono text-xs font-bold text-[#F3F4F6]">{{ d.environment }}</span>
            </div>
            <span class="font-mono text-[10px] text-[#8A8F9E] tabular-nums">{{ formatTime(d.updatedAt || d.createdAt) }}</span>
          </div>
          <div class="flex items-center justify-between font-mono text-[10px] text-[#8A8F9E]">
            <span>{{ d.ref ? `ref: ${d.ref}` : 'commit' }}</span>
            <span v-if="d.shortSha" class="text-indigo-400 font-bold tabular-nums">#{{ d.shortSha }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubDeploymentStatus } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

defineProps<{
  deployments: GitHubDeploymentStatus | null
  pending: boolean
  deployUrl: string
  targetEnvironmentName: string
  liveUrl: string
  deploymentStatusDotClass: string
  commitCheckBadgeClass: string
  passedChecksCount: number
  totalChecksCount: number
  commitCheckSummaryText: string
}>()

defineEmits<{
  (e: 'open-modal'): void
  (e: 'refresh'): void
}>()

function getDeploymentBadgeClass(state: string) {
  if (state === 'success') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  if (state === 'in_progress' || state === 'queued') return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  if (state === 'failure' || state === 'error') return 'border-rose-500/30 bg-rose-500/10 text-rose-400'
  return 'border-white/[0.08] bg-white/[0.02] text-[#8A8F9E]'
}

function getDeploymentDotClass(state: string) {
  if (state === 'success') return 'bg-emerald-400'
  if (state === 'in_progress' || state === 'queued') return 'bg-amber-400 animate-pulse'
  if (state === 'failure' || state === 'error') return 'bg-rose-400'
  return 'bg-[#8A8F9E]'
}

function formatTime(dateStr: string): string {
  if (!dateStr) return 'recently'
  try {
    const d = new Date(dateStr)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  } catch {
    return dateStr
  }
}
</script>
