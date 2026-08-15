# Dokumentasi Project Management

## 1. Ringkasan
Project ini adalah aplikasi personal management dashboard berbasis Nuxt 4 dengan arsitektur modern Polymorphism Dark Glass yang menampilkan visualisasi aktivitas, statistik proyek, pelacakan deliverables, serta API Nitro untuk menyimpan dan mengelola tasks.

Aplikasi ini menggunakan:
- Nuxt 4 (Vue 3, TypeScript)
- Nitro server-side API & middleware
- Penyimpanan data menggunakan Nitro unstorage KV file di `.data/kv/`
- Design System: Dark Polymorphism (Inter Typography, Dark Navy `#0B0F19`, Glass Surfaces `rgba(17, 24, 39, 0.75)`)

## 2. Fitur Utama

- **Personal Dashboard** (`/`):
  - Kartu KPI: Total Projects, Completed Tasks, Active Workstreams, Page Visits
  - Visual Curve Chart: Task Overview (Weekly & Monthly velocity)
  - Donut Gauge: Status distribution (Completed, In Progress, To Do)
  - Action Pills Bar & Live Task Search
  - Recent Activity Data Table dengan semantik status pills dan instant toggle
- **Projects Hub** (`/projects`):
  - Multi-filter status tabs (`All`, `Active`, `Planned`, `On Hold`, `Completed`)
  - Scalable project cards dengan task count dan dynamic derived milestone progress bar
  - Dedicated dynamic Project Detail route (`/projects/:slug`)
- **Tasks Hub** (`/tasks`):
  - Multi-dimensi filtering (Live search, Project, Priority, Status, Sort)
  - Tabel manajemen task lengkap dengan rotasi status dan alertdialog hapus aman
- **Modals Interaktif**:
  - `AddProjectModal`: Form pembuatan proyek baru dengan focus trap WCAG
  - `AddTaskModal`: Form pembuatan task baru dengan searchable project picker
  - `ConfirmDialog`: Alertdialog konfirmasi hapus destruktif
- **API CRUD**:
  - `GET /api/activities`
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PUT /api/task/:id`
  - `DELETE /api/task/:id`
  - `GET /api/stats`
  - `GET /api/projects`

## 3. Struktur Project

- `app/app.vue`
  - Root layout aplikasi yang memuat `Navbar` (Left Sidebar 230px) dan konten utama centered container
- `app/pages/`
  - `index.vue`: Halaman root yang merender `Dashboard`
  - `projects.vue`: Halaman daftar proyek dan status tracking
  - `projects/[slug].vue`: Halaman dynamic detail proyek dan associated tasks
  - `tasks.vue`: Halaman dedicated Tasks Hub
- `components/`
  - `dashboard.vue`, `navbar.vue`, `ActivityTable.vue`, `StatCard.vue`, `QuickPanel.vue`, `ConfirmDialog.vue`, `TaskForm.vue`, `AddProjectModal.vue`, `AddTaskModal.vue`
- `server/`
  - `server/api`: Endpoints API Nitro
  - `server/plugins/seed.ts`: Nitro seed plugin
  - `server/middleware/visit.ts`: Visit counter middleware
  - `server/utils/`: `store.ts`, `validation.ts`, `handler.ts`, `storage-adapter.ts`, `errors.ts`
- `assets/css/`
  - `main.css`, `dashboard.css`, `navbar.css`

## 4. Menjalankan Project

1. Install dependencies:
   ```bash
   npm install
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka browser ke:
   - `http://localhost:3000`
