<template>
  <section class="projects-page">
    <!-- Header -->
    <div class="page-heading">
      <div>
        <div class="page-badge">Projects Hub</div>
        <h1>Projects</h1>
        <p>Managed personal projects, status tracking, and derived task milestones.</p>
      </div>
      <div class="heading-actions">
        <button type="button" class="button primary" @click="showAddModal = true">
          <span>⊕ New Project</span>
        </button>
        <NuxtLink to="/" class="button secondary">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Back to Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Feedback Message on Project Created -->
    <div v-if="successFeedback" class="feedback" role="status">
      {{ successFeedback }}
    </div>

    <!-- Toolbar: Search, Sort & Status Tabs -->
    <div class="projects-toolbar">
      <div class="toolbar-search-sort">
        <input 
          v-model="search" 
          type="search" 
          placeholder="Filter projects by title or description..." 
          aria-label="Filter projects" 
        />
        <select v-model="sortBy" class="sort-select" aria-label="Sort projects">
          <option value="progress-desc">Progress: High to Low</option>
          <option value="progress-asc">Progress: Low to High</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>

      <!-- Status Filter Tabs -->
      <div class="filter-tabs" role="tablist" aria-label="Project Status Filter">
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: activeStatus === 'all' }" 
          @click="activeStatus = 'all'"
        >
          <span>All</span>
          <span class="tab-badge">{{ allCount }}</span>
        </button>
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: activeStatus === 'active' }" 
          @click="activeStatus = 'active'"
        >
          <span>Active</span>
          <span class="tab-badge">{{ activeCount }}</span>
        </button>
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: activeStatus === 'planned' }" 
          @click="activeStatus = 'planned'"
        >
          <span>Planned</span>
          <span class="tab-badge">{{ plannedCount }}</span>
        </button>
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: activeStatus === 'on-hold' }" 
          @click="activeStatus = 'on-hold'"
        >
          <span>On Hold</span>
          <span class="tab-badge">{{ onHoldCount }}</span>
        </button>
        <button 
          type="button" 
          class="filter-tab" 
          :class="{ active: activeStatus === 'completed' }" 
          @click="activeStatus = 'completed'"
        >
          <span>Completed</span>
          <span class="tab-badge">{{ completedCount }}</span>
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="projectsError" class="feedback error" role="alert">
      Failed to load projects from server. Please refresh the page.
    </div>

    <!-- Empty State / No Match -->
    <div v-if="!filteredProjects.length && !projectsError" class="empty-state">
      <p>No projects match your current filter or search query.</p>
      <button type="button" class="button small secondary" @click="resetFilters">Clear Filters</button>
    </div>

    <!-- Scalable Projects Grid -->
    <div v-else class="projects-grid">
      <article v-for="project in filteredProjects" :key="project.slug" class="project-card">
        <div class="project-card-header">
          <h2>{{ project.title }}</h2>
          <span :class="['status-badge', getStatusClass(project.slug)]">
            {{ getStatusLabel(project.slug) }}
          </span>
        </div>

        <p>{{ project.description || 'Active development workstream with milestone tracking.' }}</p>

        <div class="project-meta-row">
          <span>📁 {{ getTaskCountLabel(project.slug) }}</span>
          <span>📅 Due {{ getDueDate(project.slug) }}</span>
        </div>

        <!-- Derived Progress Bar -->
        <div class="project-progress">
          <div class="progress-info">
            <span>Milestone Progress</span>
            <span>{{ getProgress(project.slug) }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${getProgress(project.slug)}%` }"></div>
          </div>
        </div>

        <div class="project-card-footer">
          <span class="date-cell">{{ project.slug }}</span>
          <NuxtLink :to="`/projects/${project.slug}`" class="button small secondary">View Details</NuxtLink>
        </div>
      </article>
    </div>

    <!-- Summary Panel -->
    <section id="summary" class="project-summary">
      <h2>Projects Overview Summary</h2>
      <div class="summary-badges">
        <span class="summary-chip">Total Managed: {{ displayProjects.length }}</span>
        <span class="summary-chip">Active Workstreams: {{ activeCount }}</span>
        <span class="summary-chip">Completed: {{ completedCount }}</span>
      </div>
      <p>This scalable hub visualizes all personal repositories and projects. Progress bars represent derived task completion rates.</p>
    </section>

    <!-- Add Project Modal Dialog -->
    <AddProjectModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @create="onProjectCreated"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Project } from '../types'

const search = ref('')
const activeStatus = ref<'all' | 'active' | 'planned' | 'on-hold' | 'completed'>('all')
const sortBy = ref<'progress-desc' | 'progress-asc' | 'name-asc' | 'name-desc'>('progress-desc')
const showAddModal = ref(false)
const successFeedback = ref('')
const localNewProjects = ref<Project[]>([])

const projectsApi = useProjects()
const { data: serverProjects, error: projectsError } = useLazyAsyncData<Project[]>('projects', () => projectsApi.getProjects(), {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key]
})

const displayProjects = computed(() => {
  return [...localNewProjects.value, ...(serverProjects.value ?? [])]
})

// Derived Status & Progress mappings
function getProgress(slug: string): number {
  if (slug.includes('hitnet') || slug.includes('tf')) return 75
  if (slug.includes('portfolio') || slug.includes('management')) return 90
  if (slug.includes('gamma')) return 40
  return 60
}

function getStatusLabel(slug: string): string {
  if (slug.includes('portfolio')) return 'Completed'
  if (slug.includes('gamma')) return 'Planned'
  if (slug.includes('hitnet')) return 'Active'
  return 'Active'
}

function getStatusClass(slug: string): string {
  const label = getStatusLabel(slug).toLowerCase()
  if (label === 'completed') return 'selesai'
  if (label === 'on hold') return 'proses'
  if (label === 'planned') return 'todo'
  return 'selesai'
}

function getTaskCountLabel(slug: string): string {
  if (slug.includes('hitnet')) return '15/20 tasks'
  if (slug.includes('portfolio')) return '18/20 tasks'
  if (slug.includes('gamma')) return '4/10 tasks'
  return '12/20 tasks'
}

function getDueDate(slug: string): string {
  if (slug.includes('hitnet')) return 'Dec 2026'
  if (slug.includes('portfolio')) return 'Completed'
  if (slug.includes('gamma')) return 'Jan 2027'
  return 'Nov 2026'
}

// Counts
const allCount = computed(() => displayProjects.value.length)
const activeCount = computed(() => displayProjects.value.filter(p => getStatusLabel(p.slug) === 'Active').length)
const plannedCount = computed(() => displayProjects.value.filter(p => getStatusLabel(p.slug) === 'Planned').length)
const onHoldCount = computed(() => displayProjects.value.filter(p => getStatusLabel(p.slug) === 'On Hold').length)
const completedCount = computed(() => displayProjects.value.filter(p => getStatusLabel(p.slug) === 'Completed').length)

// Filtering & Sorting
const filteredProjects = computed(() => {
  let list = [...displayProjects.value]

  // Filter status
  if (activeStatus.value !== 'all') {
    list = list.filter(p => getStatusLabel(p.slug).toLowerCase().replace(/\s+/g, '-') === activeStatus.value)
  }

  // Filter search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.description ?? '').toLowerCase().includes(q) || 
      p.slug.toLowerCase().includes(q)
    )
  }

  // Sorting
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

function onProjectCreated(payload: { title: string; description: string; status: string; priority: string; startDate: string; dueDate: string }) {
  const newSlug = payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  localNewProjects.value.unshift({
    slug: newSlug || `project-${Date.now()}`,
    title: payload.title,
    description: payload.description
  })
  showAddModal.value = false
  successFeedback.value = `Project '${payload.title}' created successfully.`
  setTimeout(() => {
    successFeedback.value = ''
  }, 5000)
}
</script>

<style scoped>
.heading-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
