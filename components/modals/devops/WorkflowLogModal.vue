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
        ref="panelRef"
        class="w-full max-w-2xl bg-void border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden my-8 max-h-[88vh] text-foreground outline-none"
        @click.stop
      >
        <!-- ======================================================== -->
        <!-- TERMINAL WINDOW HEADER                                   -->
        <!-- ======================================================== -->
        <div class="px-5 py-3.5 bg-surface border-b border-white/[0.06] flex items-center justify-between gap-4">
          <!-- Left: Telemetry Run Path -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-accent-light animate-pulse shrink-0" aria-hidden="true"></span>
            <div class="font-mono text-xs text-muted truncate">
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
              class="font-mono text-xs text-accent-light hover:text-foreground transition-colors flex items-center gap-1 group"
              title="Open workflow run on GitHub"
            >
              <span>Open on GitHub</span>
              <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <button
              type="button"
              class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-accent/40 cursor-pointer"
              aria-label="Close modal"
              @click="close"
            >
              <NexuraIcon name="X" size="sm" />
            </button>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- RUN META BAR                                             -->
        <!-- ======================================================== -->
        <div v-if="run" class="px-5 py-3 bg-surface border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Run Title -->
            <span class="text-foreground font-semibold text-sm">
              {{ run.name }}
            </span>
            <span class="text-muted">#{{ run.runNumber }}</span>

            <!-- Status Pill -->
            <span
              class="px-2 py-0.5 rounded-full text-xs font-medium border"
              :class="statusBadgeClasses"
            >
              {{ statusLabel }}
            </span>
          </div>

          <!-- Metadata Chips -->
          <div class="flex items-center gap-2.5 text-xs text-muted flex-wrap">
            <!-- Branch -->
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent-light border border-accent/20">
              <NexuraIcon name="GitBranch" size="xs" />
              <span>{{ run.branch }}</span>
            </span>

            <!-- SHA -->
            <span class="px-2 py-0.5 rounded bg-white/[0.04] text-foreground border border-white/[0.06]">
              {{ run.commitSha ? run.commitSha.slice(0, 7) : 'unknown' }}
            </span>

            <!-- Duration -->
            <span v-if="run.durationSeconds > 0" class="text-muted">
              ⏱ {{ run.durationSeconds }}s
            </span>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TERMINAL LOG CONTENT                                     -->
        <!-- ======================================================== -->
        <div class="p-5 overflow-y-auto space-y-4 font-mono text-xs flex-1 bg-void custom-scrollbar">
          <!-- Loading State -->
          <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-muted">
            <NexuraIcon name="Loader2" size="lg" class="animate-spin text-accent-light" />
            <span class="text-xs text-accent-light animate-pulse">
              Fetching workflow jobs telemetry from GitHub API...
            </span>
          </div>

          <!-- Error State -->
          <div
            v-else-if="errorMessage"
            class="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 space-y-1"
          >
            <div class="flex items-center gap-2 font-semibold">
              <span>✕</span>
              <span>Telemetry Error</span>
            </div>
            <p class="text-xs text-rose-400/80">{{ errorMessage }}</p>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!jobs || jobs.length === 0"
            class="py-12 text-center text-muted border border-dashed border-white/[0.06] rounded-xl"
          >
            <div class="text-accent-light text-lg mb-2">⚡</div>
            <p>No job execution details recorded for this run.</p>
            <p class="text-xs text-muted/70 mt-1">
              The run may be queued, or requires GitHub authentication to inspect job logs.
            </p>
          </div>

          <!-- Jobs & Steps List -->
          <div v-else class="space-y-4">
            <div
              v-for="job in jobs"
              :key="job.id"
              class="border border-white/[0.06] bg-surface/60 rounded-xl overflow-hidden"
            >
              <!-- Job Header -->
              <div class="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="getJobDotClass(job)"
                  ></span>
                  <span class="font-semibold text-foreground truncate">{{ job.name }}</span>
                </div>

                <div class="flex items-center gap-2 text-xs text-muted shrink-0">
                  <span v-if="job.startedAt && job.completedAt">
                    {{ computeJobDuration(job.startedAt, job.completedAt) }}
                  </span>
                  <span
                    class="px-1.5 py-0.5 rounded text-xs uppercase font-mono"
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
                    <span class="shrink-0 font-semibold w-4 text-center">
                      <span v-if="step.conclusion === 'success'" class="text-emerald-400">✓</span>
                      <span v-else-if="step.conclusion === 'failure'" class="text-rose-400">✕</span>
                      <span v-else-if="step.status === 'in_progress'" class="text-amber-400 animate-pulse">●</span>
                      <span v-else-if="step.status === 'queued'" class="text-amber-400">○</span>
                      <span v-else class="text-muted">-</span>
                    </span>

                    <span class="truncate font-mono">
                      {{ step.number }}. {{ step.name }}
                    </span>
                  </div>

                  <!-- Step Status Tag -->
                  <span class="text-xs uppercase tracking-wider shrink-0 opacity-80">
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
        <div class="px-5 py-3 bg-surface border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-muted">
          <div class="flex items-center gap-2">
            <span class="text-accent-light">nexura-telemetry</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>

          <button
            type="button"
            class="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-foreground hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-accent/40 cursor-pointer"
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
import { ref, computed, watch, toRef } from 'vue'
import NexuraIcon from '~/components/ui/NexuraIcon.vue'
import { fetchWorkflowJobs } from '~/composables/useGitHub'
import { useModalLifecycle } from '~/composables/useModalLifecycle'
import type { GitHubWorkflowRun, GitHubWorkflowJob } from '~/types'

const props = defineProps<{
  isOpen: boolean
  repo: string
  run: GitHubWorkflowRun | null
}>()

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
    return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  }
  if (props.run.conclusion === 'failure' || props.run.conclusion === 'timed_out') {
    return 'border-rose-500/30 bg-rose-500/10 text-rose-400'
  }
  return 'border-white/[0.08] bg-white/5 text-muted'
})

function getJobDotClass(job: GitHubWorkflowJob) {
  if (job.conclusion === 'success') return 'bg-emerald-400'
  if (job.conclusion === 'failure') return 'bg-rose-400'
  if (job.status === 'in_progress') return 'bg-amber-400 animate-pulse'
  return 'bg-muted'
}

function getJobStatusBadgeClass(job: GitHubWorkflowJob) {
  if (job.conclusion === 'success') return 'text-emerald-400 bg-emerald-500/10'
  if (job.conclusion === 'failure') return 'text-rose-400 bg-rose-500/10'
  if (job.status === 'in_progress') return 'text-amber-400 bg-amber-500/10'
  return 'text-muted bg-white/5'
}

function getStepRowClasses(step: { status: string; conclusion: string | null }) {
  if (step.conclusion === 'failure') {
    return 'bg-rose-950/30 text-rose-400 border border-rose-900/40'
  }
  if (step.conclusion === 'success') {
    return 'bg-emerald-950/10 text-emerald-400 border border-emerald-900/20'
  }
  if (step.status === 'in_progress' || step.status === 'queued') {
    return 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
  }
  return 'bg-white/[0.02] text-muted border border-white/[0.03]'
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
