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
    'bg-foreground hover:bg-white text-void font-sans font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.9)]',
  accent:
    'bg-accent hover:bg-accent-light text-void font-sans font-semibold border border-accent-light/30 shadow-glow-accent',
  secondary:
    'bg-white/[0.04] hover:bg-white/[0.08] text-foreground border border-white/[0.08] hover:border-white/[0.15] font-sans font-medium',
  ghost:
    'bg-transparent hover:bg-white/[0.05] text-muted hover:text-foreground font-sans font-medium',
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
    'inline-flex items-center justify-center transition-all duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] select-none cursor-pointer motion-reduce:transition-none motion-reduce:transform-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
    isDisabled.value ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'active:scale-[0.97]',
    variantClasses[props.variant] || variantClasses.secondary,
    sizeClasses[props.size] || sizeClasses.md,
    props.class
  ]
})
</script>
