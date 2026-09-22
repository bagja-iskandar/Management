<template>
  <div class="rounded-xl bg-[#111114] border border-white/[0.06] p-5 sm:p-6 space-y-5 shadow-xl shadow-black/30">
    <!-- Matrix Header Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
      <div class="flex items-center gap-3">
        <h2 class="font-mono text-base font-semibold text-[#F5F2EB]">Weekly Deliverables</h2>
        <span class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/20">
          {{ totalTargetsCount }} Targets
        </span>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <!-- Filter Tabs -->
        <div class="inline-flex items-center bg-[#09090B] border border-white/[0.06] rounded-lg p-1 text-xs font-mono">
          <button
            type="button"
            class="px-2.5 py-1 rounded transition-colors cursor-pointer"
            :class="filter === 'all' ? 'bg-[#C98A4B]/15 text-[#C98A4B] font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB]'"
            @click="$emit('update:filter', 'all')"
          >
            All ({{ totalTargetsCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded transition-colors cursor-pointer"
            :class="filter === 'running' ? 'bg-blue-500/15 text-blue-400 font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB]'"
            @click="$emit('update:filter', 'running')"
          >
            Running ({{ inFlightCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded transition-colors cursor-pointer"
            :class="filter === 'queue' ? 'bg-white/10 text-[#F5F2EB] font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB]'"
            @click="$emit('update:filter', 'queue')"
          >
            In Queue ({{ pendingCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded transition-colors cursor-pointer"
            :class="filter === 'deployed' ? 'bg-green-500/15 text-green-400 font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB]'"
            @click="$emit('update:filter', 'deployed')"
          >
            Deployed ({{ completedCount }})
          </button>
        </div>

        <!-- Deliverables Search Input -->
        <div class="relative w-44 sm:w-56">
          <input
            :value="searchQuery"
            type="text"
            placeholder="Search deliverables..."
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono text-[#756F68] hover:text-[#F5F2EB] cursor-pointer"
            @click="$emit('update:searchQuery', '')"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State: No deliverables committed to this week -->
    <div
      v-if="totalTargetsCount === 0"
      class="py-14 px-6 text-center rounded-xl bg-[#09090B]/60 border border-dashed border-white/[0.1] space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-[#C98A4B]/10 border border-[#C98A4B]/20 text-[#C98A4B] flex items-center justify-center mx-auto text-xl font-mono shadow-[0_0_15px_rgba(201,138,75,0.15)]">
        🎯
      </div>
      <div class="space-y-1">
        <h3 class="font-mono text-base font-semibold text-[#F5F2EB]">No deliverables committed to this week</h3>
        <p class="font-sans text-xs text-[#756F68] max-w-md mx-auto">
          Focus your execution cycle by pulling active tasks from your project backlog or creating a new tactical target.
        </p>
      </div>
      <div class="flex items-center justify-center gap-3 pt-2 flex-wrap">
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-mono text-xs border border-white/[0.08] transition-colors flex items-center gap-2 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          @click="$emit('open-modal', 'backlog')"
        >
          <span>⊕</span>
          <span>Add Existing Task to This Week</span>
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-lg bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-semibold transition-colors flex items-center gap-2 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          @click="$emit('open-modal', 'create')"
        >
          <span>⚡</span>
          <span>Create New Deliverable</span>
        </button>
      </div>
    </div>

    <!-- Filtered Empty State -->
    <div
      v-else-if="deliverables.length === 0"
      class="py-10 text-center font-mono text-xs text-[#756F68] space-y-2"
    >
      <p>No deliverables match the active filter or search query.</p>
      <button
        type="button"
        class="text-[#C98A4B] underline hover:no-underline cursor-pointer"
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
        class="p-4 rounded-xl transition-all duration-200 border"
        :class="[
          task.status === 'deployed'
            ? 'bg-[#111114]/60 border-green-500/20 hover:border-green-500/40'
            : task.status === 'running_sprint'
            ? 'bg-[#111114] border-blue-500/30 hover:border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
            : 'bg-[#111114] border-white/[0.06] hover:border-[#C98A4B]/40 hover:shadow-glow-ochre'
        ]"
      >
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Left Information Column -->
          <div class="space-y-2 min-w-0 flex-1">
            <!-- Meta Row -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs font-semibold text-[#C98A4B] bg-[#C98A4B]/10 px-2 py-0.5 rounded border border-[#C98A4B]/20">
                #{{ task.taskId || 'ENG-000' }}
              </span>

              <span class="font-mono text-xs bg-white/5 text-[#F5F2EB] px-2 py-0.5 rounded border border-white/[0.06]">
                📁 {{ task.projectSlug || 'management' }}
              </span>

              <span
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium"
                :class="getPriorityBadgeClass(task.priority)"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full bg-current"
                  :class="{ 'animate-ping': task.priority === 'critical' }"
                ></span>
                <span>{{ task.priority }}</span>
              </span>

              <span
                v-if="task.status === 'deployed'"
                class="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30"
              >
                <span>✓</span>
                <span>Deployed</span>
              </span>
              <span
                v-else-if="task.status === 'running_sprint'"
                class="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>Running</span>
              </span>
              <span
                v-else-if="task.status === 'blocked'"
                class="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30"
              >
                <span>⚠️</span>
                <span>Blocked</span>
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-[#756F68] border border-white/[0.08]"
              >
                <span>○</span>
                <span>In Queue</span>
              </span>
            </div>

            <!-- Title -->
            <div>
              <h3
                class="font-sans text-sm sm:text-base font-medium transition-all"
                :class="task.status === 'deployed' ? 'line-through text-[#756F68]' : 'text-[#F5F2EB]'"
              >
                {{ task.name }}
              </h3>
            </div>

            <!-- Tech tags & due date -->
            <div class="flex items-center gap-2 flex-wrap pt-0.5">
              <span
                v-for="tag in task.techTags"
                :key="tag"
                class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] rounded px-1.5 py-0.5 border border-[#C98A4B]/15"
              >
                {{ tag }}
              </span>
              <span v-if="task.dueDate" class="font-mono text-[10px] text-[#756F68] flex items-center gap-1 ml-1">
                <span>📅</span>
                <span>Due {{ formatDate(task.dueDate) }}</span>
              </span>
            </div>
          </div>

          <!-- Right Controls: Status Switcher & Remove Button -->
          <div class="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04] justify-between md:justify-end">
            <!-- 3-Button Status Switcher -->
            <div class="inline-flex items-center bg-[#09090B] border border-white/[0.08] rounded-lg p-0.5 gap-0.5 font-mono text-xs">
              <button
                type="button"
                class="px-2 py-1 rounded transition-colors text-[11px] cursor-pointer"
                :class="task.status === 'in_queue' ? 'bg-white/15 text-[#F5F2EB] font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB]'"
                title="Mark as In Queue"
                @click="$emit('update-status', task, 'in_queue')"
              >
                Queue
              </button>
              <button
                type="button"
                class="px-2 py-1 rounded transition-colors text-[11px] cursor-pointer"
                :class="task.status === 'running_sprint' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB]'"
                title="Mark as Running"
                @click="$emit('update-status', task, 'running_sprint')"
              >
                Running
              </button>
              <button
                type="button"
                class="px-2 py-1 rounded transition-colors text-[11px] cursor-pointer"
                :class="task.status === 'deployed' ? 'bg-green-500/20 text-green-400 border border-green-500/40 font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB]'"
                title="Mark as Deployed"
                @click="$emit('update-status', task, 'deployed')"
              >
                Deployed
              </button>
            </div>

            <!-- Remove from Week Button -->
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-[#756F68] hover:text-red-400 font-mono text-xs border border-white/[0.06] hover:border-red-500/30 transition-colors focus:ring-1 focus:ring-red-500 focus:outline-none cursor-pointer"
              title="Remove from this week's focus (return to general backlog)"
              @click="$emit('remove-task', task)"
            >
              <span>↩</span>
              <span class="hidden sm:inline">Remove from Week</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskPriority, TaskStatus } from '~/types'

defineProps<{
  deliverables: Task[]
  totalTargetsCount: number
  inFlightCount: number
  pendingCount: number
  completedCount: number
  filter: string
  searchQuery: string
}>()

defineEmits<{
  (e: 'update:filter', val: string): void
  (e: 'update:searchQuery', val: string): void
  (e: 'open-modal', tab: 'backlog' | 'create'): void
  (e: 'reset-filters'): void
  (e: 'update-status', task: Task, status: TaskStatus): void
  (e: 'remove-task', task: Task): void
}>()

function getPriorityBadgeClass(priority?: TaskPriority | string) {
  if (priority === 'critical') return 'bg-red-500/10 text-red-400 border border-red-500/20'
  if (priority === 'high') return 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
  if (priority === 'medium') return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
  return 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
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
