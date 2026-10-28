# PROJECT.md — Identitas, Tujuan, Scope, dan Target Sistem Nexura

_Last updated: 2026-10-22. Evolved into Precision Dark Obsidian Engineering Command Center (Linear / Raycast Inset Architecture)._

---

## 1. Identitas Project

| Field | Value |
|---|---|
| **Nama** | Nexura (Personal Engineering Command Center) |
| **Tipe** | Solo-Developer Project Management & GitHub Integration Hub |
| **Package name** | `nexura` (dari `package.json`) |
| **Repo root** | `d:\Project_Center\REWORK\Management` (Git Remote: `bagja-iskandar/Management`) |
| **Status** | Phase 13 — Precision Dark Obsidian UI/UX Overhaul (Linear / Raycast Style) |

---

## 2. Visi & Tujuan Sistem

**Nexura** adalah personal engineering command center yang dirancang untuk mengelola **semua project GitHub, deployment, dan sprint kerja** di satu tempat — menggantikan workflow manual berpindah antar GitHub, Vercel dashboard, dan spreadsheet.

**Tujuan Inti:**
1. **Single Pane of Glass** — Satu dashboard untuk melihat status semua project, task, repos, dan deployments tanpa berpindah tab.
2. **Real GitHub Integration** — Terhubung langsung dengan akun GitHub `bagja-iskandar` untuk monitoring repos, commits, branches secara real-time.
3. **Zero-Ceremony Task Management** — Kanban board 3-kolom (`IN_QUEUE` → `RUNNING_SPRINT` → `DEPLOYED`) untuk mengelola task tanpa birokrasi Jira.
4. **Engineering Telemetry** — Real-time metrics: active tasks, blockers, sprint velocity — bukan angka mock/dummy.
5. **Pluggable Backend** — Storage layer yang bisa di-swap dari local KV ke Supabase PostgreSQL tanpa mengubah API contract.
6. **Deploy-Ready** — Target deploy ke Vercel untuk frontend, dengan optional VPS/Docker.

---

## 3. Scope Matriks

### A. Yang Diubah (Refactored)

| Aspek | Sebelum (Charcoal-Ochre) | Sesudah (Precision Dark Obsidian) |
|-------|--------------------------|-----------------------------------|
| Design System | Charcoal-Ochre Console (`#0B0A09` + `#C98A4B` + `#F5F2EB`) | Precision Dark Obsidian (`#07080A` void, `#0B0C10` canvas, `#111318` specular surface, `#F3F4F6` crisp alabaster, `#6366F1` cool indigo) |
| App Frame | Floating icon-only capsule dock + floating header pills + crosshair grid | Unified Left Rail (`w-56`) + Inset Obsidian Workspace (`.obs-workspace`, `rounded-2xl`) tanpa grid pengganggu |
| Styling | Tailwind CSS dengan banyak hardcoded hex (`#C98A4B`, `#F5F2EB`) | Semantic Dark Obsidian tokens + `.obs-card` Specular 1px top-highlight + preset tema (`indigo`, `amethyst`, `stealth`, `emerald`) |
| Navigasi | Icon-only floating capsule (tanpa label teks) | Unified Sidebar dengan label jelas, tombol `⌘K` Quick Action, counter badge, & *Pinned Active Projects* |
| Dashboard | 3 blok tumpuk vertikal rata | 4 Specular KPI Cards + Asymmetric Bento Grid (8 cols Execution Radar & Commit Stream + 4 cols Quick Inspector, Sprint Focus & Projects Hub) |
| Data | Mock stats (`Math.max(...)`) | Real calculations dari actual data |
| Task Status | `'todo' \| 'proses' \| 'selesai'` (ID) | `'in_queue' \| 'running_sprint' \| 'deployed' \| 'blocked'` (EN) |
| Task Schema | 6 fields | 12+ fields (taskId, projectSlug, priority, techTags, etc.) |
| Project Schema | 5 fields | 12+ fields (githubRepo, deployUrl, techStack, etc.) |
| Project CRUD | Read-only (GET) | Full CRUD (GET, POST, PUT, DELETE) |

### B. Yang Ditambahkan (New)

- **Sidebar.vue** — Compact 5-item navigation (replaces navbar.vue)
- **HeaderBar.vue** — Live clock (UTC/WIB), branch indicator, sprint KPI, search
- **KanbanBoard.vue** — 3-column task board with drag-and-drop
- **TaskCard.vue** — Rich task card with monospace ID, priority pill, tech tags
- **GitHub API Gateway** — `/api/github/repos`, `/commits`, `/branches`
- **Pages**: `/sprints`, `/roadmap`, `/repos`, `/telemetry`
- **Sprint model** — Sprint management (create, assign tasks, track velocity)
- **`.env.example`** — Environment variables template
- **`tailwind.config.ts`** — Tailwind configuration with custom tokens

### C. Yang Dikecualikan (Anti-Bloat)

- Tidak ada multi-user, team invitations, atau RBAC
- Tidak ada time-tracking atau billing
- Tidak ada form kaku atau mandatory fields
- Tidak ada CI/CD pipeline execution (hanya monitoring status)
- Tidak ada code editor / terminal in-browser

---

## 4. Tech Stack

| Layer | Teknologi | Versi | Status |
|---|---|---|---|
| **Framework** | Nuxt | ^4.0.3 | ✅ Active |
| **UI Runtime** | Vue | ^3.5.18 | ✅ Active |
| **Routing** | Vue Router (Nuxt Pages) | ^4.5.1 | ✅ Active |
| **Server/API** | Nitro (bundled with Nuxt) | — | ✅ Active |
| **Styling** | Tailwind CSS + @nuxtjs/tailwindcss | — | 📋 Phase 6 |
| **Font** | Inter (sans) + JetBrains Mono (mono) | — | 📋 Phase 6 |
| **Storage (current)** | Nitro Unstorage KV (`.data/kv/`) | — | ✅ Active |
| **Storage (planned)** | Supabase PostgreSQL | — | ⏳ Phase 10 |
| **External: GitHub** | GitHub REST API v3 | — | 📋 Phase 9 |
| **External: Vercel** | Vercel API | — | ⏳ Phase 11 |
| **State Management** | Pinia (registered, unused) | ^3.0.3 | ⏳ Evaluate |
| **Language** | TypeScript (via Nuxt) | — | ✅ Active |
| **Deploy Target** | Vercel (frontend) | — | ⏳ Phase 12 |

---

## 5. Integrasi External Services

### GitHub (Ready — Phase 9)
- **Username**: `bagja-iskandar`
- **Auth**: Personal Access Token via `.env`
- **Scope**: `repo`, `read:user`
- **Features**: List repos, fetch commits, fetch branches, link projects to repos
- **Caching**: In-memory TTL 5 menit (rate limit protection)

### Supabase (Planned — Phase 10)
- **Purpose**: PostgreSQL menggantikan local KV storage
- **Why**: Persistent data yang bisa diakses dari mana saja, termasuk setelah deploy
- **Migration**: Drop-in swap via `StorageAdapter` interface

### Vercel (Planned — Phase 11)
- **Purpose**: Deployment monitoring — status, build logs
- **Features**: List deployments, project health, build status per project
