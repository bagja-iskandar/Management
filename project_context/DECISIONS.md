# DECISIONS.md — Architectural Decision Records

_Last updated: 2026-10-22._

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
**Status**: ⚠️ **Superseded oleh ADR-009 (2026-10-22)** — digantikan oleh **Precision Dark Obsidian** (Linear / Raycast Inset Architecture).

### [2026-09-17] ADR-002 — Sidebar Redesign: 3 items → 5 items compact
**Diputuskan oleh**: Owner
**Keputusan**: Ganti sidebar 3-item (Dashboard, Projects, Tasks) + user profile card dengan sidebar 5-item compact (Dashboard, Active Sprints, Architecture Roadmap, Code Repos, System Telemetry) + system status tile.
**Alasan**: Nexura bukan lagi "dashboard saja" — melainkan full engineering command center yang perlu navigasi ke sprints, repos, dan system health. User profile card tidak berguna untuk solo developer.
**Status**: 🔄 **Diperbarui oleh ADR-009** — dikembalikan menjadi **Unified Left Rail (`w-56`)** dengan label teks eksplisit, tombol `⌘K` Quick Action, dan daftar *Pinned Active Projects* (menggantikan icon-only floating capsule dock).

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
**Alasan**: Menggantikan "Welcome back, Bagja" banner dengan informasi fungsional. Clock dual timezone relevan untuk developer yang beroperasi lintas timezone.
**Status**: 🔄 **Diperbarui oleh ADR-009** — digabungkan menjadi **Unified Top Header Bar** di dalam panel `.obs-workspace` (bukan lagi *floating islands* terpisah).

### [2026-10-22] ADR-009 — UI/UX Overhaul: Charcoal-Ochre → Precision Dark Obsidian (Linear / Raycast Inset Architecture)
**Diputuskan oleh**: Owner & AI Architect
**Keputusan**: Mengganti keseluruhan sistem desain dan tata letak dari **Charcoal-Ochre Console** (`#0B0A09` + `#C98A4B` + `#F5F2EB`) menjadi **Precision Dark Obsidian** berstandar Linear / Raycast / Cursor:
1. **Unifikasi Temperatur Warna Dingin (Cool Achromatic + Obsidian Accent):**
   - Outer Void `#07080A`, Inset Workspace Canvas `#0B0C10`, Card Surface `#111318`, Elevated `#171920`.
   - Teks utama `#F3F4F6` (*Crisp Alabaster*), teks sekunder `#8A8F9E` (*Cool Slate*), teks tersier `#565B68`.
   - Aksen utama **Cool Indigo** (`#6366F1` / `#818CF8`) dengan dukungan preset tema (`indigo`, `amethyst`, `stealth`, `emerald`) dan tombol CTA utama berwarna **Crisp Alabaster** (`bg-[#F3F4F6] text-[#07080A]`).
2. **Inset Workspace & Specular 1px Lighting:**
   - Menghapus *floating icon-only capsule dock*, *floating header pills*, dan `<StructureStaticGrid />` (*crosshair grid*).
   - Mengadopsi **Unified Left Sidebar (`w-56`)** dengan label navigasi jelas + shortcut proyek aktif, berdampingan dengan **Inset Workspace Panel** (`.obs-workspace`, `rounded-2xl`) dan kartu berdimensi **Specular Top-Highlight** (`.obs-card`, `inset 0 1px 0 0 rgba(255,255,255,0.07)`).
3. **Hierarki Tipografi Ergonomis:**
   - `font-sans` (`Inter`) menjadi default untuk seluruh elemen UI/navigasi/judul. `font-mono` (`JetBrains Mono`) dibatasi hanya untuk ID task, SHA commit, metrik angka, dan jam. Batas minimum ukuran teks adalah `12px` (`text-xs`).
4. **Asymmetric Bento Dashboard:**
   - Baris atas: 4 kartu KPI specular (*In-Flight Tasks, Sprint Velocity, CI/CD Workflows, Open PRs & Issues*).
   - Area utama 12 kolom: 8 kolom kiri (*Execution Radar* dengan segmented tabs + *Global Commit Stream* dengan inline diff) dan 4 kolom kanan (*Quick Task Inspector*, *Weekly Sprint Focus*, *Managed Projects Hub*).
**Alasan**: Tema Charcoal-Ochre menimbulkan *thermal clash* (latar hitam dingin vs teks krem/cokelat hangat) yang terasa kusam dan melelahkan mata, serta tata letak *floating islands* memecah fokus visual.
**Dampak**: Pembaruan `tailwind.config.ts`, `assets/css/main.css`, `app/app.vue`, `Sidebar.vue`, `HeaderBar.vue`, `Dashboard.vue`, dan seluruh komponen `.vue` agar menggunakan token Dark Obsidian. Mockup referensi tersimpan di `project_context/mockup-dark-obsidian.html`.

---

## Log Format

```
### [YYYY-MM-DD] ADR-xxx — Judul Keputusan
**Diputuskan oleh**: [owner / engineer / bersama]
**Keputusan**: [deskripsi]
**Alasan**: [alasan]
**Dampak**: [file/area yang terpengaruh]
```
