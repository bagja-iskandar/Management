<template>
  <div :class="['relative', activeTab === 'dashboard' ? 'space-y-3 sm:space-y-3.5 xl:h-full xl:flex xl:flex-col xl:min-h-0 xl:pb-0' : 'space-y-6 pb-12']">
    <!-- ================================================================= -->
    <!-- STATE 1: LOADING SKELETON BENTO LOADER                            -->
    <!-- ================================================================= -->
    <div
      v-if="detailState === 'LOADING'"
      class="space-y-6 animate-pulse select-none"
      role="status"
      aria-label="Loading project detail"
    >
      <!-- Skeleton Hero -->
      <div class="obs-card p-6 rounded-2xl bg-[#111318] border border-white/[0.07] space-y-4">
        <div class="h-6 bg-white/[0.08] rounded w-1/3"></div>
        <div class="h-4 bg-white/[0.04] rounded w-2/3"></div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div class="h-14 bg-white/[0.04] rounded-xl"></div>
          <div class="h-14 bg-white/[0.04] rounded-xl"></div>
          <div class="h-14 bg-white/[0.04] rounded-xl"></div>
          <div class="h-14 bg-white/[0.04] rounded-xl"></div>
        </div>
      </div>

      <!-- Skeleton Bento Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 2: CONNECTION ERROR CARD                                    -->
    <!-- ================================================================= -->
    <div
      v-else-if="detailState === 'ERROR'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-rose-500/30 p-8 space-y-4 max-w-lg mx-auto my-12"
      role="alert"
    >
      <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
        <NexuraIcon name="AlertTriangle" size="lg" />
      </div>
      <h2 class="font-mono text-lg font-semibold text-[#F3F4F6]">Connection Failed</h2>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">
        Failed to synchronize project telemetry from the server.
      </p>
      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#F3F4F6] border border-white/[0.08] transition-colors cursor-pointer"
          @click="retryFetchProjects"
        >
          <NexuraIcon name="RefreshCw" size="xs" />
          <span>Retry</span>
        </button>
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white font-semibold transition-colors cursor-pointer"
        >
          <NexuraIcon name="ArrowLeft" size="xs" />
          <span>Back to Projects Hub</span>
        </NuxtLink>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 3: PROJECT NOT FOUND 404 BENTO CARD                         -->
    <!-- ================================================================= -->
    <div
      v-else-if="detailState === 'NOT_FOUND'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-white/[0.08] p-8 space-y-4 max-w-lg mx-auto my-12"
    >
      <div class="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8A8F9E]">
        <NexuraIcon name="FolderX" size="lg" />
      </div>
      <h2 class="font-mono text-lg font-semibold text-[#F3F4F6]">Project Not Found</h2>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">
        No project with slug <span class="font-mono text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-indigo-300">{{ slug }}</span> exists in the current workspace.
      </p>
      <div class="pt-2">
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white font-semibold transition-colors cursor-pointer"
        >
          <NexuraIcon name="ArrowLeft" size="xs" />
          <span>Back to Projects Hub</span>
        </NuxtLink>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 4: READY STATE (FULL COCKPIT)                               -->
    <!-- ================================================================= -->
    <div v-else-if="detailState === 'READY' && currentProject" :class="[activeTab === 'dashboard' ? 'space-y-3 sm:space-y-3.5 xl:h-full xl:flex xl:flex-col xl:min-h-0' : 'space-y-6']">
      <!-- Stale Error Warning Banner -->
      <div
        v-if="isStaleProjectsError"
        class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono flex items-center justify-between shrink-0"
        role="status"
      >
        <div class="flex items-center gap-2">
          <NexuraIcon name="AlertTriangle" size="xs" class="text-amber-400" />
          <span>Warning: Displaying cached project metadata. Background synchronization failed.</span>
        </div>
        <button
          type="button"
          class="text-xs underline hover:no-underline font-medium cursor-pointer"
          @click="retryFetchProjects"
        >
          Retry Sync
        </button>
      </div>

      <!-- Top Action Bar -->
      <div class="flex items-center justify-end pb-1 border-b border-white/[0.06] shrink-0">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 font-mono text-xs transition cursor-pointer"
          title="Delete Project Permanently"
          @click="openDeleteProjectModal"
        >
          <NexuraIcon name="Trash2" size="xs" />
          <span>Delete Project</span>
        </button>
      </div>

      <!-- Mobile / Tablet Tab Strip (< lg only) -->
      <div class="lg:hidden sticky top-0 z-20 -mx-3 sm:-mx-5 -mt-3 sm:-mt-5 lg:mt-0 px-3 sm:px-5 py-2 bg-[#0B0C10]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none">
        <button
          v-for="tab in projectTabs"
          :key="tab.id"
          type="button"
          @click="onSelectTab(tab.id)"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0 cursor-pointer"
          :class="activeTab === tab.id
            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)] font-semibold'
            : 'bg-white/[0.03] text-[#8A8F9E] hover:text-[#F3F4F6] border-white/[0.06] hover:bg-white/[0.06]'"
        >
          <NexuraIcon :name="tab.icon" size="xs" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.count !== undefined && tab.count > 0" class="font-mono tabular-nums text-[10px] px-1 rounded bg-white/[0.06]">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Project Hero (Dashboard Tab Only) -->
      <ProjectHeroHeader
        v-if="activeTab === 'dashboard'"
        :project="currentProject"
        :completed-count="completedCount"
        :total-tasks-count="totalTasksCount"
        :derived-percentage="derivedPercentage"
        class="shrink-0"
      />

      <!-- ================================================================= -->
      <!-- VIEW 1: PROJECT DASHBOARD (DEFAULT)                               -->
      <!-- ================================================================= -->
      <div v-if="activeTab === 'dashboard'" class="space-y-3 sm:space-y-3.5 xl:flex-1 xl:flex xl:flex-col xl:min-h-0">
        <!-- 4-Pillar DevOps Bento Cockpit Matrix -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5 shrink-0">
          <ProjectCicdCard
            :repo="currentProject.githubRepo || ''"
            :workflows="projectWorkflows || []"
            :pending="workflowsPending"
            :is-rerunning="rerunningRunId !== null"
            class="h-full"
            @open-log="openTabRunLogModal"
            @rerun="onRerunWorkflowById"
            @refresh="refreshWorkflows"
          />

          <ProjectLiveDeploymentCard
            :repo="currentProject.githubRepo || ''"
            :deploy-url="currentProject.deployUrl || ''"
            :deployments="projectDeployments"
            :pending="deploymentsPending"
            class="h-full"
            @open-modal="isDeploymentModalOpen = true"
            @refresh="refreshDeployments"
          />

          <ProjectSecurityCard
            :repo="currentProject.githubRepo || ''"
            :security="projectSecurity"
            :pending="securityPending"
            class="h-full"
            @open-modal="isSecurityModalOpen = true"
            @refresh="refreshSecurity"
          />

          <ProjectPackageCard
            :repo="currentProject.githubRepo || ''"
            :packages="projectPackages"
            :pending="packagesPending"
            class="h-full"
            @open-modal="isPackageModalOpen = true"
            @refresh="refreshPackages"
          />
        </div>

        <!-- Bottom Bento Row: GitHub Pulse & Project Focus Deliverables -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5 xl:flex-1 xl:min-h-0">
          <ProjectCommitsPreview
            :commits="commits || []"
            class="h-full"
            @view-all-commits="onSelectTab('github')"
          />

          <ProjectPriorityDeliverables
            :priority-tasks="priorityTasksList"
            class="h-full"
            @open-matrix="onSelectTab('matrix')"
            @task-click="onTaskClick"
          />
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- VIEW 2: DEDICATED FULL KANBAN BOARD                               -->
      <!-- ================================================================= -->
      <section v-else-if="activeTab === 'kanban'" aria-label="Dedicated Kanban Board" class="space-y-4">
        <KanbanBoard
          :tasks="projectTasks"
          @update-status="onUpdateTaskStatus"
          @add-task="onAddTaskToColumn"
          @task-click="onTaskClick"
        />
      </section>

      <!-- ================================================================= -->
      <!-- VIEW 3: ASSOCIATED TASK MATRIX                                    -->
      <!-- ================================================================= -->
      <ProjectTaskMatrix
        v-else-if="activeTab === 'matrix'"
        :tasks="projectTasks"
        @task-click="onTaskClick"
        @toggle-status="toggleMatrixTaskStatus"
        @delete-task="deleteTaskFromDrawer"
      />

      <!-- ================================================================= -->
      <!-- VIEW 4: GITHUB INTEGRATION DEEP COCKPIT                           -->
      <!-- ================================================================= -->
      <section v-else-if="activeTab === 'github'" aria-label="GitHub Integration" class="obs-card p-6 rounded-2xl bg-[#111318] border border-white/[0.07] space-y-4 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div class="flex items-center gap-2.5">
            <NexuraIcon name="GitBranch" size="md" class="text-indigo-400" />
            <div>
              <h2 class="font-mono text-sm font-semibold text-[#F3F4F6]">GitHub Repository Integration</h2>
              <p class="text-xs text-[#8A8F9E]">
                Live branch telemetry and latest commit log from {{ currentProject.githubRepo || 'linked repository' }}.
              </p>
            </div>
          </div>

          <a
            v-if="currentProject.githubRepo"
            :href="`https://github.com/${currentProject.githubRepo}`"
            target="_blank"
            rel="noopener noreferrer"
            class="group font-mono text-xs text-indigo-400 hover:underline flex items-center gap-1.5"
          >
            <span>Open on GitHub</span>
            <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <!-- Pull Requests & Issues Feed -->
        <ProjectPullsIssuesFeed
          :project-pulls-issues="projectPullsIssues || null"
          :pulls-issues-pending="pullsIssuesPending"
          :in-panel-importing-id="inPanelImportingId"
          :in-panel-imported-issues="inPanelImportedIssues"
          :open-prs-count="tabOpenPrsCount"
          :open-issues-count="tabOpenIssuesCount"
          :merged-prs-count="tabMergedPrsCount"
          :closed-issues-count="tabClosedIssuesCount"
          @open-modal="isPullsIssuesModalOpen = true"
          @refresh="refreshPullsIssues"
          @import-issue="importIssueFromFeed"
        />

        <!-- GitHub Actions Telemetry -->
        <ProjectWorkflowRunsFeed
          :workflows="projectWorkflows || []"
          :workflows-pending="workflowsPending"
          :rerunning-run-id="rerunningRunId"
          @refresh="refreshWorkflows"
          @open-log="openTabRunLogModal"
          @rerun="handleTabWorkflowRerun"
        />

        <!-- Deployments & Environments Cockpit -->
        <ProjectDeploymentFeed
          :deployments="projectDeployments || null"
          :pending="deploymentsPending"
          :deploy-url="currentProject.deployUrl || ''"
          :target-environment-name="targetEnvironmentName"
          :live-url="activeTabLiveUrl"
          :deployment-status-dot-class="tabDeploymentStatusDotClass"
          :commit-check-badge-class="tabCommitCheckBadgeClass"
          :passed-checks-count="tabPassedChecksCount"
          :total-checks-count="tabTotalChecksCount"
          :commit-check-summary-text="tabCommitCheckSummaryText"
          @open-modal="isDeploymentModalOpen = true"
          @refresh="refreshDeployments"
        />

        <!-- Security & Vulnerability Audit -->
        <ProjectSecurityFeed
          :security="projectSecurity || null"
          :pending="securityPending"
          :repo="currentProject.githubRepo || ''"
          :status-dot-class="tabSecurityStatusDotClass"
          :scanner-secret-class="scannerSecretClass"
          :scanner-secret-status-text="scannerSecretStatusText"
          @open-modal="isSecurityModalOpen = true"
          @refresh="refreshSecurity"
        />

        <!-- Package & Container Registry Feed -->
        <ProjectPackageFeed
          :packages="projectPackages || null"
          :pending="packagesPending"
          :status-dot-class="tabPackageStatusDotClass"
          :docker-snippet="tabDockerSnippet"
          :copied-snippet="tabCopiedSnippet"
          @open-modal="isPackageModalOpen = true"
          @refresh="refreshPackages"
          @copy-snippet="copyTabSnippet"
        />

        <!-- Commits Stream & Branches List -->
        <ProjectGitActivityFeed
          :commits="commits || []"
          :commits-pending="commitsPending"
          :branches="branches || []"
          :branches-pending="branchesPending"
        />
      </section>

      <!-- ================================================================= -->
      <!-- VIEW 5: VERCEL CLOUD TELEMETRY                                    -->
      <!-- ================================================================= -->
      <section v-else-if="activeTab === 'vercel'" aria-label="Vercel Cloud Telemetry">
        <ProjectVercelTab
          :project="currentProject"
          :deployments="projectDeployments"
        />
      </section>

      <!-- ================================================================= -->
      <!-- VIEW 6: PROJECT NOTES & IDEAS SCRATCHPAD                          -->
      <!-- ================================================================= -->
      <section v-else-if="activeTab === 'notes'" aria-label="Project Notes and Scratchpad">
        <IdeaScratchpadPanel
          :key="currentProject.slug"
          :project-slug="currentProject.slug"
          :is-drawer="false"
        />
      </section>

      <!-- Modals & Drawers -->
      <TaskDrawer
        v-if="activeDrawerTask"
        :task="activeDrawerTask"
        :busy="isDrawerBusy"
        :repo="currentProject.githubRepo"
        @close="activeDrawerTask = null"
        @save="onSaveDrawerTask"
        @delete="deleteTaskFromDrawer"
      />

      <AddTaskModal
        v-if="showAddTaskModal"
        :project-slug="currentProject.slug"
        :disabled="isBusy"
        @close="showAddTaskModal = false"
        @create="onTaskModalCreated"
      />

      <ConfirmDialog
        v-if="confirmDeleteTask"
        title="Delete Task?"
        :message="`Are you sure you want to delete task '${taskToDelete?.name}'? This action cannot be undone.`"
        confirm-text="Delete Task"
        cancel-text="Cancel"
        :busy="isBusy"
        @confirm="onConfirmDeleteTask"
        @cancel="() => { confirmDeleteTask = false; taskToDelete = null }"
      />

      <!-- Double-Confirmation Delete Project Modal -->
      <div
        v-if="confirmDeleteProject"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-modal-title"
      >
        <div class="w-full max-w-md bg-[#111318] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <NexuraIcon name="AlertTriangle" size="md" />
            </div>
            <div>
              <h3 id="delete-project-modal-title" class="font-mono text-base font-semibold text-[#F3F4F6]">
                Delete Project Permanently?
              </h3>
              <p class="font-sans text-xs text-[#8A8F9E] mt-1">
                This action cannot be undone. All associated task milestone links will be permanently unlinked.
              </p>
            </div>
          </div>

          <div v-if="deleteError" class="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono" role="alert">
            {{ deleteError }}
          </div>

          <div class="space-y-2 pt-1">
            <label for="confirm-slug-input" class="block font-mono text-xs text-[#8A8F9E]">
              Type <span class="font-bold text-rose-400 font-mono select-all">{{ currentProject.slug }}</span> to confirm:
            </label>
            <input
              id="confirm-slug-input"
              v-model="confirmSlugInput"
              type="text"
              autofocus
              placeholder="Enter project slug"
              class="w-full bg-[#07080A] border border-white/[0.08] focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] font-mono placeholder-[#565B68] focus:outline-none"
              :disabled="isDeleting"
              @keydown.enter="onProjectDeleted"
            />
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#8A8F9E] hover:text-[#F3F4F6] transition cursor-pointer"
              :disabled="isDeleting"
              @click="closeDeleteProjectModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/40 disabled:text-rose-400/40 disabled:cursor-not-allowed text-white text-xs font-mono font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
              :disabled="!isSlugMatched || isDeleting"
              @click="onProjectDeleted"
            >
              <NexuraIcon v-if="isDeleting" name="Loader2" size="xs" class="animate-spin" />
              <span>{{ isDeleting ? 'Deleting...' : 'Delete Project Permanently' }}</span>
            </button>
          </div>
        </div>
      </div>

      <WorkflowLogModal
        :is-open="isLogModalOpen"
        :repo="currentProject.githubRepo || ''"
        :run="selectedRunForModal"
        @close="isLogModalOpen = false"
      />

      <SecurityAlertModal
        :is-open="isSecurityModalOpen"
        :repo="currentProject.githubRepo || ''"
        :summary="projectSecurity || null"
        @close="isSecurityModalOpen = false"
      />

      <DeploymentModal
        :is-open="isDeploymentModalOpen"
        :repo="currentProject.githubRepo || ''"
        :deploy-url="currentProject.deployUrl"
        :summary="projectDeployments || null"
        @close="isDeploymentModalOpen = false"
      />

      <PullRequestsIssuesModal
        :is-open="isPullsIssuesModalOpen"
        :repo="targetRepo"
        :project-slug="currentProject.slug"
        :summary="projectPullsIssues || null"
        @close="isPullsIssuesModalOpen = false"
        @issue-created="onCockpitIssueCreated"
        @task-imported="onCockpitTaskImported"
      />

      <PackageModal
        :is-open="isPackageModalOpen"
        :repo="targetRepo"
        :summary="projectPackages"
        @close="isPackageModalOpen = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import IdeaScratchpadPanel from '~~/components/notes/IdeaScratchpadPanel.vue'
