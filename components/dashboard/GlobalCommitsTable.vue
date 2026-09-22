<template>
  <section class="bg-[#111114] border border-white/[0.07] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-xl">
    <!-- Header & Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/[0.07] pb-2.5">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-[#C98A4B]/15 border border-[#C98A4B]/30 flex items-center justify-center text-[#C98A4B] shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <div>
          <h2 class="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <span>RECENT COMMITS STREAM</span>
            <span class="px-1.5 py-0.2 font-mono text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-semibold">
              {{ selectedRepo === 'all' ? 'ALL REPOS' : selectedRepo }}
            </span>
            <span class="text-zinc-500 text-[10px] font-mono font-normal">
              (Latest {{ filteredCommits.length }})
            </span>
          </h2>
        </div>
      </div>

      <!-- Repo Filter & Search -->
      <div class="flex items-center gap-2 text-xs font-mono flex-wrap sm:flex-nowrap">
        <!-- Dropdown -->
        <select
          v-model="selectedRepo"
          class="bg-[#18181C] border border-white/[0.07] rounded px-2 py-1 text-[11px] text-zinc-200 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none transition cursor-pointer"
        >
          <option value="all">⚡ All Repos ({{ availableRepos.length }})</option>
          <option v-for="repo in availableRepos" :key="repo" :value="repo">
            {{ repo }} ({{ getRepoCommitCount(repo) }})
          </option>
        </select>

        <!-- Search Input -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search commits..."
            class="bg-[#18181C] border border-white/[0.07] rounded pl-6 pr-2.5 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none w-32 sm:w-44 transition"
          />
          <svg
            class="w-3 h-3 text-zinc-500 absolute left-2 top-1.5 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Refresh Button -->
        <button
          type="button"
          class="p-1 rounded bg-[#18181C] hover:bg-zinc-800 border border-white/[0.07] text-zinc-300 transition shrink-0 cursor-pointer"
          title="Refresh Commits"
          :disabled="isRefreshing"
          @click="onRefresh"
        >
          <svg
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin text-[#C98A4B]': isRefreshing }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Commits Table -->
    <div class="overflow-x-auto custom-scrollbar border border-white/[0.07] rounded-lg">
      <table class="w-full text-left text-xs">
        <thead class="bg-[#18181C] text-zinc-400 font-mono uppercase text-[9px] tracking-wider border-b border-white/[0.07]">
          <tr>
            <th class="px-3 py-2 w-36">Repository</th>
            <th class="px-2.5 py-2 w-24">SHA</th>
            <th class="px-3 py-2">Commit Message</th>
            <th class="px-3 py-2 w-40">Author</th>
            <th class="px-3 py-2 text-right w-24">Time</th>
            <th class="px-2.5 py-2 text-center w-20">Diff</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.05] font-mono">
          <template v-for="commit in filteredCommits" :key="commit.sha">
            <tr class="hover:bg-[#18181C]/50 transition">
              <!-- Repository Badge -->
              <td class="px-3 py-2.5 font-sans whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border"
                  :class="getRepoBadgeClass(commit.repoName)"
                >
                  <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25a.25.25 0 01.25-.25h3.5a.25.25 0 01.25.25v3.25a.25.25 0 01-.4.2l-1.45-1.087a.25.25 0 00-.3 0L5.4 15.7a.25.25 0 01-.4-.2v-3.25z"/>
                  </svg>
                  {{ cleanRepoName(commit.repoName) }}
                </span>
              </td>

              <!-- SHA -->
              <td class="px-2.5 py-2.5 whitespace-nowrap">
                <a
                  :href="commit.htmlUrl || '#'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[#C98A4B] hover:underline text-xs font-mono font-semibold"
                >
                  {{ commit.shortSha || commit.sha.slice(0, 7) }}
                </a>
              </td>

              <!-- Commit Message (Wide, clean, elegant) -->
              <td class="px-3 py-2.5 font-sans text-zinc-200">
                <div class="font-medium text-xs truncate max-w-xl" :title="commit.message">
                  {{ commit.message }}
                </div>
              </td>

              <!-- Author (Full name without truncation) -->
              <td class="px-3 py-2.5 text-zinc-400 whitespace-nowrap text-xs">
                <div class="flex items-center gap-1.5">
                  <div class="w-4 h-4 rounded-full bg-zinc-700 text-[8px] flex items-center justify-center text-zinc-200 font-bold shrink-0">
                    {{ (commit.authorName || 'B').slice(0, 1).toUpperCase() }}
                  </div>
                  <span class="truncate">{{ commit.authorName }}</span>
                </div>
              </td>

              <!-- Time -->
              <td class="px-3 py-2.5 text-right text-zinc-500 whitespace-nowrap text-[11px]">
                {{ formatRelativeTime(commit.date) }}
              </td>

              <!-- Diff Toggle Button (Fully visible) -->
              <td class="px-2.5 py-2.5 text-center whitespace-nowrap">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer"
                  :class="
                    expandedShas.has(commit.sha)
                      ? 'bg-[#C98A4B]/20 text-[#C98A4B] border-[#C98A4B]/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/[0.07]'
                  "
                  @click="toggleDiff(commit)"
                >
                  {{ expandedShas.has(commit.sha) ? '▾ Diff' : '▸ Diff' }}
                </button>
              </td>
            </tr>

            <!-- Expandable Inline Diff Row -->
            <tr
              v-if="expandedShas.has(commit.sha)"
              class="bg-black/50 border-t border-b border-white/[0.07]"
            >
              <td colspan="6" class="p-3">
                <div class="bg-[#09090B] border border-white/[0.07] rounded p-2.5 text-[11px] font-mono space-y-1.5">
                  <div class="flex items-center justify-between text-zinc-400 border-b border-white/[0.06] pb-1">
                    <span class="text-zinc-500 text-[10px]">
                      // Git Diff: {{ commit.shortSha || commit.sha.slice(0, 7) }} ({{ commit.repoName }})
                    </span>
                    <span v-if="commitDetails[commit.sha]?.data?.stats" class="text-zinc-400 text-[10px]">
                      {{ commitDetails[commit.sha]?.data?.files.length || 0 }} files changed
                      (+{{ commitDetails[commit.sha]?.data?.stats?.additions || 0 }},
                      -{{ commitDetails[commit.sha]?.data?.stats?.deletions || 0 }})
                    </span>
                  </div>

                  <!-- Loading State -->
                  <div
                    v-if="commitDetails[commit.sha]?.loading"
                    class="py-1.5 text-zinc-400 flex items-center gap-1.5 text-[11px]"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-[#C98A4B] animate-ping"></span>
                    <span>Fetching commit file changes from GitHub...</span>
                  </div>

                  <!-- Error State -->
                  <div
                    v-else-if="commitDetails[commit.sha]?.error"
                    class="py-1 text-red-400 text-[11px]"
                  >
                    {{ commitDetails[commit.sha]?.error }}
                  </div>

                  <div
                    v-else-if="!commitDetails[commit.sha]?.data?.files?.length"
                    class="py-1 text-zinc-500 italic text-[11px]"
                  >
                    No file changes recorded for this commit.
                  </div>

                  <!-- Real Fetched Diff Files -->
                  <div v-else class="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    <div
                      v-for="file in commitDetails[commit.sha]?.data?.files"
                      :key="file.filename"
                      class="flex items-center justify-between hover:bg-white/[0.02] px-1.5 py-0.5 rounded text-[11px]"
                    >
                      <span
                        :class="
                          file.status === 'added'
                            ? 'text-emerald-400'
                            : file.status === 'removed'
                              ? 'text-red-400'
                              : 'text-amber-400'
                        "
                      >
                        {{ file.status === 'added' ? '+' : file.status === 'removed' ? '-' : '~' }}
                        {{ file.filename }}
                      </span>
                      <span class="text-zinc-500 text-[10px]">
                        +{{ file.additions }} / -{{ file.deletions }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Empty State inside table -->
      <div
        v-if="filteredCommits.length === 0"
        class="p-4 text-center text-zinc-500 font-mono text-xs"
      >
        {{ isRefreshing ? 'Loading commits...' : 'No commits found across connected repositories.' }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Project, GitHubCommitItem, GitHubCommitDetail } from '~/types'
import { useGitHubGlobalCommits } from '../../composables/useGitHub'

const props = withDefaults(
  defineProps<{
    projects?: Project[]
    commits?: GitHubCommitItem[]
  }>(),
  {
    projects: () => [],
    commits: undefined
  }
)

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

// Fetch global commits from API
const { commits: globalCommits, refresh: refreshGlobalCommits } = useGitHubGlobalCommits(25)

const isRefreshing = ref(false)
const selectedRepo = ref<string>('all')
const searchQuery = ref<string>('')
const expandedShas = ref<Set<string>>(new Set())
const commitDetails = ref<
  Record<
    string,
    {
      loading: boolean
      data: GitHubCommitDetail | null
      error: string | null
    }
  >
>({})

const sourceCommits = computed(() => {
  if (props.commits && props.commits.length > 0) {
    return props.commits
  }
  return globalCommits.value || []
})

const availableRepos = computed(() => {
  const set = new Set<string>()
  for (const c of sourceCommits.value) {
    if (c.repoName) set.add(cleanRepoName(c.repoName))
  }
  if (props.projects) {
    for (const p of props.projects) {
      if (p.githubRepo) set.add(cleanRepoName(p.githubRepo))
      else if (p.slug) set.add(p.slug)
    }
  }
  return Array.from(set)
})

const filteredCommits = computed(() => {
  let list = sourceCommits.value

  if (selectedRepo.value !== 'all') {
    list = list.filter((c) => cleanRepoName(c.repoName) === selectedRepo.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter(
      (c) =>
        c.message.toLowerCase().includes(query) ||
        c.authorName.toLowerCase().includes(query) ||
        c.sha.toLowerCase().includes(query) ||
        (c.shortSha && c.shortSha.toLowerCase().includes(query))
    )
  }

  // Cap at maximum 6 items per user request
  return list.slice(0, 6)
})

function getRepoCommitCount(repo: string): number {
  return sourceCommits.value.filter((c) => cleanRepoName(c.repoName) === repo).length
}

function cleanRepoName(name: string): string {
  if (!name) return 'Management'
  const parts = name.split('/')
  return parts[parts.length - 1]
}

function getRepoBadgeClass(name: string): string {
  const cleaned = cleanRepoName(name).toLowerCase()
  if (cleaned.includes('management')) {
    return 'bg-[#C98A4B]/10 border-[#C98A4B]/30 text-[#C98A4B]'
  }
  if (cleaned.includes('auth')) {
    return 'bg-sky-500/10 border-sky-500/30 text-sky-400'
  }
  return 'bg-purple-500/10 border-purple-500/30 text-purple-400'
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return 'just now'
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

async function onRefresh() {
  isRefreshing.value = true
  emit('refresh')
  try {
    await refreshGlobalCommits()
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 400)
  }
}

async function toggleDiff(commit: GitHubCommitItem) {
  const sha = commit.sha
  if (expandedShas.value.has(sha)) {
    expandedShas.value.delete(sha)
  } else {
    expandedShas.value.add(sha)
    if (!commitDetails.value[sha]) {
      commitDetails.value[sha] = { loading: true, data: null, error: null }
      try {
        const repo = commit.repoName
        const res = await $fetch<GitHubCommitDetail>('/api/github/commit-detail', {
          params: { repo, sha }
        })
        commitDetails.value[sha] = { loading: false, data: res, error: null }
      } catch (err: any) {
        commitDetails.value[sha] = {
          loading: false,
          data: null,
          error: err?.message || 'Failed to fetch diff from GitHub'
        }
      }
    }
  }
}
</script>
