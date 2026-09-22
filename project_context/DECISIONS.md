# DECISIONS.md — Architectural Decision Records

_Last updated: 2026-09-17._

> File ini mencatat keputusan arsitektural dan engineering yang sudah disepakati.

---

## Historical Decisions (Phase 0–5)

> Keputusan Phase 0–5 telah dieksekusi dan diverifikasi. Ringkasan di bawah ini, detail lengkap di Git history.

### [2026-08-14] PENDING-01 — Bahasa UI → English
**Keputusan**: Standardisasi UI ke Bahasa Inggris. Status backend values tetap English (`in_queue`, `running_sprint`, `deployed`, `blocked`).

### [2026-08-14] PENDING-02 — Ghost Files → Hapus
**Keputusan**: Hapus 3 file 0-byte di `pages/` root setelah verifikasi routing.

### [2026-08-14] PENDING-03 — Lokasi `components/` & `composables/`
**Keputusan**: Tetap di root (bukan `app/`). Nuxt auto-import dikonfigurasi via `nuxt.config.ts`.

### [2026-08-14] PENDING-04 — Pinia
**Keputusan**: Biarkan terdaftar di dependencies, belum diimplementasikan. Evaluasi setelah Phase 8.

### [2026-08-14] Phase 1a–1f — Critical Fixes
**Keputusan**: Hapus ghost files, fix reaktivitas props, konsolidasi types, tambah error handling, bersihkan fragile CSS selectors, hapus file orphan.

### [2026-08-14] Phase 2a–2f — Code Quality
**Keputusan**: Fix CSS path alias, tambah generic types, standarisasi auto-imports, hapus dead code, optimasi query, bersihkan CSS duplikasi.

### [2026-08-14] Phase 3a–3f — Accessibility
**Keputusan**: Focus trap, ARIA improvements, sr-only text, perbaiki navigasi projects, standardisasi bahasa English.

### [2026-08-15] Phase 4 — Polymorphism Design System (Stitch)
**Keputusan**: Tetapkan estetika Polymorphism Dark Glass. Canvas `#0B0F19`, glass surfaces, Indigo/Cyan/Violet accents.
**Status**: ⚠️ **Superseded oleh Phase 6** — digantikan Charcoal-Ochre Console.

### [2026-08-15] Phase 5 — UI Implementation
**Keputusan**: Implementasi design Stitch 1-to-1. Left Sidebar 230px, 4 KPI cards, SVG curves, donut gauge, projects hub, tasks hub.
**Status**: ⚠️ **Akan di-rewrite Phase 6–8** — design system dan layout berubah total.

### [2026-08-15] Navigation Performance — useLazyAsyncData
**Keputusan**: Ganti `await useAsyncData` → `useLazyAsyncData` + `getCachedData` payload caching. Navigasi 0ms.
**Status**: ✅ **Tetap dipertahankan** — pattern ini berlanjut ke design baru.

---

## New Decisions (Phase 6+)

### [2026-09-17] ADR-001 — Design System Migration: Polymorphism → Charcoal-Ochre
**Diputuskan oleh**: Owner (Bagja Iskandar)
**Keputusan**: Migrasi total visual layer dari Polymorphism Dark Glass (Indigo `#6366F1`, Glass blur, CSS custom properties) ke **Charcoal-Ochre Engineering Console** (canvas `#0B0A09`, accent `#C98A4B`, Tailwind CSS utility classes).
**Alasan**: Design sebelumnya terlalu "decorative" (glass blur, neon glow, gradient mesh) untuk sebuah engineering command center. Charcoal-Ochre lebih fokus pada information density, terminal aesthetic, dan readability. Tailwind CSS menggantikan ~1400 LOC CSS custom properties untuk maintainability.
**Dampak**: Rewrite seluruh styling. Hapus `dashboard.css`, `navbar.css`. Rewrite `main.css`. Tambah `tailwind.config.ts`. Semua `.vue` templates updated.

### [2026-09-17] ADR-002 — Sidebar Redesign: 3 items → 5 items compact
**Diputuskan oleh**: Owner
**Keputusan**: Ganti sidebar 3-item (Dashboard, Projects, Tasks) + user profile card dengan sidebar 5-item compact (Dashboard, Active Sprints, Architecture Roadmap, Code Repos, System Telemetry) + system status tile.
**Alasan**: Nexura bukan lagi "dashboard saja" — melainkan full engineering command center yang perlu navigasi ke sprints, repos, dan system health. User profile card tidak berguna untuk solo developer.
**Dampak**: Rename `navbar.vue` → `Sidebar.vue`. Hapus profile card. Tambah 4 halaman baru (sprints, roadmap, repos, telemetry).