import type {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  GitHubWorkflowRun,
  GitHubIssueItem
} from '~/types'
import type { ProjectTabId } from '~/composables/useProjectNav'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useProjects } from '~/composables/useProjects'
import { useTasks } from '~/composables/useTasks'
import { useQuickTask } from '~/composables/useQuickTask'
import { useHeaderActions } from '~/composables/useHeaderActions'
import {
  useGitHubCommits,
  useGitHubBranches,
  useGitHubWorkflows,
  useGitHubSecurity,
  useGitHubDeployments,
  useGitHubPullsAndIssues,
  useGitHubPackages,
  rerunWorkflow
} from '~/composables/useGitHub'

type DetailState = 'LOADING' | 'ERROR' | 'NOT_FOUND' | 'READY'

const route = useRoute()
const router = useRouter()
const slug = computed(() => (route.params.slug as string) || 'management')

const projectNav = useProjectNav()
const activeTab = projectNav.activeTab

const validTabs: ProjectTabId[] = ['dashboard', 'kanban', 'matrix', 'github', 'vercel', 'notes']

function resolveTab(tabQuery: unknown): ProjectTabId {
  if (typeof tabQuery !== 'string') return 'dashboard'
  const t = tabQuery.toLowerCase()
  if (t === 'supabase' || t === 'notes') return 'notes'
  if (t === 'kanban') return 'kanban'
  if (t === 'matrix') return 'matrix'
  if (t === 'github') return 'github'
  if (t === 'vercel') return 'vercel'
  return 'dashboard'
}

