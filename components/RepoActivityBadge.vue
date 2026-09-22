<template>
  <div class="inline-flex items-center">
    <!-- Loading State -->
    <div
      v-if="pending && !summary"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border border-white/[0.06] bg-white/[0.02] text-[#756F68] select-none"
      :class="compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'"
      title="Syncing PRs & Issues..."
    >
      <span class="w-1.5 h-1.5 rounded-full bg-[#756F68] animate-pulse"></span>
      <span>🔀 Syncing...</span>
    </div>

    <!-- Active Cockpit Activity Pill Button -->
    <button
      v-else
      type="button"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-[#756F68] hover:text-[#F5F2EB] transition-all select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
      :class="compact ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1'"
      :title="`GitHub Cockpit: ${openPrs} Open PRs, ${openIssues} Open Issues. Click to open Cockpit.`"
      @click.stop="isModalOpen = true"
    >
      <!-- Pulsing ochre dot if there are open PRs -->
      <span
        v-if="openPrs > 0"
        class="w-1.5 h-1.5 rounded-full bg-[#C98A4B] animate-pulse shrink-0"
        title="Open Pull Requests Active"
      ></span>

      <!-- Label -->
      <span class="font-medium whitespace-nowrap">
        🔀 {{ openPrs }} PR{{ openPrs === 1 ? '' : 's' }} · 🎯 {{ openIssues }} Issue{{ openIssues === 1 ? '' : 's' }}
      </span>
    </button>

    <!-- Cockpit Modal -->
    <PullRequestsIssuesModal
      :is-open="isModalOpen"
      :repo="repo || ''"
      :project-slug="projectSlug"
      :summary="summary"
      @close="isModalOpen = false"
      @issue-created="handleIssueCreated"
      @task-imported="handleTaskImported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useGitHubPullsAndIssues } from '../composables/useGitHub'
import PullRequestsIssuesModal from './PullRequestsIssuesModal.vue'

const props = withDefaults(
  defineProps<{
    repo?: string
    compact?: boolean
    projectSlug?: string
  }>(),
  {
    repo: '',
    compact: false,
    projectSlug: ''
  }
)

const emit = defineEmits<{
  (e: 'issueCreated', issue: any): void
  (e: 'taskImported', task: any): void
}>()

const repoRef = toRef(props, 'repo')
const { pullsAndIssues: summary, pending, refresh } = useGitHubPullsAndIssues(repoRef)

const isModalOpen = ref(false)

const openPrs = computed(() => summary.value?.openPrCount ?? 0)
const openIssues = computed(() => summary.value?.openIssueCount ?? 0)

function handleIssueCreated(issue: any) {
  refresh()
  emit('issueCreated', issue)
}

function handleTaskImported(task: any) {
  refresh()
  emit('taskImported', task)
}
</script>
