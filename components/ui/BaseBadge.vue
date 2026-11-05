<template>
  <span :class="computedBadgeClasses" v-bind="$attrs">
    <!-- Optional Status/Priority Dot -->
    <span
      v-if="dot"
      class="w-1.5 h-1.5 rounded-full shrink-0 motion-reduce:animate-none"
      :class="isPulseStatus ? 'animate-pulse' : ''"
      :style="dotStyle"
      aria-hidden="true"
    />

    <!-- Prefix slot / icon -->
    <slot name="prefix" />

    <!-- Badge Text -->
    <slot>
      <span>{{ displayLabel }}</span>
    </slot>

    <!-- Suffix slot -->
    <slot name="suffix" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  getStatusLabel,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  getPriorityColor
} from '~/utils/badges'
import type { TaskStatus, TaskPriority } from '~/types/task'

export type BadgeVariant = 'status' | 'priority' | 'tech' | 'phase' | 'custom'

export interface BaseBadgeProps {
  variant?: BadgeVariant
  value?: TaskStatus | TaskPriority | string
  label?: string
  dot?: boolean
  class?: string
}

const props = withDefaults(defineProps<BaseBadgeProps>(), {
  variant: 'custom',
  value: '',
  label: undefined,
  dot: false,
  class: ''
})

const displayLabel = computed(() => {
  if (props.label !== undefined) return props.label
  if (props.variant === 'status') {
    return getStatusLabel(props.value as TaskStatus)
  }
  if (props.variant === 'priority') {
    const raw = String(props.value || '')
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : ''
  }
  if (props.variant === 'tech') {
    const raw = String(props.value || '')
    return raw.startsWith('#') ? raw : `#${raw}`
  }
  return String(props.value || '')
})

const dotStyle = computed(() => {
  if (props.variant === 'priority') {
    return { backgroundColor: getPriorityColor(props.value as TaskPriority) }
  }
  return { backgroundColor: 'currentColor' }
})

const isPulseStatus = computed(() => {
  if (props.variant !== 'status') return false
  return props.value === 'running_sprint'
})

const computedBadgeClasses = computed(() => {
  const base =
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border select-none transition-colors'

  if (props.variant === 'status') {
    return [base, getStatusBadgeClass(props.value as TaskStatus), props.class]
  }

  if (props.variant === 'priority') {
    return [base, getPriorityBadgeClass(props.value as TaskPriority), props.class]
  }

  if (props.variant === 'tech') {
    return [
      base,
      'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08] font-mono hover:text-[#F3F4F6] hover:border-white/[0.15]',
      props.class
    ]
  }

  if (props.variant === 'phase') {
    return [
      base,
      'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 font-mono font-normal',
      props.class
    ]
  }

  return [base, 'bg-white/5 text-[#8A8F9E] border-white/10', props.class]
})
</script>