onMounted(() => {
  if (route.query.tab) {
    projectNav.setActiveTab(resolveTab(route.query.tab))
  } else if (route.query.view === 'kanban') {
    projectNav.setActiveTab('kanban')
  } else {
    projectNav.setActiveTab('dashboard')
  }
})

watch(() => route.params.slug, () => {
  if (route.query.tab) {
    projectNav.setActiveTab(resolveTab(route.query.tab))
  } else if (route.query.view === 'kanban') {
    projectNav.setActiveTab('kanban')
  } else {
    projectNav.setActiveTab('dashboard')
  }
})

watch(() => route.query.tab, (newVal) => {
  if (newVal) {
    projectNav.setActiveTab(resolveTab(newVal))
  }
})

watch(() => route.query.view, (newVal) => {
  if (newVal === 'kanban') {
    projectNav.setActiveTab('kanban')
  } else if (!newVal && !route.query.tab && activeTab.value === 'kanban') {
    projectNav.setActiveTab('dashboard')
  }
})

// SSOT Workspace Store
const workspaceStore = useWorkspaceStore()
const { projects: storeProjects, tasks: storeTasks, hydrationStatus } = workspaceStore
const projectsApi = useProjects()
const tasksApi = useTasks()

onMounted(async () => {
  if (!workspaceStore.isInitialized.value) {
    await workspaceStore.initializeWorkspace()
  }
})

