<template>
  <div class="obs-card p-4 sm:p-5 rounded-2xl bg-surface border border-white/[0.07] hover:border-white/[0.14] shadow-sm space-y-3 transition-all flex flex-col h-full min-h-0">
    <div class="flex items-center justify-between pb-2 border-b border-white/[0.06] shrink-0">
      <div class="flex items-center gap-2">
        <NexuraIcon name="GitCommit" size="xs" class="text-accent-light" />
        <h3 class="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
          Recent Repository Commits
        </h3>
      </div>
      <div class="flex items-center gap-2.5">
        <div v-if="branches && branches.length" class="relative">
          <select
            id="overview-branch-selector"
            :value="selectedBranch || (branches?.[0]?.name || '')"
            class="bg-void border border-white/[0.08] hover:border-white/[0.15] rounded-lg pl-6 pr-6 py-0.5 text-xs font-mono text-foreground outline-none transition focus:border-accent/50 cursor-pointer appearance-none"
            :disabled="branchesPending"
            @change="(e: Event) => $emit('select-branch', (e.target as HTMLSelectElement).value)"
          >
            <option v-for="b in branches" :key="b.name" :value="b.name">
              {{ b.name }}
            </option>
          </select>
          <div class="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none text-accent-light">
            <NexuraIcon name="GitBranch" size="xs" />
          </div>
          <div class="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none text-muted">
            <NexuraIcon name="ChevronDown" size="xs" />
          </div>
        </div>
        <button
          type="button"
          class="font-mono text-xs text-muted hover:text-accent-light transition-colors cursor-pointer inline-flex items-center gap-1"
          @click="$emit('view-all-commits')"
        >
          <span>View all commits</span>
          <NexuraIcon name="ArrowRight" size="xs" />
        </button>
      </div>
    </div>

    <div v-if="commits && commits.length" class="space-y-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
      <div
        v-for="commit in commits"
        :key="commit.sha"
        class="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-void/60 border border-white/[0.05] hover:border-white/[0.12] transition-colors"
      >
        <div class="min-w-0">
          <p class="font-mono text-xs text-foreground truncate" :title="commit.message">
            {{ commit.message }}
          </p>
          <div class="flex items-center gap-2 mt-1 text-xs font-mono text-muted">
            <span>{{ commit.authorName }}</span>
            <span>•</span>
            <span class="tabular-nums">{{ formatTime(commit.date) }}</span>
          </div>
        </div>
        <a
          :href="commit.htmlUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-xs tabular-nums text-accent-light bg-accent/10 px-2 py-0.5 rounded border border-accent/20 shrink-0 hover:underline"
        >
          {{ commit.sha.slice(0, 7) }}
        </a>
      </div>
    </div>
    <div v-else class="py-6 text-center text-xs font-mono text-muted">
      <span>No commits fetched or GitHub repository not linked.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubCommit, GitHubBranch } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

defineProps<{
  commits: GitHubCommit[]
  commitsPending?: boolean
  branches?: GitHubBranch[]
  branchesPending?: boolean
  selectedBranch?: string
}>()

defineEmits<{
  (e: 'view-all-commits'): void
  (e: 'select-branch', branchName: string): void
}>()

function formatTime(dateStr: string): string {
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
