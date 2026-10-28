<template>
  <div class="relative w-full">
    <!-- THE SINGLE MAIN SEARCH INPUT (Directly in HeaderBar) -->
    <div
      class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150 select-none group"
      :class="[
        isOpen
          ? 'bg-[#0B0C10] border border-white/[0.2] ring-1 ring-indigo-500/40 shadow-inner'
          : 'bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.2] shadow-inner cursor-pointer'
      ]"
      role="search"
      @click="onInputContainerClick"
    >
      <!-- Dynamic Leading Icon -->
      <NexuraIcon
        :name="isOpen ? leadingIcon : 'Search'"
        size="sm"
        :class="isOpen ? leadingIconColor : 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'"
        class="shrink-0 transition-colors"
      />

      <!-- Dynamic Inline Prefix Chip (when prefix detected and search is open) -->
      <span
        v-if="isOpen && prefixChip"
        class="px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 select-none animate-fadeIn"
        :class="prefixChip.class"
      >
        {{ prefixChip.label }}
      </span>

      <!-- The Real Single Native Input Field -->
      <input
        ref="inputRef"
        v-model="rawQuery"
        type="text"
        role="combobox"
        :aria-expanded="isOpen"
        aria-controls="omni-search-results-listbox"
        aria-autocomplete="list"
        :aria-activedescendant="isOpen && activeVisualItem ? 'omni-item-' + activeVisualItem.id : undefined"
        :placeholder="isOpen ? 'Search deliverables, projects... (or > @ # !)' : 'Search deliverables, projects... (Ctrl+K or /)'"
        class="w-full bg-transparent text-xs text-[#F3F4F6] placeholder-[#565B68] outline-none font-sans min-w-0"
        spellcheck="false"
        autocomplete="off"
        @focus="onInputFocus"
        @keydown="onInputKeydown"
      />

      <!-- Clear Query Button (X) (when query exists and search is open) -->
      <button
        v-if="isOpen && rawQuery"
        type="button"
        class="text-[#8A8F9E] hover:text-[#F3F4F6] transition p-0.5 rounded hover:bg-white/[0.08] cursor-pointer shrink-0"
        aria-label="Clear query"
        @mousedown.prevent
        @click.stop="clearQuery"
      >
        <NexuraIcon name="X" size="xs" />
      </button>

      <!-- ESC Badge when open -->
      <kbd
        v-if="isOpen"
        class="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.12] text-white/70 font-mono text-[10px] cursor-pointer hover:text-white shrink-0 select-none"
        title="Press Esc to clear or close"
        @mousedown.prevent
        @click.stop="handleEscAction"
      >
        ESC
      </kbd>

      <!-- Cmd+K badge when closed -->
      <kbd
        v-else
        class="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[#8A8F9E] font-mono text-[10px] pointer-events-none select-none shrink-0"
      >
        <NexuraIcon name="Command" size="xs" class="text-[#8A8F9E]" />
        <span class="font-semibold text-white/90">K</span>
      </kbd>
    </div>

    <!-- ANCHORED POP-UP RESULTS (In-Place Child, 100% Flush Width: left-0 right-0 w-full top-full mt-2) -->
    <Transition name="dropdown-slide">
      <div
        v-if="isOpen"
        ref="popupRef"
        class="absolute top-full mt-2 left-0 right-0 w-full z-50 bg-[#0B0C10] border border-white/[0.08] rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col max-h-[min(65vh,480px)] select-none"
        role="dialog"
        aria-modal="false"
        aria-label="OmniSearch Results"
      >
        <!-- Pop-up Results Body -->
        <div
          id="omni-search-results-listbox"
          role="listbox"
          class="overflow-y-auto custom-scrollbar flex-1 min-h-0 p-2 space-y-3"
        >
          <!-- Inline Action Error Banner -->
          <div
            v-if="actionError"
            class="border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center justify-between gap-2"
            role="alert"
          >
            <div class="flex items-center gap-2 min-w-0">
              <NexuraIcon name="AlertTriangle" size="xs" class="text-rose-400 shrink-0" />
              <span class="truncate">{{ actionError }}</span>
            </div>
            <button
              type="button"
              class="text-rose-300/70 hover:text-rose-200 p-0.5 rounded cursor-pointer shrink-0"
              aria-label="Dismiss error"
              @mousedown.prevent
              @click.stop="actionError = null"
            >
              <NexuraIcon name="X" size="xs" />
            </button>
          </div>

          <!-- 3-ZONE COMPACT IDLE VIEW (when query is empty and scope is 'all') -->
          <template v-if="isIdleState">
            <!-- Zone 1: Recent Searches (only shown when history exists) -->
            <div v-if="searchHistory.length > 0" class="space-y-1">
              <div class="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#8A8F9E]/70 font-sans flex items-center justify-between border-b border-white/[0.04]">
                <span>RECENT SEARCHES</span>
                <button
                  type="button"
                  class="text-[10px] font-mono text-[#8A8F9E] hover:text-white transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="clearSearchHistory"
                >
                  Clear
                </button>
              </div>
              <div class="space-y-0.5 pt-0.5">
                <div
                  v-for="query in searchHistory"
                  :key="query"
                  class="group px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-2 cursor-pointer text-xs text-[#D1D5DB]"
                  @mousedown.prevent
                  @click="onSelectHistory(query)"
                >
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <NexuraIcon name="Clock" size="xs" class="text-[#8A8F9E] shrink-0" />
                    <span class="font-mono text-xs truncate">{{ query }}</span>
                  </div>
                  <button
                    type="button"
                    class="text-[#8A8F9E] hover:text-rose-300 p-0.5 rounded hover:bg-white/[0.08] transition cursor-pointer shrink-0"
                    :aria-label="'Remove ' + query + ' from recent searches'"
                    @mousedown.prevent
                    @click.stop="removeSearchHistory(query)"
                  >
                    <NexuraIcon name="X" size="xs" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Zone 2: Search Guidance (Operators & Scope Triggers) -->
            <div class="space-y-1.5">
              <div class="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#8A8F9E]/70 font-sans flex items-center justify-between border-b border-white/[0.04]">
                <span>SEARCH GUIDANCE</span>
                <span class="text-[10px] font-mono text-[#565B68]">Operators &amp; Scopes</span>
              </div>
              <!-- Interactive Operator Pills -->
              <div class="px-2 pt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                <button
                  type="button"
                  class="px-2 py-1 rounded-md bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] border border-emerald-500/20 text-emerald-300 transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="applyOperatorPrefix('> ')"
                >
                  &gt; Actions
                </button>
                <button
                  type="button"
                  class="px-2 py-1 rounded-md bg-indigo-500/[0.08] hover:bg-indigo-500/[0.15] border border-indigo-500/20 text-indigo-300 transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="applyOperatorPrefix('#')"
                >
                  # Tech Tags
                </button>
                <button
                  type="button"
                  class="px-2 py-1 rounded-md bg-blue-500/[0.08] hover:bg-blue-500/[0.15] border border-blue-500/20 text-blue-300 transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="applyOperatorPrefix('@')"
                >
                  @ Projects
                </button>
                <button
                  type="button"
                  class="px-2 py-1 rounded-md bg-rose-500/[0.08] hover:bg-rose-500/[0.15] border border-rose-500/20 text-rose-300 transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="applyOperatorPrefix('! ')"
                >
                  ! Blockers
                </button>
              </div>
              <!-- Interactive Scope Trigger Pills -->
              <div class="px-2 flex flex-wrap items-center gap-1.5 text-[10px] font-sans">
                <button
                  v-for="scopePill in scopeTriggerPills"
                  :key="scopePill.scope"
                  type="button"
                  class="px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[#D1D5DB] hover:text-white transition cursor-pointer inline-flex items-center gap-1"
                  @mousedown.prevent
                  @click.stop="onSelectScope(scopePill.scope)"
                >
                  <span>{{ scopePill.label }}</span>
                </button>
              </div>
            </div>

            <!-- Zone 3: Quick Actions -->
            <div v-if="idleQuickActions.length > 0" class="space-y-1">
              <div class="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#8A8F9E]/70 font-sans flex items-center justify-between border-b border-white/[0.04]">
                <span>QUICK ACTIONS</span>
                <span class="text-[10px] font-mono text-[#565B68]">{{ idleQuickActions.length }}</span>
              </div>
              <div class="space-y-0.5 pt-0.5">
                <div
                  v-for="item in idleQuickActions"
                  :id="'omni-item-' + item.id"
                  :key="item.id"
                  :ref="(el) => setItemRef(el, item.visualIndex)"
                  role="option"
                  :aria-selected="selectedIndex === item.visualIndex"
                  class="group px-3 py-2 rounded-xl transition-colors duration-75 flex flex-col gap-1 cursor-pointer text-xs"
                  :class="[
                    selectedIndex === item.visualIndex
                      ? 'bg-white/[0.08] border-l-2 border-indigo-400 text-[#F3F4F6] shadow-sm'
                      : 'hover:bg-white/[0.03] border-l-2 border-transparent text-[#8A8F9E]'
                  ]"
                  @mousedown.prevent
                  @click="onItemClick(item)"
                  @mouseenter="onItemHover(item)"
                >
                  <div class="flex items-center justify-between gap-2.5 min-w-0">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
                        :class="[
                          selectedIndex === item.visualIndex
                            ? 'bg-white/[0.08] text-white shadow-inner'
                            : 'bg-white/[0.03] text-[#8A8F9E]'
                        ]"
                      >
                        <NexuraIcon
                          :name="item.icon"
                          size="xs"
                          :class="item.iconColor || 'text-indigo-400'"
                        />
                      </div>
                      <div
                        class="font-medium font-sans truncate text-xs min-w-0 flex-1"
                        :class="selectedIndex === item.visualIndex ? 'text-white' : 'text-[#D1D5DB]'"
                      >
                        {{ item.title }}
                      </div>
                    </div>
                    <span
                      v-if="item.badge"
                      class="px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums uppercase shrink-0 transition-colors"
                      :class="item.badgeColor || 'bg-white/[0.05] text-[#8A8F9E] border border-white/[0.08]'"
                    >
                      {{ item.badge }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between gap-2 pl-[34px] min-w-0">
                    <div class="text-[11px] font-mono text-[#8A8F9E] truncate min-w-0 flex-1">
                      {{ item.subtitle || item.description }}
                    </div>
                    <div class="shrink-0 flex items-center gap-1.5">
                      <kbd
                        v-if="item.shortcutHint"
                        class="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] text-[#8A8F9E] font-mono"
                      >
                        {{ item.shortcutHint }}
                      </kbd>
                      <span
                        class="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono transition-opacity"
                        :class="selectedIndex === item.visualIndex ? 'opacity-100 text-white/70' : 'opacity-0 text-transparent'"
                      >
                        <kbd class="px-1 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] text-[9px]">↵</kbd>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ACTIVE QUERY OR SCOPE VIEW -->
          <template v-else>
            <!-- Interactive Empty State -->
            <div
              v-if="filteredResults.length === 0"
              class="py-10 px-4 text-center flex flex-col items-center justify-center space-y-2 select-none"
            >
              <div class="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#565B68]">
                <NexuraIcon name="SearchX" size="md" />
              </div>
              <p class="text-xs text-[#8A8F9E] font-sans">
                No matching results for "<span class="text-white font-mono">{{ rawQuery }}</span>"
              </p>
              <div class="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono text-[#8A8F9E]">
                <button
                  type="button"
                  class="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-emerald-300 transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="applyOperatorPrefix('> ')"
                >
                  &gt; Actions
                </button>
                <button
                  type="button"
                  class="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-indigo-300 transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="applyOperatorPrefix('#')"
                >
                  # Tech Tags
                </button>
                <button
                  type="button"
                  class="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-blue-300 transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="applyOperatorPrefix('@')"
                >
                  @ Projects
                </button>
                <button
                  type="button"
                  class="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-rose-300 transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="applyOperatorPrefix('! ')"
                >
                  ! Blockers
                </button>
                <button
                  v-if="activeScope !== 'all'"
                  type="button"
                  class="px-1.5 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-white transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="onSelectScope('all')"
                >
                  Reset Scope
                </button>
              </div>
            </div>

            <!-- Grouped Results -->
            <div
              v-for="group in groupedResults"
              :key="group.category"
              class="space-y-1"
            >
              <!-- Section Header -->
              <div class="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#8A8F9E]/70 font-sans flex items-center justify-between border-b border-white/[0.04]">
                <span>{{ group.category }}</span>
                <span class="text-[10px] font-mono text-[#565B68]">{{ group.totalCount }}</span>
              </div>

              <!-- Item Rows: Two-Line Bento Row -->
              <div class="space-y-0.5 pt-0.5">
                <div
                  v-for="item in group.items"
                  :id="'omni-item-' + item.id"
                  :key="item.id"
                  :ref="(el) => setItemRef(el, item.visualIndex)"
                  role="option"
                  :aria-selected="selectedIndex === item.visualIndex"
                  class="group px-3 py-2 rounded-xl transition-colors duration-75 flex flex-col gap-1 cursor-pointer text-xs"
                  :class="[
                    selectedIndex === item.visualIndex
                      ? 'bg-white/[0.08] border-l-2 border-indigo-400 text-[#F3F4F6] shadow-sm'
                      : 'hover:bg-white/[0.03] border-l-2 border-transparent text-[#8A8F9E]'
                  ]"
                  @mousedown.prevent
                  @click="onItemClick(item)"
                  @mouseenter="onItemHover(item)"
                >
                  <!-- Line 1: [Icon Box] + [Title] + [Status Capsule / Badge] -->
                  <div class="flex items-center justify-between gap-2.5 min-w-0">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                      <!-- Entity Icon Box -->
                      <div
                        class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
                        :class="[
                          selectedIndex === item.visualIndex
                            ? 'bg-white/[0.08] text-white shadow-inner'
                            : 'bg-white/[0.03] text-[#8A8F9E]'
                        ]"
                      >
                        <NexuraIcon
                          :name="item.icon"
                          size="xs"
                          :class="item.iconColor || 'text-indigo-400'"
                        />
                      </div>

                      <!-- Title with fuzzy highlight -->
                      <div
                        class="font-medium font-sans truncate text-xs min-w-0 flex-1"
                        :class="selectedIndex === item.visualIndex ? 'text-white' : 'text-[#D1D5DB]'"
                      >
                        <template v-for="(part, pIdx) in splitHighlights(item.title, item.titleHighlights)" :key="pIdx">
                          <mark
                            v-if="part.isHighlight"
                            class="bg-indigo-500/35 text-indigo-200 px-0.5 rounded font-semibold underline decoration-indigo-400"
                          >{{ part.text }}</mark>
                          <span v-else>{{ part.text }}</span>
                        </template>
                      </div>
                    </div>

                    <!-- Status Capsule / Badge -->
                    <span
                      v-if="item.badge"
                      class="px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums uppercase shrink-0 transition-colors"
                      :class="item.badgeColor || 'bg-white/[0.05] text-[#8A8F9E] border border-white/[0.08]'"
                    >
                      {{ item.badge }}
                    </span>
                  </div>

                  <!-- Line 2: Monospaced Context Subtitle + [↵ Hint / Shortcut] -->
                  <div class="flex items-center justify-between gap-2 pl-[34px] min-w-0">
                    <!-- Monospaced Context Subtitle with fuzzy highlight + inline tech tags -->
                    <div class="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                      <div class="text-[11px] font-mono text-[#8A8F9E] truncate min-w-0">
                        <template v-if="item.subtitle">
                          <template v-for="(part, pIdx) in splitHighlights(item.subtitle, item.subtitleHighlights)" :key="pIdx">
                            <mark
                              v-if="part.isHighlight"
                              class="bg-indigo-500/25 text-indigo-200 px-0.5 rounded underline decoration-indigo-400"
                            >{{ part.text }}</mark>
                            <span v-else>{{ part.text }}</span>
                          </template>
                        </template>
                        <span v-else-if="item.description" class="text-[11px] font-sans text-[#8A8F9E]/70 truncate">
                          {{ item.description }}
                        </span>
                      </div>
                      <template v-if="item.tags && item.tags.length > 0">
                        <span
                          v-for="tag in item.tags.slice(0, 3)"
                          :key="tag"
                          class="px-1 py-0.2 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-[#8A8F9E] shrink-0"
                        >
                          #{{ tag }}
                        </span>
                      </template>
                    </div>

                    <!-- Shortcut Hint or ↵ -->
                    <div class="shrink-0 flex items-center gap-1.5">
                      <kbd
                        v-if="item.shortcutHint"
                        class="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] text-[#8A8F9E] font-mono"
                      >
                        {{ item.shortcutHint }}
                      </kbd>
                      <span
                        class="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono transition-opacity"
                        :class="selectedIndex === item.visualIndex ? 'opacity-100 text-white/70' : 'opacity-0 text-transparent'"
                      >
                        <kbd class="px-1 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] text-[9px]">↵</kbd>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Show More Button when group exceeds 5-item cap -->
                <button
                  v-if="group.hiddenCount > 0"
                  type="button"
                  class="w-full px-3 py-1.5 text-left text-[11px] font-mono text-indigo-300/80 hover:text-indigo-200 hover:bg-white/[0.03] rounded-lg transition cursor-pointer"
                  @mousedown.prevent
                  @click.stop="expandCategory(group.category)"
                >
                  Show {{ group.hiddenCount }} more in {{ group.category }}...
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer: Monospaced Helper Bar -->
        <footer
          class="px-3.5 py-2 bg-[#090A0D]/90 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#8A8F9E] select-none shrink-0"
        >
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1">
              <kbd class="px-1 py-0.2 rounded bg-white/[0.06] border border-white/[0.08] text-white">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <kbd class="px-1 py-0.2 rounded bg-white/[0.06] border border-white/[0.08] text-white">↵</kbd>
              <span>Select</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <kbd class="px-1 py-0.2 rounded bg-white/[0.06] border border-white/[0.08] text-white">Tab</kbd>
              <span>Scope</span>
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <kbd class="px-1 py-0.2 rounded bg-white/[0.06] border border-white/[0.08] text-white">Esc</kbd>
            <span>{{ rawQuery || activeScope !== 'all' ? 'Clear' : 'Close' }}</span>
          </div>
        </footer>
      </div>
    </Transition>

    <!-- BACKDROP OVERLAY (Teleported to body, fixed inset-0 z-40 bg-black/40, NO BLUR FILTER) -->
    <Teleport to="body">
      <Transition name="fade-backdrop">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-40 bg-black/40"
          aria-hidden="true"
          @click="onBackdropClick"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import NexuraIcon from '../ui/NexuraIcon.vue'
import {
  useOmniSearch,
  splitHighlights,
  type OmniSearchItem,
  type OmniSearchScope
} from '../../composables/useOmniSearch'

const route = useRoute()

const {
  isOpen,
  rawQuery,
  parsedQuery,
  activeScope,
  selectedIndex,
  filteredResults,
  searchHistory,
  actionError,
  openSearch,
  closeSearch,
  setScope,
  cycleScope,
  setSelectedIndex,
  executeCurrent,
  executeSecondary,
  removeSearchHistory,
  clearSearchHistory,
  applySearchHistory
} = useOmniSearch()

const inputRef = ref<HTMLInputElement | null>(null)
const popupRef = ref<HTMLElement | null>(null)
const itemElements = new Map<number, HTMLElement>()
const expandedCategories = ref<Record<string, boolean>>({})
const MAX_ITEMS_PER_GROUP = 5

const scopeTriggerPills: { label: string; scope: OmniSearchScope }[] = [
  { label: 'Tasks', scope: 'task' },
  { label: 'Projects', scope: 'project' },
  { label: 'Sprints', scope: 'sprint' },
  { label: 'Repos', scope: 'repo' },
  { label: 'Notes', scope: 'note' },
  { label: 'Actions', scope: 'action' }
]

const isIdleState = computed(() => {
  return rawQuery.value.trim() === '' && activeScope.value === 'all'
})

function setItemRef(el: any, visualIndex: number) {
  if (el) {
    itemElements.set(visualIndex, el as HTMLElement)
  } else {
    itemElements.delete(visualIndex)
  }
}

// Leading Icon based on active prefix mode or scope
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
  if (activeScope.value === 'note') return 'Sparkles'
  return 'Search'
})