// Current Project derived from SSOT store (Zero fake fallback fabrication)
const currentProject = computed<Project | null>(() => {
  const list = storeProjects.value || []
  const currentSlug = slug.value.toLowerCase()
  return list.find(p => p.slug.toLowerCase() === currentSlug) || null
})

// Contextual Action Bar integration
const { setActions, clearActions } = useHeaderActions()
const { openAddTask } = useQuickTask()

onMounted(() => {
  watchEffect(() => {
    const repo = currentProject.value?.githubRepo
    setActions([
      {
        id: 'repo-link',
        label: 'GitHub Repo',
        icon: 'ExternalLink',
        variant: 'secondary',
        disabled: !repo,
        handler: () => {
          if (repo) {
            window.open(`https://github.com/${repo}`, '_blank')
          }
        }
      },
      {
        id: 'add-deliverable',
        label: 'Add Deliverable',
        icon: 'Plus',
        variant: 'primary',
        handler: () => openAddTask()
      }
    ])
  })
})

onBeforeUnmount(() => {
  clearActions()
})

// 4-State Machine for Deterministic Lifecycle
const detailState = computed<DetailState>(() => {
  const projHydration = hydrationStatus.value.projects
  if (
    !workspaceStore.isInitialized.value &&
    (workspaceStore.isLoading.value || projHydration === 'loading' || projHydration === 'idle')
  ) {
    return 'LOADING'
  }
  if (projHydration === 'loading' && !currentProject.value) {
    return 'LOADING'
  }
  if (projHydration === 'error' && !currentProject.value) {
    return 'ERROR'
  }
  if (!currentProject.value) {
    return 'NOT_FOUND'
  }
  return 'READY'
})

