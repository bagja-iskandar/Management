<template>
  <div class="space-y-6">
    <!-- ================================================================= -->
    <!-- STATE 1: LOADING SKELETON BENTO LOADER                            -->
    <!-- ================================================================= -->
    <div
      v-if="sprintsDataState === 'LOADING'"
      class="space-y-6 animate-pulse select-none"
      role="status"
      aria-label="Loading sprints workspace"
    >
      <!-- Skeleton Header -->
      <div class="obs-card p-6 rounded-2xl bg-[#111318] border border-white/[0.07] space-y-4">
        <div class="h-6 bg-white/[0.08] rounded w-1/4"></div>
        <div class="h-4 bg-white/[0.04] rounded w-1/2"></div>
      </div>

      <!-- Skeleton Objective Banner -->
      <div class="obs-card p-4 rounded-xl bg-[#111318] border border-white/[0.07] space-y-2">
        <div class="h-4 bg-white/[0.08] rounded w-1/6"></div>
        <div class="h-4 bg-white/[0.04] rounded w-3/4"></div>
      </div>

      <!-- Skeleton Metrics Bento -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
      </div>

      <!-- Skeleton Matrix -->
      <div class="h-64 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 2: CONNECTION ERROR CARD                                    -->
    <!-- ================================================================= -->
    <BaseEmptyState
      v-else-if="sprintsDataState === 'ERROR'"
      variant="error"
      title="Connection Failed"
      description="Failed to synchronize sprint telemetry from the server."
      icon="AlertTriangle"
      class="max-w-lg mx-auto my-12"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#F3F4F6] border border-white/[0.08] transition-colors cursor-pointer"
          @click="workspaceStore.initializeWorkspace(true)"
        >
          <NexuraIcon name="RefreshCw" size="xs" />
          <span>Retry</span>
        </button>
      </template>
    </BaseEmptyState>

    <!-- ================================================================= -->
    <!-- STATE 3: GLOBAL EMPTY STATE CARD                                  -->
    <!-- ================================================================= -->
    <BaseEmptyState
      v-else-if="sprintsDataState === 'SUCCESS_EMPTY'"
      icon="Target"
      icon-color="text-indigo-400"
      title="No Sprint Cycles Found"
      description="No active or planned sprint cycles currently exist in this workspace. Initialize your first cycle to track weekly execution."
      class="max-w-lg mx-auto my-12"
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white font-semibold transition-colors cursor-pointer"
          @click="ensureSprintForCurrentWeek()"
        >
          <NexuraIcon name="Zap" size="xs" />
          <span>Initialize Week {{ weekNum }} Sprint</span>
        </button>
      </template>
    </BaseEmptyState>

    <!-- ================================================================= -->
    <!-- STATE 4: READY STATE (FULL SPRINT WORKSPACE)                      -->
    <!-- ================================================================= -->
    <div v-else-if="sprintsDataState === 'READY'" class="space-y-6">
      <!-- Stale Data Warning Banner -->
      <div
        v-if="isStaleDataWarning"
        class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono flex items-center justify-between"
        role="status"
      >
        <div class="flex items-center gap-2">
          <NexuraIcon name="AlertTriangle" size="xs" class="text-amber-400" />
          <span>Warning: Displaying cached sprint telemetry. Background synchronization failed.</span>
        </div>
        <button
          type="button"
          class="text-xs underline hover:no-underline font-medium cursor-pointer"
          @click="workspaceStore.initializeWorkspace(true)"
        >
          Retry Sync
        </button>
      </div>

      <!-- Header & Context -->
      <SprintHeader
        :is-current-week="isCurrentWeek"
        :week-label="weekLabel"
        @prev-week="goToPrevWeek"
        @current-week="goToCurrentWeek"
        @next-week="goToNextWeek"
        @open-modal="openModalWithTab"
      />

      <!-- Sprint Action Sub-bar: GitHub Sync & Sprint Rollover -->
      <div class="flex items-center justify-between gap-3 flex-wrap pb-1">
        <div class="flex items-center gap-2">
          <span class="font-mono text-xs text-[#8A8F9E]">
            Cycle Execution:
          </span>
          <span
            class="font-mono text-xs px-2.5 py-0.5 rounded-full border"
            :class="incompleteDeliverables.length > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'"
          >
            {{ incompleteDeliverables.length > 0 ? `${incompleteDeliverables.length} Incomplete Deliverables` : 'All Deliverables Deployed' }}
          </span>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Sync GitHub Button -->
          <button
            type="button"
            :disabled="isSyncingGitHub"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111318] hover:bg-white/[0.08] text-[#F3F4F6] border border-white/[0.08] hover:border-white/[0.16] text-xs font-mono transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Synchronize PRs, branches, and commit status from GitHub"
            @click="onSyncGitHub"
          >
            <NexuraIcon
              name="GitPullRequest"
              size="xs"
              class="text-indigo-400"
              :class="{ 'animate-spin': isSyncingGitHub }"
            />
            <span>{{ isSyncingGitHub ? 'Syncing...' : 'Sync GitHub' }}</span>
          </button>

          <!-- Rollover Sprint Button -->
          <button
            type="button"
            :disabled="incompleteDeliverables.length === 0 || isRollingOver"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/[0.04] disabled:text-[#565B68] disabled:border-white/[0.06] text-white border border-indigo-500/30 text-xs font-mono font-medium transition active:scale-95 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            :title="incompleteDeliverables.length === 0 ? 'No incomplete deliverables to rollover' : 'Rollover incomplete deliverables to next sprint cycle'"
            @click="isRolloverModalOpen = true"
          >
            <NexuraIcon
              name="FastForward"
              size="xs"
              :class="{ 'animate-pulse': incompleteDeliverables.length > 0 && !isRollingOver }"
            />
            <span>Rollover Sprint ({{ incompleteDeliverables.length }})</span>
          </button>
        </div>
      </div>

      <!-- Feedback Toast -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div
          v-if="feedbackMessage"
          class="p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 shadow-lg"
          :class="feedbackType === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'"
          role="status"
        >
          <div class="flex items-center gap-2">
            <NexuraIcon
              :name="feedbackType === 'error' ? 'AlertTriangle' : 'CheckCircle2'"
              size="sm"
              class="shrink-0"
              :class="feedbackType === 'error' ? 'text-rose-400' : 'text-emerald-400'"
            />
            <span>{{ feedbackMessage }}</span>
          </div>
          <button
            type="button"
            class="text-xs hover:opacity-80 shrink-0 cursor-pointer p-1 rounded hover:bg-white/[0.04]"
            aria-label="Dismiss feedback"
            @click="feedbackMessage = ''"
          >
            <NexuraIcon name="X" size="xs" />
          </button>
        </div>
      </transition>

      <!-- Weekly Objective Banner -->
      <SprintObjectiveBanner
        :objective="currentObjective"
        @save="onSaveObjective"
      />

      <!-- Solo Telemetry 4-Column Bento Strip -->
      <WeeklyMetricsBento
        :week-label="weekLabel"
        :remaining-days-text="remainingDaysText"
        :completion-percentage="completionPercentage"
        :completed-count="completedCount"
        :total-deliverables-count="totalDeliverablesCount"
        :in-flight-count="inFlightCount"
        :pending-count="pendingCount"
      />

      <!-- Interactive Weekly Deliverables Matrix -->
      <DeliverablesMatrix
        v-model:filter="deliverablesFilter"
        v-model:search-query="deliverablesSearchQuery"
        :deliverables="filteredDeliverables"
        :total-targets-count="activeWeekTasks.length"
        :in-flight-count="inFlightCount"
        :pending-count="pendingCount"
        :completed-count="completedCount"
        :week-offset="weekOffset"
        @return-current-week="goToCurrentWeek"
        @open-modal="openModalWithTab"
        @reset-filters="resetFilters"
        @update-status="updateTaskStatus"
        @remove-task="removeTaskFromWeek"
      />

      <!-- Add Target to This Week Modal -->
      <AddTargetModal
        v-if="showAddTargetModal"
        :initial-tab="activeModalTab"
        :week-label="weekLabel"
        :unassigned-tasks="unassignedBacklogTasks"
        :projects="workspaceStore.projects.value || []"
        :submitting="isSubmittingDeliverable"
        @close="showAddTargetModal = false"
        @add-existing="addExistingTaskToWeek"
        @create-deliverable="onCreateDeliverable"
      />

      <!-- Sprint Rollover Modal -->
      <SprintRolloverModal
        :show="isRolloverModalOpen"
        :current-week-label="weekLabel"
        :next-week-label="nextWeekLabel"
        :incomplete-deliverables="incompleteDeliverables"
        :is-rolling-over="isRollingOver"
        @close="isRolloverModalOpen = false"
        @confirm="onConfirmRollover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useHeaderActions } from '~/composables/useHeaderActions'
import { useSprintWorkspace } from '~/composables/useSprintWorkspace'

const sprintWorkspace = useSprintWorkspace()
const {
  workspaceStore,
  weekOffset,
  weekNum,
  isCurrentWeek,
  weekLabel,
  remainingDaysText,
  goToPrevWeek,
  goToNextWeek,
  goToCurrentWeek,
  isSyncingGitHub,
  isRolloverModalOpen,
  isRollingOver,
  sprintsDataState,
  isStaleDataWarning,
  activeWeekTasks,
  incompleteDeliverables,
  nextWeekLabel,
  ensureSprintForCurrentWeek,
  currentObjective,
  onSaveObjective,
  totalDeliverablesCount,
  completedCount,
  inFlightCount,
  pendingCount,
  completionPercentage,
  deliverablesFilter,
  deliverablesSearchQuery,
  filteredDeliverables,
  resetFilters,
  feedbackMessage,
  feedbackType,
  updateTaskStatus,
  removeTaskFromWeek,
  showAddTargetModal,
  activeModalTab,
  isSubmittingDeliverable,
  openModalWithTab,
  unassignedBacklogTasks,
  addExistingTaskToWeek,
  onCreateDeliverable,
  onSyncGitHub,
  onConfirmRollover
} = sprintWorkspace

// Contextual Action Bar integration
const { setActions, clearActions } = useHeaderActions()

// Initialize workspace on mount if not yet initialized
onMounted(async () => {
  setActions([
    {
      id: 'new-sprint',
      label: 'New Sprint',
      icon: 'Calendar',
      variant: 'secondary',
      handler: () => openModalWithTab('create')
    },
    {
      id: 'add-target',
      label: 'Add Target',
      icon: 'Plus',
      variant: 'primary',
      handler: () => openModalWithTab('backlog')
    }
  ])

  if (!workspaceStore.isInitialized.value) {
    await workspaceStore.initializeWorkspace()
  }
})

onBeforeUnmount(() => {
  clearActions()
})
</script>
