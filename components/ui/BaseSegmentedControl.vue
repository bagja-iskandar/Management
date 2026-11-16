<template>
  <div
    class="bg-void border border-white/[0.08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)] p-0.5 sm:p-1 rounded-lg sm:rounded-xl gap-1 inline-flex items-center select-none"
    :class="[fullWidth ? 'w-full flex' : '', trackHeightClasses, props.class]"
    role="tablist"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="tab"
      :aria-selected="modelValue === opt.value ? 'true' : 'false'"
      :disabled="disabled || opt.disabled"
      class="inline-flex items-center justify-center font-sans transition-all duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40 disabled:opacity-40 disabled:cursor-not-allowed"
      :class="[
        sizeClasses,
        fullWidth ? 'flex-1' : '',
        modelValue === opt.value
          ? (variant === 'glass'
              ? 'bg-white/[0.08] text-foreground font-medium shadow-sm border border-white/[0.08]'
              : 'bg-surface-elevated text-foreground font-medium border border-white/[0.14] shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]')
          : (variant === 'glass'
              ? 'text-muted hover:text-foreground hover:bg-white/[0.03] border border-transparent'
              : 'text-muted hover:text-foreground hover:bg-white/[0.04] border border-transparent')
      ]"
      @click="onSelect(opt.value)"
    >
      <NexuraIcon
        v-if="opt.icon"
        :name="opt.icon"
        size="xs"
        class="shrink-0"
        :class="modelValue === opt.value ? 'text-accent-light' : 'text-muted'"
      />

      <span class="truncate">{{ opt.label }}</span>

      <span
        v-if="typeof opt.count === 'number'"
        class="font-mono text-xs leading-none px-1.5 py-0.5 rounded-full shrink-0"
        :class="
          modelValue === opt.value
            ? 'bg-white/10 text-foreground'
            : 'bg-white/[0.04] text-muted'
        "
      >
        {{ opt.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import NexuraIcon from './NexuraIcon.vue'

export type SegmentedControlSize = 'xs' | 'sm' | 'md'
export type SegmentedControlVariant = 'default' | 'glass'

export interface SegmentedControlOption {
  value: string | number
  label: string
  count?: number
  icon?: string | Component | object
  disabled?: boolean
}

export interface BaseSegmentedControlProps {
  modelValue?: string | number
  options?: SegmentedControlOption[]
  size?: SegmentedControlSize
  variant?: SegmentedControlVariant
  fullWidth?: boolean
  disabled?: boolean
  class?: string
}

const props = withDefaults(defineProps<BaseSegmentedControlProps>(), {
  modelValue: '',
  options: () => [],
  size: 'sm',
  variant: 'default',
  fullWidth: false,
  disabled: false,
  class: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
}>()

function onSelect(val: string | number) {
  if (props.disabled) return
  emit('update:modelValue', val)
  emit('change', val)
}

const trackHeightClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-8'
    case 'md':
      return 'h-10'
    case 'sm':
    default:
      return 'h-[38px]'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-full px-2.5 py-1 text-xs rounded-md gap-1.5'
    case 'md':
      return 'h-full px-4 py-2 text-xs sm:text-sm rounded-lg gap-2.5 font-medium'
    case 'sm':
    default:
      return 'h-full px-3.5 py-1.5 text-xs rounded-lg gap-2 font-medium'
  }
})
</script>
