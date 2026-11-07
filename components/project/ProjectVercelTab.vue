<template>
  <div class="space-y-6">
    <!-- Top Production Banner -->
    <div class="obs-card bg-[#111318] border border-white/[0.07] rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
      <!-- Ambient Glow -->
      <div class="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold">
              VERCEL PRODUCTION DEPLOYMENT
            </span>
          </div>
          <h2 class="font-mono text-xl sm:text-2xl font-bold text-[#F3F4F6] flex items-center gap-2">
            <span>{{ liveDomain }}</span>
          </h2>
          <p class="font-mono text-xs text-[#8A8F9E] flex items-center gap-2 flex-wrap">
            <span>Branch: <strong class="text-[#F3F4F6]">main</strong></span>
            <template v-if="activeSha">
              <span>•</span>
              <span>Commit: <strong class="text-indigo-400 tabular-nums">#{{ activeSha }}</strong></span>
            </template>
            <template v-if="project.primaryTech">
              <span>•</span>
              <span>Stack: <strong class="text-[#F3F4F6]">{{ project.primaryTech }}</strong></span>
            </template>
          </p>
        </div>

        <!-- Quick Launch Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-[#07080A] hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.08] font-mono text-xs transition cursor-pointer flex items-center gap-1.5"
            @click="copyUrl"
          >
            <NexuraIcon :name="copied ? 'Check' : 'Copy'" size="xs" :class="copied ? 'text-emerald-400' : ''" />
            <span>{{ copied ? 'Copied' : 'Copy URL' }}</span>
          </button>

          <a
            :href="liveUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-mono text-xs font-bold transition inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 group"
          >
            <span>Buka Website</span>
            <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>

      <!-- Live Vercel Metric Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06] font-mono relative z-10">
        <div class="bg-[#07080A]/60 p-3 rounded-xl border border-white/[0.05] space-y-1">
          <span class="text-[10px] text-[#8A8F9E] uppercase">STATUS</span>
          <div class="text-xs font-bold flex items-center gap-1.5" :class="pingStatus === 'offline' ? 'text-rose-400' : 'text-emerald-400'">
            <span class="w-1.5 h-1.5 rounded-full" :class="pingStatus === 'offline' ? 'bg-rose-400' : 'bg-emerald-400'"></span>
            <span>{{ pingStatus === 'offline' ? 'Offline' : 'Ready (Live)' }}</span>
          </div>
        </div>

        <div class="bg-[#07080A]/60 p-3 rounded-xl border border-white/[0.05] space-y-1">
          <span class="text-[10px] text-[#8A8F9E] uppercase">RESPONSE PING</span>
          <div class="text-xs font-bold text-[#F3F4F6] flex items-center justify-between">
            <span v-if="pingStatus === 'offline'" class="text-rose-400 text-xs">Offline</span>
            <span v-else-if="pingLatency !== null" class="tabular-nums">{{ pingLatency }}ms</span>
            <span v-else class="text-[#8A8F9E] text-xs">Not tested</span>
            <button
              type="button"
              class="text-[9px] text-indigo-400 hover:underline cursor-pointer"
              :disabled="isPinging"
              @click="ping"
            >
              {{ isPinging ? '...' : 'Re-ping' }}
            </button>
          </div>
        </div>

        <div class="bg-[#07080A]/60 p-3 rounded-xl border border-white/[0.05] space-y-1">
          <span class="text-[10px] text-[#8A8F9E] uppercase">SSL PROTOCOL</span>
          <div class="text-xs font-bold text-[#F3F4F6]">
            {{ liveUrl.startsWith('https://') ? 'HTTPS (Active)' : 'HTTP' }}
          </div>
        </div>

        <div class="bg-[#07080A]/60 p-3 rounded-xl border border-white/[0.05] space-y-1">
          <span class="text-[10px] text-[#8A8F9E] uppercase">LATEST RELEASE</span>
          <div class="text-xs font-bold text-[#F3F4F6] truncate">
            {{ latestDeploymentTime }}
          </div>
        </div>
      </div>
    </div>

    <!-- Deployment History & Environments -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column: Deployments List (8 cols) -->
      <div class="lg:col-span-8 bg-[#111318] border border-white/[0.07] rounded-2xl p-5 space-y-4 shadow-xl">
        <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <h3 class="font-mono text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
              Deployment Releases History
            </h3>
          </div>
          <span class="font-mono text-[10px] tabular-nums bg-white/5 text-[#8A8F9E] px-2 py-0.5 rounded border border-white/[0.06]">
            {{ deploymentList.length }} Deployments
          </span>
        </div>

        <div v-if="deploymentList.length > 0" class="space-y-2.5">
          <div
            v-for="(d, idx) in deploymentList"
            :key="d.id || idx"
            class="bg-[#07080A]/60 hover:bg-[#171920] border border-white/[0.05] hover:border-white/[0.12] rounded-xl p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
          >
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-semibold border"
                  :class="d.environment === 'production' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-sky-500/15 text-sky-400 border-sky-500/30'"
                >
                  {{ d.environment.toUpperCase() }}
                </span>
                <span class="text-[#F3F4F6] font-bold truncate">
                  {{ d.name || 'Commit Release' }}
                </span>
                <span v-if="d.shortSha" class="text-indigo-400 font-bold tabular-nums">#{{ d.shortSha }}</span>
              </div>
              <p class="text-[11px] text-[#8A8F9E] font-sans truncate">
                {{ d.message || 'Automated deployment via GitHub push' }}
              </p>
            </div>

            <div class="flex items-center gap-3 shrink-0 text-[#8A8F9E] text-[11px] justify-between sm:justify-end">
              <span class="tabular-nums">{{ d.timeAgo }}</span>
              <a
                v-if="d.url"
                :href="d.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111318] hover:bg-white/10 text-[#F3F4F6] font-mono text-[10px] transition border border-white/[0.06] group"
              >
                <span>Visit</span>
                <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>

        <BaseEmptyState
          v-else
          icon="CloudOff"
          title="No Deployment History Found"
          description="No GitHub deployments or release environments are recorded for this repository yet."
        />
      </div>

      <!-- Right Column: Production Configuration & Meta (4 cols) -->
      <div class="lg:col-span-4 space-y-4">
        <div class="bg-[#111318] border border-white/[0.07] rounded-2xl p-5 space-y-4 shadow-xl font-mono text-xs">
          <div class="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <h4 class="font-mono text-xs font-bold text-[#F3F4F6] uppercase tracking-wider">
              Environment Meta
            </h4>
          </div>

          <div class="space-y-3">
            <div class="space-y-1">
              <span class="text-[10px] text-[#8A8F9E] uppercase block">Assigned Project</span>
              <p class="text-xs font-sans text-[#F3F4F6] font-medium">{{ project.title }}</p>
            </div>

            <div class="space-y-1">
              <span class="text-[10px] text-[#8A8F9E] uppercase block">GitHub Repository</span>
              <p class="text-xs font-mono text-indigo-300 truncate">{{ project.githubRepo || 'No linked repository' }}</p>
            </div>

            <div class="space-y-1">
              <span class="text-[10px] text-[#8A8F9E] uppercase block">Primary Tech Stack</span>
              <p class="text-xs font-mono text-[#F3F4F6]">{{ project.primaryTech || 'Not specified' }}</p>
            </div>

            <div class="space-y-1">
              <span class="text-[10px] text-[#8A8F9E] uppercase block">Edge Runtime</span>
              <p class="text-xs font-mono text-emerald-400">Vercel Serverless / Edge</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Project, GitHubDeploymentSummary } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'
