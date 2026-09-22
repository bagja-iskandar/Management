# ARCHITECTURE.md — Arsitektur Sistem Nexura

_Last updated: 2026-09-17. Arsitektur target: Charcoal-Ochre Command Center dengan GitHub/Supabase/Vercel integration._

---

## 1. Gambaran Arsitektur Sistem

**Nexura** adalah Personal Engineering Command Center berbasis **Nuxt 4 Full-Stack Monolith** yang dirancang untuk mengelola semua project GitHub, deployments, dan sprint kerja di satu tempat.

```
┌────────────────────────────────────────────────────────────────────┐
│                     Nexura Client (Browser)                        │
│  ┌──────────┐  ┌────────────────────────────────────────────────┐  │
│  │ Sidebar   │  │ Header Bar (Clock, Branch, KPI, Search)       │  │
│  │ (compact) │  ├────────────────────────────────────────────────┤  │
│  │           │  │                                                │  │
│  │ Dashboard │  │  Main Workspace                                │  │
│  │ Sprints   │  │  ┌─────────┬──────────────┬──────────┐        │  │
│  │ Roadmap   │  │  │IN_QUEUE │RUNNING_SPRINT│ DEPLOYED │ Kanban │  │
│  │ Repos     │  │  └─────────┴──────────────┴──────────┘        │  │
│  │ Telemetry │  │                                                │  │
│  └──────────┘  └────────────────────────────────────────────────┘  │
│  Tailwind CSS (Charcoal-Ochre tokens) + Vue 3 SPA                  │
└────────────────────────────┬───────────────────────────────────────┘
                             │ $fetch / useLazyAsyncData
┌────────────────────────────▼───────────────────────────────────────┐
│                     Nitro Server (Backend)                          │
│  ┌──────────────────────┐  ┌─────────────────────────────────────┐ │
│  │ Internal API         │  │ External API Gateways               │ │
│  │ /api/tasks     CRUD  │  │ /api/github/repos    → GitHub API   │ │
│  │ /api/projects  CRUD  │  │ /api/github/commits  → GitHub API   │ │
│  │ /api/sprints   CRUD  │  │ /api/github/branches → GitHub API   │ │
│  │ /api/stats     Calc  │  │ /api/vercel/*        → Vercel API   │ │
│  └──────────┬───────────┘  └────────────┬────────────────────────┘ │
│             │ StorageAdapter            │ cachedFunction (TTL 5m)   │
└─────────────┼───────────────────────────┼─────────────────────────┘
              │                           │
     ┌────────▼─────────┐       ┌────────▼──────────┐
     │ Storage Layer     │       │ External Services  │
     │ ┌───────────────┐ │       │ ┌───────────────┐  │
     │ │ Nitro KV      │ │       │ │ GitHub API v3 │  │
     │ │ .data/kv/     │ │       │ └───────────────┘  │
     │ │ (current)     │ │       │ ┌───────────────┐  │
     │ ├───────────────┤ │       │ │ Vercel API    │  │
     │ │ Supabase PG   │ │       │ │ (🔜 planned)  │  │
     │ │ (🔜 planned)  │ │       │ └───────────────┘  │
     │ └───────────────┘ │       └────────────────────┘
     └───────────────────┘
```

**Arsitektur Kunci:**
- **Client**: Vue 3 SPA dengan Tailwind CSS (Charcoal-Ochre tokens), navigasi 0ms via payload caching
- **Server**: Nitro engine — internal CRUD API + external API gateways (GitHub, Vercel)
- **Storage**: Pluggable adapter pattern — Nitro KV sekarang, Supabase PostgreSQL nanti
- **Caching**: GitHub/Vercel API responses di-cache dengan TTL 5 menit (rate limit protection)

---

## 2. Struktur Direktori (Target)

