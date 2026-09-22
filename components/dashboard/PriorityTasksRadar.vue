<template>
  <section class="bg-[#111114] border border-white/[0.07] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-xl h-full flex flex-col">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/[0.07] pb-2.5">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <h2 class="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
            <span>CRITICAL & ERROR RADAR</span>
            <span
              v-if="radarTasks.length > 0"
              class="px-1.5 py-0.2 font-mono text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 rounded font-semibold"
            >
              {{ radarTasks.length }} ALERTS
            </span>
          </h2>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="flex items-center gap-1 bg-[#18181C] p-0.5 rounded border border-white/[0.07] text-[10px] font-mono self-start sm:self-auto overflow-x-auto">
        <button
          type="button"
          class="px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer"
          :class="activeTab === 'all' ? 'bg-zinc-800 text-zinc-200 font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'"
          @click="activeTab = 'all'"
        >
          All ({{ allCount }})
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer"
          :class="activeTab === 'critical' ? 'bg-zinc-800 text-zinc-200 font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'"
          @click="activeTab = 'critical'"
        >
          Critical ({{ criticalCount }})
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer"
          :class="activeTab === 'blocked' ? 'bg-zinc-800 text-zinc-200 font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'"
          @click="activeTab = 'blocked'"
        >
          Error ({{ blockedCount }})
        </button>
        <button
          type="button"
          class="px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer"
          :class="activeTab === 'high' ? 'bg-zinc-800 text-zinc-200 font-semibold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'"
          @click="activeTab = 'high'"
        >
          High ({{ highCount }})
        </button>
      </div>
    </div>

    <!-- Radar Task Cards List (Capped at 6 items) -->
    <div v-if="filteredTasks.length > 0" class="space-y-2 flex-1">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="bg-[#18181C] hover:bg-zinc-900 rounded-lg p-2.5 transition group border"
        :class="getCardBorderClass(task)"
      >
        <div class="flex items-start justify-between gap-2.5">
          <div class="space-y-1 flex-1 min-w-0">
            <!-- Badges Row -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <!-- Pill 1: Critical -->
              <span
                v-if="task.priority === 'critical'"
                class="font-mono text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                CRITICAL ⚡
              </span>

              <!-- Pill 2: Error / Blocked -->
              <span
                v-else-if="task.status === 'blocked'"
                class="font-mono text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30"
              >
                BLOCKED ⛔
              </span>

              <!-- Pill 3: High Priority -->
              <span
                v-else
                class="font-mono text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#C98A4B]/20 text-[#C98A4B] border border-[#C98A4B]/30"
              >
                HIGH ⚡
              </span>

              <!-- Task ID -->
              <span class="font-mono text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-white/[0.07]">
                #{{ task.taskId || task.id.slice(0, 7) }}
              </span>

              <!-- Project Slug Badge -->
              <span class="text-[10px] font-mono text-[#C98A4B] bg-[#C98A4B]/10 px-1.5 py-0.2 rounded border border-[#C98A4B]/20">
                {{ formatProjectLabel(task.projectSlug) }}
              </span>

              <!-- Due Date if any -->
              <span
                v-if="task.dueDate"
                class="text-[10px] text-zinc-500 font-mono ml-auto sm:ml-0"
              >
                Due: {{ task.dueDate }}
              </span>
            </div>

            <!-- Task Name / Title -->
            <h3
              class="text-xs font-semibold text-zinc-100 transition line-clamp-1"
              :class="getTitleHoverClass(task)"
            >
              {{ task.name }}
            </h3>

            <!-- Description (single line compact) -->
            <p
              v-if="task.description"
              class="text-[11px] text-zinc-400 line-clamp-1"
            >
              {{ task.description }}
            </p>
          </div>

          <!-- Action Button -->
          <button
            type="button"
            class="px-2 py-1 rounded text-[10px] font-mono font-medium transition shrink-0 cursor-pointer"
            :class="getButtonClass(task)"
            @click="$emit('task-click', task)"
          >
            {{ getButtonLabel(task) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State: Compact 1-line strip -->
    <div
      v-else
      class="p-2.5 bg-[#18181C]/40 border border-white/[0.06] rounded-lg flex items-center justify-between font-mono text-xs flex-1 items-center"
    >
      <div class="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        RADAR CLEAR
      </div>
      <span class="text-[11px] text-zinc-500">
        No {{ activeTab === 'all' ? 'critical or error' : activeTab }} tasks requiring intervention.
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task } from '~/types'

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

const activeTab = ref<'all' | 'critical' | 'blocked' | 'high'>('all')

const sourceTasks = computed(() => {
  return props.tasks || []
})

// Filter radar tasks: priority is critical or high, or status is blocked
const radarTasks = computed(() => {
  return sourceTasks.value.filter(
    (t) => (t.priority === 'critical' || t.priority === 'high' || t.status === 'blocked') && t.status !== 'deployed'
  )
})

const criticalCount = computed(() => {
  return radarTasks.value.filter((t) => t.priority === 'critical').length
})

const blockedCount = computed(() => {
  return radarTasks.value.filter((t) => t.status === 'blocked').length
})

const highCount = computed(() => {
  return radarTasks.value.filter((t) => t.priority === 'high' && t.status !== 'blocked').length
})

const allCount = computed(() => radarTasks.value.length)

const filteredTasks = computed(() => {
  let list = radarTasks.value
  if (activeTab.value === 'critical') {
    list = radarTasks.value.filter((t) => t.priority === 'critical')
  } else if (activeTab.value === 'blocked') {
    list = radarTasks.value.filter((t) => t.status === 'blocked')
  } else if (activeTab.value === 'high') {
    list = radarTasks.value.filter((t) => t.priority === 'high' && t.status !== 'blocked')
  }
  // Cap at maximum 6 items per user request
  return list.slice(0, 6)
})

function formatProjectLabel(slug?: string): string {
  if (!slug) return 'Management'
  return slug
}

function getCardBorderClass(task: Task): string {
  if (task.priority === 'critical') {
    return 'border-red-500/40 hover:border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.06)]'
  }
  if (task.status === 'blocked') {
    return 'border-amber-500/40 hover:border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.06)]'
  }
  return 'border-white/[0.07] hover:border-[#C98A4B]/40'
}

function getTitleHoverClass(task: Task): string {
  if (task.priority === 'critical') {
    return 'group-hover:text-red-300'
  }
  if (task.status === 'blocked') {
    return 'group-hover:text-amber-300'
  }
  return 'group-hover:text-[#C98A4B]'
}

function getButtonClass(task: Task): string {
  if (task.priority === 'critical') {
    return 'bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/40'
  }
  if (task.status === 'blocked') {
    return 'bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-white border border-amber-500/40'
  }
  return 'bg-[#111114] hover:bg-zinc-800 text-zinc-200 border border-white/[0.07]'
}

function getButtonLabel(task: Task): string {
  if (task.priority === 'critical' || task.status === 'blocked') {
    return 'Inspect →'
  }
  return 'Kanban →'
}
</script>