const isStaleProjectsError = computed(() => {
  return hydrationStatus.value.projects === 'error' && !!currentProject.value
})

async function retryFetchProjects() {
  try {
    await workspaceStore.fetchWorkspaceProjects()
  } catch (err) {
    console.error('[projects] Failed to retry fetch projects:', err)
  }
}

const isBusy = ref(false)
const isDrawerBusy = ref(false)
const showAddTaskModal = ref(false)
const defaultColumnStatus = ref<TaskStatus>('in_queue')
const activeDrawerTask = ref<Task | null>(null)
const confirmDeleteTask = ref(false)
const taskToDelete = ref<Task | null>(null)

// Double-Confirmation Delete Project State
const confirmDeleteProject = ref(false)
const confirmSlugInput = ref('')
const isDeleting = ref(false)
const deleteError = ref('')

const isSlugMatched = computed(() => {
  if (!currentProject.value?.slug) return false
  return confirmSlugInput.value.trim().toLowerCase() === currentProject.value.slug.toLowerCase()
})

function openDeleteProjectModal() {
  confirmDeleteProject.value = true
  confirmSlugInput.value = ''
  deleteError.value = ''
}

function closeDeleteProjectModal() {
  confirmDeleteProject.value = false
  confirmSlugInput.value = ''
  deleteError.value = ''
}

