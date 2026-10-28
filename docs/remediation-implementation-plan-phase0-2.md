# NEXURA MANAGEMENT — MASTER REMEDIATION IMPLEMENTATION PLAN
**Phase 0 (Security & DB), Phase 1 (State & Workspace), and Phase 2 (OmniSearch Engine)**

> **STATUS:** DRAFTED & CROSS-REVIEWED BY ALL 4 ANALYSTS (WAITING FOR USER APPROVAL)  
> **LEAD ARCHITECT:** Head Agent  
> **REFERENCE GOVERNANCE:** [`.agents/rules/multi-agent-governance.md`](file:///d:/Project_Center/REWORK/Management/.agents/rules/multi-agent-governance.md)  
> **REPORTING STANDARD:** [`.agents/reporting-standard.md`](file:///d:/Project_Center/REWORK/Management/.agents/reporting-standard.md)  
> **TARGET DIRECTORY:** `d:\Project_Center\REWORK\Management`

---

## 1. RINGKASAN EKSEKUTIF & TUJUAN ARSITEKTURAL

Dokumen ini adalah **Master Remediation Implementation Plan** definitif untuk merevitalisasi dan menyelesaikan defek arsitektural pada Phase 0, Phase 1, dan Phase 2. Rencana ini disusun berdasarkan temuan empiris faktual pada Tahap 1 dan telah melalui proses telaah silang (*Cross-Review*) yang ketat oleh empat analis read-only:
1. `security-db-analyst`
2. `frontend-core-analyst`
3. `product-workspaces-analyst`
4. `integrations-qa-analyst`

### 1.1. Prinsip Utama Rekayasa
1. **Single Source of Truth (SSOT):** Seluruh state data (`tasks`, `projects`, `sprints`, `notes`) dikonsolidasikan ke singleton `useWorkspaceStore`. Menghapus 14 cache key lokal `useLazyAsyncData` yang memicu puluhan network call duplikat.
2. **Zero Fake Metrics (Metric Honesty):** Mengeliminasi seluruh angka dan string palsu (14, 11, 3, 78%, 24, +18%, 'Dec 2026', 'management') dan menggantinya dengan nilai riil atau Obsidian Quiet Bento Empty States yang elegan.
3. **3-Tier Security Architecture:** Membagi endpoint menjadi Public Read-Only (bebas diakses untuk UX publik), Sensitive Read-Only (wajib auth untuk diff kode & security alerts), dan Mutative/Destructive (wajib auth via session cookie handshake).
4. **Restorasi OmniSearch 60:40 Split-View:** Mengembalikan modal resmi `OmniSearchModal.vue` ke root shell `app/app.vue`, menyederhanakan `HeaderSearch.vue` menjadi visual click trigger, menghubungkan pencarian langsung ke in-memory store (0ms latency), dan mengindeks `project_notes`.
5. **Real Non-Destructive Testing:** Mengganti pengujian tiruan lokal (fake mocks) dengan unit test Vitest riil yang mengimpor modul produksi tanpa menyentuh database cloud produksi.
6. **Strict Single Execution Owner & Styling Freeze:** Memetakan batasan file secara eksklusif ke 5 eksekutor dan mengunci class visual Tailwind Dark Obsidian Bento pada 92 file termodifikasi lokal.

---

## 2. PEMBAGIAN BLOK IMPLEMENTASI & URUTAN SEKUENSIAL

Pengerjaan dibagi ke dalam **3 Blok Sekuensial Berurutan**. Setiap blok memiliki kriteria gerbang (*exit gate*) yang wajib dipenuhi sebelum blok berikutnya diizinkan dimulai:

```
[BLOK 1: Security, Auth Gate, Database, & Allowlist] (Phase 0)
                           ↓ (Exit Gate 1: Security & Allowlist Tests Pass)
[BLOK 2: Store SSOT, Modals Shell, Notes API, & UI Metrics Cleanup] (Phase 1)
                           ↓ (Exit Gate 2: In-Memory Store & Modals Verified)
[BLOK 3: OmniSearch Engine Rework, Routing, & Real Vitest Suite] (Phase 2)
                           ↓ (Exit Gate 3: Vitest & End-to-End Contract Pass)
                 ==> SYSTEM ALIGNED & ACCEPTED
```

---

## 3. MATRIKS RINCIAN PEKERJAAN (TASK BREAKDOWN MATRIX)

### BLOK 1: SECURITY, AUTH GATE, DATABASE, & ALLOWLIST FOUNDATION (PHASE 0)

#### `TASK-P0-01`: Implementasi 3-Tier Auth Middleware & Session Cookie Handshake
- **Masalah & Bukti:** `server/middleware/auth.ts#L12-L17` membiarkan seluruh request `GET` lolos tanpa auth. Client frontend tidak memiliki mekanisme pengiriman bearer token, sehingga penguncian auth membabi buta akan memicu HTTP 401 massal.
- **Tujuan Perubahan:** Menerapkan 3-Tier Security Matrix:
  - *Tier 1 (Public Read):* `/api/tasks`, `/api/projects`, `/api/sprints`, `/api/notes`, `/api/stats`, `/api/telemetry` bebas auth.
  - *Tier 2 (Sensitive Read):* `/api/github/security`, `/api/github/commit-detail`, `/api/github/workflow-logs`, `/api/backup/*` wajib auth.
  - *Tier 3 (Mutations):* Seluruh `POST`, `PUT`, `PATCH`, `DELETE` wajib auth.
  - Tambahkan endpoint `POST /api/auth/session` untuk menyetel cookie `nexura_session` (`HttpOnly; Secure; SameSite=Lax`). Gunakan `crypto.timingSafeEqual` untuk token matching.
- **Scope File:**
  - `server/middleware/auth.ts`
  - `server/api/auth/session.post.ts` (File Baru)
- **Pemilik Eksekusi Tunggal:** `security-db-executor`
- **Dependensi:** Tidak ada.
- **Risiko & Mitigasi:** Risiko 401 saat mutasi lokal -> Tambahkan local dev bypass jika `NODE_ENV !== 'production'` dan key belum disetel.
- **Kriteria Penerimaan (AC):**
  - GET `/api/tasks` mengembalikan 200 tanpa header auth.
  - GET `/api/github/security` mengembalikan 401 jika tanpa session valid.
  - POST `/api/tasks` mengembalikan 401 jika tanpa cookie/token valid.
- **Strategi Validasi:** Integration test endpoint via mocked event testing.

#### `TASK-P0-02`: Pengetatan GitHub Allowlist (Exact Match & Read Endpoints Protection)
- **Masalah & Bukti:** `server/utils/github-allowlist.ts#L59-L62` membandingkan nama repo tanpa owner, memungkinkan bypass. Seluruh endpoint GET GitHub (`security.get.ts`, `commits.get.ts`, `commit-detail.get.ts`, dll.) tidak memanggil allowlist.
- **Tujuan Perubahan:**
  - Ubah `isGitHubRepoAllowed` menjadi strict exact matching `projectNormalized.toLowerCase() === requestedNormalized.toLowerCase()`.
  - Pasang `await assertGitHubRepoAllowed(repoParam, event)` pada seluruh endpoint di `server/api/github/*.get.ts`.
- **Scope File:**
  - `server/utils/github-allowlist.ts` (Pemilik: `security-db-executor`)
  - `server/api/github/commits.get.ts` (Pemilik: `backend-api-executor`)
  - `server/api/github/commit-detail.get.ts` (Pemilik: `backend-api-executor`)
  - `server/api/github/security.get.ts` (Pemilik: `backend-api-executor`)
  - `server/api/github/pulls-issues.get.ts` (Pemilik: `backend-api-executor`)
  - `server/api/github/branches.get.ts`, `workflows.get.ts`, `workflow-runs.get.ts`, `workflow-logs.get.ts`, `deployments.get.ts`, `packages.get.ts` (Pemilik: `backend-api-executor`)
- **Protokol Handoff Sekuensial:** `security-db-executor` menyelesaikan `github-allowlist.ts` terlebih dahulu -> handoff ke `backend-api-executor` untuk memasang guard di API endpoints.
- **Kriteria Penerimaan (AC):** Query `?repo=attacker/management` ditolak dengan HTTP 403 Forbidden.

#### `TASK-P0-03`: Sanitasi RuntimeConfig Publik & Idempotensi Migrasi 003
- **Masalah & Bukti:** `nuxt.config.ts#L39` membocorkan URL Supabase cloud ke client bundle. Migrasi `003_system_alignment_and_rls_lockdown.sql#L32` menggunakan `CREATE POLICY` tanpa `DROP POLICY IF EXISTS`, memicu error jika dijalankan ulang di Supabase. `scripts/verify-supabase.mjs` belum memverifikasi migrasi 003.
- **Tujuan Perubahan:**
  - Hapus `supabaseUrl` dari `runtimeConfig.public` di `nuxt.config.ts`.
  - Tambahkan `DROP POLICY IF EXISTS` sebelum setiap `CREATE POLICY` di `003_system_alignment_and_rls_lockdown.sql`.
  - Perbarui `scripts/verify-supabase.mjs` untuk memvalidasi tabel `project_notes` dan status `'idea'`.
- **Scope File:**
  - `nuxt.config.ts` (blok runtimeConfig)
  - `server/database/migrations/003_system_alignment_and_rls_lockdown.sql`
  - `scripts/verify-supabase.mjs`
- **Pemilik Eksekusi Tunggal:** `security-db-executor`
- **Dependensi:** Tidak ada.
- **Kriteria Penerimaan (AC):** `npm run db:verify` memeriksa tabel `project_notes` dan migrasi 003. Client JS bundle tidak mengandung URL Supabase.

---

### BLOK 2: STORE SSOT, MODALS SHELL, NOTES API, & UI METRICS CLEANUP (PHASE 1)

#### `TASK-P1-01`: Konsolidasi Store SSOT & In-Flight Promise Lock
- **Masalah & Bukti:** 14 cache key lokal `useLazyAsyncData` memicu duplikasi fetch dan desinkronisasi data. Cold boot berisiko race condition.
- **Tujuan Perubahan:**
  - Tambahkan `inFlightInitPromise` lock di `composables/useWorkspaceStore.ts` untuk mencegah concurrent calls pada cold boot.
  - Perbarui `composables/useQuickTask.ts` dengan state `activeProjectSlug` agar kontekstual saat dibuka dari project detail.
- **Scope File:**
  - `composables/useWorkspaceStore.ts`
  - `composables/useQuickTask.ts`
- **Pemilik Eksekusi Tunggal:** `frontend-store-executor`
- **Dependensi:** Blok 1 selesai.
- **Kriteria Penerimaan (AC):** Panggilan ganda `initializeWorkspace()` hanya menghasilkan 1 request batch ke backend.

#### `TASK-P1-02`: Konsolidasi Root Shell Modals & Eliminasi Duplikasi di Page
- **Masalah & Bukti:** `OmniSearchModal` dan `AddProjectModal` absen dari `app/app.vue`. Terjadi duplikasi pemasangan `<TaskDrawer>` dan `<AddTaskModal>` di dalam `Dashboard.vue` dan `projects/[slug].vue`. Berkas `EditProjectModal.vue` hilang.
- **Tujuan Perubahan:**
  - Pasang `<AddProjectModal v-if="isAddProjectOpen" />` di root `app/app.vue`.
  - Teruskan prop `:project-slug="activeProjectSlug"` pada `<AddTaskModal />` di `app/app.vue`.
  - Buat komponen baru `components/EditProjectModal.vue` dengan token Dark Obsidian Bento.
  - Hapus pemanggilan modal lokal di `components/Dashboard.vue` dan `app/pages/projects/[slug].vue`. Ganti aksi klik dengan `openTaskDrawer(taskId)` dan `openAddTask(projectSlug)`.
- **Scope File:**
  - `app/app.vue` (Pemilik: `frontend-store-executor`)
  - `components/EditProjectModal.vue` (Pemilik: `frontend-store-executor`)
  - `components/Dashboard.vue` (Pemilik: `page-workspaces-executor`)
  - `app/pages/projects/[slug].vue` (Pemilik: `page-workspaces-executor`)
- **Protokol Handoff Sekuensial:** `frontend-store-executor` menyelesaikan shell `app.vue` dan modal -> handoff ke `page-workspaces-executor` untuk melepas modal lokal di pages.
- **Kriteria Penerimaan (AC):** Hanya ada 1 instance `<TaskDrawer>` di seluruh DOM aplikasi.

#### `TASK-P1-03`: Refactoring Server Notes API & Eliminasi Silent Storage Fallback
- **Masalah & Bukti:** `server/api/notes/*` membypass `withApiHandler` dan `noteRepository`, serta melakukan silent fallback ke local KV (`createItem`) yang memicu split-brain storage.
- **Tujuan Perubahan:**
  - Bungkus seluruh endpoint notes (`index.get.ts`, `index.post.ts`, `[id].delete.ts`, `[id]/promote.post.ts`) dengan `withApiHandler`.
  - Delegasikan seluruh operasi ke `noteRepository`. Hapus silent fallback lokal.
- **Scope File:**
  - `server/api/notes/index.get.ts`
  - `server/api/notes/index.post.ts`
  - `server/api/notes/[id].delete.ts`
  - `server/api/notes/[id]/promote.post.ts`
- **Pemilik Eksekusi Tunggal:** `backend-api-executor`
- **Dependensi:** Blok 1 selesai.
- **Kriteria Penerimaan (AC):** Endpoint notes mengembalikan error 422 standar saat skema Zod gagal, dan error 500 saat database gagal tanpa fallback KV diam-diam.

#### `TASK-P1-04`: Penegakan Zero Fake Metrics & Penyederhanaan Dual-Write Task-Sprint
- **Masalah & Bukti:** Puluhan angka palsu di `Dashboard.vue`, `UnifiedHeroBanner.vue`, `projects/index.vue`, dan `Sidebar.vue`. `sprints.vue` melakukan dual-write manual ke `tasks.sprintId` dan `sprints.taskIds`. `projects/[slug].vue` mengarang proyek fiktif jika slug tidak ditemukan.
- **Tujuan Perubahan:**
  - Bersihkan seluruh fallback angka (14, 11, 3, 78%, 24, +18%, dll.). Tampilkan angka riil atau empty state `0`.
  - Di `app/pages/sprints.vue`: jadikan `tasks.sprintId` sebagai SSOT tunggal. Hapus panggilan dual-write `sprintsApi.updateSprint(sprint.id, { taskIds })`. Hitung deliverable aktif via computed filter terhadap `tasks`. Pertahankan kolom DDL database `task_ids` untuk backward compatibility.
  - Di `app/pages/projects/[slug].vue`: hapus fallback mock project. Tampilkan error 404 resmi Nuxt jika slug tidak ditemukan.
  - Hapus tab `supabase` di detail proyek dan navigasi sidebar.
- **Scope File:**
  - `components/Dashboard.vue`
  - `components/dashboard/UnifiedHeroBanner.vue`
  - `app/pages/projects/index.vue`
  - `app/pages/projects/[slug].vue`
  - `app/pages/sprints.vue`
  - `components/Sidebar.vue`
- **Pemilik Eksekusi Tunggal:** `page-workspaces-executor`
- **Dependensi:** TASK-P1-01 dan TASK-P1-02 selesai.
- **Kriteria Penerimaan (AC):** Tidak ada angka metrik buatan yang muncul saat workspace kosong. Membuka `/projects/slug-palsu` menampilkan halaman 404.

---

### BLOK 3: OMNISEARCH ENGINE REWORK, ROUTING, & REAL VITEST SUITE (PHASE 2)

#### `TASK-P2-01`: Rework OmniSearch Composable & Shell Integration
- **Masalah & Bukti:** `OmniSearchModal.vue` tidak terpasang di `app/app.vue`. `HeaderSearch.vue` membajak event `Ctrl+K`. `useOmniSearch.ts` membypass store, memicu 3 network request duplikat, masih mengindeks rute mati `/focus`, dan mengabaikan `project_notes`.
- **Tujuan Perubahan:**
  - Pasang `<OmniSearchModal />` di root `app/app.vue`.
  - Daftarkan keyboard listener global permanen untuk `Ctrl+K` dan `/` di level shell/composable agar tetap aktif saat modal tertutup.
  - Sederhanakan `components/search/HeaderSearch.vue`: buang dropdown popover lokal 500+ baris dan ubah menjadi visual pill trigger yang memanggil `useOmniSearch().openSearch()`.
  - Hubungkan `useOmniSearch.ts` langsung ke `useWorkspaceStore` (0ms in-memory search).
  - Hapus entri rute usang `/focus`. Tambahkan pengindeksan entitas `project_notes` (Scratchpad Notes).
- **Scope File:**
  - `app/app.vue`
  - `composables/useOmniSearch.ts`
  - `components/search/HeaderSearch.vue`
  - `components/search/OmniSearchModal.vue`
- **Pemilik Eksekusi Tunggal:** `frontend-store-executor`
- **Dependensi:** Blok 2 selesai.
- **Kriteria Penerimaan (AC):** Menekan `Ctrl+K` atau mengklik search bar di Header membuka `OmniSearchModal` split-view 60:40. Pencarian instan 0ms tanpa network request baru. `project_notes` muncul di hasil pencarian.

#### `TASK-P2-02`: Pembersihan Dead Route `/focus`
- **Masalah & Bukti:** `app/pages/focus.vue` hanyalah redirect stub usang.
- **Tujuan Perubahan:** Bersihkan file `app/pages/focus.vue` dan hapus referensi rute `/focus` di `components/Sidebar.vue`.
- **Scope File:**
  - `app/pages/focus.vue`
  - `components/Sidebar.vue`
- **Pemilik Eksekusi Tunggal:** `page-workspaces-executor`
- **Dependensi:** TASK-P2-01 selesai.
- **Kriteria Penerimaan (AC):** Navigasi sidebar `/sprints` bersih dari pengecekan rute usang.

#### `TASK-P2-03`: Implementasi Test Suite Riil Berbasis Vitest & Phasing CI Gate
- **Masalah & Bukti:** Test suite eksisting `tests/unit/*.spec.mjs` adalah mock sintetik tiruan. Tidak ada framework testing di `package.json`. Pipeline CI tidak menjalankan test runner.
- **Tujuan Perubahan:**
  - Konfigurasi `vitest.config.ts` dengan dukungan path alias Nuxt.
  - Tambahkan script `"test": "vitest run"` dan `"typecheck": "vue-tsc --noEmit"` di `package.json`.
  - Tulis ulang 4 suite pengujian unit riil yang mengimpor kode produksi langsung:
    1. `tests/unit/safe-url.spec.ts` (menguji `safeOpenExternal` riil dari `useOmniSearch.ts`).
    2. `tests/unit/fuzzy-search.spec.ts` (menguji `splitHighlights` & scoring riil).
    3. `tests/unit/github-allowlist.spec.ts` (menguji `normalizeGitHubRepo` & exact matching riil).
    4. `tests/unit/schemas.spec.ts` (menguji normalisasi status & skema Zod riil).
  - Di `.github/workflows/ci.yml`: pasang `vue-tsc --noEmit` (mode soft gate di Blok 1–2, hard gate di Blok 3) dan `npm test`.
- **Scope File:**
  - `tests/**`
  - `vitest.config.ts` (File Baru)
  - `package.json` (hanya penambahan test scripts dan devDependencies)
  - `.github/workflows/ci.yml`
- **Pemilik Eksekusi Tunggal:** `qa-automation-executor`
- **Dependensi:** Blok 1 & Blok 2 selesai.
- **Kriteria Penerimaan (AC):** `npm test` menjalankan 4 suite pengujian riil dalam waktu < 1.5 detik dengan hasil 100% lulus.

---

## 4. PEMETAAN BATASAN KEPEMILIKAN FILE (FILE BOUNDARY MATRIX)

Untuk mencegah konflik timpa-menimpa kode (*code clobbering*), pembagian kepemilikan file diatur secara eksklusif:

| File / Direktori | Pemilik Eksekusi Eksklusif | Blok Tugas |
|---|---|---|
| `server/database/migrations/003_system_alignment_and_rls_lockdown.sql` | `security-db-executor` | Blok 1 |
| `server/middleware/auth.ts` | `security-db-executor` | Blok 1 |
| `server/api/auth/session.post.ts` | `security-db-executor` | Blok 1 |
| `server/utils/github-allowlist.ts` | `security-db-executor` | Blok 1 |
| `nuxt.config.ts` | `security-db-executor` | Blok 1 |
| `scripts/verify-supabase.mjs` | `security-db-executor` | Blok 1 |
| `server/api/github/**` (seluruh endpoint read/mutasi) | `backend-api-executor` | Blok 1 |
| `server/api/notes/**` (seluruh endpoint notes) | `backend-api-executor` | Blok 2 |
| `server/repositories/supabase/supabase-task.repository.ts` | `backend-api-executor` | Blok 1 |
| `composables/useWorkspaceStore.ts` | `frontend-store-executor` | Blok 2 |
| `composables/useQuickTask.ts` | `frontend-store-executor` | Blok 2 |
| `composables/useTaskDrawer.ts` | `frontend-store-executor` | Blok 2 |
| `composables/useOmniSearch.ts` | `frontend-store-executor` | Blok 3 |
| `app/app.vue` | `frontend-store-executor` | Blok 2 & 3 |
| `components/search/**` (`HeaderSearch.vue`, `OmniSearchModal.vue`, dll.) | `frontend-store-executor` | Blok 3 |
| `components/EditProjectModal.vue` | `frontend-store-executor` | Blok 2 |
| `components/AddProjectModal.vue` | `frontend-store-executor` | Blok 2 |
| `components/TaskDrawer.vue` | `frontend-store-executor` | Blok 2 |
| `components/AddTaskModal.vue` | `frontend-store-executor` | Blok 2 |
| `components/Dashboard.vue` | `page-workspaces-executor` | Blok 2 |
| `components/dashboard/**` (`UnifiedHeroBanner.vue`, dll.) | `page-workspaces-executor` | Blok 2 |
| `app/pages/projects/**` (`index.vue`, `[slug].vue`) | `page-workspaces-executor` | Blok 2 |
| `app/pages/sprints.vue` | `page-workspaces-executor` | Blok 2 |
| `app/pages/tasks.vue` | `page-workspaces-executor` | Blok 2 |
| `app/pages/focus.vue` | `page-workspaces-executor` | Blok 3 |
| `components/Sidebar.vue` | `page-workspaces-executor` | Blok 2 & 3 |
| `tests/**` (seluruh berkas pengujian) | `qa-automation-executor` | Blok 3 |
| `vitest.config.ts` | `qa-automation-executor` | Blok 3 |
| `.github/workflows/ci.yml` | `qa-automation-executor` | Blok 3 |

---

## 5. STRATEGI VALIDASI & PENGUJIAN NON-DESTRUKTIF

1. **Prinsip Isolasi Database Produksi:**
   - Seluruh automated unit test diwajibkan berjalan secara in-memory.
   - Variabel lingkungan `SUPABASE_URL` dan `SUPABASE_KEY` dikosongkan saat pengetesan unit test untuk menjamin tidak ada koneksi keluar ke database cloud.
2. **Kompilasi Statis & Typecheck:**
   - Eksekusi `npx vue-tsc --noEmit` untuk memverifikasi keselarasan antarmuka TypeScript dan props komponen template Vue.
3. **Verifikasi Visual Bento (Styling Freeze Check):**
   - Head Agent memverifikasi bahwa seluruh class token Tailwind (`void`, `canvas`, `surface`, `obs-card`, font floor `text-xs`) tetap utuh tanpa degradasi estetika.

---

## 6. RENCANA KONTINJENSI & ROLLBACK

Jika eksekusi pada salah satu blok mengalami kendala atau regresi tak terduga:
1. **Rollback Level File:** Karena setiap eksekutor bekerja dalam batasan file yang ketat, rollback dapat dilakukan secara terisolasi per-file menggunakan salinan cadangan atau git checkout lokal tanpa membatalkan pekerjaan eksekutor lain.
2. **Rollback Auth Handshake:** Jika session cookie handshake mengalami kendala pada browser tertentu, flag dev-bypass di `auth.ts` dapat diaktifkan sementara untuk memulihkan akses tanpa merusak logika endpoint.
3. **Rollback OmniSearch:** Jika integrasi modal mengalami kendala, `HeaderSearch.vue` visual trigger tetap mempertahankan akses fungsional tanpa menimbulkan crash.

---

## 7. KEPUTUSAN TERBUKA YANG MEMBUTUHKAN PERSETUJUAN PROJECT OWNER

Sebelum implementasi Blok 1 dimulai, mohon konfirmasi arahan Project Owner untuk 3 hal berikut:

1. **Konfirmasi 3-Tier Auth Matrix:** Apakah skema pemetaan Tier 1 (Public Read), Tier 2 (Sensitive Read: security/diffs wajib auth), dan Tier 3 (Mutations wajib auth via cookie handshake) disetujui untuk diterapkan?
2. **Konfirmasi Eliminasi Tab Supabase:** Apakah disetujui untuk menghapus tab internal `supabase` pada detail proyek dan memusatkan seluruh telemetri Supabase pada halaman `/telemetry`?
3. **Konfirmasi Penggunaan Vitest:** Apakah disetujui penambahan `vitest` sebagai test runner utama di `devDependencies` pada Blok 3 untuk mengeksekusi pengujian riil?

---

*Master Remediation Implementation Plan ini telah selesai disusun, ditinjau silang, dan diratifikasi oleh tim analis. Seluruh eksekutor dikunci hingga terbit persetujuan eksplisit Project Owner.*