```
Management/
├── app/                          # Nuxt 4 app directory
│   ├── app.vue                   # Root shell: <Sidebar> + <HeaderBar> + <NuxtPage>
│   └── pages/
│       ├── index.vue             # Route / → Dashboard Command Center
│       ├── sprints.vue           # Route /sprints → Active Sprints (BARU)
│       ├── roadmap.vue           # Route /roadmap → Architecture Roadmap (BARU)
│       ├── repos.vue             # Route /repos → GitHub Repos Browser (BARU)
│       ├── telemetry.vue         # Route /telemetry → System Telemetry (BARU)
│       ├── projects.vue          # Route /projects → Projects Hub (redesigned)
│       ├── projects/
│       │   └── [slug].vue        # Route /projects/:slug → Project Detail (redesigned)
│       └── tasks.vue             # Route /tasks → Tasks Hub (redesigned)
│
├── components/
│   ├── Sidebar.vue               # Compact left sidebar (5 nav items) — replaces navbar.vue
│   ├── HeaderBar.vue             # Telemetry header (clock, branch, KPI, search) (BARU)
│   ├── KanbanBoard.vue           # 3-column Kanban (IN_QUEUE, RUNNING, DEPLOYED) (BARU)
│   ├── TaskCard.vue              # Task card for Kanban (BARU)
│   ├── StickyNote.vue            # Draggable sticky note card (BARU)
│   ├── GlobalNotes.vue           # Global notes overlay — rendered in app.vue (BARU)
│   ├── dashboard.vue             # Dashboard Command Center (rewritten)
│   ├── StatCard.vue              # Telemetry stat card (redesigned)
│   ├── ActivityTable.vue         # Activity data table (redesigned)
│   ├── QuickPanel.vue            # Quick actions panel
│   ├── ConfirmDialog.vue         # Delete confirmation dialog (preserved)
│   ├── AddProjectModal.vue       # Create project modal (extended)
│   └── AddTaskModal.vue          # Create task modal (extended)
│
├── composables/
│   ├── useTasks.ts               # Tasks CRUD client
│   ├── useStats.ts               # Stats fetcher
│   ├── useProjects.ts            # Projects CRUD client
│   ├── useGitHub.ts              # GitHub repos/commits/branches client (BARU)
│   └── useNotes.ts               # Sticky notes CRUD + drag state (BARU)
│
├── types/
│   ├── index.ts                  # Barrel exports
│   ├── task.ts                   # Task interface (extended)
│   ├── project.ts                # Project interface (extended)
│   ├── sprint.ts                 # Sprint interface (BARU)
│   ├── note.ts                   # StickyNote interface (BARU)
│   ├── stat.ts                   # Stat interface
│   └── github.ts                 # GitHub types (BARU)
│
├── server/
│   ├── api/
│   │   ├── activities.get.ts     # GET /api/activities
│   │   ├── tasks.get.ts          # GET /api/tasks
│   │   ├── tasks.post.ts         # POST /api/tasks (extended)
│   │   ├── stats.get.ts          # GET /api/stats (real calculations)
│   │   ├── projects.get.ts       # GET /api/projects
│   │   ├── projects.post.ts      # POST /api/projects (BARU)
│   │   ├── sprints.get.ts        # GET /api/sprints (BARU)
│   │   ├── sprints.post.ts       # POST /api/sprints (BARU)
│   │   ├── task/
│   │   │   ├── [id].put.ts       # PUT /api/task/:id (extended)
│   │   │   └── [id].delete.ts    # DELETE /api/task/:id
│   │   ├── projects/
│   │   │   ├── [slug].put.ts     # PUT /api/projects/:slug (BARU)
│   │   │   └── [slug].delete.ts  # DELETE /api/projects/:slug (BARU)
│   │   ├── github/
│   │       ├── repos.get.ts      # GET /api/github/repos (BARU)
│   │       ├── commits.get.ts    # GET /api/github/commits (BARU)
│   │       └── branches.get.ts   # GET /api/github/branches (BARU)
│   │   └── notes/
│   │       ├── index.get.ts      # GET /api/notes (BARU)
│   │       ├── index.post.ts     # POST /api/notes (BARU)
│   │       ├── [id].put.ts       # PUT /api/notes/:id (BARU)
│   │       └── [id].delete.ts    # DELETE /api/notes/:id (BARU)
│   ├── plugins/
│   │   └── seed.ts               # Seed data (updated schema)
│   ├── middleware/
│   │   └── visit.ts              # Page visit counter
│   └── utils/
│       ├── store.ts              # CRUD helpers
│       ├── storage-adapter.ts    # StorageAdapter interface (KV implementation)
│       ├── github.ts             # GitHub API client factory + cache (BARU)
│       ├── handler.ts            # withApiHandler wrapper
│       ├── validation.ts         # Input validators (extended)
│       └── errors.ts             # Error helpers
│
├── assets/
│   └── css/
│       └── main.css              # @tailwind directives + minimal base/components layers
│                                 # (dashboard.css & navbar.css DIHAPUS)
│
├── .env.example                  # Environment variables template (BARU)
├── tailwind.config.ts            # Tailwind CSS config with Charcoal-Ochre tokens (BARU)
├── nuxt.config.ts                # Nuxt config + runtimeConfig + Tailwind module
├── tsconfig.json
└── package.json
```

