<template>
  <IdeaScratchpadPanel v-bind="$attrs" @promoted="(t) => $emit('promoted', t)" @close="$emit('close')" />
</template>

<script setup lang="ts">
import IdeaScratchpadPanel from '../notes/IdeaScratchpadPanel.vue'
import type { Task } from '~/types'

defineEmits<{
  (e: 'close'): void
  (e: 'promoted', task: Task): void
}>()
</script>
