<template>
  <div class="bg-[#111114] border border-white/[0.07] rounded-xl p-4 space-y-3.5 shadow-lg relative overflow-hidden flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        <div>
          <h3 class="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <span>CI/CD PIPELINE</span>
            <span
              v-if="latestRun"
              class="px-1.5 py-0.2 rounded text-[9px] font-mono border"
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
          class="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-white/[0.07] transition cursor-pointer"
          :disabled="pending"
          title="Refresh CI/CD Workflows"
          @click="$emit('refresh')"
        >
          <svg
            class="w-3 h-3"
            :class="{ 'animate-spin text-[#C98A4B]': pending }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="pending && !workflows?.length" class="py-6 flex items-center justify-center gap-2 text-zinc-400 font-mono text-xs">
      <span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
      <span>Syncing GitHub Actions workflows...</span>
    </div>

    <div v-else-if="latestRun" class="space-y-3 flex-1 flex flex-col justify-between">
      <!-- Active Run Highlight Box -->
      <div class="bg-[#18181C] border border-white/[0.06] rounded-lg p-3 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs font-bold text-zinc-100 truncate">
                {{ latestRun.name }}
              </span>
              <span class="font-mono text-[10px] text-zinc-500">
                #{{ latestRun.runNumber }}
              </span>
              <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {{ latestRun.event }}
              </span>
            </div>
            <p class="text-[11px] text-zinc-400 font-sans truncate mt-1" :title="latestRun.commitMessage">
              "{{ latestRun.commitMessage || 'Commit build execution' }}"
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              v-if="latestRun.conclusion === 'failure'"
              type="button"
              class="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-mono text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
              :disabled="isRerunning"
              @click="$emit('rerun', latestRun.id)"
            >
              <span v-if="isRerunning" class="w-2 h-2 rounded-full border border-red-400 border-t-transparent animate-spin"></span>
              <span>Rerun ↺</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/[0.07] font-mono text-[10px] transition cursor-pointer group"
              @click="$emit('open-log', latestRun)"
            >
              <span>Logs</span>
              <IconArrowUpRight class="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-zinc-400 group-hover:text-zinc-200" />
            </button>
          </div>
        </div>

        <!-- Meta strip: branch, sha, duration, timestamp -->
        <div class="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/[0.04] flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="text-zinc-300">branch: {{ latestRun.branch }}</span>
            <span>•</span>
            <span class="text-[#C98A4B]">#{{ latestRun.commitSha.slice(0, 7) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span>{{ formatDuration(latestRun.durationSeconds) }}</span>
            <span>•</span>
            <span>{{ formatTimeAgo(latestRun.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Recent 3 Runs Mini Strip -->
      <div v-if="recentRuns.length > 1" class="space-y-1">
        <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Recent Runs ({{ workflows.length }})
        </div>
        <div class="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
          <div
            v-for="run in recentRuns.slice(0, 3)"
            :key="run.id"
            class="p-1.5 rounded bg-[#18181C]/70 border border-white/[0.04] hover:border-white/[0.09] transition flex items-center justify-between gap-1 cursor-pointer"
            @click="$emit('open-log', run)"
          >
            <div class="flex items-center gap-1.5 truncate">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="getDotClass(run)"></span>
              <span class="text-zinc-300 truncate">#{{ run.runNumber }}</span>
            </div>
            <span class="text-zinc-500 shrink-0">{{ formatDuration(run.durationSeconds) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-6 text-center text-zinc-500 font-mono text-xs space-y-1">
      <p>No GitHub Actions workflows configured.</p>
      <p class="text-[10px] text-zinc-600">Add .github/workflows to trigger CI/CD telemetry.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubWorkflowRun } from '~/types'

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
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  return 'bg-zinc-800 text-zinc-400 border-white/[0.07]'
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
  if (run.conclusion === 'failure') return 'bg-red-400'
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
