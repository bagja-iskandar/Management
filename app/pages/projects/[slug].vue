<template>
  <div class="space-y-6 pb-12 relative">
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
    />

    <!-- ================================================================= -->
    <!-- VIEW 1: PROJECT DASHBOARD (DEFAULT)                               -->
    <!-- ================================================================= -->
    <div v-if="activeTab === 'dashboard'" class="space-y-6">
      <!-- 4-Pillar DevOps Bento Cockpit Matrix -->
      <div class="space-y-4">
        <!-- Top DevOps Row: CI/CD Pipeline & Live Production Tracker -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProjectCicdCard
            :repo="currentProject.githubRepo || ''"
            :workflows="projectWorkflows || []"
            :pending="workflowsPending"
            :is-rerunning="rerunningRunId !== null"
            @open-log="openTabRunLogModal"
            @rerun="onRerunWorkflowById"
            @refresh="refreshWorkflows"
          />

          <ProjectLiveDeploymentCard
            :repo="currentProject.githubRepo || ''"
            :deploy-url="currentProject.deployUrl || ''"
            :deployments="projectDeployments"
            :pending="deploymentsPending"
            @open-modal="isDeploymentModalOpen = true"
            @refresh="refreshDeployments"
          />
        </div>

        <!-- Middle DevOps Row: Security & Packages -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProjectSecurityCard
            :repo="currentProject.githubRepo || ''"
            :security="projectSecurity"
            :pending="securityPending"
            @open-modal="isSecurityModalOpen = true"
            @refresh="refreshSecurity"
          />

          <ProjectPackageCard
            :repo="currentProject.githubRepo || ''"
            :packages="projectPackages"
            :pending="packagesPending"
            @open-modal="isPackageModalOpen = true"
            @refresh="refreshPackages"
          />
        </div>
      </div>

      <!-- Bottom Bento Row: GitHub Pulse & Project Focus Deliverables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectCommitsPreview
          :commits="commits || []"
          @view-all-commits="onSelectTab('github')"
        />

        <ProjectPriorityDeliverables
          :priority-tasks="priorityTasksList"
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
    <!-- VIEW 6: SUPABASE CLOUD INFRASTRUCTURE                             -->
    <!-- ================================================================= -->
    <section v-else-if="activeTab === 'supabase'" aria-label="Supabase Cloud Infrastructure">
      <ProjectSupabaseTab
        :project="currentProject"
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

    <ConfirmDialog
      v-if="confirmDeleteProject"
      title="Delete Project?"
      :message="`Deleting '${currentProject.title}' will remove its milestone link. This action cannot be undone.`"
      confirm-text="Delete Project"
      cancel-text="Cancel"
      :busy="false"
      @confirm="onProjectDeleted"
      @cancel="confirmDeleteProject = false"
    />

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
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import type {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  GitHubWorkflowRun,
  GitHubIssueItem
} from '~/types'
import type { ProjectTabId } from '~/composables/useProjectNav'

const route = useRoute()
const router = useRouter()
const slug = computed(() => (route.params.slug as string) || 'management')

const projectNav = useProjectNav()
const activeTab = projectNav.activeTab

const validTabs: ProjectTabId[] = ['dashboard', 'kanban', 'matrix', 'github', 'vercel', 'supabase']

onMounted(() => {
  if (route.query.tab && validTabs.includes(route.query.tab as ProjectTabId)) {
    projectNav.setActiveTab(route.query.tab as ProjectTabId)
  } else if (route.query.view === 'kanban') {
    projectNav.setActiveTab('kanban')
  } else if (!route.query.view && !route.query.tab) {
    projectNav.setActiveTab('dashboard')
  }
})

watch(() => route.params.slug, () => {
  if (route.query.tab && validTabs.includes(route.query.tab as ProjectTabId)) {
    projectNav.setActiveTab(route.query.tab as ProjectTabId)
  } else if (route.query.view === 'kanban') {
    projectNav.setActiveTab('kanban')
  } else {
    projectNav.setActiveTab('dashboard')
  }
})

watch(() => route.query.tab, (newVal) => {
  if (newVal && validTabs.includes(newVal as ProjectTabId)) {
    projectNav.setActiveTab(newVal as ProjectTabId)
  }
})

watch(() => route.query.view, (newVal) => {
  if (newVal === 'kanban') {
    projectNav.setActiveTab('kanban')
  } else if (!newVal && !route.query.tab && activeTab.value === 'kanban') {
    projectNav.setActiveTab('dashboard')
  }
})

const isBusy = ref(false)
const isDrawerBusy = ref(false)
const showAddTaskModal = ref(false)
const defaultColumnStatus = ref<TaskStatus>('in_queue')
const activeDrawerTask = ref<Task | null>(null)
const confirmDeleteTask = ref(false)
const taskToDelete = ref<Task | null>(null)
const confirmDeleteProject = ref(false)

const projectsApi = useProjects()
const tasksApi = useTasks()

const { data: projects, refresh: refreshProjects } = useLazyAsyncData('projects-detail', () => projectsApi.getProjects())
const { data: serverTasks, refresh: refreshTasks } = useLazyAsyncData('project-tasks', () => tasksApi.getTasks())

