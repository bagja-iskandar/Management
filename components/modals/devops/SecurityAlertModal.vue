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
        ref="panelRef"
        class="w-full max-w-2xl bg-[#07080A] border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden my-8 max-h-[88vh] text-[#F3F4F6] outline-none"
        @click.stop
      >
        <!-- ======================================================== -->
        <!-- TERMINAL WINDOW HEADER                                   -->
        <!-- ======================================================== -->
        <div class="px-5 py-3.5 bg-[#111318] border-b border-white/[0.06] flex items-center justify-between gap-4">
          <!-- Left: Title & Target -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="statusDotClass"
              aria-hidden="true"
            ></span>
            <div class="min-w-0">
              <div class="font-sans text-xs font-bold text-[#F3F4F6] truncate">
                Repository Security Audit
              </div>
              <div class="font-mono text-[10px] text-[#8A8F9E] truncate">
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
              class="font-mono text-xs text-indigo-400 hover:text-[#F3F4F6] transition-colors flex items-center gap-1 group"
              title="Open GitHub Security advisory page"
            >
              <span>Security Hub</span>
              <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <button
              type="button"
              class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer"
              aria-label="Close modal"
              @click="close"
            >
              <NexuraIcon name="X" size="sm" />
            </button>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TELEMETRY COUNTER STRIP (4 BENTO TILES)                 -->
        <!-- ======================================================== -->
        <div class="p-5 pb-0 bg-[#07080A]">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <!-- Bento 1: Total Alerts -->
            <div class="p-3 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E]">Total Alerts</span>
              <div class="flex items-baseline gap-1.5">
                <span
                  class="font-mono text-xl font-bold"
                  :class="summary?.totalAlerts ? 'text-rose-400' : 'text-emerald-400'"
                >
                  {{ summary ? summary.totalAlerts : '—' }}
                </span>
                <span class="font-mono text-[10px] text-[#8A8F9E]">issues</span>
              </div>
            </div>

            <!-- Bento 2: Critical / High alerts counter -->
            <div class="p-3 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E]">Critical / High</span>
              <div class="flex items-baseline gap-1 font-mono text-xs">
                <span
                  class="font-bold"
                  :class="summary?.criticalCount ? 'text-rose-400' : 'text-[#8A8F9E]'"
                >
                  {{ summary ? summary.criticalCount : 0 }} Crit
                </span>
                <span class="text-white/20">•</span>
                <span
                  class="font-bold"
                  :class="summary?.highCount ? 'text-amber-400' : 'text-[#8A8F9E]'"
                >
                  {{ summary ? summary.highCount : 0 }} High
                </span>
              </div>
            </div>

            <!-- Bento 3: Secret Scanning status -->
            <div class="p-3 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E]">Secret Scanning</span>
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
            <div class="p-3 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E]">Dependabot</span>
              <div class="flex items-center gap-1.5">
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="summary?.enabled.dependabot ? 'bg-emerald-400' : 'bg-[#8A8F9E]'"
                ></span>
                <span
                  class="font-mono text-xs font-semibold"
                  :class="summary?.enabled.dependabot ? 'text-emerald-400' : 'text-[#8A8F9E]'"
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
        <div class="p-5 overflow-y-auto space-y-4 flex-1 bg-[#07080A] custom-scrollbar">
          <!-- Dependabot Disabled Callout Box -->
          <div
            v-if="summary && !summary.enabled.dependabot"
            class="p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div class="flex items-start gap-2.5 min-w-0">
              <NexuraIcon name="AlertCircle" size="sm" class="text-amber-400 shrink-0 mt-0.5" />
              <div class="space-y-0.5 min-w-0">
                <div class="font-mono font-bold text-[#F3F4F6]">
                  Dependabot alerts disabled
                </div>
                <p class="text-[#8A8F9E] leading-relaxed">
                  Dependabot alerts are disabled for this repository. Enable it in GitHub to automatically detect vulnerable npm packages and CVEs.
                </p>
              </div>
            </div>

            <a
              :href="`https://github.com/${repo}/settings/security_analysis`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-mono text-xs font-semibold border border-amber-500/30 transition-all shrink-0 self-start sm:self-center group"
            >
              <span>Configure on GitHub</span>
              <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          <!-- Loading State -->
          <div v-if="!summary" class="py-12 flex flex-col items-center justify-center gap-3 text-[#8A8F9E]">
            <NexuraIcon name="Loader2" size="lg" class="animate-spin text-indigo-400" />
            <span class="font-mono text-xs text-indigo-300 animate-pulse">
              Fetching repository security telemetry from GitHub API...
            </span>
          </div>

          <!-- Clean State (Zero Alerts) -->
          <div
            v-else-if="summary.alerts.length === 0"
            class="py-10 px-4 rounded-xl bg-[#111318]/60 border border-white/[0.06] flex flex-col items-center justify-center text-center space-y-3"
          >
            <div class="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <NexuraIcon name="ShieldCheck" size="md" />
            </div>

            <div class="space-y-1">
              <h4 class="font-mono text-sm font-bold text-emerald-400">
                All Clear
              </h4>
              <p class="font-mono text-xs text-[#8A8F9E] max-w-md">
                No secret leaks or known vulnerabilities detected.
              </p>
            </div>

            <div class="font-mono text-[11px] text-[#8A8F9E]/70 pt-2 flex items-center gap-3">
              <span>Secret Scanning: Monitored</span>
              <span>•</span>
              <span>Code Scanning: Monitored</span>
            </div>
          </div>

          <!-- Alerts List -->
          <div v-else class="space-y-3">
            <div class="flex items-center justify-between font-mono text-xs text-[#8A8F9E] px-1">
              <span class="uppercase tracking-wider">Detected Vulnerabilities ({{ summary.alerts.length }})</span>
              <span>Sorted by Severity</span>
            </div>

            <div
              v-for="alert in summary.alerts"
              :key="alert.id"
              class="p-4 rounded-xl bg-[#111318] border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-3"
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
                  <span class="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 text-[#8A8F9E] border border-white/[0.06]">
                    {{ alert.type.replace('_', ' ') }}
                  </span>

                  <!-- State Pill -->
                  <span class="font-mono text-[10px] capitalize px-1.5 py-0.2 rounded bg-white/[0.03] text-[#8A8F9E]">
                    {{ alert.state }}
                  </span>
                </div>

                <!-- GitHub Advisory Link -->
                <a
                  v-if="alert.htmlUrl"
                  :href="alert.htmlUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-mono text-xs text-indigo-400 hover:text-[#F3F4F6] flex items-center gap-1 transition-colors group"
                >
                  <span>View Advisory</span>
                  <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>

              <!-- Alert Title & Description -->
              <div class="space-y-1">
                <div class="font-mono text-xs font-bold text-[#F3F4F6]">
                  {{ alert.title }}
                </div>
                <p v-if="alert.description" class="text-xs text-[#8A8F9E] line-clamp-2 leading-relaxed">
                  {{ alert.description }}
                </p>
              </div>

              <!-- Package & Vulnerability Specs -->
              <div
                v-if="alert.packageName || alert.vulnerableVersion || alert.patchedVersion || alert.secretType"
                class="p-2.5 rounded-lg bg-[#15171E] border border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono"
              >
                <div v-if="alert.packageName" class="flex items-center gap-1.5 truncate">
                  <span class="text-[#8A8F9E]">Package:</span>
                  <span class="text-[#F3F4F6] font-semibold truncate">{{ alert.packageName }}</span>
                </div>

                <div v-if="alert.secretType" class="flex items-center gap-1.5 truncate">
                  <span class="text-[#8A8F9E]">Secret:</span>
                  <span class="text-amber-400 font-semibold truncate">{{ alert.secretType }}</span>
                </div>

                <div v-if="alert.vulnerableVersion" class="flex items-center gap-1.5 truncate">
                  <span class="text-[#8A8F9E]">Vulnerable:</span>
                  <span class="text-rose-400 truncate">{{ alert.vulnerableVersion }}</span>
                </div>

                <div v-if="alert.patchedVersion" class="flex items-center gap-1.5 truncate">
                  <span class="text-[#8A8F9E]">Patched:</span>
                  <span class="text-emerald-400 font-semibold truncate">{{ alert.patchedVersion }}</span>
                </div>
              </div>

              <!-- CVE / GHSA Identifiers & Date -->
              <div class="flex items-center justify-between gap-3 text-[11px] font-mono text-[#8A8F9E] pt-1 border-t border-white/[0.04]">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    v-if="alert.cveId"
                    class="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/40 text-[10px]"
                  >
                    {{ alert.cveId }}
                  </span>
                  <span
                    v-if="alert.ghsaId"
                    class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]"
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
        <div class="px-5 py-3 bg-[#111318] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#8A8F9E]">
          <div class="flex items-center gap-2">
            <span class="text-indigo-400">nexura-security-telemetry</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>

          <button
            type="button"
            class="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F3F4F6] hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer"
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
import { ref, computed, toRef } from 'vue'
import NexuraIcon from '~/components/ui/NexuraIcon.vue'
import { useModalLifecycle } from '~/composables/useModalLifecycle'
import type { GitHubSecuritySummary, GitHubSecuritySeverity } from '~/types'

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

