<template>
  <div class="inline-flex items-center">
    <!-- Loading State -->
    <div
      v-if="pending && !summary"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border border-white/[0.08] bg-white/[0.03] text-muted select-none"
      :class="compact ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'"
      title="Syncing PRs & Issues..."
    >
      <NexuraIcon name="RotateCw" size="xs" class="animate-spin text-muted" />
      <span>Syncing...</span>
    </div>

    <!-- Active Cockpit Activity Pill Button -->
    <button
      v-else
      type="button"
      class="inline-flex items-center gap-1.5 font-mono tabular-nums rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-muted hover:text-foreground transition-all select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/50"
      :class="compact ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1'"
      :title="`GitHub Cockpit: ${openPrs} Open PRs, ${openIssues} Open Issues. Click to open Cockpit.`"
      @click.stop="isModalOpen = true"
    >
      <!-- Pulsing dot if there are open PRs -->
      <span
        v-if="openPrs > 0"
        class="w-1.5 h-1.5 rounded-full bg-accent-light animate-pulse shrink-0"
        title="Open Pull Requests Active"
      ></span>

      <!-- Label with Nexura Icons -->
      <div class="flex items-center gap-1.5 whitespace-nowrap">
        <span class="inline-flex items-center gap-1">
          <NexuraIcon name="GitPullRequest" size="xs" class="text-accent-light" />
          <span class="font-medium text-foreground">{{ openPrs }}</span>
          <span class="text-muted">PR{{ openPrs === 1 ? '' : 's' }}</span>
        </span>
        <span class="text-white/[0.15]">·</span>
        <span class="inline-flex items-center gap-1">
          <NexuraIcon name="CircleDot" size="xs" class="text-amber-400/90" />
          <span class="font-medium text-foreground">{{ openIssues }}</span>
          <span class="text-muted">Issue{{ openIssues === 1 ? '' : 's' }}</span>
        </span>
      </div>
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
import { useGitHubPullsAndIssues } from '~/composables/useGitHub'

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
