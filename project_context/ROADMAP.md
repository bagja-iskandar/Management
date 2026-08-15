# ROADMAP.md — Rework Roadmap Berdasarkan Temuan Aktual

_Last updated: 2026-08-15._

---

## Prinsip Rework

1. **Preserve function** — tidak mengubah atau merusak fitur yang sudah berjalan tanpa justifikasi teknis
2. **Bertahap** — setiap fase mandiri, dapat di-test, dan dapat di-review secara independen
3. **Correctness first** — perbaiki fungsionalitas dan aksesibilitas sebelum memoles estetika
4. **Evidence-based** — setiap perubahan didasarkan pada temuan konkret dari codebase dan design source of truth

---

## Phase 0 — Baseline Documentation
**Status**: ✅ Completed

- [x] Investigasi seluruh source code
- [x] Dokumentasi `PROJECT.md`, `ARCHITECTURE.md`, `DESIGN.md`, `ENGINEERING.md`, `DECISIONS.md`
- [x] Identifikasi semua issues dengan evidence aktual

---

## Phase 1 — Critical Fixes & Cleanup
**Status**: ✅ Completed (1a ✅, 1b ✅, 1c ✅, 1d ✅, 1e ✅, 1f ✅)

### 1a. ✅ Hapus Ghost Files di `pages/` Root
- **Files**: `pages/index.vue`, `pages/projects.vue`, `pages/contact.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Ketiga file 0-bytes dihapus setelah verifikasi routing membuktikan Nuxt 4 sepenuhnya mengabaikannya. Build tetap menghasilkan routes identik dari `app/pages/`.
- **Verification**: `npm run build` — exit code 0.

### 1b. ✅ Perbaiki Reaktivitas ConfirmDialog Props
- **File**: `components/ConfirmDialog.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Ganti 5 non-reactive `const` declarations dengan `computed` (`displayTitle`, `displayMessage`, `displayConfirmText`, `displayCancelText`, `displayBusy`).
- **Verification**: `npm run build` — exit code 0.

### 1c. ✅ Hapus Tipe Duplikat di `dashboard.vue`
- **File**: `components/dashboard.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus local `type Status`, `type Stat`, `type Row`. Gunakan shared types dari `types/`.
- **Verification**: `npm run build` — exit code 0.

### 1d. ✅ Tambahkan Error Handling di `useAsyncData`
- **Files**: `components/dashboard.vue`, `app/pages/projects.vue`, `assets/css/main.css`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Tangani `error` dari `useAsyncData` dengan banner `role="alert"` dan CSS variant `.feedback.error`.
- **Verification**: `npm run build` — exit code 0.

### 1e. ✅ Bersihkan CSS Fragile Selectors di `main.css`
- **File**: `assets/css/main.css`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus seluruh blok fragile selectors (`section > div:nth-of-type(2/3/4)`). Seluruh layout dashboard di-handle oleh class-based CSS.
- **Verification**: `npm run build` — exit code 0.

### 1f. ✅ Hapus File Orphan
- **Files**: `assets/css/base.css`, `assets/javascript/navbar.js`, `.data/tasks.json`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Ketiga file orphan berhasil dihapus setelah audit memverifikasi tidak ada dependency aktif.
- **Verification**: `npm run build` — exit code 0.

---

## Phase 2 — Code Quality, TypeScript & Server Optimization
**Status**: ✅ Completed (2026-08-14)

### 2a. ✅ Perbaiki CSS Path di `nuxt.config.ts`
- **File**: `nuxt.config.ts`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Gunakan alias rootDir resmi Nuxt 4 (`~~/assets/css/main.css`).

### 2b. ✅ Tambahkan Generic Return Types pada Composables
- **Files**: `composables/useStats.ts`, `composables/useProjects.ts`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Tambahkan generic `$fetch<Stat[]>('/api/stats')` dan `$fetch<Project[]>('/api/projects')`.

### 2c. ✅ Standarisasi Nuxt Auto-Imports
- **Files**: `nuxt.config.ts`, `app/app.vue`, `app/pages/index.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Daftarkan auto-imports untuk components dan composables di `nuxt.config.ts`. Hapus manual imports redundant.

