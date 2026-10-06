<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      :aria-label="`Security Audit for ${repo}`"
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
          <!-- Left: Title & Target -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="statusDotClass"
              aria-hidden="true"
            ></span>
            <div class="min-w-0">
              <div class="font-mono text-xs font-bold text-[#F5F2EB] truncate">
                Repository Security Audit
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                security://audit/{{ repo }}
              </div>
            </div>
          </div>

          <!-- Right: Open on GitHub + Close Button -->
          <div class="flex items-center gap-3 shrink-0">
            <a
              v-if="repo"
              :href="`https://github.com/${repo}/security`"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-xs text-[#C98A4B] hover:text-[#F5F2EB] transition-colors flex items-center gap-1 group"
              title="Open GitHub Security advisory page"
            >
              <span>Security Hub</span>
              <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <button
              type="button"
              class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
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
        <!-- TELEMETRY COUNTER STRIP (4 BENTO TILES)                 -->
        <!-- ======================================================== -->
        <div class="p-5 pb-0 bg-[#09090B]">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <!-- Bento 1: Total Alerts -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Total Alerts</span>
              <div class="flex items-baseline gap-1.5">
                <span
                  class="font-mono text-xl font-bold"
                  :class="summary?.totalAlerts ? 'text-red-400' : 'text-emerald-400'"
                >
                  {{ summary ? summary.totalAlerts : '—' }}
                </span>
                <span class="font-mono text-[10px] text-[#756F68]">issues</span>
              </div>
            </div>

            <!-- Bento 2: Critical / High alerts counter -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Critical / High</span>
              <div class="flex items-baseline gap-1 font-mono text-xs">
                <span
                  class="font-bold"
                  :class="summary?.criticalCount ? 'text-red-400' : 'text-[#756F68]'"
                >
                  {{ summary ? summary.criticalCount : 0 }} Crit
                </span>
                <span class="text-white/20">•</span>
                <span
                  class="font-bold"
                  :class="summary?.highCount ? 'text-orange-400' : 'text-[#756F68]'"
                >
                  {{ summary ? summary.highCount : 0 }} High
                </span>
              </div>
            </div>

            <!-- Bento 3: Secret Scanning status -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Secret Scanning</span>
              <div class="flex items-center gap-1.5">
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="secretScanningDotClass"
                ></span>
                <span
                  class="font-mono text-xs font-semibold"
                  :class="secretScanningTextClass"
                >
                  {{ secretScanningLabel }}
                </span>
              </div>
            </div>

            <!-- Bento 4: Dependabot status -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Dependabot</span>
              <div class="flex items-center gap-1.5">
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="summary?.enabled.dependabot ? 'bg-emerald-400' : 'bg-[#756F68]'"
                ></span>
                <span
                  class="font-mono text-xs font-semibold"
                  :class="summary?.enabled.dependabot ? 'text-emerald-400' : 'text-[#756F68]'"
                >
                  {{ summary?.enabled.dependabot ? 'Active' : 'Disabled' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- MAIN AUDIT BODY                                          -->
        <!-- ======================================================== -->
        <div class="p-5 overflow-y-auto space-y-4 flex-1 bg-[#09090B]">
          <!-- Dependabot Disabled Callout Box -->
          <div
            v-if="summary && !summary.enabled.dependabot"
            class="p-3.5 sm:p-4 rounded-xl border border-[#C98A4B]/30 bg-[#C98A4B]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-start gap-2.5 min-w-0">
              <svg class="w-4 h-4 text-[#C98A4B] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div class="space-y-0.5 min-w-0">
                <div class="font-mono font-bold text-[#F5F2EB]">
                  Dependabot alerts disabled
                </div>
                <p class="text-[#756F68] leading-relaxed">
                  Dependabot alerts are disabled for this repository. Enable it in GitHub to automatically detect vulnerable npm packages and CVEs.
                </p>
              </div>
            </div>

            <a
              :href="`https://github.com/${repo}/settings/security_analysis`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C98A4B]/15 hover:bg-[#C98A4B]/25 text-[#C98A4B] font-mono text-xs font-semibold border border-[#C98A4B]/30 transition-all shrink-0 self-start sm:self-center group"
            >
              <span>Configure on GitHub</span>
              <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          <!-- Loading State -->
          <div v-if="!summary" class="py-12 flex flex-col items-center justify-center gap-3 text-[#756F68]">
            <svg class="w-5 h-5 text-[#C98A4B] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span class="font-mono text-xs text-[#C98A4B] animate-pulse">
              Fetching repository security telemetry from GitHub API...
            </span>
          </div>

          <!-- Clean State (Zero Alerts) -->
          <div
            v-else-if="summary.alerts.length === 0"
            class="py-10 px-4 rounded-xl bg-[#111114]/60 border border-white/[0.06] flex flex-col items-center justify-center text-center space-y-3"
          >
            <div class="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <div class="space-y-1">
              <h4 class="font-mono text-sm font-bold text-emerald-400">
                All Clear
              </h4>
              <p class="font-mono text-xs text-[#756F68] max-w-md">
                No secret leaks or known vulnerabilities detected.
              </p>
            </div>

            <div class="font-mono text-[11px] text-[#756F68]/70 pt-2 flex items-center gap-3">
              <span>Secret Scanning: Monitored</span>
              <span>•</span>
              <span>Code Scanning: Monitored</span>
            </div>
          </div>

          <!-- Alerts List -->
          <div v-else class="space-y-3">
            <div class="flex items-center justify-between font-mono text-xs text-[#756F68] px-1">
              <span class="uppercase tracking-wider">Detected Vulnerabilities ({{ summary.alerts.length }})</span>
              <span>Sorted by Severity</span>
            </div>

            <div
              v-for="alert in summary.alerts"
              :key="alert.id"
              class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-3"
            >
              <!-- Alert Row Header: Badges & Links -->
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Severity Badge -->
                  <span
                    class="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border"
                    :class="getSeverityBadgeClass(alert.severity)"
                  >
                    {{ alert.severity }}
                  </span>

                  <!-- Type Badge -->
                  <span class="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 text-[#756F68] border border-white/[0.06]">
                    {{ alert.type.replace('_', ' ') }}
                  </span>

                  <!-- State Pill -->
                  <span class="font-mono text-[10px] capitalize px-1.5 py-0.2 rounded bg-white/[0.03] text-[#756F68]">
                    {{ alert.state }}
                  </span>
                </div>

                <!-- GitHub Advisory Link -->
                <a
                  v-if="alert.htmlUrl"
                  :href="alert.htmlUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-mono text-xs text-[#C98A4B] hover:text-[#F5F2EB] flex items-center gap-1 transition-colors group"
                >
                  <span>View Advisory</span>
                  <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>

              <!-- Alert Title & Description -->
              <div class="space-y-1">
                <div class="font-mono text-xs font-bold text-[#F5F2EB]">
                  {{ alert.title }}
                </div>
                <p v-if="alert.description" class="text-xs text-[#756F68] line-clamp-2 leading-relaxed">
                  {{ alert.description }}
                </p>
              </div>

              <!-- Package & Vulnerability Specs -->
              <div
                v-if="alert.packageName || alert.vulnerableVersion || alert.patchedVersion || alert.secretType"
                class="p-2.5 rounded-lg bg-[#18181C] border border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono"
              >
                <div v-if="alert.packageName" class="flex items-center gap-1.5 truncate">
                  <span class="text-[#756F68]">Package:</span>
                  <span class="text-[#F5F2EB] font-semibold truncate">{{ alert.packageName }}</span>
                </div>

                <div v-if="alert.secretType" class="flex items-center gap-1.5 truncate">
                  <span class="text-[#756F68]">Secret:</span>
                  <span class="text-[#C98A4B] font-semibold truncate">{{ alert.secretType }}</span>
                </div>

                <div v-if="alert.vulnerableVersion" class="flex items-center gap-1.5 truncate">
                  <span class="text-[#756F68]">Vulnerable:</span>
                  <span class="text-red-400 truncate">{{ alert.vulnerableVersion }}</span>
                </div>

                <div v-if="alert.patchedVersion" class="flex items-center gap-1.5 truncate">
                  <span class="text-[#756F68]">Patched:</span>
                  <span class="text-emerald-400 font-semibold truncate">{{ alert.patchedVersion }}</span>
                </div>
              </div>

              <!-- CVE / GHSA Identifiers & Date -->
              <div class="flex items-center justify-between gap-3 text-[11px] font-mono text-[#756F68] pt-1 border-t border-white/[0.04]">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    v-if="alert.cveId"
                    class="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-900/40 text-[10px]"
                  >
                    {{ alert.cveId }}
                  </span>
                  <span
                    v-if="alert.ghsaId"
                    class="px-2 py-0.5 rounded bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/20 text-[10px]"
                  >
                    {{ alert.ghsaId }}
                  </span>
                </div>

                <span v-if="alert.createdAt">
                  {{ formatAlertTime(alert.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TERMINAL FOOTER                                          -->
        <!-- ======================================================== -->
        <div class="px-5 py-3 bg-[#111114] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#756F68]">
          <div class="flex items-center gap-2">
            <span class="text-[#C98A4B]">nexura-security-telemetry</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>

          <button
            type="button"
            class="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F2EB] hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
            @click="close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { GitHubSecuritySummary, GitHubSecuritySeverity } from '../types'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    repo: string
    summary?: GitHubSecuritySummary | null
  }>(),
  {
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

// Status Dot in Header
const statusDotClass = computed(() => {
  if (!props.summary) return 'bg-[#756F68]'
  if (props.summary.criticalCount > 0) return 'bg-red-400 animate-pulse'
  if (props.summary.highCount > 0) return 'bg-orange-400'
  if (props.summary.totalAlerts > 0) return 'bg-yellow-400'
  if (!props.summary.enabled.dependabot) return 'bg-[#C98A4B]'
  return 'bg-emerald-400'
})

// Secret Scanning Bento Tile
const hasSecretLeaks = computed(() => {
  if (!props.summary) return false
  return props.summary.alerts.some(a => a.type === 'secret_scanning')
})

const secretScanningLabel = computed(() => {
  if (!props.summary) return '—'
  if (!props.summary.enabled.secretScanning) return 'Disabled'
  return hasSecretLeaks.value ? 'Leaks Found' : 'Clean'
})

const secretScanningDotClass = computed(() => {
  if (!props.summary || !props.summary.enabled.secretScanning) return 'bg-[#756F68]'
  return hasSecretLeaks.value ? 'bg-red-400' : 'bg-emerald-400'
})

const secretScanningTextClass = computed(() => {
  if (!props.summary || !props.summary.enabled.secretScanning) return 'text-[#756F68]'
  return hasSecretLeaks.value ? 'text-red-400' : 'text-emerald-400'
})

// Severity Badge Styling
function getSeverityBadgeClass(severity: GitHubSecuritySeverity) {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'high':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    case 'medium':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    case 'low':
    default:
      return 'bg-white/5 text-[#756F68] border-white/10'
  }
}

function formatAlertTime(dateString?: string) {
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
