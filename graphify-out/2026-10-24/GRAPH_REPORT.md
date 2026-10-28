# Graph Report - Management  (2026-10-24)

## Corpus Check
- 179 files · ~114,653 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 1734 nodes · 2338 edges · 113 communities (84 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 61 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a75e7407`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkflowBadge.vue
- 🚀 Nexura Deployment & Production Readiness Guide
- tasks.vue
- [slug].vue
- projects/index.vue
- KanbanBoard.vue
- types/index.ts
- AddTaskModal.vue
- LiveDevOpsStream.vue
- AddProjectModal.vue
- CommitList.vue
- WorkflowLogModal.vue
- store.ts
- optimizer/SKILL.md
- tsconfig.json
- UnifiedHeroBanner.vue
- ActiveExecutionQueue.vue
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
- Dashboard.vue
- PROJECT.md — Identitas, Tujuan, Scope, dan Target Sistem Nexura
- Accessibility Audit and Testing
- useTasks
- DESIGN.md — Precision Dark Obsidian Design System
- Code Review Excellence
- rules/graphify.md
- workflows/graphify.md
- priorityTasksList
- NEXURA_SYSTEM_SPEC.md — Spesifikasi Sistem & Blueprint Transformasi
- ROADMAP.md — Nexura Evolution Roadmap
- PackageModal.vue
- useSprints
- AddTargetModal.vue
- onUpdateTaskStatus
- types/github.ts
- repositories/index.ts
- repos.vue
- roadmap.vue
- sprints.vue
- SecurityAlertModal.vue
- PullRequestsIssuesModal.vue
- NitroSprintRepository
- DeploymentModal.vue
- useGitHub.ts
- useSprintCalendar
- ProjectTaskMatrix.vue
- useStats
- TaskDrawer.vue
- nitro-project.repository.ts
- Sidebar.vue
- DeploymentBadge.vue
- ISprintRepository
- package.json
- RepoActivityBadge.vue
- 4. Spesifikasi Halaman & Komponen UI (Precision Dark Obsidian)
- SprintObjectiveBanner.vue
- useProjectNav
- TaskQueue.vue
- telemetry.vue
- ProjectLiveDeploymentCard.vue
- 3. Spesifikasi Skema Data
- HeaderBar.vue
- ConfirmDialog.vue
- vue
- NitroTaskRepository
- SecurityBadge.vue
- 1. Kondisi Engineering
- useProjects
- app.vue
- RecentShipmentsCard.vue
- isRepoManaged
- ProjectVercelTab.vue
- ProjectCicdCard.vue
- ProjectSecurityCard.vue
- ProjectSupabaseTab.vue
- useQuickTask
- handleTabWorkflowRerun
- OmniSearchInput.vue
- 3. Naming Conventions
- StorageAdapter
- 4. API Convention
- 5. Data Flow Patterns
- InfrastructureMeshCard.vue
- project.ts
- supabase-task.repository.ts
- isNetworkError
- NexuraIcon.vue

## God Nodes (most connected - your core abstractions)
1. `vue` - 55 edges
2. `withApiHandler()` - 32 edges
3. `createGitHubClient()` - 26 edges
4. `isNetworkError()` - 23 edges
5. `markSupabaseOffline()` - 23 edges
6. `useGitHub()` - 18 edges
7. `useOmniSearch()` - 17 edges
8. `throwApiError()` - 15 edges
9. `Capabilities` - 14 edges
10. `IProjectRepository` - 13 edges

## Surprising Connections (you probably didn't know these)
- `submitNewIssue()` --calls--> `createGitHubIssue()`  [EXTRACTED]
  components/PullRequestsIssuesModal.vue → composables/useGitHub.ts
- `handleCreateIssue()` --calls--> `createGitHubIssue()`  [EXTRACTED]
  components/TaskDrawer.vue → composables/useGitHub.ts
- `handleRerun()` --calls--> `rerunWorkflow()`  [EXTRACTED]
  components/WorkflowBadge.vue → composables/useGitHub.ts
- `loadJobTelemetry()` --calls--> `fetchWorkflowJobs()`  [EXTRACTED]
  components/WorkflowLogModal.vue → composables/useGitHub.ts
- `onTabPress()` --calls--> `cycleScope()`  [EXTRACTED]
  components/search/OmniSearchInput.vue → composables/useOmniSearch.ts

## Import Cycles
- None detected.

## Communities (113 total, 16 thin omitted)

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
Nodes (59): activeDrawerTask, activeTabLiveUrl, { activity: projectPullsIssues, pending: pullsIssuesPending, refresh: refreshPullsIssues }, { branches, pending: branchesPending }, { commits, pending: commitsPending }, commitsCount, completedCount, confirmDeleteProject (+51 more)

### Community 4 - "projects/index.vue"
Cohesion: 0.10
Nodes (17): activeCount, activeStatus, allCount, completedCount, { data: serverProjects, error: projectsError, refresh: refreshProjects }, displayProjects, filteredProjects, getDerivedStatus() (+9 more)

### Community 5 - "KanbanBoard.vue"
Cohesion: 0.06
Nodes (34): badgeClass, containerBorderClass, headerBorderClass, props, quickAddBtnClass, titleClass, topAddBtnClass, activeDragTask (+26 more)

### Community 6 - "types/index.ts"
Cohesion: 0.11
Nodes (13): hasAlerts, props, displayTaskId, dueDateBadgeClass, formattedDueDate, priorityClasses, props, Sprint (+5 more)

### Community 7 - "AddTaskModal.vue"
Cohesion: 0.10
Nodes (20): { data: fetchedProjects }, description, dialogRef, dueDate, emit, isSubmitting, name, nameInputRef (+12 more)

### Community 8 - "LiveDevOpsStream.vue"
Cohesion: 0.09
Nodes (18): activeTab, { activity, refresh: refreshPulls }, allStreamItems, commitDetails, commitItems, { commits: globalCommits, refresh: refreshCommits }, deploymentItems, { deployments, refresh: refreshDeployments } (+10 more)

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
Cohesion: 0.24
Nodes (17): createStorageAdapter(), createItem(), genId(), getArray(), getById(), getNextTaskId(), getValue(), migrateNumericIds() (+9 more)

### Community 13 - "optimizer/SKILL.md"
Cohesion: 0.05
Nodes (39): 10. Completion Criteria, 11. Priority Rule, 2.1 Inspect Before Modifying, 2.2 Targeted Repository Exploration, 2.3 Targeted Editing, 2.4 No Guessing, 2.5 Minimal Chat Output, 2. Core Rules (+31 more)

### Community 15 - "UnifiedHeroBanner.vue"
Cohesion: 0.14
Nodes (13): activeReposCount, ciChecksSummary, completedCount, highPriorityCount, inFlightCount, objectiveText, openPrCount, progressPercentage (+5 more)

### Community 16 - "ActiveExecutionQueue.vue"
Cohesion: 0.17
Nodes (8): activeTab, allTasks, criticalCount, criticalTasks, filteredTasks, inFlightCount, inFlightTasks, props

### Community 19 - "Historical Decisions (Phase 0–5)"
Cohesion: 0.08
Nodes (23): [2026-08-14] PENDING-01 — Bahasa UI → English, [2026-08-14] PENDING-02 — Ghost Files → Hapus, [2026-08-14] PENDING-03 — Lokasi `components/` & `composables/`, [2026-08-14] PENDING-04 — Pinia, [2026-08-14] Phase 1a–1f — Critical Fixes, [2026-08-14] Phase 2a–2f — Code Quality, [2026-08-14] Phase 3a–3f — Accessibility, [2026-08-15] Navigation Performance — useLazyAsyncData (+15 more)

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
Cohesion: 0.22
Nodes (9): 2. Styling: Tailwind CSS — Precision Dark Obsidian (Phase 13+), 6. Testing (Target), 7. Environment Variables, ENGINEERING.md — Standar Engineering & Conventions, Filosofi & Standar Visual, Konvensi Tailwind & CSS Layers, Minimum Target, No Legacy Warm Hex — Gunakan Token Dark Obsidian (+1 more)

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

### Community 34 - "Dashboard.vue"
Cohesion: 0.07
Nodes (30): activeDrawerTask, activeProjects, activeSprint, blockedTasks, ciWorkflowCount, confirmOpen, confirmTarget, { data: projects, error: projectsError, refresh: refreshProjects } (+22 more)

### Community 35 - "PROJECT.md — Identitas, Tujuan, Scope, dan Target Sistem Nexura"
Cohesion: 0.15
Nodes (12): 1. Identitas Project, 2. Visi & Tujuan Sistem, 3. Scope Matriks, 4. Tech Stack, 5. Integrasi External Services, A. Yang Diubah (Refactored), B. Yang Ditambahkan (New), C. Yang Dikecualikan (Anti-Bloat) (+4 more)

### Community 36 - "Accessibility Audit and Testing"
Cohesion: 0.25
Nodes (7): Accessibility Audit and Testing, Context, Do not use this skill when, Instructions, Requirements, Resources, Use this skill when

### Community 38 - "DESIGN.md — Precision Dark Obsidian Design System"
Cohesion: 0.08
Nodes (24): 1. Design Philosophy, 2. Color Tokens (`tailwind.config.ts` & CSS Variables), 3. Typography, 4.1 App Shell (`app/app.vue`), 4.2 Unified Left Sidebar (`components/Sidebar.vue`), 4.3 Unified Header Bar (`components/HeaderBar.vue`), 4. Layout Architecture (Linear / Cursor Inset Shell), 5.1 Specular KPI Row (4 Micro-Cards di Atas Dashboard) (+16 more)

### Community 39 - "Code Review Excellence"
Cohesion: 0.29
Nodes (6): Code Review Excellence, Do not use this skill when, Instructions, Output Format, Resources, Use this skill when

### Community 45 - "NEXURA_SYSTEM_SPEC.md — Spesifikasi Sistem & Blueprint Transformasi"
Cohesion: 0.25
Nodes (8): 1. Filosofi & Visi Sistem, 2. Matriks Komparasi: Eksisting vs Target, 5.1 GitHub (Phase 9 — Ready), 5.2 Supabase (Phase 10 — Planned), 5.3 Vercel (Phase 11 — Planned), 5. Arsitektur Integrasi, 6. Tahapan Eksekusi, NEXURA_SYSTEM_SPEC.md — Spesifikasi Sistem & Blueprint Transformasi

### Community 46 - "ROADMAP.md — Nexura Evolution Roadmap"
Cohesion: 0.05
Nodes (39): 10a. ⏳ Supabase Client & Storage Adapter, 10b. ⏳ SQL Migration, 10c. ⏳ Data Migration Script, 11a. ⏳ Vercel API Endpoints, 11b. ⏳ New Pages & Integration Points, 12a. ⏳ Lightweight Auth, 12b. ⏳ Data Backup & Export/Import, 12c. ⏳ Production Build & Deploy (+31 more)

### Community 47 - "PackageModal.vue"
Cohesion: 0.09
Nodes (18): badgeContainerClasses, badgeText, badgeTooltip, dotClasses, isModalOpen, { packages: summary, pending }, props, repoRef (+10 more)

### Community 49 - "AddTargetModal.vue"
Cohesion: 0.15
Nodes (12): activeTab, dueDate, emit, filteredBacklog, handleSubmit(), name, priority, projectSlug (+4 more)

### Community 51 - "types/github.ts"
Cohesion: 0.11
Nodes (18): GitHubBranch, GitHubCommit, GitHubCommitCheck, GitHubCommitFile, GitHubCommitItem, GitHubDeploymentItem, GitHubDeploymentState, GitHubDeploymentStatus (+10 more)

### Community 52 - "repositories/index.ts"
Cohesion: 0.06
Nodes (53): zod, fetchCachedBranches, fetchCachedCommitDetail, fetchCachedCommits, fetchCachedDeployments, fetchCachedGlobalCommits, fetchCachedPackages, fetchCachedPullsAndIssues (+45 more)

### Community 53 - "repos.vue"
Cohesion: 0.06
Nodes (23): branchesData, commitsData, config, confirmRemoveDialog, connectForm, { data: projects, refresh: refreshProjects }, detailsLoading, displayRepos (+15 more)

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

### Community 58 - "NitroSprintRepository"
Cohesion: 0.20
Nodes (5): getProjectRepo(), getSprintRepo(), getTaskRepo(), isSupabaseActive(), NitroSprintRepository

### Community 60 - "DeploymentModal.vue"
Cohesion: 0.10
Nodes (16): activeLiveUrl, close(), commitChecksLabel, commitChecksSubtitle, commitStatusTextClass, emit, environmentName, environmentSubtitle (+8 more)

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

### Community 66 - "nitro-project.repository.ts"
Cohesion: 0.14
Nodes (5): IProjectRepository, ProjectFilterOptions, NitroProjectRepository, getBySlug(), normalizeProject()

### Community 67 - "Sidebar.vue"
Cohesion: 0.08
Nodes (25): activeSprintCode, currentRouteProjectSlug, { data: projects }, { data: sprints }, { data: tasks }, defaultProjects, displayedProjects, ensureProjectExpanded() (+17 more)

### Community 68 - "DeploymentBadge.vue"
Cohesion: 0.20
Nodes (9): badgeContainerClasses, badgeText, badgeTooltip, { deployments: summary, pending }, dotClasses, isModalOpen, latestDeployment, props (+1 more)

### Community 71 - "package.json"
Cohesion: 0.05
Nodes (36): dependencies, lucide-vue-next, nuxt, @supabase/supabase-js, vue, vue-router, zod, devDependencies (+28 more)

### Community 72 - "RepoActivityBadge.vue"
Cohesion: 0.24
Nodes (9): emit, handleIssueCreated(), handleTaskImported(), isModalOpen, openIssues, openPrs, props, { pullsAndIssues: summary, pending, refresh } (+1 more)

### Community 73 - "4. Spesifikasi Halaman & Komponen UI (Precision Dark Obsidian)"
Cohesion: 0.17
Nodes (12): 4.1 Layout Shell (`app/app.vue`) — Inset Workspace Architecture, 4.2 Unified Left Sidebar (`components/Sidebar.vue`), 4.3 Unified Header Bar (`components/HeaderBar.vue`), 4.4.1 Baris 1: 4 Specular KPI Cards (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5`), 4.4.2 Baris 2: Asymmetric Bento Grid (`12 Columns`: `8 Left` + `4 Right`), 4.4 Dashboard — Asymmetric Bento Command Center (`/`), 4.5 Task Card (`components/TaskCard.vue`), 4.6 Code Repos (`/repos`) (+4 more)

