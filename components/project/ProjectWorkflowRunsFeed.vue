<template>
  <div class="p-4 sm:p-5 rounded-2xl bg-[#07080A]/80 border border-white/[0.06] space-y-3">
    <!-- Telemetry Header -->
    <div class="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        <h3 class="font-mono text-xs uppercase tracking-wider text-[#F3F4F6] font-bold">
          GitHub Actions Telemetry
        </h3>
        <span v-if="workflows && workflows.length" class="font-mono text-[10px] tabular-nums bg-white/5 text-[#8A8F9E] rounded-full px-2 py-0.5 border border-white/[0.06]">
          {{ workflows.length }} runs
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] font-mono text-[11px] border border-white/[0.06] transition-colors focus:ring-1 focus:ring-indigo-500/50 focus:outline-none cursor-pointer"
          :disabled="workflowsPending"
          title="Refresh workflow runs realtime"
          @click="$emit('refresh')"
        >
          <NexuraIcon
            name="RotateCw"
            size="xs"
            :class="{ 'animate-spin text-indigo-400': workflowsPending }"
          />
          <span>{{ workflowsPending ? 'Syncing...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- Workflow Runs Cockpit List -->
    <div v-if="workflowsPending && (!workflows || workflows.length === 0)" class="py-8 text-center font-mono text-xs text-indigo-400 animate-pulse">
      Syncing CI/CD telemetry...
    </div>

    <div v-else-if="workflows && workflows.length > 0" class="space-y-2">
      <div
        v-for="run in workflows"
        :key="run.id"
        class="p-3.5 rounded-xl bg-[#111318] border border-white/[0.05] hover:border-white/[0.12] transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs"
      >
        <!-- Left Info -->
        <div class="space-y-1.5 flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
              :class="getWorkflowRunBadgeClass(run)"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="getWorkflowRunDotClass(run)"></span>
              <span>{{ getWorkflowRunStatusText(run) }}</span>
            </span>

            <span class="text-[#F3F4F6] font-bold truncate">
              {{ run.name }}
            </span>
            <span class="text-[#8A8F9E] tabular-nums">#{{ run.runNumber }}</span>

            <span class="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-[#8A8F9E] border border-white/[0.06]">
              {{ run.event }}
            </span>
          </div>

          <div class="flex items-center gap-2 text-[11px] text-[#8A8F9E] flex-wrap">
            <span class="inline-flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              <NexuraIcon name="GitBranch" size="xs" class="shrink-0" />
              <span>{{ run.branch }}</span>
            </span>

            <span v-if="run.commitSha" class="bg-white/[0.03] px-2 py-0.5 rounded text-[#F3F4F6] border border-white/[0.05] tabular-nums">
              {{ run.commitSha.slice(0, 7) }}
            </span>

            <span class="text-[#F3F4F6]/90 truncate max-w-md">
              {{ run.commitMessage || 'No commit message' }}
            </span>
          </div>
        </div>

        <!-- Right Meta & Actions -->
        <div class="flex items-center gap-3 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-white/[0.04]">
          <div class="flex flex-col md:items-end text-[11px] text-[#8A8F9E] tabular-nums">
            <span v-if="run.durationSeconds > 0" class="text-[#F3F4F6] font-mono inline-flex items-center gap-1">
              <NexuraIcon name="Clock" size="xs" class="text-[#8A8F9E]" />
              <span>{{ run.durationSeconds }}s</span>
            </span>
            <span>{{ formatTime(run.createdAt) }}</span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F3F4F6] font-mono text-[11px] border border-white/[0.08] transition-colors focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
              title="Open log telemetry modal"
              @click="$emit('open-log', run)"
            >
              <span>Log</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-mono text-[11px] border border-indigo-500/30 transition-colors focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 cursor-pointer"
              :disabled="rerunningRunId === run.id"
              :title="rerunningRunId === run.id ? 'Triggering rerun...' : 'Rerun workflow'"
              @click="$emit('rerun', run)"
            >
              <NexuraIcon
                name="RotateCw"
                size="xs"
                :class="{ 'animate-spin': rerunningRunId === run.id }"
              />
              <span>Rerun</span>
            </button>

            <a
              v-if="run.htmlUrl"
              :href="run.htmlUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group p-1 text-[#8A8F9E] hover:text-indigo-400 transition-colors inline-flex items-center"
              title="Open on GitHub"
            >
              <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-6 text-center text-xs font-mono text-[#8A8F9E] border border-dashed border-white/[0.06] rounded-xl">
      No workflow runs telemetry recorded.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubWorkflowRun } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

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
    return 'border-amber-500/40 bg-amber-500/10 text-amber-400'
  }
  if (run.conclusion === 'success') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  }
  if (run.conclusion === 'failure') {
    return 'border-rose-500/30 bg-rose-500/10 text-rose-400'
  }
  return 'border-white/[0.08] bg-white/[0.02] text-[#8A8F9E]'
}

function getWorkflowRunDotClass(run: GitHubWorkflowRun) {
  if (run.status === 'in_progress' || run.status === 'queued') return 'bg-amber-400 animate-pulse'
  if (run.conclusion === 'success') return 'bg-emerald-400'
  if (run.conclusion === 'failure') return 'bg-rose-400'
  return 'bg-[#8A8F9E]'
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
