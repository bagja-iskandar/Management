<template>
  <header
    class="h-14 px-4 sm:px-5 border-b border-white/[0.04] flex items-center justify-between gap-4 bg-[#0B0C10] shrink-0 select-none relative z-50"
    aria-label="Unified Header Bar"
  >
    <!-- Left: Dynamic Clean Breadcrumb + Active Sprint Context Pill -->
    <div class="flex items-center gap-3 min-w-0">
      <nav class="flex items-center gap-2 text-xs font-sans min-w-0 truncate" aria-label="Breadcrumb">
        <NuxtLink
          to="/"
          class="text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors shrink-0"
        >
          {{ breadcrumbRoot }}
        </NuxtLink>
        <span class="text-white/20 select-none shrink-0">/</span>
        <span class="text-[#F3F4F6] font-medium truncate">
          {{ currentPageTitle }}
        </span>
      </nav>

      <!-- Active Sprint Context Pill -->
      <NuxtLink
        to="/sprints"
        class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border border-white/[0.08] bg-white/[0.03] text-[#8A8F9E] hover:border-white/[0.15] hover:text-[#F3F4F6] transition shrink-0 cursor-pointer"
        title="View active sprint"
      >
        <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: var(--obs-accent-light)"></span>
        <span>Sprint {{ sprintCode }}</span>
        <span class="text-white/20">·</span>
        <span class="text-[#F3F4F6] font-mono tabular-nums">{{ daysLeft }}d left</span>
      </NuxtLink>
    </div>

    <!-- Center: Header Search Bar with Integrated Flyout Dropdown -->
    <div class="flex items-center justify-center flex-1 max-w-sm sm:max-w-md md:max-w-[540px] mx-1 sm:mx-4">
      <HeaderSearch />
    </div>

    <!-- Right: Contextual Action Bar -->
    <div class="flex items-center gap-2 shrink-0" aria-label="Contextual Action Bar">
      <template v-for="action in headerActions" :key="action.id">
        <button
          type="button"
          @click="handleActionClick(action)"
          :disabled="action.disabled || action.loading"
          :class="getActionClass(action.variant)"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none cursor-pointer focus:outline-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          :title="action.shortcut ? `${action.label} (${action.shortcut})` : action.label"
        >
          <NexuraIcon v-if="action.icon" :name="action.icon" size="xs" class="shrink-0" />
          <span>{{ action.label }}</span>
          <kbd
            v-if="action.shortcut"
            class="hidden sm:inline-block ml-1 px-1 py-0.5 rounded text-[10px] font-mono bg-black/30 text-white/50 border border-white/10"
          >
            {{ action.shortcut }}
          </kbd>
        </button>
      </template>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import HeaderSearch from './search/HeaderSearch.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useOmniSearch } from '~/composables/useOmniSearch'
import { useHeaderActions, type HeaderAction, type HeaderActionVariant } from '~/composables/useHeaderActions'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { closeSearch } = useOmniSearch()
const { actions: headerActions } = useHeaderActions()

function handleActionClick(action: HeaderAction) {
  closeSearch()
  action.handler()
}

function getActionClass(variant?: HeaderActionVariant) {
  switch (variant) {
    case 'primary':
      return 'bg-[#F3F4F6] hover:bg-white text-[#07080A] shadow-sm font-semibold'
    case 'secondary':
      return 'bg-white/[0.04] hover:bg-white/[0.08] text-[#D1D5DB] hover:text-[#F3F4F6] border border-white/[0.08]'
    case 'ghost':
      return 'hover:bg-white/[0.05] text-[#8A8F9E] hover:text-[#F3F4F6]'
    case 'danger':
      return 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
    default:
      return 'bg-white/[0.04] hover:bg-white/[0.08] text-[#D1D5DB] hover:text-[#F3F4F6] border border-white/[0.08]'
  }
}

// Canonical reactive references from workspace store (zero duplicate network calls)
const projects = workspaceStore.projects
const sprints = workspaceStore.sprints

// Dynamic Breadcrumb computation
const breadcrumbRoot = computed(() => {
  if (route.path.startsWith('/projects/')) {
    return 'Projects'
  }
  return 'Workspace'
})

const currentPageTitle = computed(() => {
  const path = route.path
  if (path === '/') return 'Command Center'
  if (path === '/tasks') return 'My Tasks & Queue'
  if (path === '/sprints') return 'Weekly Sprints'
  if (path === '/roadmap') return 'Architecture Roadmap'
  if (path === '/repos') return 'GitHub Repositories'
  if (path === '/telemetry') return 'System Telemetry'
  if (path === '/projects') return 'Active Projects'

  if (path.startsWith('/projects/')) {
    const slug = (route.params.slug as string) || ''
    const found = projects.value?.find((p) => p.slug.toLowerCase() === slug.toLowerCase())
    return found?.title || slug || 'Project Detail'
  }

  // Fallback slug transformation
  const segments = path.split('/').filter(Boolean)
  if (segments.length > 0) {
    return segments[segments.length - 1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }
  return 'Command Center'
})

// Sprint Context
const activeSprint = computed(() => sprints.value?.find((s) => s.status === 'active'))

const sprintCode = computed(() => {
  if (activeSprint.value) {
    const match = activeSprint.value.name.match(/W\d+/i)
    return match ? match[0].toUpperCase() : 'W42'
  }
  return 'W42'
})

const daysLeft = computed(() => {
  if (!activeSprint.value?.endDate) return 4
  const end = new Date(activeSprint.value.endDate).getTime()
  const now = Date.now()
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
})
</script>
