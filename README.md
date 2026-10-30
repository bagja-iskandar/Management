# Nexura — Personal Engineering Command Center

> **Status:** Production-Ready (Hardened Nuxt 4 Architecture)  
> **Design System:** Precision Dark Obsidian Bento UI (Linear / Raycast Inset Architecture)  
> **Test Suite:** 244 / 244 Passing (100% Green, 0 Failures, 83.05% Coverage)  
> **Documentation:** [DOCUMENTATION.md](./DOCUMENTATION.md) | [Architecture](./project_context/ARCHITECTURE.md) | [Master Plan](./docs/master-remediation-plan.md)

---

## 1. Overview

**Nexura** adalah *Personal Engineering Command Center* berbasis **Nuxt 4** yang dirancang khusus untuk seorang *Solo Software Engineer* untuk memantau dan mengelola seluruh siklus hidup rekayasa perangkat lunak dalam satu layar tunggal:
- **Dashboard Command Center (`/`)**: Asymmetric Bento 8:4 dengan metrik jujur, antrean tugas in-flight, dan live GitHub commit stream.
- **Tasks & Kanban Workspace (`/tasks`)**: Pipeline Kanban 5-kolom (`idea` → `in_queue` → `running_sprint` → `blocked` → `deployed`), companion panel Active Focus dengan checklist Markdown reaktif (`- [ ]` / `- [x]`), dan slide-over Idea Scratchpad.
- **Projects Hub & Cockpit (`/projects` & `/projects/:slug`)**: Manajemen direktori proyek, telemetry kesehatan repositori, DevOps tabs (commits, PRs, workflows), kalkulasi progres matematis murni, dan catatan terisolasi per proyek.
- **Weekly Sprints (`/sprints`)**: Siklus iterasi mingguan kalender (Senin–Minggu) dengan Single Source of Truth (`tasks.sprint_id`).
- **Release Phase Roadmap (`/roadmap`)**: Peta jalan rilis perangkat lunak berbasis versi (`Backlog` → `MVP / v1.0` → `v1.1` → `v2.0` → `Released`).
- **Repositories Catalog (`/repos`)**: Katalog repositori GitHub dengan integrasi 1-klik *Import as Managed Project* dan *safe detach*.
- **Telemetry & DevOps Health (`/telemetry`)**: Pengawasan latensi live Supabase, kuota REST API GitHub, runtime environment detector, dan 1-klik full JSON workspace backup.
- **Global OmniSearch (`⌘K`)**: Mesin pencarian fuzzy lintas entitas dengan deep-linking instan ke global `<TaskDrawer />`.

---

## 2. Tech Stack

- **Framework:** [Nuxt 4](https://nuxt.com/) (`^4.1.2`) + Vue 3.5 + TypeScript Strict Mode + Vite
- **Styling & UI:** Tailwind CSS dengan token *Precision Dark Obsidian* (Void `#07080A`, Canvas `#0B0C10`, Surface `#111318`)
- **Serverless Engine:** Nitro Server Engine dengan format handler terpusat [`withApiHandler`](./server/utils/handler.ts)
- **Database & Storage:** [Supabase PostgreSQL](https://supabase.com/) dengan Row Level Security (RLS) terkunci penuh ke `service_role` + Nitro KV fallback untuk pengembangan lokal offline
- **DevOps Integration:** GitHub REST API v3 (Octokit) dengan server-side caching dan allowlist keamanan
- **Testing Framework:** Node.js Native Test Runner (`node:test`) berkecepatan tinggi (< 3 detik, zero runtime dependency)

---

## 3. Quick Start

### Prerequisites
- Node.js `20.x` atau lebih baru
- NPM `10.x` atau lebih baru
- Akun GitHub (Personal Access Token)
- Proyek Supabase PostgreSQL (opsional untuk offline development)

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/bagja-iskandar/Management.git
cd Management

# 2. Install dependencies
npm install

# 3. Setup environment configuration
cp .env.example .env
# Isi kredensial di .env (lihat bagian Environment Variables)

# 4. Start local development server (Hot Module Replacement)
npm run dev
# Buka http://localhost:3000 di browser
```

---

## 4. Quality Gate & Scripts

Proyek ini dilengkapi dengan Quality Gate ketat yang terintegrasi pada pipeline CI (`.github/workflows/ci.yml`):

```bash
# Menjalankan Master Unit Test Suite (244 tests)
npm test

# Menjalankan Test Suite dengan laporan Coverage
npm run test:coverage

# Static TypeScript Typecheck
npm run typecheck

# Membangun bundle produksi (Nitro / Vercel Preset)
npm run build

# Menjalankan preview server lokal produksi
npm run preview
```

### Hasil Verifikasi Kualitas Terkini
- **Unit Tests:** `244 passed / 244 total` across 18 test suites (`tests/unit/*.spec.mjs`) dalam **2.69 detik**.
- **Coverage:** **83.05%** Lines, **79.30%** Branches, **81.58%** Functions.
- **Typecheck:** `vue-tsc --noEmit` **0 Diagnostic Errors** (Clean exit code 0).
- **Production Build:** Bundle `.output/` siap rilis (Client: 2,003 modul, Server: 211 modul).

---

## 5. Environment Variables (`.env`)

```env
# GitHub REST API v3 Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=bagja-iskandar

# Supabase PostgreSQL Configuration
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOi...              # Anon / Publishable Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Wajib untuk mutasi server backend

# Nexura Server Security Gate
NEXURA_ACCESS_KEY=your_secure_random_hex_key_here

# Runtime Environment
NODE_ENV=development
```

---

## 6. Design Tokens (Precision Dark Obsidian)

| Token | Hex Code | Penggunaan & Semantik Visual |
|---|---|---|
| **Void** | `#07080A` | Outer shell, base container, dan rel navigasi kiri |
| **Canvas** | `#0B0C10` | Inset workspace background (`.obs-workspace`) |
| **Surface** | `#111318` | Kartu specular 1px top-highlight (`.obs-card`) |
| **Elevated** | `#171920` | Dropdowns, dialog popover, tab aktif |
| **Foreground** | `#F3F4F6` | Teks utama (*Crisp Alabaster*) dan tombol CTA primer |
| **Muted** | `#8A8F9E` | Teks sekunder, metadata (*Cool Slate*) |
| **Dim** | `#565B68` | Placeholder teks, border sekunder |
| **Accent** | `#6366F1` / `#818CF8` | Aksen Cool Indigo, focus rings, status aktif |

---

## 7. Rute Kanonikal Sistem (8 Rute Aktif)

1. [`/`](./app/pages/index.vue) — Bento Executive Dashboard & KPI Metrics
2. [`/tasks`](./app/pages/tasks.vue) — 5-Column Kanban Board & Multi-Dimension Filtering
3. [`/projects`](./app/pages/projects/index.vue) — Projects Hub & Progress Telemetry
4. [`/projects/:slug`](./app/pages/projects/[slug].vue) — Deep Project Workspace & DevOps Tabs
5. [`/sprints`](./app/pages/sprints.vue) — Weekly Sprint Management & Active Focus Board
6. [`/roadmap`](./app/pages/roadmap.vue) — Strategic Release Phase Milestone Timeline
7. [`/repos`](./app/pages/repos.vue) — GitHub Repositories Catalog & One-Click Importer
8. [`/telemetry`](./app/pages/telemetry.vue) — DevOps Observability & System Health Monitor

---

## 8. License

Private Proprietary Software — © 2026 Bagja Iskandar. All Rights Reserved.
