# NEXURA_SYSTEM_SPEC.md — Spesifikasi Sistem & Blueprint Transformasi

_Last updated: 2026-09-17. Charcoal-Ochre Engineering Command Center + GitHub/Supabase/Vercel integration._

---

## 1. Filosofi & Visi Sistem

Nexura dirancang sebagai **personal engineering command center** untuk seorang solo developer yang mengelola banyak project GitHub sekaligus. Bukan clone Jira, bukan todo app — melainkan **single pane of glass** untuk monitoring dan mengelola seluruh engineering workflow.

**Prinsip Desain:**
1. **Single Pane of Glass** — Semua project, task, repos, commits, dan deployments terlihat di satu tempat tanpa berpindah tab.
2. **Engineering Telemetry** — Setiap angka di layar adalah data riil, bukan mock. Metrics dihitung dari actual task data dan GitHub activity.
3. **Kanban-First Workflow** — Alur kerja utama adalah Kanban board 3-kolom (`IN_QUEUE` → `RUNNING_SPRINT` → `DEPLOYED`) untuk flow yang natural.
4. **Pluggable Services** — GitHub sekarang, Supabase & Vercel nanti. Arsitektur dirancang agar external services bisa di-plug tanpa rewrite.
5. **Charcoal-Ochre Aesthetic** — Visual language terminal-inspired: dark charcoal surface, ochre accent, monospace telemetry, minimal decoration.

---

## 2. Matriks Komparasi: Eksisting vs Target

| Aspek | Kondisi Eksisting | Target Nexura |
|---|---|---|
| **Design System** | Polymorphism Dark Glass (Indigo/Violet/Cyan, CSS vars) | Charcoal-Ochre Console (Tailwind CSS, `#0B0A09` + `#C98A4B`) |
| **Header** | Banner teks `"Welcome back, Bagja"` | Telemetry Header: live clock (UTC/WIB), branch pill, sprint KPI, search |
| **Navigasi** | 3 menu flat + profile card | 5 menu compact sidebar + system status tile |
| **Dashboard** | Mock SVG curves + mock donut gauge | 3 telemetry stat cards + real Kanban board |
| **Task Alur Kerja** | Tabel list flat, status cycling | Kanban 3-kolom + tabular matrix hub |
| **Task Schema** | 6 fields, status Bahasa Indonesia | 12+ fields, monospace `#ENG-xxx` IDs, English status |
| **Project CRUD** | Read-only (GET saja) | Full CRUD (POST, PUT, DELETE) |
| **GitHub** | Tidak ada | Real API: repos, commits, branches |
| **Vercel** | Tidak ada | 🔜 Planned: deployment monitoring |
| **Supabase** | Tidak ada | 🔜 Planned: PostgreSQL storage |
| **Data Metrics** | Hardcoded (`Math.max(...)`) | Real calculations dari actual data |
| **Styling** | ~1400 LOC CSS custom properties | Tailwind CSS utility classes |

---

## 3. Spesifikasi Skema Data

### 3.1 `types/task.ts`
```typescript
export interface Task {
  id: string                    // UUID v4
  taskId: string                // Sequential monospace ID: "ENG-001", "ENG-002", ...
  projectSlug?: string          // FK to Project.slug
  name: string                  // Task title
  description?: string          // Detailed technical note
  status: 'in_queue' | 'running_sprint' | 'deployed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  techTags: string[]            // e.g. ['vue', 'nuxt', 'supabase']
  dueDate?: string              // YYYY-MM-DD
  sprintId?: string             // FK to Sprint.id
  date: string                  // Activity log date
  createdAt: string
  updatedAt: string
}
```

### 3.2 `types/project.ts`
```typescript
export interface Project {
  id: string                    // UUID v4
  slug: string                  // URL-safe identifier (e.g. 'nexura-core')
  title: string                 // Display title
  description?: string          // Project objective / summary
  status: 'active' | 'planned' | 'on-hold' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  githubRepo?: string           // e.g. 'bagja-iskandar/Management'
  deployUrl?: string            // Production URL
  techStack: string[]           // e.g. ['nuxt', 'tailwind', 'supabase']
  startDate?: string            // ISO date
  dueDate?: string              // ISO date
  createdAt: string
  updatedAt: string
}
```

### 3.3 `types/sprint.ts` (Baru)
```typescript
export interface Sprint {
  id: string                    // UUID v4
  name: string                  // e.g. "Sprint 24"
  status: 'planning' | 'active' | 'completed'
  startDate: string
  endDate: string
  taskIds: string[]             // Task IDs assigned to this sprint
  velocity?: number             // Calculated: completed tasks / duration
  createdAt: string
}
```

### 3.4 `types/github.ts` (Baru)
```typescript
export interface GitHubRepoSummary {
  id: number
  name: string
  fullName: string              // e.g. 'bagja-iskandar/Management'
  private: boolean
  htmlUrl: string
  description?: string
  language?: string             // Primary language
  defaultBranch: string
  pushedAt: string
  stargazersCount: number
}

export interface GitHubCommitItem {
  sha: string
  shortSha: string              // First 7 chars
  message: string
  authorName: string
  date: string
  htmlUrl: string
  repoName: string
}

export interface GitHubBranch {
  name: string
  commitSha: string
  protected: boolean
}
```

