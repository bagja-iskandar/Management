# ROADMAP.md — Nexura Evolution Roadmap

_Last updated: 2026-09-17._

---

## Prinsip Evolusi

1. **Function over Form** — setiap perubahan visual harus diikuti fungsi nyata
2. **Bertahap & Mandiri** — setiap phase dapat di-test dan di-review independen
3. **Real Data First** — hapus semua mock, dummy, dan hardcoded fallback
4. **Pluggable Architecture** — external services (Supabase, Vercel) dirancang sebagai plug-in yang tidak memblokir phase lain
5. **Evidence-based** — setiap keputusan didasarkan pada kebutuhan aktual pengelolaan project di GitHub

---

## Phase 0–5 — Historical (✅ Completed)

> Phase 0–5 mencakup: Baseline Documentation, Critical Fixes & Cleanup, Code Quality & TypeScript, Core Accessibility, Stitch Design System (Polymorphism Dark Glass), dan UI Implementation. Semua telah selesai dan terverifikasi. Detail lengkap tersedia di Git history.

| Phase | Nama | Status |
|-------|------|--------|
| 0 | Baseline Documentation | ✅ Completed |
| 1 | Critical Fixes & Cleanup | ✅ Completed |
| 2 | Code Quality, TypeScript & Server Optimization | ✅ Completed |
| 3 | Core Accessibility & Foundation UX Fixes | ✅ Completed |
| 4 | UI/UX Design System & Exploration (Stitch) | ✅ Completed |
| 5 | UI Implementation & UX Refinement | ✅ Completed |

---

## Phase 6 — Design System Overhaul: Charcoal-Ochre + Tailwind CSS
**Status**: 📋 Ready for Implementation
**Tujuan**: Migrasi total visual layer dari CSS Custom Properties (Polymorphism Dark Glass) ke **Tailwind CSS utility-first** dengan palet Charcoal-Ochre Engineering Console.

### 6a. 📋 Install & Configure Tailwind CSS
- Install `tailwindcss`, `@nuxtjs/tailwindcss`, `postcss`, `autoprefixer` sebagai devDependencies.
- Buat `tailwind.config.ts` dengan custom color tokens:

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `canvas` | `#0B0A09` | Body/page background |
| `surface` | `#141210` | Sidebar, cards, panels |
| `surface-elevated` | `#1C1A17` | Hover states, elevated cards |
| `bone` | `#F5F2EB` | Primary text (bone-ivory) |
| `muted` | `#756F68` | Secondary/dimmed text |
| `ochre` | `#C98A4B` | Accent, focus rings, active states |
| `ochre-dim` | `#8B6535` | Muted accent, borders |

- Font families: `font-mono` (JetBrains Mono / Fira Code), `font-sans` (Inter).
- Custom utilities: `glow-ochre` box-shadow, `pulse-dot` keyframe animation.

### 6b. 📋 Update Nuxt Config
- Tambah module `@nuxtjs/tailwindcss` di `nuxt.config.ts`.
- Tambah blok `runtimeConfig` untuk environment variables:
  ```
  githubToken, githubUsername (default: 'bagja-iskandar'),
  supabaseUrl, supabaseKey (prepared, kosong),
  vercelToken (prepared, kosong)
  ```

### 6c. 📋 Rewrite Global Stylesheet
- Rewrite `assets/css/main.css`: strip ~700 baris CSS variables, ganti dengan `@tailwind` directives + minimal `@layer base` dan `@layer components`.
- Import Google Inter + JetBrains Mono fonts.

### 6d. 📋 Hapus File CSS Scoped
- Hapus `assets/css/dashboard.css` — styling pindah ke Tailwind utility classes di template.
- Hapus `assets/css/navbar.css` — styling pindah ke Tailwind utility classes di template.

---

## Phase 7 — Sidebar Compact + Telemetry Header Bar
**Status**: 📋 Ready for Implementation
**Tujuan**: Redesign layout shell — sidebar 5 navigasi compact + telemetry header minimalis.

### 7a. 📋 Rewrite Layout Shell (`app/app.vue`)
- Struktur baru: flex container `bg-[#0B0A09]` dengan `<Sidebar>` + vertical stack `<HeaderBar>` + `<main>`.

