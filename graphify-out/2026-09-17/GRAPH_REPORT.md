# Graph Report - Management  (2026-09-17)

## Corpus Check
- 86 files · ~71,090 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 870 nodes · 1029 edges · 52 communities (39 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `943bce03`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dashboard.vue
- store.ts
- tasks.vue
- [slug].vue
- projects.vue
- KanbanBoard.vue
- package.json
- AddTaskModal.vue
- ConfirmDialog.vue
- AddProjectModal.vue
- Sidebar.vue
- useProjects
- optimizer/SKILL.md
- tsconfig.json
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
- PROJECT.md — Identitas, Tujuan, Scope, dan Target Sistem Nexura
- Accessibility Audit and Testing
- useTasks
- DESIGN.md — Charcoal-Ochre Engineering Console Design System
- Code Review Excellence
- ActivityTable.vue
- rules/graphify.md
- workflows/graphify.md
- HeaderBar.vue
- 4. Spesifikasi Halaman & Komponen UI
- ROADMAP.md — Nexura Evolution Roadmap
- vue
- useSprints
- index.ts
- roadmap.vue
- sprints.vue

## God Nodes (most connected - your core abstractions)
1. `throwApiError()` - 16 edges
2. `withApiHandler()` - 16 edges
3. `vue` - 15 edges
4. `Capabilities` - 14 edges
5. `Instructions` - 13 edges
6. `Code Review Excellence Implementation Playbook` - 12 edges
7. `Historical Decisions (Phase 0–5)` - 11 edges
8. `Capabilities` - 11 edges
9. `Capabilities` - 11 edges
10. `getArray()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `fetchCachedCommits` --calls--> `createGitHubClient()`  [EXTRACTED]
  server/api/github/commits.get.ts → server/utils/github.ts
- `fetchCachedRepos` --calls--> `createGitHubClient()`  [EXTRACTED]
  server/api/github/repos.get.ts → server/utils/github.ts
- `githubFetch()` --calls--> `throwApiError()`  [EXTRACTED]
  server/utils/github.ts → server/utils/errors.ts
- `optionalString()` --calls--> `throwApiError()`  [EXTRACTED]
  server/utils/validation.ts → server/utils/errors.ts
- `readJsonBody()` --calls--> `throwApiError()`  [EXTRACTED]
  server/utils/validation.ts → server/utils/errors.ts

## Import Cycles
- None detected.

## Communities (52 total, 6 thin omitted)

### Community 0 - "dashboard.vue"
Cohesion: 0.12
Nodes (16): confirmOpen, confirmTarget, { data: stats, error: statsError }, { data: tasks, error: tasksError }, deleteTask(), displayStats, isBusy, onConfirmDelete() (+8 more)

### Community 1 - "store.ts"
Cohesion: 0.09
Nodes (39): fetchCachedCommits, fetchCachedRepos, throwApiError(), createGitHubClient(), githubFetch(), GitHubFetchOptions, withApiHandler(), createStorageAdapter() (+31 more)

### Community 2 - "tasks.vue"
Cohesion: 0.08
Nodes (24): allCount, blockedCount, confirmOpen, confirmTarget, { data: tasks, error: tasksError }, deleteTask(), deployedCount, filteredTasks (+16 more)

### Community 3 - "[slug].vue"
Cohesion: 0.06
Nodes (24): completedCount, confirmDeleteProject, currentProject, { data: projects }, derivedPercentage, filteredTasks, inProgressCount, LocalTask (+16 more)

### Community 4 - "projects.vue"
Cohesion: 0.10
Nodes (17): activeCount, activeStatus, allCount, completedCount, { data: serverProjects, error: projectsError }, displayProjects, filteredProjects, getDerivedStatus() (+9 more)

### Community 5 - "KanbanBoard.vue"
Cohesion: 0.16
Nodes (10): deployedTasks, dragOverColumn, emit, inQueueTasks, onDrop(), props, runningSprintTasks, Task (+2 more)

### Community 6 - "package.json"
Cohesion: 0.07
Nodes (26): dependencies, nuxt, pinia, vue, vue-router, devDependencies, autoprefixer, @nuxtjs/tailwindcss (+18 more)

### Community 7 - "AddTaskModal.vue"
Cohesion: 0.15
Nodes (15): description, dialogRef, dueDate, emit, isSubmitting, name, nameInputRef, onCancel() (+7 more)

### Community 8 - "ConfirmDialog.vue"
Cohesion: 0.16
Nodes (15): cancelButton, descId, displayBusy, displayCancelText, displayConfirmText, displayMessage, displayTitle, emits (+7 more)

### Community 9 - "AddProjectModal.vue"
Cohesion: 0.13
Nodes (17): deployUrl, description, dialogRef, dueDate, emit, githubRepo, isSubmitting, name (+9 more)

### Community 11 - "Sidebar.vue"
Cohesion: 0.29
Nodes (4): { isOpen, close }, NavItem, navItems, route

### Community 13 - "optimizer/SKILL.md"
Cohesion: 0.05
Nodes (39): 10. Completion Criteria, 11. Priority Rule, 2.1 Inspect Before Modifying, 2.2 Targeted Repository Exploration, 2.3 Targeted Editing, 2.4 No Guessing, 2.5 Minimal Chat Output, 2. Core Rules (+31 more)

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

### Community 40 - "ActivityTable.vue"
Cohesion: 0.27
Nodes (4): getPriorityClass(), getPriorityDotClass(), getPriorityLabel(), isCritical()

### Community 44 - "HeaderBar.vue"
Cohesion: 0.33
Nodes (4): currentTime, { toggle }, utcTime, wibTime

### Community 45 - "4. Spesifikasi Halaman & Komponen UI"
Cohesion: 0.08
Nodes (23): 1. Filosofi & Visi Sistem, 2. Matriks Komparasi: Eksisting vs Target, 3.1 `types/task.ts`, 3.2 `types/project.ts`, 3.3 `types/sprint.ts` (Baru), 3.4 `types/github.ts` (Baru), 3. Spesifikasi Skema Data, 4.1 Layout Shell (`app/app.vue`) (+15 more)

### Community 46 - "ROADMAP.md — Nexura Evolution Roadmap"
Cohesion: 0.06
Nodes (34): 10a. ⏳ Supabase Client & Storage Adapter, 10b. ⏳ SQL Migration, 10c. ⏳ Data Migration Script, 11a. ⏳ Vercel API Endpoints, 11b. ⏳ New Pages & Integration Points, 12a. ⏳ Lightweight Auth, 12b. ⏳ Data Backup & Export/Import, 12c. ⏳ Production Build & Deploy (+26 more)

### Community 47 - "vue"
Cohesion: 0.17
Nodes (10): { data: telemetryData, refresh: refreshTelemetry }, ratePercent, resetMinutes, TelemetryResponse, displayTaskId, priorityClasses, priorityDotClasses, priorityLabel (+2 more)

### Community 50 - "index.ts"
Cohesion: 0.11
Nodes (13): formattedValue, isNegative, props, subtitleText, GitHubBranch, GitHubCommitItem, GitHubRepoSummary, Project (+5 more)

### Community 54 - "roadmap.vue"
Cohesion: 0.20
Nodes (7): { data: projects, error: projectsError }, { data: tasks }, getCompletedTasks(), getProjectTasks(), projectsApi, sortedProjects, tasksApi

### Community 55 - "sprints.vue"
Cohesion: 0.09
Nodes (17): activeSprint, activeSprintTasks, calculateVelocity(), { data: sprints, error: sprintsError }, { data: tasks }, getSprintDuration(), getSprintTasks(), isSubmittingSprint (+9 more)

## Knowledge Gaps
- **544 isolated node(s):** `search`, `activeStatus`, `sortBy`, `showAddModal`, `successFeedback` (+539 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 628 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vue` connect `vue` to `dashboard.vue`, `tasks.vue`, `[slug].vue`, `projects.vue`, `KanbanBoard.vue`, `package.json`, `AddTaskModal.vue`, `ConfirmDialog.vue`, `AddProjectModal.vue`, `index.ts`, `roadmap.vue`, `sprints.vue`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `useTasks()` connect `useTasks` to `dashboard.vue`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `search`, `activeStatus`, `sortBy` to the rest of the system?**
  _544 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09463869463869463 - nodes in this community are weakly interconnected._
- **Should `tasks.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.08387096774193549 - nodes in this community are weakly interconnected._
- **Should `[slug].vue` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._