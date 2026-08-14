# DECISIONS.md — Keputusan yang Sudah dan Belum Diambil

_Last updated: 2026-08-14._

> File ini mencatat keputusan yang **benar-benar sudah disepakati** antara reviewer dan engineer.

---

## Keputusan Strategis / Kebijakan Umum

### [2026-08-14] PENDING-01 — Bahasa UI
**Diputuskan oleh**: Reviewer
**Keputusan**: Standardisasi UI ke **Bahasa Inggris**
**Alasan**: Lebih sesuai untuk portfolio internasional
**Dampak**: Template Vue (label, placeholder, teks tombol, heading) — berlaku mulai Phase 3 (UX Fixes).

---

### [2026-08-14] PENDING-02 — Ghost Files di `pages/` Root
**Diputuskan oleh**: Reviewer
**Keputusan**: **Verifikasi dependency & routing terlebih dahulu**, kemudian **hapus** setelah terbukti aman.
**Alasan**: Memastikan tidak ada implikasi routing sebelum penghapusan.
**Dampak**: Diselesaikan pada Phase 1a.

---

### [2026-08-14] PENDING-03 — Lokasi `components/`, `composables/`, `types/`
**Diputuskan oleh**: Reviewer
**Keputusan**: **Tidak dipindahkan** ke `app/` untuk saat ini
**Alasan**: Menghindari perubahan structural yang luas sebelum bug fixes selesai; Nuxt membaca dari kedua lokasi
**Dampak**: Tidak ada perubahan path. Noted di ARCHITECTURE.md sebagai inkonsistensi yang diterima.

---

### [2026-08-14] PENDING-04 — Pinia
**Diputuskan oleh**: Reviewer
**Keputusan**: **Biarkan terdaftar** di dependencies untuk saat ini; evaluasi setelah architecture refactor
**Alasan**: Tidak memblokir apapun; keputusan implementasi terlalu dini sebelum refactor selesai
**Dampak**: Tidak ada perubahan `package.json`. Ditandai di ROADMAP.md sebagai backlog.

---

### [2026-08-14] PENDING-05 — Approval Mode Phase 1
**Diputuskan oleh**: Reviewer
**Keputusan**: **Per-item / incremental** — setiap item dipropose, disetujui, lalu diimplementasikan secara terpisah
**Alasan**: Kontrol lebih ketat; setiap perubahan dapat di-review dan di-test secara mandiri
**Dampak**: Workflow: propose satu item → tunggu approval → implement → verify → lanjut ke item berikutnya.

---

### [2026-08-14] PENDING-06 — Urutan Rework
**Diputuskan oleh**: Reviewer
**Keputusan**: **Bug fixes & correctness** (Phase 1) → **Code quality** (Phase 2) → **UX/Accessibility** (Phase 3) → **Docs** (Phase 4)
**Alasan**: Memperbaiki yang broken lebih penting daripada folder restructure; structural changes bisa dilakukan setelah codebase lebih stabil.

---

## Log Keputusan Implementasi Phase 1

### [2026-08-14] Phase 1a — Ghost Files `pages/` (Hapus)
**Keputusan**: Hapus `pages/index.vue`, `pages/projects.vue`, `pages/contact.vue` (0 bytes)
**Alasan**: Verifikasi eksplisit via source maps dan tsconfig build artifacts membuktikan Nuxt 4 sepenuhnya mengabaikan root `pages/` ketika `app/` directory aktif.
**Dampak**: 3 file dihapus, root `pages/` dibersihkan. Build 100% identik.

### [2026-08-14] Phase 1b — Reaktivitas Props ConfirmDialog (`computed`)
**Keputusan**: Gunakan `computed` untuk 5 fallback display values (`displayTitle`, `displayMessage`, `displayConfirmText`, `displayCancelText`, `displayBusy`) daripada akses `props.X` langsung di template.
**Alasan**: Mempertahankan reaktivitas prop dari parent saat modal dibuka ulang, sekaligus menjaga clean fallback di template.
**Dampak**: Bug non-reaktif terselesaikan di `components/ConfirmDialog.vue`.

### [2026-08-14] Phase 1c — Type Deduplication di `dashboard.vue`
**Keputusan**: Hapus tipe lokal `Status`, `Stat`, `Row` dan gunakan shared types `Task`, `Stat` dari `~/types`. `statusClass()` dipertahankan (out of scope).
**Alasan**: `Task` terbukti structural superset identik dari `Row`.
**Dampak**: `dashboard.vue` berkurang 15 baris definisi duplikat.

