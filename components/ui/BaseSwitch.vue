<template>
  <div
    class="inline-flex items-center gap-2.5 select-none"
    :class="[disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer', props.class]"
    @click="toggle"
  >
    <!-- Switch Track Button -->
    <button
      :id="switchId"
      type="button"
      role="switch"
      :aria-checked="modelValue ? 'true' : 'false'"
      :disabled="disabled"
      class="rounded-full p-0.5 transition-all select-none relative inline-flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
      :class="[
        trackSizeClasses,
        modelValue
          ? 'bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,0.35)] border border-indigo-400/30'
          : 'bg-white/[0.1] border border-white/[0.08]',
        disabled ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      ]"
      @keydown.prevent.space="toggle"
      @keydown.prevent.enter="toggle"
      v-bind="$attrs"
    >
      <!-- Switch Thumb -->
      <span
        class="rounded-full bg-white shadow-sm transform transition-transform pointer-events-none inline-block duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none"
        :class="[
          thumbSizeClasses,
          modelValue ? thumbTranslateClasses : 'translate-x-0'
        ]"
      />
    </button>

    <!-- Optional Label & Hint -->
    <div v-if="label || hint || $slots.default" class="flex flex-col space-y-0.5">
      <label
        v-if="label || $slots.default"
        :for="switchId"
        class="font-sans text-xs font-medium text-[#F3F4F6] pointer-events-none"
      >
        <slot>{{ label }}</slot>
      </label>
      <span v-if="hint" class="font-sans text-[11px] text-[#8A8F9E] pointer-events-none">
        {{ hint }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type SwitchSize = 'sm' | 'md'

export interface BaseSwitchProps {
  modelValue?: boolean
  disabled?: boolean
  label?: string
  hint?: string
  size?: SwitchSize
  id?: string
  class?: string
}

const props = withDefaults(defineProps<BaseSwitchProps>(), {
  modelValue: false,
  disabled: false,
  label: undefined,
  hint: undefined,
  size: 'md',
  id: undefined,
  class: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const switchId = computed(() => props.id || `switch-${Math.random().toString(36).substring(2, 9)}`)

function toggle() {
  if (props.disabled) return
  const nextValue = !props.modelValue
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}

const trackSizeClasses = computed(() => {
  if (props.size === 'sm') {
    return 'w-8 h-4.5'
  }
  return 'w-10 h-5.5'
})

const thumbSizeClasses = computed(() => {
  if (props.size === 'sm') {
    return 'w-3.5 h-3.5'
  }
  return 'w-4.5 h-4.5'
})

const thumbTranslateClasses = computed(() => {
  if (props.size === 'sm') {
    return 'translate-x-3.5'
  }
  return 'translate-x-4.5'
})
</script>
