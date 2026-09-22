<template>
  <div class="space-y-3">
    <!-- Header Row -->
    <div class="flex items-center justify-between">
      <h3 class="font-mono text-xs uppercase tracking-wider text-[#756F68] font-semibold">
        RECENT COMMITS
      </h3>
      <a
        v-if="repo"
        :href="`https://github.com/${repo}/commits`"
        target="_blank"
        rel="noopener noreferrer"
        class="font-mono text-xs text-[#C98A4B] hover:underline flex items-center gap-1 transition-colors"
      >
        <span>View all</span>
        <span>→</span>
      </a>
    </div>

    <!-- Case 1: No Repo Linked -->
    <div
      v-if="!repo"
      class="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] font-mono text-xs text-[#756F68] flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <span>🐙</span>
        <span>Link a GitHub repo to see commits</span>
      </div>
      <NuxtLink
        to="/repos"
        class="text-[#C98A4B] hover:underline shrink-0 font-medium"
      >
        Connect Repo →
      </NuxtLink>
    </div>

    <!-- Case 2: Loading State -->
    <div v-else-if="pending && !commits?.length" class="space-y-2 py-2">
      <div v-for="i in 3" :key="i" class="h-10 rounded bg-white/[0.02] animate-pulse"></div>
    </div>

    <!-- Case 3: Empty Commits -->
    <div
      v-else-if="!commits || commits.length === 0"
      class="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] font-mono text-xs text-[#756F68]"
    >
      No recent commits found in repository.
    </div>

    <!-- Case 4: Commits Timeline -->
    <div v-else class="relative pl-4 sm:pl-5 border-l border-white/[0.08] space-y-4 my-2 ml-1 sm:ml-2">
      <div
        v-for="commit in commits"
        :key="commit.sha"
        class="relative group"
      >
        <!-- Timeline Marker Bullet -->
        <span
          class="absolute -left-[21px] sm:-left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-[#111114] border-2 border-[#C98A4B] group-hover:scale-125 transition-transform"
          aria-hidden="true"
        ></span>

        <div class="space-y-1.5">
          <!-- Commit Message & Diff Toggle -->
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <a
                :href="commit.htmlUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="font-mono text-xs text-[#F5F2EB] font-medium hover:text-[#C98A4B] transition-colors leading-relaxed block break-words"
              >
                {{ commit.message }}
              </a>
            </div>

            <button
              type="button"
              class="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-[#C98A4B]/20 text-[#756F68] hover:text-[#C98A4B] border border-white/[0.06] hover:border-[#C98A4B]/30 transition-colors shrink-0 flex items-center gap-1"
              @click="toggleDiff(commit.sha)"
            >
              <span>{{ isExpanded(commit.sha) ? '▾ Hide' : '▸ Diff' }}</span>
            </button>
          </div>

          <!-- Commit Metadata: SHA + Author + Time -->
          <div class="flex items-center gap-2 text-[11px] font-mono text-[#756F68] flex-wrap">
            <span class="text-[#C98A4B] font-semibold">#{{ commit.shortSha }}</span>
            <span>by {{ commit.authorName }}</span>
            <span class="opacity-40">·</span>
            <span>{{ formatRelativeTime(commit.date) }}</span>
          </div>

          <!-- Expandable Diff Panel -->
          <div
            v-if="isExpanded(commit.sha)"
            class="mt-2.5 p-3 rounded-lg bg-[#09090B] border border-white/[0.08] space-y-3 font-mono text-xs text-[#F5F2EB]"
          >
            <!-- Loading Diff -->
            <div v-if="loadingDiff[commit.sha]" class="flex items-center gap-2 text-[#756F68] py-2">
              <span class="w-3 h-3 border-2 border-[#C98A4B] border-t-transparent rounded-full animate-spin"></span>
              <span>Loading commit diff from GitHub...</span>
            </div>

            <!-- Diff Content -->
            <div v-else-if="commitDetails[commit.sha]" class="space-y-3">
              <!-- Summary Stats Header -->
              <div class="flex items-center justify-between pb-2 border-b border-white/[0.06] text-[11px]">
                <span class="text-[#756F68]">
                  Files changed: {{ commitDetails[commit.sha]?.files.length || 0 }}
                </span>
                <div v-if="commitDetails[commit.sha]?.stats" class="flex items-center gap-2">
                  <span class="text-green-400 font-bold">+{{ commitDetails[commit.sha]?.stats?.additions }}</span>
                  <span class="text-red-400 font-bold">-{{ commitDetails[commit.sha]?.stats?.deletions }}</span>
                </div>
              </div>

              <!-- Changed Files with Patch Snippet -->
              <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                <div
                  v-for="file in commitDetails[commit.sha]?.files"
                  :key="file.filename"
                  class="p-2 rounded bg-white/[0.02] border border-white/[0.04] space-y-1.5"
                >
                  <div class="flex items-center justify-between text-[11px] gap-2">
                    <span class="text-[#F5F2EB] truncate font-medium" :title="file.filename">
                      {{ file.filename }}
                    </span>
                    <span
                      class="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0"
                      :class="statusBadgeClass(file.status)"
                    >
                      {{ file.status }}
                    </span>
                  </div>

                  <!-- Patch Snippet -->
                  <pre
                    v-if="file.patch"
                    class="p-2 rounded bg-[#111114] border border-white/[0.04] text-[10px] overflow-x-auto text-[#756F68] font-mono leading-tight whitespace-pre max-h-32"
                  ><span
                    v-for="(line, idx) in file.patch.split('\n')"
                    :key="idx"
                    :class="patchLineClass(line)"
                    class="block"
                  >{{ line }}</span></pre>
                </div>
              </div>
            </div>

            <!-- Fallback if null / failed -->
            <div v-else class="text-[#756F68] py-1 text-[11px]">
              No patch diff details available.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGitHubCommits, useGitHub } from '../composables/useGitHub'
import type { GitHubCommitDetail } from '../types'

const props = withDefaults(
  defineProps<{
    repo?: string
    limit?: number
  }>(),
  {
    repo: '',
    limit: 4
  }
)

const repoRef = computed(() => props.repo || '')
const { commits, pending } = useGitHubCommits(repoRef, props.limit)
const { fetchCommitDetail } = useGitHub()

const expandedShas = ref<Record<string, boolean>>({})
const commitDetails = ref<Record<string, GitHubCommitDetail | null>>({})
const loadingDiff = ref<Record<string, boolean>>({})

function isExpanded(sha: string) {
  return !!expandedShas.value[sha]
}

async function toggleDiff(sha: string) {
  if (expandedShas.value[sha]) {
    expandedShas.value[sha] = false
    return
  }

  expandedShas.value[sha] = true

  if (!commitDetails.value[sha] && props.repo) {
    loadingDiff.value[sha] = true
    try {
      const detail = await fetchCommitDetail(props.repo, sha)
      commitDetails.value[sha] = detail
    } catch {
      commitDetails.value[sha] = null
    } finally {
      loadingDiff.value[sha] = false
    }
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'added':
      return 'bg-green-500/20 text-green-400'
    case 'removed':
      return 'bg-red-500/20 text-red-400'
    case 'modified':
    default:
      return 'bg-[#C98A4B]/20 text-[#C98A4B]'
  }
}

function patchLineClass(line: string) {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return 'text-green-400 bg-green-950/20'
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return 'text-red-400 bg-red-950/20'
  }
  if (line.startsWith('@')) {
    return 'text-blue-400 opacity-80'
  }
  return 'text-[#756F68]'
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths}mo ago`
}
</script>
