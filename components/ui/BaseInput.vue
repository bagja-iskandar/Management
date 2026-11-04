<template>
  <div class="flex flex-col space-y-1.5 w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
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

    <!-- Input Container -->
    <div class="relative flex items-center w-full">
      <!-- Prefix Slot or Left Icon -->
      <div
        v-if="$slots.prefix || icon"
        class="absolute left-3 flex items-center pointer-events-none text-[#8A8F9E]"
        aria-hidden="true"
      >
        <slot name="prefix">
          <NexuraIcon v-if="icon" :name="icon" size="sm" />
        </slot>
      </div>

      <!-- Textarea Mode -->
      <textarea
        v-if="isTextarea"
        :id="inputId"
        :value="modelValue"
        :rows="rows || 3"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        @input="onInput"
        @keydown="$emit('keydown', $event)"
        v-bind="$attrs"
      />

      <!-- Standard Input Mode -->
      <input
        v-else
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        @input="onInput"
        @keydown="$emit('keydown', $event)"
        v-bind="$attrs"
      />

      <!-- Suffix Slot or Clear Button -->
      <div
        v-if="$slots.suffix || (clearable && Boolean(modelValue))"
        class="absolute right-3 flex items-center gap-1.5 text-[#8A8F9E]"
      >
        <button
          v-if="clearable && Boolean(modelValue) && !disabled"
          type="button"
          class="hover:text-[#F3F4F6] p-0.5 rounded transition-colors cursor-pointer"
          aria-label="Clear input"
          @click="onClear"
        >
          <NexuraIcon name="X" size="xs" />
        </button>

        <slot name="suffix" />
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
import { computed, type Component } from 'vue'
import NexuraIcon from './NexuraIcon.vue'

export interface BaseInputProps {
  modelValue?: string | number
  type?: string
  rows?: number
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  icon?: string | Component | object
  id?: string
  class?: string
}

const props = withDefaults(defineProps<BaseInputProps>(), {
  modelValue: '',
  type: 'text',
  rows: undefined,
  label: undefined,
  placeholder: '',
  error: undefined,
  hint: undefined,
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  icon: undefined,
  id: undefined,
  class: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
  (e: 'keydown', event: KeyboardEvent): void
}>()

const inputId = computed(() => props.id || `input-${Math.random().toString(36).substring(2, 9)}`)
const isTextarea = computed(() => props.type === 'textarea' || typeof props.rows === 'number')

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function onClear() {
  emit('update:modelValue', '')
  emit('clear')
}

const inputClasses = computed(() => {
  const hasPrefix = Boolean(props.icon)
  const hasSuffix = Boolean(props.clearable)

  return [
    'w-full bg-[#0B0C10] rounded-xl text-xs font-sans text-[#F3F4F6] placeholder:text-[#565B68] transition-all',
    'focus:outline-none focus:ring-1',
    props.error
      ? 'border border-rose-500/40 text-rose-300 focus:border-rose-500/60 focus:ring-rose-500/30'
      : 'border border-white/[0.08] focus:border-indigo-500/50 focus:ring-indigo-500/50',
    props.disabled ? 'opacity-50 cursor-not-allowed' : '',
    hasPrefix ? 'pl-9' : 'pl-3.5',
    hasSuffix ? 'pr-9' : 'pr-3.5',
    isTextarea.value ? 'py-2.5 resize-y' : 'py-2',
    props.class
  ]
})
</script>