### Community 74 - "SprintObjectiveBanner.vue"
Cohesion: 0.29
Nodes (5): draft, emit, isEditing, onSave(), props

### Community 76 - "TaskQueue.vue"
Cohesion: 0.20
Nodes (6): emit, onTaskClick(), priorityOrder, props, queueTasks, router

### Community 77 - "telemetry.vue"
Cohesion: 0.29
Nodes (5): { data: telemetryData, status, refresh: refreshTelemetry }, isRefreshing, ratePercent, resetMinutes, TelemetryResponse

### Community 78 - "ProjectLiveDeploymentCard.vue"
Cohesion: 0.15
Nodes (10): activeLiveUrl, copySuccess, deployedShortSha, deployedTimeAgo, environmentName, isBuilding, isLive, isPinging (+2 more)

### Community 79 - "3. Spesifikasi Skema Data"
Cohesion: 0.33
Nodes (6): 3.1 `types/task.ts`, 3.2 `types/project.ts`, 3.3 `types/sprint.ts` (Baru), 3.4 `types/github.ts` (Baru), 3.5 `types/note.ts` (Baru), 3. Spesifikasi Skema Data

### Community 81 - "HeaderBar.vue"
Cohesion: 0.10
Nodes (16): activeSprint, blockersCount, breadcrumbRoot, currentPageTitle, currentTimeStr, { data: projects }, { data: sprints }, { data: tasks } (+8 more)

