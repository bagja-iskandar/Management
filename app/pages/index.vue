<template>
  <Dashboard />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useHeaderActions } from '~/composables/useHeaderActions'
import { useQuickTask } from '~/composables/useQuickTask'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'

const { setActions, clearActions } = useHeaderActions()
const { openAddTask } = useQuickTask()
const workspaceStore = useWorkspaceStore()

onMounted(() => {
  setActions([
    {
      id: 'refresh',
      label: 'Refresh',
      icon: 'RotateCw',
      variant: 'secondary',
      handler: () => workspaceStore.refreshWorkspace()
    },
    {
      id: 'quick-task',
      label: 'Quick Task',
      icon: 'Plus',
      variant: 'primary',
      shortcut: 'Ctrl+N',
      handler: () => openAddTask()
    }
  ])
})

onBeforeUnmount(() => {
  clearActions()
})
</script>
