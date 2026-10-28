# NEXURA_SYSTEM_SPEC.md — Spesifikasi Sistem & Blueprint Transformasi

_Last updated: 2026-10-22. Precision Dark Obsidian Engineering Command Center (Linear / Raycast Inset Architecture) + GitHub/Supabase/Vercel integration._

---

## 1. Filosofi & Visi Sistem

Nexura dirancang sebagai **personal engineering command center** untuk seorang solo developer yang mengelola banyak project GitHub sekaligus. Bukan clone Jira, bukan todo app — melainkan **single pane of glass** untuk monitoring dan mengelola seluruh engineering workflow.

**Prinsip Desain:**
1. **Single Pane of Glass** — Semua project, task, repos, commits, dan deployments terlihat di satu tempat tanpa berpindah tab.
2. **Engineering Telemetry** — Setiap angka di layar adalah data riil, bukan mock. Metrics dihitung dari actual task data dan GitHub activity.
3. **High-Signal Execution Flow** — Alur kerja menggabungkan **Execution Radar** (daftar fokus bergaya Linear di Dashboard) dan **Kanban Board** 3-kolom (`IN_QUEUE` → `RUNNING_SPRINT` → `DEPLOYED`).
4. **Pluggable Services** — Dual-Adapter Repository (Supabase PostgreSQL & Nitro KV fallback) + GitHub API Gateway terpusat.
5. **Precision Dark Obsidian Aesthetic** — Bahasa visual berstandar **Linear / Raycast / Cursor**: suhu warna dingin yang menyatu (`#07080A` void, `#0B0C10` inset workspace, `#111318` specular 1px surface, `#F3F4F6` crisp alabaster text, dan aksen `#6366F1` cool indigo).

---

## 2. Matriks Komparasi: Eksisting vs Target

| Aspek | Kondisi Lama (Charcoal-Ochre) | Target Baru (Precision Dark Obsidian) |
|---|---|---|
| **Design System** | Charcoal-Ochre (`#0B0A09` + `#C98A4B` + `#F5F2EB`, thermal clash) | Precision Dark Obsidian (`#07080A` void + `#0B0C10` inset canvas + `#111318` specular surface + `#F3F4F6` text + `#6366F1` indigo) |
| **App Shell** | Floating icon-only capsule dock + floating header islands + crosshair grid | Unified Left Sidebar (`w-56`) + Inset Workspace Panel (`.obs-workspace`, `rounded-2xl`) tanpa crosshair grid |
| **Header** | 3 pulau kapsul melayang di atas konten | Unified Top Header Bar (`h-13 border-b`) di dalam Inset Workspace: breadcrumb, sprint pill, jam/blockers, dan tombol CTA putih (`#F3F4F6`) |
| **Navigasi** | Ikon tanpa label teks di dalam kapsul sempit | Navigasi berlabel jelas + `⌘K` Quick Action trigger + counter badge + daftar shortcut *Active Projects* + status bar Supabase/GitHub |
| **Dashboard** | 3 blok kartu bertumpuk rata | 4 Specular KPI Cards + Asymmetric Bento Grid (8 kolom kiri: *Execution Radar* & *Global Commit Stream*; 4 kolom kanan: *Quick Inspector*, *Weekly Focus*, *Managed Projects*) |
| **Tipografi** | Overuse `font-mono` dan ukuran mikro `<12px` | `font-sans` (`Inter`) untuk seluruh UI utama, `font-mono` khusus ID/SHA/angka, ukuran minimum `12px` (`text-xs`) |

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

## 4. Spesifikasi Halaman & Komponen UI (Precision Dark Obsidian)

> **Acuan Visual Utama**: Lihat [DESIGN.md](./DESIGN.md) dan prototipe interaktif [mockup-dark-obsidian.html](./mockup-dark-obsidian.html).

### 4.1 Layout Shell (`app/app.vue`) — Inset Workspace Architecture
```
┌──────────────────┬──────────────────────────────────────────────────┐
│ Unified Left     │  Inset Workspace (.obs-workspace #0B0C10)        │
│ Sidebar (w-56)   │  ┌────────────────────────────────────────────┐  │
│ bg-[#07080A]     │  │ Unified HeaderBar (h-13, border-b)         │  │
│                  │  ├────────────────────────────────────────────┤  │
│ [N] Nexura   [+] │  │                                            │  │
│ [🔍 Quick... ⌘K] │  │  <NuxtPage />                              │  │
│                  │  │  Main Workspace (p-5, space-y-5)           │  │
│ • Command Center │  │                                            │  │
│ • My Tasks    14 │  │                                            │  │
│ • Sprints    W42 │  │                                            │  │
│ • Roadmap        │  │                                            │  │
│ • GitHub Repos 8 │  │                                            │  │
│                  │  │                                            │  │
│ Active Projects  │  │                                            │  │
│ ● nexura-cmd 78% │  └────────────────────────────────────────────┘  │
└──────────────────┴──────────────────────────────────────────────────┘
```
- **Outer Shell**: `bg-[#07080A] text-[#F3F4F6] flex p-2 sm:p-2.5 gap-2 max-w-[1600px] mx-auto`.
- **Hapus `<StructureStaticGrid />`**: Tidak lagi menggunakan crosshair grid cokelat.

