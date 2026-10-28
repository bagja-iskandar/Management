<template>
  <div ref="containerRef" class="overflow-y-auto custom-scrollbar p-2 space-y-3 select-none">
    <!-- Empty State -->
    <div
      v-if="filteredResults.length === 0"
      class="py-14 px-6 text-center flex flex-col items-center justify-center space-y-3"
    >
      <div class="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#565B68]">
        <NexuraIcon name="SearchX" size="lg" />
      </div>
      <div>
        <h4 class="text-sm font-medium text-[#F3F4F6] font-sans">No matching results found</h4>
        <p class="text-xs text-[#8A8F9E] mt-1 max-w-xs font-sans">
          No deliverables, projects, or commands match "<span class="text-white font-mono">{{ rawQuery }}</span>".
        </p>
      </div>

      <!-- Quick Syntax Tips -->
      <div class="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono text-[#8A8F9E]">
        <span class="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-emerald-300">> Actions</span>
        <span class="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-indigo-300"># Tech Tags</span>
        <span class="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-blue-300">@ Projects</span>
        <span class="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-rose-300">! Blockers</span>
      </div>
    </div>

    <!-- Grouped Results -->
    <div
      v-for="group in groupedResults"
      :key="group.category"
      class="space-y-1"
    >
      <!-- Group Category Header -->
      <div class="px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase text-[#8A8F9E]/70 font-sans flex items-center justify-between">
        <span>{{ group.category }}</span>
        <span class="text-[10px] font-mono text-[#565B68]">{{ group.items.length }}</span>
      </div>

      <!-- Item Rows -->
      <div class="space-y-0.5">
        <div
          v-for="item in group.items"
          :key="item.id"
          :ref="(el) => setItemRef(el, item.flatIndex)"
          @click="onItemClick(item)"
          @mouseenter="setSelectedIndex(item.flatIndex)"
          class="group px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer text-xs"
          :class="[
            selectedIndex === item.flatIndex
              ? 'bg-white/[0.08] border-l-2 border-indigo-400 text-[#F3F4F6] shadow-sm'
              : 'hover:bg-white/[0.03] border-l-2 border-transparent text-[#8A8F9E]'
          ]"
        >
          <!-- Left: Icon + Title & Subtitle -->
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <!-- Entity Icon Box -->
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
              :class="[
                selectedIndex === item.flatIndex
                  ? 'bg-white/[0.08] text-white shadow-inner'
                  : 'bg-white/[0.03] text-[#8A8F9E]'
              ]"
            >
              <NexuraIcon
                :name="item.icon"
                size="sm"
                :class="item.iconColor || 'text-indigo-400'"
              />
            </div>

            <!-- Title & Subtitle with Highlights -->
            <div class="min-w-0 flex-1">
              <div
                class="font-medium font-sans truncate text-xs"
                :class="selectedIndex === item.flatIndex ? 'text-white' : 'text-[#D1D5DB]'"
              >
                <template v-for="(part, pIdx) in splitHighlights(item.title, item.titleHighlights)" :key="pIdx">
                  <mark
                    v-if="part.isHighlight"
                    class="bg-indigo-500/35 text-indigo-200 px-0.5 rounded font-semibold underline decoration-indigo-400"
                  >{{ part.text }}</mark>
                  <span v-else>{{ part.text }}</span>
                </template>
              </div>

              <!-- Subtitle or ID -->
              <div
                v-if="item.subtitle"
                class="text-[11px] font-mono text-[#8A8F9E] truncate mt-0.5"
              >
                <template v-for="(part, pIdx) in splitHighlights(item.subtitle, item.subtitleHighlights)" :key="pIdx">
                  <mark
                    v-if="part.isHighlight"
                    class="bg-indigo-500/25 text-indigo-200 px-0.5 rounded underline decoration-indigo-400"
                  >{{ part.text }}</mark>
                  <span v-else>{{ part.text }}</span>
                </template>
              </div>
            </div>
          </div>

          <!-- Right: Badges / Tags / Shortcut -->
          <div class="shrink-0 flex items-center gap-2">
            <!-- Badge / Code (e.g. DEL-01, W42, P0) -->
            <span
              v-if="item.badge"
              class="px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums uppercase transition-colors"
              :class="item.badgeColor || 'bg-white/[0.05] text-[#8A8F9E] border border-white/[0.08]'"
            >
              {{ item.badge }}
            </span>

            <!-- Shortcut Hint (e.g. 'C') -->
            <kbd
              v-if="item.shortcutHint"
              class="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#8A8F9E] font-mono"
            >
              {{ item.shortcutHint }}
            </kbd>

            <!-- Arrow Right on Focus -->
            <NexuraIcon
              name="ChevronRight"
              size="xs"
              class="text-indigo-400 transition-opacity"
              :class="selectedIndex === item.flatIndex ? 'opacity-100' : 'opacity-0'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import NexuraIcon from '../ui/NexuraIcon.vue'
import {
  useOmniSearch,
  splitHighlights,
  type OmniSearchItem
} from '../../composables/useOmniSearch'

const {
  rawQuery,
  filteredResults,
  selectedIndex,
  setSelectedIndex,
  executeCurrent
} = useOmniSearch()

const containerRef = ref<HTMLElement | null>(null)
const itemElements = new Map<number, HTMLElement>()

function setItemRef(el: any, flatIndex: number) {
  if (el) {
    itemElements.set(flatIndex, el as HTMLElement)
  } else {
    itemElements.delete(flatIndex)
  }
}

interface IndexedOmniItem extends OmniSearchItem {
  flatIndex: number
}

interface ItemGroup {
  category: string
  items: IndexedOmniItem[]
}

// Group filtered items while retaining flat traversal indices
const groupedResults = computed<ItemGroup[]>(() => {
  const groups: ItemGroup[] = []
  const categoryOrder = [
    'Actions',
    'Tasks & Deliverables',
    'Projects',
    'Weekly Sprints',
    'Repositories',
    'Quick Navigation'
  ]

  const map = new Map<string, IndexedOmniItem[]>()

  filteredResults.value.forEach((item, flatIndex) => {
    const cat = item.categoryLabel || 'Other'
    if (!map.has(cat)) {
      map.set(cat, [])
    }
    map.get(cat)!.push({ ...item, flatIndex })
  })

  // Add recognized categories in prioritized order
  for (const cat of categoryOrder) {
    if (map.has(cat)) {
      groups.push({
        category: cat,
        items: map.get(cat)!
      })
      map.delete(cat)
    }
  }

  // Add any remaining groups
  for (const [cat, items] of map.entries()) {
    groups.push({ category: cat, items })
  }

  return groups
})

async function onItemClick(item: IndexedOmniItem) {
  setSelectedIndex(item.flatIndex)
  await executeCurrent()
}

// Auto-scroll the active item into view
watch(
  selectedIndex,
  (newIdx) => {
    nextTick(() => {
      const el = itemElements.get(newIdx)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  },
  { flush: 'post' }
)
</script>