---

## 3. Konvensi Nuxt 4

| Direktori | Lokasi | Status |
|---|---|---|
| `pages/` | `app/pages/` | ✅ Sesuai |
| `app.vue` | `app/app.vue` | ✅ Sesuai |
| `components/` | Root (`components/`) | ⚠️ Functional (auto-import configured) |
| `composables/` | Root (`composables/`) | ⚠️ Functional (auto-import configured) |
| `types/` | Root (`types/`) | ⚠️ Non-auto-imported, manual import |

> **Keputusan**: Lokasi `components/` dan `composables/` di root dipertahankan (DECISIONS.md PENDING-03). Nuxt auto-import dikonfigurasi melalui `nuxt.config.ts`.

---

## 4. Alur Data

### Dashboard Load
```
browser → GET /
  → app/pages/index.vue → <Dashboard>
  → useLazyAsyncData('stats') → $fetch('/api/stats')
      → stats.get.ts → getArray('tasks') + getArray('projects')
      → Real calculations: Active Tasks count, Blockers count, Velocity
  → useLazyAsyncData('activities') → $fetch('/api/activities')
      → activities.get.ts → getArray('tasks') → sort by date
  → <KanbanBoard> renders tasks by status column
```

### Create Task
```
user input → <AddTaskModal> emits 'create'
  → useTasks.createTask({ name, projectSlug, priority, techTags, dueDate })
  → $fetch POST /api/tasks
  → tasks.post.ts → validate → auto-generate taskId ('ENG-xxx') → createItem()
  → return Task
  → refreshNuxtData() → KanbanBoard re-renders
```

### GitHub Repos Fetch
```
browser → /repos
  → useLazyAsyncData('github-repos') → $fetch('/api/github/repos')
  → github/repos.get.ts → cachedFunction(async () => {
      fetch('https://api.github.com/user/repos', { headers: { Authorization: 'Bearer ${token}' } })
    }, { maxAge: 300 })  // 5 min TTL
  → Return cached or fresh repo list
```

### Status Transfer (Kanban Drag)
```
user drag card → KanbanBoard.onDrop(taskId, newStatus)
  → useTasks.updateTask(id, { status: newStatus })
  → $fetch PUT /api/task/:id
  → [id].put.ts → updateItem('tasks', id, { status })
  → refreshNuxtData() → columns re-render
```

---

## 5. Storage Layer

### Current: Nitro Unstorage KV
```
useStorage('data:')
  key: 'tasks'    → .data/kv/tasks    (JSON Task[])
  key: 'projects' → .data/kv/projects (JSON Project[])
  key: 'sprints'  → .data/kv/sprints  (JSON Sprint[])
  key: 'notes'    → .data/kv/notes    (JSON StickyNote[])
  key: 'visits'   → .data/kv/visits   (JSON number)
  key: 'task-seq' → .data/kv/task-seq (JSON number — next ENG-xxx sequence)
```

