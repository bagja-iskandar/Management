import { ref, computed, reactive, watch, type Ref, type ComputedRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectNav, type ProjectTabId } from '~/composables/useProjectNav'
import { useProjects } from '~/composables/useProjects'
import { useTasks } from '~/composables/useTasks'
import type {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  GitHubWorkflowRun,
  GitHubIssueItem
} from '~/types'

export const validTabs: ProjectTabId[] = ['dashboard', 'deliverables', 'kanban', 'matrix', 'github', 'vercel', 'notes', 'settings']

export function resolveTab(tabQuery: unknown, projectNav?: ReturnType<typeof useProjectNav>): ProjectTabId {
  if (typeof tabQuery !== 'string') return 'dashboard'
  const t = tabQuery.toLowerCase()
  if (t === 'supabase' || t === 'notes') return 'notes'
  if (t === 'deliverables') return 'deliverables'
  if (t === 'kanban') {
    projectNav?.setViewMode('kanban')
    return 'deliverables'
  }
  if (t === 'matrix') {
    projectNav?.setViewMode('table')
    return 'deliverables'
  }
  if (t === 'github') return 'github'
  if (t === 'vercel') return 'vercel'
  if (t === 'settings') return 'settings'
  return 'dashboard'
}

export interface UseProjectCockpitOptions {
  currentProject: ComputedRef<Project | null>
  projectPackages?: Ref<any>
  projectPullsIssues?: Ref<any>
  projectDeployments?: Ref<any>
  projectSecurity?: Ref<any>
  refreshPullsIssues?: () => Promise<any>
}

