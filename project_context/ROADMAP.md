# ROADMAP.md — Rework Roadmap Berdasarkan Temuan Aktual

_Last updated: 2026-08-14. Dibuat berdasarkan investigasi baseline — belum ada fase yang disetujui._

> **Catatan**: Roadmap ini adalah **proposal** berdasarkan temuan investigasi. Setiap fase membutuhkan persetujuan sebelum implementasi dimulai. Urutan dan scope setiap fase dapat diubah berdasarkan keputusan reviewer.

---

## Prinsip Rework

1. **Preserve function** — tidak menghapus atau mengubah fitur yang sudah berjalan tanpa alasan
2. **Bertahap** — setiap fase mandiri, dapat di-test, dan dapat di-review secara independen
3. **Correctness first** — perbaiki yang broken sebelum polish yang kosmetik
4. **Evidence-based** — setiap perubahan berdasarkan temuan konkret dari codebase, bukan asumsi

---

## Phase 0 — Baseline Documentation (Saat Ini)
**Status**: ✅ Selesai (file project_context/ sedang diisi)

- [x] Investigasi seluruh source code
- [x] Isi `PROJECT.md`, `ARCHITECTURE.md`, `DESIGN.md`, `ENGINEERING.md`, `DECISIONS.md`
- [x] Identifikasi semua issues dengan evidence

---

## Phase 1 — Critical Fixes (Prerequisite)
**Status**: ✅ Completed (1a ✅, 1b ✅, 1c ✅, 1d ✅, 1e ✅, 1f ✅)

Memperbaiki hal-hal yang benar-benar broken atau berisiko tinggi — harus diselesaikan sebelum perbaikan lain.

### 1a. ✅ Hapus Ghost Files di `pages/` Root
- **Files**: `pages/index.vue`, `pages/projects.vue`, `pages/contact.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Ketiga file 0-bytes dihapus setelah verifikasi routing eksplisit membuktikan Nuxt 4 sepenuhnya mengabaikannya — tidak ada route, compile, atau import yang dihasilkan dari root `pages/`. Build tetap menghasilkan 3 routes identik dari `app/pages/`.
- **Evidence**: Source maps build output → `app/pages/contact.vue`, `app/pages/projects.vue`; tsconfig `include` hanya `app/**/*`; tidak ada referensi ke root `pages/` di seluruh codebase.
- **Verification**: `npm run build` — exit code 0, total size 1.96 MB, routes `/`, `/contact`, `/projects` identik.

### 1b. ✅ Perbaiki Reaktivitas ConfirmDialog Props
- **File**: `components/ConfirmDialog.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Ganti 5 non-reactive `const` declarations dengan `computed` (`displayTitle`, `displayMessage`, `displayConfirmText`, `displayCancelText`, `displayBusy`). Template diupdate untuk menggunakan computed refs. Public interface (`defineProps`, `defineEmits`) tidak berubah.
- **Verification**: `npm run build` — exit code 0, 175 modules transformed, no errors.