### [2026-08-14] Phase 1d — Error Handling `useAsyncData` & CSS Modifier
**Keputusan**: Tangani `error` dari `useAsyncData` di `dashboard.vue` & `projects.vue` dengan banner `role="alert"`. Tambahkan class modifier `.feedback.error` di `main.css` tanpa membuat `<style scoped>` baru.
**Alasan**: Memberikan visual feedback saat API gagal tanpa menambah CSS duplication.
**Dampak**: Error state aman dan terkelola di Dashboard dan Projects.

### [2026-08-14] Phase 1e — Pembersihan Fragile Selectors di `main.css`
**Keputusan**: Hapus seluruh blok fragile selectors (`section > div:nth-of-type(2/3/4)`) di `main.css` (45 baris).
**Alasan**: Terbukti 100% styling dashboard sudah di-cover oleh class-based CSS di `dashboard.css` dan scoped component styles.
**Dampak**: Layout dashboard tidak rentan rusak saat elemen baru (seperti error banner) di-render.

### [2026-08-14] Phase 1f — Penghapusan File Orphan
**Keputusan**: Hapus `assets/css/base.css`, `assets/javascript/navbar.js`, dan `.data/tasks.json`.
**Alasan**: Audit mendalam memastikan file-file ini tidak digunakan oleh runtime, seed, Nitro adapter, test, maupun build pipeline.
**Dampak**: Codebase bersih dari artifact usang; folder `assets/javascript` dibersihkan.

### [2026-08-14] Phase 2a — Global CSS Path Alias di `nuxt.config.ts`
**Keputusan**: Ubah `css: ['../assets/css/main.css']` menjadi `css: ['~~/assets/css/main.css']` di `nuxt.config.ts`.
**Alasan**: Nuxt 4 menetapkan `srcDir: app/` dan `rootDir: ./`. Alias `~~` adalah alias resmi Nuxt untuk `rootDir`. Penggunaan relative traversal `../` di root config adalah non-idiomatis.
**Dampak**: 1 baris di `nuxt.config.ts`, build 100% lolos (exit code 0).

### [2026-08-14] Phase 2b — Generic Return Types pada Composables
**Keputusan**: Tambahkan `import type { Stat }` dan `import type { Project }` serta generic `$fetch<Stat[]>('/api/stats')` dan `$fetch<Project[]>('/api/projects')`.
**Alasan**: Menghilangkan inferensi `Promise<unknown>` sehingga consumer (`dashboard.vue`, `projects.vue`) mendapatkan type checking dan autocompletion otomatis, konsisten dengan `useTasks.ts`.
**Dampak**: 2 file composables diperbarui, type checking end-to-end terhubung.

### [2026-08-14] Phase 2c — Nuxt Auto-Imports Standarization
**Keputusan**: Daftarkan `components: ['~~/components']` dan `imports: { dirs: ['../composables'] }` di `nuxt.config.ts`, lalu hapus manual import `Navbar` di `app/app.vue` dan `Dashboard` di `app/pages/index.vue`.
**Alasan**: Memanfaatkan fitur auto-import native Nuxt 4 tanpa memindahkan letak folder fisik (`PENDING-03`).
**Dampak**: `app.vue` dan `pages/index.vue` bersih dari boilerplate manual import; type metadata komponen dan composables ter-generate lengkap di `.nuxt`.

### [2026-08-14] Phase 2d — Hapus Redundant `statusClass()` di `dashboard.vue`
**Keputusan**: Hapus fungsi `statusClass()` dari `components/dashboard.vue`.
**Alasan**: Fungsi tersebut tidak pernah dipanggil di template maupun script `dashboard.vue` karena rendering tabel aktivitas didelegasikan ke `ActivityTable.vue` (yang memiliki definisinya sendiri).
**Dampak**: Menghapus dead code (7 baris) dan membersihkan script `dashboard.vue`.

### [2026-08-14] Phase 2e — Optimasi Query Ganda di `[id].put.ts`
**Keputusan**: Hapus pemanggilan manual `getArray()` dan `tasks.find()` di `server/api/task/[id].put.ts`, serahkan lookup dan 404 handling sepenuhnya kepada `updateItem()`.
**Alasan**: `updateItem()` telah menangani array lookup, merge patch, dan pengembalian `null` jika ID tidak ditemukan. Menghilangkan redundant read storage Nitro (single query).
**Dampak**: Mengurangi 50% storage I/O pada endpoint PUT task, behavior validasi date dan error code 404 tetap terjaga 100%.

### [2026-08-14] Phase 2f — Bersihkan Duplikasi Styling Dasar `.button`
**Keputusan**: Hapus 39 baris deklarasi `.button` dari `assets/css/dashboard.css`.
**Alasan**: Seluruh deklarasi `.button`, `.button:hover`, `.button.small`, `.button.danger`, `.button.secondary` sudah didefinisikan secara global di `assets/css/main.css`.
**Dampak**: Mengeliminasi duplikasi CSS dan menjaga `main.css` sebagai single source of truth untuk styling button.