async function onProjectDeleted() {
  if (!currentProject.value || !isSlugMatched.value || isDeleting.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await projectsApi.deleteProject(currentProject.value.slug)
    confirmDeleteProject.value = false
    confirmSlugInput.value = ''
    await router.push('/projects')
  } catch (err: any) {
    deleteError.value = err?.message || 'Failed to delete project. Please try again.'
  } finally {
    isDeleting.value = false
  }
}

// GitHub integration (Safely computed from targetRepo)
const targetRepo = computed(() => currentProject.value?.githubRepo || '')
const { commits, pending: commitsPending } = useGitHubCommits(targetRepo, 5)
const { branches, pending: branchesPending } = useGitHubBranches(targetRepo)
const { workflows: projectWorkflows, pending: workflowsPending, refresh: refreshWorkflows } = useGitHubWorkflows(targetRepo, 5)
const { data: projectSecurity, pending: securityPending, refresh: refreshSecurity } = useGitHubSecurity(targetRepo)
const { deployments: projectDeployments, pending: deploymentsPending, refresh: refreshDeployments } = useGitHubDeployments(targetRepo, 5)
const { activity: projectPullsIssues, pending: pullsIssuesPending, refresh: refreshPullsIssues } = useGitHubPullsAndIssues(targetRepo, 10)
const { packages: projectPackages, pending: packagesPending, refresh: refreshPackages } = useGitHubPackages(targetRepo)

// Tab Modals state & Rerun state
const isLogModalOpen = ref(false)
const isSecurityModalOpen = ref(false)
const isDeploymentModalOpen = ref(false)
const isPullsIssuesModalOpen = ref(false)
const isPackageModalOpen = ref(false)
const selectedRunForModal = ref<GitHubWorkflowRun | null>(null)
const rerunningRunId = ref<number | null>(null)

function onRerunWorkflowById(runId: number) {
  const run = (projectWorkflows.value || []).find(r => r.id === runId)
  if (run) {
    handleTabWorkflowRerun(run)
  }
}

// Package feed helpers
const tabPackageStatusDotClass = computed(() => {
  if (!projectPackages.value) return 'bg-[#565B68]'
  if (!projectPackages.value.hasScope) return 'bg-amber-400'
  if ((projectPackages.value.packages || []).length > 0) return 'bg-emerald-400'
  return 'bg-[#565B68]'
})

const tabDockerSnippet = computed(() => {
  const r = currentProject.value?.githubRepo ? currentProject.value.githubRepo.toLowerCase() : 'bagja-iskandar/management'
  return `docker push ghcr.io/${r}:latest`
})

