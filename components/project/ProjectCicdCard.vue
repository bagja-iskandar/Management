<template>
  <div class="obs-card bg-surface border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
          <NexuraIcon name="Terminal" size="xs" />
        </div>
        <div>
          <h3 class="font-mono text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
            <span>CI/CD PIPELINE</span>
            <span
              v-if="latestRun"
              class="px-2 py-0.5 rounded text-xs font-mono border uppercase tracking-wider leading-none min-h-[1.25rem]"
              :class="getStatusBadgeClass(latestRun)"
            >
              {{ getStatusText(latestRun) }}
            </span>
          </h3>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-1.5 font-mono text-xs">
        <button
          type="button"
          class="p-1 rounded-lg bg-void hover:bg-white/10 text-muted hover:text-foreground border border-white/[0.07] transition cursor-pointer"
          :disabled="pending"
          title="Refresh CI/CD Workflows"
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

    <!-- Main Content Area -->
    <div v-if="pending && !workflows?.length" class="py-6 flex items-center justify-center gap-2 text-muted font-mono text-xs">
      <span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
      <span>Syncing GitHub Actions workflows...</span>
    </div>

    <div v-else-if="latestRun" class="space-y-3 flex-1 flex flex-col justify-between">
      <!-- Active Run Highlight Box -->
      <div class="bg-void/60 border border-white/[0.06] rounded-xl p-3 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs font-semibold text-foreground truncate">
                {{ latestRun.name }}
              </span>
              <span class="font-mono text-xs text-muted tabular-nums">
                #{{ latestRun.runNumber }}
              </span>
              <span class="text-xs font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 leading-none min-h-[1.25rem]">
                {{ latestRun.event }}
              </span>
            </div>
            <p class="text-xs text-muted font-sans truncate mt-1" :title="latestRun.commitMessage">
              "{{ latestRun.commitMessage || 'Commit build execution' }}"
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              v-if="latestRun.conclusion === 'failure'"
              type="button"
              class="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-mono text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              :disabled="isRerunning"
              @click="$emit('rerun', latestRun.id)"
            >
              <NexuraIcon v-if="isRerunning" name="RotateCw" size="xs" class="animate-spin" />
              <NexuraIcon v-else name="RotateCw" size="xs" />
              <span>Rerun</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-white/10 text-foreground border border-white/[0.08] font-mono text-xs transition cursor-pointer group"
              @click="$emit('open-log', latestRun)"
            >
              <span>Logs</span>
              <NexuraIcon name="ArrowUpRight" size="xs" class="text-muted group-hover:text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        <!-- Meta strip: branch, sha, duration, timestamp -->
        <div class="flex items-center justify-between text-xs font-mono text-muted pt-1.5 border-t border-white/[0.04] flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="text-foreground">branch: {{ latestRun.branch }}</span>
            <span>•</span>
            <span class="text-accent-light tabular-nums">#{{ latestRun.commitSha.slice(0, 7) }}</span>
          </div>
          <div class="flex items-center gap-2 tabular-nums">
            <span>{{ formatDuration(latestRun.durationSeconds) }}</span>
            <span>•</span>
            <span>{{ formatTimeAgo(latestRun.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Recent 3 Runs Mini Strip -->
      <div v-if="recentRuns.length > 1" class="space-y-1">
        <div class="text-xs font-mono text-muted uppercase tracking-wider">
          Recent Runs ({{ workflows.length }})
        </div>
        <div class="grid grid-cols-3 gap-1.5 font-mono text-xs">
          <div
            v-for="run in recentRuns.slice(0, 3)"
            :key="run.id"
            class="p-1.5 rounded-lg bg-void/60 border border-white/[0.05] hover:border-white/[0.12] transition flex items-center justify-between gap-1 cursor-pointer"
            @click="$emit('open-log', run)"
          >
            <div class="flex items-center gap-1.5 truncate">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="getDotClass(run)"></span>
              <span class="text-foreground truncate tabular-nums">#{{ run.runNumber }}</span>
            </div>
            <span class="text-muted shrink-0 tabular-nums">{{ formatDuration(run.durationSeconds) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-6 text-center text-muted font-mono text-xs space-y-1">
      <p>No GitHub Actions workflows configured.</p>
      <p class="text-xs text-dim">Add .github/workflows to trigger CI/CD telemetry.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubWorkflowRun } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    repo?: string
    workflows?: GitHubWorkflowRun[]
    pending?: boolean
    isRerunning?: boolean
  }>(),
  {
    repo: '',
    workflows: () => [],
    pending: false,
    isRerunning: false
  }
)

defineEmits<{
  (e: 'open-log', run: GitHubWorkflowRun): void
  (e: 'rerun', runId: number): void
  (e: 'refresh'): void
}>()

const latestRun = computed(() => {
  return props.workflows && props.workflows.length > 0 ? props.workflows[0] : null
})

const recentRuns = computed(() => {
  return props.workflows || []
})

function getStatusBadgeClass(run: GitHubWorkflowRun): string {
  if (run.status === 'in_progress' || run.status === 'queued') {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
  if (run.conclusion === 'success') {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  }
  if (run.conclusion === 'failure') {
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  }
  return 'bg-white/5 text-muted border-white/[0.07]'
}

function getStatusText(run: GitHubWorkflowRun): string {
  if (run.status === 'in_progress') return 'RUNNING'
  if (run.status === 'queued') return 'QUEUED'
  if (run.conclusion === 'success') return 'SUCCESS'
  if (run.conclusion === 'failure') return 'FAILED'
  return run.conclusion?.toUpperCase() || 'UNKNOWN'
}

function getDotClass(run: GitHubWorkflowRun): string {
  if (run.status === 'in_progress' || run.status === 'queued') return 'bg-amber-400 animate-pulse'
  if (run.conclusion === 'success') return 'bg-emerald-400'
  if (run.conclusion === 'failure') return 'bg-rose-400'
  return 'bg-zinc-500'
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0s'
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
</script>