### [2026-09-17] ADR-003 — Task Status: Indonesian → English + New Columns
**Diputuskan oleh**: Owner
**Keputusan**: Ubah status task dari `'todo' | 'proses' | 'selesai'` menjadi `'in_queue' | 'running_sprint' | 'deployed' | 'blocked'`. Tambah kolom Kanban 3-lajur.
**Alasan**: Status baru mencerminkan engineering workflow nyata (queue → sprint execution → deployed). Status `'blocked'` ditambah untuk tracking blockers. Bahasa Inggris konsisten dengan seluruh codebase.
**Dampak**: Schema `Task` diubah. Seed data diubah. Kanban board 3 kolom. API validation diubah.

### [2026-09-17] ADR-004 — Sequential Task IDs (ENG-xxx)
**Diputuskan oleh**: Owner
**Keputusan**: Setiap task mendapat sequential monospace ID (`ENG-001`, `ENG-002`, ...) selain UUID. ID ini ditampilkan di UI sebagai `#ENG-104`.
**Alasan**: UUID tidak human-readable. Sequential ID memungkinkan referensi cepat dalam percakapan dan commit messages.
**Dampak**: Tambah field `taskId` di schema. Tambah KV key `task-seq` sebagai counter. Auto-generate di `tasks.post.ts`.

### [2026-09-17] ADR-005 — GitHub Integration via Server-Side Proxy
**Diputuskan oleh**: Owner
**Keputusan**: Integrasi GitHub melalui server-side Nitro API proxy (`/api/github/*`), bukan client-side direct call.
**Alasan**: (1) GitHub PAT tidak boleh terekspos ke browser. (2) Server-side caching via Nitro `cachedFunction` melindungi dari rate limit. (3) Konsisten dengan arsitektur existing.
**Dampak**: 3 API endpoints baru. `server/utils/github.ts` helper. Token di `runtimeConfig` (server-only).

### [2026-09-17] ADR-006 — Pluggable Storage: KV Now, Supabase Later
**Diputuskan oleh**: Owner
**Keputusan**: Pertahankan Nitro Unstorage KV sebagai storage saat ini. Arsitektur `StorageAdapter` interface tetap dipertahankan agar bisa di-swap ke Supabase PostgreSQL tanpa mengubah API handlers.
**Alasan**: Supabase belum di-setup. KV berfungsi baik untuk development lokal. Swap ke Supabase hanya perlu (1) isi `.env`, (2) implement `StorageAdapter` baru, (3) toggle config.
**Dampak**: Tidak ada perubahan storage saat ini. Future-proof architecture.

### [2026-09-17] ADR-007 — Vercel as Deploy Target
**Diputuskan oleh**: Owner
**Keputusan**: Frontend Nexura di-deploy ke Vercel. Vercel API integration untuk deployment monitoring direncanakan di Phase 11 setelah token tersedia.
**Alasan**: Vercel adalah platform deployment utama untuk project-project GitHub owner.
**Dampak**: Nuxt build output harus kompatibel dengan Vercel deployment preset.

### [2026-09-17] ADR-008 — Telemetry Header Bar (New Component)
**Diputuskan oleh**: Owner
**Keputusan**: Tambah komponen `HeaderBar.vue` horizontal — menampilkan live clock (UTC/WIB), active branch indicator, sprint velocity KPI, dan search input.
**Alasan**: Menggantikan "Welcome back, Bagja" banner dengan informasi fungsional. Clock dual timezone relevan untuk developer yang beroperasi lintas timezone. Search dengan ochre focus ring sesuai design tokens.
**Dampak**: `app.vue` layout berubah: sidebar + header + main. File baru `HeaderBar.vue`.

---

## Log Format

```
### [YYYY-MM-DD] ADR-xxx — Judul Keputusan
**Diputuskan oleh**: [owner / engineer / bersama]
**Keputusan**: [deskripsi]
**Alasan**: [alasan]
**Dampak**: [file/area yang terpengaruh]
```
