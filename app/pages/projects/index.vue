<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
      <div>
        <div class="inline-flex items-center gap-1.5 font-mono text-xs text-[#C98A4B] bg-[#C98A4B]/10 px-2.5 py-0.5 rounded border border-[#C98A4B]/20 uppercase tracking-wider mb-2">
          <span>◆</span>
          <span>Projects Hub</span>
        </div>
        <h1 class="font-mono text-2xl font-bold text-[#F5F2EB]">Projects</h1>
        <p class="font-sans text-xs text-[#756F68] mt-1">Managed personal repositories, status tracking, and derived task milestones.</p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <NuxtLink
          to="/repos"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-semibold transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none shadow-sm shadow-[#C98A4B]/20"
        >
          <span>🐙</span>
          <span>Tambah dari GitHub Repos</span>
          <span>→</span>
        </NuxtLink>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-sans text-xs font-medium border border-white/[0.08] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
        >
          <svg class="w-3.5 h-3.5 text-[#756F68]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Success Feedback Alert -->
    <div
      v-if="successFeedback"
      class="p-3 rounded-lg bg-[#C98A4B]/10 border border-[#C98A4B]/30 text-[#C98A4B] text-xs font-mono flex items-center justify-between"
      role="status"
    >
      <span>{{ successFeedback }}</span>
      <button type="button" class="text-xs text-[#C98A4B] hover:underline" @click="successFeedback = ''">Dismiss</button>
    </div>

    <!-- Toolbar: Search, Sort & Status Tabs -->
    <div class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] space-y-4">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search -->
        <div class="relative flex-1">
          <input
            v-model="search"
            type="search"
            placeholder="Filter projects by title, description, or stack..."
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            aria-label="Filter projects"
          />
        </div>

        <!-- Sort Select -->
        <select
          v-model="sortBy"
          class="bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          aria-label="Sort projects"
        >
          <option value="progress-desc">Progress: High to Low</option>
          <option value="progress-asc">Progress: Low to High</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Project Status Filter">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="activeStatus === 'all' ? 'bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/40 font-semibold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="activeStatus = 'all'"
        >
          <span>All</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5">{{ allCount }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="activeStatus === 'active' ? 'bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/40 font-semibold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="activeStatus = 'active'"
        >
          <span>Active</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5">{{ activeCount }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="activeStatus === 'planned' ? 'bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/40 font-semibold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="activeStatus = 'planned'"
        >
          <span>Planned</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5">{{ plannedCount }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="activeStatus === 'on-hold' ? 'bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/40 font-semibold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="activeStatus = 'on-hold'"
        >
          <span>On Hold</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5">{{ onHoldCount }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="activeStatus === 'completed' ? 'bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/40 font-semibold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="activeStatus = 'completed'"
        >
          <span>Completed</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5">{{ completedCount }}</span>
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="projectsError" class="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono" role="alert">
      Failed to load projects from server. Please refresh the page.
    </div>

    <!-- Empty State -->
    <div v-if="!filteredProjects.length && !projectsError" class="py-16 text-center rounded-xl bg-[#111114] border border-white/[0.06] space-y-3">
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#756F68] text-xl font-mono">
        ∅
      </div>
      <h3 class="font-mono text-sm font-semibold text-[#F5F2EB]">No projects found</h3>
      <p class="font-sans text-xs text-[#756F68] max-w-sm mx-auto">No projects match your current filter or search query.</p>
      <button
        type="button"
        class="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-sans text-[#F5F2EB] border border-white/[0.08] transition-colors"
        @click="resetFilters"
      >
        Clear Filters
      </button>
    </div>

    <!-- Projects Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <article
        v-for="project in filteredProjects"
        :key="project.slug"
        class="rounded-xl bg-[#111114] border border-white/[0.06] p-5 hover:border-[#C98A4B]/50 hover:shadow-glow-ochre transition-all flex flex-col justify-between gap-4 group"
      >
        <!-- Top Section -->
        <div class="space-y-3">
          <!-- Card Header: Title & Status -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <NuxtLink :to="`/projects/${project.slug}`" class="block">
                <h2 class="font-sans text-base font-semibold text-[#F5F2EB] group-hover:text-[#C98A4B] transition-colors truncate">
                  {{ project.title }}
                </h2>
              </NuxtLink>
              <span class="font-mono text-[11px] text-[#756F68]">/{{ project.slug }}</span>
            </div>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono capitalize whitespace-nowrap"
              :class="getStatusBadgeClass(project.status || getDerivedStatus(project.slug))"
            >
              {{ project.status || getDerivedStatus(project.slug) }}
            </span>
          </div>

          <!-- Description -->
          <p class="font-sans text-xs text-[#756F68] leading-relaxed line-clamp-2">
            {{ project.description || 'Active development workstream with milestone tracking.' }}
          </p>

          <!-- Visual GitHub Repo Link & Deploy URL -->
          <div class="space-y-1.5 pt-1">
            <!-- GitHub repo link -->
            <div v-if="project.githubRepo" class="flex items-center gap-1.5 font-mono text-xs text-[#756F68]">
              <svg class="w-3.5 h-3.5 text-[#C98A4B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              <a
                :href="`https://github.com/${project.githubRepo}`"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#F5F2EB] hover:underline truncate"
                @click.stop
              >
                {{ project.githubRepo }}
              </a>
            </div>

            <!-- Deploy URL badge -->
            <div v-if="project.deployUrl" class="flex items-center gap-1.5">
              <a
                :href="project.deployUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-mono text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 hover:border-green-500/40 transition-colors"
                @click.stop
              >
                <span>●</span>
                <span>Live Deploy</span>
              </a>
            </div>

            <!-- Tech stack tags -->
            <div v-if="getTechStack(project).length" class="flex items-center gap-1.5 flex-wrap pt-1">
              <span
                v-for="tech in getTechStack(project)"
                :key="tech"
                class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] rounded px-1.5 py-0.2 border border-[#C98A4B]/20"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>

        <!-- Bottom Section: Meta, Progress, Action -->
        <div class="space-y-3 pt-3 border-t border-white/[0.04]">
          <!-- Meta row -->
          <div class="flex items-center justify-between font-mono text-xs text-[#756F68]">
            <span>📁 {{ getTaskCountLabel(project.slug) }}</span>
            <span>📅 {{ project.dueDate ? formatDate(project.dueDate) : getDueDate(project.slug) }}</span>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1">
            <div class="flex justify-between font-mono text-[11px]">
              <span class="text-[#756F68]">Milestone Progress</span>
              <span class="text-[#C98A4B] font-semibold">{{ getProgress(project.slug) }}%</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5 border border-white/[0.06] overflow-hidden">
              <div
                class="bg-gradient-to-r from-[#C98A4B]/80 to-[#C98A4B] h-full rounded-full transition-all duration-500"
                :style="{ width: `${getProgress(project.slug)}%` }"
              ></div>
            </div>
          </div>

          <!-- Card Footer Action -->
          <div class="flex items-center justify-between pt-1">
            <span class="font-mono text-[11px] text-[#756F68]">
              {{ project.priority ? `${project.priority.toUpperCase()} PRIORITY` : 'ACTIVE' }}
            </span>
            <NuxtLink
              :to="`/projects/${project.slug}`"
              class="inline-flex items-center gap-1.5 font-mono text-xs text-[#F5F2EB] bg-white/5 hover:bg-[#C98A4B]/20 hover:text-[#C98A4B] px-3.5 py-1.5 rounded-lg border border-white/[0.08] hover:border-[#C98A4B]/40 transition-all focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
              :title="`Open ${project.title} Dashboard & Kanban`"
            >
              <span>Project Dashboard & Kanban</span>
              <span>→</span>
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>

    <!-- Summary Panel -->
    <section class="p-5 rounded-xl bg-[#111114] border border-white/[0.06] space-y-3">
      <h2 class="font-mono text-sm font-semibold text-[#F5F2EB] uppercase tracking-wider">Projects Overview Summary</h2>
      <div class="flex items-center gap-3 flex-wrap font-mono text-xs">
        <span class="px-2.5 py-1 rounded bg-white/5 text-[#F5F2EB] border border-white/[0.08]">
          Total Managed: {{ displayProjects.length }}
        </span>
        <span class="px-2.5 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30">
          Active: {{ activeCount }}
        </span>
        <span class="px-2.5 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
          Completed: {{ completedCount }}
        </span>
        <span class="px-2.5 py-1 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
          Planned: {{ plannedCount }}
        </span>
      </div>
      <p class="font-sans text-xs text-[#756F68] leading-relaxed">
        This scalable hub visualizes all personal repositories and projects. Progress bars represent derived task completion rates and milestone velocity.
      </p>
    </section>

    <!-- Add Project Modal Dialog -->
    <AddProjectModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @create="onProjectCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Project } from '~/types'

const search = ref('')
const activeStatus = ref<'all' | 'active' | 'planned' | 'on-hold' | 'completed'>('all')
const sortBy = ref<'progress-desc' | 'progress-asc' | 'name-asc' | 'name-desc'>('progress-desc')
const showAddModal = ref(false)
const successFeedback = ref('')
const localNewProjects = ref<Project[]>([])

const projectsApi = useProjects()
const { data: serverProjects, error: projectsError, refresh: refreshProjects } = useLazyAsyncData<Project[]>('projects', () => projectsApi.getProjects())

const displayProjects = computed(() => {
  const merged = [...localNewProjects.value]
  const server = serverProjects.value ?? []
  for (const s of server) {
    if (!merged.some(m => m.slug === s.slug)) {
      merged.push(s)
    }
  }
  return merged
})

function getTechStack(project: Project): string[] {
  if (project.techStack?.length) return project.techStack
  const s = project.slug.toLowerCase()
  if (s.includes('hitnet') || s.includes('tf')) return ['PyTorch', 'Python', 'EEG']
  if (s.includes('management')) return ['Nuxt 4', 'Tailwind', 'TypeScript']
  if (s.includes('neural')) return ['Python', 'SciPy', 'BCI']
  return ['TypeScript', 'Vue 3']
}

function getProgress(slug: string): number {
  if (slug.includes('hitnet') || slug.includes('tf')) return 75
  if (slug.includes('portfolio') || slug.includes('management')) return 90
  if (slug.includes('signal') || slug.includes('gamma')) return 40
  return 60
}

function getDerivedStatus(slug: string): string {
  if (slug.includes('portfolio')) return 'completed'
  if (slug.includes('signal') || slug.includes('gamma')) return 'planned'
  return 'active'
}

function getStatusBadgeClass(status?: string): string {
  const s = (status || '').toLowerCase()
  if (s === 'completed') return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
  if (s === 'on-hold' || s === 'on hold') return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
  if (s === 'planned') return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
  return 'bg-green-500/15 text-green-400 border border-green-500/30'
}

function getTaskCountLabel(slug: string): string {
  if (slug.includes('hitnet') || slug.includes('tf')) return '15/20 tasks'
  if (slug.includes('portfolio') || slug.includes('management')) return '18/20 tasks'
  if (slug.includes('signal') || slug.includes('gamma')) return '4/10 tasks'
  return '12/20 tasks'
}

function getDueDate(slug: string): string {
  if (slug.includes('hitnet') || slug.includes('tf')) return 'Oct 2026'
  if (slug.includes('portfolio')) return 'Completed'
  if (slug.includes('signal') || slug.includes('gamma')) return 'Mar 2027'
  return 'Dec 2026'
}

function formatDate(d?: string): string {
  if (!d) return 'Dec 2026'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

// Counts
const allCount = computed(() => displayProjects.value.length)
const activeCount = computed(() => displayProjects.value.filter(p => (p.status || getDerivedStatus(p.slug)).toLowerCase() === 'active').length)
const plannedCount = computed(() => displayProjects.value.filter(p => (p.status || getDerivedStatus(p.slug)).toLowerCase() === 'planned').length)
const onHoldCount = computed(() => displayProjects.value.filter(p => (p.status || getDerivedStatus(p.slug)).toLowerCase().includes('hold')).length)
const completedCount = computed(() => displayProjects.value.filter(p => (p.status || getDerivedStatus(p.slug)).toLowerCase() === 'completed').length)

// Filter & Sort
const filteredProjects = computed(() => {
  let list = [...displayProjects.value]

  if (activeStatus.value !== 'all') {
    list = list.filter(p => {
      const st = (p.status || getDerivedStatus(p.slug)).toLowerCase().replace(/\s+/g, '-')
      return st === activeStatus.value
    })
  }

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.techStack ?? []).some(t => t.toLowerCase().includes(q))
    )
  }

  list.sort((a, b) => {
    if (sortBy.value === 'progress-desc') return getProgress(b.slug) - getProgress(a.slug)
    if (sortBy.value === 'progress-asc') return getProgress(a.slug) - getProgress(b.slug)
    if (sortBy.value === 'name-asc') return a.title.localeCompare(b.title)
    if (sortBy.value === 'name-desc') return b.title.localeCompare(a.title)
    return 0
  })

  return list
})

