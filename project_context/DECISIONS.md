# DECISIONS.md — Architectural Decision Records

> **Status:** RATIFIED & ACTIVE  
> **Last Updated:** 29 Oktober 2026  
> **Lead Architect & Orchestrator:** Bagja Iskandar & Antigravity Head Agent  

---

## Historical Decisions (Phase 0–5)

### [2026-08-14] PENDING-01 — Bahasa UI → English
**Keputusan**: Standardisasi UI ke Bahasa Inggris. Status backend values tetap English (`in_queue`, `running_sprint`, `deployed`, `blocked`).

### [2026-08-14] PENDING-02 — Ghost Files → Hapus
**Keputusan**: Hapus 3 file 0-byte di `pages/` root setelah verifikasi routing.

### [2026-08-14] PENDING-03 — Lokasi `components/` & `composables/`
**Keputusan**: Tetap di root (bukan `app/`). Nuxt auto-import dikonfigurasi via `nuxt.config.ts`.

### [2026-08-14] PENDING-04 — Pinia
**Keputusan**: Biarkan terdaftar di dependencies, digantikan oleh Nuxt `useState` di `useWorkspaceStore.ts`.

### [2026-08-14] Phase 1a–1f — Critical Fixes
**Keputusan**: Hapus ghost files, fix reaktivitas props, konsolidasi types, tambah error handling, bersihkan fragile CSS selectors, hapus file orphan.

### [2026-08-14] Phase 2a–2f — Code Quality
**Keputusan**: Fix CSS path alias, tambah generic types, standarisasi auto-imports, hapus dead code, optimasi query, bersihkan CSS duplikasi.

### [2026-08-14] Phase 3a–3f — Accessibility
**Keputusan**: Focus trap, ARIA improvements, sr-only text, perbaiki navigasi projects, standardisasi bahasa English.

### [2026-08-15] Phase 4 — Polymorphism Design System (Stitch)
**Status**: ⚠️ **Superseded oleh Phase 6 & ADR-009** — digantikan Precision Dark Obsidian.

### [2026-08-15] Phase 5 — UI Implementation
**Status**: ⚠️ **Superseded oleh ADR-009** — layout dan design system dirombak ke Precision Dark Obsidian Bento.

---

## Architectural Decision Records (ADRs)

### [2026-09-17] ADR-001 — Design System Migration: Polymorphism → Charcoal-Ochre
**Status**: ⚠️ **Superseded oleh ADR-009** — digantikan Precision Dark Obsidian.

### [2026-09-17] ADR-002 — Sidebar Redesign: 3 items → 5 items compact
**Status**: 🔄 **Diperbarui oleh ADR-009** — digantikan Unified Left Rail (`w-56`) dengan label teks eksplisit.

### [2026-09-17] ADR-003 — Task Status: Indonesian → English + New Columns
**Diputuskan oleh**: Owner (Bagja Iskandar)
**Keputusan**: Ubah status task dari `'todo' | 'proses' | 'selesai'` menjadi `'in_queue' | 'running_sprint' | 'deployed' | 'blocked'`.
**Dampak**: Schema Zod, migration Supabase, dan Kanban pipeline diselaraskan.

### [2026-09-17] ADR-004 — Sequential Task IDs (ENG-xxx)
**Diputuskan oleh**: Owner
**Keputusan**: Setiap deliverable mendapat sequential monospace ID (`#ENG-001`, `#ENG-002`, ...). Auto-generated pada `tasks.post.ts`.
**Alasan**: Memudahkan referensi cepat dalam commit messages, PRs, dan percakapan.

### [2026-09-17] ADR-005 — GitHub Integration via Server-Side Proxy
**Diputuskan oleh**: Owner
**Keputusan**: Integrasi GitHub melalui server-side Nitro API proxy (`/api/github/*`), bukan client-side direct call.
**Alasan**: Melindungi PAT GitHub agar tidak bocor ke browser, serta menerapkan caching TTL 5 menit untuk menjaga kuota rate limit.

### [2026-09-17] ADR-006 — Pluggable Storage: KV Now, Supabase Later
**Status**: 🔄 **Disempurnakan oleh ADR-012** — Supabase PostgreSQL menjadi persistensi utama produksi; Nitro KV dipertahankan strictly untuk offline development lokal.

### [2026-09-17] ADR-007 — Vercel as Deploy Target
**Diputuskan oleh**: Owner
**Keputusan**: Build output Nuxt 4 dikonfigurasi untuk kompatibilitas penuh dengan preset serverless Vercel (`.output/`).

### [2026-09-17] ADR-008 — Telemetry Header Bar
**Status**: 🔄 **Diperbarui oleh ADR-009** — digabungkan menjadi Unified Top Header Bar di dalam `.obs-workspace`.

### [2026-10-22] ADR-009 — UI/UX Overhaul: Precision Dark Obsidian (Linear / Raycast Inset Architecture)
**Diputuskan oleh**: Owner & AI Architect
**Keputusan**: Menetapkan palet Void `#07080A`, Canvas `#0B0C10`, Specular Surface `#111318`, Crisp Alabaster `#F3F4F6`, Cool Indigo `#6366F1`, dan Inset Workspace (`.obs-workspace`) dengan Specular 1px card lighting (`.obs-card`).

