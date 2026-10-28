<template>
  <div class="space-y-6 pb-12">
    <!-- Header Row -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <h1 class="font-sans text-xl sm:text-2xl font-semibold text-[#F3F4F6] tracking-tight">
        GitHub Repository Hub
      </h1>

      <div class="flex items-center gap-2 flex-wrap">
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.08] transition"
        >
          <NexuraIcon name="Folder" size="xs" />
          <span>Projects Hub</span>
        </NuxtLink>

        <button
          type="button"
          :disabled="pending"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-white text-[#07080A] text-xs font-medium shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          @click="onSyncRepos"
        >
          <NexuraIcon name="RotateCw" size="xs" :class="{ 'animate-spin': pending }" />
          <span>Sync GitHub Repos</span>
        </button>
      </div>
    </div>

    <!-- Operation Feedback Banner -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <div
        v-if="feedbackMessage"
        class="p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all shadow-lg"
        :class="feedbackType === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'"
        role="status"
      >
        <div class="flex items-center gap-2">
          <NexuraIcon
            :name="feedbackType === 'success' ? 'CheckCircle2' : 'AlertTriangle'"
            size="sm"
            class="shrink-0"
          />
          <span>{{ feedbackMessage }}</span>
        </div>
        <button
          type="button"
          class="text-xs hover:opacity-80 p-1 rounded hover:bg-white/[0.04] cursor-pointer"
          aria-label="Dismiss feedback"
          @click="feedbackMessage = ''"
        >
          <NexuraIcon name="X" size="xs" />
        </button>
      </div>
    </transition>

    <!-- Repos Telemetry 3 Specular KPI Cards (Row 1) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <div class="bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] rounded-xl p-4 shadow-sm transition-all flex items-center justify-between">
        <div>
          <span class="font-mono text-xs uppercase text-[#8A8F9E] tracking-wider font-medium">Total Repositories</span>
          <div class="font-mono tabular-nums text-2xl font-semibold text-[#F3F4F6] mt-1">{{ totalReposCount }}</div>
        </div>
        <div class="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#8A8F9E]">
          <NexuraIcon name="GitBranch" size="sm" />
        </div>
      </div>

      <div class="bg-[#111318] border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl p-4 shadow-sm transition-all flex items-center justify-between">
        <div>
          <span class="font-mono text-xs uppercase text-emerald-400 tracking-wider font-medium">Managed in Nexura</span>
          <div class="font-mono tabular-nums text-2xl font-semibold text-emerald-400 mt-1">{{ managedCount }}</div>
        </div>
        <div class="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <NexuraIcon name="CheckCircle2" size="sm" />
        </div>
      </div>

      <div class="bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] rounded-xl p-4 shadow-sm transition-all flex items-center justify-between">
        <div>
          <span class="font-mono text-xs uppercase text-[#8A8F9E] tracking-wider font-medium">Available to Connect</span>
          <div class="font-mono tabular-nums text-2xl font-semibold text-[#F3F4F6] mt-1">{{ unmanagedCount }}</div>
        </div>
        <div class="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-indigo-400">
          <NexuraIcon name="FolderPlus" size="sm" />
        </div>
      </div>
    </div>

    <!-- Search & Filter Toolbar (Row 2) -->
    <div class="bg-[#111318] border border-white/[0.07] rounded-xl p-3.5 space-y-3.5 shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search Input -->
        <div class="relative flex-1">
          <NexuraIcon name="Search" size="xs" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#565B68] pointer-events-none" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search repositories by name, description, or topic..."
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-9 pr-8 py-2 text-xs font-mono text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-colors"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#565B68] hover:text-[#F3F4F6] p-0.5 rounded cursor-pointer"
            @click="searchQuery = ''"
          >
            <NexuraIcon name="X" size="xs" />
          </button>
        </div>

        <!-- Language Filter Dropdown -->
        <div class="w-full sm:w-56">
          <select
            v-model="selectedLanguage"
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
          >
            <option value="all">All Languages ({{ languages.length }})</option>
            <option v-for="lang in languages" :key="lang" :value="lang">
              {{ lang }}
            </option>
          </select>
        </div>
      </div>

      <!-- Management Status Filter Tabs -->
      <div class="p-1 rounded-lg bg-[#07080A] border border-white/[0.06] inline-flex items-center gap-1 overflow-x-auto max-w-full" role="tablist" aria-label="Filter management status">
        <button
          type="button"
          class="px-3 py-1.5 rounded-md font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer focus:outline-none"
          :class="statusFilter === 'all'
            ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
          @click="statusFilter = 'all'"
        >
          <span>All Repos</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] font-mono tabular-nums">{{ totalReposCount }}</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-md font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer focus:outline-none"
          :class="statusFilter === 'managed'
            ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
          @click="statusFilter = 'managed'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Managed in Project</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-emerald-400 font-mono tabular-nums">{{ managedCount }}</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-md font-mono text-xs flex items-center gap-1.5 transition-all whitespace-nowrap border cursor-pointer focus:outline-none"
          :class="statusFilter === 'unmanaged'
            ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
          @click="statusFilter = 'unmanaged'"
        >
          <span>Available to Connect</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] font-mono tabular-nums">{{ unmanagedCount }}</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending && (!displayRepos || displayRepos.length === 0)" class="py-16 text-center">
      <NexuraIcon name="RotateCw" size="lg" class="animate-spin text-indigo-400 inline-block mb-3" />
      <p class="font-mono text-xs text-[#8A8F9E]">Fetching repositories from GitHub API...</p>
    </div>

    <!-- Repositories List Grid (Row 3) -->
    <div v-else-if="filteredRepos.length > 0" class="grid grid-cols-1 gap-3.5">
      <article
        v-for="repo in filteredRepos"
        :key="repo.id"
        class="bg-[#111318] border rounded-xl p-4 sm:p-5 transition-all duration-200 group"
        :class="isRepoManaged(repo) ? 'border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.06)]' : 'border-white/[0.07] hover:border-white/[0.14]'"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Left Column: Repo Info & Tags -->
          <div class="space-y-2.5 min-w-0 flex-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h2 class="font-sans text-base font-semibold text-[#F3F4F6] group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                <span>{{ repo.name }}</span>
              </h2>

              <!-- Management Status Badge -->
              <span
                v-if="isRepoManaged(repo)"
                class="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Managed in Project</span>
              </span>
              <span
                v-else
                class="font-mono text-xs text-[#8A8F9E] bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-full font-medium"
              >
                Not Connected
              </span>

              <!-- Public / Private Pill -->
              <span
                :class="repo.private ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]'"
                class="font-mono text-[10px] px-2 py-0.5 rounded-full border"
              >
                {{ repo.private ? 'Private' : 'Public' }}
              </span>

              <!-- Language Monospace Pill -->
              <span
                v-if="repo.language"
                class="font-mono text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20 font-medium"
              >
                {{ repo.language }}
              </span>
            </div>

            <!-- Description -->
            <p class="text-xs text-[#8A8F9E] leading-relaxed line-clamp-2 max-w-3xl">
              {{ repo.description || 'No description provided for this repository.' }}
            </p>

            <!-- Meta telemetry row -->
            <div class="flex flex-wrap items-center gap-y-1.5 gap-x-4 pt-1 font-mono text-xs text-[#8A8F9E]">
              <div class="flex items-center gap-1.5">
                <NexuraIcon name="GitBranch" size="xs" class="text-[#8A8F9E]" />
                <span class="text-[#8A8F9E]">Branch:</span>
                <strong class="text-[#F3F4F6] font-mono">{{ repo.defaultBranch }}</strong>
              </div>

              <div class="flex items-center gap-1.5">
                <NexuraIcon name="Clock" size="xs" class="text-[#8A8F9E]" />
                <span class="text-[#8A8F9E]">Last push:</span>
                <strong class="text-[#F3F4F6] font-mono">{{ formatRelativeTime(repo.pushedAt) }}</strong>
              </div>

              <div v-if="repo.stargazersCount > 0" class="flex items-center gap-1 text-amber-400">
                <NexuraIcon name="Star" size="xs" class="text-amber-400" />
                <span class="font-mono tabular-nums">{{ repo.stargazersCount }}</span>
              </div>

              <a
                :href="repo.htmlUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[#8A8F9E] hover:text-indigo-400 transition-colors inline-flex items-center gap-1 ml-auto sm:ml-0 group/link"
              >
                <span>GitHub</span>
                <NexuraIcon name="ExternalLink" size="xs" class="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            </div>
          </div>

          <!-- Right Column: Direct Management Action Buttons -->
          <div class="flex items-center gap-2.5 flex-wrap shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.04]">
            <!-- CASE 1: Repo ALREADY MANAGED -->
            <template v-if="isRepoManaged(repo)">
              <RepoActivityBadge
                :repo="repo.fullName"
                :project-slug="getManagedProject(repo)?.slug || repo.name.toLowerCase()"
              />

              <NuxtLink
                :to="`/projects/${getManagedProject(repo)?.slug || repo.name.toLowerCase()}`"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-white text-[#07080A] font-sans text-xs font-medium transition active:scale-95 shadow-sm"
                title="Open dedicated dashboard and Kanban board for this project"
              >
                <NexuraIcon name="LayoutDashboard" size="xs" />
                <span>Open Project Cockpit</span>
                <NexuraIcon name="ArrowRight" size="xs" />
              </NuxtLink>

              <button
                type="button"
                class="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/15 text-[#8A8F9E] hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 transition-colors focus:ring-1 focus:ring-rose-500/50 cursor-pointer"
                title="Detach project from management"
                @click="onPromptRemoveFromManagement(repo)"
              >
                <NexuraIcon name="Trash2" size="xs" />
              </button>
            </template>

            <!-- CASE 2: Repo NOT YET MANAGED -->
            <template v-else>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-medium transition active:scale-95 shadow-sm cursor-pointer"
                @click="openConnectModal(repo)"
              >
                <NexuraIcon name="FolderPlus" size="xs" />
                <span>Connect to Project</span>
              </button>
            </template>

            <!-- Inspect Commits/Branches Toggle -->
            <button
              type="button"
              class="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.06] transition-colors cursor-pointer"
              :title="expandedRepo === repo.fullName ? 'Collapse commit details' : 'Inspect repository commits & branches'"
              @click="toggleExpand(repo.fullName)"
            >
              <NexuraIcon
                name="ChevronDown"
                size="xs"
                class="transition-transform duration-200"
                :class="{ 'rotate-180 text-indigo-400': expandedRepo === repo.fullName }"
              />
            </button>
          </div>
        </div>

        <!-- Expanded Detail Section (Commits & Branches) -->
        <div
          v-if="expandedRepo === repo.fullName"
          class="mt-4 pt-4 border-t border-white/[0.06] space-y-4"
        >
          <div v-if="detailsLoading" class="py-4 text-center">
            <NexuraIcon name="RotateCw" size="sm" class="animate-spin text-indigo-400 inline-block mb-1" />
            <p class="font-mono text-xs text-[#8A8F9E]">Fetching commit & branch telemetry...</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Recent Commits -->
            <div class="bg-[#07080A] border border-white/[0.07] rounded-xl p-3.5">
              <div class="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.04]">
                <span class="font-mono text-xs font-semibold text-[#F3F4F6]">Recent Commits (5)</span>
                <span class="font-mono text-[10px] text-[#8A8F9E]">Latest Activity</span>
              </div>
              <div v-if="commitsData.length === 0" class="font-mono text-xs text-[#8A8F9E] py-2">
                No recent commits found or API rate limit reached.
              </div>
              <div v-else class="space-y-2">
                <div
                  v-for="commit in commitsData"
                  :key="commit.sha"
                  class="flex items-start justify-between gap-2 border-b border-white/[0.03] pb-2 last:border-0 last:pb-0"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-xs text-[#F3F4F6] truncate" :title="commit.message">
                      {{ commit.message }}
                    </p>
                    <div class="flex items-center gap-2 font-mono text-[10px] text-[#8A8F9E] mt-0.5">
                      <span>{{ commit.authorName }}</span>
                      <span class="text-white/20">•</span>
                      <span>{{ formatRelativeTime(commit.date) }}</span>
                    </div>
                  </div>
                  <a
                    :href="commit.htmlUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded hover:underline shrink-0"
                  >
                    {{ commit.shortSha }}
                  </a>
                </div>
              </div>
            </div>

            <!-- Branches -->
            <div class="bg-[#07080A] border border-white/[0.07] rounded-xl p-3.5">
              <div class="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.04]">
                <span class="font-mono text-xs font-semibold text-[#F3F4F6]">Branches</span>
                <span class="font-mono text-[10px] text-[#8A8F9E]">{{ branchesData.length }} total</span>
              </div>
              <div v-if="branchesData.length === 0" class="font-mono text-xs text-[#8A8F9E] py-2">
                No branch information available.
              </div>
              <div v-else class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <div
                  v-for="branch in branchesData"
                  :key="branch.name"
                  class="flex items-center justify-between font-mono text-xs py-1 px-2 rounded bg-white/[0.02]"
                >
                  <div class="flex items-center gap-2 truncate">
                    <NexuraIcon name="GitBranch" size="xs" class="text-indigo-400 shrink-0" />
                    <span class="text-[#F3F4F6] truncate">{{ branch.name }}</span>
                    <span v-if="branch.protected" class="text-[9px] bg-rose-950/60 text-rose-400 px-1.5 py-0.5 rounded border border-rose-800/40">
                      protected
                    </span>
                  </div>
                  <span class="text-[10px] text-[#8A8F9E] shrink-0">
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
      class="bg-[#111318] border border-white/[0.07] rounded-xl p-12 text-center space-y-3"
    >
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#565B68]">
        <NexuraIcon name="SearchX" size="md" />
      </div>
      <h3 class="font-sans text-sm font-semibold text-[#F3F4F6]">No repositories match the query</h3>
      <p class="font-sans text-xs text-[#8A8F9E]">No repositories matched the selected keyword or language filters.</p>
      <button
        type="button"
        class="mt-2 font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
        @click="resetFilters"
      >
        Reset Filters
      </button>
    </div>

    <!-- Confirmation Dialog: Detach Project from Management -->
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

    <!-- Modal: Connect Repo to Project Management -->
    <Teleport to="body">
      <div
        v-if="repoToConnect"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        @click.self="repoToConnect = null"
      >
        <div
          class="w-full max-w-lg bg-[#111318] border border-white/[0.1] rounded-2xl shadow-2xl p-6 text-[#F3F4F6] space-y-5"
          @click.stop
        >
          <div class="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <NexuraIcon name="FolderPlus" size="sm" />
              </div>
              <div>
                <h3 class="font-sans text-base font-semibold text-[#F3F4F6]">Connect to Project</h3>
                <p class="font-mono text-xs text-[#8A8F9E]">Map GitHub repository to Nexura Management</p>
              </div>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors cursor-pointer"
              @click="repoToConnect = null"
            >
              <NexuraIcon name="X" size="sm" />
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="onConfirmConnectProject">
            <div class="space-y-1.5">
              <label class="text-[#8A8F9E] font-mono text-[11px] uppercase tracking-wider block">
                Project Title
              </label>
              <input
                v-model="connectForm.title"
                type="text"
                required
                class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[#8A8F9E] font-mono text-[11px] uppercase tracking-wider block">
                Project Slug
              </label>
              <input
                v-model="connectForm.slug"
                type="text"
                required
                class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[#8A8F9E] font-mono text-[11px] uppercase tracking-wider block">
                Description
              </label>
              <textarea
                v-model="connectForm.description"
                rows="3"
                class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg p-3 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none resize-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-[#8A8F9E] font-mono text-[11px] uppercase tracking-wider block">
                  Primary Stack
                </label>
                <input
                  v-model="connectForm.primaryTech"
                  type="text"
                  class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-[#8A8F9E] font-mono text-[11px] uppercase tracking-wider block">
                  Priority
                </label>
                <select
                  v-model="connectForm.priority"
                  class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none cursor-pointer"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] font-sans text-xs font-medium border border-white/[0.08] transition-colors cursor-pointer"
                @click="repoToConnect = null"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 rounded-lg bg-[#F3F4F6] hover:bg-white text-[#07080A] font-sans text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                :disabled="isConnectingProject"
              >
                <NexuraIcon v-if="isConnectingProject" name="RotateCw" size="xs" class="animate-spin text-[#07080A]" />
                <span>{{ isConnectingProject ? 'Connecting...' : 'Connect Project' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import RepoActivityBadge from '../../components/RepoActivityBadge.vue'
import NexuraIcon from '../../components/ui/NexuraIcon.vue'
import { useGitHubRepos } from '../../composables/useGitHub'
import { useProjects } from '../../composables/useProjects'
import type { GitHubRepoSummary, GitHubCommitItem, GitHubBranch, Project } from '../../types'

const route = useRoute()
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
watch(
  () => route.query.q,
  (q) => {
    if (typeof q === 'string') {
      searchQuery.value = q
    }
  },
  { immediate: true }
)
const selectedLanguage = ref('all')
const statusFilter = ref<'all' | 'managed' | 'unmanaged'>('all')

const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')

// Connect Project Modal State
const repoToConnect = ref<GitHubRepoSummary | null>(null)
const isConnectingProject = ref(false)
const connectForm = reactive({
  title: '',
  slug: '',
  description: '',
  primaryTech: '',
  priority: 'high' as 'high' | 'medium' | 'low'
})

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
  const repoFull = repo.fullName.toLowerCase()

  return list.find(p =>
    Boolean(p.githubRepo && p.githubRepo.toLowerCase() === repoFull)
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

// Open Connect Modal
function openConnectModal(repo: GitHubRepoSummary) {
  repoToConnect.value = repo
  connectForm.title = repo.name
  connectForm.slug = repo.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  connectForm.description = repo.description || `Engineering repository for ${repo.name}`
  connectForm.primaryTech = repo.language ? repo.language.toLowerCase() : 'typescript'
  connectForm.priority = 'high'
}

// Confirm Connect Project
async function onConfirmConnectProject() {
  if (!repoToConnect.value) return
  isConnectingProject.value = true

  try {
    const techStack = connectForm.primaryTech
      ? [connectForm.primaryTech.trim()]
      : (repoToConnect.value.language ? [repoToConnect.value.language.toLowerCase()] : ['typescript'])

    await projectsApi.createProject({
      title: connectForm.title.trim(),
      slug: connectForm.slug.trim(),
      description: connectForm.description.trim(),
      status: 'active',
      priority: connectForm.priority,
      githubRepo: repoToConnect.value.fullName,
      techStack: techStack,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    })

    await refreshProjects()
    feedbackType.value = 'success'
    feedbackMessage.value = `Repository '${repoToConnect.value.name}' successfully connected to Project Management!`
    repoToConnect.value = null
  } catch (err: any) {
    feedbackType.value = 'error'
    feedbackMessage.value = `Failed to connect project: ${err.message || 'Unknown error'}`
  } finally {
    isConnectingProject.value = false
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
    if (!proj) {
      throw new Error(`Project associated with '${repoToRemove.value.name}' not found.`)
    }

    // Hanya mengosongkan relasi githubRepo, proyek & tugas tetap utuh di database
    await projectsApi.updateProject(proj.slug, { githubRepo: null })
    await refreshProjects()

    feedbackType.value = 'success'
    feedbackMessage.value = `Repository '${repoToRemove.value.name}' successfully unlinked from '${proj.title}'.`
    confirmRemoveDialog.value = false
    repoToRemove.value = null
  } catch (err: any) {
    feedbackType.value = 'error'
    feedbackMessage.value = `Failed to detach repository: ${err.message || 'Unknown error'}`
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
