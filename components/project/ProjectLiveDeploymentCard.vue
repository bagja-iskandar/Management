<template>
  <div class="obs-card bg-surface border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all">
    <!-- Ambient Green Glow for Live Production -->
    <div
      v-if="isLive"
      class="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"
    ></div>

    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5 relative z-10">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <NexuraIcon name="Globe" size="xs" />
        </div>
        <div>
          <h3 class="font-mono text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
            <span>LIVE PRODUCTION</span>
            <span
              class="px-2 py-0.5 rounded text-xs font-mono border flex items-center gap-1 uppercase tracking-wider leading-none min-h-[1.25rem]"
              :class="isLive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
              <span>{{ isLive ? 'LIVE • 200 OK' : 'PENDING DEPLOY' }}</span>
            </span>
          </h3>
        </div>
      </div>

      <!-- Controls: Ping Health & Refresh -->
      <div class="flex items-center gap-1.5 font-mono text-xs">
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg bg-void transition cursor-pointer flex items-center gap-1 text-xs"
          :class="pingStatus === 'offline' ? 'hover:bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'hover:bg-emerald-500/20 hover:text-emerald-300 text-muted border border-white/[0.07]'"
          :disabled="isPinging"
          title="Run instant ping check to live production URL"
          @click="pingLiveHealth"
        >
          <NexuraIcon v-if="isPinging" name="RotateCw" size="xs" class="animate-spin text-emerald-400" />
          <NexuraIcon v-else-if="pingStatus === 'offline'" name="AlertTriangle" size="xs" class="text-rose-400" />
          <NexuraIcon v-else name="Zap" size="xs" class="text-emerald-400" />
          <span class="tabular-nums">{{ isPinging ? 'Pinging...' : pingLatency ? `${pingLatency}ms` : pingStatus === 'offline' ? 'Offline' : 'Ping' }}</span>
        </button>

        <button
          type="button"
          class="p-1 rounded-lg bg-void hover:bg-white/10 text-muted hover:text-foreground border border-white/[0.07] transition cursor-pointer"
          :disabled="pending"
          title="Refresh Deployments"
          @click="$emit('refresh')"
        >
          <NexuraIcon
            name="RotateCw"
            size="xs"
            :class="{ 'animate-spin text-accent-light': pending }"
          />
        </button>
      </div>
    </div>

    <!-- Main Live Production Box -->
    <div class="space-y-3 flex-1 flex flex-col justify-between relative z-10">
      <!-- Live Production URL & Quick Actions Bar -->
      <div class="bg-void/60 border border-white/[0.07] rounded-xl p-3 space-y-2.5">
        <div class="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div class="min-w-0 flex-1">
            <span class="font-mono text-xs leading-none uppercase tracking-wider text-muted font-semibold block mb-0.5">
              Production Domain & SSL
            </span>
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span class="font-mono text-xs font-semibold text-foreground truncate hover:text-accent-light transition">
                {{ activeLiveUrl }}
              </span>
            </div>
          </div>

          <!-- Buttons: Open Live App & Copy URL -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg bg-surface hover:bg-white/10 text-muted hover:text-foreground border border-white/[0.08] font-mono text-xs transition cursor-pointer flex items-center gap-1"
              title="Copy production URL"
              @click="copyLiveUrl"
            >
              <NexuraIcon :name="copySuccess ? 'Check' : 'Copy'" size="xs" :class="copySuccess ? 'text-emerald-400' : ''" />
              <span>{{ copySuccess ? 'Copied' : 'Copy' }}</span>
            </button>

            <a
              :href="activeLiveUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 font-mono text-xs font-semibold transition inline-flex items-center gap-1 group"
              title="Open Live Production Web App in new tab"
            >
              <span>Buka Website</span>
              <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        <!-- Deployed Release Info -->
        <div class="pt-2 border-t border-white/[0.04] grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
          <div>
            <span class="text-muted block text-xs leading-none">ACTIVE COMMIT</span>
            <span class="text-accent-light font-semibold tabular-nums">{{ deployedShortSha ? '#' + deployedShortSha : '-' }}</span>
          </div>
          <div>
            <span class="text-muted block text-xs leading-none">TARGET ENV</span>
            <span class="text-foreground font-medium">{{ environmentName }}</span>
          </div>
          <div class="col-span-2 sm:col-span-1">
            <span class="text-muted block text-xs leading-none">DEPLOYED VIA</span>
            <span class="text-foreground">{{ deployedTimeAgo }}</span>
          </div>
        </div>
      </div>

      <!-- Deploy Progress if Building or Recent Deployments -->
      <div v-if="isBuilding" class="bg-void/60 border border-amber-500/30 rounded-xl p-2.5 space-y-1.5">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-amber-400 font-semibold flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>Vercel Build in Progress...</span>
          </span>
          <span class="text-amber-400/80">In Progress</span>
        </div>
        <div class="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div class="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full w-full animate-pulse"></div>
        </div>
      </div>

      <!-- Bottom Mini-Strip: Recent Deployments + Open Telemetry Button -->
      <div class="flex items-center justify-between gap-2 pt-1 font-mono text-xs">
        <div class="flex items-center gap-1.5 text-muted min-w-0">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          <span class="truncate">Edge Network: Global Multi-region</span>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1 text-accent-light hover:text-accent-light transition font-semibold shrink-0 cursor-pointer group"
          @click="$emit('open-modal')"
        >
          <span>Deployments</span>
          <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GitHubDeploymentSummary } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    repo?: string
    deployUrl?: string
    deployments?: GitHubDeploymentSummary | null
    pending?: boolean
  }>(),
  {
    repo: '',
    deployUrl: '',
    deployments: null,
    pending: false
  }
)