const panelRef = ref<HTMLElement | null>(null)

useModalLifecycle({
  isOpen: toRef(props, 'isOpen'),
  panelRef,
  onClose: close,
  preventScroll: true,
  trapFocus: true,
  restoreFocus: true
})

function close() {
  emit('close')
}

// Status Dot in Header
const statusDotClass = computed(() => {
  if (!props.summary) return 'bg-[#8A8F9E]'
  if (props.summary.criticalCount > 0) return 'bg-rose-400 animate-pulse'
  if (props.summary.highCount > 0) return 'bg-amber-400'
  if (props.summary.totalAlerts > 0) return 'bg-yellow-400'
  if (!props.summary.enabled.dependabot) return 'bg-amber-400'
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
  if (!props.summary || !props.summary.enabled.secretScanning) return 'bg-[#8A8F9E]'
  return hasSecretLeaks.value ? 'bg-rose-400' : 'bg-emerald-400'
})

const secretScanningTextClass = computed(() => {
  if (!props.summary || !props.summary.enabled.secretScanning) return 'text-[#8A8F9E]'
  return hasSecretLeaks.value ? 'text-rose-400' : 'text-emerald-400'
})

// Severity Badge Styling
function getSeverityBadgeClass(severity: GitHubSecuritySeverity) {
  switch (severity) {
    case 'critical':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    case 'high':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'medium':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    case 'low':
    default:
      return 'bg-white/5 text-[#8A8F9E] border-white/10'
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