### 2d. ✅ Hapus redundant `statusClass()` di `dashboard.vue`
- **File**: `components/dashboard.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus dead code fungsi `statusClass()` dari `dashboard.vue`.

### 2e. ✅ Optimasi Query Ganda di `[id].put.ts`
- **File**: `server/api/task/[id].put.ts`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus redundant `getArray()` lookup. Delegasikan sepenuhnya ke `updateItem()`.

### 2f. ✅ Bersihkan Duplikasi Styling Dasar
- **Files**: `assets/css/main.css`, `assets/css/dashboard.css`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus 39 baris duplikasi `.button` di `dashboard.css`.

---

## Phase 3 — Core Accessibility & Foundation UX Fixes
**Status**: ✅ Completed (2026-08-14)

### 3a. ✅ Focus Trap pada `ConfirmDialog`
- **File**: `components/ConfirmDialog.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Cyclic focus trap (`Tab`/`Shift+Tab`), initial focus pada Cancel button, dan robust focus restoration.

### 3b. ✅ ARIA Accessibility Improvements pada `ConfirmDialog`
- **File**: `components/ConfirmDialog.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Deterministic IDs (`useId()`), `role="alertdialog"`, `aria-labelledby`, dan `aria-describedby`.

### 3c. ✅ Visually-hidden Text pada Status Badge
- **Files**: `assets/css/main.css`, `components/ActivityTable.vue`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Utilitas `.sr-only` standar WCAG dan label screen reader pada status badge.

### 3d. ✅ Perbaiki Tampilan & Navigasi `projects.vue`
- **Files**: `app/pages/projects.vue`, `assets/css/main.css`
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Hapus tampilan raw `slug:`, ganti dengan deskripsi dan fallback empty state.

### 3e. ✅ [Deprecated / Feature Removed] Auto-dismiss Feedback pada `contact.vue`
- **File**: `app/pages/contact.vue`
- **Status**: Historical (Fitur Contact kemudian dihapus sepenuhnya pada 2026-08-15 karena di luar scope personal management dashboard).

### 3f. ✅ Standardisasi Bahasa UI ke English
- **Files**: Seluruh template komponen dan halaman
- **Status**: Implemented & Verified 2026-08-14
- **Change**: Standardisasi user-facing text ke Bahasa Inggris standar.

---

## Phase 4 — UI/UX Design System & Exploration (Stitch)
**Status**: ✅ Completed (Design Source of Truth)
**Prinsip**: Seluruh visual style, tokenisasi warna, typography scale, dan layout shell dieksplorasi dan disetujui di Stitch (**Project: `Management - Polymorphism UI Exploration`, Project ID: `9689375760914620032`**) sebagai single source of truth:

### 4a. ✅ Visual Audit & Baseline Design Review
- Evaluasi visual hierarchy, contrast ratio, spacing, dan layout flow.
- Penyusunan kebutuhan antarmuka personal project management yang ringkas dan fokus untuk single developer.

### 4b. ✅ Stitch Design Mockups & Specification
- Pembuatan blueprint visual high-fidelity: Dashboard, Projects Hub, Project Detail (`/projects/[slug]`), Tasks Hub (`/tasks`), Add Project Modal, Add Task Modal, UI Lifecycle States (Loading shimmer, Empty state, Error retry, Delete alertdialog), dan Multi-Device Responsive Showcase.

### 4c. ✅ Spesifikasi Design Tokens
- Perumusan design tokens Dark Polymorphism (CSS Custom Properties): background `#0B0F19`, glass surface `rgba(17, 24, 39, 0.75)`, primary indigo `#6366F1`, cyan `#06B6D4`, violet `#A855F7`, semantic neon glows, typography scale Inter, radius `16px` cards dan `8px` inputs.

---

## Phase 5 — UI Implementation & UX Refinement
**Status**: 🔄 In Progress (UI/UX Refinement)
**Prinsip**: Implementasi dan penyempurnaan codebase secara presisi 1-to-1 terhadap blueprint Stitch tanpa mengubah API contract atau business logic backend.

### 5a. ✅ Global Layout & Centered Container
- **Files**: `assets/css/main.css`, `app/app.vue`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Canvas `#0B0F19`, glass surfaces `rgba(17, 24, 39, 0.75)`, ambient radial glow mesh, Google Inter typography, dan centered container (`max-width: 1450px; margin: 0 auto;`).

### 5b. ✅ Left Sidebar Navigation (230px)
- **Files**: `components/navbar.vue`, `assets/css/navbar.css`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Fixed 230px Left Sidebar dengan brand mark M, navigasi personal workspace (*Dashboard*, *Projects*, *Tasks*), personal developer profile card (Bagja Iskandar), dan mobile toggle drawer. Fitur Contact dihapus sepenuhnya.

