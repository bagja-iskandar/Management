<template>
  <component
    :is="as"
    :class="computedClasses"
    v-bind="$attrs"
  >
    <!-- Card Header -->
    <header
      v-if="$slots.header || title || $slots.actions"
      class="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3"
      :class="padding === 'none' ? 'px-4 pt-4' : ''"
    >
      <slot name="header">
        <div class="space-y-0.5 min-w-0">
          <h3 v-if="title" class="font-sans text-sm font-semibold text-[#F3F4F6] truncate">
            {{ title }}
          </h3>
          <p v-if="subtitle" class="font-sans text-xs text-[#8A8F9E] truncate">
            {{ subtitle }}
          </p>
        </div>
      </slot>

      <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <!-- Card Main Content -->
    <div :class="contentWrapperClass">
      <slot />
    </div>

    <!-- Card Footer -->
    <footer
      v-if="$slots.footer"
      class="border-t border-white/[0.06] pt-3 mt-auto"
      :class="padding === 'none' ? 'px-4 pb-4' : ''"
    >
      <slot name="footer" />
    </footer>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type CardVariant = 'default' | 'interactive' | 'inset'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface BaseCardProps {
  variant?: CardVariant
  padding?: CardPadding
  title?: string
  subtitle?: string
  as?: string
  class?: string
}

const props = withDefaults(defineProps<BaseCardProps>(), {
  variant: 'default',
  padding: 'md',
  title: undefined,
  subtitle: undefined,
  as: 'div',
  class: ''
})

const variantClasses: Record<CardVariant, string> = {
  default: 'obs-card rounded-2xl bg-[#111318] border border-white/[0.07]',
  interactive:
    'obs-card obs-card-interactive rounded-2xl bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] cursor-pointer transition-all',
  inset: 'bg-[#0B0C10] border border-white/[0.06] rounded-xl'
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6'
}

const computedClasses = computed(() => {
  return [
    'flex flex-col relative',
    variantClasses[props.variant] || variantClasses.default,
    paddingClasses[props.padding] || paddingClasses.md,
    props.class
  ]
})

const contentWrapperClass = computed(() => {
  if (props.padding === 'none') return ''
  return 'flex-1 space-y-3'
})
</script>