const leadingIconColor = computed(() => {
  if (parsedQuery.value.prefixMode === 'action' || activeScope.value === 'action') return 'text-emerald-400'
  if (parsedQuery.value.prefixMode === 'tag') return 'text-indigo-400'
  if (parsedQuery.value.prefixMode === 'project' || activeScope.value === 'project') return 'text-blue-400'
  if (parsedQuery.value.prefixMode === 'blocker') return 'text-rose-400'
  if (activeScope.value === 'task') return 'text-indigo-400'
  if (activeScope.value === 'sprint') return 'text-purple-400'
  if (activeScope.value === 'repo') return 'text-emerald-400'
  if (activeScope.value === 'note') return 'text-yellow-400'
  return 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'
})

// Inline Dynamic Prefix Chip Badge
const prefixChip = computed<{ label: string; class: string } | null>(() => {
  const mode = parsedQuery.value.prefixMode
  if (mode === 'action') {
    return { label: '> Actions', class: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' }
  }
  if (mode === 'tag') {
    return { label: '# Tech Tags', class: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' }
  }
  if (mode === 'project') {
    return { label: '@ Projects', class: 'bg-blue-500/10 text-blue-300 border border-blue-500/20' }
  }
  if (mode === 'blocker') {
    return { label: '! Blockers', class: 'bg-rose-500/10 text-rose-300 border border-rose-500/20' }
  }
  if (activeScope.value === 'task') {
    return { label: 'Scope: Tasks', class: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' }
  }
  if (activeScope.value === 'project') {
    return { label: 'Scope: Projects', class: 'bg-blue-500/10 text-blue-300 border border-blue-500/20' }
  }
  if (activeScope.value === 'sprint') {
    return { label: 'Scope: Sprints', class: 'bg-purple-500/10 text-purple-300 border border-purple-500/20' }
  }
  if (activeScope.value === 'repo') {
    return { label: 'Scope: Repos', class: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' }
  }
  if (activeScope.value === 'action') {
    return { label: 'Scope: Actions', class: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' }
  }
  if (activeScope.value === 'note') {
    return { label: 'Scope: Notes', class: 'bg-amber-500/10 text-amber-300 border border-amber-500/20' }
  }
  return null
})

interface IndexedOmniItem extends OmniSearchItem {
  flatIndex: number
  visualIndex: number
}

interface ItemGroup {
  category: string
  rawCategory: string
  items: IndexedOmniItem[]
  totalCount: number
  hiddenCount: number
  maxScore: number
}

const categoryDisplayNames: Record<string, string> = {
  'Actions': 'ACTIONS & COMMANDS',
  'Tasks & Deliverables': 'DELIVERABLES & TASKS',
  'Projects': 'PROJECTS',
  'Weekly Sprints': 'WEEKLY SPRINTS',
  'Repositories': 'REPOSITORIES',
  'Project Notes': 'PROJECT NOTES',
  'Quick Navigation': 'QUICK NAVIGATION'
}

const categoryOrder = [
  'Actions',
  'Tasks & Deliverables',
  'Projects',
  'Weekly Sprints',
  'Repositories',
  'Project Notes',
  'Quick Navigation'
]

// Top 4 Quick Actions for the 3-Zone Compact Idle View
const idleQuickActions = computed<IndexedOmniItem[]>(() => {
  const actions: IndexedOmniItem[] = []
  filteredResults.value.forEach((item, flatIndex) => {
    if (item.type === 'action' && actions.length < 4) {
      actions.push({
        ...item,
        flatIndex,
        visualIndex: actions.length
      })
    }
  })
  return actions
})

// Group filtered results with dynamic relevance ordering, 5-item cap, and sequential visualIndex
const groupedResults = computed<ItemGroup[]>(() => {
  const map = new Map<string, { items: { item: OmniSearchItem; flatIndex: number }[]; maxScore: number }>()

  filteredResults.value.forEach((item, flatIndex) => {
    const cat = item.categoryLabel || 'Other'
    const itemScore = item.score || 0
    if (!map.has(cat)) {
      map.set(cat, { items: [], maxScore: itemScore })
    }
    const bucket = map.get(cat)!
    bucket.items.push({ item, flatIndex })
    if (itemScore > bucket.maxScore) {
      bucket.maxScore = itemScore
    }
  })

  const presentCategories = Array.from(map.keys())
  const hasActiveQuery = rawQuery.value.trim() !== ''

  presentCategories.sort((catA, catB) => {
    if (hasActiveQuery) {
      const scoreDiff = (map.get(catB)?.maxScore || 0) - (map.get(catA)?.maxScore || 0)
      if (scoreDiff !== 0) return scoreDiff
    }
    const idxA = categoryOrder.indexOf(catA)
    const idxB = categoryOrder.indexOf(catB)
    const normA = idxA === -1 ? 999 : idxA
    const normB = idxB === -1 ? 999 : idxB
    return normA - normB
  })

  const groups: ItemGroup[] = []
  let runningVisualIndex = 0

  for (const cat of presentCategories) {
    const bucket = map.get(cat)!
    const displayCategory = categoryDisplayNames[cat] || cat.toUpperCase()
    const totalCount = bucket.items.length
    const shouldCap =
      activeScope.value === 'all' && !expandedCategories.value[displayCategory]
    const visibleSlice = shouldCap
      ? bucket.items.slice(0, MAX_ITEMS_PER_GROUP)
      : bucket.items
    const hiddenCount = shouldCap ? Math.max(0, totalCount - MAX_ITEMS_PER_GROUP) : 0

    const indexedItems: IndexedOmniItem[] = visibleSlice.map(({ item, flatIndex }) => ({
      ...item,
      flatIndex,
      visualIndex: runningVisualIndex++
    }))

    groups.push({
      category: displayCategory,
      rawCategory: cat,
      items: indexedItems,
      totalCount,
      hiddenCount,
      maxScore: bucket.maxScore
    })
  }

  return groups
})

// Flat list of items in exact top-to-bottom visual order
const visualFlatItems = computed<IndexedOmniItem[]>(() => {
  if (isIdleState.value) {
    return idleQuickActions.value
  }
  return groupedResults.value.flatMap((g) => g.items)
})

const activeVisualItem = computed<IndexedOmniItem | null>(() => {
  const list = visualFlatItems.value
  if (list.length === 0) return null
  const idx = Math.min(Math.max(0, selectedIndex.value), list.length - 1)
  return list[idx] || null
})

function expandCategory(displayCategory: string) {
  expandedCategories.value = {
    ...expandedCategories.value,
    [displayCategory]: true
  }
  inputRef.value?.focus()
}

function applyOperatorPrefix(prefix: string) {
  rawQuery.value = prefix
  selectedIndex.value = 0
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function onSelectScope(scope: OmniSearchScope) {
  setScope(scope)
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function onSelectHistory(queryText: string) {
  applySearchHistory(queryText)
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function onInputContainerClick() {
  if (!isOpen.value) {
    openSearch()
  }
  inputRef.value?.focus()
}

function onInputFocus() {
  if (!isOpen.value) {
    openSearch()
  }
}

function clearQuery() {
  rawQuery.value = ''
  selectedIndex.value = 0
  inputRef.value?.focus()
}

// Two-Stage Escape Handling
function handleEscAction() {
  if (rawQuery.value !== '' || activeScope.value !== 'all') {
    // Stage 1: Clear text and reset scope, keep pop-up open
    rawQuery.value = ''
    activeScope.value = 'all'
    selectedIndex.value = 0
    inputRef.value?.focus()
  } else {
    // Stage 2: Close pop-up and release focus
    closeSearch()
    inputRef.value?.blur()
  }
}

function onBackdropClick() {
  closeSearch()
  inputRef.value?.blur()
}

function onInputKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const len = visualFlatItems.value.length
    if (len > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % len
    }
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    const len = visualFlatItems.value.length
    if (len > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + len) % len
    }
    return
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    cycleScope(e.shiftKey ? -1 : 1)
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    if (isOpen.value && activeVisualItem.value) {
      inputRef.value?.blur()
      const itemToExecute = activeVisualItem.value
      if (e.metaKey || e.ctrlKey) {
        executeSecondary(itemToExecute)
      } else {
        executeCurrent(itemToExecute)
      }
    }
    return
  }

  if (e.key === 'Escape') {
    e.stopPropagation()
    e.preventDefault()
    handleEscAction()
    return
  }
}

async function onItemClick(item: IndexedOmniItem) {
  selectedIndex.value = item.visualIndex
  inputRef.value?.blur()
  await executeCurrent(item)
}

function onItemHover(item: IndexedOmniItem) {
  selectedIndex.value = item.visualIndex
}

// Reset expanded categories and selection index when query or scope changes
watch([rawQuery, activeScope], () => {
  expandedCategories.value = {}
  selectedIndex.value = 0
})

// Keep selectedIndex within visual bounds
watch(
  () => visualFlatItems.value.length,
  (len) => {
    if (selectedIndex.value >= len) {
      selectedIndex.value = Math.max(0, len - 1)
    }
  }
)

// Auto-close pop-up on route navigation and release input focus
watch(
  () => route.fullPath,
  () => {
    if (isOpen.value) {
      closeSearch()
    }
    inputRef.value?.blur()
  }
)

// Auto-focus input when pop-up opens, and release input focus when pop-up closes
watch(
  isOpen,
  async (open) => {
    if (open) {
      await nextTick()
      inputRef.value?.focus()
    } else {
      inputRef.value?.blur()
    }
  }
)

// Auto-scroll the active item into view without smooth lag
watch(
  selectedIndex,
  (newIdx) => {
    nextTick(() => {
      const el = itemElements.get(newIdx)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior })
      }
    })
  },
  { flush: 'post' }
)

onUnmounted(() => {
  itemElements.clear()
})
</script>

<style scoped>
.dropdown-slide-enter-active,
.dropdown-slide-leave-active {
  transition: opacity 0.14s cubic-bezier(0.16, 1, 0.3, 1), transform 0.14s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-slide-enter-from,
.dropdown-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.fade-backdrop-enter-active,
.fade-backdrop-leave-active {
  transition: opacity 0.14s ease;
}
.fade-backdrop-enter-from,
.fade-backdrop-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-slide-enter-active,
  .dropdown-slide-leave-active,
  .fade-backdrop-enter-active,
  .fade-backdrop-leave-active {
    transition: none !important;
    transform: none !important;
  }
}
</style>
