<template>
  <div class="inline-flex items-center">
    <!-- Loading State -->
    <div
      v-if="pending && !summary"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border border-white/[0.06] bg-white/[0.02] text-[#756F68] select-none"
      :class="compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'"
      title="Loading security telemetry..."
    >
      <span class="w-1.5 h-1.5 rounded-full bg-[#756F68] animate-pulse"></span>
      <span>Sec: Syncing...</span>
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
      <!-- Icon Indicator -->
      <span class="shrink-0 leading-none">{{ badgeIcon }}</span>

      <!-- Label -->
      <span class="font-medium whitespace-nowrap">{{ badgeText }}</span>

      <!-- Critical Alert Pill (if any) -->
      <span
        v-if="summary && summary.criticalCount > 0"
        class="font-mono text-[9px] px-1 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/50 font-bold ml-0.5"
      >
        {{ summary.criticalCount }} Crit
      </span>
    </button>

    <!-- Security Alert Modal -->
    <SecurityAlertModal
      :is-open="isModalOpen"
      :repo="repo"
      :summary="summary"
      @close="isModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useGitHubSecurity } from '../composables/useGitHub'
import SecurityAlertModal from './SecurityAlertModal.vue'

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
const { security: summary, pending } = useGitHubSecurity(repoRef)

const isModalOpen = ref(false)

const hasAlerts = computed(() => (summary.value?.totalAlerts ?? 0) > 0)

const badgeContainerClasses = computed(() => {
  if (!summary.value) {
    return 'border-white/[0.08] bg-white/[0.03] text-[#756F68]'
  }

  if (hasAlerts.value) {
    return 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
  }

  if (summary.value.enabled.dependabot) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
  }

  // Dependabot disabled, Secret Scanning clean
  return 'border-white/[0.08] bg-white/[0.03] text-[#756F68] hover:text-[#F5F2EB]'
})

const badgeIcon = computed(() => {
  if (!summary.value) return '🛡️'
  if (hasAlerts.value) return '⚠️'
  return '🛡️'
})

const badgeText = computed(() => {
  if (!summary.value) return 'Security'

  if (hasAlerts.value) {
    const total = summary.value.totalAlerts
    return `Security: ${total} Alert${total > 1 ? 's' : ''}`
  }

  if (summary.value.enabled.dependabot) {
    return 'Security: Clean'
  }

  return 'Secrets: Clean • Dependabot Off'
})

const badgeTooltip = computed(() => {
  if (!summary.value) return `Inspect security audit for ${props.repo}`
  if (hasAlerts.value) {
    return `Warning: ${summary.value.totalAlerts} security alert(s) detected. Click to inspect.`
  }
  if (summary.value.enabled.dependabot) {
    return `Security clean: No vulnerabilities detected across active scanners. Click for details.`
  }
  return `Secret scanning clean. Dependabot is disabled on GitHub. Click to inspect.`
})
</script>