const currentProject = computed<Project>(() => {
  const list = projects.value ?? []
  const currentSlug = slug.value.toLowerCase()
  const found = list.find(p => p.slug.toLowerCase() === currentSlug)
  if (found) return found

  const titleFromSlug = slug.value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return {
    id: slug.value,
    slug: slug.value,
    title: titleFromSlug,
    description: 'High-performance stereoscopic depth estimation and neural signal processing architecture.',
    status: 'active',
    priority: 'high',
    githubRepo: slug.value === 'management' ? 'bagja-iskandar/Management' : undefined,
    techStack: ['Nuxt 4', 'Tailwind', 'TypeScript'],
    startDate: '2026-08-01',
    dueDate: '2026-12-31',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-09-17T00:00:00.000Z'
  }
})

// GitHub integration
const targetRepo = computed(() => currentProject.value.githubRepo || '')
const { commits, pending: commitsPending } = useGitHubCommits(targetRepo, 5)
const { branches, pending: branchesPending } = useGitHubBranches(targetRepo)
const { workflows: projectWorkflows, pending: workflowsPending, refresh: refreshWorkflows } = useGitHubWorkflows(targetRepo, 5)
const { data: projectSecurity, pending: securityPending, refresh: refreshSecurity } = useGitHubSecurity(computed(() => currentProject.value.githubRepo || ''))
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
  const r = currentProject.value.githubRepo ? currentProject.value.githubRepo.toLowerCase() : 'bagja-iskandar/management'
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
  if (inPanelImportingId.value || inPanelImportedIssues[issue.number]) return
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

    const created = await tasksApi.createTask(taskPayload)
    if (created && serverTasks.value) {
      serverTasks.value = [created, ...serverTasks.value.filter(t => t.id !== created.id)]
    }
    inPanelImportedIssues[issue.number] = true
    await refreshTasks()
  } catch (err) {
    console.error('Failed to import issue from feed:', err)
  } finally {
    inPanelImportingId.value = null
  }
}

async function onCockpitTaskImported(task: any) {
  if (task && serverTasks.value) {
    serverTasks.value = [task, ...serverTasks.value.filter(t => t.id !== task.id)]
  }
  await refreshTasks()
  await refreshPullsIssues()
}

async function onCockpitIssueCreated(_issue: any) {
  await refreshPullsIssues()
}

// Deployments Computeds
const activeTabLiveUrl = computed(() => {
  return projectDeployments.value?.latestDeployment?.environmentUrl || currentProject.value.deployUrl || ''
})

const targetEnvironmentName = computed(() => {
  if (projectDeployments.value?.latestDeployment?.environment) {
    return projectDeployments.value.latestDeployment.environment
  }
  if (currentProject.value.deployUrl) return 'Production'
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
  if (currentProject.value.deployUrl) return 'bg-emerald-400'
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
  if (!currentProject.value.githubRepo || rerunningRunId.value === run.id) return
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

// Tasks filtered specifically for this project
const projectTasks = computed<Task[]>(() => {
  if (serverTasks.value) {
    const currentSlug = currentProject.value.slug.toLowerCase()
    return serverTasks.value.filter(t => (t.projectSlug || '').toLowerCase() === currentSlug)
  }
  return []
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
  { id: 'supabase', label: 'Supabase', icon: 'Database' }
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
  if (serverTasks.value) {
    serverTasks.value = serverTasks.value.map(t =>
      (t.id === taskId || t.taskId === taskId) ? { ...t, status: newStatus } : t
    )
  }

  try {
    const matchedServerTask = (serverTasks.value || []).find(t => t.id === taskId || t.taskId === taskId)
    const apiId = matchedServerTask?.id || taskId
    await tasksApi.updateTask(apiId, { status: newStatus })
  } catch (err) {
    console.error('Failed to update task status:', err)
  } finally {
    await refreshTasks()
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
  isBusy.value = true
  try {
    const createdTask = await tasksApi.createTask({
      name: payload.name,
      description: payload.description,
      projectSlug: currentProject.value.slug,
      status: defaultColumnStatus.value || 'in_queue',
      priority: payload.priority || 'medium',
      techTags: payload.techTags || [],
      dueDate: payload.dueDate
    })

    if (createdTask) {
      if (serverTasks.value) {
        serverTasks.value = [createdTask, ...serverTasks.value.filter(t => t.id !== createdTask.id)]
      } else {
        serverTasks.value = [createdTask]
      }
    }

    showAddTaskModal.value = false
    await refreshTasks()
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

  if (serverTasks.value) {
    serverTasks.value = serverTasks.value.map(t => t.id === currentId ? { ...t, ...payload } : t)
  }

  try {
    await tasksApi.updateTask(currentId, payload)
    activeDrawerTask.value = null
    await refreshTasks()
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

  if (serverTasks.value) {
    serverTasks.value = serverTasks.value.filter(t => t.id !== deleteId)
  }

  try {
    await tasksApi.deleteTask(deleteId)
    confirmDeleteTask.value = false
    if (activeDrawerTask.value?.id === deleteId) {
      activeDrawerTask.value = null
    }
    taskToDelete.value = null
    await refreshTasks()
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

async function onProjectDeleted() {
  confirmDeleteProject.value = false
  try {
    await projectsApi.deleteProject(slug.value)
  } catch {
    // Ignore error
  }
  router.push('/projects')
}
</script>
