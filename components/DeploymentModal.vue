<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      :aria-label="`Deployment & Environments Telemetry for ${repo || 'project'}`"
      tabindex="-1"
      @click.self="close"
    >
      <div
        class="w-full max-w-2xl bg-[#09090B] border border-white/[0.08] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden my-8 max-h-[88vh]"
        @click.stop
      >
        <!-- ======================================================== -->
        <!-- TERMINAL WINDOW HEADER                                   -->
        <!-- ======================================================== -->
        <div class="px-5 py-3.5 bg-[#111114] border-b border-white/[0.06] flex items-center justify-between gap-4">
          <!-- Left: Title & Repo Subtitle -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="statusDotClass"
              aria-hidden="true"
            ></span>
            <div class="min-w-0">
              <div class="font-mono text-xs font-bold text-[#F5F2EB] truncate">
                Deployment & Environments Telemetry
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                telemetry://environments/{{ repo || 'local-deployment' }}
              </div>
            </div>
          </div>

          <!-- Right: Live Site Link + Close Button -->
          <div class="flex items-center gap-3 shrink-0">
            <a
              v-if="activeLiveUrl"
              :href="activeLiveUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-xs text-[#C98A4B] hover:text-[#F5F2EB] transition-colors inline-flex items-center gap-1 group"
              title="Open Live Site"
            >
              <span>Live Site</span>
              <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <button
              type="button"
              class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C98A4B] cursor-pointer"
              aria-label="Close modal"
              @click="close"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- 3 BENTO TELEMETRY TILES                                  -->
        <!-- ======================================================== -->
        <div class="p-5 pb-0 bg-[#09090B]">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <!-- Bento 1: Environment -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Environment</span>
              <div class="flex items-baseline gap-2">
                <span class="font-mono text-base sm:text-lg font-bold text-[#F5F2EB] truncate">
                  {{ environmentName }}
                </span>
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                {{ environmentSubtitle }}
              </div>
            </div>

            <!-- Bento 2: State Status -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">State Status</span>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" :class="stateDotClass"></span>
                <span class="font-mono text-base sm:text-lg font-bold" :class="stateTextClass">
                  {{ stateLabel }}
                </span>
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                {{ stateSubtitle }}
              </div>
            </div>

            <!-- Bento 3: Commit Checks -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Commit Checks</span>
              <div class="flex items-baseline gap-1.5">
                <span
                  class="font-mono text-base sm:text-lg font-bold"
                  :class="commitStatusTextClass"
                >
                  {{ commitChecksLabel }}
                </span>
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                {{ commitChecksSubtitle }}
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- MODAL BODY (SCROLLABLE CONTENT)                          -->
        <!-- ======================================================== -->
        <div class="p-5 space-y-5 overflow-y-auto max-h-[calc(88vh-190px)]">
          <!-- SECTION 1: DEPLOYMENT LIST (If deployments exist) -->
          <div v-if="summary?.deployments && summary.deployments.length > 0" class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-mono text-xs uppercase tracking-wider text-[#756F68] flex items-center gap-2">
                <span>Deployments Recorded</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/5 border border-white/[0.06] text-[#756F68]">
                  {{ summary.deployments.length }}
                </span>
              </h3>
            </div>

            <div class="space-y-2.5">
              <div
                v-for="deployment in summary.deployments"
                :key="deployment.id"
                class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-3"
              >
                <!-- Row 1: Environment, State Badge, Branch & Sha, Time -->
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <span
                      class="w-2 h-2 rounded-full shrink-0"
                      :class="getDeploymentDotClass(deployment.state)"
                    ></span>
                    <span class="font-mono text-sm font-bold text-[#F5F2EB]">
                      {{ deployment.environment || 'Production' }}
                    </span>
                    <span
                      class="font-mono text-[10px] px-2 py-0.5 rounded-full border capitalize font-medium"
                      :class="getDeploymentBadgeClass(deployment.state)"
                    >
                      {{ deployment.state.replace('_', ' ') }}
                    </span>
                  </div>

                  <span class="font-mono text-[11px] text-[#756F68]">
                    {{ formatRelativeTime(deployment.updatedAt || deployment.createdAt) }}
                  </span>
                </div>

                <!-- Row 2: Commit Sha & Ref details -->
                <div class="flex items-center gap-3 font-mono text-xs text-[#756F68] flex-wrap">
                  <span v-if="deployment.ref" class="inline-flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-[#C98A4B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="6" y1="3" x2="6" y2="15"></line>
                      <circle cx="18" cy="6" r="3"></circle>
                      <circle cx="6" cy="18" r="3"></circle>
                      <path d="M18 9a9 9 0 0 1-9 9"></path>
                    </svg>
                    <span>{{ deployment.ref }}</span>
                  </span>

                  <span v-if="deployment.shortSha" class="inline-flex items-center gap-1">
                    <span>•</span>
                    <a
                      v-if="repo"
                      :href="`https://github.com/${repo}/commit/${deployment.commitSha}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-[#C98A4B] hover:underline bg-[#C98A4B]/10 px-1.5 py-0.5 rounded border border-[#C98A4B]/20 text-[11px]"
                      :title="`View commit ${deployment.shortSha}`"
                    >
                      {{ deployment.shortSha }}
                    </a>
                    <span v-else class="text-[#C98A4B] bg-[#C98A4B]/10 px-1.5 py-0.5 rounded border border-[#C98A4B]/20 text-[11px]">
                      {{ deployment.shortSha }}
                    </span>
                  </span>

                  <span v-if="deployment.description" class="text-[#756F68] text-[11px] truncate max-w-sm">
                    — {{ deployment.description }}
                  </span>
                </div>

                <!-- Row 3: Action Links (Environment URL & Log URL) -->
                <div v-if="deployment.environmentUrl || deployment.logUrl" class="pt-2 border-t border-white/[0.04] flex items-center gap-2.5 flex-wrap">
                  <a
                    v-if="deployment.environmentUrl"
                    :href="deployment.environmentUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-semibold border border-emerald-500/30 transition-colors group"
                  >
                    <span>Open Live Site</span>
                    <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>

                  <a
                    v-if="deployment.logUrl"
                    :href="deployment.logUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] font-mono text-[11px] border border-white/[0.06] transition-colors group"
                  >
                    <span>View Log</span>
                    <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 2: NO DEPLOYMENTS FALLBACK (Connected URL or Callout) -->
          <div v-else class="space-y-3">
            <!-- Connected Live Environment Card if deployUrl exists -->
            <div
              v-if="deployUrl"
              class="p-4 rounded-xl bg-[#111114] border border-emerald-500/20 space-y-3"
            >
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="font-mono text-sm font-bold text-[#F5F2EB]">
                    Connected Live Environment: Production
                  </span>
                </div>

                <a
                  :href="deployUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold border border-emerald-500/30 transition-colors group"
                >
                  <span>Open Live Site</span>
                  <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>

              <div class="font-mono text-xs text-[#756F68] bg-[#09090B] px-3 py-2 rounded-lg border border-white/[0.04] truncate">
                {{ deployUrl }}
              </div>
            </div>

            <!-- Helpful Callout -->
            <div class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] flex items-start gap-3 text-xs text-[#756F68]">
              <svg class="w-5 h-5 text-[#C98A4B] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div class="space-y-1">
                <div class="font-mono text-[#F5F2EB] font-medium">Deployment Telemetry Ready</div>
                <div>GitHub Deployments are automatically recorded when Vercel, Cloudflare, or GitHub Actions deploy this repository.</div>
              </div>
            </div>
          </div>

          <!-- SECTION 3: COMMIT STATUS CHECKS (If checks exist) -->
          <div
            v-if="summary?.commitStatus?.checks && summary.commitStatus.checks.length > 0"
            class="space-y-2.5 pt-2 border-t border-white/[0.06]"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-mono text-xs uppercase tracking-wider text-[#756F68] flex items-center gap-2">
                <span>Commit Status Checks</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/5 border border-white/[0.06] text-[#756F68]">
                  {{ summary.commitStatus.checks.length }}
                </span>
              </h3>
              <span class="font-mono text-[10px] text-[#756F68]">
                State: {{ summary.commitStatus.state }}
              </span>
            </div>

            <div class="space-y-1.5">
              <div
                v-for="check in summary.commitStatus.checks"
                :key="check.id"
                class="p-3 rounded-lg bg-[#111114] border border-white/[0.04] flex items-center justify-between gap-3"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="getCheckDotClass(check.state)"
                  ></span>
                  <div class="min-w-0">
                    <div class="font-mono text-xs text-[#F5F2EB] font-medium truncate">
                      {{ check.context }}
                    </div>
                    <div v-if="check.description" class="text-[11px] text-[#756F68] truncate font-sans">
                      {{ check.description }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <span
                    class="font-mono text-[10px] px-2 py-0.5 rounded-full border capitalize font-medium"
                    :class="getCheckBadgeClass(check.state)"
                  >
                    {{ check.state }}
                  </span>

                  <a
                    v-if="check.targetUrl"
                    :href="check.targetUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center text-[#C98A4B] hover:text-[#F5F2EB] px-1 py-0.5 group"
                    title="Inspect check target"
                  >
                    <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- WINDOW FOOTER / STATUS BAR                               -->
        <!-- ======================================================== -->
        <div class="px-5 py-2.5 bg-[#111114] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#756F68]">
          <span>telemetry: active</span>
          <span class="hidden sm:inline">Press ESC to close</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { GitHubDeploymentSummary, GitHubDeploymentState } from '../types'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    repo: string
    deployUrl?: string
    summary?: GitHubDeploymentSummary | null
  }>(),
  {
    deployUrl: '',
    summary: null
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

function close() {
  emit('close')
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeyDown)
  }
})

// Active Live URL (from latest deployment environmentUrl, or props.deployUrl)
const activeLiveUrl = computed(() => {
  return props.summary?.latestDeployment?.environmentUrl || props.deployUrl || undefined
})

// Status Dot in Header
const statusDotClass = computed(() => {
  const latest = props.summary?.latestDeployment
  if (latest) {
    if (latest.state === 'success') return 'bg-emerald-400'
    if (latest.state === 'in_progress' || latest.state === 'queued' || latest.state === 'pending') {
      return 'bg-[#C98A4B] animate-pulse'
    }
    if (latest.state === 'failure' || latest.state === 'error') return 'bg-red-400'
  }
  if (props.deployUrl) return 'bg-emerald-400 animate-pulse'
  return 'bg-[#756F68]'
})

// Bento 1: Environment
const environmentName = computed(() => {
  const latest = props.summary?.latestDeployment
  if (latest?.environment) return latest.environment
  if (props.deployUrl) return 'Production'
  return 'None'
})

const environmentSubtitle = computed(() => {
  const latest = props.summary?.latestDeployment
  if (latest?.ref) return `Branch: ${latest.ref}`
  if (props.deployUrl) return 'Manual Project Deploy URL'
  return 'No environment active'
})

// Bento 2: State Status
const stateLabel = computed(() => {
  const latest = props.summary?.latestDeployment
  if (latest) {
    if (latest.state === 'success') return 'Live'
    if (latest.state === 'in_progress' || latest.state === 'queued' || latest.state === 'pending') {
      return 'Deploying'
    }
    if (latest.state === 'failure' || latest.state === 'error') return 'Failed'
    if (latest.state === 'inactive') return 'Inactive'
    return latest.state
  }
  if (props.deployUrl) return 'Connected'
  return 'No Deploy'
})

const stateDotClass = computed(() => {
  const latest = props.summary?.latestDeployment
  if (latest) {
    if (latest.state === 'success') return 'bg-emerald-400'
    if (latest.state === 'in_progress' || latest.state === 'queued' || latest.state === 'pending') {
      return 'bg-[#C98A4B] animate-pulse'
    }
    if (latest.state === 'failure' || latest.state === 'error') return 'bg-red-400'
  }
  if (props.deployUrl) return 'bg-emerald-400'
  return 'bg-[#756F68]'
})

const stateTextClass = computed(() => {
  const latest = props.summary?.latestDeployment
  if (latest) {
    if (latest.state === 'success') return 'text-emerald-400'
    if (latest.state === 'in_progress' || latest.state === 'queued' || latest.state === 'pending') {
      return 'text-[#C98A4B]'
    }
    if (latest.state === 'failure' || latest.state === 'error') return 'text-red-400'
  }
  if (props.deployUrl) return 'text-emerald-400'
  return 'text-[#756F68]'
})

const stateSubtitle = computed(() => {
  const latest = props.summary?.latestDeployment
  if (latest?.shortSha) return `Commit #${latest.shortSha}`
  if (props.deployUrl) return 'Live endpoint active'
  return 'Awaiting deploy webhook'
})

// Bento 3: Commit Checks
const commitChecksLabel = computed(() => {
  const commitStatus = props.summary?.commitStatus
  if (!commitStatus || commitStatus.totalCount === 0) {
    return '0 Checks'
  }
  const passed = commitStatus.checks.filter(c => c.state === 'success').length
  return `${passed}/${commitStatus.totalCount} Passed`
})

const commitStatusTextClass = computed(() => {
  const state = props.summary?.commitStatus?.state
  if (state === 'success') return 'text-emerald-400'
  if (state === 'pending') return 'text-[#C98A4B]'
  if (state === 'failure') return 'text-red-400'
  return 'text-[#756F68]'
})

const commitChecksSubtitle = computed(() => {
  const commitStatus = props.summary?.commitStatus
  if (!commitStatus || commitStatus.totalCount === 0) return 'No commit checks recorded'
  if (commitStatus.state === 'success') return 'All commit checks passed'
  if (commitStatus.state === 'pending') return 'Checks currently running'
  if (commitStatus.state === 'failure') return 'One or more checks failed'
  return `Commit state: ${commitStatus.state}`
})

// Styling Helpers for Deployment Item
function getDeploymentDotClass(state: GitHubDeploymentState) {
  switch (state) {
    case 'success':
      return 'bg-emerald-400'
    case 'in_progress':
    case 'queued':
    case 'pending':
      return 'bg-[#C98A4B] animate-pulse'
    case 'failure':
    case 'error':
      return 'bg-red-400'
    case 'inactive':
    default:
      return 'bg-[#756F68]'
  }
}

function getDeploymentBadgeClass(state: GitHubDeploymentState) {
  switch (state) {
    case 'success':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    case 'in_progress':
    case 'queued':
    case 'pending':
      return 'border-[#C98A4B]/30 bg-[#C98A4B]/10 text-[#C98A4B]'
    case 'failure':
    case 'error':
      return 'border-red-500/30 bg-red-500/10 text-red-400'
    case 'inactive':
    default:
      return 'border-white/[0.08] bg-white/5 text-[#756F68]'
  }
}

// Styling Helpers for Check Item
function getCheckDotClass(state: string) {
  switch (state) {
    case 'success':
      return 'bg-emerald-400'
    case 'pending':
      return 'bg-[#C98A4B] animate-pulse'
    case 'failure':
    case 'error':
      return 'bg-red-400'
    default:
      return 'bg-[#756F68]'
  }
}

function getCheckBadgeClass(state: string) {
  switch (state) {
    case 'success':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    case 'pending':
      return 'border-[#C98A4B]/30 bg-[#C98A4B]/10 text-[#C98A4B]'
    case 'failure':
    case 'error':
      return 'border-red-500/30 bg-red-500/10 text-red-400'
    default:
      return 'border-white/[0.08] bg-white/5 text-[#756F68]'
  }
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
</script>
