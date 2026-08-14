<template>
  <form class="task-form" @submit.prevent="onSubmit">
    <input
      :value="value"
      @input="onInput"
      type="text"
      placeholder="Add a new task..."
      aria-label="New task name"
    />
    <button type="submit" class="button" :disabled="disabled || !value.trim()">Add Task</button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ disabled?: boolean; modelValue?: string }>()
const emits = defineEmits<{ (e: 'create', name: string): void; (e: 'update:modelValue', v: string): void }>()

const value = ref(props.modelValue ?? '')

watch(() => props.modelValue, (v) => { if (v !== undefined) value.value = v })

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  value.value = v
  emits('update:modelValue', v)
}

function onSubmit() {
  const name = value.value.trim()
  if (!name) return
  emits('create', name)
  // clear both local and inform parent
  value.value = ''
  emits('update:modelValue', '')
}
</script>

<style scoped>
/* Reuse existing .task-form styles */
</style>