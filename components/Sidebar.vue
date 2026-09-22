<template>
  <div class="relative z-40">
    <!-- Desktop Floating Dock (Centered Navigation Rail) -->
    <aside
      class="hidden md:flex flex-col justify-center items-center my-3.5 ml-1 sm:ml-2 h-[calc(100vh-1.75rem)] w-14 sm:w-16 shrink-0 relative z-40 select-none"
      aria-label="Application Sidebar Dock"
    >
      <!-- Navigation Capsule Rail (Middle Island) -->

      <!-- POD 2: Middle Island (Navigation Capsule Rail) -->
      <nav
        class="w-14 sm:w-16 py-3 px-1.5 rounded-3xl bg-[#111114]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 flex flex-col items-center gap-2.5 relative z-40"
        aria-label="Main Navigation"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all relative group hover:z-50 focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
          :class="[
            isActive(item.path)
              ? 'bg-[#C98A4B]/20 text-[#C98A4B] border border-[#C98A4B]/40 shadow-[0_0_12px_rgba(201,138,75,0.25)] font-bold'
              : 'border border-transparent text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5'
          ]"
          :aria-current="isActive(item.path) ? 'page' : undefined"
          :aria-label="item.label"
        >
          <!-- Dashboard: grid icon -->
          <svg
            v-if="item.icon === 'grid'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>

          <!-- Weekly Focus: target / crosshair icon -->
          <svg
            v-else-if="item.icon === 'target'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>

          <!-- Architecture Roadmap: map icon -->
          <svg
            v-else-if="item.icon === 'map'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>

          <!-- Code Repos: git-branch icon -->
          <svg
            v-else-if="item.icon === 'git-branch'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
          </svg>

          <!-- System Telemetry: activity icon -->
          <svg
            v-else-if="item.icon === 'activity'"
            class="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>

          <!-- Floating HUD Tooltip -->
          <div
            class="absolute left-full ml-3.5 px-2.5 py-1.5 bg-[#18181C] border border-white/[0.08] text-[#F5F2EB] font-mono text-xs rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 flex flex-col gap-0.5"
          >
            <div class="flex items-center gap-1.5">
              <span class="font-bold" :class="isActive(item.path) ? 'text-[#C98A4B]' : 'text-[#F5F2EB]'">
                {{ item.tooltipTitle || item.label }}
              </span>
              <span v-if="!item.description" class="text-[#756F68] text-[10px]">({{ item.path }})</span>
            </div>
            <span v-if="item.description" class="text-[#756F68] text-[10px]">{{ item.description }}</span>
          </div>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Mobile Flyout Navigation (Bottom Floating Dock for Smartphone / Tablet) -->
    <nav
      class="md:hidden fixed bottom-3 inset-x-3 h-14 bg-[#111114]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl z-50 flex items-center justify-around px-2"
      aria-label="Mobile Navigation"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="p-2 rounded-xl transition-all"
        :class="[
          isActive(item.path)
            ? 'bg-[#C98A4B]/20 text-[#C98A4B] border border-[#C98A4B]/40'
            : 'text-[#756F68] hover:text-[#F5F2EB]'
        ]"
        :aria-label="item.label"
      >
        <svg
          v-if="item.icon === 'grid'"
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>

        <!-- Weekly Focus: target / crosshair icon -->
        <svg
          v-else-if="item.icon === 'target'"
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
        </svg>

        <svg
          v-else-if="item.icon === 'map'"
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>

        <svg
          v-else-if="item.icon === 'git-branch'"
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>

        <svg
          v-else-if="item.icon === 'activity'"
          class="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

interface NavItem {
  label: string
  tooltipTitle?: string
  description?: string
  path: string
  icon: 'grid' | 'target' | 'map' | 'git-branch' | 'activity'
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    tooltipTitle: 'DASHBOARD',
    description: 'Command Center & Metrics',
    path: '/',
    icon: 'grid'
  },
  {
    label: 'Weekly Focus',
    tooltipTitle: 'WEEKLY FOCUS',
    description: 'Solo Execution Target',
    path: '/sprints',
    icon: 'target'
  },
  {
    label: 'Architecture Roadmap',
    tooltipTitle: 'ROADMAP',
    description: 'Milestones & Epics',
    path: '/roadmap',
    icon: 'map'
  },
  {
    label: 'Code Repos',
    tooltipTitle: 'REPOSITORIES',
    description: 'Codebases & Sync',
    path: '/repos',
    icon: 'git-branch'
  },
  {
    label: 'System Telemetry',
    tooltipTitle: 'TELEMETRY',
    description: 'System Status & Logs',
    path: '/telemetry',
    icon: 'activity'
  }
]

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  if (path === '/sprints' || path === '/focus') {
    return route.path.startsWith('/sprints') || route.path.startsWith('/focus')
  }
  return route.path.startsWith(path)
}
</script>
