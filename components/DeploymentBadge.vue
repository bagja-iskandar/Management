<template>
  <div class="inline-flex items-center">
    <!-- Loading State -->
    <div
      v-if="pending && !summary"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border border-white/[0.06] bg-white/[0.02] text-[#756F68] select-none"
      :class="compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'"
      title="Loading deployment telemetry..."
    >
      <span class="w-1.5 h-1.5 rounded-full bg-[#756F68] animate-pulse"></span>
      <span>Deploy: Syncing...</span>
    </div>

    <!-- Status Badge Display -->
    <button
      v-else
      type="button"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border transition-all select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-current"
      :class="[badgeContainerClasses, compact ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1']"
      :title="badgeTooltip"
      @click.stop="isModalOpen = true"
    >
      <!-- Pulsing or Static Dot Indicator -->
      <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="dotClasses"></span>

      <!-- Label -->
      <span class="font-medium whitespace-nowrap">{{ badgeText }}</span>
    </button>

    <!-- Deployment & Environments Modal -->
    <DeploymentModal
      :is-open="isModalOpen"
      :repo="repo || ''"
      :deploy-url="deployUrl"
      :summary="summary"
      @close="isModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGitHubDeployments } from '../composables/useGitHub'
import DeploymentModal from './DeploymentModal.vue'

const props = withDefaults(
  defineProps<{
    repo?: string
    deployUrl?: string
    compact?: boolean
  }>(),
  {
    repo: '',
    deployUrl: '',
    compact: false
  }
)

const repoRef = computed(() => props.repo || '')
const { deployments: summary, pending } = useGitHubDeployments(repoRef)

const isModalOpen = ref(false)

const latestDeployment = computed(() => summary.value?.latestDeployment ?? null)

const badgeText = computed(() => {
  if (latestDeployment.value) {
    const d = latestDeployment.value
    if (d.state === 'success') {
      const env = d.environment || 'Production'
      const sha = !props.compact && d.shortSha ? ` #${d.shortSha}` : ''
      return `Live: ${env}${sha}`
    }
    if (d.state === 'in_progress' || d.state === 'queued' || d.state === 'pending') {
      return 'Deploying...'
    }
    if (d.state === 'failure' || d.state === 'error') {
      return 'Deploy Failed'
    }
    return `Deploy: ${d.state}`
  }

  if (props.deployUrl) {
    return props.compact ? 'Live' : 'Live: Production'
  }

  return 'No Deploy'
})

const badgeContainerClasses = computed(() => {
  if (latestDeployment.value) {
    const s = latestDeployment.value.state
    if (s === 'success') {
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
    }
    if (s === 'in_progress' || s === 'queued' || s === 'pending') {
      return 'border-[#C98A4B]/30 bg-[#C98A4B]/10 text-[#C98A4B] hover:bg-[#C98A4B]/20'
    }
    if (s === 'failure' || s === 'error') {
      return 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
    }
    return 'border-white/[0.08] bg-white/5 text-[#756F68] hover:text-[#F5F2EB]'
  }

  if (props.deployUrl) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
  }

  return 'border-white/[0.08] bg-white/[0.03] text-[#756F68] hover:text-[#F5F2EB]'
})

const dotClasses = computed(() => {
  if (latestDeployment.value) {
    const s = latestDeployment.value.state
    if (s === 'success') {
      return 'bg-emerald-400 animate-pulse'
    }
    if (s === 'in_progress' || s === 'queued' || s === 'pending') {
      return 'bg-[#C98A4B] animate-pulse'
    }
    if (s === 'failure' || s === 'error') {
      return 'bg-red-400'
    }
    return 'bg-[#756F68]'
  }

  if (props.deployUrl) {
    return 'bg-emerald-400 animate-pulse'
  }

  return 'bg-[#756F68]'
})

const badgeTooltip = computed(() => {
  if (latestDeployment.value) {
    const d = latestDeployment.value
    return `Deployment: ${d.environment} (${d.state}) — Click to view telemetry`
  }
  if (props.deployUrl) {
    return `Live Environment: ${props.deployUrl} — Click to inspect telemetry`
  }
  return 'No deployment detected — Click to inspect telemetry'
})
</script>