### 3.5 `types/note.ts` (Baru)
```typescript
export interface StickyNote {
  id: string                    // UUID v4
  content: string               // Markdown content (bold, italic, list, link, code)
  color: 'ochre' | 'bone' | 'red' | 'blue' | 'green'  // Card accent color
  position: { x: number, y: number }  // Viewport coordinates (px)
  scope: 'global' | string     // 'global' = persists across all pages, or projectSlug
  pinned: boolean               // If true, shown in dashboard summary
  minimized: boolean            // If true, collapsed to small icon
  zIndex: number                // Stacking order (click to bring forward)
  createdAt: string
  updatedAt: string
}

// Constraints:
// - Global notes: max 6 (enforced server-side on POST)
// - Project notes: unlimited
// - Fixed size: ~240x160px (not resizable)
// - Position persisted per note — survives page refresh
```

---

## 4. Spesifikasi Halaman & Komponen UI

### 4.1 Layout Shell (`app/app.vue`)
```
┌────┬──────────────────────────────────────────────────┐
│ N  │  HeaderBar (clock, branch, search)               │
│    ├──────────────────────────────────────────────────┤
│ ■  │                                                  │
│ ⚡ │  <NuxtPage />                                    │
│ 🗺 │  Main Workspace (bg-[#0B0A09], p-6, scrollable) │
│ ⑂  │                                                  │
│ ~  │                                                  │
│    │                                                  │
│ ⚙  │                                                  │
└────┴──────────────────────────────────────────────────┘
 64px
```

### 4.2 Sidebar (`components/Sidebar.vue`) — Icon-Only Rail
- **Width**: `w-16` (64px), fixed left, full height
- **Surface**: `bg-[#0B0A09]` — sama dengan canvas, tanpa border kanan
- **3 Zona Vertikal** (flex col, space-between):
  - **Atas**: Brand icon "N" — `w-10 h-10 bg-[#C98A4B]/15 rounded-xl text-[#C98A4B] font-mono font-bold`
  - **Tengah**: Nav group container — `bg-[#141210] rounded-2xl p-2` berisi 5 icon buttons stacked vertikal:
    1. Dashboard `/` — Grid icon
    2. Active Sprints `/sprints` — Bolt icon
    3. Architecture Roadmap `/roadmap` — Map icon
    4. Code Repos `/repos` — Git-branch icon
    5. System Telemetry `/telemetry` — Activity icon
  - **Bawah**: Settings icon — gear
- **Active Icon**: `bg-[#C98A4B]/15 text-[#C98A4B]`
- **Inactive Icon**: `text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5`
- **Icon Size**: `w-10 h-10 rounded-xl`, SVG `w-5 h-5`
- **Tooltip**: title attribute per icon (nama halaman)
- **Mobile**: berubah menjadi bottom bar horizontal

### 4.3 Header Bar (`components/HeaderBar.vue`)
- **Surface**: `bg-[#141210]/80 backdrop-blur-xl border-b border-white/[0.06] h-14`
- **Left**: Live clock — `font-mono text-xs text-[#756F68]` — UTC + WIB, update setiap detik
- **Center**: Active branch pill — `MODALITY://DEV` — `font-mono text-xs bg-[#C98A4B]/15 text-[#C98A4B] rounded-full px-3 py-1`
- **Right**: Search input — `focus:ring-1 focus:ring-[#C98A4B]`

### 4.4 Dashboard — Mission Briefing (`/`)

Dashboard BUKAN kumpulan widget metrik. Dashboard adalah halaman scrollable berisi project cards besar yang menjawab: **"Apa kondisi semua project saya, dan hari ini mau ngerjakan apa?"**

#### 4.4.1 Alert Bar (`components/AlertBar.vue`)
- Hanya muncul jika ada task BLOCKED atau deadline mendekat/overdue
- Jika tidak ada alert, bar ini tersembunyi (tidak render)
- Surface: `bg-red-500/10 border-l-2 border-red-500 rounded-r-lg px-4 py-3`
- Konten: teks inline — contoh: `⚠ 2 BLOCKED: #ENG-104 Implement OAuth · #ENG-108 Fix CORS | 📅 #ENG-107 due tomorrow`
- Task ID clickable → navigasi ke project detail

#### 4.4.2 Project Cards (`components/ProjectCard.vue`)
Satu card besar per project aktif. Card surface: `bg-[#141210] border border-white/[0.06] rounded-xl p-6`.

**Zona Header:**
- Nama project — `font-mono text-xl font-bold text-[#F5F2EB]`
- Repo GitHub — `font-mono text-sm text-[#756F68]` clickable
- Tech tags — `font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B]`
- Deploy dot + Health badge di kanan atas

**Zona Progress + Blockers:**
- Progress bar tipis (ochre fill)
- Breakdown: `font-mono text-xs text-[#756F68]` — "5/12 tasks · 3 queue · 2 running · 5 deployed"
- Blockers (jika ada): `⛔ #ENG-104 Implement OAuth — waiting for API key` dalam baris merah