### [2026-08-14] Phase 3a — Focus Trap & Robust Focus Restoration pada `ConfirmDialog.vue`
**Keputusan**: Tambahkan cyclic focus trap (`Tab`/`Shift+Tab`), inisialisasi fokus ke tombol Batal, dan restorasi fokus ke trigger button dengan fallback ke elemen interaktif dashboard (`.activity-table button`, `.dashboard-toolbar input`) jika task telah terhapus dari DOM.
**Alasan**: Memenuhi standar accessibility WCAG 2.1 modal dialog tanpa ketergantungan library pihak ketiga dan mencegah focus loss setelah operasi delete.
**Dampak**: 1 file (`components/ConfirmDialog.vue`), 0 perubahan visual/CSS, keyboard accessibility terpenuhi.

### [2026-08-14] Phase 3b — ARIA Accessibility Improvements pada `ConfirmDialog.vue`
**Keputusan**: Gunakan `useId()` untuk ID deterministik `titleId` dan `descId`, pasang `role="alertdialog"`, hubungkan `aria-labelledby` dan `aria-describedby`, serta hapus redundant `aria-label` dan invalid `aria-pressed="false"`.
**Alasan**: Sesuai dengan WAI-ARIA Modal Dialog pattern; memastikan screen reader langsung mengumumkan judul dan deskripsi peringatan konfirmasi hapus.
**Dampak**: 1 file (`components/ConfirmDialog.vue`), 0 perubahan visual/CSS, kepatuhan WAI-ARIA terpenuhi.

### [2026-08-14] Phase 3c — Visually-hidden Text pada Status Badge di `ActivityTable.vue`
**Keputusan**: Tambahkan utility class `.sr-only` standar WCAG ke `assets/css/main.css` dan sematkan `<span class="sr-only">Status: </span>` pada status badge di `components/ActivityTable.vue`.
**Alasan**: Memastikan screen reader mengumumkan konteks label field status secara jelas tanpa mengandalkan diferensiasi visual/warna saja.
**Dampak**: 2 file (`assets/css/main.css`, `components/ActivityTable.vue`), 0 perubahan visual/layout, aksesibilitas screen reader meningkat.

### [2026-08-14] Phase 3d — Perbaiki Tampilan & Navigasi `app/pages/projects.vue`
**Keputusan**: Ganti tampilan raw `slug: <code>` dengan deskripsi proyek yang bermakna, perbaiki tautan kartu proyek menuju anchor `#summary`, sediakan fallback visual `.empty-state`, dan gunakan auto-import `useProjects`.
**Alasan**: Menghilangkan tampilan technical debt / internal identifier dari end user, memperbaiki logika alur navigasi, dan memberikan UX yang konsisten saat data proyek kosong.
**Dampak**: 2 file (`app/pages/projects.vue`, `assets/css/main.css`), alur navigasi halaman proyek menjadi konsisten.

### [2026-08-14] Phase 3e — Auto-dismiss Feedback pada `app/pages/contact.vue`
**Keputusan**: Terapkan timer auto-dismiss 5 detik untuk pesan status feedback kontak, sertakan pembatalan timer aktif saat submit ulang, dan cleanup pada hook `onUnmounted`.
**Alasan**: Menghilangkan pesan sukses yang persisten mengganggu tampilan form tanpa reload, serta mencegah potensi memory leak.
**Dampak**: 1 file (`app/pages/contact.vue`), UX form kontak menjadi responsif dan bersih.

### [2026-08-14] Phase 3f — Standardisasi Bahasa UI ke English
**Keputusan**: Terjemahkan seluruh user-facing text pada seluruh template Vue, aria-label, placeholder, note, feedback, dialog konfirmasi, dan KPI labels ke Bahasa Inggris standar. Nilai status backend (`todo`, `proses`, `selesai`) dipetakan ke display text (`To Do`, `In Progress`, `Completed`) tanpa merusak skema API dan KV storage.
**Alasan**: Memenuhi keputusan `PENDING-01` untuk menyelaraskan antarmuka dengan standar portfolio engineering internasional.
**Dampak**: 10 file frontend & API stats, UI 100% konsisten dalam Bahasa Inggris.

---

## Log Format untuk Keputusan Baru

```
### [YYYY-MM-DD] Judul Keputusan
**Diputuskan oleh**: [reviewer / engineer / bersama]
**Keputusan**: [deskripsi]
**Alasan**: [alasan singkat]
**Dampak**: [file/area yang terpengaruh]
```


