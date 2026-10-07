<template>
  <div class="space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
      <div>
        <div class="inline-flex items-center gap-1.5 font-mono text-xs text-[#C98A4B] bg-[#C98A4B]/10 px-2.5 py-0.5 rounded border border-[#C98A4B]/20 uppercase tracking-wider mb-2">
          <span>◆</span>
          <span>Timeline & Lifecycle View</span>
        </div>
        <h1 class="font-mono text-xl sm:text-2xl font-bold text-[#F5F2EB]">Architecture Roadmap</h1>
        <p class="font-sans text-xs text-[#756F68] mt-1">
          Engineering development milestones, chronological releases, and live maintenance operations.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C98A4B]/10 hover:bg-[#C98A4B]/20 text-[#C98A4B] font-mono text-xs font-semibold border border-[#C98A4B]/30 transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
        >
          <span>Projects Hub</span>
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

    <!-- Error State -->
    <div v-if="projectsError" class="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono" role="alert">
      Failed to load roadmap projects from server.
    </div>

    <!-- View Mode Filter Strip -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Roadmap View Filter">
      <button
        type="button"
        class="px-3 py-1.5 rounded-xl text-xs font-mono transition-all border flex items-center gap-1.5 focus:outline-none shrink-0"
        :class="roadmapFilter === 'all'
          ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40 font-bold shadow-[0_0_12px_rgba(201,138,75,0.15)]'
          : 'bg-[#111114] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB] hover:bg-white/5'"
        @click="roadmapFilter = 'all'"
      >
        <span>All Architecture</span>
        <span class="text-[10px] bg-white/5 px-1.5 py-0.2 rounded-full">{{ (projects || []).length }}</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl text-xs font-mono transition-all border flex items-center gap-1.5 focus:outline-none shrink-0"
        :class="roadmapFilter === 'milestones'
          ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40 font-bold shadow-[0_0_12px_rgba(201,138,75,0.15)]'
          : 'bg-[#111114] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB] hover:bg-white/5'"
        @click="roadmapFilter = 'milestones'"
      >
        <span>🚀 Active Milestones</span>
        <span class="text-[10px] bg-white/5 px-1.5 py-0.2 rounded-full">{{ activeMilestonesCount }}</span>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 rounded-xl text-xs font-mono transition-all border flex items-center gap-1.5 focus:outline-none shrink-0"
        :class="roadmapFilter === 'maintenance'
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]'
          : 'bg-[#111114] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB] hover:bg-white/5'"
        @click="roadmapFilter = 'maintenance'"
      >
        <span>⚡ Live & Maintenance</span>
        <span class="text-[10px] bg-white/5 px-1.5 py-0.2 rounded-full">{{ maintenanceCount }}</span>
      </button>
    </div>

    <!-- Empty Filter State -->
    <div
      v-if="!filteredProjects.length"
      class="py-16 text-center rounded-2xl bg-[#111114] border border-white/[0.06] space-y-2"
    >
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-lg font-mono text-[#756F68]">
        ∅
      </div>
      <h3 class="font-mono text-sm font-semibold text-[#F5F2EB]">
        {{ (projects || []).length === 0 ? 'No projects registered' : 'No projects in this category' }}
      </h3>
      <p class="font-sans text-xs text-[#756F68] max-w-sm mx-auto">
        {{ (projects || []).length === 0
          ? 'No projects found in the workspace. Ensure your database is connected or create a project in Projects Hub to start tracking milestones.'
          : (roadmapFilter === 'maintenance'
            ? 'No projects currently in Maintenance mode. Deployed projects can be transitioned to Maintenance anytime.'
            : 'All active projects are currently in Live Maintenance mode.') }}
      </p>
    </div>

    <!-- Vertical Timeline Container -->
    <div v-else class="relative py-4">
      <!-- Vertical timeline spine line -->
      <div class="absolute left-4 sm:left-8 top-4 bottom-4 w-0.5 bg-[#C98A4B]/20" aria-hidden="true"></div>

      <!-- Timeline Items -->
      <div class="space-y-8">
        <div
          v-for="(milestone, idx) in filteredProjects"
          :key="milestone.slug"
          class="relative flex items-start"
        >
          <!-- Timeline Dot Marker -->
          <div class="absolute left-4 sm:left-8 -translate-x-1/2 mt-4 z-10">
            <!-- Maintenance/Live Dot (Emerald Pulse) -->
            <div
              v-if="isLiveMaintenance(milestone)"
              class="w-4 h-4 rounded-full border-4 border-[#09090B] bg-emerald-400 ring-4 ring-emerald-400/25 transition-transform hover:scale-125"
              title="Live in Production / Maintenance"
            ></div>
            <!-- Active Development Milestone Dot (Ochre) -->
            <div
              v-else
              class="w-4 h-4 rounded-full border-4 border-[#09090B] transition-transform hover:scale-125"
              :class="isMilestoneActive(milestone) ? 'bg-[#C98A4B] ring-4 ring-[#C98A4B]/20' : 'bg-[#756F68]'"
            ></div>
          </div>

          <!-- Card Component -->
          <article
            class="ml-10 sm:ml-16 w-full p-5 sm:p-6 rounded-2xl bg-[#111114] transition-all group shadow-lg"
            :class="isLiveMaintenance(milestone)
              ? 'border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.12)]'
              : 'border border-white/[0.06] hover:border-[#C98A4B]/50 hover:shadow-glow-ochre'"
          >
            <!-- Top Header: Phase/Status & Title -->
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-white/[0.04]">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Live Ops Label for Deployed/Maintenance -->
                  <span
                    v-if="isLiveMaintenance(milestone)"
                    class="font-mono text-xs text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>LIVE OPERATIONS</span>
                  </span>
                  <!-- Development Phase for In-Progress -->
                  <span
                    v-else
                    class="font-mono text-xs text-[#C98A4B] font-semibold bg-[#C98A4B]/10 px-2 py-0.5 rounded border border-[#C98A4B]/20"
                  >
                    PHASE {{ String(idx + 1).padStart(2, '0') }}
                  </span>

                  <span class="text-white/20 select-none">•</span>

                  <h2
                    class="font-mono text-lg font-semibold text-[#F5F2EB] transition-colors"
                    :class="isLiveMaintenance(milestone) ? 'group-hover:text-emerald-400' : 'group-hover:text-[#C98A4B]'"
                  >
                    {{ milestone.title }}
                  </h2>
                </div>
                <span class="font-mono text-xs text-[#756F68] mt-1 block">/{{ milestone.slug }}</span>
              </div>

              <!-- Status Badge & Quick Live Link -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Direct Live App Link if deployed -->
                <a
                  v-if="milestone.deployUrl"
                  :href="milestone.deployUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all group"
                  :title="`Open live site: ${milestone.deployUrl}`"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Live App</span>
                  <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>

                <!-- Status Badge -->
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono capitalize border"
                  :class="getStatusBadgeClass(milestone.status)"
                >
                  {{ milestone.status || 'Active' }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="font-sans text-xs text-[#756F68] mt-3 leading-relaxed">
              {{ milestone.description || (isLiveMaintenance(milestone)
                ? 'Production application running live. Ongoing performance maintenance, bugfixes, and iterative enhancements.'
                : 'Active milestone deliverable under development towards production release.') }}
            </p>

            <!-- Metadata 3-Column Bento Grid -->
            <div class="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <!-- Tile 1: Timeline Target / Lifecycle Mode -->
              <div class="p-3 rounded-xl bg-[#09090B]/80 border border-white/[0.04]">
                <span class="text-[10px] text-[#756F68] uppercase tracking-wider block">
                  {{ isLiveMaintenance(milestone) ? 'Operational Mode' : 'Timeline Target' }}
                </span>
                <span
                  v-if="isLiveMaintenance(milestone)"
                  class="text-emerald-400 mt-1 font-semibold block truncate flex items-center gap-1.5"
                >
                  <span>Continuous Maintenance</span>
                </span>
                <span v-else class="text-[#F5F2EB] mt-1 block truncate">
                  {{ formatDate(milestone.startDate) }} – {{ formatDate(milestone.dueDate) }}
                </span>
              </div>

              <!-- Tile 2: Linked / Maintenance Tasks Count -->
              <div class="p-3 rounded-xl bg-[#09090B]/80 border border-white/[0.04]">
                <span class="text-[10px] text-[#756F68] uppercase tracking-wider block">
                  {{ isLiveMaintenance(milestone) ? 'Maintenance Deliverables' : 'Linked Tasks' }}
                </span>
                <span class="text-[#F5F2EB] mt-1 block">
                  {{ getProjectTasks(milestone.slug).length }} tasks
                  <span class="text-green-400 text-[11px]">({{ getCompletedTasks(milestone.slug).length }} deployed)</span>
                </span>
              </div>

              <!-- Tile 3: Repository Connection -->
              <div class="p-3 rounded-xl bg-[#09090B]/80 border border-white/[0.04]">
                <span class="text-[10px] text-[#756F68] uppercase tracking-wider block">Repository</span>
                <span class="text-[#C98A4B] mt-1 block truncate font-medium">
                  {{ milestone.githubRepo || milestone.slug }}
                </span>
              </div>
            </div>

            <!-- Footer: Tech Tags & Direct Navigation Action -->
            <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div v-if="milestone.techStack?.length" class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="tech in milestone.techStack"
                  :key="tech"
                  class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] rounded px-2 py-0.5 border border-[#C98A4B]/20"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-else></div>

              <NuxtLink
                :to="`/projects/${milestone.slug}`"
                class="inline-flex items-center justify-center gap-1.5 font-mono text-xs px-3.5 py-1.5 rounded-lg border transition-all focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
                :class="isLiveMaintenance(milestone)
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'text-[#F5F2EB] bg-white/5 border-white/[0.08] hover:bg-[#C98A4B]/15 hover:text-[#C98A4B] hover:border-[#C98A4B]/30'"
              >
                <span>{{ isLiveMaintenance(milestone) ? 'Open Maintenance Console' : 'View Milestone Detail' }}</span>
                <span>→</span>
              </NuxtLink>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Project, Task } from '~/types'

const projectsApi = useProjects()
const tasksApi = useTasks()

const { data: projects, error: projectsError } = useLazyAsyncData<Project[]>('roadmap-projects', () => projectsApi.getProjects())

const { data: tasks } = useLazyAsyncData<Task[]>('roadmap-tasks', () => tasksApi.getTasks())

// View filter state
const roadmapFilter = ref<'all' | 'milestones' | 'maintenance'>('all')

function isLiveMaintenance(p: Project): boolean {
  const s = (p.status || '').toLowerCase()
  return s === 'maintenance' || s === 'completed' || Boolean(p.deployUrl && s !== 'active')
}

const activeMilestonesCount = computed(() => {
  return (projects.value || []).filter(p => !isLiveMaintenance(p)).length
})

const maintenanceCount = computed(() => {
  return (projects.value || []).filter(p => isLiveMaintenance(p)).length
})

const filteredProjects = computed<Project[]>(() => {
  const list = [...(projects.value ?? [])]
  list.sort((a, b) => {
    // Put active development milestones first, or sort by start date
    const aMaint = isLiveMaintenance(a)
    const bMaint = isLiveMaintenance(b)
    if (aMaint !== bMaint) return aMaint ? 1 : -1
    return (a.startDate || '').localeCompare(b.startDate || '')
  })

  if (roadmapFilter.value === 'milestones') {
    return list.filter(p => !isLiveMaintenance(p))
  }
  if (roadmapFilter.value === 'maintenance') {
    return list.filter(p => isLiveMaintenance(p))
  }
  return list
})

function isMilestoneActive(p: Project): boolean {
  const s = (p.status || '').toLowerCase()
  return s === 'active' || s === 'completed' || s === 'maintenance'
}

function getStatusBadgeClass(status?: string): string {
  const s = (status || '').toLowerCase()
  if (s === 'maintenance') return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
  if (s === 'completed' || s === 'deployed') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (s === 'on-hold') return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
  if (s === 'planned') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  return 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/30'
}

function formatDate(d?: string): string {
  if (!d) return 'TBD'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

function getProjectTasks(slug: string): Task[] {
  const all = tasks.value ?? []
  return all.filter(t => (t.projectSlug || '').toLowerCase() === slug.toLowerCase())
}

function getCompletedTasks(slug: string): Task[] {
  return getProjectTasks(slug).filter(t => t.status === 'deployed')
}
</script>