### Community 82 - "ConfirmDialog.vue"
Cohesion: 0.16
Nodes (15): cancelButton, descId, displayBusy, displayCancelText, displayConfirmText, displayMessage, displayTitle, emits (+7 more)

### Community 83 - "vue"
Cohesion: 0.25
Nodes (6): props, svgClass, packagesList, props, totalPackages, vue

### Community 86 - "SecurityBadge.vue"
Cohesion: 0.20
Nodes (9): badgeContainerClasses, badgeIcon, badgeText, badgeTooltip, hasAlerts, isModalOpen, props, repoRef (+1 more)

### Community 87 - "1. Kondisi Engineering"
Cohesion: 0.33
Nodes (6): 1. Kondisi Engineering, Client / Frontend Layer, Composables, Semua Masalah Historis — Resolved, Server / API Layer, TypeScript

### Community 89 - "app.vue"
Cohesion: 0.29
Nodes (5): { data: projects }, { isAddTaskOpen, closeAddTask }, projectOptions, projectsApi, tasksApi

### Community 90 - "RecentShipmentsCard.vue"
Cohesion: 0.29
Nodes (4): allTasks, deployedTasks, displayShipments, props

### Community 91 - "isRepoManaged"
Cohesion: 0.33
Nodes (6): filteredRepos, getManagedProject(), isRepoManaged(), managedCount, onConfirmRemoveFromManagement(), unmanagedCount

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
Cohesion: 0.25
Nodes (6): config, copied, migrations, projectRef, props, tables

