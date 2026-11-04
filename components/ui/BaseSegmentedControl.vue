<template>
  <div
    class="bg-[#0B0C10] border border-white/[0.06] p-0.5 rounded-lg inline-flex items-center gap-0.5 select-none"
    role="tablist"
    :class="props.class"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="tab"
      :aria-selected="modelValue === opt.value ? 'true' : 'false'"
      :disabled="opt.disabled"
      class="inline-flex items-center gap-1.5 rounded-md text-xs font-sans transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
      :class="[
        sizeClasses,
        modelValue === opt.value
          ? 'bg-white/[0.08] text-[#F3F4F6] font-medium shadow-sm border border-white/[0.08]'
          : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border border-transparent'
      ]"
      @click="onSelect(opt.value)"
    >
      <NexuraIcon
        v-if="opt.icon"
        :name="opt.icon"
        size="xs"
        :class="modelValue === opt.value ? 'text-indigo-400' : 'text-[#8A8F9E]'"
      />

      <span>{{ opt.label }}</span>

      <span
        v-if="typeof opt.count === 'number'"
        class="font-mono text-[10px] px-1.5 py-0.2 rounded-full"
        :class="
          modelValue === opt.value
            ? 'bg-white/10 text-[#F3F4F6]'
            : 'bg-white/[0.04] text-[#8A8F9E]'
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

export type SegmentedControlSize = 'sm' | 'md'

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
  class?: string
}

const props = withDefaults(defineProps<BaseSegmentedControlProps>(), {
  modelValue: '',
  options: () => [],
  size: 'sm',
  class: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
}>()

function onSelect(val: string | number) {
  emit('update:modelValue', val)
  emit('change', val)
}

const sizeClasses = computed(() => {
  if (props.size === 'md') {
    return 'px-3 py-1.5'
  }
  return 'px-2.5 py-1'
})
</script>