### 7b. 📋 Sidebar Compact (`components/Sidebar.vue`)
- Ganti `navbar.vue` menjadi `Sidebar.vue`.
- Surface: `bg-[#141210]` dengan `border-r border-white/[0.06]` hairline.
- Brand: Monogram icon + "NEXURA" text, `font-mono text-xs tracking-[0.2em]`.
- **5 Navigation Items** (icon + label, compact):
  1. `Dashboard` → `/`
  2. `Active Sprints` → `/sprints`
  3. `Architecture Roadmap` → `/roadmap`
  4. `Code Repos` → `/repos`
  5. `System Telemetry` → `/telemetry`
- Active state: `bg-[#C98A4B]/10 text-[#C98A4B] border-l-2 border-[#C98A4B]`.
- Footer: System status tile (`● Online • KV Storage`) menggantikan user profile card.
- Mobile: Slide-out drawer overlay.

### 7c. 📋 Telemetry Header Bar (`components/HeaderBar.vue`)
- Horizontal bar: `bg-[#141210]/80 backdrop-blur-xl border-b border-white/[0.06]`.
- Live clock `font-mono text-[#756F68]` — dual UTC / WIB display.
- Active branch pill: `MODALITY://DEV` — `font-mono text-xs bg-[#C98A4B]/15 text-[#C98A4B]`.
- Sprint Velocity KPI micro-badge — `font-mono text-[#F5F2EB]`.
- Search input: `focus:ring-1 focus:ring-[#C98A4B]` ochre focus ring.

---

## Phase 8 — Dashboard Command Center + Kanban + Data Layer
**Status**: 📋 Ready for Implementation
**Tujuan**: Rewrite dashboard menjadi engineering command center dengan Kanban board dan skema data yang diperluas.

### 8a. 📋 Perluas Skema TypeScript
- **Task**: Tambah `taskId` (sequential `ENG-xxx`), `projectSlug`, `description`, `priority`, `techTags[]`, `dueDate`, `sprintId`. Ubah status dari `'todo'|'proses'|'selesai'` → `'in_queue'|'running_sprint'|'deployed'|'blocked'`.
- **Project**: Tambah `id`, `status` enum, `priority`, `githubRepo`, `deployUrl`, `techStack[]`, `startDate`, `dueDate`. Standarisasi `createdAt`/`updatedAt` required.
- **Sprint** (baru): `id`, `name`, `status`, `startDate`, `endDate`, `taskIds[]`, `velocity`.

### 8b. 📋 Update Server API & Seed
- Update `seed.ts`: data sesuai schema baru, link ke repo GitHub asli.
- Update `stats.get.ts`: hapus semua `Math.max(...)` mock, hitung metrik riil.
- Update `tasks.post.ts`: auto-generate `taskId` sequential, accept extended fields.
- Update `task/[id].put.ts`: support semua extended fields.
- Buat: `projects.post.ts`, `projects/[slug].put.ts`, `projects/[slug].delete.ts` (full CRUD projects).
- Buat: `sprints.get.ts`, `sprints.post.ts` (sprint management).

### 8c. 📋 Rewrite Dashboard Component
- Hapus: "Welcome back, Bagja" banner, SVG mock curves, mock donut chart.
- Telemetry Row: 3 micro stat cards (Active Tasks, Blockers, Velocity) — `font-mono text-3xl text-[#F5F2EB]` + ochre delta tags.
- Inline `<KanbanBoard />` component.

### 8d. 📋 Komponen Kanban Board (`KanbanBoard.vue`)
- 3 kolom: `IN_QUEUE` | `RUNNING_SPRINT` | `DEPLOYED`.
- Column headers: `font-mono text-xs tracking-wider text-[#756F68]` + count badge.
- Drop zones: HTML5 Drag API atau `vuedraggable`.
- Status transfer via PATCH API on drop.
- Quick-add button per column.

### 8e. 📋 Komponen Task Card (`TaskCard.vue`)
- Monospace Task ID: `#ENG-104` — `font-mono text-xs text-[#756F68]`.
- Title: `text-[#F5F2EB] font-medium text-sm`.
- Priority Pill: colored dot (pulsing for critical) + label.
- Tech Tags: `font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B]`.
- Hover: `hover:border-[#C98A4B] hover:shadow-[0_0_12px_rgba(201,138,75,0.15)]` glow.

