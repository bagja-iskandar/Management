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

---

## Log Format untuk Keputusan Baru

```
### [YYYY-MM-DD] Judul Keputusan
**Diputuskan oleh**: [reviewer / engineer / bersama]
**Keputusan**: [deskripsi]
**Alasan**: [alasan singkat]
**Dampak**: [file/area yang terpengaruh]
```


