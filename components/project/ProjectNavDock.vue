<template>
  <div class="relative z-40">
    <!-- Desktop Right Navigation Dock (Treated 1:1 identical to Global Sidebar.vue) -->
    <aside
      class="hidden md:flex flex-col justify-center items-center my-3.5 mr-1 sm:mr-2 h-[calc(100vh-1.75rem)] w-14 sm:w-16 shrink-0 relative z-40 select-none"
      aria-label="Project Navigation Dock"
    >
      <!-- Middle Island (Navigation Capsule Rail) -->
      <nav
        class="w-14 sm:w-16 py-3 px-1.5 rounded-3xl bg-[#111114]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 flex flex-col items-center gap-2.5 relative z-40"
        role="tablist"
        aria-label="Project Views Navigation"
      >
        <button
          v-for="item in tabConfigs"
          :key="item.id"
          type="button"
          class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all relative group hover:z-50 focus:outline-none focus:ring-1 focus:ring-[#C98A4B] cursor-pointer"
          :class="[
            currentTab === item.id
              ? 'bg-[#C98A4B]/20 text-[#C98A4B] border border-[#C98A4B]/40 shadow-[0_0_12px_rgba(201,138,75,0.25)] font-bold'
              : 'border border-transparent text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5'
          ]"
          role="tab"
          :aria-selected="currentTab === item.id"
          :aria-label="item.label"
          @click="onSelect(item.id)"
        >
          <!-- Tab 1: Dashboard - DevOps Cockpit Speedometer Gauge SVG (Beda dari grid global navbar) -->
          <svg
            v-if="item.id === 'dashboard'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m12 14 4-4" />
            <path d="M3.34 19a10 10 0 1 1 17.32 0" />
          </svg>

          <!-- Tab 2: Kanban - 3-Column Kanban Board SVG + badge counter -->
          <svg
            v-else-if="item.id === 'kanban'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="5" height="16" rx="1.2" />
            <rect x="10" y="4" width="5" height="11" rx="1.2" />
            <rect x="17" y="4" width="5" height="15" rx="1.2" />
          </svg>

          <!-- Tab 3: Tasks - Checklist Matrix SVG + badge counter -->
          <svg
            v-else-if="item.id === 'matrix'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M11 6h9" />
            <path d="M11 12h9" />
            <path d="M11 18h9" />
            <polyline points="3 6 5 8 8.5 4.5" />
            <polyline points="3 12 5 14 8.5 10.5" />
            <polyline points="3 18 5 20 8.5 16.5" />
          </svg>

          <!-- Tab 4: GitHub - Official GitHub Invertocat Vector SVG + badge counter -->
          <svg
            v-else-if="item.id === 'github'"
            class="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>

          <!-- Tab 5: Vercel - Official Vercel Geometric Triangle SVG + green pulsing dot (Live Production) -->
          <svg
            v-else-if="item.id === 'vercel'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2.5L22.5 21H1.5L12 2.5z" />
          </svg>

          <!-- Tab 6: Supabase - Official Supabase Faceted Bolt SVG (#3ECF8E) -->
          <svg
            v-else-if="item.id === 'supabase'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21.362 9.354H12V.396a.379.379 0 0 0-.65-.262L.262 11.394a.375.375 0 0 0 .262.64H12v8.958a.379.379 0 0 0 .65.262l11.088-11.26a.375.375 0 0 0-.262-.64z"
              fill="#3ECF8E"
            />
          </svg>

          <!-- Dynamic Badges -->
          <!-- Kanban Counter Badge -->
          <span
            v-if="item.id === 'kanban' && currentTasksCount !== undefined && currentTasksCount > 0"
            class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#18181C] border border-[#C98A4B]/40 text-[#C98A4B] font-mono text-[9px] font-bold flex items-center justify-center shadow-md leading-none pointer-events-none"
          >
            {{ currentTasksCount }}
          </span>

          <!-- Task Matrix Counter Badge -->
          <span
            v-if="item.id === 'matrix' && currentMatrixCount !== undefined && currentMatrixCount > 0"
            class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#18181C] border border-[#C98A4B]/40 text-[#C98A4B] font-mono text-[9px] font-bold flex items-center justify-center shadow-md leading-none pointer-events-none"
          >
            {{ currentMatrixCount }}
          </span>

          <!-- GitHub Commits Badge -->
          <span
            v-if="item.id === 'github' && currentHasGithub && currentCommitsCount !== undefined && currentCommitsCount > 0"
            class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#18181C] border border-[#C98A4B]/40 text-[#C98A4B] font-mono text-[9px] font-bold flex items-center justify-center shadow-md leading-none pointer-events-none"
          >
            {{ currentCommitsCount }}
          </span>

          <!-- Vercel Live Green Pulsing Dot -->
          <span
            v-if="item.id === 'vercel'"
            class="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#111114] animate-pulse pointer-events-none"
          ></span>

          <!-- Floating HUD Tooltip (Mengambang ke arah KIRI) -->
          <div
            class="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-[#18181C] border border-white/[0.08] text-[#F5F2EB] font-mono text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 flex flex-col gap-0.5"
          >
            <div class="flex items-center gap-1.5">
              <span
                class="font-bold"
                :class="currentTab === item.id ? 'text-[#C98A4B]' : 'text-[#F5F2EB]'"
              >
                {{ item.tooltipTitle }}
              </span>
              <span
                v-if="item.id === 'kanban' && currentTasksCount !== undefined"
                class="text-[10px] text-[#C98A4B] font-semibold"
              >
                ({{ currentTasksCount }} tasks)
              </span>
              <span
                v-else-if="item.id === 'matrix' && currentMatrixCount !== undefined"
                class="text-[10px] text-[#C98A4B] font-semibold"
              >
                ({{ currentMatrixCount }} tasks)
              </span>
              <span
                v-else-if="item.id === 'github' && currentHasGithub && currentCommitsCount !== undefined"
                class="text-[10px] text-[#C98A4B] font-semibold"
              >
                ({{ currentCommitsCount }} commits)
              </span>
              <span
                v-else-if="item.statusText"
                class="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" :class="{ 'animate-pulse': item.id === 'vercel' }"></span>
                {{ item.statusText }}
              </span>
            </div>
            <span v-if="item.description" class="text-[#756F68] text-[10px]">{{ item.description }}</span>
          </div>
        </button>
      </nav>
    </aside>

    <!-- Mobile Bottom Floating Capsule Dock (< md) -->
    <nav
      class="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)] px-2 sm:px-3 py-1.5 rounded-2xl bg-[#111114]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 flex items-center gap-1.5 sm:gap-2 select-none"
      role="tablist"
      aria-label="Mobile Project Views Navigation"
    >
      <button
        v-for="item in tabConfigs"
        :key="item.id"
        type="button"
        class="w-10 h-10 flex items-center justify-center rounded-xl transition-all relative focus:outline-none focus:ring-1 focus:ring-[#C98A4B] cursor-pointer"
        :class="[
          currentTab === item.id
            ? 'bg-[#C98A4B]/20 text-[#C98A4B] border border-[#C98A4B]/40 shadow-[0_0_12px_rgba(201,138,75,0.25)] font-bold'
            : 'border border-transparent text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5'
        ]"
        role="tab"
        :aria-selected="currentTab === item.id"
        :aria-label="item.label"
        @click="onSelect(item.id)"
      >
        <!-- Dashboard Speedometer Gauge -->
        <svg
          v-if="item.id === 'dashboard'"
          class="w-5 h-5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m12 14 4-4" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        </svg>

        <!-- Kanban Icon -->
        <svg
          v-else-if="item.id === 'kanban'"
          class="w-5 h-5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="5" height="16" rx="1.2" />
          <rect x="10" y="4" width="5" height="11" rx="1.2" />
          <rect x="17" y="4" width="5" height="15" rx="1.2" />
        </svg>

        <!-- Tasks Matrix Icon -->
        <svg
          v-else-if="item.id === 'matrix'"
          class="w-5 h-5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M11 6h9" />
          <path d="M11 12h9" />
          <path d="M11 18h9" />
          <polyline points="3 6 5 8 8.5 4.5" />
          <polyline points="3 12 5 14 8.5 10.5" />
          <polyline points="3 18 5 20 8.5 16.5" />
        </svg>

        <!-- GitHub Icon -->
        <svg
          v-else-if="item.id === 'github'"
          class="w-5 h-5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>

        <!-- Vercel Icon -->
        <svg
          v-else-if="item.id === 'vercel'"
          class="w-5 h-5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.5L22.5 21H1.5L12 2.5z" />
        </svg>

        <!-- Supabase Icon -->
        <svg
          v-else-if="item.id === 'supabase'"
          class="w-5 h-5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M21.362 9.354H12V.396a.379.379 0 0 0-.65-.262L.262 11.394a.375.375 0 0 0 .262.64H12v8.958a.379.379 0 0 0 .65.262l11.088-11.26a.375.375 0 0 0-.262-.64z"
            fill="#3ECF8E"
          />
        </svg>

        <!-- Badges on Mobile -->
        <span
          v-if="item.id === 'kanban' && currentTasksCount !== undefined && currentTasksCount > 0"
          class="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 rounded-full bg-[#18181C] border border-[#C98A4B]/40 text-[#C98A4B] font-mono text-[8px] font-bold flex items-center justify-center leading-none pointer-events-none"
        >
          {{ currentTasksCount }}
        </span>
        <span
          v-if="item.id === 'matrix' && currentMatrixCount !== undefined && currentMatrixCount > 0"
          class="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 rounded-full bg-[#18181C] border border-[#C98A4B]/40 text-[#C98A4B] font-mono text-[8px] font-bold flex items-center justify-center leading-none pointer-events-none"
        >
          {{ currentMatrixCount }}
        </span>
        <span
          v-if="item.id === 'github' && currentHasGithub && currentCommitsCount !== undefined && currentCommitsCount > 0"
          class="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-1 rounded-full bg-[#18181C] border border-[#C98A4B]/40 text-[#C98A4B] font-mono text-[8px] font-bold flex items-center justify-center leading-none pointer-events-none"
        >
          {{ currentCommitsCount }}
        </span>
        <span
          v-if="item.id === 'vercel'"
          class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse pointer-events-none"
        ></span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectNav, type ProjectTabId } from '../../composables/useProjectNav'