### Future: Supabase PostgreSQL (pluggable)
```
StorageAdapter interface tetap sama.
Swap implementasi dari KV → Supabase client queries.
Toggle via config atau env var.
```

---

## 6. API Contract

### Internal CRUD

| Method | Path | Request Body | Response |
|---|---|---|---|
| GET | `/api/activities` | — | `Task[]` (sorted by date desc) |
| GET | `/api/tasks` | `?project=slug&priority=high` | `Task[]` (filtered, sorted) |
| POST | `/api/tasks` | `{ name, projectSlug?, priority?, techTags?, dueDate? }` | `Task` (with auto-generated `taskId`) |
| PUT | `/api/task/:id` | `Partial<Task>` | `Task` |
| DELETE | `/api/task/:id` | — | `{ ok: true }` |
| GET | `/api/projects` | — | `Project[]` |
| POST | `/api/projects` | `{ slug, title, description?, githubRepo?, techStack? }` | `Project` |
| PUT | `/api/projects/:slug` | `Partial<Project>` | `Project` |
| DELETE | `/api/projects/:slug` | — | `{ ok: true }` |
| GET | `/api/stats` | — | `Stat[]` (real calculations) |
| GET | `/api/sprints` | — | `Sprint[]` |
| POST | `/api/sprints` | `{ name, startDate, endDate }` | `Sprint` |
| GET | `/api/notes` | `?scope=global` or `?scope=slug` | `StickyNote[]` |
| POST | `/api/notes` | `{ content, scope, color?, position? }` | `StickyNote` |
| PUT | `/api/notes/:id` | `Partial<StickyNote>` | `StickyNote` |
| DELETE | `/api/notes/:id` | — | `{ ok: true }` |

### External API Gateways

| Method | Path | Upstream | Response |
|---|---|---|---|
| GET | `/api/github/repos` | `api.github.com/user/repos` | `GitHubRepoSummary[]` |
| GET | `/api/github/commits?repo=X` | `api.github.com/repos/{owner}/{repo}/commits` | `GitHubCommitItem[]` |
| GET | `/api/github/branches?repo=X` | `api.github.com/repos/{owner}/{repo}/branches` | `GitHubBranch[]` |
| GET | `/api/github/commit-detail?repo=X&sha=Y` | `api.github.com/repos/{owner}/{repo}/commits/{sha}` | `{ files, stats, patch }` |
| GET | `/api/vercel/deployments` | `api.vercel.com/v6/deployments` | `Deployment[]` (🔜) |

Error responses: H3 `createError` format — `{ statusCode, statusMessage, data: { code, details? } }`

---

## 7. External Service Integration

### GitHub (Phase 9 — Ready)
- **Auth**: Personal Access Token (PAT) via `.env` → `runtimeConfig.githubToken` (server-only)
- **Username**: `bagja-iskandar`
- **Endpoints**: Repos, commits, branches per repo
- **Caching**: Nitro `cachedFunction` with TTL 5 menit (proteksi rate limit 5,000 req/jam)
- **Error handling**: 401 (bad token), 403 (rate limited), graceful fallback

### Supabase (Phase 10 — Planned)
- **Purpose**: PostgreSQL database menggantikan Nitro KV untuk persistent storage
- **Auth**: Service role key via `.env` → `runtimeConfig.supabaseKey` (server-only)
- **Swap**: Implement `StorageAdapter` interface backed by Supabase queries

### Vercel (Phase 11 — Planned)
- **Purpose**: Deployment monitoring — status, build logs, project health
- **Auth**: Access Token via `.env` → `runtimeConfig.vercelToken` (server-only)
- **Endpoints**: Deployments list, project list