const tabCopiedSnippet = ref(false)
async function copyTabSnippet(text: string) {
  try {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text)
      tabCopiedSnippet.value = true
      setTimeout(() => {
        tabCopiedSnippet.value = false
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy snippet:', err)
  }
}

// PRs & Issues Computeds & Handlers
const tabOpenPrsCount = computed(() => projectPullsIssues.value?.openPrCount || 0)
const tabOpenIssuesCount = computed(() => projectPullsIssues.value?.openIssueCount || 0)
const tabMergedPrsCount = computed(() => {
  return projectPullsIssues.value?.pullRequests?.filter(p => p.state === 'merged').length || 0
})
const tabClosedIssuesCount = computed(() => projectPullsIssues.value?.closedIssueCount || 0)

const inPanelImportingId = ref<number | null>(null)
const inPanelImportedIssues = reactive<Record<number, boolean>>({})

async function importIssueFromFeed(issue: GitHubIssueItem) {
  if (!currentProject.value || inPanelImportingId.value || inPanelImportedIssues[issue.number]) return
  inPanelImportingId.value = issue.id
  try {
    const techTags = (issue.labels || []).map(l => l.name)
    const taskPayload = {
      name: issue.title,
      description: `Imported from GitHub Issue #${issue.number}\nURL: ${issue.htmlUrl}`,
      projectSlug: currentProject.value.slug,
      githubIssueUrl: issue.htmlUrl,
      githubIssueNumber: issue.number,
      techTags: techTags.length > 0 ? techTags : ['github-issue'],
      status: 'in_queue' as TaskStatus,
      priority: 'medium' as TaskPriority
    }

    await tasksApi.createTask(taskPayload)
    inPanelImportedIssues[issue.number] = true
  } catch (err) {
    console.error('Failed to import issue from feed:', err)
  } finally {
    inPanelImportingId.value = null
  }
}

async function onCockpitTaskImported(_task: any) {
  await refreshPullsIssues()
}

async function onCockpitIssueCreated(_issue: any) {
  await refreshPullsIssues()
}

// Deployments Computeds
const activeTabLiveUrl = computed(() => {
  return projectDeployments.value?.latestDeployment?.environmentUrl || currentProject.value?.deployUrl || ''
})

const targetEnvironmentName = computed(() => {
  if (projectDeployments.value?.latestDeployment?.environment) {
    return projectDeployments.value.latestDeployment.environment
  }
  if (currentProject.value?.deployUrl) return 'Production'
  return 'None Configured'
})

const tabDeploymentStatusDotClass = computed(() => {
  const latest = projectDeployments.value?.latestDeployment
  if (latest) {
    if (latest.state === 'success') return 'bg-emerald-400'
    if (latest.state === 'in_progress' || latest.state === 'queued' || latest.state === 'pending') {
      return 'bg-amber-400 animate-pulse'
    }
    if (latest.state === 'failure' || latest.state === 'error') return 'bg-rose-400'
  }
  if (currentProject.value?.deployUrl) return 'bg-emerald-400'
  return 'bg-[#565B68]'
})

const tabTotalChecksCount = computed(() => projectDeployments.value?.commitStatus?.totalCount || 0)
const tabPassedChecksCount = computed(() => {
  return projectDeployments.value?.commitStatus?.checks?.filter(c => c.state === 'success').length || 0
})

const tabCommitCheckBadgeClass = computed(() => {
  const s = projectDeployments.value?.commitStatus?.state
  if (s === 'success') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (s === 'pending') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (s === 'failure') return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  return 'bg-white/5 text-[#8A8F9E] border-white/10'
})

const tabCommitCheckSummaryText = computed(() => {
  const status = projectDeployments.value?.commitStatus
  if (!status || status.totalCount === 0) return 'No status checks recorded'
  if (status.state === 'success') return 'All commit checks passed'
  if (status.state === 'pending') return 'Checks currently running'
  if (status.state === 'failure') return 'Commit checks failing'
  return `State: ${status.state}`
})

// Security Computeds
const tabSecurityStatusDotClass = computed(() => {
  if (!projectSecurity.value) return 'bg-[#565B68]'
  if (projectSecurity.value.criticalCount > 0) return 'bg-rose-400 animate-pulse'
  if (projectSecurity.value.highCount > 0) return 'bg-amber-400'
  if (projectSecurity.value.totalAlerts > 0) return 'bg-yellow-400'
  if (!projectSecurity.value.enabled.dependabot) return 'bg-amber-400'
  return 'bg-emerald-400'
})

const scannerSecretClass = computed(() => {
  if (!projectSecurity.value || !projectSecurity.value.enabled.secretScanning) {
    return 'border-white/[0.06] bg-white/[0.02] text-[#8A8F9E]'
  }
  const hasLeaks = projectSecurity.value.alerts.some(a => a.type === 'secret_scanning')
  return hasLeaks ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
})

const scannerSecretStatusText = computed(() => {
  if (!projectSecurity.value || !projectSecurity.value.enabled.secretScanning) {
    return 'Disabled'
  }
  const hasLeaks = projectSecurity.value.alerts.some(a => a.type === 'secret_scanning')
  return hasLeaks ? 'Leaks Detected' : 'Active • Clean'
})

function openTabRunLogModal(run: GitHubWorkflowRun) {
  selectedRunForModal.value = run
  isLogModalOpen.value = true
}

async function handleTabWorkflowRerun(run: GitHubWorkflowRun) {
  if (!currentProject.value?.githubRepo || rerunningRunId.value === run.id) return
  rerunningRunId.value = run.id
  try {
    await rerunWorkflow(currentProject.value.githubRepo, run.id)
    await refreshWorkflows()
  } catch (err) {
    console.error('Failed to rerun workflow:', err)
  } finally {
    rerunningRunId.value = null
  }
}

// Tasks filtered specifically for this project from SSOT storeTasks
const projectTasks = computed<Task[]>(() => {
  if (!currentProject.value) return []
  const currentSlug = currentProject.value.slug.toLowerCase()
  return (storeTasks.value || []).filter(t => (t.projectSlug || '').toLowerCase() === currentSlug)
})

const sortByPriority = (a: Task, b: Task) => {
  const pWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
  const diff = (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0)
  if (diff !== 0) return diff
  return (a.taskId || a.id).localeCompare(b.taskId || b.id)
}

const priorityTasksList = computed(() => {
  return projectTasks.value
    .filter(t => t.priority === 'critical' || t.priority === 'high')
    .sort(sortByPriority)
})

const completedCount = computed(() => projectTasks.value.filter(t => t.status === 'deployed').length)
const totalTasksCount = computed(() => projectTasks.value.length)
const commitsCount = computed(() => (commits.value || []).length)
const derivedPercentage = computed(() => {
  if (!totalTasksCount.value) return 0
  return Math.round((completedCount.value / totalTasksCount.value) * 100)
})

interface ProjectTabItem {
  id: ProjectTabId
  label: string
  icon: string
  count?: number
}

const projectTabs = computed<ProjectTabItem[]>(() => [
  { id: 'dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'kanban', label: 'Kanban', icon: 'Columns3', count: totalTasksCount.value },
  { id: 'matrix', label: 'Deliverables', icon: 'CheckSquare', count: totalTasksCount.value },
  { id: 'github', label: 'GitHub', icon: 'GitBranch', count: commitsCount.value },
  { id: 'vercel', label: 'Vercel', icon: 'Globe' },
  { id: 'notes', label: 'Notes', icon: 'FileText' }
])

function onSelectTab(tabId: ProjectTabId) {
  activeTab.value = tabId
  projectNav.setActiveTab(tabId)
  const nextQuery = { ...route.query, tab: tabId }
  if (nextQuery.view) delete nextQuery.view
  router.replace({ query: nextQuery })
}

watchEffect(() => {
  projectNav.setCounts({
    tasks: projectTasks.value.length,
    matrix: projectTasks.value.length,
    commits: commitsCount.value,
    hasGithub: !!currentProject.value?.githubRepo
  })
})

async function onUpdateTaskStatus(taskId: string, newStatus: TaskStatus) {
  try {
    await tasksApi.updateTask(taskId, { status: newStatus })
  } catch (err) {
    console.error('Failed to update task status:', err)
  }
}

function onTaskClick(task: Task) {
  activeDrawerTask.value = task
}

function onAddTaskToColumn(status: TaskStatus = 'in_queue') {
  defaultColumnStatus.value = status
  showAddTaskModal.value = true
}

async function onTaskModalCreated(payload: {
  name: string
  description?: string
  status?: TaskStatus
  priority: TaskPriority
  techTags: string[]
  dueDate?: string
  projectSlug?: string
}) {
  if (!currentProject.value) return
  isBusy.value = true
  try {
    await tasksApi.createTask({
      name: payload.name,
      description: payload.description,
      projectSlug: currentProject.value.slug,
      status: defaultColumnStatus.value || 'in_queue',
      priority: payload.priority || 'medium',
      techTags: payload.techTags || [],
      dueDate: payload.dueDate
    })
    showAddTaskModal.value = false
  } catch (err) {
    console.error('Failed to create task:', err)
  } finally {
    isBusy.value = false
  }
}

async function onSaveDrawerTask(payload: Partial<Task>) {
  if (!activeDrawerTask.value) return
  const currentId = activeDrawerTask.value.id
  isDrawerBusy.value = true
  try {
    await tasksApi.updateTask(currentId, payload)
    activeDrawerTask.value = null
  } catch (err) {
    console.error('Failed to save drawer task:', err)
  } finally {
    isDrawerBusy.value = false
  }
}

function deleteTaskFromDrawer(task: Task) {
  taskToDelete.value = task
  confirmDeleteTask.value = true
}

async function onConfirmDeleteTask() {
  if (!taskToDelete.value) return
  const deleteId = taskToDelete.value.id
  isBusy.value = true
  try {
    await tasksApi.deleteTask(deleteId)
    confirmDeleteTask.value = false
    if (activeDrawerTask.value?.id === deleteId) {
      activeDrawerTask.value = null
    }
    taskToDelete.value = null
  } catch (err) {
    console.error('Failed to delete task:', err)
  } finally {
    isBusy.value = false
  }
}

async function toggleMatrixTaskStatus(task: Task) {
  const next: Record<TaskStatus, TaskStatus> = {
    idea: 'in_queue',
    in_queue: 'running_sprint',
    running_sprint: 'deployed',
    deployed: 'in_queue',
    blocked: 'in_queue'
  }
  const newStatus = next[task.status] || 'in_queue'
  await onUpdateTaskStatus(task.id, newStatus)
}
</script>
