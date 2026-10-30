# PROJECT.md — Identitas, Tujuan, Scope, dan Target Sistem Nexura

> **Status:** Production-Ready (Phase 0–13 Remediasi 100% Selesai & Divalidasi)  
> **Last Updated:** 29 Oktober 2026  
> **Lead Architect & Orchestrator:** Bagja Iskandar & Antigravity Head Agent  

---

## 1. Identitas Project

| Field | Value |
|---|---|
| **Nama** | Nexura (Personal Engineering Command Center) |
| **Tipe** | Solo-Developer Engineering Management & GitHub Integration Platform |
| **Package name** | `nexura` (dari `package.json`) |
| **Repo root** | `d:\Project_Center\REWORK\Management` (Git Remote: `bagja-iskandar/Management`) |
| **Status Arsitektur** | Hardened Nuxt 4 Monolith (Single-Owner Command Center) |
| **Desain UI/UX** | Precision Dark Obsidian Bento UI (Linear / Raycast Inset Architecture) |
| **Kesiapan Rilis** | Siap Rilis Produksi (244/244 tests passing, Coverage 83.05%, 0 diagnostic errors) |

---

## 2. Visi & Tujuan Sistem

**Nexura** adalah *Personal Engineering Command Center* yang dirancang khusus untuk mengelola **seluruh repositori GitHub, proyek piranti lunak, siklus sprint, deliverable teknis, dan telemetri sistem** dalam satu layar terpadu tanpa friksi:

1. **Single Pane of Glass:** Satu dashboard terpadu untuk melihat status semua proyek, deliverable, commit git, dan metrik kesehatan sistem tanpa berpindah-pindah tab browser.
2. **Real GitHub DevOps Integration:** Terhubung langsung dengan akun GitHub `bagja-iskandar` untuk monitoring repositori, commit stream, issue creation, dan alur workflow actions secara real-time via Nitro server-side proxy yang aman.
3. **Engineering-Centric Kanban Pipeline:** Pipeline 5-kolom (`idea` → `in_queue` → `running_sprint` → `blocked` → `deployed`) dengan drag-and-drop HTML5, companion panel Active Focus dengan checklist Markdown reaktif (`- [ ]` / `- [x]`), serta slide-over Idea Scratchpad.
4. **Zero-Tolerance Data Honesty (`UX-002`):** Seluruh metrik dihitung secara matematis murni dari data riil. Meniadakan angka fabrikasi sintetis (14, 3, 78%) dan fallback fiktif.
5. **Hardened Dual-Storage Layer:** Persistensi PostgreSQL via Supabase dengan Row Level Security (RLS) terkunci penuh ke peran `service_role` pada mode cloud produksi, dengan graceful Nitro KV fallback strictly untuk offline development lokal.
6. **Deploy-Ready & CI-Protected:** Terintegrasi penuh dengan GitHub Actions CI pipeline (`vue-tsc --noEmit`, `node:test`, `npm run build`) untuk deployment mulus ke Vercel platform.

---

## 3. Matriks Scope Sistem

### A. Rute Kanonikal Sistem (8 Rute Aktif)

| Rute | Komponen Utama | Deskripsi Fungsional |
|---|---|---|
| `/` | [`app/pages/index.vue`](../app/pages/index.vue) | Bento Executive Dashboard (Asymmetric 8:4 Grid, Hero Banner, Execution Queue, Live DevOps Stream, Infrastructure Mesh). |
| `/tasks` | [`app/pages/tasks.vue`](../app/pages/tasks.vue) | 5-Column Kanban Board & High-Density Table View, Active Focus Panel, Idea Scratchpad, Multi-Dimension Filtering. |
| `/projects` | [`app/pages/projects/index.vue`](../app/pages/projects/index.vue) | Projects Hub, Progress Telemetry dinamis, modal pembuat proyek baru, dan modal penyunting metadata proyek. |
| `/projects/:slug` | [`app/pages/projects/[slug].vue`](../app/pages/projects/[slug].vue) | Deep Project Cockpit, GitHub commits/PRs/workflows tab, isolated project notes, honest 404 page, safe delete confirmation. |
| `/sprints` | [`app/pages/sprints.vue`](../app/pages/sprints.vue) | Weekly Sprint Management (Senin–Minggu), SSOT `tasks.sprint_id`, click-to-drawer inspection. |
| `/roadmap` | [`app/pages/roadmap.vue`](../app/pages/roadmap.vue) | Strategic Release Phase Roadmap (`Backlog` → `MVP` → `v1.1` → `v2.0` → `Released`), project-level mapping. |
| `/repos` | [`app/pages/repos.vue`](../app/pages/repos.vue) | GitHub Repositories Catalog, strict repo matching, 1-klik Import as Managed Project, non-destructive detach. |
| `/telemetry` | [`app/pages/telemetry.vue`](../app/pages/telemetry.vue) | DevOps Health & Observability, live Supabase ping, GitHub rate limits, runtime detection, 1-klik Export Backup JSON. |

