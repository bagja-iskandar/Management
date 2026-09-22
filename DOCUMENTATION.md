# Dokumentasi Nexura — Personal Engineering Command Center

## 1. Ringkasan

**Nexura** adalah personal engineering command center berbasis Nuxt 4 yang dirancang untuk mengelola semua project GitHub, sprint kerja, dan deployment di satu tempat. Menggantikan workflow manual berpindah antar GitHub, Vercel dashboard, dan spreadsheet.

Teknologi:
- **Framework**: Nuxt 4 (Vue 3, TypeScript)
- **Server**: Nitro server-side API & middleware
- **Styling**: Tailwind CSS (Charcoal-Ochre Engineering Console tokens)
- **Storage**: Nitro Unstorage KV file di `.data/kv/` (pluggable ke Supabase PostgreSQL)
- **External**: GitHub REST API v3 (repos, commits, branches)
- **Design**: Charcoal-Ochre Console — canvas `#0B0A09`, accent `#C98A4B`, Inter + JetBrains Mono

## 2. Fitur Utama

- **Dashboard Command Center** (`/`):
  - 3 Telemetry Stat Cards: Active Tasks, Blockers, Sprint Velocity — font-mono bold numbers + ochre delta tags
  - Kanban Board 3 kolom: `IN_QUEUE` → `RUNNING_SPRINT` → `DEPLOYED`
  - Task cards: monospace `#ENG-xxx` ID, priority pill (pulsing dot for critical), tech stack tags
  - Hover glow: `border-[#C98A4B]` effect

- **Active Sprints** (`/sprints`):
  - Sprint management: create, assign tasks, close sprint
  - Velocity tracking per sprint

- **Architecture Roadmap** (`/roadmap`):
  - Visual timeline of project milestones
  - Linked ke project status dan GitHub activity

- **Code Repos** (`/repos`):
  - List semua GitHub repos (search, filter by language)
  - Per repo: name, description, language badge, last push, branches
  - Expand: recent commits

- **System Telemetry** (`/telemetry`):
  - GitHub API rate limits, storage usage, service connectivity
  - Placeholder panels untuk Supabase & Vercel

- **Projects Hub** (`/projects`):
  - Multi-filter status tabs, live search, sorting
  - Project cards dengan task count dan progress bar
  - Link project ke GitHub repo

- **Project Detail** (`/projects/[slug]`):
  - Metadata card, progress metrics, associated tasks
  - Tab GitHub: commits & branches dari linked repo

- **Tasks Hub** (`/tasks`):
  - Multi-dimension filtering (search, project, priority, status, sort)
  - Task management table dengan status actions

- **Modals Interaktif**:
  - `AddProjectModal`: Create project (githubRepo, techStack, priority)
  - `AddTaskModal`: Create task (projectSlug, priority, techTags, dueDate)
  - `ConfirmDialog`: Destructive action confirmation (WCAG accessible)

- **Layout**:
  - Sidebar compact (5 nav items): `bg-[#141210]`, hairline border
  - Header bar: live clock (UTC/WIB), branch indicator, sprint KPI, search (ochre focus ring)

## 3. API

### Internal CRUD
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/activities` | Activity feed (tasks sorted by date) |
| GET | `/api/tasks` | Task list (filterable by project, priority) |
| POST | `/api/tasks` | Create task (auto-generates `ENG-xxx` ID) |
| PUT | `/api/task/:id` | Update task |
| DELETE | `/api/task/:id` | Delete task |
| GET | `/api/projects` | Project list |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:slug` | Update project |
| DELETE | `/api/projects/:slug` | Delete project |
| GET | `/api/stats` | Dashboard KPIs (real calculations) |
| GET | `/api/sprints` | Sprint list |
| POST | `/api/sprints` | Create sprint |

### GitHub API Gateway
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/github/repos` | User repos (cached 5 min) |
| GET | `/api/github/commits?repo=X` | Recent commits per repo |
| GET | `/api/github/branches?repo=X` | Branches per repo |

### Planned (🔜)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/vercel/deployments` | Vercel deployment status |
| GET | `/api/vercel/projects` | Vercel projects |

## 4. Struktur Project

- `app/app.vue` — Root layout: `<Sidebar>` + `<HeaderBar>` + `<NuxtPage>`
- `app/pages/` — Routes: index, sprints, roadmap, repos, telemetry, projects, projects/[slug], tasks
- `components/` — Sidebar, HeaderBar, KanbanBoard, TaskCard, StatCard, dashboard, ActivityTable, modals, ConfirmDialog
- `composables/` — useTasks, useStats, useProjects, useGitHub
- `types/` — Task, Project, Sprint, Stat, GitHub types
- `server/api/` — Nitro CRUD endpoints + GitHub API gateway
- `server/utils/` — store, storage-adapter, github, handler, validation, errors
- `assets/css/main.css` — Tailwind directives + base/components layers
- `tailwind.config.ts` — Charcoal-Ochre color tokens + font configuration

## 5. Menjalankan Project

1. Install dependencies:
   ```bash
   npm install
   ```
2. Buat file `.env` dari template:
   ```bash
   cp .env.example .env
   # Edit .env — tambahkan GITHUB_TOKEN
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka browser ke:
   - `http://localhost:3000`

## 6. Environment Variables

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx          # Required for GitHub integration
GITHUB_USERNAME=bagja-iskandar         # Default username
SUPABASE_URL=                          # Fill when Supabase ready
SUPABASE_SERVICE_KEY=                  # Fill when Supabase ready
VERCEL_TOKEN=                          # Fill when Vercel ready
```