### 5c. ✅ Dashboard Hierarchy & Visual Analytics
- **Files**: `components/dashboard.vue`, `components/StatCard.vue`, `components/ActivityTable.vue`, `assets/css/dashboard.css`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Welcome Banner dengan highlight cyan (`#38BDF8`), 4 kartu KPI StatCard (bold 2.4rem), Action Pills bar (`⊕ New Task`, `📁 Manage Projects`, `📋 Tasks Hub`, sync), Task Overview SVG curve chart, Donut Gauge reaktif, dan Recent Activity table dengan task icons (`❖`, `</>`, `🚀`).

### 5d. ✅ Scalable Projects Hub
- **Files**: `app/pages/projects.vue`, `assets/css/main.css`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Multi-filter status tabs (`All`, `Active`, `Planned`, `On Hold`, `Completed` dengan counter badges), live search, sorting dropdown, 3-col scalable grid, derived progress bars, dan trigger modal `⊕ New Project`.

### 5e. ✅ Dynamic Project Detail Route (`/projects/[slug]`)
- **File**: `app/pages/projects/[slug].vue`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Breadcrumbs, Hero Metadata Card, Derived Progress Card (68%), 4-stat metric breakdown, dan associated tasks management table.

### 5f. ✅ Add Project Modal Form
- **Files**: `components/AddProjectModal.vue`, `app/pages/projects.vue`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Modal gelap (`620px`) dengan Project Name, Description, Status Selector pills, Priority Selector pills, Timeline dates, penjelasan derived progress, focus trap, dan Escape key dismissal.

### 5g. ✅ Add Task Modal Form
- **Files**: `components/AddTaskModal.vue`, `components/dashboard.vue`, `app/pages/tasks.vue`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Modal gelap (`600px`) dengan Searchable Project Picker, Task Name, Description, Status Selector, Priority Selector, Due Date, focus trap, dan real-time metric refresh.

### 5h. ✅ Dedicated Tasks Hub Page (`/tasks`)
- **Files**: `app/pages/tasks.vue`, `components/navbar.vue`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Dedicated Tasks Hub dengan live search, project filter, priority filter, status tabs, sort selector, task table dengan inline status rotation, dan delete alertdialog.

### 5i. ✅ UI Lifecycle States & Accessibility Polish
- **Files**: `assets/css/main.css`, `components/ActivityTable.vue`, `components/ConfirmDialog.vue`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Shimmer skeleton animations (`.skeleton-shimmer`), rich empty states dengan icon tile ilustratif (`📋`), warning icon dengan red glow pada delete alertdialog, dan error banner dengan interactive *Try Again* action.

### 5j. ✅ Navigation Performance Optimization (Non-blocking Lazy Data & Payload Caching)
- **Files**: `components/dashboard.vue`, `app/pages/projects.vue`, `app/pages/projects/[slug].vue`, `app/pages/tasks.vue`
- **Status**: Implemented & Verified 2026-08-15
- **Change**: Mengganti `await useAsyncData` dengan `useLazyAsyncData` disertai `getCachedData` in-memory payload cache. Mengeliminasi Suspense transition blocking saat navigasi client-side (Dashboard $\leftrightarrow$ Projects $\leftrightarrow$ Tasks), menghasilkan transisi instan (0ms) tanpa network blocking sambil mempertahankan data freshness melalui invalidasi `refreshNuxtData`.
- **Verification**: `npm run build` — exit code 0; navigasi instan terverifikasi.

### 5k. 🔄 UI/UX Visual Fidelity Refinement (Current Focus)
- **Status**: In Progress
- **Target**: Penyempurnaan mikro-interaksi, kerapihan padding & typography scale, dynamic status linking, dan audit visual menyeluruh berdasarkan Stitch Source of Truth sebelum finalisasi.

---

## Phase 6 — Documentation & Portfolio Readiness
**Status**: ⏳ Queued (Menunggu Penyelesaian UI/UX Refinement Phase 5)

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

- **Unit Testing**: Vitest untuk `server/utils/` (store, validation) dan composables
- **State Management**: Evaluasi Pinia Store jika kebutuhan shared client-state meningkat
- **Deployment Configuration**: Setup hosting & CI/CD deployment configuration (Vercel / Netlify / Docker)
- **Folder Restructure**: Evaluasi pemindahan `components/`, `composables/`, `types/` ke dalam `app/`
