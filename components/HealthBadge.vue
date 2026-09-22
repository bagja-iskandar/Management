<template>
  <div
    class="inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-0.5 rounded-full border tracking-wide font-medium select-none"
    :class="badgeClasses"
    :title="tooltipText"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClasses"></span>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    lastCommitDate?: string | null
    blockersCount?: number
    completionRate?: number // 0 to 100
    hasRepo?: boolean
  }>(),
  {
    lastCommitDate: null,
    blockersCount: 0,
    completionRate: 0,
    hasRepo: false
  }
)

type HealthStatus = 'healthy' | 'warning' | 'critical'

const healthStatus = computed<HealthStatus>(() => {
  const scores: HealthStatus[] = []

  // 1. Blockers Signal (0 = healthy, 1-2 = warning, 3+ = critical)
  if (props.blockersCount >= 3) {
    scores.push('critical')
  } else if (props.blockersCount > 0) {
    scores.push('warning')
  } else {
    scores.push('healthy')
  }

  // 2. Task Completion Signal (> 50% = healthy, 25-50% = warning, < 25% = critical)
  if (props.completionRate > 50) {
    scores.push('healthy')
  } else if (props.completionRate >= 25) {
    scores.push('warning')
  } else {
    scores.push('critical')
  }

  // 3. Last Commit Signal (if repo exists)
  if (props.hasRepo && props.lastCommitDate) {
    const commitTime = new Date(props.lastCommitDate).getTime()
    if (!isNaN(commitTime)) {
      const daysAgo = (Date.now() - commitTime) / (1000 * 60 * 60 * 24)
      if (daysAgo < 7) {
        scores.push('healthy')
      } else if (daysAgo <= 30) {
        scores.push('warning')
      } else {
        scores.push('critical')
      }
    }
  }

  // Worst-case calculation
  if (scores.includes('critical')) return 'critical'
  if (scores.includes('warning')) return 'warning'
  return 'healthy'
})

const label = computed(() => {
  switch (healthStatus.value) {
    case 'critical':
      return 'Critical'
    case 'warning':
      return 'Needs Attention'
    case 'healthy':
    default:
      return 'Healthy'
  }
})

const badgeClasses = computed(() => {
  switch (healthStatus.value) {
    case 'critical':
      return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'warning':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    case 'healthy':
    default:
      return 'bg-green-500/15 text-green-400 border-green-500/30'
  }
})

const dotClasses = computed(() => {
  switch (healthStatus.value) {
    case 'critical':
      return 'bg-red-400 animate-pulse'
    case 'warning':
      return 'bg-yellow-400'
    case 'healthy':
    default:
      return 'bg-green-400'
  }
})

const tooltipText = computed(() => {
  return `Blockers: ${props.blockersCount} | Completion: ${Math.round(props.completionRate)}%`
})
</script>
