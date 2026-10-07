<template>
  <div class="p-5 rounded-2xl bg-[#111114] border border-white/[0.06] space-y-3">
    <div class="flex items-center justify-between pb-2 border-b border-white/[0.06]">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-[#C98A4B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4" />
          <line x1="1.05" y1="12" x2="7" y2="12" />
          <line x1="17.01" y1="12" x2="22.96" y2="12" />
        </svg>
        <h3 class="font-mono text-xs font-semibold text-[#F5F2EB] uppercase tracking-wider">
          Recent Repository Commits
        </h3>
      </div>
      <button
        type="button"
        class="font-mono text-[11px] text-[#756F68] hover:text-[#C98A4B] transition-colors cursor-pointer"
        @click="$emit('view-all-commits')"
      >
        View all commits →
      </button>
    </div>

    <div v-if="commits && commits.length" class="space-y-2">
      <div
        v-for="commit in commits.slice(0, 3)"
        :key="commit.sha"
        class="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-[#09090B]/70 border border-white/[0.04]"
      >
        <div class="min-w-0">
          <p class="font-mono text-xs text-[#F5F2EB] truncate" :title="commit.message">
            {{ commit.message }}
          </p>
          <div class="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#756F68]">
            <span>{{ commit.authorName }}</span>
            <span>•</span>
            <span>{{ formatTime(commit.date) }}</span>
          </div>
        </div>
        <a
          :href="commit.htmlUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-[10px] text-[#C98A4B] bg-[#C98A4B]/10 px-1.5 py-0.5 rounded border border-[#C98A4B]/20 shrink-0 hover:underline"
        >
          {{ commit.sha.slice(0, 7) }}
        </a>
      </div>
    </div>
    <div v-else class="py-6 text-center text-xs font-mono text-[#756F68]">
      <span>No commits fetched or GitHub repository not linked.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubCommit } from '~/types'

const props = defineProps<{
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