import BaseEmptyState from '../ui/BaseEmptyState.vue'

const props = withDefaults(
  defineProps<{
    project: Project
    deployments?: GitHubDeploymentSummary | null
  }>(),
  {
    deployments: null
  }
)

const copied = ref(false)
const isPinging = ref(false)
const pingLatency = ref<number | null>(null)
const pingStatus = ref<'idle' | 'online' | 'offline'>('idle')

const liveUrl = computed(() => {
  if (props.project.deployUrl) return props.project.deployUrl
  if (props.deployments?.latestDeployment?.environmentUrl) return props.deployments.latestDeployment.environmentUrl
  const config = useRuntimeConfig()
  if (config.public?.vercelProductionUrl) return config.public.vercelProductionUrl as string
  if (props.project.githubRepo) {
    const parts = props.project.githubRepo.split('/')
    return `https://${parts[parts.length - 1].toLowerCase()}-sona-ta.vercel.app`
  }
  return 'https://management-sona-ta.vercel.app'
})

const liveDomain = computed(() => {
  try {
    const url = new URL(liveUrl.value)
    return url.hostname
  } catch {
    return liveUrl.value.replace(/^https?:\/\//, '')
  }
})

const activeSha = computed(() => {
  return props.deployments?.latestDeployment?.shortSha || ''
})

const latestDeploymentTime = computed(() => {
  const d = props.deployments?.latestDeployment?.updatedAt || props.deployments?.latestDeployment?.createdAt
  return d ? formatTimeAgo(d) : 'No releases recorded'
})

const deploymentList = computed(() => {
  if (props.deployments?.deployments && props.deployments.deployments.length > 0) {
    return props.deployments.deployments.map((d) => ({
      id: d.id,
      name: d.description || 'Production Release',
      environment: d.environment || 'production',
      shortSha: d.shortSha || '',
      message: d.description || 'Verified production release build',
      timeAgo: formatTimeAgo(d.updatedAt || d.createdAt),
      url: d.environmentUrl || liveUrl.value
    }))
  }
  return []
})

function copyUrl() {
  navigator.clipboard.writeText(liveUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

async function ping() {
  isPinging.value = true
  const start = performance.now()
  try {
    await fetch(liveUrl.value, { mode: 'no-cors' })
    pingLatency.value = Math.max(18, Math.round(performance.now() - start))
    pingStatus.value = 'online'
  } catch {
    pingLatency.value = null
    pingStatus.value = 'offline'
  } finally {
    isPinging.value = false
  }
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Recently'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>