interface Props {
  activeTab?: ProjectTabId
  tasksCount?: number
  matrixCount?: number
  commitsCount?: number
  hasGithub?: boolean
}

const props = withDefaults(defineProps<Props>(), {})
const nav = useProjectNav()

const currentTab = computed(() => props.activeTab || nav.activeTab.value)
const currentTasksCount = computed(() => props.tasksCount ?? nav.tasksCount.value)
const currentMatrixCount = computed(() => props.matrixCount ?? nav.matrixCount.value)
const currentCommitsCount = computed(() => props.commitsCount ?? nav.commitsCount.value)
const currentHasGithub = computed(() => props.hasGithub ?? nav.hasGithub.value)

const emit = defineEmits<{
  (e: 'update:activeTab', val: ProjectTabId): void
  (e: 'selectTab', val: ProjectTabId): void
}>()

function onSelect(tabId: ProjectTabId) {
  nav.setActiveTab(tabId)
  emit('update:activeTab', tabId)
  emit('selectTab', tabId)
}

interface TabConfig {
  id: ProjectTabId
  label: string
  tooltipTitle: string
  description: string
  statusText?: string
}

const tabConfigs: TabConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    tooltipTitle: 'DASHBOARD',
    description: 'Cockpit & DevOps Bento Matrix'
  },
  {
    id: 'kanban',
    label: 'Kanban',
    tooltipTitle: 'KANBAN BOARD',
    description: '3-Column Sprint Delivery'
  },
  {
    id: 'matrix',
    label: 'Tasks',
    tooltipTitle: 'TASK MATRIX',
    description: 'Filtered Task Management'
  },
  {
    id: 'github',
    label: 'GitHub',
    tooltipTitle: 'GITHUB REPO',
    description: 'Branches, PRs & Commits'
  },
  {
    id: 'vercel',
    label: 'Vercel',
    tooltipTitle: 'VERCEL DEPLOYMENT',
    description: 'Live Production Edge',
    statusText: 'Live'
  },
  {
    id: 'supabase',
    label: 'Supabase',
    tooltipTitle: 'SUPABASE CLOUD',
    description: 'PostgreSQL Database & API',
    statusText: 'Connected'
  }
]
</script>