### 8f. 📋 Redesign Komponen Existing
- `StatCard.vue`: bold `font-mono text-3xl` number, ochre delta, surface `bg-[#141210]`.
- `AddTaskModal.vue`: update fields sesuai schema baru.
- `AddProjectModal.vue`: update fields, tambah GitHub repo picker.

---

## Phase 9 — GitHub Integration (Real API)
**Status**: 📋 Ready for Implementation
**Tujuan**: Koneksi langsung ke ekosistem GitHub untuk monitoring repos, commits, branches secara real-time.
**Prerequisite**: `GITHUB_TOKEN` di `.env` (username: `bagja-iskandar`).

### 9a. 📋 Environment & Utility
- Buat `.env.example` dengan semua env vars (GitHub ready, Supabase/Vercel prepared kosong).
- Buat `server/utils/github.ts`: GitHub API client factory, rate limit aware, in-memory cache (TTL 5 menit via Nitro `cachedFunction`).

### 9b. 📋 GitHub API Endpoints
- `GET /api/github/repos` — fetch user repos (`sort=pushed`, cached 5 min).
- `GET /api/github/commits?repo=owner/repo&limit=20` — recent commits per repo.
- `GET /api/github/branches?repo=owner/repo` — branches list per repo.

### 9c. 📋 Composable & Pages
- `composables/useGitHub.ts`: `useGitHubRepos()`, `useGitHubCommits(repo)`, `useGitHubBranches(repo)`.
- `app/pages/repos.vue`: Code Repos browser — list repos, search, filter by language, expand untuk commits/branches.
- Update `app/pages/projects/[slug].vue`: tab "GitHub" untuk commits & branches dari linked repo.

---

## Phase 10 — Supabase Migration (🔜 When Ready)
**Status**: ⏳ Queued — Menunggu Supabase project credentials
**Tujuan**: Migrasi persistent storage dari Nitro Unstorage KV → Supabase PostgreSQL.

### 10a. ⏳ Supabase Client & Storage Adapter
- Install `@supabase/supabase-js`.
- Buat `server/utils/supabase.ts`: server-side client factory.
- Buat `server/utils/storage-supabase.ts`: implements `StorageAdapter` interface backed by PostgreSQL.
- Toggle config: `storage: 'supabase'` vs `'kv'` — drop-in swap.

### 10b. ⏳ SQL Migration
- Buat `supabase/migrations/001_initial.sql`: tables `projects`, `tasks`, `sprints`, `deployments`.
- Indexes, RLS policies.

### 10c. ⏳ Data Migration Script
- Script one-time untuk migrate existing `.data/kv/` data ke Supabase tables.

---

## Phase 11 — Vercel Integration (🔜 When Ready)
**Status**: ⏳ Queued — Menunggu Vercel Access Token
**Tujuan**: Menampilkan deployment status, build logs, dan project health dari Vercel.

### 11a. ⏳ Vercel API Endpoints
- `GET /api/vercel/deployments` — fetch recent deployments.
- `GET /api/vercel/projects` — list Vercel projects untuk linking.
- `composables/useVercel.ts`.

### 11b. ⏳ New Pages & Integration Points
- `app/pages/sprints.vue`: Sprint management (create, assign tasks, track velocity).
- `app/pages/roadmap.vue`: Architecture roadmap — visual timeline, project milestones.
- `app/pages/telemetry.vue`: System health — GitHub API rate limits, storage usage, Supabase stats, Vercel bandwidth.
- Update project detail dengan Vercel deployment tab.

---

## Phase 12 — Production Hardening & Deployment
**Status**: ⏳ Queued

### 12a. ⏳ Lightweight Auth
- Simple env-based password protection untuk akses publik.
- Upgrade ke Supabase Auth (GitHub OAuth) saat Supabase ready.

### 12b. ⏳ Data Backup & Export/Import
- Fitur export database JSON / SQL dump.
- Import untuk restore data.

### 12c. ⏳ Production Build & Deploy
- Konfigurasi deploy ke Vercel (frontend).
- Dockerfile sebagai alternatif (VPS/Docker).
- CI/CD pipeline via GitHub Actions.
