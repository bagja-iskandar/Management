<template>
  <!-- Skeleton Mode -->
  <div
    v-if="variant === 'skeleton'"
    class="obs-card rounded-2xl p-6 border border-white/[0.07] bg-white/[0.02] animate-pulse space-y-4 w-full"
    :class="props.class"
    aria-hidden="true"
  >
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-white/[0.06]" />
      <div class="space-y-1.5 flex-1">
        <div class="h-3.5 bg-white/[0.06] rounded w-1/3" />
        <div class="h-2.5 bg-white/[0.04] rounded w-1/4" />
      </div>
    </div>
    <div class="space-y-2 pt-2">
      <div class="h-3 bg-white/[0.04] rounded w-full" />
      <div class="h-3 bg-white/[0.04] rounded w-4/5" />
      <div class="h-3 bg-white/[0.04] rounded w-2/3" />
    </div>
  </div>

  <!-- Error Mode -->
  <div
    v-else-if="variant === 'error'"
    class="obs-card rounded-2xl p-8 border border-rose-500/30 bg-rose-500/[0.03] text-center flex flex-col items-center justify-center space-y-3 w-full"
    :class="props.class"
    role="alert"
  >
    <div
      class="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.15)]"
      aria-hidden="true"
    >
      <NexuraIcon :name="icon || 'AlertTriangle'" size="md" />
    </div>

    <div class="space-y-1 max-w-sm">
      <h4 class="font-sans text-sm font-semibold text-rose-300">
        {{ title || 'Encountered an Error' }}
      </h4>
      <p v-if="description" class="font-sans text-xs text-rose-400/80 leading-relaxed">
        {{ description }}
      </p>
    </div>

    <slot />

    <div v-if="$slots.actions" class="pt-2 flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>

  <!-- Standard Empty Mode -->
  <div
    v-else
    class="obs-card rounded-2xl p-8 border border-white/[0.07] bg-[#111318] text-center flex flex-col items-center justify-center space-y-3 w-full"
    :class="props.class"
  >
    <div
      v-if="icon !== false"
      class="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#8A8F9E] shadow-sm"
      aria-hidden="true"
    >
      <NexuraIcon
        :name="icon || 'Inbox'"
        size="md"
        :class="iconColor || 'text-[#8A8F9E]'"
      />
    </div>

    <div class="space-y-1 max-w-sm">
      <h4 v-if="title" class="font-sans text-sm font-semibold text-[#F3F4F6]">
        {{ title }}
      </h4>
      <p v-if="description" class="font-sans text-xs text-[#8A8F9E] leading-relaxed">
        {{ description }}
      </p>
    </div>

    <slot />

    <div v-if="$slots.actions" class="pt-2 flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Component } from 'vue'
import NexuraIcon from './NexuraIcon.vue'

export type EmptyStateVariant = 'empty' | 'error' | 'skeleton'

export interface BaseEmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  icon?: string | Component | object | false
  iconColor?: string
  class?: string
}

const props = withDefaults(defineProps<BaseEmptyStateProps>(), {
  variant: 'empty',
  title: undefined,
  description: undefined,
  icon: undefined,
  iconColor: undefined,
  class: ''
})
</script>
