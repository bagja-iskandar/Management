<template>
  <div class="p-4 sm:p-5 rounded-xl bg-[#09090B] border border-white/[0.06] space-y-4">
    <!-- Panel Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full bg-[#C98A4B] animate-pulse shrink-0"></span>
        <div>
          <h3 class="font-mono text-xs uppercase tracking-wider text-[#F5F2EB] font-bold flex items-center gap-2">
            <span>Pull Requests & Issues Feed</span>
            <span
              v-if="projectPullsIssues && openPrsCount > 0"
              class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#C98A4B]/15 text-[#C98A4B] border border-[#C98A4B]/30"
            >
              {{ openPrsCount }} Open PR{{ openPrsCount > 1 ? 's' : '' }}
            </span>
            <span
              v-else
              class="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-white/5 text-[#756F68] border border-white/[0.06]"
            >
              Live Stream
            </span>
          </h3>
          <p class="font-sans text-[11px] text-[#756F68]">
            Real-time pull request activity, backlog issue tracking, and instant Kanban task import.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Open Cockpit Modal Button -->
        <button
          type="button"
          class="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C98A4B]/10 hover:bg-[#C98A4B]/20 text-[#C98A4B] font-mono text-[11px] font-semibold border border-[#C98A4B]/30 transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          title="Open full PRs & Issues Cockpit in modal"
          @click="$emit('open-modal')"
        >
          <span>Open Cockpit Modal</span>
          <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] font-mono text-[11px] border border-white/[0.06] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
          :disabled="pullsIssuesPending"
          title="Refresh PRs and issues realtime"
          @click="$emit('refresh')"
        >
          <svg
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': pullsIssuesPending }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ pullsIssuesPending ? 'Syncing...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- 4 Bento Metric Tiles -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3.5 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68] flex items-center justify-between">
          <span>Open PRs</span>
          <span class="w-1.5 h-1.5 rounded-full" :class="openPrsCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-[#756F68]'"></span>
        </span>
        <div class="font-mono text-2xl font-bold text-emerald-400">{{ openPrsCount }}</div>
        <div class="font-mono text-[10px] text-[#756F68] truncate">Awaiting review & merge</div>
      </div>

      <div class="p-3.5 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68] flex items-center justify-between">
          <span>Open Issues</span>
          <span class="w-1.5 h-1.5 rounded-full" :class="openIssuesCount > 0 ? 'bg-[#C98A4B]' : 'bg-[#756F68]'"></span>
        </span>
        <div class="font-mono text-2xl font-bold text-[#C98A4B]">{{ openIssuesCount }}</div>
        <div class="font-mono text-[10px] text-[#756F68] truncate">Active backlog tasks</div>
      </div>

      <div class="p-3.5 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68] flex items-center justify-between">
          <span>Merged PRs</span>
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
        </span>
        <div class="font-mono text-2xl font-bold text-purple-400">{{ mergedPrsCount }}</div>
        <div class="font-mono text-[10px] text-[#756F68] truncate">Shipped to main branch</div>
      </div>

      <div class="p-3.5 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68] flex items-center justify-between">
          <span>Closed Issues</span>
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        </span>
        <div class="font-mono text-2xl font-bold text-[#F5F2EB]">{{ closedIssuesCount }}</div>
        <div class="font-mono text-[10px] text-[#756F68] truncate">Resolved & completed</div>
      </div>
    </div>

    <!-- Dual Column Stream: Pull Requests & Issues Lists -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
      <!-- Column 1: PRs List -->
      <div class="space-y-2.5 p-3.5 rounded-xl bg-[#111114] border border-white/[0.04]">
        <div class="flex items-center justify-between pb-2 border-b border-white/[0.04]">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs uppercase tracking-wider text-[#F5F2EB] font-semibold flex items-center gap-1.5">
              <span>🔀</span>
              <span>Pull Requests</span>
            </span>
            <span class="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 text-[#756F68]">
              {{ (projectPullsIssues?.pullRequests || []).length }}
            </span>
          </div>
          <button
            type="button"
            class="font-mono text-[11px] text-[#C98A4B] hover:underline cursor-pointer"
            @click="$emit('open-modal')"
          >
            View all →
          </button>
        </div>

        <div v-if="projectPullsIssues?.pullRequests && projectPullsIssues.pullRequests.length > 0" class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <div
            v-for="pr in projectPullsIssues.pullRequests.slice(0, 5)"
            :key="pr.id"
            class="p-3 rounded-lg bg-[#09090B] border border-white/[0.04] hover:border-white/[0.08] transition-colors space-y-1.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  class="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-semibold border uppercase"
                  :class="getPrBadgeClass(pr)"
                >
                  {{ getPrStatusText(pr) }}
                </span>
                <span class="font-mono text-xs font-bold text-[#C98A4B]">#{{ pr.number }}</span>
                <span class="font-sans text-xs text-[#F5F2EB] font-medium truncate max-w-xs" :title="pr.title">
                  {{ pr.title }}
                </span>
              </div>
              <a
                :href="pr.htmlUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="group p-0.5 font-mono text-[11px] text-[#756F68] hover:text-[#C98A4B] shrink-0 inline-flex items-center"
                title="Open on GitHub"
              >
                <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            <div class="flex items-center gap-2 font-mono text-[10px] text-[#756F68] flex-wrap justify-between">
              <div class="flex items-center gap-1.5">
                <span>{{ pr.authorName }}</span>
                <span>•</span>
                <span class="text-[#C98A4B]">{{ pr.headBranch }}</span>
                <span>➔</span>
                <span>{{ pr.baseBranch }}</span>
              </div>
              <span>{{ formatCommitTime(pr.updatedAt || pr.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="py-8 text-center text-xs font-mono text-[#756F68]">
          No pull requests recorded.
        </div>
      </div>

      <!-- Column 2: Issues List with Quick Import -->
      <div class="space-y-2.5 p-3.5 rounded-xl bg-[#111114] border border-white/[0.04]">
        <div class="flex items-center justify-between pb-2 border-b border-white/[0.04]">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs uppercase tracking-wider text-[#F5F2EB] font-semibold flex items-center gap-1.5">
              <span>🎯</span>
              <span>Backlog Issues</span>
            </span>
            <span class="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 text-[#756F68]">
              {{ (projectPullsIssues?.issues || []).length }}
            </span>
          </div>
          <button
            type="button"
            class="font-mono text-[11px] text-[#C98A4B] hover:underline cursor-pointer"
            @click="$emit('open-modal')"
          >
            + New Issue →
          </button>
        </div>

        <div v-if="projectPullsIssues?.issues && projectPullsIssues.issues.length > 0" class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <div
            v-for="issue in projectPullsIssues.issues.slice(0, 5)"
            :key="issue.id"
            class="p-3 rounded-lg bg-[#09090B] border border-white/[0.04] hover:border-white/[0.08] transition-colors space-y-1.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  class="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-semibold border uppercase"
                  :class="issue.state === 'open' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'"
                >
                  {{ issue.state === 'open' ? 'Open' : 'Closed' }}
                </span>
                <span class="font-mono text-xs font-bold text-[#C98A4B]">#{{ issue.number }}</span>
                <span class="font-sans text-xs text-[#F5F2EB] font-medium truncate max-w-xs" :title="issue.title">
                  {{ issue.title }}
                </span>
              </div>

              <!-- Quick Import Button -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded font-mono text-[10px] border transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  :class="inPanelImportedIssues[issue.number]
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#C98A4B]/10 hover:bg-[#C98A4B]/20 text-[#C98A4B] border-[#C98A4B]/30'"
                  :disabled="inPanelImportingId === issue.id || !!inPanelImportedIssues[issue.number]"
                  title="Import issue to Kanban board"
                  @click="$emit('import-issue', issue)"
                >
                  <span v-if="inPanelImportingId === issue.id" class="w-2.5 h-2.5 border border-[#C98A4B] border-t-transparent rounded-full animate-spin"></span>
                  <span v-else-if="inPanelImportedIssues[issue.number]">✓</span>
                  <span v-else>+</span>
                  <span>{{ inPanelImportedIssues[issue.number] ? 'Imported' : 'Import' }}</span>
                </button>
                <a
                  :href="issue.htmlUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group p-0.5 text-[#756F68] hover:text-[#C98A4B] font-mono text-[11px] inline-flex items-center"
                  title="Open on GitHub"
                >
                  <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

            <div class="flex items-center gap-2 font-mono text-[10px] text-[#756F68] flex-wrap justify-between">
              <div class="flex items-center gap-1.5">
                <span>{{ issue.authorName }}</span>
                <span>•</span>
                <span v-for="tag in (issue.labels || []).slice(0, 2)" :key="tag.name" class="text-[#F5F2EB]/70">
                  #{{ tag.name }}
                </span>
              </div>
              <span>{{ formatCommitTime(issue.updatedAt || issue.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="py-8 text-center text-xs font-mono text-[#756F68]">
          No backlog issues found.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubRepoActivitySummary, GitHubPullRequest } from '~/types'
import IconArrowUpRight from '../IconArrowUpRight.vue'

defineProps<{
  projectPullsIssues: GitHubRepoActivitySummary | null
  pullsIssuesPending: boolean
  inPanelImportingId: number | null
  inPanelImportedIssues: Record<number, boolean>
  openPrsCount: number
  openIssuesCount: number
  mergedPrsCount: number
  closedIssuesCount: number
}>()

defineEmits<{
  (e: 'open-modal'): void
  (e: 'refresh'): void
  (e: 'import-issue', issue: any): void
}>()

function getPrBadgeClass(pr: GitHubPullRequest): string {
  if (pr.state === 'merged') return 'border-purple-500/30 bg-purple-500/10 text-purple-400'
  if (pr.state === 'open') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  return 'border-red-500/30 bg-red-500/10 text-red-400'
}

function getPrStatusText(pr: GitHubPullRequest): string {
  if (pr.state === 'merged') return 'Merged'
  if (pr.state === 'open') return 'Open'
  return 'Closed'
}

function formatCommitTime(dateStr: string): string {
  if (!dateStr) return 'recently'
  try {
    const d = new Date(dateStr)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  } catch {
    return dateStr
  }
}
</script>
