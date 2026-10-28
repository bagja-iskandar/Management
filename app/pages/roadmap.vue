<template>
  <div class="space-y-6 pb-12">
    <!-- Header Section -->
    <div class="flex items-center justify-between gap-3 pb-1">
      <h1 class="font-sans text-xl sm:text-2xl font-semibold text-[#F3F4F6] tracking-tight">
        Architecture Roadmap
      </h1>

      <div class="flex items-center gap-2">
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.08] transition"
        >
          <span>Projects Hub</span>
          <NexuraIcon name="ArrowRight" size="xs" />
        </NuxtLink>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="projectsError"
      class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2"
      role="alert"
    >
      <NexuraIcon name="AlertTriangle" size="sm" class="shrink-0" />
      <span>Failed to load roadmap projects from server.</span>
    </div>

    <!-- Segmented Tabs View Filter -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Roadmap View Filter">
      <div class="p-1 rounded-lg bg-[#07080A] border border-white/[0.06] inline-flex items-center gap-1">
        <button
          type="button"
          class="px-3 py-1.5 rounded-md text-xs font-mono transition-all border flex items-center gap-1.5 focus:outline-none shrink-0 cursor-pointer"
          :class="roadmapFilter === 'all'
            ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
          @click="roadmapFilter = 'all'"
        >
          <NexuraIcon name="Layers" size="xs" />
          <span>All Architecture</span>
          <span class="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded-full font-mono tabular-nums text-[#8A8F9E]">
            {{ (projects || []).length }}
          </span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-md text-xs font-mono transition-all border flex items-center gap-1.5 focus:outline-none shrink-0 cursor-pointer"
          :class="roadmapFilter === 'milestones'
            ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
          @click="roadmapFilter = 'milestones'"
        >
          <NexuraIcon name="Zap" size="xs" />
          <span>Active Milestones</span>
          <span class="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded-full font-mono tabular-nums text-[#8A8F9E]">
            {{ activeMilestonesCount }}
          </span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-md text-xs font-mono transition-all border flex items-center gap-1.5 focus:outline-none shrink-0 cursor-pointer"
          :class="roadmapFilter === 'maintenance'
            ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
          @click="roadmapFilter = 'maintenance'"
        >
          <NexuraIcon name="Activity" size="xs" />
          <span>Live & Maintenance</span>
          <span class="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded-full font-mono tabular-nums text-[#8A8F9E]">
            {{ maintenanceCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Empty Filter State -->
    <div
      v-if="!filteredProjects.length"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-white/[0.07] space-y-3"
    >
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#565B68]">
        <NexuraIcon name="Inbox" size="lg" />
      </div>
      <h3 class="font-sans text-sm font-semibold text-[#F3F4F6]">
        {{ (projects || []).length === 0 ? 'No projects registered' : 'No projects in this category' }}
      </h3>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto leading-relaxed">
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
      <div class="absolute left-4 sm:left-8 top-4 bottom-4 w-0.5 bg-white/[0.08]" aria-hidden="true"></div>

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
              class="w-4 h-4 rounded-full border-4 border-[#0B0C10] bg-emerald-400 ring-4 ring-emerald-400/20 transition-transform hover:scale-125"
              title="Live in Production / Maintenance"
            ></div>
            <!-- Active Development Milestone Dot (Indigo) -->
            <div
              v-else-if="isMilestoneActive(milestone)"
              class="w-4 h-4 rounded-full border-4 border-[#0B0C10] bg-indigo-400 ring-4 ring-indigo-400/20 transition-transform hover:scale-125"
              title="Active Development Milestone"
            ></div>
            <!-- Planned Milestone Dot (Dim) -->
            <div
              v-else
              class="w-4 h-4 rounded-full border-4 border-[#0B0C10] bg-[#565B68] ring-4 ring-white/[0.05] transition-transform hover:scale-125"
              title="Planned Milestone"
            ></div>
          </div>

          <!-- Card Component -->
          <article
            class="ml-10 sm:ml-16 w-full p-5 sm:p-6 rounded-2xl bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] transition-all group shadow-sm"
            :class="isLiveMaintenance(milestone)
              ? 'hover:border-emerald-500/30 hover:shadow-[0_0_24px_rgba(16,185,129,0.08)]'
              : 'hover:border-indigo-500/30 hover:shadow-[0_0_24px_rgba(99,102,241,0.08)]'"
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
                    class="font-mono tabular-nums text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
                  >
                    PHASE {{ String(idx + 1).padStart(2, '0') }}
                  </span>

                  <span class="text-white/20 select-none">•</span>

                  <h2
                    class="font-sans text-base sm:text-lg font-semibold text-[#F3F4F6] transition-colors"
                    :class="isLiveMaintenance(milestone) ? 'group-hover:text-emerald-300' : 'group-hover:text-indigo-300'"
                  >
                    {{ milestone.title }}
                  </h2>
                </div>
                <span class="font-mono text-xs text-[#565B68] mt-1 block">/{{ milestone.slug }}</span>
              </div>

              <!-- Status Badge & Quick Live Link -->
              <div class="flex items-center gap-2 flex-wrap">
                <!-- Direct Live App Link if deployed -->
                <a
                  v-if="milestone.deployUrl"
                  :href="milestone.deployUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group/link"
                  :title="`Open live site: ${milestone.deployUrl}`"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Live App</span>
                  <NexuraIcon name="ExternalLink" size="xs" class="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </a>

                <!-- Status Badge -->
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono capitalize border font-medium"
                  :class="getStatusBadgeClass(milestone.status)"
                >
                  {{ milestone.status || 'Active' }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="font-sans text-xs text-[#8A8F9E] mt-3 leading-relaxed">
              {{ milestone.description || (isLiveMaintenance(milestone)
                ? 'Production application running live. Ongoing performance maintenance, bugfixes, and iterative enhancements.'
                : 'Active milestone deliverable under development towards production release.') }}
            </p>

            <!-- Metadata 3-Column Bento Grid -->
            <div class="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <!-- Tile 1: Timeline Target / Lifecycle Mode -->
              <div class="p-3 rounded-xl bg-[#07080A] border border-white/[0.06]">
                <span class="text-[10px] text-[#8A8F9E] uppercase tracking-wider block font-mono">
                  {{ isLiveMaintenance(milestone) ? 'Operational Mode' : 'Timeline Target' }}
                </span>
                <span
                  v-if="isLiveMaintenance(milestone)"
                  class="text-emerald-400 mt-1 font-semibold block truncate"
                >
                  Continuous Maintenance
                </span>
                <span v-else class="text-[#F3F4F6] mt-1 block truncate tabular-nums">
                  {{ formatDate(milestone.startDate) }} – {{ formatDate(milestone.dueDate) }}
                </span>
              </div>

              <!-- Tile 2: Linked / Maintenance Tasks Count -->
              <div class="p-3 rounded-xl bg-[#07080A] border border-white/[0.06]">
                <span class="text-[10px] text-[#8A8F9E] uppercase tracking-wider block font-mono">
                  {{ isLiveMaintenance(milestone) ? 'Maintenance Deliverables' : 'Linked Tasks' }}
                </span>
                <span class="text-[#F3F4F6] mt-1 block tabular-nums">
                  {{ getProjectTasks(milestone.slug).length }} tasks
                  <span class="text-emerald-400 text-[11px]">({{ getCompletedTasks(milestone.slug).length }} deployed)</span>
                </span>
              </div>

              <!-- Tile 3: Repository Connection -->
              <div class="p-3 rounded-xl bg-[#07080A] border border-white/[0.06]">
                <span class="text-[10px] text-[#8A8F9E] uppercase tracking-wider block font-mono">Repository</span>
                <span class="text-indigo-300/90 mt-1 block truncate font-medium">
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
                  class="font-mono text-[10px] bg-white/[0.04] text-[#8A8F9E] border border-white/[0.06] rounded px-2 py-0.5"
                >
                  {{ tech }}
                </span>
              </div>
              <div v-else></div>

              <NuxtLink
                :to="`/projects/${milestone.slug}`"
                class="inline-flex items-center justify-center gap-1.5 font-mono text-xs px-3.5 py-1.5 rounded-lg border transition-all focus:outline-none"
                :class="isLiveMaintenance(milestone)
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F4F6] border border-white/[0.08]'"
              >
                <span>{{ isLiveMaintenance(milestone) ? 'Open Maintenance Console' : 'View Milestone Detail' }}</span>
                <NexuraIcon name="ArrowRight" size="xs" />
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
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
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
  if (s === 'maintenance') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
  if (s === 'completed' || s === 'deployed') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (s === 'on-hold') return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (s === 'planned') return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
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