export function useProjectCockpit(options: UseProjectCockpitOptions) {
  const {
    currentProject,
    projectPackages,
    projectPullsIssues,
    projectDeployments,
    projectSecurity,
    refreshPullsIssues
  } = options

  const route = useRoute()
  const router = useRouter()
  const projectNav = useProjectNav()
  const projectsApi = useProjects()
  const tasksApi = useTasks()

  // ---------------------------------------------------------------------------
  // 1. Tab Navigation & Route Sync
  // ---------------------------------------------------------------------------
  function syncTabFromRoute() {
    if (route.query.tab) {
      projectNav.setActiveTab(resolveTab(route.query.tab, projectNav))
      if (route.query.view === 'table' || route.query.view === 'kanban') {
        projectNav.setViewMode(route.query.view as 'kanban' | 'table')
      }
    } else if (route.query.view === 'kanban' || route.query.view === 'table') {
      projectNav.setActiveTab('deliverables')
      projectNav.setViewMode(route.query.view as 'kanban' | 'table')
    } else {
      projectNav.setActiveTab('dashboard')
    }
  }

  function onSelectTab(tabId: ProjectTabId) {
    projectNav.setActiveTab(tabId)
    const nextQuery: Record<string, any> = { ...route.query, tab: tabId }
    if (tabId === 'deliverables') {
      nextQuery.view = projectNav.deliverableViewMode.value
    } else if (nextQuery.view) {
      delete nextQuery.view
    }
    router.replace({ query: nextQuery })
  }

  function onSetDeliverableViewMode(mode: 'kanban' | 'table') {
    projectNav.setActiveTab('deliverables')
    projectNav.setViewMode(mode)
    router.replace({ query: { ...route.query, tab: 'deliverables', view: mode } })
  }

  // ---------------------------------------------------------------------------
  // 2. Tab Modals State
  // ---------------------------------------------------------------------------
  const isLogModalOpen = ref(false)
  const isSecurityModalOpen = ref(false)
  const isDeploymentModalOpen = ref(false)
  const isPullsIssuesModalOpen = ref(false)
  const isPackageModalOpen = ref(false)
  const selectedRunForModal = ref<GitHubWorkflowRun | null>(null)

  function openTabRunLogModal(run: GitHubWorkflowRun) {
    selectedRunForModal.value = run
    isLogModalOpen.value = true
  }

  async function onCockpitTaskImported(_task: any) {
    if (refreshPullsIssues) {
      await refreshPullsIssues()
    }
  }

  async function onCockpitIssueCreated(_issue: any) {
    if (refreshPullsIssues) {
      await refreshPullsIssues()
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Double-Confirmation Delete Project State
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // 4. Project Settings State & Form
  // ---------------------------------------------------------------------------
  const editProjectForm = reactive({
    title: '',
    description: '',
    githubRepo: '',
    deployUrl: ''
  })
  const isSavingProject = ref(false)
  const projectSaveFeedback = ref('')

  watch(
    currentProject,
    (proj) => {
      if (proj) {
        editProjectForm.title = proj.title || ''
        editProjectForm.description = proj.description || ''
        editProjectForm.githubRepo = proj.githubRepo || ''
        editProjectForm.deployUrl = proj.deployUrl || ''
      }
    },
    { immediate: true }
  )

  // ---------------------------------------------------------------------------
  // 5. GitHub Feed & Snippet Helpers
  // ---------------------------------------------------------------------------
  const tabPackageStatusDotClass = computed(() => {
    if (!projectPackages?.value) return 'bg-[#565B68]'
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

  const tabOpenPrsCount = computed(() => projectPullsIssues?.value?.openPrCount || 0)
  const tabOpenIssuesCount = computed(() => projectPullsIssues?.value?.openIssueCount || 0)
  const tabMergedPrsCount = computed(() => {
    return projectPullsIssues?.value?.pullRequests?.filter((p: any) => p.state === 'merged').length || 0
  })
  const tabClosedIssuesCount = computed(() => projectPullsIssues?.value?.closedIssueCount || 0)

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

  // Deployments Computeds
  const activeTabLiveUrl = computed(() => {
    return projectDeployments?.value?.latestDeployment?.environmentUrl || currentProject.value?.deployUrl || ''
  })

  const targetEnvironmentName = computed(() => {
    if (projectDeployments?.value?.latestDeployment?.environment) {
      return projectDeployments.value.latestDeployment.environment
    }
    if (currentProject.value?.deployUrl) return 'Production'
    return 'None Configured'
  })

  const tabDeploymentStatusDotClass = computed(() => {
    const latest = projectDeployments?.value?.latestDeployment
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

  const tabTotalChecksCount = computed(() => projectDeployments?.value?.commitStatus?.totalCount || 0)
  const tabPassedChecksCount = computed(() => {
    return projectDeployments?.value?.commitStatus?.checks?.filter((c: any) => c.state === 'success').length || 0
  })

  const tabCommitCheckBadgeClass = computed(() => {
    const s = projectDeployments?.value?.commitStatus?.state
    if (s === 'success') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    if (s === 'pending') return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    if (s === 'failure') return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    return 'bg-white/5 text-[#8A8F9E] border-white/10'
  })

  const tabCommitCheckSummaryText = computed(() => {
    const status = projectDeployments?.value?.commitStatus
    if (!status || status.totalCount === 0) return 'No status checks recorded'
    if (status.state === 'success') return 'All commit checks passed'
    if (status.state === 'pending') return 'Checks currently running'
    if (status.state === 'failure') return 'Commit checks failing'
    return `State: ${status.state}`
  })

  // Security Computeds
  const tabSecurityStatusDotClass = computed(() => {
    if (!projectSecurity?.value) return 'bg-[#565B68]'
    if (projectSecurity.value.criticalCount > 0) return 'bg-rose-400 animate-pulse'
    if (projectSecurity.value.highCount > 0) return 'bg-amber-400'
    if (projectSecurity.value.totalAlerts > 0) return 'bg-yellow-400'
    if (!projectSecurity.value.enabled?.dependabot) return 'bg-amber-400'
    return 'bg-emerald-400'
  })

  const scannerSecretClass = computed(() => {
    if (!projectSecurity?.value || !projectSecurity.value.enabled?.secretScanning) {
      return 'border-white/[0.06] bg-white/[0.02] text-[#8A8F9E]'
    }
    const hasLeaks = (projectSecurity.value.alerts || []).some((a: any) => a.type === 'secret_scanning')
    return hasLeaks ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  })

  const scannerSecretStatusText = computed(() => {
    if (!projectSecurity?.value || !projectSecurity.value.enabled?.secretScanning) {
      return 'Disabled'
    }
    const hasLeaks = (projectSecurity.value.alerts || []).some((a: any) => a.type === 'secret_scanning')
    return hasLeaks ? 'Leaks Detected' : 'Active • Clean'
  })

  return {
    syncTabFromRoute,
    onSelectTab,
    onSetDeliverableViewMode,
    isLogModalOpen,
    isSecurityModalOpen,
    isDeploymentModalOpen,
    isPullsIssuesModalOpen,
    isPackageModalOpen,
    selectedRunForModal,
    openTabRunLogModal,
    onCockpitTaskImported,
    onCockpitIssueCreated,
    confirmDeleteProject,
    confirmSlugInput,
    isDeleting,
    deleteError,
    isSlugMatched,
    openDeleteProjectModal,
    closeDeleteProjectModal,
    onProjectDeleted,
    editProjectForm,
    isSavingProject,
    projectSaveFeedback,
    tabPackageStatusDotClass,
    tabDockerSnippet,
    tabCopiedSnippet,
    copyTabSnippet,
    tabOpenPrsCount,
    tabOpenIssuesCount,
    tabMergedPrsCount,
    tabClosedIssuesCount,
    inPanelImportingId,
    inPanelImportedIssues,
    importIssueFromFeed,
    activeTabLiveUrl,
    targetEnvironmentName,
    tabDeploymentStatusDotClass,
    tabTotalChecksCount,
    tabPassedChecksCount,
    tabCommitCheckBadgeClass,
    tabCommitCheckSummaryText,
    tabSecurityStatusDotClass,
    scannerSecretClass,
    scannerSecretStatusText
  }
}
