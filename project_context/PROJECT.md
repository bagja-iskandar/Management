# PROJECT.md — Identitas, Tujuan, Scope, dan Stack

_Last updated: 2026-08-14. Diisi berdasarkan investigasi langsung ke source code._

---

## 1. Identitas Project

| Field | Value |
|---|---|
| **Nama** | Management Dashboard |
| **Tipe** | Aplikasi Web — Academic Project, sedang dalam proses rework menuju portfolio-grade |
| **Package name** | `nuxt-app` (dari `package.json`) |
| **Repo root** | `d:\Project\REWORK\Management` |
| **Status** | Phase 1 (Critical Fixes) Selesai ✅; siap masuk Phase 2 (Code Quality) |

---

## 2. Tujuan

Project ini awalnya adalah tugas akademik berupa **dashboard manajemen** berbasis web. Tujuan rework saat ini adalah meningkatkan kualitas engineering secara bertahap agar layak dicantumkan sebagai portfolio project profesional — bukan rewrite dari nol, melainkan perbaikan iteratif pada arsitektur, code quality, UI/UX, reliability, dan dokumentasi.

Fungsi inti yang sudah ada dan harus **dipertahankan**:
- Menampilkan statistik ringkasan (KPI) dari data tasks dan projects
- CRUD tasks: tambah, ubah status, hapus dengan konfirmasi reaktif
- Pencarian task secara client-side
- Navigasi antar tiga halaman: Dashboard, Projects, Contact
- Halaman Projects menampilkan daftar proyek dari API (dengan error state handling)
- Halaman Contact dengan form demo (tidak mengirim email)

---

## 3. Scope Aktual

### Yang Sudah Ada (Verified dari Codebase)
- **3 halaman** aktif di `app/pages/`: `index.vue`, `projects.vue`, `contact.vue`
- **7 komponen** di `components/`: `dashboard.vue`, `navbar.vue`, `ActivityTable.vue`, `StatCard.vue`, `QuickPanel.vue`, `ConfirmDialog.vue`, `TaskForm.vue`
- **3 composables** di `composables/`: `useTasks`, `useStats`, `useProjects`
- **6 API endpoints** di `server/api/`: GET activities, GET tasks, POST tasks, GET stats, GET projects, PUT task/:id, DELETE task/:id
- **1 server plugin**: `seed.ts` — inisialisasi data awal jika storage kosong
- **1 server middleware**: `visit.ts` — counter kunjungan halaman
- **TypeScript types** di `types/`: `Task`, `Project`, `Stat` dengan barrel export (digunakan konsisten di `dashboard.vue`)

### Yang TIDAK Ada (Tidak Ditemukan di Codebase)
- Autentikasi / login
- Database (menggunakan Nitro storage/KV file di `.data/kv/`)
- Testing (unit, integration, e2e) — belum ada test file, belum ada test runner di `package.json`
- State management global dengan Pinia (package terdaftar tapi belum digunakan)
- Deployment config (tidak ada Dockerfile, CI/CD, atau hosting config)
- Environment variable config (`.env.example` tidak ada)

### File Obsolete / Anomali (Telah Diselesaikan di Phase 1)
- `pages/` root: 3 file kosong (`index.vue`, `projects.vue`, `contact.vue`) telah **dihapus** (Phase 1a) setelah diverifikasi tidak berpengaruh pada routing.
- `assets/javascript/navbar.js`: orphan composition API snippet telah **dihapus** (Phase 1f).
- `assets/css/base.css`: orphan dark theme variables telah **dihapus** (Phase 1f).
- `.data/tasks.json`: legacy numeric ID tasks file telah **dihapus** (Phase 1f). Nitro storage aktif menggunakan `.data/kv/`.

---

## 4. Tech Stack (Verified)

| Layer | Teknologi | Versi |
|---|---|---|
| **Framework** | Nuxt | ^4.0.3 |
| **UI Runtime** | Vue | ^3.5.18 |
| **Routing** | Vue Router | ^4.5.1 |
| **Server/API** | Nitro (bundled dengan Nuxt) | — |
| **State Management** | Pinia (terdaftar, belum digunakan) | ^3.0.3 |
| **Language** | TypeScript (via Nuxt) | — |
| **Styling** | Vanilla CSS | — |
| **Storage** | Nitro Storage — file-based KV di `.data/kv/` | — |
| **Package Manager** | npm | — |

### CSS File Registry (Aktual)

| File | Di-import? | Dipakai oleh |
|---|---|---|
| `assets/css/main.css` | Ya | Global via `nuxt.config.ts` |
| `assets/css/dashboard.css` | Ya | `components/dashboard.vue` via `<style src>` scoped |
| `assets/css/navbar.css` | Ya | `components/navbar.vue` via `<style src>` scoped |

---

## 5. Bahasa & Konvensi Saat Ini

- **Bahasa UI**: Campuran — diputuskan untuk distandarisasi ke **English** (PENDING-01, implementasi Phase 3)
- **Bahasa kode**: Bahasa Inggris (variable names, function names, type names)
- **Bahasa dokumentasi**: Bahasa Indonesia (DOCUMENTATION.md, README.md, context docs)