**Zona Ready to Pick Up (`components/TaskQueue.vue`):**
- Task dengan status `in_queue` milik project ini, sorted by priority
- Setiap baris: priority dot + label + task ID monospace + title
- Menjawab: "hari ini mau ngerjakan apa dari project ini?"
- Queue kosong → `✅ No tasks in queue`

**Zona Recent Commits (`components/CommitList.vue`):**
- 3-5 commit terakhir dari GitHub repo
- Commit message + SHA pendek + waktu relatif + tombol `▸ Diff`
- Klik Diff → expand: file changed + patch snippet
- Jika tidak ada githubRepo → "Link a GitHub repo to see commits"

#### 4.4.3 Health Badge (`components/HealthBadge.vue`)
Health dihitung otomatis, ambil worst case:

| Sinyal | 🟢 Healthy | 🟡 Needs Attention | 🔴 Critical |
|--------|-----------|---------------------|-------------|
| Last commit | < 7 hari | 7-30 hari | > 30 hari |
| Blockers | 0 | 1-2 | 3+ |
| Task completion | > 50% | 25-50% | < 25% |

### 4.5 Task Card (`components/TaskCard.vue`)
```
┌─────────────────────────────────┐
│  #ENG-104                      │  ← font-mono text-xs text-[#756F68]
│  Implement OAuth flow          │  ← text-[#F5F2EB] font-medium text-sm
│  ● HIGH        vue  nuxt      │  ← priority pill + tech tags
└─────────────────────────────────┘
Hover: border-[#C98A4B] + shadow-[0_0_12px_rgba(201,138,75,0.15)]
```

### 4.6 Code Repos (`/repos`)
- List semua GitHub repos dari `bagja-iskandar`
- Per repo: name, description, language badge, last push, default branch
- Expand: recent commits, branches
- Search & filter by language

### 4.7 Active Sprints (`/sprints`)
- Sprint list with status (Planning, Active, Completed)
- Create sprint, assign tasks, close sprint
- Velocity tracking per sprint

### 4.8 Architecture Roadmap (`/roadmap`)
- Visual timeline of project milestones
- Linked to project status and GitHub activity

### 4.9 System Telemetry (`/telemetry`)
- GitHub API rate limit status
- Storage usage (KV / Supabase)
- Service connectivity indicators
- Placeholder panels for Supabase & Vercel (activated when credentials available)

---

## 5. Arsitektur Integrasi

### 5.1 GitHub (Phase 9 — Ready)
**Auth**: Personal Access Token (PAT) via `.env` → `runtimeConfig.githubToken` (server-only, tidak terekspos ke browser).

**API Gateway** (`server/api/github/`):
- `GET /api/github/repos` → `api.github.com/user/repos?per_page=100&sort=pushed`
- `GET /api/github/commits?repo=owner/repo` → `api.github.com/repos/{owner}/{repo}/commits`
- `GET /api/github/branches?repo=owner/repo` → `api.github.com/repos/{owner}/{repo}/branches`

**Caching**: Nitro `cachedFunction` dengan TTL 5 menit — proteksi rate limit 5,000 req/jam.

### 5.2 Supabase (Phase 10 — Planned)
**Purpose**: PostgreSQL menggantikan Nitro KV untuk persistent storage.
**Migration Path**: Implement `StorageAdapter` interface backed by Supabase queries. Drop-in swap.

### 5.3 Vercel (Phase 11 — Planned)
**Purpose**: Deployment monitoring.
**API**: `GET /api/vercel/deployments`, `GET /api/vercel/projects`.

---

## 6. Tahapan Eksekusi

```
┌──────────────────────────────────────────────────────────┐
│ PHASE 6: DESIGN SYSTEM OVERHAUL                          │
│ Tailwind CSS + Charcoal-Ochre tokens + Font setup        │
│ Status: 📋 Ready                                         │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│ PHASE 7: SIDEBAR + HEADER BAR                            │
│ 5-item sidebar + telemetry header + layout shell         │
│ Status: 📋 Ready                                         │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│ PHASE 8: DASHBOARD + KANBAN + DATA LAYER                 │
│ Command Center + Kanban board + extended schemas + CRUD   │
│ Status: 📋 Ready                                         │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│ PHASE 9: GITHUB INTEGRATION                              │
│ Real API: repos, commits, branches + /repos page         │
│ Status: 📋 Ready (needs GITHUB_TOKEN)                    │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│ PHASE 10: SUPABASE MIGRATION                             │
│ PostgreSQL storage swap + SQL migrations                 │
│ Status: ⏳ Queued (needs credentials)                    │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│ PHASE 11: VERCEL INTEGRATION                             │
│ Deployment monitoring + new pages                        │
│ Status: ⏳ Queued (needs token)                          │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│ PHASE 12: PRODUCTION HARDENING & DEPLOY                  │
│ Auth, backup, CI/CD, Vercel deployment                   │
│ Status: ⏳ Queued                                        │
└──────────────────────────────────────────────────────────┘
```
