<template>
  <div class="p-3 sm:p-4 rounded-2xl bg-[#111318] border border-white/[0.07] shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
      <!-- Left: Search, Priority Filter Pills, & Active Filter Indicator -->
      <div class="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap min-w-0">
        <!-- Search Input -->
        <div class="relative w-36 sm:w-44 lg:w-48 shrink-0">
          <NexuraIcon
            name="Search"
            size="xs"
            class="text-[#8A8F9E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            :value="searchQuery"
            type="search"
            placeholder="Search tasks..."
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-xl pl-8 pr-7 py-1.5 text-xs font-mono text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            aria-label="Filter tasks in Kanban board"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8F9E] hover:text-[#F3F4F6] p-0.5 transition-colors"
            title="Clear search"
            @click="$emit('update:searchQuery', '')"
          >
            <NexuraIcon name="X" size="xs" />
          </button>
        </div>

        <!-- Priority Filter Pills -->
        <div class="flex items-center gap-1 p-1 rounded-xl bg-[#07080A] border border-white/[0.06] overflow-x-auto no-scrollbar shrink-0 max-w-full" role="tablist" aria-label="Priority filter">
          <button
            v-for="p in priorityOptions"
            :key="p.value"
            type="button"
            class="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 focus:outline-none shrink-0 cursor-pointer"
            :class="selectedPriority === p.value
              ? 'bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/30 shadow-sm'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/5 border border-transparent'"
            @click="$emit('update:selectedPriority', selectedPriority === p.value && p.value !== 'all' ? 'all' : p.value)"
          >
            <span v-if="p.dot" class="w-1.5 h-1.5 rounded-full" :class="p.dot"></span>
            <span>{{ p.label }}</span>
            <span class="text-[10px] tabular-nums opacity-80 px-1 py-0.2 rounded-full bg-white/5 font-mono">
              {{ p.count }}
            </span>
          </button>
        </div>

        <!-- Filter indicator if active -->
        <div
          v-if="hasActiveFilters"
          class="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20 text-[11px] font-mono shrink-0"
        >
          <span>Filtered: <span class="tabular-nums font-semibold">{{ filteredCount }}</span> shown</span>
          <button
            type="button"
            class="hover:underline ml-1 text-[10px] font-semibold text-[#F3F4F6] cursor-pointer inline-flex items-center gap-0.5"
            title="Clear all filters"
            @click="$emit('reset-filters')"
          >
            <NexuraIcon name="X" size="xs" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <!-- Right: Tag Filter, Sort, & Primary Add Task -->
      <div class="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto sm:ml-0">
        <!-- Tech Tag Filter Dropdown -->
        <div v-if="availableTags.length" class="relative shrink-0">
          <select
            :value="selectedTag"
            class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] text-xs font-mono rounded-xl px-2.5 py-1.5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
            aria-label="Filter by Tech Tag"
            @change="$emit('update:selectedTag', ($event.target as HTMLSelectElement).value)"
          >
            <option value="all">Tags: All ({{ totalTasksCount }})</option>
            <option v-for="tag in availableTags" :key="tag" :value="tag">
              #{{ tag }}
            </option>
          </select>
        </div>

        <!-- Sort Dropdown -->
        <div class="relative shrink-0">
          <select
            :value="sortBy"
            class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] text-xs font-mono rounded-xl px-2.5 py-1.5 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
            aria-label="Sort board tasks"
            @change="$emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
          >
            <option value="default">Sort: Priority</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>

        <!-- Primary Add Task Button -->
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition-all flex items-center gap-1.5 shadow-[0_0_16px_rgba(99,102,241,0.25)] focus:ring-1 focus:ring-indigo-500/50 focus:outline-none shrink-0 cursor-pointer active:scale-95"
          @click="$emit('add-task', 'in_queue')"
        >
          <NexuraIcon name="Plus" size="xs" :stroke-width="2.2" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskStatus } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

defineProps<{
  searchQuery: string
  selectedPriority: string
  selectedTag: string
  sortBy: string
  priorityOptions: Array<{ value: string; label: string; count: number; dot?: string }>
  availableTags: string[]
  totalTasksCount: number
  filteredCount: number
  hasActiveFilters: boolean
}>()

defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedPriority', val: string): void
  (e: 'update:selectedTag', val: string): void
  (e: 'update:sortBy', val: string): void
  (e: 'reset-filters'): void
  (e: 'add-task', status: TaskStatus): void
}>()
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}
</style>
