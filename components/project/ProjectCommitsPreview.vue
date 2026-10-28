<template>
  <div class="obs-card p-4 sm:p-5 rounded-2xl bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] shadow-sm space-y-3 transition-all">
    <div class="flex items-center justify-between pb-2 border-b border-white/[0.06]">
      <div class="flex items-center gap-2">
        <NexuraIcon name="GitCommit" size="xs" class="text-indigo-400" />
        <h3 class="font-mono text-xs font-semibold text-[#F3F4F6] uppercase tracking-wider">
          Recent Repository Commits
        </h3>
      </div>
      <button
        type="button"
        class="font-mono text-[11px] text-[#8A8F9E] hover:text-indigo-400 transition-colors cursor-pointer inline-flex items-center gap-1"
        @click="$emit('view-all-commits')"
      >
        <span>View all commits</span>
        <NexuraIcon name="ArrowRight" size="xs" />
      </button>
    </div>

    <div v-if="commits && commits.length" class="space-y-2">
      <div
        v-for="commit in commits.slice(0, 3)"
        :key="commit.sha"
        class="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#07080A]/60 border border-white/[0.05] hover:border-white/[0.12] transition-colors"
      >
        <div class="min-w-0">
          <p class="font-mono text-xs text-[#F3F4F6] truncate" :title="commit.message">
            {{ commit.message }}
          </p>
          <div class="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#8A8F9E]">
            <span>{{ commit.authorName }}</span>
            <span>•</span>
            <span class="tabular-nums">{{ formatTime(commit.date) }}</span>
          </div>
        </div>
        <a
          :href="commit.htmlUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-[10px] tabular-nums text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0 hover:underline"
        >
          {{ commit.sha.slice(0, 7) }}
        </a>
      </div>
    </div>
    <div v-else class="py-6 text-center text-xs font-mono text-[#8A8F9E]">
      <span>No commits fetched or GitHub repository not linked.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubCommit } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

defineProps<{
  commits: GitHubCommit[]
}>()

defineEmits<{
  (e: 'view-all-commits'): void
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
