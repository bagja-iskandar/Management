# PROJECT.md — Identitas, Tujuan, Scope, dan Stack

_Last updated: 2026-08-15. Diisi berdasarkan investigasi langsung ke source code._

---

## 1. Identitas Project

| Field | Value |
|---|---|
| **Nama** | Management Dashboard (Personal Workspace) |
| **Tipe** | Personal Project & Task Management Dashboard — Portfolio-Grade Web App |
| **Package name** | `nuxt-app` (dari `package.json`) |
| **Repo root** | `d:\Project\REWORK\Management` |
| **Status** | Phase 5 (UI Implementation & UX Refinement) — In Progress |

---

## 2. Tujuan

Project ini adalah **Personal Project & Task Management Dashboard** mandiri yang digunakan oleh seorang developer/user tunggal untuk mengelola proyek dan task secara berkesinambungan. Fokus pengembangan saat ini adalah visual refinement berbasis desain Polymorphism Dark Glass (Stitch Project ID: `9689375760914620032`), efisiensi alur kerja task, dan performa tinggi tanpa bloat multi-user SaaS.

Fungsi inti yang ada:
- Menampilkan statistik ringkasan (KPI) dari data tasks dan projects
- Visualisasi analitik Task Overview (SVG curve) dan Project Status (SVG donut gauge)
- CRUD tasks dengan status lifecycle (*To Do*, *In Progress*, *Completed*), priority (*Low*, *Medium*, *High*), dan filter multi-dimensi
- Scalable Projects Hub dengan dynamic derived milestone progress bar (*Completed Tasks / Total Tasks*)
- Dynamic route Project Detail (`/projects/[slug]`) dengan hero metrics dan associated task management
- Modals interaktif dengan focus trap WCAG: Add Project Modal & Add Task Modal
- Navigasi Left Sidebar terpusat: Dashboard, Projects, Tasks

---

## 3. Scope Aktual

### Yang Ada (Verified dari Codebase)
- **4 halaman aktif** di `app/pages/`: `index.vue` (Dashboard), `projects.vue` (Projects Hub), `projects/[slug].vue` (Project Detail), `tasks.vue` (Tasks Hub)
- **9 komponen** di `components/`: `dashboard.vue`, `navbar.vue`, `ActivityTable.vue`, `StatCard.vue`, `QuickPanel.vue`, `ConfirmDialog.vue`, `TaskForm.vue`, `AddProjectModal.vue`, `AddTaskModal.vue`
- **3 composables** di `composables/`: `useTasks`, `useStats`, `useProjects`
- **6 API endpoints** di `server/api/`: GET activities, GET tasks, POST tasks, GET stats, GET projects, PUT task/:id, DELETE task/:id
- **1 server plugin**: `seed.ts` — inisialisasi data awal jika storage kosong
- **1 server middleware**: `visit.ts` — counter kunjungan halaman
- **TypeScript types** di `types/`: `Task`, `Project`, `Stat`

### Yang TIDAK Ada (Eksplisit Dikecualikan dari Scope)
- Fitur Contact (dihapus karena tidak relevan untuk personal management dashboard)
- Team, Roles, Multi-user, dan Corporate SaaS Administration
- Calendar, Reports, dan Settings yang tidak diperlukan
- Integrasi backend/GitHub eksternal baru

---

## 4. Tech Stack (Verified)

| Layer | Teknologi | Versi |
|---|---|---|
| **Framework** | Nuxt | ^4.0.3 |
| **UI Runtime** | Vue | ^3.5.18 |
| **Routing** | Vue Router (Nuxt Pages) | ^4.5.1 |
| **Server/API** | Nitro (bundled dengan Nuxt) | — |
| **Storage** | Unstorage KV file di `.data/kv/` | — |
| **Language** | TypeScript (via Nuxt) | — |
| **Styling** | Vanilla CSS (Polymorphism Dark Glass) | — |
| **Design System** | Google Inter Typography, Dark Navy `#0B0F19`, Glass Blur 16px | — |
