# Management Dashboard

Aplikasi dashboard manajemen berbasis Nuxt 4 dengan API Nitro sederhana untuk tugas, statistik, dan proyek.

Dokumentasi lengkap dapat dibaca di [DOCUMENTATION.md](./DOCUMENTATION.md).

## Setup

Install dependencies:

```bash
npm install
```

## Development Server

Jalankan server development:

```bash
npm run dev
```

Buka aplikasi pada:

```bash
http://localhost:3000
```

## Build dan Preview

```bash
npm run build
npm run preview
```

## Fitur Utama

- Personal Dashboard dengan KPI cards, visual curve analytics, dan donut gauge status.
- Pencarian tugas client-side dan manajemen lifecycle status (*To Do*, *In Progress*, *Completed*).
- Halaman `Projects` & `Project Detail` (`/projects/:slug`) dengan dynamic milestone progress bars.
- Halaman `Tasks` (`/tasks`) untuk manajemen task terpusat dan multi-dimensi filter.
- Modals interaktif: Add Project Modal & Add Task Modal.
- API Nitro untuk tugas, aktivitas, proyek, dan statistik.
- Data disimpan secara konsisten menggunakan Nitro unstorage KV file di `.data/kv/`.
