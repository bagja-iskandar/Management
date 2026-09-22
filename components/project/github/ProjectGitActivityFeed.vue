<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Commits Stream -->
    <div class="lg:col-span-2 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-mono text-xs uppercase tracking-wider text-[#756F68]">Commit Log</h3>
        <span v-if="commitsPending" class="font-mono text-[10px] text-[#C98A4B] animate-pulse">Syncing...</span>
      </div>

      <div v-if="commits && commits.length" class="space-y-2">
        <div
          v-for="commit in commits"
          :key="commit.sha"
          class="p-3 rounded-lg bg-[#09090B] border border-white/[0.04] space-y-1"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-mono text-xs text-[#F5F2EB] font-medium truncate">{{ commit.message }}</span>
            <a
              :href="commit.url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-[10px] text-[#C98A4B] hover:underline shrink-0 bg-[#C98A4B]/10 px-1.5 py-0.5 rounded border border-[#C98A4B]/20"
            >
              {{ commit.sha.slice(0, 7) }}
            </a>
          </div>
          <div class="flex items-center gap-3 font-mono text-[10px] text-[#756F68]">
            <span>{{ commit.authorName }}</span>
            <span>•</span>
            <span>{{ formatTime(commit.date) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center text-xs font-mono text-[#756F68] border border-dashed border-white/[0.06] rounded-xl">
        No commit data available.
      </div>
    </div>

    <!-- Branches List -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-mono text-xs uppercase tracking-wider text-[#756F68]">Branches</h3>
        <span v-if="branchesPending" class="font-mono text-[10px] text-[#C98A4B] animate-pulse">Loading...</span>
      </div>

      <div v-if="branches && branches.length" class="space-y-1.5">
        <div
          v-for="branch in branches"
          :key="branch.name"
          class="flex items-center justify-between font-mono text-xs py-1.5 px-2.5 rounded bg-white/[0.02] border border-white/[0.03]"
        >
          <div class="flex items-center gap-2 truncate">
            <svg class="w-3.5 h-3.5 text-[#C98A4B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <span class="text-[#F5F2EB] truncate">{{ branch.name }}</span>
            <span v-if="branch.protected" class="text-[9px] bg-red-950/60 text-red-400 px-1 py-0.5 rounded border border-red-800/40">
              protected
            </span>
          </div>
          <span class="text-[10px] text-[#756F68] shrink-0 font-mono">
            {{ branch.commitSha.slice(0, 7) }}
          </span>
        </div>
      </div>
      <div v-else class="py-8 text-center text-xs font-mono text-[#756F68] border border-dashed border-white/[0.06] rounded-xl">
        No branch information.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubCommit, GitHubBranch } from '~/types'

defineProps<{
  commits: GitHubCommit[]
  commitsPending: boolean
  branches: GitHubBranch[]
  branchesPending: boolean
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
