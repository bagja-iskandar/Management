<template>
  <div class="p-3.5 sm:p-4 rounded-2xl bg-[#111114] border border-white/[0.06] shadow-lg">
    <div class="flex items-center justify-between gap-3 overflow-x-auto pb-0.5 custom-scrollbar flex-nowrap">
      <!-- Left: Search, Priority Filter Pills, & Active Filter Indicator -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- Search Input -->
        <div class="relative w-44 sm:w-56 shrink-0">
          <svg class="w-3.5 h-3.5 text-[#756F68] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            :value="searchQuery"
            type="search"
            placeholder="Search tasks..."
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-xl pl-8 pr-7 py-1.5 text-xs font-mono text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none transition-all"
            aria-label="Filter tasks in Kanban board"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-[#756F68] hover:text-[#F5F2EB] text-xs font-mono p-0.5"
            title="Clear search"
            @click="$emit('update:searchQuery', '')"
          >
            ✕
          </button>
        </div>

        <!-- Priority Filter Pills -->
        <div class="flex items-center gap-1 p-1 rounded-xl bg-[#09090B] border border-white/[0.06] shrink-0" role="tablist" aria-label="Priority filter">
          <button
            v-for="p in priorityOptions"
            :key="p.value"
            type="button"
            class="px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 focus:outline-none shrink-0 cursor-pointer"
            :class="selectedPriority === p.value
              ? 'bg-[#C98A4B]/15 text-[#C98A4B] font-bold border border-[#C98A4B]/30'
              : 'text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5 border border-transparent'"
            @click="$emit('update:selectedPriority', selectedPriority === p.value && p.value !== 'all' ? 'all' : p.value)"
          >
            <span v-if="p.dot" class="w-1.5 h-1.5 rounded-full" :class="p.dot"></span>
            <span>{{ p.label }}</span>
            <span class="text-[10px] opacity-70 px-1 py-0.2 rounded-full bg-white/5">
              {{ p.count }}
            </span>
          </button>
        </div>

        <!-- Filter indicator if active -->
        <div
          v-if="hasActiveFilters"
          class="flex items-center gap-1.5 text-[#C98A4B] bg-[#C98A4B]/10 px-2.5 py-1 rounded-xl border border-[#C98A4B]/20 text-[11px] font-mono shrink-0"
        >
          <span>Filtered: {{ filteredCount }} shown</span>
          <button
            type="button"
            class="hover:underline ml-1 text-[10px] font-bold text-[#F5F2EB] cursor-pointer"
            title="Clear all filters"
            @click="$emit('reset-filters')"
          >
            ✕ Clear
          </button>
        </div>
      </div>

      <!-- Right: Tag Filter, Sort, & Primary Add Task -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- Tech Tag Filter Dropdown -->
        <div v-if="availableTags.length" class="relative shrink-0">
          <select
            :value="selectedTag"
            class="bg-[#09090B] border border-white/[0.08] text-[#F5F2EB] text-xs font-mono rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
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
            class="bg-[#09090B] border border-white/[0.08] text-[#F5F2EB] text-xs font-mono rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
            aria-label="Sort board tasks"
            @change="$emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
          >
            <option value="default">Sort: Priority (Highest First)</option>
            <option value="priority">Sort: Priority</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>

        <!-- Primary Add Task Button -->
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-xl bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(201,138,75,0.25)] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none shrink-0 cursor-pointer"
          @click="$emit('add-task', 'in_queue')"
        >
          <span>⊕</span>
          <span>New Task</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskStatus } from '~/types'

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
