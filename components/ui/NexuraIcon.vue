<script setup lang="ts">
import { computed, type Component } from 'vue'
import * as lucideIcons from 'lucide-vue-next'

export type IconSizePreset = 'xs' | 'sm' | 'md' | 'lg'
export type IconSize = IconSizePreset | number | string

export interface NexuraIconProps {
  name?: string | Component | object
  size?: IconSize
  strokeWidth?: number | string
  class?: string
}

const props = withDefaults(defineProps<NexuraIconProps>(), {
  name: '',
  size: 'sm',
  strokeWidth: 1.75,
  class: ''
})

// Module-level cached lookup map for normalized Lucide icon names
let cachedRegistry: Map<string, Component> | null = null
function getIconRegistry(): Map<string, Component> {
  if (cachedRegistry) return cachedRegistry
  cachedRegistry = new Map<string, Component>()
  for (const [key, iconComp] of Object.entries(lucideIcons)) {
    if (typeof iconComp === 'function' || typeof iconComp === 'object') {
      const lowerKey = key.toLowerCase()
      cachedRegistry.set(lowerKey, iconComp as Component)
      if (lowerKey.endsWith('icon')) {
        cachedRegistry.set(lowerKey.slice(0, -4), iconComp as Component)
      }
    }
  }
  return cachedRegistry
}

// Map named presets to px dimensions
const SIZE_MAP: Record<IconSizePreset, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20
}

const resolvedSize = computed<number>(() => {
  if (typeof props.size === 'number') {
    return props.size
  }
  if (typeof props.size === 'string') {
    if (props.size in SIZE_MAP) {
      return SIZE_MAP[props.size as IconSizePreset]
    }
    const parsed = Number.parseFloat(props.size)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return SIZE_MAP.sm
})

const numericStrokeWidth = computed<number>(() => {
  if (typeof props.strokeWidth === 'number') {
    return props.strokeWidth
  }
  const parsed = Number.parseFloat(props.strokeWidth)
  return Number.isNaN(parsed) ? 1.75 : parsed
})

const resolvedIcon = computed<Component | null>(() => {
  if (!props.name) return null

  // If passed directly as a Vue component / object
  if (typeof props.name === 'object' || typeof props.name === 'function') {
    return props.name as Component
  }

  const rawName = String(props.name).trim()
  if (!rawName) return null

  // Direct match in exports (e.g. 'Plus', 'Folder')
  const direct = (lucideIcons as Record<string, any>)[rawName]
  if (direct && (typeof direct === 'function' || typeof direct === 'object')) {
    return direct
  }

  // Normalized alphanumeric match (strips dashes, underscores, spaces)
  const registry = getIconRegistry()
  const normalized = rawName.replace(/[-_ ]/g, '').toLowerCase()
  const fromMap = registry.get(normalized) || registry.get(`${normalized}icon`)
  if (fromMap) {
    return fromMap
  }

  // Fallback warn in dev
  if (import.meta.dev) {
    console.warn(`[NexuraIcon] Icon "${props.name}" not found in lucide-vue-next.`)
  }

  return null
})
</script>

<template>
  <component
    :is="resolvedIcon"
    v-if="resolvedIcon"
    :size="resolvedSize"
    :stroke-width="numericStrokeWidth"
    :class="['inline-block shrink-0 align-middle', props.class]"
    aria-hidden="true"
  />
  <span
    v-else
    :style="{ width: `${resolvedSize}px`, height: `${resolvedSize}px` }"
    :class="['inline-block shrink-0 rounded-sm bg-white/10 align-middle', props.class]"
    aria-hidden="true"
  >
    <slot name="fallback" />
  </span>
</template>
