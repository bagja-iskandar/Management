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

    <!-- Right: Live Telemetry Clock & Blocker Status + Session Auth -->
    <div class="flex items-center gap-2.5 shrink-0">
      <!-- Monospace Telemetry Pod: WIB Clock | Blockers -->
      <div class="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] font-mono tabular-nums text-xs text-[#8A8F9E]">
        <span class="font-mono tabular-nums">WIB {{ currentTimeStr }}</span>
        <span class="text-white/15 select-none">|</span>
        <span :class="blockersCount > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'">
          {{ blockersCount }} {{ blockersCount === 1 ? 'Blocker' : 'Blockers' }}
        </span>
      </div>

      <!-- Discrete Session Auth Trigger Button -->
      <button
        type="button"
        @click="handleOpenAuthModal"
        class="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer flex items-center justify-center"
        :title="session.isAuthenticated.value ? 'Session Active (Verified)' : 'Authenticate Session (Access Key)'"
        :aria-label="session.isAuthenticated.value ? 'Session Active' : 'Authenticate Session'"
      >
        <NexuraIcon
          name="KeyRound"
          size="sm"
          :stroke-width="2"
          :class="session.isAuthenticated.value ? 'text-emerald-400' : 'text-[#8A8F9E]'"
        />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import NexuraIcon from './ui/NexuraIcon.vue'
import HeaderSearch from './search/HeaderSearch.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useSession } from '~/composables/useSession'
import { useOmniSearch } from '~/composables/useOmniSearch'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const session = useSession()
const { closeSearch } = useOmniSearch()

function handleOpenAuthModal() {
  closeSearch()
  session.openAuthModal()
}

// Canonical reactive references from workspace store (zero duplicate network calls)
const tasks = workspaceStore.tasks
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
  if (path === '/sprints' || path === '/focus') return 'Weekly Sprints'
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

// Blocker count
const blockersCount = computed(() => {
  if (!tasks.value) return 0
  return tasks.value.filter((t) => t.status === 'blocked').length
})

// WIB Live Clock (UTC+7)
const currentTimeStr = ref('12:48')
let timer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  try {
    const now = new Date()
    currentTimeStr.value = now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace('.', ':')
  } catch {
    const d = new Date()
    const hh = String((d.getUTCHours() + 7) % 24).padStart(2, '0')
    const mm = String(d.getUTCMinutes()).padStart(2, '0')
    currentTimeStr.value = `${hh}:${mm}`
  }
}

onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