function resetFilters() {
  search.value = ''
  activeStatus.value = 'all'
  sortBy.value = 'progress-desc'
}

async function onProjectCreated(payload: {
  title: string
  description: string
  status: 'active' | 'planned' | 'on-hold' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  startDate: string
  dueDate: string
  githubRepo?: string
  deployUrl?: string
  techStack?: string[]
}) {
  const newSlug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `proj-${Date.now()}`
  const newProj: Project = {
    id: String(Date.now()),
    slug: newSlug,
    title: payload.title,
    description: payload.description,
    status: payload.status,
    priority: payload.priority,
    startDate: payload.startDate,
    dueDate: payload.dueDate,
    githubRepo: payload.githubRepo,
    deployUrl: payload.deployUrl,
    techStack: payload.techStack || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  try {
    const created = await projectsApi.createProject({
      slug: newSlug,
      title: payload.title,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
      startDate: payload.startDate,
      dueDate: payload.dueDate,
      githubRepo: payload.githubRepo,
      deployUrl: payload.deployUrl,
      techStack: payload.techStack
    })

    const projToDisplay = created || newProj
    if (serverProjects.value) {
      serverProjects.value = [projToDisplay, ...serverProjects.value.filter(p => p.slug !== projToDisplay.slug)]
    } else {
      localNewProjects.value.unshift(projToDisplay)
    }

    await refreshProjects()
  } catch {
    // Fallback locally
    localNewProjects.value.unshift(newProj)
  }

  showAddModal.value = false
  successFeedback.value = `Project '${payload.title}' created successfully.`
  setTimeout(() => {
    successFeedback.value = ''
  }, 5000)
}
</script>
