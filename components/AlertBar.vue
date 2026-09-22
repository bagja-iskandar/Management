<template>
  <aside
    v-if="hasAlerts"
    class="bg-red-500/10 border-l-4 border-red-500 rounded-xl p-3 sm:px-4 text-xs font-mono text-red-400 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-red-950/20"
    role="alert"
    aria-label="Critical Tasks & Deadlines Alert"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 flex-1 min-w-0">
      <!-- 1. Blocked Tasks Section -->
      <div v-if="blockedTasks.length > 0" class="flex items-center gap-1.5 flex-wrap">
        <span class="font-bold text-red-300">
          ⚠ {{ blockedTasks.length }} BLOCKED:
        </span>
        <template v-for="(task, idx) in blockedTasks" :key="task.id">
          <NuxtLink
            v-if="task.projectSlug"
            :to="`/projects/${task.projectSlug}`"
            class="underline underline-offset-2 hover:text-red-200 transition-colors"
            :title="`Open ${task.projectSlug} project`"
          >
            #{{ displayTaskId(task) }} {{ task.name }}
          </NuxtLink>
          <button
            v-else
            type="button"
            class="underline underline-offset-2 hover:text-red-200 text-left transition-colors"
            @click="$emit('task-click', task)"
          >
            #{{ displayTaskId(task) }} {{ task.name }}
          </button>
          <span v-if="idx < blockedTasks.length - 1" class="text-red-500/60 select-none">·</span>
        </template>
      </div>

      <!-- Separator if both exist -->
      <span v-if="blockedTasks.length > 0 && urgentTasks.length > 0" class="hidden sm:inline text-red-500/40 select-none">|</span>

      <!-- 2. Overdue or Due Tomorrow Tasks -->
      <div v-if="urgentTasks.length > 0" class="flex items-center gap-1.5 flex-wrap">
        <span class="font-bold text-orange-300">📅 DEADLINES:</span>
        <template v-for="(item, idx) in urgentTasks" :key="item.task.id">
          <NuxtLink
            v-if="item.task.projectSlug"
            :to="`/projects/${item.task.projectSlug}`"
            class="underline underline-offset-2 hover:text-orange-200 transition-colors"
            :title="`Open ${item.task.projectSlug} project`"
          >
            #{{ displayTaskId(item.task) }} {{ item.label }}
          </NuxtLink>
          <button
            v-else
            type="button"
            class="underline underline-offset-2 hover:text-orange-200 text-left transition-colors"
            @click="$emit('task-click', item.task)"
          >
            #{{ displayTaskId(item.task) }} {{ item.label }}
          </button>
          <span v-if="idx < urgentTasks.length - 1" class="text-red-500/60 select-none">·</span>
        </template>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../types'

const props = withDefaults(
  defineProps<{
    blockedTasks?: Task[]
    urgentTasks?: { task: Task; label: string }[]
  }>(),
  {
    blockedTasks: () => [],
    urgentTasks: () => []
  }
)

defineEmits<{
  (e: 'task-click', task: Task): void
}>()

const hasAlerts = computed(() => {
  return props.blockedTasks.length > 0 || props.urgentTasks.length > 0
})

function displayTaskId(task: Task) {
  if (task.taskId) {
    return task.taskId.startsWith('#') ? task.taskId.slice(1) : task.taskId
  }
  return task.id.slice(0, 7).toUpperCase()
}
</script>
