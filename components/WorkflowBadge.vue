<template>
  <div class="inline-flex items-center">
    <!-- Loading State -->
    <div
      v-if="pending && !latestRun"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border border-white/[0.06] bg-white/[0.02] text-[#756F68] select-none"
      :class="compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'"
      title="Loading CI/CD telemetry..."
    >
      <span class="w-1.5 h-1.5 rounded-full bg-[#756F68] animate-pulse"></span>
      <span>CI: Syncing...</span>
    </div>

    <!-- No Workflow Runs Found -->
    <div
      v-else-if="!latestRun"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border border-white/[0.06] bg-white/[0.02] text-[#756F68]/70 select-none"
      :class="compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'"
      title="No GitHub Actions workflow runs found for this repository"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-[#756F68]/50"></span>
      <span>CI: None</span>
    </div>

    <!-- Status Badge Display -->
    <div
      v-else
      class="inline-flex items-center gap-1.5 font-mono rounded-full border transition-all select-none"
      :class="[badgeContainerClasses, compact ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1']"
    >
      <!-- Clickable Status Indicator Area -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity focus:outline-none focus:ring-1 focus:ring-current rounded"
        :title="badgeTooltip"
        @click.stop="openLogModal"
      >
        <!-- Bullet Dot -->
        <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="dotClasses"></span>
        <span class="font-medium whitespace-nowrap">{{ badgeText }}</span>
      </button>

      <!-- Quick Actions for Failed Run (or full actions) -->
      <div v-if="isFailed" class="flex items-center gap-1 ml-0.5 pl-1.5 border-l border-red-500/30">
        <!-- Log Action Button -->
        <button
          type="button"
          class="font-mono text-[10px] px-1 py-0.5 rounded bg-red-950/50 hover:bg-red-900/60 text-red-300 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-red-400"
          title="View failure logs"
          @click.stop="openLogModal"
        >
          Log
        </button>

        <!-- Rerun Action Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-red-950/50 hover:bg-red-900/60 text-red-300 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-red-400 disabled:opacity-50"
          :disabled="isRerunning"
          :title="isRerunning ? 'Rerunning workflow...' : 'Rerun failed workflow'"
          @click.stop="handleRerun"
        >
          <svg
            class="w-2.5 h-2.5"
            :class="{ 'animate-spin': isRerunning }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span v-if="!compact">Rerun</span>
        </button>
      </div>

      <!-- Quick Log Button for In-Progress or Passed when not compact -->
      <button
        v-else-if="!compact"
        type="button"
        class="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
        title="View workflow logs"
        @click.stop="openLogModal"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Workflow Log Modal Component -->
    <WorkflowLogModal
      :is-open="showLogModal"
      :repo="repo"
      :run="latestRun"
      @close="showLogModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useGitHubWorkflows, rerunWorkflow } from '../composables/useGitHub'
import WorkflowLogModal from './WorkflowLogModal.vue'

const props = withDefaults(
  defineProps<{
    repo: string
    compact?: boolean
  }>(),
  {
    compact: false
  }
)

const repoRef = toRef(props, 'repo')
const { workflows, pending, refresh } = useGitHubWorkflows(repoRef, 1)

const latestRun = computed(() => workflows.value?.[0] ?? null)

const showLogModal = ref(false)
const isRerunning = ref(false)

function openLogModal() {
  if (latestRun.value) {
    showLogModal.value = true
  }
}

async function handleRerun() {
  if (!latestRun.value || isRerunning.value || !props.repo) return
  try {
    isRerunning.value = true
    await rerunWorkflow(props.repo, latestRun.value.id)
    await refresh()
  } catch (err) {
    console.error('Failed to rerun workflow:', err)
  } finally {
    isRerunning.value = false
  }
}

const isSuccess = computed(() => latestRun.value?.conclusion === 'success')

const isRunning = computed(() => {
  if (!latestRun.value) return false
  return (
    latestRun.value.status === 'in_progress' ||
    latestRun.value.status === 'queued' ||
    latestRun.value.conclusion === null
  )
})

const isFailed = computed(() => {
  if (!latestRun.value) return false
  const c = latestRun.value.conclusion
  return c === 'failure' || c === 'timed_out' || c === 'cancelled' || c === 'action_required'
})

const badgeText = computed(() => {
  if (!latestRun.value) return 'CI'
  if (isSuccess.value) {
    const duration = latestRun.value.durationSeconds > 0 ? `${latestRun.value.durationSeconds}s` : ''
    return duration ? `CI: Passed (${duration})` : 'CI: Passed'
  }
  if (isRunning.value) {
    return latestRun.value.status === 'queued' ? 'CI: Queued' : 'CI: Running...'
  }
  if (isFailed.value) {
    return 'CI: Failed'
  }
  return `CI: ${latestRun.value.conclusion || latestRun.value.status}`
})

const badgeContainerClasses = computed(() => {
  if (isSuccess.value) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  }
  if (isRunning.value) {
    return 'border-[#C98A4B]/30 bg-[#C98A4B]/10 text-[#C98A4B]'
  }
  if (isFailed.value) {
    return 'border-red-500/30 bg-red-500/10 text-red-400'
  }
  return 'border-white/[0.08] bg-white/5 text-[#756F68]'
})

const dotClasses = computed(() => {
  if (isSuccess.value) {
    return 'bg-emerald-400'
  }
  if (isRunning.value) {
    return 'bg-[#C98A4B] animate-pulse'
  }
  if (isFailed.value) {
    return 'bg-red-400'
  }
  return 'bg-[#756F68]'
})

const badgeTooltip = computed(() => {
  if (!latestRun.value) return ''
  const runInfo = `${latestRun.value.name} #${latestRun.value.runNumber} (${latestRun.value.branch})`
  return `${runInfo} — Click to view telemetry logs`
})
</script>
