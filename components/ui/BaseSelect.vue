<template>
  <div class="flex flex-col space-y-1.5 w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="selectId"
      class="font-sans text-xs font-medium text-[#8A8F9E] flex items-center justify-between"
    >
      <span>
        {{ label }}
        <span v-if="required" class="text-rose-400 ml-0.5">*</span>
      </span>
      <span v-if="hint && !error" class="text-[11px] font-mono text-[#565B68]">
        {{ hint }}
      </span>
    </label>

    <!-- Select Container -->
    <div class="relative flex items-center w-full">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :class="selectClasses"
        @change="onChange"
        v-bind="$attrs"
      >
        <option
          v-if="placeholder"
          value=""
          disabled
          class="bg-[#111318] text-[#565B68] py-1.5"
        >
          {{ placeholder }}
        </option>

        <option
          v-for="opt in normalizedOptions"
          :key="String(opt.value)"
          :value="opt.value"
          :disabled="opt.disabled"
          class="bg-[#111318] text-[#F3F4F6] py-1.5"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Custom Chevron Down Icon -->
      <div
        class="absolute right-3 pointer-events-none text-[#8A8F9E] flex items-center"
        aria-hidden="true"
      >
        <NexuraIcon name="ChevronDown" size="sm" />
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="font-sans text-xs text-rose-400 flex items-center gap-1 mt-0.5">
      <NexuraIcon name="AlertCircle" size="xs" class="shrink-0" />
      <span>{{ error }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NexuraIcon from './NexuraIcon.vue'

export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectOptionObject {
  value: string | number
  label: string
  disabled?: boolean
}

export type SelectOption = string | SelectOptionObject

export interface BaseSelectProps {
  modelValue?: string | number
  options?: SelectOption[]
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  size?: SelectSize
  id?: string
  class?: string
}

const props = withDefaults(defineProps<BaseSelectProps>(), {
  modelValue: '',
  options: () => [],
  label: undefined,
  placeholder: undefined,
  error: undefined,
  hint: undefined,
  disabled: false,
  required: false,
  size: 'md',
  id: undefined,
  class: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
}>()

const selectId = computed(() => props.id || `select-${Math.random().toString(36).substring(2, 9)}`)

const normalizedOptions = computed<SelectOptionObject[]>(() => {
  return (props.options || []).map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) }
    }
    return opt
  })
})

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change', target.value)
}

const sizeClasses: Record<SelectSize, string> = {
  sm: 'py-1 pl-2.5 pr-8 text-xs rounded-lg',
  md: 'py-2 pl-3.5 pr-9 text-xs rounded-xl',
  lg: 'py-2.5 pl-4 pr-10 text-xs rounded-xl'
}

const selectClasses = computed(() => {
  return [
    'w-full bg-[#0B0C10] appearance-none font-sans text-[#F3F4F6] cursor-pointer transition-all',
    'focus:outline-none focus:ring-1',
    props.error
      ? 'border border-rose-500/40 text-rose-300 focus:border-rose-500/60 focus:ring-rose-500/30'
      : 'border border-white/[0.08] focus:border-indigo-500/50 focus:ring-indigo-500/50',
    props.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    sizeClasses[props.size] || sizeClasses.md,
    props.class
  ]
})
</script>