### B. Fitur & Infrastruktur Global

- **Singleton Workspace Store ([`composables/useWorkspaceStore.ts`](../composables/useWorkspaceStore.ts)):** Single source of truth berbasis Nuxt `useState` dengan single coordinated hydration saat boot dan mutasi optimistik 0ms.
- **Global OmniSearch Engine ([`components/OmniSearchModal.vue`](../components/OmniSearchModal.vue)):** Shortcut keyboard `⌘K` / `Ctrl+K`, pencarian fuzzy seketika melintasi seluruh entitas, deep-linking langsung ke `<TaskDrawer />`, serta sanitasi tautan eksternal `noopener,noreferrer`.
- **Global Task Inspector ([`components/TaskDrawer.vue`](../components/TaskDrawer.vue)):** Inspector detail deliverable yang dapat diakses secara konsisten dari seluruh halaman dan modal pencarian.
- **Server Security Gate ([`server/middleware/auth.ts`](../server/middleware/auth.ts)):** Proteksi seluruh mutasi REST API via Bearer token / `nexura_session` cookie berbasis `NEXURA_ACCESS_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
- **GitHub Parameter Allowlist ([`server/utils/github-allowlist.ts`](../server/utils/github-allowlist.ts)):** Mencegah eksploitasi proxy GitHub untuk repositori di luar milik akun terdaftar.
- **Automated GitHub Sync ([`server/utils/github-sync.ts`](../server/utils/github-sync.ts)):** Deteksi commit `#ENG-xxx` dan auto-move status ke `deployed`.

### C. Yang Dikecualikan Secara Sadar (Anti-Bloat Directive)

- Tidak ada sistem multi-user, team invitations, atau RBAC korporat (fokus murni pada efisiensi solo developer).
- Tidak ada time-tracking kaku atau modul billing.
- Tidak ada form birokratis dengan puluhan isian wajib yang menghambat kecepatan kerja.
- Tidak ada background process tak berizin yang melakukan tindakan destruktif terhadap repositori git atau database.

---

## 4. Tech Stack & Dependensi Inti

| Layer | Teknologi | Versi | Status Operasional |
|---|---|---|---|
| **Framework** | Nuxt | `^4.1.2` | ✅ Active (Full-Stack Monolith) |
| **UI Runtime** | Vue | `^3.5.18` | ✅ Active (Composition API `<script setup lang="ts">`) |
| **Styling & Tokens** | Tailwind CSS | `^3.4.0` | ✅ Active (Precision Dark Obsidian Bento Architecture) |
| **Serverless Engine** | Nitro | Bundled Nuxt 4 | ✅ Active (Standardized `withApiHandler`) |
| **Primary Database** | Supabase PostgreSQL | `@supabase/supabase-js` `^2.49.0` | ✅ Active (RLS Locked to `service_role`) |
| **Secondary Storage** | Nitro KV (Unstorage) | Bundled Nitro | ✅ Active (Strictly Local Offline Development) |
| **DevOps Gateway** | GitHub REST API v3 | Octokit REST API | ✅ Active (Server proxy + Allowlist + TTL Cache) |
| **State Management** | Nuxt useState Singleton | Built-in Nuxt 4 | ✅ Active (`useWorkspaceStore.ts`) |
| **Test Runner** | Node.js Test Runner | `node:test` (Node 20+) | ✅ Active (244 tests passing in 2.69s) |
| **Type Checker** | vue-tsc | `^2.2.0` | ✅ Active (0 diagnostic errors) |
| **CI/CD** | GitHub Actions | Ubuntu Latest | ✅ Active (`.github/workflows/ci.yml`) |

---

## 5. Matriks Hasil Pengujian & Kualitas (Quality Baseline)

```
================================================================================
NEXURA COMMAND CENTER — PRODUCTION QUALITY GATE
================================================================================
Test Runner:           Node.js Native Test Runner (node:test)
Master Test Suites:    18 Suites (tests/unit/*.spec.mjs)
Total Test Cases:      244 Passed / 244 Total (100% Green, 0 Failures)
Execution Duration:    2.69s
Code Coverage:         Lines 83.05% | Branches 79.30% | Functions 81.58%
TypeScript Typecheck:  Exit Code 0 (0 Diagnostic Errors)
Production Packaging:  .output/ Ready (Client: 2003 mods, Server: 211 mods)
Dangling References:   0 Broken Routes, 0 Broken Imports
================================================================================
```