### 4.2 Unified Left Sidebar (`components/Sidebar.vue`)
- **Width**: `w-56` (224px) pada desktop (`hidden lg:flex flex-col justify-between py-2.5 px-2`), drawer overlay pada mobile.
- **Elemen Vertikal**:
  1. **Brand Header**: Squircle logo + teks `Nexura` (`text-sm font-semibold text-[#F3F4F6]`) + badge versi + tombol `+` quick task.
  2. **Quick Command Bar Trigger (`⌘K`)**: `bg-[#111318] hover:bg-[#171920] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-xs text-[#8A8F9E]`.
  3. **Workspace Navigation (Icon + Label Teks Jelas + Counter Badge)**:
     - `Command Center` (`/`)
     - `My Tasks & Queue` (`/tasks`)
     - `Weekly Sprints` (`/sprints`)
     - `Roadmap` (`/roadmap`)
     - `GitHub Repositories` (`/repos`)
     - `System Telemetry` (`/telemetry`)
  4. **Active Projects Direct List**: Shortcut langsung ke proyek aktif dengan dot warna status dan persentase progres (`font-mono text-xs`).
  5. **Bottom Telemetry Pod**: Indikator koneksi `Supabase + GitHub` + kuota API rate limit (`4,892/5k`) + progress bar tipis.
- **Active Nav Item**: `bg-white/[0.07] text-[#F3F4F6] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]` dengan ikon berwarna `--obs-accent-light` (`#818CF8`) dan dot indikator di kanan.
- **Inactive Nav Item**: `text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04]`.

### 4.3 Unified Header Bar (`components/HeaderBar.vue`)
- **Surface**: Berada di bagian atas di dalam `.obs-workspace` (`h-13 px-5 border-b border-white/[0.06] bg-[#0B0C10]/60 backdrop-blur-md flex items-center justify-between`).
- **Left**: Breadcrumb bersih (`Workspace / Command Center`) + pill sprint aktif (`Sprint W42 · 4d left`).
- **Right**:
  - Live clock & blocker status pill (`WIB 12:48 | 0 Blockers` dalam `bg-white/[0.03] border border-white/[0.06] font-mono text-xs`).
  - **Primary Crisp CTA Button**: `bg-[#F3F4F6] hover:bg-white text-[#07080A] text-xs font-medium px-3 py-1.5 rounded-lg` (`+ New Deliverable`).

### 4.4 Dashboard — Asymmetric Bento Command Center (`/`)

Dashboard dirancang menggunakan **Specular 1px Cards (`.obs-card`)** dalam 2 baris utama:

#### 4.4.1 Baris 1: 4 Specular KPI Cards (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5`)
1. **In-Flight Tasks**: Angka utama `font-mono text-2xl font-semibold text-[#F3F4F6]` + delta badge emerald + jumlah high priority.
2. **Sprint Velocity**: Persentase penyelesaian minggu berjalan (`78%`) + rasio deployed (`11 of 14 deployed`).
3. **CI/CD Workflows**: Persentase kesehatan workflow GitHub Actions + jumlah run.
4. **Open PRs & Issues**: Jumlah PR/Issue terbuka lintas repositori.

#### 4.4.2 Baris 2: Asymmetric Bento Grid (`12 Columns`: `8 Left` + `4 Right`)
- **Kolom Kiri (`xl:col-span-8 space-y-4`):**
  - **Execution Radar (`PriorityTasksRadar.vue`)**:
    - Header dengan segmented filter tabs (`All Focus`, `High / Critical`, `In Flight`).
    - Baris task bersih (`divide-y divide-white/[0.05]`): priority dot (`rose-500` untuk critical, `amber-400` untuk high, `emerald-400` untuk deployed), monospace ID (`NX-142` / `ENG-104`), judul `font-sans text-sm font-medium text-[#F3F4F6]`, badge proyek, pill status, dan tanggal tenggat.
  - **Global Commit Stream (`GlobalCommitsTable.vue`)**:
    - Daftar commit terbaru lintas repo dengan SHA pill (`font-mono text-xs bg-white/[0.05] border border-white/[0.07]`), pesan commit, nama repo, dan waktu relatif.
    - Klik baris untuk membuka **Inline Diff Preview** (`bg-[#07080A] border-t border-white/[0.05] font-mono text-xs`).
- **Kolom Kanan (`xl:col-span-4 space-y-4`):**
  - **Quick Task Inspector Pod / Task Drawer**: Menampilkan detail cepat task yang diklik (`border-l-2` dengan warna `--obs-accent`).
  - **Weekly Sprint Focus (`WeeklyFocusSnapshot.vue`)**: Menampilkan objektif sprint, progress bar `--obs-accent`, dan jumlah task *Completed vs Remaining*.
  - **Managed Projects Hub (`CompactProjectsHub.vue`)**: Kartu ringkas proyek aktif dengan status deployment dan persentase progres.

### 4.5 Task Card (`components/TaskCard.vue`)
```
┌─────────────────────────────────┐
│  #ENG-104                      │  ← font-mono text-xs text-[#8A8F9E]
│  Implement OAuth flow          │  ← font-sans text-[#F3F4F6] font-medium text-sm
│  ● HIGH        vue  nuxt      │  ← priority pill + neutral slate tech tags
└─────────────────────────────────┘
Surface: .obs-card (bg-[#111318] border-white/[0.07] + specular 1px top highlight)
Hover:   hover:border-indigo-500/40 hover:bg-[#171920]
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
