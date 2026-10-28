<template>
  <div class="h-full flex flex-col bg-[#090A0D]/70 p-4 overflow-y-auto custom-scrollbar select-none text-xs">
    <!-- Empty / No Selection State -->
    <div
      v-if="!selectedItem"
      class="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#565B68]"
    >
      <div class="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <NexuraIcon name="Eye" size="md" />
      </div>
      <div class="font-sans text-xs">
        <p class="text-[#8A8F9E] font-medium">Specular Live Inspector</p>
        <p class="text-[11px] text-[#565B68] mt-0.5">Select an item with ↑/↓ to preview rich metadata and contextual actions.</p>
      </div>
    </div>

    <!-- Active Item Preview Content -->
    <div v-else class="space-y-4">
      <!-- 1. Top Badges & Category Header -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span
            class="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold"
            :class="selectedItem.badgeColor || 'bg-white/[0.06] text-[#8A8F9E] border border-white/[0.08]'"
          >
            {{ selectedItem.badge || selectedItem.type }}
          </span>

          <span
            v-if="selectedItem.priority"
            class="px-2 py-0.5 rounded text-[10px] font-mono uppercase"
            :class="priorityBadgeClass(selectedItem.priority)"
          >
            {{ selectedItem.priority }}
          </span>

          <span
            v-if="selectedItem.status"
            class="px-2 py-0.5 rounded text-[10px] font-mono uppercase"
            :class="statusBadgeClass(selectedItem.status)"
          >
            {{ normalizeStatusLabel(selectedItem.status) }}
          </span>
        </div>

        <span class="text-[10px] font-mono uppercase text-[#565B68]">
          {{ selectedItem.type }}
        </span>
      </div>

      <!-- 2. Main Title & Subtitle -->
      <div class="space-y-1 border-b border-white/[0.06] pb-3">
        <h3 class="text-sm font-semibold text-white tracking-tight leading-snug font-sans">
          {{ selectedItem.title }}
        </h3>
        <p v-if="selectedItem.subtitle" class="text-xs font-mono text-[#8A8F9E]">
          {{ selectedItem.subtitle }}
        </p>
      </div>

      <!-- 3. Entity Specific Details -->

      <!-- TASK PREVIEW -->
      <div v-if="selectedItem.type === 'task' && selectedItem.payload" class="space-y-3">
        <!-- Description -->
        <div v-if="selectedItem.description" class="space-y-1">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">Description</div>
          <p class="text-xs text-[#D1D5DB] leading-relaxed font-sans bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
            {{ selectedItem.description }}
          </p>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5">
            <span class="text-[#565B68] block text-[10px]">PROJECT</span>
            <span class="text-[#F3F4F6] truncate block">{{ selectedItem.payload.projectSlug || 'General' }}</span>
          </div>

          <div class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5">
            <span class="text-[#565B68] block text-[10px]">DUE DATE</span>
            <span class="text-[#F3F4F6] block">{{ selectedItem.payload.dueDate || selectedItem.payload.date || 'Unscheduled' }}</span>
          </div>
        </div>

        <!-- Tech Tags -->
        <div v-if="selectedItem.tags && selectedItem.tags.length > 0" class="space-y-1.5">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">Tech Tags</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tag in selectedItem.tags"
              :key="tag"
              class="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Connected GitHub Issue / PR -->
        <div v-if="selectedItem.payload.githubIssueUrl || selectedItem.payload.githubPrUrl" class="space-y-1.5 pt-1">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">Connected GitHub</div>
          <div class="flex flex-col gap-1 text-[11px] font-mono">
            <button
              v-if="selectedItem.payload.githubIssueUrl"
              type="button"
              @click="safeOpenExternal(selectedItem.payload.githubIssueUrl)"
              class="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 hover:underline cursor-pointer text-left"
            >
              <NexuraIcon name="GitPullRequest" size="xs" />
              <span>Issue #{{ selectedItem.payload.githubIssueNumber || 'Ref' }}</span>
            </button>
            <button
              v-if="selectedItem.payload.githubPrUrl"
              type="button"
              @click="safeOpenExternal(selectedItem.payload.githubPrUrl)"
              class="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 hover:underline cursor-pointer text-left"
            >
              <NexuraIcon name="GitBranch" size="xs" />
              <span>Pull Request</span>
            </button>
          </div>
        </div>
      </div>

      <!-- PROJECT PREVIEW -->
      <div v-else-if="selectedItem.type === 'project' && selectedItem.payload" class="space-y-3">
        <!-- Description -->
        <div v-if="selectedItem.description" class="space-y-1">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">About Project</div>
          <p class="text-xs text-[#D1D5DB] leading-relaxed font-sans bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
            {{ selectedItem.description }}
          </p>
        </div>

        <!-- Tech Stack -->
        <div v-if="selectedItem.tags && selectedItem.tags.length > 0" class="space-y-1.5">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">Tech Stack</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tech in selectedItem.tags"
              :key="tech"
              class="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] text-[#D1D5DB] text-[10px] font-mono"
            >
              {{ tech }}
            </span>
          </div>
        </div>

        <!-- Repos & Deployment Links -->
        <div class="space-y-1.5 pt-1 text-[11px] font-mono">
          <div v-if="selectedItem.payload.githubRepo" class="flex items-center gap-2 text-[#8A8F9E]">
            <NexuraIcon name="GitBranch" size="xs" class="text-emerald-400 shrink-0" />
            <button
              type="button"
              @click="openRepo(selectedItem.payload.githubRepo)"
              class="text-[#D1D5DB] hover:text-white truncate cursor-pointer hover:underline text-left"
            >
              {{ selectedItem.payload.githubRepo }}
            </button>
          </div>
          <div v-if="selectedItem.payload.deployUrl" class="flex items-center gap-2 text-[#8A8F9E]">
            <NexuraIcon name="ExternalLink" size="xs" class="text-sky-400 shrink-0" />
            <button
              type="button"
              @click="safeOpenExternal(selectedItem.payload.deployUrl)"
              class="text-sky-400 hover:underline truncate cursor-pointer text-left"
            >
              {{ selectedItem.payload.deployUrl }}
            </button>
          </div>
        </div>
      </div>

      <!-- SPRINT PREVIEW -->
      <div v-else-if="selectedItem.type === 'sprint' && selectedItem.payload" class="space-y-3">
        <div v-if="selectedItem.description" class="space-y-1">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">Sprint Objective</div>
          <p class="text-xs text-[#D1D5DB] leading-relaxed font-sans bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
            {{ selectedItem.description }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5">
            <span class="text-[#565B68] block text-[10px]">TIMELINE</span>
            <span class="text-[#F3F4F6] block">{{ selectedItem.payload.startDate }} → {{ selectedItem.payload.endDate }}</span>
          </div>
          <div class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5">
            <span class="text-[#565B68] block text-[10px]">COMMITTED</span>
            <span class="text-[#F3F4F6] block">{{ selectedItem.payload.taskIds?.length || 0 }} Deliverables</span>
          </div>
        </div>
      </div>

      <!-- REPO PREVIEW -->
      <div v-else-if="selectedItem.type === 'repo' && selectedItem.payload" class="space-y-3">
        <div v-if="selectedItem.description" class="space-y-1">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">Repository Details</div>
          <p class="text-xs text-[#D1D5DB] leading-relaxed font-sans bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
            {{ selectedItem.description }}
          </p>
        </div>

        <div class="grid grid-cols-3 gap-2 text-[11px] font-mono">
          <div class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5 text-center">
            <span class="text-[#565B68] block text-[10px]">LANGUAGE</span>
            <span class="text-emerald-400 block font-semibold">{{ selectedItem.payload.language || 'Code' }}</span>
          </div>
          <div class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5 text-center">
            <span class="text-[#565B68] block text-[10px]">STARS</span>
            <span class="text-amber-400 block font-semibold">★ {{ selectedItem.payload.stargazersCount || 0 }}</span>
          </div>
          <div class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5 text-center">
            <span class="text-[#565B68] block text-[10px]">BRANCH</span>
            <span class="text-[#F3F4F6] block">{{ selectedItem.payload.defaultBranch || 'main' }}</span>
          </div>
        </div>
      </div>

      <!-- ACTION / COMMAND PREVIEW -->
      <div v-else-if="selectedItem.type === 'action'" class="space-y-3">
        <div class="space-y-1">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">Command Execution Impact</div>
          <p class="text-xs text-[#D1D5DB] leading-relaxed font-sans bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
            {{ selectedItem.description }}
          </p>
        </div>

        <div v-if="selectedItem.shortcutHint" class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between font-mono text-[11px]">
          <span class="text-[#8A8F9E]">Keyboard Shortcut</span>
          <kbd class="px-2 py-0.5 rounded bg-white/[0.08] text-white border border-white/[0.1]">{{ selectedItem.shortcutHint }}</kbd>
        </div>
      </div>

      <!-- NAVIGATION PREVIEW -->
      <div v-else-if="selectedItem.type === 'navigation'" class="space-y-3">
        <div class="space-y-1">
          <div class="text-[10px] font-semibold text-[#8A8F9E]/70 uppercase tracking-wider font-sans">Route Summary</div>
          <p class="text-xs text-[#D1D5DB] leading-relaxed font-sans bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
            {{ selectedItem.description }}
          </p>
        </div>

        <div class="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between font-mono text-[11px]">
          <span class="text-[#8A8F9E]">Destination</span>
          <span class="text-indigo-400 font-semibold">{{ selectedItem.subtitle }}</span>
        </div>
      </div>

      <!-- 4. Interactive Action Buttons -->
      <div class="pt-4 border-t border-white/[0.06] space-y-2">
        <!-- Primary Action CTA -->
        <button
          type="button"
          @click="executeCurrent"
          class="w-full py-2 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-medium transition flex items-center justify-between cursor-pointer"
        >
          <span class="flex items-center gap-2">
            <NexuraIcon name="CornerDownLeft" size="sm" />
            <span>{{ primaryActionLabel }}</span>
          </span>
          <kbd class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/10">↵</kbd>
        </button>

        <!-- Secondary Action CTA (e.g. GitHub) -->
        <button
          v-if="selectedItem.secondaryAction"
          type="button"
          @click="executeSecondary"
          class="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#D1D5DB] hover:text-white border border-white/[0.08] font-medium transition flex items-center justify-between cursor-pointer"
        >
          <span class="flex items-center gap-2">
            <NexuraIcon name="ExternalLink" size="sm" />
            <span>{{ selectedItem.secondaryActionLabel || 'Open Link' }}</span>
          </span>
          <kbd class="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/10">
            <NexuraIcon name="Command" size="xs" class="text-white/70" />
            <span class="font-semibold">↵</span>
          </kbd>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NexuraIcon from '../ui/NexuraIcon.vue'
import { useOmniSearch, safeOpenExternal } from '../../composables/useOmniSearch'

const { selectedItem, executeCurrent, executeSecondary } = useOmniSearch()

function openRepo(repo: string) {
  const url = repo.startsWith('http://') || repo.startsWith('https://')
    ? repo
    : `https://github.com/${repo.replace(/^github\.com\//, '')}`
  safeOpenExternal(url)
}

const primaryActionLabel = computed(() => {
  if (!selectedItem.value) return 'Execute'
  switch (selectedItem.value.type) {
    case 'task':
      return 'Inspect Deliverable'
    case 'project':
      return 'Open Project Dashboard'
    case 'sprint':
      return 'Jump to Weekly Sprint'
    case 'repo':
      return 'Inspect Repositories'
    case 'action':
      return 'Execute Command'
    case 'navigation':
      return 'Navigate to Page'
    default:
      return 'Select'
  }
})

function priorityBadgeClass(priority: string) {
  switch (priority.toLowerCase()) {
    case 'critical':
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
    case 'high':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
    case 'medium':
      return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
    default:
      return 'bg-white/[0.05] text-[#8A8F9E] border border-white/[0.08]'
  }
}

function statusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case 'blocked':
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
    case 'deployed':
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
    case 'running_sprint':
    case 'active':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
    default:
      return 'bg-white/[0.05] text-[#8A8F9E] border border-white/[0.08]'
  }
}

function normalizeStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case 'in_queue':
      return 'In Queue'
    case 'running_sprint':
      return 'Running Sprint'
    case 'deployed':
      return 'Deployed'
    case 'blocked':
      return 'Blocked'
    default:
      return status
  }
}
</script>
