<template>
  <div class="p-4 sm:p-5 rounded-xl bg-[#09090B] border border-white/[0.06] space-y-3">
    <!-- Telemetry Header -->
    <div class="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#C98A4B] animate-pulse"></span>
        <h3 class="font-mono text-xs uppercase tracking-wider text-[#F5F2EB] font-bold">
          GitHub Actions Telemetry
        </h3>
        <span v-if="workflows && workflows.length" class="font-mono text-[10px] bg-white/5 text-[#756F68] rounded-full px-2 py-0.2 border border-white/[0.06]">
          {{ workflows.length }} runs
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] font-mono text-[11px] border border-white/[0.06] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          :disabled="workflowsPending"
          title="Refresh workflow runs realtime"
          @click="$emit('refresh')"
        >
          <svg
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': workflowsPending }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ workflowsPending ? 'Syncing...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- Workflow Runs Cockpit List -->
    <div v-if="workflowsPending && (!workflows || workflows.length === 0)" class="py-8 text-center font-mono text-xs text-[#C98A4B] animate-pulse">
      Syncing CI/CD telemetry...
    </div>

    <div v-else-if="workflows && workflows.length > 0" class="space-y-2">
      <div
        v-for="run in workflows"
        :key="run.id"
        class="p-3.5 rounded-lg bg-[#111114] border border-white/[0.04] hover:border-white/[0.1] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs"
      >
        <!-- Left Info -->
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
              :class="getWorkflowRunBadgeClass(run)"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="getWorkflowRunDotClass(run)"></span>
              <span>{{ getWorkflowRunStatusText(run) }}</span>
            </span>

            <span class="text-[#F5F2EB] font-bold truncate">
              {{ run.name }}
            </span>
            <span class="text-[#756F68]">#{{ run.runNumber }}</span>

            <span class="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-[#756F68] border border-white/[0.06]">
              {{ run.event }}
            </span>
          </div>

          <div class="flex items-center gap-2 text-[11px] text-[#756F68] flex-wrap">
            <span class="inline-flex items-center gap-1 text-[#C98A4B] bg-[#C98A4B]/10 px-1.5 py-0.2 rounded border border-[#C98A4B]/20">
              <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span>{{ run.branch }}</span>
            </span>

            <span v-if="run.commitSha" class="bg-white/[0.03] px-1.5 py-0.2 rounded text-[#F5F2EB] border border-white/[0.05]">
              {{ run.commitSha.slice(0, 7) }}
            </span>

            <span class="text-[#F5F2EB]/90 truncate max-w-md">
              {{ run.commitMessage || 'No commit message' }}
            </span>
          </div>
        </div>

        <!-- Right Meta & Actions -->
        <div class="flex items-center gap-3 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-white/[0.04]">
          <div class="flex flex-col md:items-end text-[11px] text-[#756F68]">
            <span v-if="run.durationSeconds > 0" class="text-[#F5F2EB] font-mono">
              ⏱ {{ run.durationSeconds }}s
            </span>
            <span>{{ formatTime(run.createdAt) }}</span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-mono text-[11px] border border-white/[0.08] transition-colors focus:ring-1 focus:ring-[#C98A4B] cursor-pointer"
              title="Open log telemetry modal"
              @click="$emit('open-log', run)"
            >
              <span>Log</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#C98A4B]/10 hover:bg-[#C98A4B]/20 text-[#C98A4B] font-mono text-[11px] border border-[#C98A4B]/30 transition-colors focus:ring-1 focus:ring-[#C98A4B] disabled:opacity-50 cursor-pointer"
              :disabled="rerunningRunId === run.id"
              :title="rerunningRunId === run.id ? 'Triggering rerun...' : 'Rerun workflow'"
              @click="$emit('rerun', run)"
            >
              <svg
                class="w-3 h-3"
                :class="{ 'animate-spin': rerunningRunId === run.id }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Rerun</span>
            </button>

            <a
              v-if="run.htmlUrl"
              :href="run.htmlUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group p-1 text-[#756F68] hover:text-[#C98A4B] transition-colors inline-flex items-center"
              title="Open on GitHub"
            >
              <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-6 text-center text-xs font-mono text-[#756F68] border border-dashed border-white/[0.06] rounded-xl">
      No workflow runs telemetry recorded.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubWorkflowRun } from '~/types'
import IconArrowUpRight from '../IconArrowUpRight.vue'

defineProps<{
  workflows: GitHubWorkflowRun[]
  workflowsPending: boolean
  rerunningRunId: number | null
}>()

defineEmits<{
  (e: 'refresh'): void
  (e: 'open-log', run: GitHubWorkflowRun): void
  (e: 'rerun', run: GitHubWorkflowRun): void
}>()

function getWorkflowRunBadgeClass(run: GitHubWorkflowRun) {
  if (run.status === 'in_progress' || run.status === 'queued') {
    return 'border-[#C98A4B]/40 bg-[#C98A4B]/10 text-[#C98A4B]'
  }
  if (run.conclusion === 'success') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  }
  if (run.conclusion === 'failure') {
    return 'border-red-500/30 bg-red-500/10 text-red-400'
  }
  return 'border-white/[0.08] bg-white/[0.02] text-[#756F68]'
}

function getWorkflowRunDotClass(run: GitHubWorkflowRun) {
  if (run.status === 'in_progress' || run.status === 'queued') return 'bg-[#C98A4B] animate-pulse'
  if (run.conclusion === 'success') return 'bg-emerald-400'
  if (run.conclusion === 'failure') return 'bg-red-400'
  return 'bg-[#756F68]'
}

function getWorkflowRunStatusText(run: GitHubWorkflowRun) {
  if (run.status === 'in_progress') return 'Building'
  if (run.status === 'queued') return 'Queued'
  if (run.conclusion === 'success') return 'Passed'
  if (run.conclusion === 'failure') return 'Failed'
  return run.conclusion || run.status
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