### [2026-10-27] ADR-010 — Mandatory Multi-Agent Governance & Single Execution Owner
**Diputuskan oleh**: Owner & Head Agent
**Keputusan**: Memberlakukan tata kelola mutlak multi-agent:
1. Head Agent bertindak sebagai Technical Architect, Lead Orchestrator, dan Penjaga Kualitas — **dilarang menulis kode implementasi secara langsung**.
2. Penerapan prinsip *Single Execution Owner*: setiap file hanya boleh dimodifikasi oleh satu eksekutor spesialis yang berwenang pada satu waktu.
3. Seluruh pekerjaan wajib melewati Siklus 5 Tahap Gate (Investigasi → Diskusi Tim → Rencana Implementasi → Review Silang → Persetujuan Eksplisit Project Owner).
**Dampak**: Menghilangkan konflik merge (*code clobbering*) dan menjamin integritas rekayasa sistem.

### [2026-10-27] ADR-011 — Unified Singleton Workspace Store & Single Coordinated Hydration
**Diputuskan oleh**: Owner & Head Agent
**Keputusan**: Mengganti 25 kunci cache Nuxt `useLazyAsyncData` yang terfragmentasi dengan Singleton Store [`composables/useWorkspaceStore.ts`](../composables/useWorkspaceStore.ts) berbasis Nuxt `useState`.
**Alasan**: Booting aplikasi sebelumnya memicu 11 request HTTP bersamaan yang sering mengalami desinkronisasi. Store terpadu mengeksekusi paralel boot fetch tunggal dan menyediakan mutasi *Optimistic UI* 0ms dengan auto-rollback.

### [2026-10-27] ADR-012 — Supabase PostgreSQL RLS Lockdown & Dedicated service_role Access
**Diputuskan oleh**: Owner & Security Specialist
**Keputusan**: 
1. Mencabut hak peran `anon` dari seluruh tabel database Supabase (`REVOKE ALL FROM anon`).
2. Mengunci akses PostgREST eksklusif untuk peran `service_role` melalui backend Nitro.
3. Meniadakan failover mutasi diam-diam ke Nitro KV (*Zero Silent Data Loss Policy*).
**Alasan**: Mencegah kebocoran data di PostgREST publik dan split-brain state di lingkungan serverless Vercel.

### [2026-10-28] ADR-013 — 5-Column Engineering Kanban Pipeline & Markdown Checklist Sync
**Diputuskan oleh**: Owner & Workspaces Specialist
**Keputusan**: Memperluas pipeline Kanban dari 3 kolom menjadi 5 kolom kanonikal: `idea` → `in_queue` → `running_sprint` → `blocked` → `deployed`. Dilengkapi panel Active Focus yang mem-parse checklist Markdown `- [ ]` / `- [x]` dan menyinkronkan statusnya secara reaktif ke database.

### [2026-10-28] ADR-014 — Sprint Relationship SSOT via `tasks.sprint_id`
**Diputuskan oleh**: Owner & Backend Specialist
**Keputusan**: Menjadikan kolom `tasks.sprint_id` sebagai satu-satunya *Single Source of Truth* untuk relasi deliverable ke siklus sprint. Menghapus penulisan paralel ganda ke array `sprints.task_ids[]`.
**Alasan**: Mencegah fragmentasi relasi relasional dan memastikan referensi sprint selalu deterministik.

### [2026-10-29] ADR-015 — Zero-Dependency Native Node.js Test Runner & PostgREST DSL Parameterization
**Diputuskan oleh**: Owner, QA Specialist & Security Specialist
**Keputusan**:
1. Menyelenggarakan pengujian master menggunakan Node.js Native Test Runner (`node:test`) tanpa dependensi framework runtime berat.
2. Memparameterisasi query PostgREST DSL di `SupabaseTaskRepository`: memisahkan pencarian `ENG-xxx` via `.eq('task_id', val)` dan UUID via `.eq('id', val)`, menutup celah manipulasi query grammar.
**Hasil**: 244 test lolos 100% dalam 2.69s dengan coverage 83.05%.

### [2026-10-29] ADR-016 — Pruning of Redundant `focus.vue` & Orphan Telemetry `visit.ts`
**Diputuskan oleh**: Owner & QA Specialist
**Keputusan**: Menghapus permanen [`app/pages/focus.vue`](../app/pages/focus.vue) (fungsinya diserap penuh oleh Active Focus di `/tasks`) dan middleware [`server/middleware/visit.ts`](../server/middleware/visit.ts) (I/O orphan tanpa konsumen), serta membersihkan sisa referensi navigasi di `Sidebar.vue` dan `HeaderBar.vue`.
**Alasan**: Mengurangi bundle overhead, menghemat I/O serverless, dan mengunci sistem pada 8 rute kanonikal bersih.
