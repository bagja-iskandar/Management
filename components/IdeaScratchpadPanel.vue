<template>
  <IdeaScratchpadPanel v-bind="$attrs" @close="$emit('close')" @promoted="(t: any) => $emit('promoted', t)" />
</template>

<script setup lang="ts">
import IdeaScratchpadPanel from './notes/IdeaScratchpadPanel.vue'
import type { Task } from '~/types'

defineEmits<{
  (e: 'close'): void
  (e: 'promoted', task: Task): void
}>()
</script>
