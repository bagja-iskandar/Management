<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      :aria-label="run ? `Logs for ${run.name} #${run.runNumber}` : 'Workflow Run Log'"
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
          <!-- Left: Telemetry Run Path -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-[#C98A4B] animate-pulse shrink-0" aria-hidden="true"></span>
            <div class="font-mono text-xs text-[#756F68] truncate">
              telemetry://actions/{{ repo }}/run-{{ run?.id || 'null' }}
            </div>
          </div>

          <!-- Right: Open on GitHub + Close Button -->
          <div class="flex items-center gap-3 shrink-0">
            <a
              v-if="run?.htmlUrl"
              :href="run.htmlUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-xs text-[#C98A4B] hover:text-[#F5F2EB] transition-colors flex items-center gap-1 group"
              title="Open workflow run on GitHub"
            >
              <span>Open on GitHub</span>
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
        <!-- RUN META BAR                                             -->
        <!-- ======================================================== -->
        <div v-if="run" class="px-5 py-3 bg-[#110F0D] border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Run Title -->
            <span class="text-[#F5F2EB] font-bold text-sm">
              {{ run.name }}
            </span>
            <span class="text-[#756F68]">#{{ run.runNumber }}</span>

            <!-- Status Pill -->
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-medium border"
              :class="statusBadgeClasses"
            >
              {{ statusLabel }}
            </span>
          </div>

          <!-- Metadata Chips -->
          <div class="flex items-center gap-2.5 text-[11px] text-[#756F68] flex-wrap">
            <!-- Branch -->
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/20">
              <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span>{{ run.branch }}</span>
            </span>

            <!-- SHA -->
            <span class="px-2 py-0.5 rounded bg-white/[0.04] text-[#F5F2EB] border border-white/[0.06]">
              {{ run.commitSha ? run.commitSha.slice(0, 7) : 'unknown' }}
            </span>

            <!-- Duration -->
            <span v-if="run.durationSeconds > 0" class="text-[#756F68]">
              ⏱ {{ run.durationSeconds }}s
            </span>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TERMINAL LOG CONTENT                                     -->
        <!-- ======================================================== -->
        <div class="p-5 overflow-y-auto space-y-4 font-mono text-xs flex-1 bg-[#09090B]">
          <!-- Loading State -->
          <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-[#756F68]">
            <svg class="w-5 h-5 text-[#C98A4B] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span class="text-xs text-[#C98A4B] animate-pulse">
              Fetching workflow jobs telemetry from GitHub API...
            </span>
          </div>

          <!-- Error State -->
          <div
            v-else-if="errorMessage"
            class="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 space-y-1"
          >
            <div class="flex items-center gap-2 font-bold">
              <span>✕</span>
              <span>Telemetry Error</span>
            </div>
            <p class="text-[11px] text-red-400/80">{{ errorMessage }}</p>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!jobs || jobs.length === 0"
            class="py-12 text-center text-[#756F68] border border-dashed border-white/[0.06] rounded-xl"
          >
            <div class="text-[#C98A4B] text-lg mb-2">⚡</div>
            <p>No job execution details recorded for this run.</p>
            <p class="text-[10px] text-[#756F68]/70 mt-1">
              The run may be queued, or requires GitHub authentication to inspect job logs.
            </p>
          </div>

          <!-- Jobs & Steps List -->
          <div v-else class="space-y-4">
            <div
              v-for="job in jobs"
              :key="job.id"
              class="border border-white/[0.06] bg-[#111114]/60 rounded-xl overflow-hidden"
            >
              <!-- Job Header -->
              <div class="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="getJobDotClass(job)"
                  ></span>
                  <span class="font-bold text-[#F5F2EB] truncate">{{ job.name }}</span>
                </div>

                <div class="flex items-center gap-2 text-[10px] text-[#756F68] shrink-0">
                  <span v-if="job.startedAt && job.completedAt">
                    {{ computeJobDuration(job.startedAt, job.completedAt) }}
                  </span>
                  <span
                    class="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono"
                    :class="getJobStatusBadgeClass(job)"
                  >
                    {{ job.conclusion || job.status }}
                  </span>
                </div>
              </div>

              <!-- Steps List -->
              <div class="p-2 space-y-1.5">
                <div
                  v-for="step in job.steps"
                  :key="step.number"
                  class="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors"
                  :class="getStepRowClasses(step)"
                >
                  <!-- Step Icon & Name -->
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="shrink-0 font-bold w-4 text-center">
                      <span v-if="step.conclusion === 'success'" class="text-emerald-400">✓</span>
                      <span v-else-if="step.conclusion === 'failure'" class="text-red-400">✕</span>
                      <span v-else-if="step.status === 'in_progress'" class="text-[#C98A4B] animate-pulse">●</span>
                      <span v-else-if="step.status === 'queued'" class="text-[#C98A4B]">○</span>
                      <span v-else class="text-[#756F68]">-</span>
                    </span>

                    <span class="truncate font-mono">
                      {{ step.number }}. {{ step.name }}
                    </span>
                  </div>

                  <!-- Step Status Tag -->
                  <span class="text-[10px] uppercase tracking-wider shrink-0 opacity-80">
                    {{ step.conclusion || step.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TERMINAL FOOTER                                          -->
        <!-- ======================================================== -->
        <div class="px-5 py-3 bg-[#111114] border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#756F68]">
          <div class="flex items-center gap-2">
            <span class="text-[#C98A4B]">nexura-telemetry</span>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { fetchWorkflowJobs } from '../composables/useGitHub'
import type { GitHubWorkflowRun, GitHubWorkflowJob } from '../types'

const props = defineProps<{
  isOpen: boolean
  repo: string
  run: GitHubWorkflowRun | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const jobs = ref<GitHubWorkflowJob[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

function close() {
  emit('close')
}

async function loadJobTelemetry() {
  if (!props.isOpen || !props.run || !props.repo) {
    jobs.value = []
    return
  }
  isLoading.value = true
  errorMessage.value = null
  try {
    const data = await fetchWorkflowJobs(props.repo, props.run.id)
    jobs.value = data || []
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Failed to fetch workflow jobs'
    jobs.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [props.isOpen, props.run?.id, props.repo],
  ([newIsOpen, newRunId]) => {
    if (newIsOpen && newRunId) {
      loadJobTelemetry()
    } else if (!newIsOpen) {
      jobs.value = []
      errorMessage.value = null
    }
  },
  { immediate: true }
)

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

const statusLabel = computed(() => {
  if (!props.run) return ''
  if (props.run.status === 'in_progress') return 'In Progress'
  if (props.run.status === 'queued') return 'Queued'
  if (props.run.conclusion === 'success') return 'Passed'
  if (props.run.conclusion === 'failure') return 'Failed'
  if (props.run.conclusion === 'cancelled') return 'Cancelled'
  if (props.run.conclusion === 'timed_out') return 'Timed Out'
  return props.run.conclusion || props.run.status
})

const statusBadgeClasses = computed(() => {
  if (!props.run) return ''
  if (props.run.conclusion === 'success') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  }
  if (props.run.status === 'in_progress' || props.run.status === 'queued') {
    return 'border-[#C98A4B]/30 bg-[#C98A4B]/10 text-[#C98A4B]'
  }
  if (props.run.conclusion === 'failure' || props.run.conclusion === 'timed_out') {
    return 'border-red-500/30 bg-red-500/10 text-red-400'
  }
  return 'border-white/[0.08] bg-white/5 text-[#756F68]'
})

function getJobDotClass(job: GitHubWorkflowJob) {
  if (job.conclusion === 'success') return 'bg-emerald-400'
  if (job.conclusion === 'failure') return 'bg-red-400'
  if (job.status === 'in_progress') return 'bg-[#C98A4B] animate-pulse'
  return 'bg-[#756F68]'
}

function getJobStatusBadgeClass(job: GitHubWorkflowJob) {
  if (job.conclusion === 'success') return 'text-emerald-400 bg-emerald-500/10'
  if (job.conclusion === 'failure') return 'text-red-400 bg-red-500/10'
  if (job.status === 'in_progress') return 'text-[#C98A4B] bg-[#C98A4B]/10'
  return 'text-[#756F68] bg-white/5'
}

function getStepRowClasses(step: { status: string; conclusion: string | null }) {
  if (step.conclusion === 'failure') {
    return 'bg-red-950/30 text-red-400 border border-red-900/40'
  }
  if (step.conclusion === 'success') {
    return 'bg-emerald-950/10 text-emerald-400 border border-emerald-900/20'
  }
  if (step.status === 'in_progress' || step.status === 'queued') {
    return 'bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/30'
  }
  return 'bg-white/[0.02] text-[#756F68] border border-white/[0.03]'
}

function computeJobDuration(start?: string, end?: string | null) {
  if (!start || !end) return ''
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (isNaN(s) || isNaN(e)) return ''
  const sec = Math.max(0, Math.round((e - s) / 1000))
  return `${sec}s`
}
</script>