### 1c. ✅ Hapus Tipe Duplikat di `dashboard.vue`
- **File**: `components/dashboard.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus local `type Status`, `type Stat`, `type Row` (15 baris). Tambah `import type { Task, Stat } from '../types'`. Update 6 call sites: `Row→Task`, `Status→Task['status']`. `statusClass()` dipertahankan (out of scope).
- **Verification**: `npm run build` — exit code 0, 1.96 MB, no errors.

### 1d. ✅ Tambahkan Error Handling di `useAsyncData`
- **Files**: `components/dashboard.vue`, `app/pages/projects.vue`, `assets/css/main.css`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Destructure `error` dari `useAsyncData` di dashboard (statsError, activitiesError) dan projects (projectsError). Tambah `.feedback.error` CSS variant di `main.css` (modifier dari class existing). Banner `role="alert"` di template masing-masing. Semua template usage sudah null-safe (verified pre-implementation).
- **Verification**: `npm run build` — exit code 0, 1.96 MB, no errors.

### 1e. ✅ Bersihkan CSS Fragile Selectors di `main.css`
- **File**: `assets/css/main.css` (baris 138–182 dihapus)
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus seluruh blok fragile selectors (`section > div:nth-of-type(2/3/4)` dsb.) beserta komentarnya (45 baris). Seluruh layout & styling dashboard terbukti fully-covered oleh class-based CSS di `dashboard.css` dan scoped component styles (`StatCard.vue`, `QuickPanel.vue`).
- **Verification**: `npm run build` — exit code 0, 1.96 MB, HTTP 200 response.

### 1f. ✅ Hapus File Orphan
- **Files**: `assets/css/base.css`, `assets/javascript/navbar.js`, `.data/tasks.json`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Ketiga file orphan berhasil dihapus setelah audit mendalam memverifikasi tidak ada seed, fixture, fallback, nitro adapter, atau script yang menggunakannya. Folder kosong `assets/javascript` dibersihkan.
- **Verification**: `npm run build` — exit code 0, 1.96 MB; git status verified.

---

## Phase 2 — Code Quality, TypeScript & Server Optimization
**Status**: 🔄 In Progress (2a ✅)

### 2a. ✅ Perbaiki CSS Path di `nuxt.config.ts`
- **File**: `nuxt.config.ts` baris 6
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Ubah `'../assets/css/main.css'` menjadi `'~~/assets/css/main.css'`. Menggunakan alias rootDir resmi Nuxt 4 (`~~/`) yang idiomatis dan konsisten dengan lokasi folder `assets/` di root.
- **Verification**: `npm run build` — exit code 0, 1.96 MB, no errors.

### 2b. Tambahkan Generic Return Types pada Composables
- **Files**: `composables/useStats.ts`, `composables/useProjects.ts`
- **Issue**: `$fetch` tanpa generic type mengembalikan `unknown`
- **Fix**: Tambahkan type parameter eksplisit `$fetch<Stat[]>('/api/stats')` dan `$fetch<Project[]>('/api/projects')`

### 2c. Standarisasi Nuxt Auto-Imports
- **Files**: `app/app.vue`, `app/pages/index.vue`
- **Issue**: Manual import `Navbar` dan `Dashboard` — Nuxt 4 mendukung auto-import
- **Fix**: Verifikasi dan bersihkan manual import redundant jika auto-import aktif

### 2d. Hapus redundant `statusClass()` di `dashboard.vue`
- **File**: `components/dashboard.vue` (baris 135–141)
- **Issue**: `statusClass()` tidak digunakan di template `dashboard.vue` (hanya dipakai di `ActivityTable.vue`)
- **Fix**: Hapus fungsi yang tidak terpakai dari `dashboard.vue`

### 2e. Optimasi Query Ganda di `[id].put.ts`
- **File**: `server/api/task/[id].put.ts`
- **Issue**: Array dibaca 2x via manual `find()` lalu `updateItem()`
- **Fix**: Serahkan lookup dan update sepenuhnya ke `updateItem()`, tangani 404 dari return `null`

### 2f. Bersihkan Duplikasi Styling Dasar
- **Files**: `assets/css/main.css`, `assets/css/dashboard.css`
- **Issue**: Duplikasi deklarasi `.button`, `.cd-overlay`, `.cd-panel`
- **Fix**: Konsolidasikan aturan base/modal ke `main.css` dan pastikan `dashboard.css` hanya memuat styling spesifik dashboard

---

## Phase 3 — Core Accessibility & Foundation UX Fixes
**Status**: ⏳ Menunggu Phase 2 selesai

### 3a. Focus Trap pada `ConfirmDialog`
- **File**: `components/ConfirmDialog.vue`
- **Issue**: Navigasi keyboard (Tab) dapat keluar dari batas modal yang sedang aktif
- **Fix**: Implementasi focus trap handler agar fokus tetap berada di dalam panel dialog

### 3b. ARIA Accessibility Improvements pada `ConfirmDialog`
- **File**: `components/ConfirmDialog.vue`
- **Fix**: Tambahkan `aria-labelledby` dan `aria-describedby` yang menunjuk ke ID judul dan pesan modal

### 3c. Visually-hidden Text pada Status Badge
- **File**: `components/ActivityTable.vue`
- **Issue**: Status hanya dibedakan via warna — tidak accessible untuk screen reader
- **Fix**: Tambahkan teks deskriptif dengan class `.sr-only`

### 3d. Perbaiki Tampilan & Navigasi `projects.vue`
- **File**: `app/pages/projects.vue`
- **Issue**: Menampilkan raw `slug:`, tombol "Lihat ringkasan" mengarah ke `/`, tidak ada empty state
- **Fix**: Hapus tampilan slug raw, perbaiki link navigasi, dan tambahkan fallback visual saat data proyek kosong

### 3e. Auto-dismiss Feedback pada `contact.vue`
- **File**: `app/pages/contact.vue`
- **Issue**: Pesan feedback form submission tetap muncul permanen hingga page reload
- **Fix**: Tambahkan auto-dismiss timer (misal 5 detik) setelah submit berhasil

### 3f. Standardisasi Bahasa UI ke English
- **Files**: Seluruh template komponen dan halaman
- **Keputusan**: Sesuai `PENDING-01`, standarisasi teks UI ke Bahasa Inggris untuk konsistensi portfolio

---

## Phase 4 — UI/UX Design System & Exploration (Stitch)
**Status**: ⏳ Menunggu Phase 3 selesai
**Prinsip**: Seluruh color palette, typography (Google Fonts), dan visual style adalah *kandidat eksplorasi* yang memerlukan audit & approval eksplisit sebelum implementasi.

### 4a. Visual Audit & Baseline Design Review
- Evaluasi visual hierarchy, contrast ratio, spacing, dan layout flow yang ada saat ini.
- Identifikasi area perbaikan estetika (cards elevation, typography pairing, micro-interactions).

### 4b. Stitch Design Exploration & Mockups
- Eksplorasi mockup high-fidelity menggunakan Stitch untuk:
  - Top Navigation & Brand Header
  - Dashboard KPI Metrics & Overview Section
  - Interactive Activity Table & Quick Action Cards
  - Project Showcase & Contact View
- Pengujian kandidat color scheme (e.g. curated slate/indigo/emerald vs existing navy palette) dan font pairing (e.g. Inter / Plus Jakarta Sans).

### 4c. Spesifikasi Design Tokens
- Perumusan design tokens yang disetujui (CSS Custom Properties): semantic color roles, typography scale, border radii, dan shadow elevation.
- Penyusunan panduan interaksi dan state visual (hover, active, disabled, focus-visible).

---

## Phase 5 — UI Implementation & Visual Modernization
**Status**: ⏳ Menunggu Phase 4 selesai
**Prinsip**: Hanya mengimplementasikan design dan interaction yang telah disetujui pada Phase 4. Fitur tambahan apa pun (seperti pagination, mobile drawer, atau `<NuxtLoadingIndicator>`) wajib diajukan dengan justifikasi teknis dan approval tersendiri.

### 5a. Integrasi Design Tokens ke `main.css`
- Implementasikan token CSS variabel final (warna, font-family, spacing, elevation) ke `assets/css/main.css`.

### 5b. Modernisasi Komponen Navbar
- Implementasi styling navbar modern, active route indicator, dan responsive menu icon/toggle yang disepakati.

### 5c. Modernisasi Komponen Dashboard (StatCard, QuickPanel, TaskForm)
- Terapkan visual styling baru, icon badges, dan micro-interaction transitions pada kartu KPI dan form aksi.

### 5d. Modernisasi ActivityTable & Filter Toolbar
- Terapkan styling data table modern, refined status badges, hover feedback, serta empty state informatif saat pencarian tanpa hasil.

### 5e. Modernisasi Visual Halaman Projects & Contact
- Terapkan card showcase proyek modern dan layout contact form terstruktur.

---

## Phase 6 — Documentation & Portfolio Readiness
**Status**: ⏳ Tahap Akhir (Setelah UI & Engineering Rework Selesai)

### 6a. Update `DOCUMENTATION.md`
- Perbarui dokumentasi arsitektur final, API contracts, Unstorage KV schema, dan data flow.

### 6b. Update `README.md`
- Buat README berstandar portofolio profesional: Tech stack badges, architectural highlights, project overview, screenshots/preview, dan panduan menjalankan project.

### 6c. JSDoc Annotations & Code Comments
- Tambahkan dokumentasi JSDoc standar pada exported composables dan server utilities.

### 6d. Final Audit & Portfolio Showcase Checklist
- Audit menyeluruh performa, aksesibilitas, responsive layout, dan clean code sebelum penyelesaian akhir.

---

## Backlog (Belum Diprioritaskan)

Item-item berikut diidentifikasi tapi belum diprioritaskan — membutuhkan keputusan & justifikasi tersendiri:

- **Unit Testing**: Vitest untuk `server/utils/` (store, validation) dan composables
- **State Management**: Evaluasi Pinia Store jika kebutuhan shared client-state meningkat
- **Deployment Configuration**: Setup hosting & CI/CD deployment configuration (Vercel / Netlify / Docker)
- **Folder Restructure**: Evaluasi pemindahan `components/`, `composables/`, `types/` ke dalam `app/`
