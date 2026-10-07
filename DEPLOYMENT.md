# 🚀 Nexura Deployment & Production Readiness Guide

Panduan resmi persiapan dan pelaksanaan deployment **Nexura (Management Dashboard)** ke lingkungan *production* (Vercel + Supabase Cloud PostgreSQL).

---

## 1. Arsitektur Lingkungan Production

```
+-----------------------------------------------------------------------+
|                             USER BROWSER                              |
|           (Dark Modern Obsidian UI • Ochre Amber HUD Cockpit)         |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    VERCEL SERVERLESS EDGE RUNTIME                     |
|                 Nuxt 4 • Nitro Engine • Zod Validation                |
+------------------+--------------------------------+-------------------+
                   |                                |
                   v                                v
+--------------------------------------+  +-----------------------------+
|        SUPABASE POSTGRESQL           |  |      GITHUB API & CI/CD     |
|         (Cloud Database)             |  |      (Live Telemetry)       |
|                                      |  |                             |
| - projects (Core repositories)       |  | - Actions Workflow Runs     |
| - sprints (Weekly deliverables)      |  | - Security & Dependabot     |
| - tasks (ENG-xxx Kanban items)       |  | - PRs & Issues Cockpit      |
| - Clean cascade triggers             |  | - Global Commit Streams     |
+--------------------------------------+  +-----------------------------+
```

---

## 2. Prasyarat & Persiapan Database (Supabase)

### A. Eksekusi Skema Migrasi SQL
Sebelum mendeploy aplikasi, pastikan tabel-tabel dan trigger telah dibuat di instance Supabase Anda:
1. Buka dashboard proyek Supabase Anda: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Masuk ke menu **SQL Editor** -> **New query**.
3. Jalankan script migrasi pertama:
   * Buka dan salin seluruh isi file: [`server/database/migrations/001_create_nexura_tables.sql`](file:///d:/Project/REWORK/Management/server/database/migrations/001_create_nexura_tables.sql)
   * Klik **Run**.
4. Jalankan script trigger pembersihan cascading:
   * Buka dan salin seluruh isi file: [`server/database/migrations/002_cascade_cleanup_trigger.sql`](file:///d:/Project/REWORK/Management/server/database/migrations/002_cascade_cleanup_trigger.sql)
   * Klik **Run**.

### B. Verifikasi & Migrasi Data Lokal (Seeding)
Jalankan perintah berikut di komputer lokal Anda untuk memverifikasi koneksi database dan menyinkronkan data proyek lokal ke Supabase:

```bash
npm run db:verify
```
*Script ini akan memvalidasi tabel `projects`, `sprints`, dan `tasks`, serta secara otomatis meng-upload data lokal jika tabel di cloud masih kosong.*

---

## 3. Langkah-Langkah Deployment ke Vercel

### Langkah 1: Hubungkan Repository ke Vercel
1. Masuk ke [https://vercel.com](https://vercel.com) dan klik **Add New...** -> **Project**.
2. Pilih repository GitHub: `bagja-iskandar/Management`.
3. Vercel akan otomatis mendeteksi framework sebagai **Nuxt.js** (Zero-configuration otomatis via Nitro engine).

### Langkah 2: Konfigurasi Environment Variables di Vercel
Di bagian **Environment Variables**, tambahkan variabel-variabel berikut:

| Key | Value / Contoh | Deskripsi | Wajib? |
| :--- | :--- | :--- | :---: |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | URL project Supabase Anda | **Ya** |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOi...` | Supabase `service_role` secret key | **Ya** |
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxx` | GitHub Personal Access Token (PAT) | **Ya** |
| `GITHUB_USERNAME` | `bagja-iskandar` | Username GitHub pemilik repo | **Ya** |
| `VERCEL_TOKEN` | `vercel_token_xxx` | Token API Vercel untuk deployment telemetry | Opsional |
| `NODE_ENV` | `production` | Environment mode | **Ya** |

> [!TIP]
> **Rekomendasi Scopes GitHub PAT**:
> * `repo` (Akses commit, PR, issues, status build private/public)
> * `workflow` (Melihat status & memicu rerun GitHub Actions CI/CD)
> * `read:packages` (Melihat Container / NPM registry)

### Langkah 3: Deploy & Quality Gate
1. Klik tombol **Deploy**.
2. Tunggu proses build selesai (~1-2 menit).
3. Vercel akan mempublikasikan situs dan memberikan URL produksi (misal: `https://nexura-management.vercel.app`).

---

## 4. Checklist Verifikasi Pasca-Deployment (Post-Deployment Checklist)

Setelah situs live, lakukan pengecekan berikut di browser:
- [ ] **Database Connection**: Buka halaman utama atau Telemetry; badge database harus menampilkan `Supabase PostgreSQL (Cloud)`.
- [ ] **CI/CD Quality Gate**: GitHub Actions workflow `.github/workflows/ci.yml` harus berjalan otomatis saat commit di-push, dan badge di dashboard menampilkan `CI: Passed`.
- [ ] **Kanban Board**: Pindahkan task antar kolom status (contoh: dari *In Queue* ke *Running Sprint*); pastikan task otomatis terikat ke active sprint tanpa mereset tag atau priority.
- [ ] **Sprints Console**: Buka `/sprints`, verifikasi Weekly Objective tersimpan dan metrics deliverables terhitung akurat.
- [ ] **Security & Commits Cockpit**: Buka tab GitHub pada detail project; pastikan data commits, PRs, dan Security Alerts ter-render secara cepat dan rapi.

---

## 5. Toleransi Kegagalan (Zero-Downtime Fallback)

Nexura dilengkapi arsitektur **Transparent Repository Proxy**:
* Jika sewaktu-waktu koneksi ke Supabase terputus atau kredensial belum tersedia, aplikasi **TIDAK AKAN CRASH** (Zero Downtime).
* Sistem secara otomatis beralih (*graceful fallback*) ke Nitro in-memory/KV store lokal untuk memastikan antarmuka tetap dapat diakses.
