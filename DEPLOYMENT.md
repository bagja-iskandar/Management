# 🚀 Nexura Deployment & Production Readiness Guide

> **Status:** Hardened Production Guide  
> **Last Updated:** 29 Oktober 2026  
> **Platform Target:** Vercel Serverless Edge Runtime + Supabase Cloud PostgreSQL  
> **Design Pattern:** Precision Dark Obsidian Bento UI  

---

## 1. Arsitektur Lingkungan Production

```
+-----------------------------------------------------------------------+
|                             USER BROWSER                              |
|           (Precision Dark Obsidian Bento UI • Linear Inset Shell)     |
+-----------------------------------+-----------------------------------+
                                    |
                                    v HTTPS
+-----------------------------------------------------------------------+
|                    VERCEL SERVERLESS EDGE RUNTIME                     |
|        Nuxt 4 • Nitro Engine • withApiHandler • Unified Auth Gate     |
+------------------+--------------------------------+-------------------+
                   |                                |
                   v (service_role via PostgREST)   v (Octokit Proxy + 5m TTL)
+--------------------------------------+  +-----------------------------+
|        SUPABASE POSTGRESQL           |  |      GITHUB REST API v3     |
|         (Cloud Database)             |  |      (Live DevOps Stream)   |
|                                      |  |                             |
| - Row Level Security Locked Down     |  | - Actions Workflow Runs     |
| - projects (Core repositories)       |  | - Security & Dependabot     |
| - sprints (Weekly iterations)        |  | - PRs & Issues Cockpit      |
| - tasks (ENG-xxx Kanban deliverables)|  | - Global Commit Streams     |
| - project_notes (Scratchpad inbox)   |  | - Parameter Allowlist Guard |
+--------------------------------------+  +-----------------------------+
```

---

## 2. Prasyarat & Persiapan Database (Supabase)

### A. Eksekusi Skema Migrasi SQL
Sebelum mendeploy aplikasi ke Vercel, pastikan seluruh migrasi SQL dijalankan berurutan di instance Supabase Anda:
1. Buka dashboard proyek Supabase Anda: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Masuk ke menu **SQL Editor** -> **New query**.
3. Jalankan script migrasi berurutan:
   - [`server/database/migrations/001_initial.sql`](file:///d:/Project_Center/REWORK/Management/server/database/migrations/001_initial.sql) (Inisialisasi tabel dasar)
   - [`server/database/migrations/002_add_github_repo.sql`](file:///d:/Project_Center/REWORK/Management/server/database/migrations/002_add_github_repo.sql) (Kolom github_repo & allowlist)
   - [`server/database/migrations/003_system_alignment_and_rls_lockdown.sql`](file:///d:/Project_Center/REWORK/Management/server/database/migrations/003_system_alignment_and_rls_lockdown.sql) (Pencabutan hak peran anon & RLS lockdown eksklusif untuk `service_role`)
4. Klik **Run** pada setiap skrip migrasi.

---

## 3. Konfigurasi Environment Variables di Vercel

Di dashboard proyek Vercel Anda (**Settings** -> **Environment Variables**), tambahkan variabel produksi berikut:

| Key | Value / Contoh | Deskripsi | Wajib? |
| :--- | :--- | :--- | :---: |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | URL project Supabase Anda | **Ya** |
| `SUPABASE_KEY` | `eyJhbGciOi...` | Supabase Anon Key (untuk handshake awal) | **Ya** |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase `service_role` secret key (wajib untuk mutasi server backend) | **Ya** |
| `NEXURA_ACCESS_KEY` | `secure_hex_random_key` | Secret key untuk proteksi server middleware auth gate | **Ya** |
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxx` | GitHub Personal Access Token (PAT) | **Ya** |
| `GITHUB_USERNAME` | `bagja-iskandar` | Username GitHub pemilik repositori | **Ya** |
| `NODE_ENV` | `production` | Mode runtime environment | **Ya** |

> [!TIP]
> **Rekomendasi Scopes GitHub PAT**:
> - `repo` (Akses commit, PR, issues, status build private/public)
> - `workflow` (Melihat status & memicu rerun GitHub Actions CI/CD)
> - `read:packages` (Melihat Container / NPM registry)

---

## 4. Langkah-Langkah Deployment ke Vercel

### Langkah 1: Hubungkan Repository ke Vercel
1. Masuk ke [https://vercel.com](https://vercel.com) dan klik **Add New...** -> **Project**.
2. Pilih repository GitHub: `bagja-iskandar/Management` (branch `main` atau `development`).
3. Vercel akan otomatis mendeteksi framework sebagai **Nuxt.js** dengan output directory `.output`.

### Langkah 2: Build & Quality Gate Command
Konfigurasikan perintah build pada Vercel Settings:
- **Build Command:** `npm run build`
- **Output Directory:** `.output`
- **Install Command:** `npm ci`

Sebelum deployment, seluruh kode diverifikasi secara otomatis oleh GitHub Actions (`.github/workflows/ci.yml`):
- `npm run typecheck` (`vue-tsc --noEmit`)
- `npm test` (`node:test` master suite 244 tests)
- `npm run test:coverage` (Audit coverage $\ge 80\%$)

---

## 5. Kebijakan Keamanan & Ketahanan Data (Zero Silent Data Loss)

1. **Zero Silent Data Loss Policy:**
   - Di lingkungan cloud produksi (`NODE_ENV=production`), mutasi data **DILARANG KERAS** dialihkan secara diam-diam ke penyimpanan ephemeral serverless (Nitro KV).
   - Jika Supabase mengalami gangguan jaringan atau offline, backend Nitro merespons secara transparan dengan status **HTTP 503 Service Unavailable** (*fail-fast*) agar pengguna segera mengetahui dan data tidak hilang akibat pembersihan container serverless.
2. **Local Development Fallback:**
   - Di lingkungan development lokal (`NODE_ENV=development`), jika variabel `SUPABASE_URL` tidak diisi, sistem beralih ke Nitro KV (`.data/kv/`) sebagai mock store agar developer dapat bekerja secara offline tanpa internet.
3. **Data Backup Snapshot:**
   - Kapan pun diperlukan, pengguna dapat membuka halaman `/telemetry` dan mengklik tombol **Export Backup JSON** untuk mengunduh arsip snapshot penuh database.
