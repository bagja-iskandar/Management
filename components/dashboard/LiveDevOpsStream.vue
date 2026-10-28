<template>
  <section class="obs-card rounded-xl overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 shrink-0">
      <div>
        <div class="flex items-center gap-2">
          <NexuraIcon name="Activity" size="sm" class="text-indigo-400 shrink-0" />
          <h2 class="text-sm font-semibold text-[#F3F4F6]">Live DevOps Activity Stream</h2>
          <span class="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.05] text-[#8A8F9E] hidden sm:inline">
            Live GitHub Sync
          </span>
        </div>
        <p class="text-xs text-[#8A8F9E] mt-0.5">
          Multi-channel commit, build, deployment &amp; review pulse
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Segmented Filter Tabs -->
        <div class="flex items-center gap-1 p-0.5 rounded-lg bg-[#0B0C10] border border-white/[0.06] text-xs">
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition font-medium cursor-pointer"
            :class="activeTab === 'all' ? 'bg-white/[0.09] text-[#F3F4F6]' : 'text-[#8A8F9E] hover:text-white'"
            @click="activeTab = 'all'"
          >
            All Stream ({{ allStreamItems.length }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition font-medium cursor-pointer"
            :class="activeTab === 'commits' ? 'bg-white/[0.09] text-[#F3F4F6]' : 'text-[#8A8F9E] hover:text-white'"
            @click="activeTab = 'commits'"
          >
            Commits ({{ commitItems.length }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition font-medium cursor-pointer"
            :class="activeTab === 'ci' ? 'bg-white/[0.09] text-[#F3F4F6]' : 'text-[#8A8F9E] hover:text-white'"
            @click="activeTab = 'ci'"
          >
            CI/CD ({{ workflowItems.length }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-md transition font-medium cursor-pointer"
            :class="activeTab === 'deployments' ? 'bg-white/[0.09] text-[#F3F4F6]' : 'text-[#8A8F9E] hover:text-white'"
            @click="activeTab = 'deployments'"
          >
            Deployments ({{ deploymentItems.length }})
          </button>
        </div>

        <!-- Refresh Button -->
        <button
          type="button"
          class="p-1 rounded bg-[#0B0C10] hover:bg-white/[0.08] border border-white/[0.06] text-[#8A8F9E] hover:text-[#F3F4F6] transition cursor-pointer"
          title="Refresh DevOps Stream"
          :disabled="isRefreshing"
          @click="refreshStream"
        >
          <NexuraIcon
            name="RotateCw"
            size="xs"
            :class="{ 'animate-spin text-indigo-400': isRefreshing }"
          />
        </button>
      </div>
    </div>

    <!-- Activity Stream List -->
    <div
      v-if="displayItems.length > 0"
      class="flex-1 min-h-[160px] max-h-[350px] overflow-y-auto custom-scrollbar divide-y divide-white/[0.05]"
      tabindex="0"
      role="region"
      aria-label="DevOps activity feed"
    >
      <div v-for="item in displayItems" :key="item.id" class="transition">
        <!-- Stream Row -->
        <div
          class="px-4 py-2.5 hover:bg-white/[0.03] flex items-center justify-between gap-3 cursor-pointer select-none group"
          @click="handleRowClick(item)"
        >
          <!-- Left: Glowing dot + Type Badge + Action Title -->
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <!-- Glowing Status Dot -->
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="getStatusDotClass(item.status, item.type)"
              :title="`Status: ${item.status}`"
            ></span>

            <!-- Badge (SHA / DEPLOY / CI/CD / PR #X) -->
            <span
              class="font-mono text-xs px-1.5 py-0.5 rounded shrink-0 border"
              :class="item.badgeClass"
            >
              {{ item.badge }}
            </span>

            <!-- Action Title -->
            <span
              class="text-xs sm:text-sm text-[#F3F4F6] truncate group-hover:text-white transition"
              :title="item.title"
            >
              {{ item.title }}
            </span>
          </div>

          <!-- Right: Repo pill + Relative time + Diff toggle indicator if commit -->
          <div class="flex items-center gap-2.5 shrink-0 font-mono text-xs text-[#8A8F9E]">
            <span v-if="item.repoName" class="hidden md:inline text-indigo-300">
              {{ cleanRepoName(item.repoName) }}
            </span>
            <span>{{ formatRelativeTime(item.date) }}</span>
            <span
              v-if="item.type === 'commit'"
              class="text-xs text-[#8A8F9E] w-3 text-center transition-transform"
            >
              {{ expandedShas.has(item.id) ? '▾' : '▸' }}
            </span>
            <a
              v-else-if="item.htmlUrl"
              :href="item.htmlUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="opacity-0 group-hover:opacity-100 text-[#8A8F9E] hover:text-white transition"
              title="Open on GitHub"
              @click.stop
            >
              <NexuraIcon name="ExternalLink" size="xs" />
            </a>
          </div>
        </div>

        <!-- Inline Code Diff Preview (Only for commits when expanded) -->
        <div
          v-if="item.type === 'commit' && expandedShas.has(item.id)"
          class="px-4 py-3 bg-[#07080A] border-t border-white/[0.05] font-mono text-xs space-y-2.5"
        >
          <!-- Loading State -->
          <div
            v-if="commitDetails[item.id]?.loading"
            class="text-[#8A8F9E] flex items-center gap-2 py-1.5 text-xs"
          >
            <NexuraIcon name="Loader2" size="xs" class="animate-spin text-indigo-400" />
            <span>Fetching commit diff from GitHub...</span>
          </div>

          <!-- Error State -->
          <div
            v-else-if="commitDetails[item.id]?.error"
            class="text-rose-400 text-xs py-1"
          >
            {{ commitDetails[item.id]?.error }}
          </div>

          <!-- No files recorded -->
          <div
            v-else-if="!commitDetails[item.id]?.data?.files?.length"
            class="text-[#8A8F9E] py-1 italic text-xs"
          >
            No file changes recorded for this commit.
          </div>

          <!-- Diff Files & Patch Lines -->
          <div v-else class="space-y-3">
            <div
              v-for="file in commitDetails[item.id]?.data?.files"
              :key="file.filename"
              class="space-y-1"
            >
              <div class="text-[#8A8F9E] pb-1 flex justify-between items-center text-xs border-b border-white/[0.04]">
                <span class="truncate pr-2 text-[#F3F4F6]">
                  {{ file.filename }} ·
                  <span class="text-emerald-400">+{{ file.additions }}</span>
                  <span class="text-rose-400"> -{{ file.deletions }}</span>
                </span>
                <span class="text-emerald-400 shrink-0 text-[11px] font-sans">✓ Verified</span>
              </div>

              <!-- Patch Lines -->
              <div v-if="getFormattedPatchLines(file.patch).length > 0" class="space-y-0.5 pt-0.5">
                <div
                  v-for="(line, lineIdx) in getFormattedPatchLines(file.patch)"
                  :key="lineIdx"
                  class="px-2 py-0.5 rounded text-[11px] truncate font-mono"
                  :class="line.startsWith('+') ? 'text-emerald-400/90 bg-emerald-500/10' : 'text-rose-400/90 bg-rose-500/10'"
                >
                  {{ line }}
                </div>
              </div>

              <div v-else class="text-[11px] text-[#8A8F9E] italic px-1">
                {{ file.status }} · +{{ file.additions }} / -{{ file.deletions }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="p-6 text-center text-xs text-[#8A8F9E] font-mono flex flex-col items-center justify-center space-y-1.5"
    >
      <NexuraIcon name="Activity" size="md" class="text-zinc-600 mb-1" />
      <div>{{ isRefreshing ? 'Synchronizing stream from GitHub...' : 'No activity recorded under current filter.' }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Project, GitHubCommitItem, GitHubCommitDetail } from '~/types'
import {
  useGitHubGlobalCommits,
  useGitHubWorkflows,
  useGitHubDeployments,
  useGitHubPullsAndIssues
} from '../../composables/useGitHub'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    projects?: Project[]
  }>(),
  {
    projects: () => []
  }
)

const activeTab = ref<'all' | 'commits' | 'ci' | 'deployments'>('all')
const isRefreshing = ref(false)
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

// Primary Repo for multi-channel feed
const primaryRepo = computed(() => {
  return props.projects?.[0]?.githubRepo || 'bagja-iskandar/Management'
})

// Composables
const { commits: globalCommits, refresh: refreshCommits } = useGitHubGlobalCommits(20)
const { workflows, refresh: refreshWorkflows } = useGitHubWorkflows(primaryRepo, 8)
const { deployments, refresh: refreshDeployments } = useGitHubDeployments(primaryRepo, 5)
const { activity, refresh: refreshPulls } = useGitHubPullsAndIssues(primaryRepo, 5)

export interface DevOpsStreamItem {
  id: string
  type: 'commit' | 'workflow' | 'deployment' | 'pull'
  status: 'success' | 'failure' | 'in_progress' | 'queued' | 'neutral'
  title: string
  badge: string
  badgeClass: string
  repoName?: string
  date: string
  htmlUrl?: string
  commitRaw?: GitHubCommitItem
}

// 1. Commit stream items
const commitItems = computed<DevOpsStreamItem[]>(() => {
  return (globalCommits.value || []).map((c) => ({
    id: c.sha,
    type: 'commit',
    status: 'success',
    title: c.message,
    badge: c.shortSha || c.sha.slice(0, 7),
    badgeClass: 'bg-white/[0.05] border-white/[0.07] text-[#F3F4F6]',
    repoName: c.repoName,
    date: c.date,
    htmlUrl: c.htmlUrl,
    commitRaw: c
  }))
})

// 2. Workflow CI/CD items
const workflowItems = computed<DevOpsStreamItem[]>(() => {
  return (workflows.value || []).map((w) => {
    let status: DevOpsStreamItem['status'] = 'neutral'
    if (w.status === 'completed') {
      status = w.conclusion === 'success' ? 'success' : 'failure'
    } else if (w.status === 'in_progress') {
      status = 'in_progress'
    } else if (w.status === 'queued') {
      status = 'queued'
    }

    return {
      id: `wf-${w.id}`,
      type: 'workflow',
      status,
      title: `${w.name}: ${w.commitMessage || w.event}`,
      badge: 'CI/CD',
      badgeClass:
        status === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : status === 'failure'
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      repoName: primaryRepo.value,
      date: w.updatedAt || w.createdAt,
      htmlUrl: w.htmlUrl
    }
  })
})

// 3. Deployment items
const deploymentItems = computed<DevOpsStreamItem[]>(() => {
  const list: DevOpsStreamItem[] = []

  // From github deployments summary
  if (deployments.value?.deployments) {
    for (const d of deployments.value.deployments) {
      list.push({
        id: `dep-${d.id}`,
        type: 'deployment',
        status: d.state === 'success' ? 'success' : d.state === 'failure' ? 'failure' : 'in_progress',
        title: `Deployment to ${d.environment} (${d.ref || d.shortSha || 'production'})`,
        badge: 'DEPLOY',
        badgeClass: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
        repoName: primaryRepo.value,
        date: d.updatedAt || d.createdAt,
        htmlUrl: d.environmentUrl || d.logUrl
      })
    }
  }

  // Also include PR reviews if available
  if (activity.value?.pullRequests) {
    for (const pr of activity.value.pullRequests) {
      list.push({
        id: `pr-${pr.id}`,
        type: 'pull',
        status: pr.state === 'open' ? 'in_progress' : 'success',
        title: `PR #${pr.number}: ${pr.title}`,
        badge: `PR #${pr.number}`,
        badgeClass: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
        repoName: primaryRepo.value,
        date: pr.updatedAt || pr.createdAt,
        htmlUrl: pr.htmlUrl
      })
    }
  }

  return list
})

// Combined All Stream
const allStreamItems = computed<DevOpsStreamItem[]>(() => {
  const merged = [...commitItems.value, ...workflowItems.value, ...deploymentItems.value]
  // Sort descending by date
  return merged.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0
    const db = b.date ? new Date(b.date).getTime() : 0
    return db - da
  })
})

// Filtered stream display capped at 8 items
const displayItems = computed(() => {
  let list = allStreamItems.value
  if (activeTab.value === 'commits') {
    list = commitItems.value
  } else if (activeTab.value === 'ci') {
    list = workflowItems.value
  } else if (activeTab.value === 'deployments') {
    list = deploymentItems.value
  }
  return list.slice(0, 8)
})

function getStatusDotClass(status: DevOpsStreamItem['status'], type: DevOpsStreamItem['type']): string {
  if (status === 'success') {
    return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
  }
  if (status === 'failure') {
    return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
  }
  if (status === 'in_progress' || status === 'queued') {
    return 'bg-amber-400 animate-pulse'
  }
  if (type === 'pull') {
    return 'bg-purple-400'
  }
  return 'bg-zinc-400'
}

function cleanRepoName(name: string): string {
  if (!name) return 'Management'
  const parts = name.split('/')
  return parts[parts.length - 1]
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'just now'
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
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function getFormattedPatchLines(patch?: string): string[] {
  if (!patch) return []
  return patch
    .split('\n')
    .filter((l) => (l.startsWith('+') && !l.startsWith('+++')) || (l.startsWith('-') && !l.startsWith('---')))
    .slice(0, 6)
}

function handleRowClick(item: DevOpsStreamItem) {
  if (item.type === 'commit' && item.commitRaw) {
    toggleDiff(item.commitRaw)
  } else if (item.htmlUrl) {
    window.open(item.htmlUrl, '_blank')
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
        const repo = commit.repoName || primaryRepo.value
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

async function refreshStream() {
  isRefreshing.value = true
  try {
    await Promise.allSettled([
      refreshCommits(),
      refreshWorkflows(),
      refreshDeployments(),
      refreshPulls()
    ])
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 400)
  }
}
</script>
