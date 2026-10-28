<template>
  <ActiveFocusPanel v-bind="$attrs" @close="$emit('close')" />
</template>

<script setup lang="ts">
import ActiveFocusPanel from './tasks/ActiveFocusPanel.vue'

defineEmits<{
  (e: 'close'): void
}>()
</script>
