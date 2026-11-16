<template>
  <div class="p-4 sm:p-5 rounded-2xl bg-void/80 border border-white/[0.06] space-y-4">
    <!-- Panel Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0"></span>
        <div>
          <h3 class="font-mono text-xs uppercase tracking-wider text-foreground font-semibold flex items-center gap-2">
            <span>Pull Requests & Issues Feed</span>
            <span
              v-if="projectPullsIssues && openPrsCount > 0"
              class="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent-light border border-accent/30 tabular-nums"
            >
              {{ openPrsCount }} Open PR{{ openPrsCount > 1 ? 's' : '' }}
            </span>
            <span
              v-else
              class="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-muted border border-white/[0.06]"
            >
              Live Stream
            </span>
          </h3>
          <p class="font-sans text-xs text-muted">
            Real-time pull request activity, backlog issue tracking, and instant Kanban task import.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Open Cockpit Modal Button -->
        <button
          type="button"
          class="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent-light font-mono text-xs font-semibold border border-accent/30 transition-colors focus:ring-1 focus:ring-accent/50 focus:outline-none cursor-pointer"
          title="Open full PRs & Issues Cockpit in modal"
          @click="$emit('open-modal')"
        >
          <span>Open Cockpit Modal</span>
          <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-foreground font-mono text-xs border border-white/[0.06] transition-colors focus:ring-1 focus:ring-accent/50 focus:outline-none cursor-pointer"
          :disabled="pullsIssuesPending"
          title="Refresh PRs and issues realtime"
          @click="$emit('refresh')"
        >
          <NexuraIcon
            name="RotateCw"
            size="xs"
            :class="{ 'animate-spin text-accent-light': pullsIssuesPending }"
          />
          <span>{{ pullsIssuesPending ? 'Syncing...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- 4 Bento Metric Tiles -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3.5 rounded-xl bg-surface border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-xs uppercase tracking-wider text-muted flex items-center justify-between">
          <span>Open PRs</span>
          <span class="w-1.5 h-1.5 rounded-full" :class="openPrsCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'"></span>
        </span>
        <div class="font-mono text-2xl font-semibold text-emerald-400 tabular-nums">{{ openPrsCount }}</div>
        <div class="font-mono text-xs text-muted truncate">Awaiting review & merge</div>
      </div>

      <div class="p-3.5 rounded-xl bg-surface border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-xs uppercase tracking-wider text-muted flex items-center justify-between">
          <span>Open Issues</span>
          <span class="w-1.5 h-1.5 rounded-full" :class="openIssuesCount > 0 ? 'bg-accent-light' : 'bg-zinc-600'"></span>
        </span>
        <div class="font-mono text-2xl font-semibold text-accent-light tabular-nums">{{ openIssuesCount }}</div>
        <div class="font-mono text-xs text-muted truncate">Active backlog tasks</div>
      </div>

      <div class="p-3.5 rounded-xl bg-surface border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-xs uppercase tracking-wider text-muted flex items-center justify-between">
          <span>Merged PRs</span>
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
        </span>
        <div class="font-mono text-2xl font-semibold text-purple-400 tabular-nums">{{ mergedPrsCount }}</div>
        <div class="font-mono text-xs text-muted truncate">Shipped to main branch</div>
      </div>

      <div class="p-3.5 rounded-xl bg-surface border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-xs uppercase tracking-wider text-muted flex items-center justify-between">
          <span>Closed Issues</span>
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        </span>
        <div class="font-mono text-2xl font-semibold text-foreground tabular-nums">{{ closedIssuesCount }}</div>
        <div class="font-mono text-xs text-muted truncate">Resolved & completed</div>
      </div>
    </div>

    <!-- Dual Column Stream: Pull Requests & Issues Lists -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
      <!-- Column 1: PRs List -->
      <div class="space-y-2.5 p-3.5 rounded-xl bg-surface border border-white/[0.04]">
        <div class="flex items-center justify-between pb-2 border-b border-white/[0.04]">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs uppercase tracking-wider text-foreground font-semibold flex items-center gap-1.5">
              <NexuraIcon name="GitPullRequest" size="xs" class="text-accent-light" />
              <span>Pull Requests</span>
            </span>
            <span class="font-mono text-xs tabular-nums px-1.5 py-0.5 rounded-full bg-white/5 text-muted">
              {{ (projectPullsIssues?.pullRequests || []).length }}
            </span>
          </div>
          <button
            type="button"
            class="font-mono text-xs text-accent-light hover:underline cursor-pointer inline-flex items-center gap-0.5"
            @click="$emit('open-modal')"
          >
            <span>View all</span>
            <NexuraIcon name="ArrowRight" size="xs" />
          </button>
        </div>

        <div v-if="projectPullsIssues?.pullRequests && projectPullsIssues.pullRequests.length > 0" class="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
          <div
            v-for="pr in projectPullsIssues.pullRequests.slice(0, 5)"
            :key="pr.id"
            class="p-3 rounded-xl bg-void/60 border border-white/[0.05] hover:border-white/[0.12] transition-colors space-y-1.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  class="px-2 py-0.5 rounded-full font-mono text-xs font-semibold border uppercase"
                  :class="getPrBadgeClass(pr)"
                >
                  {{ getPrStatusText(pr) }}
                </span>
                <span class="font-mono text-xs font-semibold text-accent-light tabular-nums">#{{ pr.number }}</span>
                <span class="font-sans text-xs text-foreground font-medium truncate max-w-xs" :title="pr.title">
                  {{ pr.title }}
                </span>
              </div>
              <a
                :href="pr.htmlUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="group p-0.5 font-mono text-xs text-muted hover:text-accent-light shrink-0 inline-flex items-center"
                title="Open on GitHub"
              >
                <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            <div class="flex items-center gap-2 font-mono text-xs text-muted flex-wrap justify-between">
              <div class="flex items-center gap-1.5">
                <span>{{ pr.authorName }}</span>
                <span>•</span>
                <span class="text-accent-light">{{ pr.headBranch }}</span>
                <NexuraIcon name="ArrowRight" size="xs" class="text-dim" />
                <span>{{ pr.baseBranch }}</span>
              </div>
              <span class="tabular-nums">{{ formatCommitTime(pr.updatedAt || pr.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="py-8 text-center text-xs font-mono text-muted">
          No pull requests recorded.
        </div>
      </div>

      <!-- Column 2: Issues List with Quick Import -->
      <div class="space-y-2.5 p-3.5 rounded-xl bg-surface border border-white/[0.04]">
        <div class="flex items-center justify-between pb-2 border-b border-white/[0.04]">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs uppercase tracking-wider text-foreground font-semibold flex items-center gap-1.5">
              <NexuraIcon name="AlertCircle" size="xs" class="text-accent-light" />
              <span>Backlog Issues</span>
            </span>
            <span class="font-mono text-xs tabular-nums px-1.5 py-0.5 rounded-full bg-white/5 text-muted">
              {{ (projectPullsIssues?.issues || []).length }}
            </span>
          </div>
          <button
            type="button"
            class="font-mono text-xs text-accent-light hover:underline cursor-pointer inline-flex items-center gap-0.5"
            @click="$emit('open-modal')"
          >
            <span>+ New Issue</span>
            <NexuraIcon name="ArrowRight" size="xs" />
          </button>
        </div>

        <div v-if="projectPullsIssues?.issues && projectPullsIssues.issues.length > 0" class="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
          <div
            v-for="issue in projectPullsIssues.issues.slice(0, 5)"
            :key="issue.id"
            class="p-3 rounded-xl bg-void/60 border border-white/[0.05] hover:border-white/[0.12] transition-colors space-y-1.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap min-w-0">
                <span
                  class="px-2 py-0.5 rounded-full font-mono text-xs font-semibold border uppercase"
                  :class="issue.state === 'open' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'"
                >
                  {{ issue.state === 'open' ? 'Open' : 'Closed' }}
                </span>
                <span class="font-mono text-xs font-semibold text-accent-light tabular-nums">#{{ issue.number }}</span>
                <span class="font-sans text-xs text-foreground font-medium truncate max-w-xs" :title="issue.title">
                  {{ issue.title }}
                </span>
              </div>

              <!-- Quick Import Button -->
              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-lg font-mono text-xs border transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  :class="inPanelImportedIssues[issue.number]
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-accent/10 hover:bg-accent/20 text-accent-light border-accent/30'"
                  :disabled="inPanelImportingId === issue.id || !!inPanelImportedIssues[issue.number]"
                  title="Import issue to Kanban board"
                  @click="$emit('import-issue', issue)"
                >
                  <NexuraIcon v-if="inPanelImportingId === issue.id" name="RotateCw" size="xs" class="animate-spin text-accent-light" />
                  <NexuraIcon v-else-if="inPanelImportedIssues[issue.number]" name="Check" size="xs" />
                  <NexuraIcon v-else name="Plus" size="xs" />
                  <span>{{ inPanelImportedIssues[issue.number] ? 'Imported' : 'Import' }}</span>
                </button>
                <a
                  :href="issue.htmlUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group p-0.5 text-muted hover:text-accent-light font-mono text-xs inline-flex items-center"
                  title="Open on GitHub"
                >
                  <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

            <div class="flex items-center gap-2 font-mono text-xs text-muted flex-wrap justify-between">
              <div class="flex items-center gap-1.5">
                <span>{{ issue.authorName }}</span>
                <span>•</span>
                <span v-for="tag in (issue.labels || []).slice(0, 2)" :key="tag.name" class="text-muted">
                  #{{ tag.name }}
                </span>
              </div>
              <span class="tabular-nums">{{ formatCommitTime(issue.updatedAt || issue.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="py-8 text-center text-xs font-mono text-muted">
          No backlog issues found.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubRepoActivitySummary, GitHubPullRequest } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

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
  return 'border-rose-500/30 bg-rose-500/10 text-rose-400'
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
