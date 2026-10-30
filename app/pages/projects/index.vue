<template>
  <div class="flex flex-col min-h-full">
    <div class="space-y-6 flex-1 pb-6">
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
      <button type="button" class="text-xs text-emerald-400 hover:underline cursor-pointer" @click="successFeedback = ''">Dismiss</button>
    </div>

    <!-- Non-blocking Stale Error Warning -->
    <div
      v-if="isProjectsStaleError"
      class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono flex items-center justify-between"
      role="status"
    >
      <div class="flex items-center gap-2">
        <NexuraIcon name="AlertTriangle" size="xs" class="text-amber-400" />
        <span>Warning: Displaying cached projects. Background synchronization failed.</span>
      </div>
      <button
        type="button"
        class="text-xs underline hover:no-underline font-medium cursor-pointer"
        @click="refreshProjects"
      >
        Retry Sync
      </button>
    </div>

    <!-- Blocking Error State -->
    <div
      v-if="projectsDataState === 'ERROR'"
      class="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center justify-between"
      role="alert"
    >
      <div class="flex items-center gap-2">
        <NexuraIcon name="AlertCircle" size="sm" class="text-rose-400" />
        <span>Failed to load projects from server.</span>
      </div>
      <button
        type="button"
        class="underline hover:no-underline font-medium cursor-pointer"
        @click="refreshProjects"
      >
        Retry
      </button>
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

      <!-- 7-Status Filter Tabs -->
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
          :class="activeStatus === 'maintenance' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.06] hover:text-[#F3F4F6]'"
          @click="activeStatus = 'maintenance'"
        >
          <span>Maintenance</span>
          <span class="text-[10px] tabular-nums px-1.5 py-0.2 rounded-full bg-white/5">{{ maintenanceCount }}</span>
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
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer"
          :class="activeStatus === 'archived' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-semibold shadow-sm' : 'bg-[#07080A] text-[#8A8F9E] border-white/[0.06] hover:text-[#F3F4F6]'"
          @click="activeStatus = 'archived'"
        >
          <span>Archived</span>
          <span class="text-[10px] tabular-nums px-1.5 py-0.2 rounded-full bg-white/5">{{ archivedCount }}</span>
        </button>
      </div>
    </div>

    <!-- Empty Workspace State (SUCCESS_EMPTY) -->
    <div
      v-if="projectsDataState === 'SUCCESS_EMPTY'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-white/[0.06] space-y-3"
    >
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-[#8A8F9E]">
        <NexuraIcon name="Folder" size="lg" />
      </div>
      <h3 class="font-mono text-sm font-semibold text-[#F3F4F6]">No projects in workspace</h3>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">
        Get started by creating your first managed project or repository.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
        @click="showAddModal = true"
      >
        <NexuraIcon name="Plus" size="xs" />
        <span>Create Project</span>
      </button>
    </div>

    <!-- Filter Yields Zero Results -->
    <div
      v-else-if="filteredProjects.length === 0 && projectsDataState !== 'ERROR'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-white/[0.06] space-y-3"
    >
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
          <!-- Card Header: Title, Status Badge & Edit Trigger (PROJ-004) -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <NuxtLink :to="`/projects/${project.slug}`" class="block">
                <h2 class="font-sans text-base font-semibold text-[#F3F4F6] group-hover:text-indigo-400 transition-colors truncate">
                  {{ project.title }}
                </h2>
              </NuxtLink>
              <span class="font-mono text-[11px] text-[#8A8F9E]">/{{ project.slug }}</span>
            </div>

            <!-- Status Badge + Edit Button -->
            <div class="flex items-center gap-1.5 shrink-0">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono capitalize whitespace-nowrap border"
                :class="getStatusBadgeClass(project.status)"
              >
                {{ project.status || 'active' }}
              </span>
              <button
                type="button"
                class="p-1 rounded-lg text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.08] transition-colors focus:outline-none cursor-pointer"
                title="Edit Project Metadata"
                aria-label="Edit project"
                @click.stop="openEditModal(project)"
              >
                <NexuraIcon name="Pencil" size="xs" />
              </button>
            </div>
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

            <!-- Tech stack tags (Honest rendering: only genuine array elements) -->
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
              <span>{{ formatDate(project.dueDate) }}</span>
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
    </div>

    <!-- Sticky Bottom Summary Panel -->
    <section class="sticky bottom-0 z-20 mt-auto obs-card p-4 sm:p-5 rounded-2xl bg-[#111318]/95 backdrop-blur-md border border-white/[0.1] space-y-2 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 class="font-mono text-xs sm:text-sm font-semibold text-[#F3F4F6] uppercase tracking-wider">Projects Overview Summary</h2>
        <p class="font-sans text-[11px] text-[#8A8F9E] hidden md:block">
          Derived task completion rates &amp; milestone velocity.
        </p>
      </div>
      <div class="flex items-center gap-2.5 flex-wrap font-mono text-xs tabular-nums">
        <span class="px-2.5 py-1 rounded-lg bg-white/5 text-[#F3F4F6] border border-white/[0.08]">
          Total: {{ storeProjects.length }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          Active: {{ activeCount }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
          Maintenance: {{ maintenanceCount }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
          Completed: {{ completedCount }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
          Planned: {{ plannedCount }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
          On Hold: {{ onHoldCount }}
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
          Archived: {{ archivedCount }}
        </span>
      </div>
    </section>

    <!-- PROJ-002: Add Project Modal Dialog -->
    <AddProjectModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @create="onProjectCreated"
    />

    <!-- PROJ-004: Edit Project Modal Dialog -->
    <EditProjectModal
      :is-open="isEditModalOpen"
      :project="editingProject"
      @close="closeEditModal"
      @saved="onProjectUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Project } from '~/types'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import EditProjectModal from '~~/components/EditProjectModal.vue'
import AddProjectModal from '~~/components/AddProjectModal.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useProjects } from '~/composables/useProjects'
import { useHeaderActions } from '~/composables/useHeaderActions'

type ProjectsDataState = 'NOT_LOADED' | 'LOADING' | 'SUCCESS_WITH_DATA' | 'SUCCESS_EMPTY' | 'ERROR'
type ActiveStatusFilter = 'all' | 'active' | 'maintenance' | 'planned' | 'on-hold' | 'completed' | 'archived'

// SSOT Workspace Store
const workspaceStore = useWorkspaceStore()
const { projects: storeProjects, tasks: storeTasks, hydrationStatus } = workspaceStore
const projectsApi = useProjects()

// Local UI Filter & Modal State
const search = ref('')
const activeStatus = ref<ActiveStatusFilter>('all')
const sortBy = ref<'progress-desc' | 'progress-asc' | 'name-asc' | 'name-desc'>('progress-desc')
const showAddModal = ref(false)
const successFeedback = ref('')

// PROJ-004: Edit Modal State
const isEditModalOpen = ref(false)
const editingProject = ref<Project | null>(null)

function openEditModal(project: Project) {
  editingProject.value = project
  isEditModalOpen.value = true
}

function closeEditModal() {
  isEditModalOpen.value = false
  editingProject.value = null
}

// Contextual Action Bar integration
const { setActions, clearActions } = useHeaderActions()

// Auto-hydrate workspace if not initialized
onMounted(async () => {
  setActions([
    {
      id: 'import-repos',
      label: 'Import Repos',
      icon: 'GitBranch',
      variant: 'secondary',
      handler: () => navigateTo('/repos')
    },
    {
      id: 'new-project',
      label: 'New Project',
      icon: 'Plus',
      variant: 'primary',
      handler: () => {
        showAddModal.value = true
      }
    }
  ])

  if (!workspaceStore.isInitialized.value) {
    await workspaceStore.initializeWorkspace()
  }
})

onBeforeUnmount(() => {
  clearActions()
})

// Deterministic Projects Data State
const projectsDataState = computed<ProjectsDataState>(() => {
  if (
    hydrationStatus.value.projects === 'loading' ||
    (!workspaceStore.isInitialized.value && workspaceStore.isLoading.value)
  ) {
    return 'LOADING'
  }
  if (
    hydrationStatus.value.projects === 'error' &&
    storeProjects.value.length === 0
  ) {
    return 'ERROR'
  }
  if (!workspaceStore.isInitialized.value && hydrationStatus.value.projects === 'idle') {
    return 'NOT_LOADED'
  }
  return storeProjects.value.length === 0 ? 'SUCCESS_EMPTY' : 'SUCCESS_WITH_DATA'
})

// Stale state warning: store has cached data but background fetch failed
const isProjectsStaleError = computed(() => {
  return hydrationStatus.value.projects === 'error' && storeProjects.value.length > 0
})

async function refreshProjects() {
  try {
    await workspaceStore.fetchWorkspaceProjects()
  } catch (err: any) {
    console.error('[projects] Failed to refresh projects:', err)
  }
}

// Data Honesty: Tech Stack (No fake fallbacks)
function getTechStack(project: Project): string[] {
  return Array.isArray(project.techStack) ? project.techStack : []
}

// Progress calculation from SSOT storeTasks
function getProgress(slug: string): number {
  const projectTasks = (storeTasks.value || []).filter(t => t.projectSlug === slug)
  if (projectTasks.length === 0) return 0
  const deployed = projectTasks.filter(t => t.status === 'deployed').length
  return Math.round((deployed / projectTasks.length) * 100)
}

// 6 Official Project Statuses styling
function getStatusBadgeClass(status?: string): string {
  const s = (status || 'active').toLowerCase()
  if (s === 'completed') return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
  if (s === 'active') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (s === 'planned') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  if (s === 'on-hold' || s === 'on hold') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (s === 'maintenance') return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
  if (s === 'archived') return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
}

// Task count from SSOT storeTasks
function getTaskCountLabel(slug: string): string {
  const projectTasks = (storeTasks.value || []).filter(t => t.projectSlug === slug)
  if (projectTasks.length === 0) return '0/0 tasks'
  const deployed = projectTasks.filter(t => t.status === 'deployed').length
  return `${deployed}/${projectTasks.length} tasks`
}

// Honest date formatting (Zero fake 'Dec 2026' fallback)
function formatDate(d?: string | null): string {
  if (!d) return 'No Due Date'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

// Reactive Status Counters based on storeProjects
const allCount = computed(() => storeProjects.value.length)
const activeCount = computed(() => storeProjects.value.filter(p => (p.status || 'active').toLowerCase() === 'active').length)
const maintenanceCount = computed(() => storeProjects.value.filter(p => (p.status || '').toLowerCase() === 'maintenance').length)
const plannedCount = computed(() => storeProjects.value.filter(p => (p.status || '').toLowerCase() === 'planned').length)
const onHoldCount = computed(() => storeProjects.value.filter(p => (p.status || '').toLowerCase().replace(/\s+/g, '-') === 'on-hold').length)
const completedCount = computed(() => storeProjects.value.filter(p => (p.status || '').toLowerCase() === 'completed').length)
const archivedCount = computed(() => storeProjects.value.filter(p => (p.status || '').toLowerCase() === 'archived').length)

// Filter & Sort Pipeline
const filteredProjects = computed(() => {
  let list = [...storeProjects.value]

  if (activeStatus.value !== 'all') {
    list = list.filter(p => {
      const st = (p.status || 'active').toLowerCase().replace(/\s+/g, '-')
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

// PROJ-002: Create Project Handler
async function onProjectCreated(payload: {
  name?: string
  title?: string
  description?: string
  status?: 'active' | 'planned' | 'on-hold' | 'completed' | 'archived'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  startDate?: string
  dueDate?: string
  githubRepo?: string
  deployUrl?: string
  techStack?: string[]
}) {
  const title = payload.title || payload.name || 'Untitled Project'
  const newSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `proj-${Date.now()}`

  try {
    await projectsApi.createProject({
      slug: newSlug,
      title,
      description: payload.description,
      status: payload.status || 'active',
      priority: payload.priority || 'medium',
      startDate: payload.startDate || null,
      dueDate: payload.dueDate || null,
      githubRepo: payload.githubRepo || null,
      deployUrl: payload.deployUrl || null,
      techStack: payload.techStack || []
    })

    showAddModal.value = false
    successFeedback.value = `Project '${title}' created successfully.`
    setTimeout(() => {
      successFeedback.value = ''
    }, 5000)
  } catch (err: any) {
    console.error('[projects] Failed to create project:', err)
  }
}

// PROJ-004: Update Project Metadata Handler
async function onProjectUpdated(payload: { slug: string; patch: any }) {
  try {
    await projectsApi.updateProject(payload.slug, payload.patch)
    isEditModalOpen.value = false
    editingProject.value = null
    successFeedback.value = `Project '${payload.patch.title || payload.slug}' updated successfully.`
    setTimeout(() => {
      successFeedback.value = ''
    }, 4000)
  } catch (err: any) {
    console.error('[projects] Failed to update project:', err)
  }
}
</script>
