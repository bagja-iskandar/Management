<template>
  <div class="space-y-6 pb-12">
    <!-- Header Row -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-[#C98A4B] animate-pulse"></span>
          <h1 class="font-mono text-xl font-bold text-[#F5F2EB] tracking-tight">GitHub Repository Hub</h1>
        </div>
        <p class="font-mono text-xs text-[#756F68]">
          Connected to GitHub (<strong>@{{ username }}</strong>) • Connect or disconnect GitHub repositories to Project Management.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 font-mono text-xs text-[#F5F2EB] bg-white/5 border border-white/[0.08] rounded-xl hover:bg-white/10 hover:border-white/[0.15] transition"
        >
          <span>📁</span>
          <span>View All Projects</span>
        </NuxtLink>

        <button
          type="button"
          :disabled="pending"
          class="inline-flex items-center gap-2 px-3.5 py-2 font-mono text-xs text-[#09090B] bg-[#C98A4B] hover:bg-[#8B6535] rounded-xl font-semibold shadow-sm shadow-[#C98A4B]/20 transition disabled:opacity-50 active:scale-95"
          @click="onSyncRepos"
        >
          <svg
            :class="{ 'animate-spin': pending }"
            class="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Sync GitHub Repos</span>
        </button>
      </div>
    </div>

    <!-- Operation Feedback Banner -->
    <div
      v-if="feedbackMessage"
      class="p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all"
      :class="feedbackType === 'success' ? 'bg-[#C98A4B]/10 border-[#C98A4B]/30 text-[#C98A4B]' : 'bg-red-500/10 border-red-500/30 text-red-400'"
      role="status"
    >
      <div class="flex items-center gap-2">
        <span>{{ feedbackType === 'success' ? '✓' : '⚠️' }}</span>
        <span>{{ feedbackMessage }}</span>
      </div>
      <button
        type="button"
        class="text-xs hover:underline ml-4"
        @click="feedbackMessage = ''"
      >
        Dismiss
      </button>
    </div>

    <!-- Repos Telemetry 3-Stat Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <div class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] flex items-center justify-between">
        <div>
          <span class="font-mono text-[10px] uppercase text-[#756F68] tracking-wider font-semibold">Total GitHub Repos</span>
          <div class="font-mono text-2xl font-bold text-[#F5F2EB] mt-0.5">{{ totalReposCount }}</div>
        </div>
        <div class="w-9 h-9 rounded-lg bg-white/5 border border-white/[0.06] flex items-center justify-center text-sm font-mono text-[#756F68]">
          🐙
        </div>
      </div>

      <div class="p-4 rounded-xl bg-[#111114] border border-[#C98A4B]/30 shadow-[0_0_12px_rgba(201,138,75,0.1)] flex items-center justify-between">
        <div>
          <span class="font-mono text-[10px] uppercase text-[#C98A4B] tracking-wider font-semibold">Managed in Nexura</span>
          <div class="font-mono text-2xl font-bold text-[#C98A4B] mt-0.5">{{ managedCount }}</div>
        </div>
        <div class="w-9 h-9 rounded-lg bg-[#C98A4B]/15 border border-[#C98A4B]/30 flex items-center justify-center text-sm font-mono text-[#C98A4B]">
          ✓
        </div>
      </div>

      <div class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] flex items-center justify-between">
        <div>
          <span class="font-mono text-[10px] uppercase text-[#756F68] tracking-wider font-semibold">Available to Connect</span>
          <div class="font-mono text-2xl font-bold text-slate-400 mt-0.5">{{ unmanagedCount }}</div>
        </div>
        <div class="w-9 h-9 rounded-lg bg-white/5 border border-white/[0.06] flex items-center justify-center text-sm font-mono text-slate-400">
          ⊕
        </div>
      </div>
    </div>

    <!-- Search & Filter Toolbar -->
    <div class="p-4 rounded-2xl bg-[#111114] border border-white/[0.06] space-y-3.5">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search repositories by name, description, or topic..."
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-xl px-3.5 py-2 font-mono text-xs text-[#F5F2EB] placeholder-[#756F68] focus:outline-none focus:border-[#C98A4B] focus:ring-1 focus:ring-[#C98A4B]"
          />
        </div>

        <!-- Language Filter Dropdown -->
        <div class="w-full sm:w-56">
          <select
            v-model="selectedLanguage"
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-xl px-3 py-2 font-mono text-xs text-[#F5F2EB] focus:outline-none focus:border-[#C98A4B] focus:ring-1 focus:ring-[#C98A4B] cursor-pointer"
          >
            <option value="all">All Languages ({{ languages.length }})</option>
            <option v-for="lang in languages" :key="lang" :value="lang">
              {{ lang }}
            </option>
          </select>
        </div>
      </div>

      <!-- Management Status Filter Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter management status">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="statusFilter === 'all' ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40 font-bold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="statusFilter = 'all'"
        >
          <span>All Repos</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5">{{ totalReposCount }}</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="statusFilter === 'managed' ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40 font-bold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="statusFilter = 'managed'"
        >
          <span>✓ Managed in Project</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 text-[#C98A4B]">{{ managedCount }}</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border"
          :class="statusFilter === 'unmanaged' ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40 font-bold' : 'bg-[#09090B] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB]'"
          @click="statusFilter = 'unmanaged'"
        >
          <span>⊕ Not Connected</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5">{{ unmanagedCount }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending && (!displayRepos || displayRepos.length === 0)" class="py-16 text-center">
      <div class="inline-block animate-spin w-6 h-6 border-2 border-[#C98A4B] border-t-transparent rounded-full mb-3"></div>
      <p class="font-mono text-xs text-[#756F68]">Fetching repositories from GitHub API...</p>
    </div>

    <!-- Repositories List Grid -->
    <div v-else-if="filteredRepos.length > 0" class="grid grid-cols-1 gap-3.5">
      <article
        v-for="repo in filteredRepos"
        :key="repo.id"
        class="bg-[#111114] border rounded-2xl p-4 sm:p-5 transition-all duration-200"
        :class="isRepoManaged(repo) ? 'border-[#C98A4B]/30 hover:border-[#C98A4B]/60 shadow-[0_0_12px_rgba(201,138,75,0.08)]' : 'border-white/[0.06] hover:border-white/[0.12]'"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Left Column: Repo Info & Tags -->
          <div class="space-y-2.5 min-w-0 flex-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h2 class="font-mono text-base font-bold text-[#F5F2EB] flex items-center gap-2">
                <span>{{ repo.name }}</span>
              </h2>

              <!-- Management Status Badge -->
              <span
                v-if="isRepoManaged(repo)"
                class="font-mono text-[10px] px-2.5 py-0.5 rounded-md border font-semibold flex items-center gap-1.5 bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/35"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                <span>Managed in Project</span>
              </span>
              <span
                v-else
                class="font-mono text-[10px] px-2 py-0.5 rounded-md border font-medium bg-white/[0.03] text-[#756F68] border-white/[0.06]"
              >
                Not Connected
              </span>

              <span
                :class="repo.private ? 'bg-amber-900/30 text-amber-400 border-amber-800/40' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40'"
                class="font-mono text-[10px] px-2 py-0.5 rounded border"
              >
                {{ repo.private ? 'Private' : 'Public' }}
              </span>

              <span
                v-if="repo.language"
                class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] px-2 py-0.5 rounded border border-[#C98A4B]/20 font-medium"
              >
                {{ repo.language }}
              </span>
            </div>

            <!-- Description -->
            <p class="text-xs text-[#756F68] leading-relaxed line-clamp-2 max-w-3xl">
              {{ repo.description || 'No description provided for this repository.' }}
            </p>

            <!-- Meta telemetry row -->
            <div class="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 font-mono text-[11px] text-[#756F68]">
              <div class="flex items-center gap-1">
                <span>🌿 Branch:</span>
                <strong class="text-[#F5F2EB]">{{ repo.defaultBranch }}</strong>
              </div>

              <div class="flex items-center gap-1">
                <span>⏱ Last push:</span>
                <strong class="text-[#F5F2EB]">{{ formatRelativeTime(repo.pushedAt) }}</strong>
              </div>

              <div v-if="repo.stargazersCount > 0" class="flex items-center gap-1 text-amber-400">
                <span>★</span>
                <span>{{ repo.stargazersCount }}</span>
              </div>

              <a
                :href="repo.htmlUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[#756F68] hover:text-[#C98A4B] transition-colors inline-flex items-center gap-1 ml-auto sm:ml-0 group"
              >
                <span>GitHub</span>
                <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          <!-- Right Column: Direct Management Action Buttons -->
          <div class="flex items-center gap-2.5 flex-wrap shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.04]">
            <!-- CASE 1: Repo ALREADY MANAGED -->
            <template v-if="isRepoManaged(repo)">
              <NuxtLink
                :to="`/projects/${getManagedProject(repo)?.slug || repo.name.toLowerCase()}`"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-bold transition-all shadow-sm shadow-[#C98A4B]/25 active:scale-95 focus:ring-2 focus:ring-[#C98A4B] focus:outline-none"
                title="Open dedicated dashboard and Kanban board for this project"
              >
                <span>📋</span>
                <span>Open Project Dashboard</span>
                <span>→</span>
              </NuxtLink>

              <button
                type="button"
                class="p-2 rounded-xl bg-white/5 hover:bg-red-500/15 text-[#756F68] hover:text-red-400 border border-white/[0.06] hover:border-red-500/30 transition-colors focus:ring-1 focus:ring-red-500 focus:outline-none"
                title="Detach project from management"
                @click="onPromptRemoveFromManagement(repo)"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </template>

            <!-- CASE 2: Repo NOT YET MANAGED -->
            <template v-else>
              <button
                type="button"
                :disabled="busyRepoId === repo.id"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-bold transition-all shadow-sm shadow-[#C98A4B]/20 active:scale-95 focus:ring-2 focus:ring-[#C98A4B] focus:outline-none disabled:opacity-50"
                @click="onAddRepoToManagement(repo)"
              >
                <span v-if="busyRepoId === repo.id" class="animate-spin inline-block w-3.5 h-3.5 border-2 border-[#09090B] border-t-transparent rounded-full"></span>
                <span v-else>⊕</span>
                <span>Add to Project Management</span>
              </button>
            </template>

            <!-- Inspect Commits/Branches Toggle -->
            <button
              type="button"
              class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] border border-white/[0.06] transition-colors focus:outline-none"
              :title="expandedRepo === repo.fullName ? 'Close commit details' : 'Inspect repository commits & branches'"
              @click="toggleExpand(repo.fullName)"
            >
              <svg
                :class="{ 'rotate-180 text-[#C98A4B]': expandedRepo === repo.fullName }"
                class="w-4 h-4 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Expanded Detail Section (Commits & Branches) -->
        <div
          v-if="expandedRepo === repo.fullName"
          class="mt-4 pt-4 border-t border-white/[0.06] space-y-4"
        >
          <div v-if="detailsLoading" class="py-4 text-center">
            <div class="inline-block animate-spin w-4 h-4 border-2 border-[#C98A4B] border-t-transparent rounded-full mb-1"></div>
            <p class="font-mono text-[11px] text-[#756F68]">Fetching commit & branch telemetry...</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Recent Commits -->
            <div class="bg-[#09090B] border border-white/[0.06] rounded-xl p-3.5">
              <div class="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.04]">
                <span class="font-mono text-xs font-semibold text-[#F5F2EB]">Recent Commits (5)</span>
                <span class="font-mono text-[10px] text-[#756F68]">Latest Activity</span>
              </div>
              <div v-if="commitsData.length === 0" class="font-mono text-xs text-[#756F68] py-2">
                No recent commits found or API rate limit reached.
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="commit in commitsData"
                  :key="commit.sha"
                  class="flex items-start justify-between gap-2 border-b border-white/[0.03] pb-2 last:border-0 last:pb-0"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-xs text-[#F5F2EB] truncate" :title="commit.message">
                      {{ commit.message }}
                    </p>
                    <div class="flex items-center gap-2 font-mono text-[10px] text-[#756F68] mt-0.5">
                      <span>{{ commit.authorName }}</span>
                      <span>•</span>
                      <span>{{ formatRelativeTime(commit.date) }}</span>
                    </div>
                  </div>
                  <a
                    :href="commit.htmlUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-mono text-[10px] text-[#C98A4B] bg-[#C98A4B]/10 px-1.5 py-0.5 rounded hover:underline shrink-0"
                  >
                    {{ commit.shortSha }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Branches -->
            <div class="bg-[#09090B] border border-white/[0.06] rounded-xl p-3.5">
              <div class="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.04]">
                <span class="font-mono text-xs font-semibold text-[#F5F2EB]">Branches</span>
                <span class="font-mono text-[10px] text-[#756F68]">{{ branchesData.length }} total</span>
              </div>
              <div v-if="branchesData.length === 0" class="font-mono text-xs text-[#756F68] py-2">
                No branch information available.
              </div>
              <div v-else class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <div
                  v-for="branch in branchesData"
                  :key="branch.name"
                  class="flex items-center justify-between font-mono text-xs py-1 px-2 rounded bg-white/[0.02]"
                >
                  <div class="flex items-center gap-2 truncate">
                    <svg class="w-3 h-3 text-[#C98A4B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                    <span class="text-[#F5F2EB] truncate">{{ branch.name }}</span>
                    <span v-if="branch.protected" class="text-[9px] bg-red-950 text-red-400 px-1 rounded border border-red-800/40">
                      protected
                    </span>
                  </div>
                  <span class="text-[10px] text-[#756F68] shrink-0">
                    {{ branch.commitSha.slice(0, 7) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- Empty Filtered Results -->
    <div
      v-else-if="displayRepos.length > 0"
      class="bg-[#111114] border border-white/[0.06] rounded-2xl p-12 text-center space-y-3"
    >
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-xl">
        ∅
      </div>
      <h3 class="font-mono text-sm font-semibold text-[#F5F2EB]">No repositories match the query</h3>
      <p class="font-sans text-xs text-[#756F68]">No repositories matched the selected keyword or language filters.</p>
      <button
        type="button"
        class="mt-2 font-mono text-xs text-[#C98A4B] hover:underline"
        @click="resetFilters"
      >
        Reset Filters
      </button>
    </div>

    <!-- Confirmation Dialog: Remove Project from Management -->
    <ConfirmDialog
      v-if="confirmRemoveDialog"
      title="Detach Project from Management?"
      :message="`Are you sure you want to detach '${repoToRemove?.name}' from Nexura management? The GitHub repository itself will remain untouched.`"
      confirm-text="Detach Project"
      cancel-text="Cancel"
      :busy="isBusyRemoving"
      @confirm="onConfirmRemoveFromManagement"
      @cancel="() => { confirmRemoveDialog = false; repoToRemove = null }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useGitHubRepos } from '../../composables/useGitHub'
import { useProjects } from '../../composables/useProjects'
import type { GitHubRepoSummary, GitHubCommitItem, GitHubBranch, Project } from '../../types'

const config = useRuntimeConfig()
const username = computed(() => config.public.githubUsername || 'bagja-iskandar')

const { repos, pending, refresh } = useGitHubRepos()
const projectsApi = useProjects()

const { data: projects, refresh: refreshProjects } = useLazyAsyncData('repos-projects-list', () => projectsApi.getProjects())

const displayRepos = computed<GitHubRepoSummary[]>(() => {
  return repos.value || []
})

// Search & Filter State
const searchQuery = ref('')
const selectedLanguage = ref('all')
const statusFilter = ref<'all' | 'managed' | 'unmanaged'>('all')

const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')
const busyRepoId = ref<number | null>(null)

// Confirmation dialog state
const confirmRemoveDialog = ref(false)
const repoToRemove = ref<GitHubRepoSummary | null>(null)
const isBusyRemoving = ref(false)

// Languages extraction
const languages = computed(() => {
  const set = new Set<string>()
  for (const r of displayRepos.value) {
    if (r.language) set.add(r.language)
  }
  return Array.from(set).sort()
})

// Check if repo is in projects
function getManagedProject(repo: GitHubRepoSummary): Project | undefined {
  const list = projects.value ?? []
  const repoName = repo.name.toLowerCase()
  const repoFull = repo.fullName.toLowerCase()

  return list.find(p =>
    (p.githubRepo && p.githubRepo.toLowerCase() === repoFull) ||
    p.slug.toLowerCase() === repoName ||
    p.title.toLowerCase() === repoName
  )
}

function isRepoManaged(repo: GitHubRepoSummary): boolean {
  return !!getManagedProject(repo)
}

// Telemetry Counters
const totalReposCount = computed(() => displayRepos.value.length)
const managedCount = computed(() => displayRepos.value.filter(r => isRepoManaged(r)).length)
const unmanagedCount = computed(() => displayRepos.value.filter(r => !isRepoManaged(r)).length)

// Filtered List
const filteredRepos = computed(() => {
  let list = displayRepos.value

  // Status Filter
  if (statusFilter.value === 'managed') {
    list = list.filter(r => isRepoManaged(r))
  } else if (statusFilter.value === 'unmanaged') {
    list = list.filter(r => !isRepoManaged(r))
  }

  // Language Filter
  if (selectedLanguage.value !== 'all') {
    list = list.filter(r => r.language === selectedLanguage.value)
  }

  // Search Query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
    )
  }

  return list
})

function resetFilters() {
  searchQuery.value = ''
  selectedLanguage.value = 'all'
  statusFilter.value = 'all'
}

// Add Repo to Management
async function onAddRepoToManagement(repo: GitHubRepoSummary) {
  busyRepoId.value = repo.id
  try {
    const slug = repo.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const techStack = repo.language ? [repo.language.toLowerCase()] : ['typescript']

    await projectsApi.createProject({
      title: repo.name,
      slug: slug,
      description: repo.description || `Engineering repository for ${repo.name}`,
      status: 'active',
      priority: 'high',
      githubRepo: repo.fullName,
      techStack: techStack,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    })

    await refreshProjects()
    feedbackType.value = 'success'
    feedbackMessage.value = `Repository '${repo.name}' successfully added to Project Management!`
  } catch (err: any) {
    feedbackType.value = 'error'
    feedbackMessage.value = `Failed to add project: ${err.message || 'Unknown error'}`
  } finally {
    busyRepoId.value = null
  }
}

// Remove Repo from Management
function onPromptRemoveFromManagement(repo: GitHubRepoSummary) {
  repoToRemove.value = repo
  confirmRemoveDialog.value = true
}

async function onConfirmRemoveFromManagement() {
  if (!repoToRemove.value) return
  isBusyRemoving.value = true

  try {
    const proj = getManagedProject(repoToRemove.value)
    const projectSlug = proj?.slug || repoToRemove.value.name.toLowerCase()

    await projectsApi.deleteProject(projectSlug)
    await refreshProjects()

    feedbackType.value = 'success'
    feedbackMessage.value = `Project '${repoToRemove.value.name}' successfully detached from management.`
    confirmRemoveDialog.value = false
    repoToRemove.value = null
  } catch (err: any) {
    feedbackType.value = 'error'
    feedbackMessage.value = `Failed to detach project: ${err.message || 'Error'}`
  } finally {
    isBusyRemoving.value = false
  }
}

async function onSyncRepos() {
  await refresh()
  await refreshProjects()
}

// Expanded details management
const expandedRepo = ref<string | null>(null)
const detailsLoading = ref(false)
const commitsData = ref<GitHubCommitItem[]>([])
const branchesData = ref<GitHubBranch[]>([])

async function toggleExpand(fullName: string) {
  if (expandedRepo.value === fullName) {
    expandedRepo.value = null
    commitsData.value = []
    branchesData.value = []
    return
  }

  expandedRepo.value = fullName
  detailsLoading.value = true
  commitsData.value = []
  branchesData.value = []

  try {
    const [commitsRes, branchesRes] = await Promise.all([
      $fetch<GitHubCommitItem[]>('/api/github/commits', {
        params: { repo: fullName, limit: 5 }
      }).catch(() => []),
      $fetch<GitHubBranch[]>('/api/github/branches', {
        params: { repo: fullName }
      }).catch(() => [])
    ])

    commitsData.value = commitsRes
    branchesData.value = branchesRes
  } finally {
    detailsLoading.value = false
  }
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return 'never'
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
</script>
