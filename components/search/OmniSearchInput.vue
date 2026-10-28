<template>
  <div class="flex flex-col border-b border-white/[0.06] bg-[#0E1015]/90">
    <!-- Main Search Input Bar -->
    <div class="flex items-center px-4 py-3.5 gap-3">
      <!-- Dynamic Leading Icon -->
      <div class="shrink-0 flex items-center justify-center">
        <NexuraIcon
          :name="leadingIcon"
          size="md"
          :class="leadingIconColor"
          class="transition-colors duration-200"
        />
      </div>

      <!-- Scope Pill inside Input (if specific scope or prefix active) -->
      <div
        v-if="activeScope !== 'all' && parsedQuery.prefixMode === 'none'"
        class="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium"
      >
        <span>{{ scopeLabel }}</span>
        <button
          type="button"
          @click="setScope('all')"
          class="hover:text-white transition cursor-pointer"
          aria-label="Clear scope filter"
        >
          <NexuraIcon name="X" size="xs" />
        </button>
      </div>

      <!-- Prefix Mode Pill (>, #, @, !) -->
      <div
        v-else-if="parsedQuery.prefixMode !== 'none'"
        class="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-medium border"
        :class="prefixBadgeClass"
      >
        <span>{{ prefixModeLabel }}</span>
      </div>

      <!-- Search Input -->
      <input
        ref="inputRef"
        v-model="rawQuery"
        type="text"
        :placeholder="inputPlaceholder"
        class="flex-1 min-w-0 bg-transparent text-sm text-[#F3F4F6] placeholder-[#565B68] outline-none font-sans"
        aria-label="Omni-Search & Command Palette"
        spellcheck="false"
        autocomplete="off"
        @keydown.down.prevent="selectNext"
        @keydown.up.prevent="selectPrevious"
        @keydown.tab.prevent.stop="onTabPress"
        @keydown.enter.prevent="onEnterPress"
        @keydown.esc.prevent="onEscPress"
      />

      <!-- Clear Query Button (if typed) -->
      <button
        v-if="rawQuery"
        type="button"
        @click="rawQuery = ''"
        class="text-[#8A8F9E] hover:text-[#F3F4F6] transition p-1 rounded hover:bg-white/[0.05] cursor-pointer"
        aria-label="Clear query"
      >
        <NexuraIcon name="X" size="sm" />
      </button>

      <!-- Results Count Badge -->
      <div class="shrink-0 flex items-center gap-2 select-none">
        <span class="text-[11px] font-mono text-[#8A8F9E] tabular-nums">
          {{ filteredResults.length }} {{ filteredResults.length === 1 ? 'item' : 'items' }}
        </span>

        <!-- Esc Keyboard Badge -->
        <kbd
          class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#8A8F9E] font-mono shadow-sm"
        >
          ESC
        </kbd>
      </div>
    </div>

    <!-- Quick Scope Switcher Pills Row -->
    <div class="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto no-scrollbar select-none">
      <button
        v-for="s in scopes"
        :key="s.value"
        type="button"
        @click="setScope(s.value)"
        class="px-2.5 py-1 rounded-md text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        :class="[
          activeScope === s.value && parsedQuery.prefixMode === 'none'
            ? 'bg-white/[0.12] text-white border border-white/[0.2] shadow-sm font-medium'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
        ]"
      >
        <NexuraIcon :name="s.icon" size="xs" />
        <span>{{ s.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import NexuraIcon from '../ui/NexuraIcon.vue'
import { useOmniSearch, type OmniSearchScope } from '../../composables/useOmniSearch'

const {
  rawQuery,
  parsedQuery,
  activeScope,
  filteredResults,
  setScope,
  cycleScope,
  selectNext,
  selectPrevious,
  executeCurrent,
  executeSecondary,
  closeSearch
} = useOmniSearch()

const inputRef = ref<HTMLInputElement | null>(null)

const scopes: Array<{ value: OmniSearchScope; label: string; icon: string }> = [
  { value: 'all', label: 'All Entities', icon: 'Sparkles' },
  { value: 'task', label: 'Tasks', icon: 'CheckSquare' },
  { value: 'project', label: 'Projects', icon: 'Folder' },
  { value: 'sprint', label: 'Sprints', icon: 'Calendar' },
  { value: 'repo', label: 'Repos', icon: 'GitBranch' },
  { value: 'action', label: 'Actions', icon: 'Zap' }
]

const scopeLabel = computed(() => {
  const match = scopes.find((s) => s.value === activeScope.value)
  return match ? match.label : 'All'
})

const leadingIcon = computed(() => {
  if (parsedQuery.value.prefixMode === 'action') return 'Terminal'
  if (parsedQuery.value.prefixMode === 'tag') return 'Hash'
  if (parsedQuery.value.prefixMode === 'project') return 'Folder'
  if (parsedQuery.value.prefixMode === 'blocker') return 'AlertTriangle'
  if (activeScope.value === 'action') return 'Terminal'
  if (activeScope.value === 'task') return 'CheckSquare'
  if (activeScope.value === 'project') return 'Folder'
  if (activeScope.value === 'sprint') return 'Calendar'
  if (activeScope.value === 'repo') return 'GitBranch'
  return 'Search'
})

const leadingIconColor = computed(() => {
  if (parsedQuery.value.prefixMode === 'action' || activeScope.value === 'action') return 'text-emerald-400'
  if (parsedQuery.value.prefixMode === 'tag') return 'text-indigo-400'
  if (parsedQuery.value.prefixMode === 'project' || activeScope.value === 'project') return 'text-blue-400'
  if (parsedQuery.value.prefixMode === 'blocker') return 'text-rose-400'
  return 'text-[#8A8F9E]'
})

const prefixModeLabel = computed(() => {
  switch (parsedQuery.value.prefixMode) {
    case 'action':
      return '> Actions Mode'
    case 'tag':
      return '# Tag Search'
    case 'project':
      return '@ Project Filter'
    case 'blocker':
      return '! Blockers Only'
    default:
      return ''
  }
})

const prefixBadgeClass = computed(() => {
  switch (parsedQuery.value.prefixMode) {
    case 'action':
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
    case 'tag':
      return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
    case 'project':
      return 'bg-blue-500/15 border-blue-500/30 text-blue-300'
    case 'blocker':
      return 'bg-rose-500/15 border-rose-500/30 text-rose-300'
    default:
      return ''
  }
})

const inputPlaceholder = computed(() => {
  if (parsedQuery.value.prefixMode === 'action') return 'Type an action command (e.g. New Deliverable, Ping Edge)...'
  if (parsedQuery.value.prefixMode === 'tag') return 'Filter deliverables by tag (e.g. vue, supabase, python)...'
  if (parsedQuery.value.prefixMode === 'project') return 'Filter by project name or slug...'
  if (parsedQuery.value.prefixMode === 'blocker') return 'Filter critical and blocked deliverables...'
  return 'Type a command, project, task, or prefix (> # @ !)...'
})

function onTabPress(e: KeyboardEvent) {
  if (e.shiftKey) {
    cycleScope(-1)
  } else {
    cycleScope(1)
  }
}

async function onEnterPress(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey) {
    await executeSecondary()
  } else {
    await executeCurrent()
  }
}

function onEscPress() {
  if (rawQuery.value) {
    rawQuery.value = ''
  } else {
    closeSearch()
  }
}

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
  })
})

defineExpose({
  focusInput: () => inputRef.value?.focus()
})
</script>