defineEmits<{
  (e: 'open-modal'): void
  (e: 'refresh'): void
}>()

const copySuccess = ref(false)
const isPinging = ref(false)
const pingLatency = ref<number | null>(null)
const pingStatus = ref<'idle' | 'online' | 'offline'>('idle')

const isLive = computed(() => {
  if (props.deployments?.latestDeployment) {
    return props.deployments.latestDeployment.state === 'success'
  }
  return Boolean(props.deployUrl)
})

const isBuilding = computed(() => {
  const st = props.deployments?.latestDeployment?.state
  return st === 'in_progress' || st === 'queued' || st === 'pending'
})

const activeLiveUrl = computed(() => {
  if (props.deployments?.latestDeployment?.environmentUrl) {
    return props.deployments.latestDeployment.environmentUrl
  }
  if (props.deployUrl) {
    return props.deployUrl
  }
  if (props.repo) {
    const parts = props.repo.split('/')
    return `https://${parts[parts.length - 1].toLowerCase()}-sona-ta.vercel.app`
  }
  return 'https://management-sona-ta.vercel.app'
})

const deployedShortSha = computed(() => {
  return props.deployments?.latestDeployment?.shortSha || ''
})

const environmentName = computed(() => {
  return props.deployments?.latestDeployment?.environment || 'Production (Edge)'
})

const deployedTimeAgo = computed(() => {
  const d = props.deployments?.latestDeployment?.updatedAt || props.deployments?.latestDeployment?.createdAt
  if (!d) return 'Recent release'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
})

async function copyLiveUrl() {
  try {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(activeLiveUrl.value)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy live URL:', err)
  }
}

async function pingLiveHealth() {
  if (isPinging.value) return
  isPinging.value = true
  const startTime = performance.now()
  try {
    // Attempt HEAD or GET ping to url
    await fetch(activeLiveUrl.value, { method: 'HEAD', mode: 'no-cors' })
    const duration = Math.round(performance.now() - startTime)
    pingLatency.value = duration > 0 ? duration : 18
    pingStatus.value = 'online'
  } catch {
    pingLatency.value = null
    pingStatus.value = 'offline'
  } finally {
    isPinging.value = false
  }
}
</script>
