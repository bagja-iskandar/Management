<template>
  <div class="stat-card">
    <div class="stat-card-header">
      <span class="stat-label">{{ stat.label }}</span>
      <div class="stat-icon-wrapper" :class="iconVariant" aria-hidden="true">
        <svg v-if="iconVariant === 'projects'" class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <svg v-else-if="iconVariant === 'completed'" class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <svg v-else-if="iconVariant === 'in-progress'" class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </svg>
        <svg v-else class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
    </div>

    <h3 class="stat-value">{{ formattedValue }}</h3>

    <div class="stat-trend" :class="stat.trend">
      <svg class="trend-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline v-if="stat.trend === 'up'" points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline v-if="stat.trend === 'up'" points="17 6 23 6 23 12"></polyline>
        <line v-else x1="5" y1="12" x2="19" y2="12"></line>
        <polyline v-if="stat.trend !== 'up'" points="12 5 19 12 12 19"></polyline>
      </svg>
      <span>{{ trendText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Stat } from '../types'

const props = defineProps<{ stat: Stat }>()

const formattedValue = computed(() => {
  if (typeof props.stat.value === 'number') {
    return props.stat.value.toLocaleString()
  }
  return props.stat.value
})

const iconVariant = computed(() => {
  const l = props.stat.label.toLowerCase()
  if (l.includes('project')) return 'projects'
  if (l.includes('complete') || l.includes('selesai')) return 'completed'
  if (l.includes('progress') || l.includes('open') || l.includes('todo')) return 'in-progress'
  return 'hours'
})

const trendText = computed(() => {
  const l = props.stat.label.toLowerCase()
  if (l.includes('progress') || l.includes('open')) return 'Consistent workflow'
  if (props.stat.trend === 'up') {
    const d = props.stat.delta.startsWith('+') ? props.stat.delta : `+${props.stat.delta}`
    return `${d} from last month`
  }
  return `${props.stat.delta} from last month`
})
</script>

<style scoped>
.stat-card {
  background: rgba(17, 24, 39, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-card);
  padding: 20px 22px;
  backdrop-filter: var(--glass-blur);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.5);
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.stat-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-svg {
  width: 18px;
  height: 18px;
}

.stat-icon-wrapper.projects {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.stat-icon-wrapper.completed {
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
}

.stat-icon-wrapper.in-progress {
  background: rgba(244, 114, 182, 0.15);
  color: #f472b6;
}

.stat-icon-wrapper.hours {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.stat-value {
  margin: 12px 0 10px;
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #ffffff;
  line-height: 1.1;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #38bdf8;
}

.stat-trend.down {
  color: #94a3b8;
}

.trend-arrow {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  flex-shrink: 0;
}
</style>