### Community 98 - "OmniSearchInput.vue"
Cohesion: 0.05
Nodes (38): inputPlaceholder, inputRef, leadingIcon, leadingIconColor, onEnterPress(), onEscPress(), onTabPress(), prefixBadgeClass (+30 more)

### Community 99 - "3. Naming Conventions"
Cohesion: 0.50
Nodes (4): 3. Naming Conventions, Components, Files, Task ID Format

### Community 102 - "4. API Convention"
Cohesion: 0.50
Nodes (4): 4. API Convention, External API (GitHub), Rate Limiting Strategy, Request/Response

### Community 103 - "5. Data Flow Patterns"
Cohesion: 0.50
Nodes (4): 5. Data Flow Patterns, CRUD Pattern, Error Pattern, External API Pattern

### Community 106 - "project.ts"
Cohesion: 0.50
Nodes (3): Project, ProjectPriority, ProjectStatus

### Community 113 - "supabase-task.repository.ts"
Cohesion: 0.19
Nodes (5): ITaskRepository, TaskFilterOptions, mapTaskRow(), mapTaskToRow(), SupabaseTaskRepository

### Community 116 - "isNetworkError"
Cohesion: 0.19
Nodes (10): isNetworkError(), markSupabaseOffline(), markSupabaseOnline(), mapProjectRow(), mapProjectToRow(), SupabaseProjectRepository, mapSprintRow(), mapSprintToRow() (+2 more)

