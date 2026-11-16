<template>
  <section class="obs-card rounded-2xl p-4 space-y-2.5 border border-white/[0.06] bg-surface flex flex-col flex-1 min-h-0 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
      <div class="flex items-center gap-2">
        <NexuraIcon name="CheckCircle2" size="sm" class="text-emerald-400 shrink-0" />
        <h2 class="text-sm font-semibold text-foreground">Shipped Deliverables</h2>
      </div>
      <span class="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        {{ deployedTasks.length }} Shipped Wins
      </span>
    </div>

    <!-- Shipments List (3-5 items) -->
    <div
      v-if="displayShipments.length > 0"
      class="flex-1 min-h-0 max-h-[260px] overflow-y-auto custom-scrollbar space-y-2.5 pr-0.5"
      tabindex="0"
      role="region"
      aria-label="Recent shipments"
    >
      <div
        v-for="task in displayShipments"
        :key="task.id"
        class="p-2.5 rounded-lg bg-canvas/80 hover:bg-surface-hover hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition cursor-pointer group"
        @click="$emit('task-click', task)"
      >
        <!-- Top row: ID + Verified Live badge + Release date -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-muted">
              {{ task.taskId || `#${task.id.slice(0, 7)}` }}
            </span>
            <span class="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
              <NexuraIcon name="Check" size="xs" />
              Verified Live
            </span>
          </div>
          <span class="font-mono text-xs text-muted">
            {{ formatRelativeTime(task.updatedAt || task.createdAt) }}
          </span>
        </div>

        <!-- Title -->
        <h3 class="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-white transition mt-1.5">
          {{ task.name }}
        </h3>

        <!-- Tech tags -->
        <div v-if="getTechTags(task).length > 0" class="flex items-center gap-1.5 mt-2 flex-wrap">
          <span
            v-for="tag in getTechTags(task)"
            :key="tag"
            class="font-mono text-xs text-muted bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty fallback -->
    <div
      v-else
      class="p-4 bg-canvas/60 border border-white/[0.06] rounded-lg text-center font-mono space-y-1 flex-1 flex flex-col justify-center"
    >
      <div class="text-xs text-muted">No deliverables marked as deployed yet.</div>
      <p class="text-xs text-zinc-500">Move tasks to DONE in Kanban to showcase wins here.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    tasks?: Task[]
  }>(),
  {
    tasks: () => []
  }
)

defineEmits<{
  (e: 'task-click', task: Task): void
}>()

const allTasks = computed(() => {
  return props.tasks || []
})

// Deployed tasks (sorted by latest updatedAt or date descending)
const deployedTasks = computed(() => {
  return allTasks.value
    .filter((t) => t.status === 'deployed')
    .sort((a, b) => {
      const timeA = a.updatedAt || a.date || ''
      const timeB = b.updatedAt || b.date || ''
      return timeB.localeCompare(timeA)
    })
})

// Display deployed items (only real deployed tasks)
const displayShipments = computed(() => {
  return deployedTasks.value.slice(0, 4)
})

function getTechTags(task: Task): string[] {
  if (task.techTags && task.techTags.length > 0) {
    return task.techTags.slice(0, 3)
  }
  return []
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return 'Today'
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (hours < 12) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return 'Recent'
}
</script>
