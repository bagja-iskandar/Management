<template>
  <div class="obs-card rounded-xl p-5 sm:p-6 space-y-4 border border-white/[0.07] shadow-sm">
    <!-- Matrix Header Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
      <div class="flex items-center gap-3">
        <h2 class="text-base font-semibold text-[#F3F4F6] font-sans">
          Deliverables Matrix
        </h2>
        <span class="font-mono tabular-nums text-xs px-2.5 py-0.5 rounded-full bg-white/[0.05] text-[#8A8F9E] border border-white/[0.08]">
          {{ totalTargetsCount }} Targets
        </span>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <!-- Filter Tabs -->
        <div class="inline-flex items-center bg-[#07080A] border border-white/[0.08] rounded-lg p-0.5 text-xs font-mono tabular-nums">
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            :class="filter === 'all' ? 'bg-white/[0.1] text-[#F3F4F6] font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6]'"
            @click="$emit('update:filter', 'all')"
          >
            All ({{ totalTargetsCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            :class="filter === 'running' ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6]'"
            @click="$emit('update:filter', 'running')"
          >
            In-Flight ({{ inFlightCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            :class="filter === 'queue' ? 'bg-amber-500/15 text-amber-300 font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6]'"
            @click="$emit('update:filter', 'queue')"
          >
            Pending ({{ pendingCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            :class="filter === 'deployed' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6]'"
            @click="$emit('update:filter', 'deployed')"
          >
            Deployed ({{ completedCount }})
          </button>
        </div>

        <!-- Deliverables Search Input -->
        <div class="relative w-44 sm:w-60">
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#565B68]">
            <NexuraIcon name="Search" size="xs" />
          </div>
          <input
            :value="searchQuery"
            type="text"
            placeholder="Search deliverables..."
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition font-sans"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-[#565B68] hover:text-[#F3F4F6] cursor-pointer"
            @click="$emit('update:searchQuery', '')"
          >
            <NexuraIcon name="X" size="xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Temporal-Aware Empty State: No deliverables committed to this week -->
    <div
      v-if="totalTargetsCount === 0"
      class="py-14 px-6 text-center rounded-xl bg-[#07080A]/60 border border-dashed border-white/[0.08] space-y-4"
    >
      <!-- Past Week (< 0) -->
      <template v-if="(weekOffset ?? 0) < 0">
        <div class="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-[#8A8F9E] flex items-center justify-center mx-auto">
          <NexuraIcon name="History" size="md" class="text-[#8A8F9E]" />
        </div>
        <div class="space-y-1">
          <h3 class="font-sans text-base font-semibold text-[#F3F4F6]">
            Sprint Cycle Concluded
          </h3>
          <p class="font-sans text-xs text-[#8A8F9E] max-w-md mx-auto">
            This historical sprint cycle has concluded with no recorded deliverables committed.
          </p>
        </div>
        <div class="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            class="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
            @click="$emit('return-current-week')"
          >
            <NexuraIcon name="ArrowLeft" size="xs" />
            <span>Return to Current Week</span>
          </button>
        </div>
      </template>

      <!-- Current Week (=== 0) -->
      <template v-else-if="(weekOffset ?? 0) === 0">
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(99,102,241,0.15)]">
          <NexuraIcon name="Target" size="md" class="text-indigo-400" />
        </div>
        <div class="space-y-1">
          <h3 class="font-sans text-base font-semibold text-[#F3F4F6]">
            No deliverables committed to this week
          </h3>
          <p class="font-sans text-xs text-[#8A8F9E] max-w-md mx-auto">
            Focus your execution cycle by pulling active tasks from your project backlog or creating a new tactical target.
          </p>
        </div>
        <div class="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <button
            type="button"
            class="px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F4F6] font-sans text-xs border border-white/[0.08] transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            @click="$emit('open-modal', 'backlog')"
          >
            <NexuraIcon name="Plus" size="xs" />
            <span>Add Existing Task from Backlog</span>
          </button>
          <button
            type="button"
            class="px-3.5 py-2 rounded-lg bg-[#F3F4F6] hover:bg-white text-[#07080A] font-sans text-xs font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            @click="$emit('open-modal', 'create')"
          >
            <NexuraIcon name="Zap" size="xs" />
            <span>Create Tactical Target</span>
          </button>
        </div>
      </template>

      <!-- Future Week (> 0) -->
      <template v-else>
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(99,102,241,0.15)]">
          <NexuraIcon name="Calendar" size="md" class="text-indigo-400" />
        </div>
        <div class="space-y-1">
          <h3 class="font-sans text-base font-semibold text-[#F3F4F6]">
            Upcoming Cycle — Open for Planning
          </h3>
          <p class="font-sans text-xs text-[#8A8F9E] max-w-md mx-auto">
            Prepare for this future sprint by reserving backlog items or scoping tactical deliverables in advance.
          </p>
        </div>
        <div class="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <button
            type="button"
            class="px-3.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F4F6] font-sans text-xs border border-white/[0.08] transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            @click="$emit('open-modal', 'backlog')"
          >
            <NexuraIcon name="Plus" size="xs" />
            <span>Plan from Backlog</span>
          </button>
          <button
            type="button"
            class="px-3.5 py-2 rounded-lg bg-[#F3F4F6] hover:bg-white text-[#07080A] font-sans text-xs font-medium transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            @click="$emit('open-modal', 'create')"
          >
            <NexuraIcon name="Zap" size="xs" />
            <span>Create Target</span>
          </button>
        </div>
      </template>
    </div>

    <!-- Filtered Empty State -->
    <div
      v-else-if="deliverables.length === 0"
      class="py-10 text-center font-sans text-xs text-[#8A8F9E] space-y-2"
    >
      <p>No deliverables match the active filter or search query.</p>
      <button
        type="button"
        class="text-indigo-400 hover:text-indigo-300 underline font-sans text-xs cursor-pointer"
        @click="$emit('reset-filters')"
      >
        Reset filters
      </button>
    </div>

    <!-- Deliverables List Cards -->
    <div v-else class="space-y-3">
      <div
        v-for="task in deliverables"
        :key="task.id"
        class="p-4 rounded-xl transition-all duration-200 border bg-[#111318]"
        :class="[
          task.status === 'deployed'
            ? 'border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40'
            : task.status === 'running_sprint'
            ? 'border-indigo-500/30 bg-indigo-500/[0.03] hover:border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.08)]'
            : task.status === 'blocked'
            ? 'border-rose-500/30 bg-rose-500/[0.02] hover:border-rose-500/50'
            : 'border-white/[0.07] hover:border-white/[0.14]'
        ]"
      >
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Left Information Column -->
          <div class="space-y-2 min-w-0 flex-1">
            <!-- Meta Row -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Priority Glowing Dot -->
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :class="getPriorityDotClass(task.priority)"
              ></span>

              <!-- Task ID -->
              <span class="font-mono tabular-nums text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                #{{ task.taskId || 'ENG-000' }}
              </span>

              <!-- Project Slug Badge -->
              <span class="font-mono text-xs bg-white/[0.04] text-[#8A8F9E] px-2 py-0.5 rounded border border-white/[0.06] flex items-center gap-1">
                <NexuraIcon name="Folder" size="xs" class="text-[#8A8F9E]" />
                <span>{{ task.projectSlug || 'management' }}</span>
              </span>

              <!-- Priority Badge -->
              <span
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium"
                :class="getPriorityBadgeClass(task.priority)"
              >
                <span>{{ task.priority }}</span>
              </span>

              <!-- Status Badge -->
              <span
                v-if="task.status === 'deployed'"
                class="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                <NexuraIcon name="CheckCircle2" size="xs" />
                <span>Deployed</span>
              </span>
              <span
                v-else-if="task.status === 'running_sprint'"
                class="inline-flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>In-Flight</span>
              </span>
              <span
                v-else-if="task.status === 'blocked'"
                class="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30"
              >
                <NexuraIcon name="AlertTriangle" size="xs" />
                <span>Blocked</span>
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-[#8A8F9E] border border-white/[0.06]"
              >
                <NexuraIcon name="Clock" size="xs" />
                <span>In Queue</span>
              </span>
            </div>

            <!-- Title -->
            <div>
              <h3
                class="font-sans text-sm sm:text-base font-medium transition-all"
                :class="task.status === 'deployed' ? 'line-through text-[#565B68]' : 'text-[#F3F4F6]'"
              >
                {{ task.name }}
              </h3>
            </div>

            <!-- Tech tags & due date -->
            <div class="flex items-center gap-2 flex-wrap pt-0.5">
              <span
                v-for="tag in task.techTags"
                :key="tag"
                class="font-mono text-xs bg-white/[0.04] text-[#8A8F9E] rounded px-1.5 py-0.5 border border-white/[0.06]"
              >
                {{ tag }}
              </span>
              <span v-if="task.dueDate" class="font-mono tabular-nums text-xs text-[#8A8F9E] flex items-center gap-1 ml-1">
                <NexuraIcon name="Calendar" size="xs" class="text-[#8A8F9E]" />
                <span>Due {{ formatDate(task.dueDate) }}</span>
              </span>
            </div>
          </div>

          <!-- Right Controls: Status Switcher & Remove Button -->
          <div class="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06] justify-between md:justify-end">
            <!-- 3-Button Status Switcher -->
            <div class="inline-flex items-center bg-[#07080A] border border-white/[0.08] rounded-lg p-0.5 gap-0.5 font-sans text-xs">
              <button
                type="button"
                class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                :class="task.status === 'in_queue' ? 'bg-white/[0.12] text-[#F3F4F6] font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6]'"
                title="Mark as In Queue"
                @click="$emit('update-status', task, 'in_queue')"
              >
                Queue
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                :class="task.status === 'running_sprint' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6]'"
                title="Mark as In-Flight"
                @click="$emit('update-status', task, 'running_sprint')"
              >
                In-Flight
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                :class="task.status === 'deployed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6]'"
                title="Mark as Deployed"
                @click="$emit('update-status', task, 'deployed')"
              >
                Deployed
              </button>
            </div>

            <!-- Remove from Week Button -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/10 text-[#8A8F9E] hover:text-rose-400 font-sans text-xs border border-white/[0.06] hover:border-rose-500/20 transition-colors focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              title="Remove from this week's focus (return to general backlog)"
              @click="$emit('remove-task', task)"
            >
              <NexuraIcon name="RotateCw" size="xs" />
              <span class="hidden sm:inline">Remove from Week</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import type { Task, TaskPriority, TaskStatus } from '~/types'

withDefaults(
  defineProps<{
    deliverables: Task[]
    totalTargetsCount: number
    inFlightCount: number
    pendingCount: number
    completedCount: number
    filter: string
    searchQuery: string
    weekOffset?: number
  }>(),
  {
    weekOffset: 0
  }
)

defineEmits<{
  (e: 'update:filter', val: string): void
  (e: 'update:searchQuery', val: string): void
  (e: 'open-modal', tab: 'backlog' | 'create'): void
  (e: 'reset-filters'): void
  (e: 'update-status', task: Task, status: TaskStatus): void
  (e: 'remove-task', task: Task): void
  (e: 'return-current-week'): void
}>()

function getPriorityDotClass(priority?: TaskPriority | string) {
  if (priority === 'critical') return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse'
  if (priority === 'high') return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
  if (priority === 'medium') return 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]'
  return 'bg-[#565B68]'
}

function getPriorityBadgeClass(priority?: TaskPriority | string) {
  if (priority === 'critical') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  if (priority === 'high') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  if (priority === 'medium') return 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
  return 'bg-white/[0.04] text-[#8A8F9E] border border-white/[0.06]'
}

function formatDate(d?: string) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}
</script>
