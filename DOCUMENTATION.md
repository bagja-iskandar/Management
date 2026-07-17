# Dokumentasi Project Management

## 1. Ringkasan
Project ini adalah aplikasi dashboard manajemen berbasis Nuxt 4 yang menampilkan ringkasan aktivitas, statistik proyek, serta API sederhana untuk menyimpan dan mengelola tugas.

Aplikasi ini menggunakan:
- Nuxt 4
- Vue 3
- Nitro server-side API
- Penyimpanan data menggunakan Nitro storage

## 2. Fitur Utama

- Dashboard utama dengan:
  - Pencarian tugas
  - Kartu KPI (Total Project, Task Selesai, Bug Terbuka, Pengunjung)
  - Daftar aktivitas terakhir
  - Tombol aksi cepat untuk membuat tugas baru
- Navbar responsif dengan tautan ke Dashboard, Projects, dan Contact
- API CRUD tugas:
  - `GET /api/activities`
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PUT /api/task/:id`
  - `DELETE /api/task/:id`
- API statistik:
  - `GET /api/stats`
- API proyek:
  - `GET /api/projects`
- Seed data awal untuk `tasks`, `projects`, dan `visits`
- Counter kunjungan halaman menggunakan middleware server

## 3. Struktur Project

- `app/app.vue`
  - Root layout aplikasi yang memuat `Navbar` dan halaman yang di-routes melalui `NuxtPage`
- `components/navbar.vue`
  - Menu navigasi utama dengan toggle untuk tampilan mobile
- `components/dashboard.vue`
  - Halaman dashboard dengan aksi cepat, pencarian, kartu KPI, dan tabel aktivitas
- `pages/index.vue`
  - Halaman root yang merender `Dashboard`
- `pages/projects.vue`
  - Halaman daftar proyek dan ringkasan proyek
- `pages/contact.vue`
  - Halaman kontak dengan form demo
- `server/api`
  - Endpoints API Nitro untuk tugas, aktivitas, proyek, dan statistik
- `server/plugins/seed.ts`
  - Plugin Nitro yang menambahkan data contoh saat server dijalankan pertama kali
- `server/middleware/visit.ts`
  - Middleware untuk menghitung jumlah kunjungan halaman
- `server/utils/store.ts`
  - Utilitas penyimpanan data menggunakan Nitro storage
- Nitro storage
  - Sumber data runtime utama, dikelola oleh helper `server/utils/store.ts`
- `assets/css`
  - File gaya aplikasi
- `nuxt.config.ts`
  - Konfigurasi Nuxt 4

## 4. Alur Data dan API

### 4.1 Endpoint Akun dan Aktivitas

- `GET /api/activities`
  - Mengambil daftar tugas dari Nitro storage `tasks`
  - Mengembalikan objek tugas dengan properti `id`, `name`, `status`, `date`

- `GET /api/tasks`
  - Mengambil seluruh daftar tugas tanpa pemrosesan tambahan

- `POST /api/tasks`
  - Menambahkan tugas baru dengan `name` wajib
  - Menyimpan tugas ke Nitro storage `tasks`
  - Menghasilkan `id` numerik baru dan tanggal saat ini

- `GET /api/projects`
  - Mengambil daftar proyek yang diinisialisasi di Nitro storage

- `PUT /api/task/:id`
  - Memperbarui tugas yang ada berdasarkan `id`
  - Mendukung patch `name`, `status`, dan `date`

- `DELETE /api/task/:id`
  - Menghapus tugas berdasarkan `id`

### 4.2 Statistik Dashboard

- `GET /api/stats`
  - Mengambil data `tasks`, `projects`, dan `visits` dari Nitro storage
  - Menghasilkan KPI berikut:
    - Total Project
    - Task Selesai
    - Bug Terbuka (proxy sederhana menggunakan `bug` di nama atau status `todo`)
    - Pengunjung

### 4.3 Penyimpanan Data

- `server/utils/store.ts` menyediakan helper untuk membaca/menulis array di Nitro storage.
- Data disimpan menggunakan Nitro storage dengan fallback internal.
- `server/plugins/seed.ts` memastikan data awal tersedia bila belum ada.
- `server/middleware/visit.ts` meningkatkan counter `visits` setiap request yang bukan asset Nuxt.

## 5. Menjalankan Project

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

## 6. Catatan Penting

- Tautan `Projects` dan `Contact` di navbar sekarang mengarah ke halaman yang diimplementasikan di `pages/projects.vue` dan `pages/contact.vue`.
- Aplikasi ini masih prototipe dengan UI sederhana, tetapi sekarang memakai struktur halaman yang lebih konsisten.
- Semua data utama disimpan secara konsisten menggunakan Nitro storage melalui `server/utils/store.ts`.

## 7. Pengembangan Selanjutnya

Beberapa perbaikan yang bisa ditambahkan:
- Menambahkan halaman `projects` dan `contact`
- Menggunakan store global Pinia untuk pengelolaan state
- Menambahkan autentikasi pengguna
- Menyelaraskan penyimpanan data dan menambahkan API proyek lebih lengkap
- Meningkatkan UI/UX dashboard dan validasi form
