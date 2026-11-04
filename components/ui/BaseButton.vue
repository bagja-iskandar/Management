<template>
  <component
    :is="componentTag"
    :to="to"
    :href="href"
    :target="isExternalLink ? (target || '_blank') : undefined"
    :rel="isExternalLink ? (rel || 'noopener noreferrer') : undefined"
    :type="!to && !href ? (type || 'button') : undefined"
    :disabled="isDisabled"
    :aria-disabled="isDisabled ? 'true' : undefined"
    :class="computedClasses"
    v-bind="$attrs"
  >
    <!-- Loading spinner -->
    <NexuraIcon
      v-if="loading"
      name="Loader2"
      class="animate-spin shrink-0"
      :size="iconSize"
    />

    <!-- Left icon -->
    <NexuraIcon
      v-else-if="icon"
      :name="icon"
      class="shrink-0"
      :size="iconSize"
    />

    <!-- Button label / default slot -->
    <slot />

    <!-- Right icon -->
    <NexuraIcon
      v-if="iconRight && !loading"
      :name="iconRight"
      class="shrink-0"
      :size="iconSize"
    />
  </component>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import NexuraIcon, { type IconSize } from './NexuraIcon.vue'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface BaseButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  to?: string | object
  href?: string
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  icon?: string | Component | object
  iconRight?: string | Component | object
  class?: string
}

const props = withDefaults(defineProps<BaseButtonProps>(), {
  variant: 'secondary',
  size: 'md',
  to: undefined,
  href: undefined,
  target: undefined,
  rel: undefined,
  type: 'button',
  disabled: false,
  loading: false,
  icon: undefined,
  iconRight: undefined,
  class: ''
})

const isExternalLink = computed(() => Boolean(props.href))
const isNuxtLink = computed(() => Boolean(props.to))
const isDisabled = computed(() => props.disabled || props.loading)

const componentTag = computed(() => {
  if (isNuxtLink.value) return resolveComponent('NuxtLink')
  if (isExternalLink.value) return 'a'
  return 'button'
})

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#F3F4F6] hover:bg-white text-[#07080A] font-sans font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.9)]',
  accent:
    'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/20 font-sans font-medium shadow-[0_1px_12px_rgba(99,102,241,0.25)]',
  secondary:
    'bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F4F6] border border-white/[0.08] hover:border-white/[0.15] font-sans font-medium',
  ghost:
    'bg-transparent hover:bg-white/[0.05] text-[#8A8F9E] hover:text-[#F3F4F6] font-sans font-medium',
  danger:
    'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 font-sans font-medium'
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  md: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
  lg: 'px-4 py-2 text-xs rounded-xl gap-2',
  icon: 'w-8 h-8 rounded-lg flex items-center justify-center p-0'
}

const iconSize = computed<IconSize>(() => {
  if (props.size === 'sm') return 'xs'
  if (props.size === 'lg') return 'md'
  return 'sm'
})

const computedClasses = computed(() => {
  return [
    'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
    isDisabled.value ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'active:scale-[0.98]',
    variantClasses[props.variant] || variantClasses.secondary,
    sizeClasses[props.size] || sizeClasses.md,
    props.class
  ]
})
</script>
