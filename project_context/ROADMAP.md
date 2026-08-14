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
**Status**: ✅ Completed (2026-08-14)

### 2a. ✅ Perbaiki CSS Path di `nuxt.config.ts`
- **File**: `nuxt.config.ts` baris 6
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Ubah `'../assets/css/main.css'` menjadi `'~~/assets/css/main.css'`. Menggunakan alias rootDir resmi Nuxt 4 (`~~/`) yang idiomatis dan konsisten dengan lokasi folder `assets/` di root.
- **Verification**: `npm run build` — exit code 0, 1.96 MB, no errors.

### 2b. ✅ Tambahkan Generic Return Types pada Composables
- **Files**: `composables/useStats.ts`, `composables/useProjects.ts`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Tambah `import type { Stat }` dan `import type { Project }` dari `~/types`. Tambahkan generic type parameter `$fetch<Stat[]>('/api/stats')` dan `$fetch<Project[]>('/api/projects')` sehingga consumer (`dashboard.vue` dan `projects.vue`) me-resolve inferred types secara akurat dan konsisten dengan `useTasks.ts`.
- **Verification**: `npm run build` — exit code 0, 1.96 MB, no errors.

### 2c. ✅ Standarisasi Nuxt Auto-Imports
- **Files**: `nuxt.config.ts`, `app/app.vue`, `app/pages/index.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Daftarkan `components: ['~~/components']` dan `imports: { dirs: ['../composables'] }` di `nuxt.config.ts`. Hapus manual import redundant `Navbar` di `app/app.vue` dan `Dashboard` di `app/pages/index.vue`.
- **Verification**: `npm run build` — exit code 0; auto-import metadata `node_modules/.cache/nuxt/.nuxt/components.d.ts` mendaftarkan `Navbar`, `Dashboard`, dan semua komponen root; `types/imports.d.ts` mendaftarkan `useTasks`, `useStats`, `useProjects`.

### 2d. ✅ Hapus redundant `statusClass()` di `dashboard.vue`
- **File**: `components/dashboard.vue` (baris 139–145 dihapus)
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus fungsi `statusClass()` yang tidak terpakai dari `dashboard.vue` (dead code peninggalan ekstraksi `ActivityTable.vue`).
- **Verification**: `npm run build` — exit code 0; git diff verified.

### 2e. ✅ Optimasi Query Ganda di `[id].put.ts`
- **File**: `server/api/task/[id].put.ts`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus redundant `getArray()` & manual `find()` lookup. Delegasikan lookup, update, dan 404 handling sepenuhnya ke `updateItem()`. Pertahankan validasi date & fallback behavior.
- **Verification**: `npm run build` — exit code 0; test suite verifikasi behavior date edge-cases lolos 100%.

### 2f. ✅ Bersihkan Duplikasi Styling Dasar
- **Files**: `assets/css/main.css`, `assets/css/dashboard.css` (baris 132–171 dihapus)
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus 39 baris duplikasi deklarasi `.button` dari `dashboard.css`. Semua elemen tombol di dashboard fully-covered oleh rule global `main.css`.
- **Verification**: `npm run build` — exit code 0; bundle CSS berkurang; git diff verified.

---

## Phase 3 — Core Accessibility & Foundation UX Fixes
**Status**: ✅ Completed (2026-08-14)

### 3a. ✅ Focus Trap pada `ConfirmDialog`
- **File**: `components/ConfirmDialog.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Implementasi keyboard focus trap (`Tab` dan `Shift+Tab` cyclic navigation), initial focus ke tombol Cancel, dan robust focus restoration ke trigger element saat modal ditutup via Escape/Batal dengan fallback ke elemen interaktif dashboard (`.activity-table button`, `.dashboard-toolbar input`) jika baris telah terhapus.
- **Verification**: `npm run build` — exit code 0; git diff verified.

### 3b. ✅ ARIA Accessibility Improvements pada `ConfirmDialog`
- **File**: `components/ConfirmDialog.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Gunakan `useId()` untuk ID deterministik `titleId` dan `descId`, tetapkan `role="alertdialog"`, hubungkan `aria-labelledby` dan `aria-describedby`, serta bersihkan atribut redundant `:aria-label` dan `aria-pressed="false"`.
- **Verification**: `npm run build` — exit code 0; git diff verified.

### 3c. ✅ Visually-hidden Text pada Status Badge
- **Files**: `assets/css/main.css`, `components/ActivityTable.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Tambahkan utilitas `.sr-only` standar WCAG ke `assets/css/main.css` dan sematkan `<span class="sr-only">Status: </span>` pada status badge di `ActivityTable.vue` untuk aksesibilitas screen reader.
- **Verification**: `npm run build` — exit code 0; git diff verified.

### 3d. ✅ Perbaiki Tampilan & Navigasi `projects.vue`
- **Files**: `app/pages/projects.vue`, `assets/css/main.css`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus tampilan raw `slug:`, tampilkan deskripsi proyek yang informatif, perbaiki navigasi "Lihat Ringkasan" menuju anchor `#summary`, tambahkan fallback empty state yang ramah pengguna, dan bersihkan manual import `useProjects`.
- **Verification**: `npm run build` — exit code 0; git diff verified.

### 3e. ✅ Auto-dismiss Feedback pada `contact.vue`
- **File**: `app/pages/contact.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Tambahkan auto-dismiss timer 5 detik untuk feedback form submission dengan timer reset saat submit ulang dan lifecycle cleanup pada `onUnmounted`.
- **Verification**: `npm run build` — exit code 0; git diff verified.

### 3f. ✅ Standardisasi Bahasa UI ke English
- **Files**: Seluruh template komponen dan halaman (10 files)
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Sesuai keputusan `PENDING-01`, standardisasi seluruh user-facing UI text (headings, button labels, placeholders, aria-labels, notes, feedback messages, empty states) ke Bahasa Inggris dengan tetap menjaga integritas data model backend (`todo | proses | selesai` dipetakan ke display text `To Do / In Progress / Completed`).
- **Verification**: `npm run build` — exit code 0; git diff verified.

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
