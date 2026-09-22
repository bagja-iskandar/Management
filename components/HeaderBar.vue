<template>
  <header
    class="w-full pt-3 px-1 sm:px-2 flex items-center justify-between pointer-events-none select-none"
  >
    <!-- Left Island: Monogram Brand Squircle (Optionally with mobile hamburger) -->
    <div class="pointer-events-auto flex items-center gap-2 shrink-0">
      <!-- Mobile hamburger toggle button (< md) -->
      <button
        type="button"
        class="md:hidden w-9 h-9 flex items-center justify-center text-[#756F68] hover:text-[#F5F2EB] rounded-xl bg-[#111114]/90 backdrop-blur-xl border border-white/[0.08] hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[#C98A4B] shrink-0 cursor-pointer"
        aria-label="Toggle navigation menu"
        @click="toggle"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Brand Monogram Squircle -->
      <div
        class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#111114]/90 backdrop-blur-xl border border-white/[0.08] hover:border-[#C98A4B]/40 shadow-lg shadow-black/40 flex items-center justify-center relative group transition-all shrink-0"
      >
        <NuxtLink
          to="/"
          class="w-full h-full flex items-center justify-center focus:outline-none"
          aria-label="Nexura Home"
        >
          <!-- Monogram Icon -->
          <div
            class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#C98A4B]/15 border border-[#C98A4B]/40 flex items-center justify-center text-[#C98A4B] font-mono text-xs sm:text-sm font-bold transition-all group-hover:scale-110 group-hover:border-[#C98A4B] group-hover:shadow-[0_0_12px_rgba(201,138,75,0.4)]"
            aria-hidden="true"
          >
            ◆
          </div>
        </NuxtLink>

        <!-- Floating HUD Tooltip -->
        <div
          class="absolute left-0 top-full mt-2 px-2.5 py-1 bg-[#18181C] border border-white/[0.08] text-[#F5F2EB] font-mono text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 flex items-center gap-1.5"
        >
          <span class="text-[#C98A4B] font-bold">NEXURA</span>
          <span class="text-[#756F68] text-[10px]">Command Center</span>
        </div>
      </div>
    </div>

    <!-- Center Section: Breadcrumbs Pill + Search Bar Pill (Proximity Centered) -->
    <div class="pointer-events-auto flex items-center gap-2 sm:gap-3 mx-auto min-w-0">
      <!-- Breadcrumbs Capsule Pill -->
      <div
        class="bg-[#111114]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] rounded-full px-3.5 py-1.5 flex items-center gap-2 shadow-lg shadow-black/40 font-mono text-xs text-[#756F68] shrink-0 transition-all"
      >
        <nav class="flex items-center gap-1.5 font-mono text-xs text-[#756F68] truncate" aria-label="Breadcrumb">
          <NuxtLink
            to="/"
            class="hover:text-[#F5F2EB] transition-colors flex items-center gap-1 shrink-0"
          >
            <span class="text-[#C98A4B] font-bold">&lt;</span>
            <span class="hover:underline">Dashboard</span>
          </NuxtLink>

          <template v-for="(item, index) in breadcrumbs" :key="index">
            <span class="text-white/20 select-none">/</span>
            <NuxtLink
              v-if="item.to && index < breadcrumbs.length - 1"
              :to="item.to"
              class="hover:text-[#F5F2EB] hover:underline transition-colors truncate max-w-[110px]"
            >
              {{ item.label }}
            </NuxtLink>
            <span
              v-else
              class="text-[#F5F2EB] font-bold truncate max-w-[140px]"
            >
              {{ item.label }}
            </span>
          </template>
        </nav>
      </div>

      <!-- Search Bar Pill Capsule -->
      <div
        class="w-40 sm:w-56 md:w-68 lg:w-80 bg-[#111114]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.15] focus-within:border-[#C98A4B] focus-within:ring-1 focus-within:ring-[#C98A4B]/40 rounded-full px-3.5 py-1.5 flex items-center gap-2.5 shadow-lg shadow-black/40 transition-all shrink-0"
      >
        <!-- Search Icon -->
        <svg
          class="w-3.5 h-3.5 text-[#756F68] shrink-0 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <!-- Search Input -->
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="search"
          placeholder="Search deliverables, tasks, repos..."
          class="bg-transparent border-none text-xs text-[#F5F2EB] placeholder:text-[#756F68] font-mono focus:outline-none w-full min-w-0"
          aria-label="Search deliverables and tasks"
        />

        <!-- Clear Button (if query exists) -->
        <button
          v-if="searchQuery"
          type="button"
          class="text-[#756F68] hover:text-[#F5F2EB] text-sm font-mono shrink-0 px-1 cursor-pointer"
          title="Clear search"
          @click="searchQuery = ''"
        >
          ×
        </button>

        <!-- Keyboard shortcut badge -->
        <div class="hidden sm:flex items-center gap-1 shrink-0 font-mono text-[9px] text-[#756F68] bg-white/5 border border-white/[0.08] px-1.5 py-0.2 rounded-full select-none">
          <span>⌘K</span>
        </div>
      </div>
    </div>

    <!-- Right Island: User Profile Squircle (Solo Engineer) -->
    <div class="pointer-events-auto flex items-center gap-2 shrink-0">
      <div
        class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#111114]/90 backdrop-blur-xl border border-white/[0.08] hover:border-[#C98A4B]/40 shadow-lg shadow-black/40 flex items-center justify-center relative group transition-all shrink-0"
      >
        <NuxtLink
          to="/repos"
          class="w-full h-full flex items-center justify-center focus:outline-none"
          aria-label="GitHub Engineer Profile"
        >
          <!-- User Profile Avatar / Initial -->
          <div
            class="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#18181C] border border-white/[0.1] flex items-center justify-center font-mono text-[10px] sm:text-xs font-bold text-[#F5F2EB] group-hover:border-[#C98A4B] transition-all relative overflow-hidden"
          >
            <span>BI</span>
            <!-- Online status green beacon dot -->
            <span class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-green-500 border border-[#111114]"></span>
          </div>
        </NuxtLink>

        <!-- Floating HUD Tooltip -->
        <div
          class="absolute right-0 top-full mt-2 px-2.5 py-1.5 bg-[#18181C] border border-white/[0.08] text-[#F5F2EB] font-mono text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-50 flex flex-col"
        >
          <div class="flex items-center gap-1.5">
            <span class="text-[#C98A4B] font-semibold">bagja-iskandar</span>
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          </div>
          <span class="text-[#756F68] text-[10px]">Solo Engineer • GitHub Synced</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'
import { useSearch } from '../composables/useSearch'
import { useProjects } from '../composables/useProjects'

const route = useRoute()
const { toggle } = useSidebar()
const { searchQuery } = useSearch()
const searchInputRef = ref<HTMLInputElement | null>(null)

const projectsApi = useProjects()
const { data: projects } = useLazyAsyncData('header-projects', () => projectsApi.getProjects())

interface Crumb {
  label: string
  to?: string
}

const breadcrumbs = computed<Crumb[]>(() => {
  const path = route.path

  if (path === '/') {
    return []
  }

  if (path.startsWith('/projects/')) {
    const slug = (route.params.slug as string) || ''
    const currentSlug = slug.toLowerCase()
    const found = (projects.value || []).find((p) => p.slug.toLowerCase() === currentSlug)
    const title = found?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Project'

    return [
      { label: 'Projects', to: '/projects' },
      { label: title }
    ]
  }

  if (path === '/projects') {
    return [{ label: 'Projects' }]
  }

  if (path === '/tasks') {
    return [{ label: 'Tasks' }]
  }

  if (path === '/sprints') {
    return [{ label: 'Sprints & Kanban' }]
  }

  if (path === '/repos') {
    return [{ label: 'GitHub Repos' }]
  }

  if (path === '/telemetry') {
    return [{ label: 'Telemetry' }]
  }

  if (path === '/roadmap') {
    return [{ label: 'Roadmap' }]
  }

  if (path === '/focus') {
    return [{ label: 'Focus' }]
  }

  const segments = path.split('/').filter(Boolean)
  return segments.map((seg, idx) => {
    const isLast = idx === segments.length - 1
    const segLabel = seg.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    return {
      label: segLabel,
      to: isLast ? undefined : `/${segments.slice(0, idx + 1).join('/')}`
    }
  })
})

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  } else if (e.key === '/' && document.activeElement !== searchInputRef.value) {
    e.preventDefault()
    searchInputRef.value?.focus()
  } else if (e.key === 'Escape' && document.activeElement === searchInputRef.value) {
    searchInputRef.value?.blur()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
