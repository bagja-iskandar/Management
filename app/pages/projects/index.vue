<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
      <div>
        <div class="inline-flex items-center gap-1.5 font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-wider mb-2">
          <span>◆</span>
          <span>Projects Hub</span>
        </div>
        <h1 class="font-mono text-2xl font-bold text-[#F3F4F6]">Projects</h1>
        <p class="font-sans text-xs text-[#8A8F9E] mt-1">Managed personal repositories, status tracking, and derived task milestones.</p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <NuxtLink
          to="/repos"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition-all focus:ring-1 focus:ring-indigo-500/50 focus:outline-none shadow-[0_0_16px_rgba(99,102,241,0.25)] active:scale-95"
        >
          <NexuraIcon name="GitBranch" size="xs" />
          <span>Import from GitHub Repos</span>
          <NexuraIcon name="ArrowRight" size="xs" />
        </NuxtLink>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#F3F4F6] font-mono text-xs font-medium border border-white/[0.08] transition-colors focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
        >
          <NexuraIcon name="ArrowLeft" size="xs" class="text-[#8A8F9E]" />
          <span>Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Success Feedback Alert -->
    <div
      v-if="successFeedback"
      class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono flex items-center justify-between"
      role="status"
    >
      <div class="flex items-center gap-2">
        <NexuraIcon name="CheckCircle2" size="xs" class="text-emerald-400" />
        <span>{{ successFeedback }}</span>
      </div>
      <button type="button" class="text-xs text-emerald-400 hover:underline" @click="successFeedback = ''">Dismiss</button>
    </div>

    <!-- Toolbar: Search, Sort & Status Tabs -->
    <div class="obs-card p-4 rounded-2xl bg-[#111318] border border-white/[0.07] shadow-sm space-y-4">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search -->
        <div class="relative flex-1">
          <input
            v-model="search"
            type="search"
            placeholder="Filter projects by title, description, or stack..."
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
            aria-label="Filter projects"
          />
        </div>

        <!-- Sort Select -->
        <select
          v-model="sortBy"
          class="bg-[#07080A] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
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
          class="px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer"
          :class="activeStatus === 'all' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.06] hover:text-[#F3F4F6]'"
          @click="activeStatus = 'all'"
        >
          <span>All</span>
          <span class="text-[10px] tabular-nums px-1.5 py-0.2 rounded-full bg-white/5">{{ allCount }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer"
          :class="activeStatus === 'active' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.06] hover:text-[#F3F4F6]'"
          @click="activeStatus = 'active'"
        >
          <span>Active</span>
          <span class="text-[10px] tabular-nums px-1.5 py-0.2 rounded-full bg-white/5">{{ activeCount }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer"
          :class="activeStatus === 'planned' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.06] hover:text-[#F3F4F6]'"
          @click="activeStatus = 'planned'"
        >
          <span>Planned</span>
          <span class="text-[10px] tabular-nums px-1.5 py-0.2 rounded-full bg-white/5">{{ plannedCount }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer"
          :class="activeStatus === 'on-hold' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.06] hover:text-[#F3F4F6]'"
          @click="activeStatus = 'on-hold'"
        >
          <span>On Hold</span>
          <span class="text-[10px] tabular-nums px-1.5 py-0.2 rounded-full bg-white/5">{{ onHoldCount }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer"
          :class="activeStatus === 'completed' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.06] hover:text-[#F3F4F6]'"
          @click="activeStatus = 'completed'"
        >
          <span>Completed</span>
          <span class="text-[10px] tabular-nums px-1.5 py-0.2 rounded-full bg-white/5">{{ completedCount }}</span>
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="projectsError" class="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono" role="alert">
      Failed to load projects from server. Please refresh the page.
    </div>

    <!-- Empty State -->
    <div v-if="!filteredProjects.length && !projectsError" class="py-16 text-center rounded-2xl bg-[#111318] border border-white/[0.06] space-y-3">
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#8A8F9E]">
        <NexuraIcon name="Folder" size="lg" />
      </div>
      <h3 class="font-mono text-sm font-semibold text-[#F3F4F6]">No projects found</h3>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">No projects match your current filter or search query.</p>
      <button
        type="button"
        class="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#F3F4F6] border border-white/[0.08] transition-colors cursor-pointer"
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
        class="obs-card rounded-2xl bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] p-5 hover:shadow-lg transition-all flex flex-col justify-between gap-4 group"
      >
        <!-- Top Section -->
        <div class="space-y-3">
          <!-- Card Header: Title & Status -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <NuxtLink :to="`/projects/${project.slug}`" class="block">
                <h2 class="font-sans text-base font-semibold text-[#F3F4F6] group-hover:text-indigo-400 transition-colors truncate">
                  {{ project.title }}
                </h2>
              </NuxtLink>
              <span class="font-mono text-[11px] text-[#8A8F9E]">/{{ project.slug }}</span>
            </div>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono capitalize whitespace-nowrap border"
              :class="getStatusBadgeClass(project.status || getDerivedStatus(project.slug))"
            >
              {{ project.status || getDerivedStatus(project.slug) }}
            </span>
          </div>

          <!-- Description -->
          <p class="font-sans text-xs text-[#8A8F9E] leading-relaxed line-clamp-2">
            {{ project.description || 'Active development workstream with milestone tracking.' }}
          </p>

          <!-- Visual GitHub Repo Link & Deploy URL -->
          <div class="space-y-1.5 pt-1">
            <!-- GitHub repo link -->
            <div v-if="project.githubRepo" class="flex items-center gap-1.5 font-mono text-xs text-[#8A8F9E]">
              <NexuraIcon name="GitBranch" size="xs" class="text-indigo-400 shrink-0" />
              <a
                :href="`https://github.com/${project.githubRepo}`"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#F3F4F6] hover:underline truncate"
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
                class="inline-flex items-center gap-1.5 font-mono text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                @click.stop
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Deploy</span>
              </a>
            </div>

            <!-- Tech stack tags -->
            <div v-if="getTechStack(project).length" class="flex items-center gap-1.5 flex-wrap pt-1">
              <span
                v-for="tech in getTechStack(project)"
                :key="tech"
                class="font-mono text-[10px] bg-white/5 text-[#8A8F9E] rounded-md px-2 py-0.5 border border-white/[0.06]"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>

        <!-- Bottom Section: Meta, Progress, Action -->
        <div class="space-y-3 pt-3 border-t border-white/[0.04]">
          <!-- Meta row -->
          <div class="flex items-center justify-between font-mono text-xs text-[#8A8F9E]">
            <span class="inline-flex items-center gap-1">
              <NexuraIcon name="CheckSquare" size="xs" class="text-[#8A8F9E]" />
              <span class="tabular-nums">{{ getTaskCountLabel(project.slug) }}</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <NexuraIcon name="Calendar" size="xs" class="text-[#8A8F9E]" />
              <span>{{ project.dueDate ? formatDate(project.dueDate) : getDueDate(project.slug) }}</span>
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1">
            <div class="flex justify-between font-mono text-[11px]">
              <span class="text-[#8A8F9E]">Milestone Progress</span>
              <span class="text-indigo-400 font-semibold tabular-nums">{{ getProgress(project.slug) }}%</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5 border border-white/[0.06] overflow-hidden">
              <div
                class="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                :style="{ width: `${getProgress(project.slug)}%` }"
              ></div>
            </div>
          </div>

          <!-- Card Footer Action -->
          <div class="flex items-center justify-between pt-1">
            <span class="font-mono text-[11px] text-[#8A8F9E]">
              {{ project.priority ? `${project.priority.toUpperCase()} PRIORITY` : 'ACTIVE' }}
            </span>
            <NuxtLink
              :to="`/projects/${project.slug}`"
              class="inline-flex items-center gap-1.5 font-mono text-xs text-[#F3F4F6] bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 px-3.5 py-1.5 rounded-xl border border-white/[0.08] hover:border-indigo-500/40 transition-all focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
              :title="`Open ${project.title} Dashboard & Kanban`"
            >
              <span>Dashboard & Kanban</span>
              <NexuraIcon name="ArrowRight" size="xs" />
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>

    <!-- Summary Panel -->
    <section class="obs-card p-5 rounded-2xl bg-[#111318] border border-white/[0.07] space-y-3 shadow-sm">
      <h2 class="font-mono text-sm font-semibold text-[#F3F4F6] uppercase tracking-wider">Projects Overview Summary</h2>
      <div class="flex items-center gap-3 flex-wrap font-mono text-xs tabular-nums">
        <span class="px-2.5 py-1 rounded-lg bg-white/5 text-[#F3F4F6] border border-white/[0.08]">
          Total Managed: {{ displayProjects.length }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Active: {{ activeCount }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
          Completed: {{ completedCount }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
          Planned: {{ plannedCount }}
        </span>
      </div>
      <p class="font-sans text-xs text-[#8A8F9E] leading-relaxed">
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
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'

const { tasks } = useWorkspaceStore()

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
  const projectTasks = (tasks.value || []).filter(t => t.projectSlug === slug)
  if (projectTasks.length === 0) return 0
  const deployed = projectTasks.filter(t => t.status === 'deployed').length
  return Math.round((deployed / projectTasks.length) * 100)
}

function getDerivedStatus(slug: string): string {
  if (slug.includes('portfolio')) return 'completed'
  if (slug.includes('signal') || slug.includes('gamma')) return 'planned'
  return 'active'
}

function getStatusBadgeClass(status?: string): string {
  const s = (status || '').toLowerCase()
  if (s === 'completed') return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
  if (s === 'on-hold' || s === 'on hold') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (s === 'planned') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
}

function getTaskCountLabel(slug: string): string {
  const projectTasks = (tasks.value || []).filter(t => t.projectSlug === slug)
  if (projectTasks.length === 0) return '0/0 tasks'
  const deployed = projectTasks.filter(t => t.status === 'deployed').length
  return `${deployed}/${projectTasks.length} tasks`
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