### Community 117 - "NexuraIcon.vue"
Cohesion: 0.08
Nodes (9): getIconRegistry(), IconSize, IconSizePreset, NexuraIconProps, numericStrokeWidth, props, resolvedIcon, resolvedSize (+1 more)

## Knowledge Gaps
- **977 isolated node(s):** `projectsApi`, `tasksApi`, `{ isAddTaskOpen, closeAddTask }`, `{ data: projects }`, `projectOptions` (+972 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1204 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `vue` to `WorkflowBadge.vue`, `tasks.vue`, `[slug].vue`, `projects/index.vue`, `KanbanBoard.vue`, `types/index.ts`, `AddTaskModal.vue`, `LiveDevOpsStream.vue`, `AddProjectModal.vue`, `CommitList.vue`, `WorkflowLogModal.vue`, `UnifiedHeroBanner.vue`, `ActiveExecutionQueue.vue`, `Dashboard.vue`, `PackageModal.vue`, `AddTargetModal.vue`, `repos.vue`, `roadmap.vue`, `sprints.vue`, `SecurityAlertModal.vue`, `PullRequestsIssuesModal.vue`, `DeploymentModal.vue`, `useGitHub.ts`, `useSprintCalendar`, `ProjectTaskMatrix.vue`, `TaskDrawer.vue`, `Sidebar.vue`, `DeploymentBadge.vue`, `package.json`, `RepoActivityBadge.vue`, `SprintObjectiveBanner.vue`, `TaskQueue.vue`, `telemetry.vue`, `ProjectLiveDeploymentCard.vue`, `HeaderBar.vue`, `ConfirmDialog.vue`, `SecurityBadge.vue`, `app.vue`, `RecentShipmentsCard.vue`, `ProjectVercelTab.vue`, `ProjectCicdCard.vue`, `ProjectSecurityCard.vue`, `ProjectSupabaseTab.vue`, `OmniSearchInput.vue`, `InfrastructureMeshCard.vue`, `NexuraIcon.vue`?**
  _High betweenness centrality (0.353) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `package.json` to `isNetworkError`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `zod` connect `repositories/index.ts` to `package.json`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `projectsApi`, `tasksApi`, `{ isAddTaskOpen, closeAddTask }` to the rest of the system?**
  _977 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkflowBadge.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `tasks.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.07765151515151515 - nodes in this community are weakly interconnected._
- **Should `[slug].vue` be split into smaller, more focused modules?**
  _Cohesion score 0.0273972602739726 - nodes in this community are weakly interconnected._