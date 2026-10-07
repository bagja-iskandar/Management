# Graph Report - Management  (2026-10-07)

## Corpus Check
- 185 files · ~126,955 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 1684 nodes · 2205 edges · 123 communities (92 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eeb5f785`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkflowBadge.vue
- 🚀 Nexura Deployment & Production Readiness Guide
- tasks.vue
- [slug].vue
- projects/index.vue
- KanbanBoard.vue
- TaskQueue.vue
- AddTaskModal.vue
- GlobalCommitsTable.vue
- AddProjectModal.vue
- CommitList.vue
- WorkflowLogModal.vue
- store.ts
- optimizer/SKILL.md
- tsconfig.json
- PackageBadge.vue
- Historical Decisions (Phase 0–5)
- Code Review Excellence Implementation Playbook
- BAB I Pendahuluan
- application-performance-performance-optimization/SKILL.md
- KPI Dashboard Design
- Capabilities
- ui-visual-validator/SKILL.md
- Capabilities
- Capabilities
- ENGINEERING.md — Standar Engineering & Conventions
- Instructions
- ARCHITECTURE.md — Arsitektur Sistem Nexura
- Dokumentasi Nexura — Personal Engineering Command Center
- Instructions
- Refactor and Clean Code
- dashboard.vue
- PROJECT.md — Identitas, Tujuan, Scope, dan Target Sistem Nexura
- Accessibility Audit and Testing
- useTasks
- DESIGN.md — Charcoal-Ochre Engineering Console Design System
- Code Review Excellence
- rules/graphify.md
- workflows/graphify.md
- priorityTasksList
- 4. Spesifikasi Halaman & Komponen UI
- ROADMAP.md — Nexura Evolution Roadmap
- PackageModal.vue
- useSprints
- AddTargetModal.vue
- onUpdateTaskStatus
- types/github.ts
- throwApiError
- repos.vue
- roadmap.vue
- sprints.vue
- SecurityAlertModal.vue
- PullRequestsIssuesModal.vue
- GithubPulseCard.vue
- DeploymentModal.vue
- useGitHub.ts
- useSprintCalendar
- ProjectTaskMatrix.vue
- useStats
- TaskDrawer.vue
- ProjectCard.vue
- ActivityTable.vue
- DeploymentBadge.vue
- SprintObjectiveBanner.vue
- package.json
- RepoActivityBadge.vue
- ProjectsOverviewTable.vue
- TodaysFocusCard.vue
- ProjectNavDock.vue
- repositories/index.ts
- ProjectLiveDeploymentCard.vue
- TaskForm.vue
- HeaderBar.vue
- ConfirmDialog.vue
- vue
- CrossRepoTelemetryWatchdog.vue
- PriorityTasksRadar.vue
- TaskCard.vue
- useProjects
- CompactProjectsHub.vue
- Task
- WeeklyFocusSnapshot.vue
- KanbanColumn.vue
- ProjectVercelTab.vue
- ProjectCicdCard.vue
- ProjectSecurityCard.vue
- ProjectSupabaseTab.vue
- handleTabWorkflowRerun
- refreshData
- UpcomingDeadlinesCard.vue
- project.ts
- project.schema.ts
- SecurityBadge.vue
- types/index.ts
- ProjectCommitsPreview.vue
- IProjectRepository
- SupabaseTaskRepository
- SupabaseSprintRepository
- task.schema.ts
- getSupabaseClient
- HealthBadge.vue
- isRepoManaged
- RecentActivityTimeline.vue
- security.get.ts
- ProjectPackageCard.vue

## God Nodes (most connected - your core abstractions)
1. `vue` - 58 edges
2. `withApiHandler()` - 32 edges
3. `throwApiError()` - 27 edges
4. `createGitHubClient()` - 26 edges
5. `useGitHub()` - 18 edges
6. `Capabilities` - 14 edges
7. `IProjectRepository` - 13 edges
8. `Instructions` - 13 edges
9. `ITaskRepository` - 12 edges
10. `SupabaseProjectRepository` - 12 edges

## Surprising Connections (you probably didn't know these)
- `submitNewIssue()` --calls--> `createGitHubIssue()`  [EXTRACTED]
  components/PullRequestsIssuesModal.vue → composables/useGitHub.ts
- `handleCreateIssue()` --calls--> `createGitHubIssue()`  [EXTRACTED]
  components/TaskDrawer.vue → composables/useGitHub.ts
- `handleRerun()` --calls--> `rerunWorkflow()`  [EXTRACTED]
  components/WorkflowBadge.vue → composables/useGitHub.ts
- `loadJobTelemetry()` --calls--> `fetchWorkflowJobs()`  [EXTRACTED]
  components/WorkflowLogModal.vue → composables/useGitHub.ts
- `Props` --references--> `ProjectTabId`  [EXTRACTED]
  components/project/ProjectNavDock.vue → composables/useProjectNav.ts

## Import Cycles
- None detected.

## Communities (123 total, 13 thin omitted)

### Community 0 - "WorkflowBadge.vue"
Cohesion: 0.12
Nodes (15): badgeContainerClasses, badgeText, badgeTooltip, dotClasses, handleRerun(), isFailed, isRerunning, isRunning (+7 more)

### Community 1 - "🚀 Nexura Deployment & Production Readiness Guide"
Cohesion: 0.17
Nodes (11): 1. Arsitektur Lingkungan Production, 2. Prasyarat & Persiapan Database (Supabase), 3. Langkah-Langkah Deployment ke Vercel, 4. Checklist Verifikasi Pasca-Deployment (Post-Deployment Checklist), 5. Toleransi Kegagalan (Zero-Downtime Fallback), A. Eksekusi Skema Migrasi SQL, B. Verifikasi & Migrasi Data Lokal (Seeding), Langkah 1: Hubungkan Repository ke Vercel (+3 more)

### Community 2 - "tasks.vue"
Cohesion: 0.08
Nodes (26): allCount, blockedCount, confirmOpen, confirmTarget, { data: projects }, { data: tasks, error: tasksError }, deleteTask(), deployedCount (+18 more)

### Community 3 - "[slug].vue"
Cohesion: 0.03
Nodes (55): activeDrawerTask, activeTabLiveUrl, { activity: projectPullsIssues, pending: pullsIssuesPending, refresh: refreshPullsIssues }, { branches, pending: branchesPending }, { commits, pending: commitsPending }, completedCount, confirmDeleteProject, confirmDeleteTask (+47 more)

### Community 4 - "projects/index.vue"
Cohesion: 0.10
Nodes (17): activeCount, activeStatus, allCount, completedCount, { data: serverProjects, error: projectsError, refresh: refreshProjects }, displayProjects, filteredProjects, getDerivedStatus() (+9 more)

### Community 5 - "KanbanBoard.vue"
Cohesion: 0.07
Nodes (27): activeDragTask, availableTags, blockedTasks, deployedTasks, draggingTaskId, dragOverColumn, dragPosition, emit (+19 more)

### Community 6 - "TaskQueue.vue"
Cohesion: 0.20
Nodes (6): emit, onTaskClick(), priorityOrder, props, queueTasks, router

### Community 7 - "AddTaskModal.vue"
Cohesion: 0.15
Nodes (15): description, dialogRef, dueDate, emit, isSubmitting, name, nameInputRef, onCancel() (+7 more)

### Community 8 - "GlobalCommitsTable.vue"
Cohesion: 0.14
Nodes (15): availableRepos, cleanRepoName(), commitDetails, { commits: globalCommits, refresh: refreshGlobalCommits }, emit, expandedShas, filteredCommits, getRepoBadgeClass() (+7 more)

### Community 9 - "AddProjectModal.vue"
Cohesion: 0.13
Nodes (17): deployUrl, description, dialogRef, dueDate, emit, githubRepo, isSubmitting, name (+9 more)

### Community 10 - "CommitList.vue"
Cohesion: 0.14
Nodes (8): commitDetails, { commits, pending }, expandedShas, { fetchCommitDetail }, loadingDiff, props, repoRef, GitHubCommitDetail

### Community 11 - "WorkflowLogModal.vue"
Cohesion: 0.13
Nodes (13): close(), emit, errorMessage, isLoading, jobs, loadJobTelemetry(), onKeyDown(), props (+5 more)

### Community 12 - "store.ts"
Cohesion: 0.06
Nodes (26): ISprintRepository, ITaskRepository, NitroProjectRepository, NitroSprintRepository, NitroTaskRepository, createStorageAdapter(), StorageAdapter, createItem() (+18 more)

### Community 13 - "optimizer/SKILL.md"
Cohesion: 0.05
Nodes (39): 10. Completion Criteria, 11. Priority Rule, 2.1 Inspect Before Modifying, 2.2 Targeted Repository Exploration, 2.3 Targeted Editing, 2.4 No Guessing, 2.5 Minimal Chat Output, 2. Core Rules (+31 more)

### Community 16 - "PackageBadge.vue"
Cohesion: 0.20
Nodes (9): badgeContainerClasses, badgeText, badgeTooltip, dotClasses, isModalOpen, { packages: summary, pending }, props, repoRef (+1 more)

### Community 19 - "Historical Decisions (Phase 0–5)"
Cohesion: 0.09
Nodes (22): [2026-08-14] PENDING-01 — Bahasa UI → English, [2026-08-14] PENDING-02 — Ghost Files → Hapus, [2026-08-14] PENDING-03 — Lokasi `components/` & `composables/`, [2026-08-14] PENDING-04 — Pinia, [2026-08-14] Phase 1a–1f — Critical Fixes, [2026-08-14] Phase 2a–2f — Code Quality, [2026-08-14] Phase 3a–3f — Accessibility, [2026-08-15] Navigation Performance — useLazyAsyncData (+14 more)

### Community 20 - "Code Review Excellence Implementation Playbook"
Cohesion: 0.06
Nodes (31): 1. The Review Mindset, 2. Effective Feedback, 3. Review Scope, Advanced Review Patterns, Best Practices, Code Review Excellence Implementation Playbook, Common Pitfalls, Core Principles (+23 more)

### Community 21 - "BAB I Pendahuluan"
Cohesion: 0.08
Nodes (25): 1.1 Latar Belakang, 1.2 Identifikasi Permasalahan, 1.3 Tujuan Pengembangan, 1.4 Manfaat Sistem, 1.5 Ruang Lingkup, 1.6 Sasaran Pengguna, 1.7 Asumsi dan Batasan, 1.8 Definisi Istilah (+17 more)

### Community 22 - "application-performance-performance-optimization/SKILL.md"
Cohesion: 0.08
Nodes (24): 10. Comprehensive Load Testing, 11. Performance Regression Testing, 12. Production Monitoring Setup, 13. Continuous Performance Optimization, 1. Comprehensive Performance Profiling, 2. Observability Stack Assessment, 3. User Experience Analysis, 4. Database Performance Optimization (+16 more)

### Community 23 - "KPI Dashboard Design"
Cohesion: 0.08
Nodes (24): 1. KPI Framework, 2. SMART KPIs, 3. Dashboard Hierarchy, Best Practices, Common KPIs by Department, Core Concepts, Dashboard Layout Patterns, Do not use this skill when (+16 more)

### Community 24 - "Capabilities"
Cohesion: 0.09
Nodes (22): Accessibility & Inclusive Design, Advanced Design Techniques, Behavioral Traits, Capabilities, Collaboration & Communication, Cross-Platform Design Excellence, Design Research & Validation, Design System Implementation (+14 more)

### Community 25 - "ui-visual-validator/SKILL.md"
Cohesion: 0.09
Nodes (21): Accessibility Visual Verification, Advanced Validation Techniques, Analysis Process, Automated Visual Testing Integration, Behavioral Traits, Capabilities, Core Principles, Cross-Platform Visual Consistency (+13 more)

### Community 26 - "Capabilities"
Cohesion: 0.10
Nodes (20): Architecture Documentation, Behavioral Traits, Capabilities, Cloud-Native Architecture, Data Architecture, Distributed Systems Design, Do not use this skill when, Example Interactions (+12 more)

### Community 27 - "Capabilities"
Cohesion: 0.10
Nodes (19): Accessibility & Inclusive Design, Behavioral Traits, Capabilities, Core React Expertise, Developer Experience & Tooling, Do not use this skill when, Example Interactions, Instructions (+11 more)

### Community 28 - "ENGINEERING.md — Standar Engineering & Conventions"
Cohesion: 0.07
Nodes (28): 1. Kondisi Engineering, 2. Styling: Tailwind CSS (Phase 6+), 3. Naming Conventions, 4. API Convention, 5. Data Flow Patterns, 6. Testing (Target), 7. Environment Variables, Client / Frontend Layer (+20 more)

### Community 29 - "Instructions"
Cohesion: 0.12
Nodes (16): 10. Migration Guide, 11. Performance Optimizations, 12. Code Quality Checklist, 1. Code Analysis, 2. Refactoring Strategy, 3. SOLID Principles in Action, 4. Complete Refactoring Scenarios, 5. Decision Frameworks (+8 more)

### Community 30 - "ARCHITECTURE.md — Arsitektur Sistem Nexura"
Cohesion: 0.10
Nodes (19): 1. Gambaran Arsitektur Sistem, 2. Struktur Direktori (Target), 3. Konvensi Nuxt 4, 4. Alur Data, 5. Storage Layer, 6. API Contract, 7. External Service Integration, ARCHITECTURE.md — Arsitektur Sistem Nexura (+11 more)

### Community 31 - "Dokumentasi Nexura — Personal Engineering Command Center"
Cohesion: 0.11
Nodes (17): 1. Ringkasan, 2. Fitur Utama, 3. API, 4. Struktur Project, 5. Menjalankan Project, 6. Environment Variables, Dokumentasi Nexura — Personal Engineering Command Center, GitHub API Gateway (+9 more)

### Community 32 - "Instructions"
Cohesion: 0.17
Nodes (11): 1. Automated Testing with axe-core, 2. Color Contrast Validation, 3. Keyboard Navigation Testing, 4. Screen Reader Testing, 5. Manual Testing Checklist, 6. Remediation Examples, 7. CI/CD Integration, 8. Reporting (+3 more)

### Community 33 - "Refactor and Clean Code"
Cohesion: 0.20
Nodes (9): Context, Do not use this skill when, Instructions, Output Format, Refactor and Clean Code, Requirements, Resources, Safety (+1 more)

### Community 34 - "dashboard.vue"
Cohesion: 0.09
Nodes (19): activeDrawerTask, activeProjects, activeSprint, blockedTasks, confirmOpen, confirmTarget, criticalTasksCount, { data: projects, error: projectsError, pending, refresh: refreshProjects } (+11 more)

### Community 35 - "PROJECT.md — Identitas, Tujuan, Scope, dan Target Sistem Nexura"
Cohesion: 0.15
Nodes (12): 1. Identitas Project, 2. Visi & Tujuan Sistem, 3. Scope Matriks, 4. Tech Stack, 5. Integrasi External Services, A. Yang Diubah (Refactored), B. Yang Ditambahkan (New), C. Yang Dikecualikan (Anti-Bloat) (+4 more)

### Community 36 - "Accessibility Audit and Testing"
Cohesion: 0.25
Nodes (7): Accessibility Audit and Testing, Context, Do not use this skill when, Instructions, Requirements, Resources, Use this skill when

### Community 38 - "DESIGN.md — Charcoal-Ochre Engineering Console Design System"
Cohesion: 0.07
Nodes (29): 1. Design Philosophy, 2. Color Tokens (Tailwind CSS), 3. Typography, 4. Layout Specifications, 5. Component Design Specs, 6. Interaction & Animation, 7. Halaman & Komponen, 8. Migrasi dari Design Lama (+21 more)

### Community 39 - "Code Review Excellence"
Cohesion: 0.29
Nodes (6): Code Review Excellence, Do not use this skill when, Instructions, Output Format, Resources, Use this skill when

### Community 45 - "4. Spesifikasi Halaman & Komponen UI"
Cohesion: 0.07
Nodes (27): 1. Filosofi & Visi Sistem, 2. Matriks Komparasi: Eksisting vs Target, 3.1 `types/task.ts`, 3.2 `types/project.ts`, 3.3 `types/sprint.ts` (Baru), 3.4 `types/github.ts` (Baru), 3.5 `types/note.ts` (Baru), 3. Spesifikasi Skema Data (+19 more)

### Community 46 - "ROADMAP.md — Nexura Evolution Roadmap"
Cohesion: 0.06
Nodes (34): 10a. ⏳ Supabase Client & Storage Adapter, 10b. ⏳ SQL Migration, 10c. ⏳ Data Migration Script, 11a. ⏳ Vercel API Endpoints, 11b. ⏳ New Pages & Integration Points, 12a. ⏳ Lightweight Auth, 12b. ⏳ Data Backup & Export/Import, 12c. ⏳ Production Build & Deploy (+26 more)

### Community 47 - "PackageModal.vue"
Cohesion: 0.18
Nodes (9): close(), copiedSnippet, dockerSnippet, emit, onKeyDown(), props, scopeDotClass, statusDotClass (+1 more)

### Community 49 - "AddTargetModal.vue"
Cohesion: 0.15
Nodes (12): activeTab, dueDate, emit, filteredBacklog, handleSubmit(), name, priority, projectSlug (+4 more)

### Community 51 - "types/github.ts"
Cohesion: 0.12
Nodes (15): GitHubBranch, GitHubCommitCheck, GitHubCommitFile, GitHubCommitItem, GitHubDeploymentItem, GitHubDeploymentState, GitHubDeploymentSummary, GitHubIssueItem (+7 more)

### Community 52 - "throwApiError"
Cohesion: 0.12
Nodes (27): fetchCachedBranches, fetchCachedCommitDetail, fetchCachedCommits, fetchCachedDeployments, fetchCachedGlobalCommits, fetchCachedPackages, fetchCachedPullsAndIssues, fetchCachedRepos (+19 more)

### Community 53 - "repos.vue"
Cohesion: 0.07
Nodes (21): branchesData, busyRepoId, commitsData, config, confirmRemoveDialog, { data: projects, refresh: refreshProjects }, detailsLoading, displayRepos (+13 more)

### Community 54 - "roadmap.vue"
Cohesion: 0.17
Nodes (11): activeMilestonesCount, { data: projects, error: projectsError }, { data: tasks }, filteredProjects, getCompletedTasks(), getProjectTasks(), isLiveMaintenance(), maintenanceCount (+3 more)

### Community 55 - "sprints.vue"
Cohesion: 0.06
Nodes (35): activeModalTab, activeSprint, activeWeekKey, activeWeekTasks, addExistingTaskToWeek(), completedCount, completedTasks, completionPercentage (+27 more)

### Community 56 - "SecurityAlertModal.vue"
Cohesion: 0.16
Nodes (11): close(), emit, hasSecretLeaks, onKeyDown(), props, secretScanningDotClass, secretScanningLabel, secretScanningTextClass (+3 more)

### Community 57 - "PullRequestsIssuesModal.vue"
Cohesion: 0.09
Nodes (16): close(), createdErrorMessage, createdSuccessMessage, currentTab, emit, importedIssues, importingIssueId, importIssueToKanban() (+8 more)

### Community 60 - "DeploymentModal.vue"
Cohesion: 0.10
Nodes (15): activeLiveUrl, close(), commitChecksLabel, commitChecksSubtitle, commitStatusTextClass, emit, environmentName, environmentSubtitle (+7 more)

### Community 61 - "useGitHub.ts"
Cohesion: 0.22
Nodes (15): createGitHubIssue(), fetchDeployments(), fetchPackages(), fetchPullsAndIssues(), fetchSecurity(), useGitHub(), useGitHubBranches(), useGitHubCommits() (+7 more)

### Community 62 - "useSprintCalendar"
Cohesion: 0.33
Nodes (5): getMonday(), getSunday(), getWeekNumber(), toIsoDate(), useSprintCalendar()

### Community 63 - "ProjectTaskMatrix.vue"
Cohesion: 0.25
Nodes (5): filteredMatrixTasks, matrixFilter, matrixFilterOptions, matrixSearch, props

### Community 65 - "TaskDrawer.vue"
Cohesion: 0.12
Nodes (14): ChecklistItem, checklistItems, displayTaskId, effectiveRepo, emit, form, handleCreateIssue(), isCreatingIssue (+6 more)

### Community 66 - "ProjectCard.vue"
Cohesion: 0.22
Nodes (7): blockers, completionRate, deployedCount, props, queueCount, runningCount, totalCount

### Community 67 - "ActivityTable.vue"
Cohesion: 0.27
Nodes (4): getPriorityClass(), getPriorityDotClass(), getPriorityLabel(), isCritical()

### Community 68 - "DeploymentBadge.vue"
Cohesion: 0.20
Nodes (9): badgeContainerClasses, badgeText, badgeTooltip, { deployments: summary, pending }, dotClasses, isModalOpen, latestDeployment, props (+1 more)

### Community 69 - "SprintObjectiveBanner.vue"
Cohesion: 0.29
Nodes (5): draft, emit, isEditing, onSave(), props

### Community 71 - "package.json"
Cohesion: 0.06
Nodes (29): dependencies, nuxt, @supabase/supabase-js, vue, vue-router, zod, devDependencies, autoprefixer (+21 more)

### Community 72 - "RepoActivityBadge.vue"
Cohesion: 0.24
Nodes (9): emit, handleIssueCreated(), handleTaskImported(), isModalOpen, openIssues, openPrs, props, { pullsAndIssues: summary, pending, refresh } (+1 more)

### Community 73 - "ProjectsOverviewTable.vue"
Cohesion: 0.33
Nodes (3): displayProjects, ProjectOverviewItem, props

### Community 74 - "TodaysFocusCard.vue"
Cohesion: 0.33
Nodes (3): displayTasks, FocusTaskItem, props

### Community 75 - "ProjectNavDock.vue"
Cohesion: 0.09
Nodes (19): isProjectPage, route, currentCommitsCount, currentHasGithub, currentMatrixCount, currentTab, currentTasksCount, emit (+11 more)

### Community 77 - "repositories/index.ts"
Cohesion: 0.26
Nodes (6): projectRepository, sprintRepository, taskRepository, validateBody(), validateQuery(), withApiHandler()

### Community 78 - "ProjectLiveDeploymentCard.vue"
Cohesion: 0.12
Nodes (14): activeLiveUrl, commitChecksPassed, commitChecksTotal, copySuccess, deployedShortSha, deployedTimeAgo, environmentName, isBuilding (+6 more)

### Community 79 - "TaskForm.vue"
Cohesion: 0.47
Nodes (5): emits, onInput(), onSubmit(), props, value

### Community 81 - "HeaderBar.vue"
Cohesion: 0.14
Nodes (10): breadcrumbs, Crumb, { data: projects }, projectsApi, route, searchInputRef, { searchQuery }, { toggle } (+2 more)

### Community 82 - "ConfirmDialog.vue"
Cohesion: 0.16
Nodes (15): cancelButton, descId, displayBusy, displayCancelText, displayConfirmText, displayMessage, displayTitle, emits (+7 more)

### Community 83 - "vue"
Cohesion: 0.17
Nodes (9): { data: telemetryData, refresh: refreshTelemetry }, ratePercent, resetMinutes, TelemetryResponse, formattedVelocity, props, props, svgClass (+1 more)

### Community 84 - "CrossRepoTelemetryWatchdog.vue"
Cohesion: 0.29
Nodes (6): liveDeploymentsInfo, props, repoCount, repoScope, runsDisplay, securityBadgeText

### Community 85 - "PriorityTasksRadar.vue"
Cohesion: 0.13
Nodes (9): activeTab, allCount, blockedCount, criticalCount, filteredTasks, highCount, props, radarTasks (+1 more)

### Community 86 - "TaskCard.vue"
Cohesion: 0.33
Nodes (5): displayTaskId, dueDateBadgeClass, formattedDueDate, priorityClasses, props

### Community 89 - "Task"
Cohesion: 0.25
Nodes (5): hasAlerts, props, Task, TaskPriority, TaskStatus

### Community 90 - "WeeklyFocusSnapshot.vue"
Cohesion: 0.18
Nodes (9): deployedTasksCount, displayedInFlightTasks, inFlightTasksCount, inQueueTasksCount, objectiveText, progressPercentage, props, sprintBadgeLabel (+1 more)

### Community 91 - "KanbanColumn.vue"
Cohesion: 0.25
Nodes (7): badgeClass, containerBorderClass, headerBorderClass, props, quickAddBtnClass, titleClass, topAddBtnClass

### Community 92 - "ProjectVercelTab.vue"
Cohesion: 0.15
Nodes (10): activeSha, copied, deploymentList, formatTimeAgo(), isPinging, isRedeploying, liveDomain, liveUrl (+2 more)

### Community 93 - "ProjectCicdCard.vue"
Cohesion: 0.22
Nodes (3): latestRun, props, recentRuns

### Community 94 - "ProjectSecurityCard.vue"
Cohesion: 0.25
Nodes (7): criticalCount, highCount, isClean, lowCount, mediumCount, props, totalAlerts

### Community 95 - "ProjectSupabaseTab.vue"
Cohesion: 0.29
Nodes (5): copied, migrations, projectRef, props, tables

### Community 98 - "refreshData"
Cohesion: 0.40
Nodes (5): onConfirmDelete(), onProjectModalCreated(), onSaveDrawerTask(), onTaskModalCreated(), refreshData()

### Community 99 - "UpcomingDeadlinesCard.vue"
Cohesion: 0.50
Nodes (3): DeadlineItem, displayDeadlines, props

### Community 100 - "project.ts"
Cohesion: 0.50
Nodes (3): Project, ProjectPriority, ProjectStatus

### Community 101 - "project.schema.ts"
Cohesion: 0.12
Nodes (14): baseProjectFields, CreateProjectInput, createProjectSchema, projectPrioritySchema, projectQuerySchema, projectStatusSchema, UpdateProjectInput, updateProjectSchema (+6 more)

### Community 102 - "SecurityBadge.vue"
Cohesion: 0.20
Nodes (9): badgeContainerClasses, badgeIcon, badgeText, badgeTooltip, hasAlerts, isModalOpen, props, repoRef (+1 more)

### Community 103 - "types/index.ts"
Cohesion: 0.14
Nodes (11): cardType, formattedValue, iconBgClass, isBlocker, isNegative, numericValue, props, subtitleText (+3 more)

### Community 112 - "IProjectRepository"
Cohesion: 0.16
Nodes (5): IProjectRepository, ProjectFilterOptions, mapProjectRow(), mapProjectToRow(), SupabaseProjectRepository

### Community 113 - "SupabaseTaskRepository"
Cohesion: 0.40
Nodes (3): mapTaskRow(), mapTaskToRow(), SupabaseTaskRepository

### Community 114 - "SupabaseSprintRepository"
Cohesion: 0.39
Nodes (3): mapSprintRow(), mapSprintToRow(), SupabaseSprintRepository

### Community 115 - "task.schema.ts"
Cohesion: 0.18
Nodes (10): baseTaskFields, CreateTaskInput, createTaskSchema, legacyStatusMap, taskPrioritySchema, TaskQueryInput, taskQuerySchema, taskStatusSchema (+2 more)

### Community 116 - "getSupabaseClient"
Cohesion: 0.13
Nodes (8): @supabase/supabase-js, supabase, TaskFilterOptions, getProjectRepo(), getSprintRepo(), getTaskRepo(), hasSupabase(), getSupabaseClient()

### Community 117 - "HealthBadge.vue"
Cohesion: 0.29
Nodes (6): badgeClasses, dotClasses, HealthStatus, label, props, tooltipText

### Community 118 - "isRepoManaged"
Cohesion: 0.33
Nodes (6): filteredRepos, getManagedProject(), isRepoManaged(), managedCount, onConfirmRemoveFromManagement(), unmanagedCount

### Community 119 - "RecentActivityTimeline.vue"
Cohesion: 0.50
Nodes (3): ActivityTimelineItem, displayItems, props

### Community 120 - "security.get.ts"
Cohesion: 0.60
Nodes (4): fetchCachedSecurity, normalizeSeverity(), normalizeState(), severityOrder

### Community 121 - "ProjectPackageCard.vue"
Cohesion: 0.50
Nodes (3): packagesList, props, totalPackages

## Knowledge Gaps
- **932 isolated node(s):** `route`, `isProjectPage`, `route`, `router`, `slug` (+927 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1160 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `vue` to `WorkflowBadge.vue`, `tasks.vue`, `[slug].vue`, `projects/index.vue`, `KanbanBoard.vue`, `TaskQueue.vue`, `AddTaskModal.vue`, `GlobalCommitsTable.vue`, `AddProjectModal.vue`, `CommitList.vue`, `WorkflowLogModal.vue`, `PackageBadge.vue`, `dashboard.vue`, `PackageModal.vue`, `AddTargetModal.vue`, `repos.vue`, `roadmap.vue`, `sprints.vue`, `SecurityAlertModal.vue`, `PullRequestsIssuesModal.vue`, `DeploymentModal.vue`, `useGitHub.ts`, `useSprintCalendar`, `ProjectTaskMatrix.vue`, `TaskDrawer.vue`, `ProjectCard.vue`, `DeploymentBadge.vue`, `SprintObjectiveBanner.vue`, `package.json`, `RepoActivityBadge.vue`, `ProjectsOverviewTable.vue`, `TodaysFocusCard.vue`, `ProjectNavDock.vue`, `ProjectLiveDeploymentCard.vue`, `TaskForm.vue`, `HeaderBar.vue`, `ConfirmDialog.vue`, `CrossRepoTelemetryWatchdog.vue`, `PriorityTasksRadar.vue`, `TaskCard.vue`, `CompactProjectsHub.vue`, `Task`, `WeeklyFocusSnapshot.vue`, `KanbanColumn.vue`, `ProjectVercelTab.vue`, `ProjectCicdCard.vue`, `ProjectSecurityCard.vue`, `ProjectSupabaseTab.vue`, `UpcomingDeadlinesCard.vue`, `SecurityBadge.vue`, `types/index.ts`, `HealthBadge.vue`, `RecentActivityTimeline.vue`, `ProjectPackageCard.vue`?**
  _High betweenness centrality (0.350) - this node is a cross-community bridge._
- **Why does `zod` connect `package.json` to `project.schema.ts`, `task.schema.ts`, `repositories/index.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `getSupabaseClient` to `package.json`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `useGitHub()` (e.g. with `createGitHubIssue()` and `fetchDeployments()`) actually correct?**
  _`useGitHub()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `route`, `isProjectPage`, `route` to the rest of the system?**
  _932 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkflowBadge.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `tasks.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.07765151515151515 - nodes in this community are weakly interconnected._