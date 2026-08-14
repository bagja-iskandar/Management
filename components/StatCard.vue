<template>
  <div class="stat-card">
    <div class="stat-card-header">
      <span class="stat-icon" aria-hidden="true">{{ icon }}</span>
      <span class="stat-delta" :class="stat.trend">{{ stat.trend === 'up' ? `+${stat.delta}` : `-${stat.delta}` }}</span>
    </div>

    <p class="stat-label">{{ stat.label }}</p>
    <h3>{{ stat.value }}</h3>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Stat } from '../types'

const props = defineProps<{ stat: Stat }>()

const icon = computed(() => {
  const label = props.stat.label.toLowerCase()
  if (label.includes('project')) return '📁'
  if (label.includes('selesai') || label.includes('complete')) return '✅'
  if (label.includes('terbuka') || label.includes('open') || label.includes('pending') || label.includes('todo')) return '📝'
  if (label.includes('pengunjung') || label.includes('visitor')) return '👥'
  return '📊'
})
</script>

<style scoped>
.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(56, 75, 112, 0.12);
  color: var(--primary);
  font-size: 1.2rem;
}

.stat-delta {
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
}

.stat-delta.up {
  background: rgba(31, 109, 59, 0.08);
  color: var(--success);
}

.stat-delta.down {
  background: rgba(184, 0, 31, 0.08);
  color: var(--danger);
}

.stat-card h3 {
  margin: 0.2rem 0 0;
  font-size: 2.2rem;
}

.stat-card p.stat-label {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
  letter-spacing: 0.01em;
}
</style>