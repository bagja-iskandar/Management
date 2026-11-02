<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Commits Stream -->
    <div class="lg:col-span-2 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h3 class="font-mono text-xs uppercase tracking-wider text-[#8A8F9E]">Commit Log</h3>
          <div class="flex items-center gap-2">
            <label for="branch-selector" class="sr-only">Select Branch</label>
            <div class="relative">
              <select
                id="branch-selector"
                :value="selectedBranch || (branches?.[0]?.name || '')"
                class="bg-[#07080A] border border-white/[0.08] rounded-lg pl-7 pr-8 py-1 text-xs font-mono text-[#F3F4F6] outline-none transition focus:border-indigo-500/50 cursor-pointer appearance-none"
                :disabled="branchesPending"
                @change="(e: Event) => $emit('select-branch', (e.target as HTMLSelectElement).value)"
              >
                <option v-for="b in branches" :key="b.name" :value="b.name">
                  {{ b.name }} {{ b.protected ? '(protected)' : '' }}
                </option>
              </select>
              <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-indigo-400">
                <NexuraIcon name="GitBranch" size="xs" />
              </div>
              <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#8A8F9E]">
                <NexuraIcon name="ChevronDown" size="xs" />
              </div>
            </div>
          </div>
        </div>
        <span v-if="commitsPending" class="font-mono text-[10px] text-indigo-400 animate-pulse">Syncing...</span>
      </div>

      <div v-if="commits && commits.length" class="space-y-2">
        <div
          v-for="commit in commits"
          :key="commit.sha"
          class="p-3 rounded-xl bg-[#07080A]/60 border border-white/[0.05] space-y-1 hover:border-white/[0.12] transition-colors"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-mono text-xs text-[#F3F4F6] font-medium truncate">{{ commit.message }}</span>
            <a
              :href="commit.url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-[10px] tabular-nums text-indigo-400 hover:underline shrink-0 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
            >
              {{ commit.sha.slice(0, 7) }}
            </a>
          </div>
          <div class="flex items-center gap-3 font-mono text-[10px] text-[#8A8F9E]">
            <span>{{ commit.authorName }}</span>
            <span>•</span>
            <span class="tabular-nums">{{ formatTime(commit.date) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="py-8 text-center text-xs font-mono text-[#8A8F9E] border border-dashed border-white/[0.06] rounded-xl">
        No commit data available.
      </div>
    </div>

    <!-- Branches List -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-mono text-xs uppercase tracking-wider text-[#8A8F9E]">Branches</h3>
        <span v-if="branchesPending" class="font-mono text-[10px] text-indigo-400 animate-pulse">Loading...</span>
      </div>

      <div v-if="branches && branches.length" class="space-y-1.5">
        <div
          v-for="branch in branches"
          :key="branch.name"
          class="flex items-center justify-between font-mono text-xs py-2 px-3 rounded-lg border transition-colors cursor-pointer"
          :class="[
            selectedBranch === branch.name
              ? 'border-indigo-500/40 bg-indigo-500/10'
              : 'bg-[#07080A]/60 border-white/[0.05] hover:border-white/[0.1]'
          ]"
          @click="$emit('select-branch', branch.name)"
        >
          <div class="flex items-center gap-2 truncate">
            <NexuraIcon name="GitBranch" size="xs" :class="selectedBranch === branch.name ? 'text-indigo-300' : 'text-indigo-400'" class="shrink-0" />
            <span :class="selectedBranch === branch.name ? 'text-indigo-200 font-medium' : 'text-[#F3F4F6]'" class="truncate">{{ branch.name }}</span>
            <span v-if="branch.protected" class="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.2 rounded border border-rose-500/20 font-semibold uppercase">
              protected
            </span>
          </div>
          <span class="text-[10px] text-[#8A8F9E] shrink-0 font-mono tabular-nums">
            {{ branch.commitSha.slice(0, 7) }}
          </span>
        </div>
      </div>
      <div v-else class="py-8 text-center text-xs font-mono text-[#8A8F9E] border border-dashed border-white/[0.06] rounded-xl">
        No branch information.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubCommit, GitHubBranch } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

defineProps<{
  commits: GitHubCommit[]
  commitsPending: boolean
  branches: GitHubBranch[]
  branchesPending: boolean
  selectedBranch?: string
}>()

defineEmits<{
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
