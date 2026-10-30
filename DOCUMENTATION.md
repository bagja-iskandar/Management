# Dokumentasi Resmi Nexura Management — Personal Engineering Command Center

**Dokumen Referensi:** [`DOCUMENTATION.md`](file:///d:/Project/REWORK/Management/DOCUMENTATION.md)  
**Versi Sistem:** Nuxt 4.1.2 Full-Stack Engineering Platform  
**Status Arsitektur:** Hardened Single-Owner Command Center  
**Desain & UI/UX:** Precision Dark Obsidian Bento UI (Void `#07080A`, Canvas `#0B0C10`, Specular Surface `#111318`)  
**Terakhir Diperbarui:** 30 Oktober 2026 (Fase 1 UX Redesign: Contextual Action Bar Validated)  

---

## 1. Ringkasan & Hakikat Sistem

**Nexura Management** adalah *Personal Engineering Command Center* mutakhir yang dirancang khusus untuk seorang *Single-Owner / Solo Software Engineer*. Sistem ini mengintegrasikan seluruh siklus hidup pengembangan piranti lunak ke dalam satu antarmuka terpadu:
- Manajemen proyek piranti lunak (*Projects Hub* & *Cockpit*)
- Antrean deliverable teknis dengan alur kerja Kanban 5-kolom (*Tasks & Queue Workspace*)
- Catatan ide dan laporan kutu seketika (*Idea Scratchpad & Bug Inbox*)
- Siklus iterasi mingguan berbasis kalender (*Weekly Sprints*)
- Peta jalan versi rilis perangkat lunak (*Release Phase Roadmap*)
- Integrasi *DevOps Live Stream* langsung dari **GitHub REST API v3** dan **Vercel Platform**
- Diagnostik telemetri sistem dan pencadangan data instan (*Telemetry & Backup*)

### 1.1. Stack Teknologi
- **Framework Utama:** [Nuxt 4](https://nuxt.com/) (`^4.1.2`) dengan Vue 3.5, TypeScript Strict Mode, Vite Bundler, dan Tailwind CSS.
- **Serverless Engine:** Nitro Server Engine dengan format handler terpusat [`withApiHandler`](file:///d:/Project/REWORK/Management/server/utils/handler.ts) dan middleware proteksi keamanan.
- **Database Primer:** [Supabase PostgreSQL](https://supabase.com/) via `@supabase/supabase-js`, dikunci penuh dengan *Row Level Security (RLS)* untuk akses eksklusif server `service_role`.
- **DevOps Gateway:** Octokit REST client dengan caching berbasis Nitro (`defineCachedFunction`) untuk menjaga kuota Personal Access Token (PAT).
- **Desain UI/UX:** **Precision Dark Obsidian Bento Architecture** — Asymmetric Bento 8:4, palet monokromatik gelap, specular 1px borders, typography monospace Inter & JetBrains Mono.

---

## 2. Arsitektur Inti, Keamanan & State Management

```mermaid
flowchart TD
    subgraph Client["Client Browser (Nuxt 4 / Vue 3.5)"]
        Shell["app/app.vue (Root Shell & Global Modals)"]
        Store["useWorkspaceStore.ts (Singleton Nuxt useState)\n- tasks, projects, sprints, notes\n- Single coordinated hydration (initializeWorkspace)\n- Optimistic UI 0ms"]
        Omni["OmniSearchModal.vue (⌘K Command Engine)"]
    end

    subgraph NitroServer["Nitro Server Engine (server/)"]
        AuthGate["server/middleware/auth.ts\n- Enforce Bearer token / nexura_session cookie\n- Strict in production, graceful warning in dev"]
        Allowlist["server/utils/github-allowlist.ts\n- Whitelist owner bagja-iskandar & registered repos"]
        Controllers["server/api/** (withApiHandler)\n- Structured JSON, status HTTP standar"]
    end

    subgraph CloudStorage["Cloud Infrastructure & APIs"]
        SupaDB[("Supabase PostgreSQL\n- RLS anon dicabut total (REVOKE ALL)\n- Eksklusif service_role via Server\n- SSOT: tasks.sprint_id")]
        GitHubAPI["GitHub REST API v3 (Octokit Proxy)"]
    end

    Shell --> Store
    Shell --> Omni
    Store -->|HTTP + Auth Header| AuthGate
    AuthGate --> Allowlist
    AuthGate --> Controllers
    Controllers -->|service_role key| SupaDB
    Allowlist --> GitHubAPI
```

### 2.1. Keamanan & Akses Server-Side
1. **Unified Auth Gate ([`server/middleware/auth.ts`](file:///d:/Project/REWORK/Management/server/middleware/auth.ts)):**
   - Seluruh mutasi API (`POST`, `PUT`, `PATCH`, `DELETE`) di bawah `/api/**` diproteksi.
   - Memvalidasi header `Authorization: Bearer <key>` atau cookie `nexura_session`. Kunci dicocokkan dengan `NEXURA_ACCESS_KEY` atau `SUPABASE_SERVICE_ROLE_KEY`.
   - Di lingkungan development lokal dengan kunci kosong, server mengizinkan mutasi dengan log peringatan (*warning*) agar kenyamanan pengembangan lokal tetap terjaga.
2. **Supabase RLS Lockdown (Migration 003):**
   - Hak akses peran `anon` dicabut secara total dari seluruh tabel (`REVOKE ALL FROM anon`).
   - Kebijakan RLS dikunci eksklusif untuk peran `service_role` (`TO service_role USING (true) WITH CHECK (true)`).
   - Akses klien tidak lagi mengekspos instans database secara langsung; semua operasi berlangsung melalui proxy server Nitro.
3. **GitHub Allowlist ([`server/utils/github-allowlist.ts`](file:///d:/Project/REWORK/Management/server/utils/github-allowlist.ts)):**
   - Mencegah eksploitasi proxy GitHub untuk repositori luar yang tidak sah.
   - Endpoint hanya melayani repositori yang dimiliki oleh akun pemilik (`bagja-iskandar`) atau yang secara eksplisit terdaftar pada kolom `github_repo` di tabel `projects`.
4. **Zero Silent Data Loss Policy:**
   - Mekanisme failover mutasi otomatis ke ephemeral Nitro KV (`.data/kv/`) yang berisiko menghilangkan data di Vercel Serverless telah **dihapus 100%**.
   - Jika Supabase offline di lingkungan produksi, sistem melempar error HTTP 503 secara jujur dan transparan (*fail-fast*).

### 2.2. State Management Terpadu (`useWorkspaceStore.ts`)
- **Singleton Reactivity:** State kanonikal dikelola menggunakan composable [`composables/useWorkspaceStore.ts`](file:///d:/Project/REWORK/Management/composables/useWorkspaceStore.ts) berbasis Nuxt `useState`:
  - `workspace:tasks`
  - `workspace:projects`
  - `workspace:sprints`
  - `workspace:notes`
- **Single Coordinated Hydration:** Pada saat inisialisasi boot di [`app/app.vue`](file:///d:/Project/REWORK/Management/app/app.vue), fungsi `workspaceStore.initializeWorkspace()` mengeksekusi *parallel fetch* tunggal untuk mengisi seluruh store, meniadakan fragmentasi 25 kunci cache Nuxt sebelumnya.
- **Optimistic UI 0ms:** Penambahan, pembaruan status Kanban, dan penghapusan data langsung memutasi state memori lokal secara instan (0ms) sambil menyinkronkan data ke server di latar belakang.

---

## 3. Fitur Utama & Ruang Kerja (Workspaces)

### 3.1. Dashboard Command Center (`/`)
- **Specular Bento Grid (Proporsi 8:4):**
  - **Kolom Kiri (8 cols):**
    - `UnifiedHeroBanner.vue`: Menampilkan metrik honest (In Flight Deliverables, High Priority, Velocity Rate, Open PRs). *Zero Fake Metrics* — bernilai 0 jika data memang kosong.
    - `ActiveExecutionQueue.vue`: Antrean deliverable aktif dengan tab segmentasi (*All Focus*, *High / Critical*, *In Flight*). Dilengkapi clean empty state tanpa injeksi tugas palsu.
    - `LiveDevOpsStream.vue`: Aliran commit GitHub terbaru dengan penampil ringkasan commit.
  - **Kolom Kanan (4 cols):**
    - `WeeklySprintCard.vue`: Kartu sprint aktif minggu ini dengan metrik target dan hari tersisa.
    - `RecentShipmentsCard.vue`: Daftar deliverable yang berstatus `deployed` (barang yang benar-benar telah dikirim).
    - `InfrastructureMeshCard.vue`: Ringkasan konektivitas infrastruktur Supabase, GitHub, dan Vercel.

### 3.2. Tasks & Queue Workspace (`/tasks`)
- **5-Column Kanban Pipeline:**
  1. `idea` (Amber badge): Ide awal, fitur tentatif, atau temuan bug dari Scratchpad.
  2. `in_queue` (Slate): Antrean deliverable yang siap dikerjakan.
  3. `running_sprint` (Indigo): Deliverable yang aktif dieksekusi dalam sprint minggu ini.
  4. `blocked` (Rose): Deliverable yang tertahan oleh kendala eksternal atau bug kritis.
  5. `deployed` (Emerald): Deliverable yang telah selesai dan diluncurkan ke produksi.
- **Dual View Mode Switcher:** Toggle 1-klik antara papan Kanban interaktif (drag-and-drop HTML5) dan tabel densitas tinggi (*Table View*).
- **Active Focus & Checklist Panel (`components/tasks/ActiveFocusPanel.vue`):**
  - Mengagregasi seluruh deliverable yang sedang berjalan (`running_sprint`).
  - Mem-parse checklist Markdown `- [ ]` dan `- [x]`. Mengklik checkbox langsung memutasi string deskripsi tugas dan menyimpannya secara reaktif ke Supabase.
- **Idea Scratchpad Slide-Over (`components/tasks/IdeaScratchpadPanel.vue`):**
  - Slide-over panel untuk mencatat ide atau bug secara instan tanpa mengganggu alur kerja.
  - Tombol 1-klik *"Promote to Kanban"* otomatis membuat kartu tugas di kolom `idea` atau `blocked`.
- **Dynamic Project Filter:** Dropdown pemilih proyek yang terisi otomatis dari store `workspaceStore.projects`.

### 3.3. Projects Hub (`/projects`)
- Katalog seluruh repositori piranti lunak terkelola.
- **Dynamic Progress Calculation:** Menghitung persentase penyelesaian secara matematis murni: `(deployedCount / totalTasks) * 100`.
- **Project Actions:**
  - Tombol `+ New Project` pada header bar untuk membuka modal pembuatan proyek baru.
  - Opsi *Edit Project* untuk memperbarui judul, deskripsi, repo GitHub, URL deploy, dan tech stack.
  - Filter tabs: *All Projects*, *Active*, *Archived*, dan filter prioritas.

### 3.4. Project Detail Cockpit (`/projects/[slug]`)
- Tampilan detail komprehensif untuk satu proyek:
  - Header metadata proyek, tech stack badges, tautan repositori GitHub dan live deployment.
  - Matriks deliverable proyek dengan filter status.
  - Tab khusus *Notes & Scratchpad* yang terisolasi untuk proyek terkait.
  - Tab DevOps: GitHub Commits, Pull Requests & Issues, Workflows, dan Security Alerts.
  - *Graceful 404 page* jika slug yang diminta tidak ditemukan.
  - Aksi hapus proyek aman dengan modal konfirmasi ganda.

### 3.5. Sprints & Iterations (`/sprints`)
- Ruang kerja siklus iterasi mingguan.
- **SSOT Relasi Sprint:** Kolom `tasks.sprint_id` menjadi satu-satunya sumber kebenaran relasi keanggotaan deliverable. Dual-write ke array `sprints.task_ids` ditiadakan.
- Navigasi kalender rentang minggu (Senin–Minggu) dengan indikator sprint aktif.
- Klik pada deliverable langsung membuka global `<TaskDrawer />`.

### 3.6. Release Phase Roadmap (`/roadmap`)
- Visualisasi peta jalan rilis piranti lunak yang realistis bagi solo developer:
  - Kolom disusun berdasarkan fase rilis versi nyata:
    `Backlog` $\rightarrow$ `MVP / v1.0` $\rightarrow$ `v1.1` $\rightarrow$ `v2.0` $\rightarrow$ `Released`
  - Proyek dan deliverable dikelompokkan berdasarkan kolom `projects.release_phase`.

### 3.7. Repositories Catalog (`/repos`)
- Katalog repositori GitHub milik pengguna (`bagja-iskandar`).
- **Katalog Ringan:** Pemangkasan ~340 baris kode duplikasi inspector internal; repositori terkelola langsung terhubung ke halaman detail proyek `/projects/:slug`.
- **Strict Repository Matching:** Memastikan pencocokan tepat (`repo.fullName.toLowerCase() === project.githubRepo.toLowerCase()`).
- Aksi 1-klik *"Import as Managed Project"* untuk mendaftarkan repositori ke Supabase.
- Aksi *"Detach"* yang aman dan non-destruktif (`updateProject(slug, { githubRepo: null })`), tanpa menghapus baris proyek atau tugas.

### 3.8. Telemetry & DevOps Health (`/telemetry`)
- Pusat observabilitas dan integritas sistem:
  - Live ping latensi nyata ke Supabase PostgreSQL (milidetik).
  - Monitoring kuota REST API GitHub rate limits.
  - Deteksi runtime environment aktual (*Development* vs *Production*).
  - Tombol **Export Backup JSON** untuk mengunduh seluruh salinan data workspace (`projects`, `tasks`, `sprints`, `project_notes`).

### 3.9. Global OmniSearch & Command Engine (`⌘K`)
- Modal pencarian terpadu ala Linear / Raycast:
  - Shortcut keyboard global `⌘K` / `Ctrl+K` untuk membuka; tombol `Esc` untuk menutup.
  - Pencarian fuzzy seketika melintasi tugas, proyek, sprint, repositori, dan navigasi cepat.
  - Deep linking yang benar: memilih deliverable membuka `<TaskDrawer />` global seketika.
  - Sanitasi protokol URL eksternal dengan pengaman `rel="noopener noreferrer"`.

---

## 4. Rencana Kerja Remediasi Arsitektur (13 Fase Mandiri / 3 Blok)

Sesuai arahan dan persetujuan Pemilik Proyek, rencana remediasi dibagi ke dalam **13 Fase Mandiri** dalam **3 Blok Logis** (1 Halaman = 1 Fase Mandiri):

| Blok | Fase | Ruang Lingkup & Fokus Utama | Status Aktual |
| :--- | :--- | :--- | :--- |
| **BLOK 1** | **Fase 0** | **Security Lockdown, Database Alignment & Core Safety**<br>- Migration 003 (`idea`, `project_notes`, `release_phase`)<br>- Supabase RLS lockdown ke `service_role`<br>- Auth middleware (`server/middleware/auth.ts`) & GitHub allowlist<br>- Perbaikan bug destruktif detach di `repos.vue`<br>- Eliminasi silent KV mutation fallback | **100% SELESAI & TERVERIFIKASI** |
| **BLOK 1** | **Fase 1** | **Global Workspace Store & Shell Infrastructure**<br>- Canonical store `useWorkspaceStore.ts` via Nuxt `useState`<br>- Single coordinated hydration saat boot di `app.vue`<br>- Backend API Notes/Scratchpad (`/api/notes/**`)<br>- Global modal shell mounting di `app.vue` | **100% SELESAI & TERVERIFIKASI** |
| **BLOK 1** | **Fase 2** | **Global OmniSearch & Command Engine (`⌘K`)**<br>- Sanitasi protokol URL eksternal (`NEW-SEC-01`)<br>- Deep linking membuka `<TaskDrawer />`<br>- Standarisasi keyboard shortcut (`Esc`, `⌘K`) | **100% SELESAI & TERVERIFIKASI** |
| **BLOK 2** | **Fase 3** | **Halaman Tasks & Queue Workspace (`/tasks`)**<br>- Full 5-column Kanban board (`idea` $\rightarrow$ `deployed`)<br>- View mode switcher (Kanban vs Table)<br>- Companion panel Active Focus checklist (`- [ ]` <-> `- [x]`)<br>- Slide-over Idea Scratchpad & Promote to Kanban<br>- Eliminasi fallback fiktif `Unassigned` & `No Due Date` | **PENDING REVIEW & POLISH** |
| **BLOK 2** | **Fase 4** | **Halaman Dashboard Command Center (`/`)**<br>- Pembersihan total angka palsu (14, 3, 78%) di `UnifiedHeroBanner.vue`<br>- Clean empty state pada `ActiveExecutionQueue.vue`<br>- `RecentShipmentsCard.vue` strictly deployed tasks | **PENDING** |
| **BLOK 2** | **Fase 5** | **Halaman Projects Hub (`/projects`)**<br>- Pemasangan tombol `+ New Project`<br>- Pembuatan komponen `<EditProjectModal />`<br>- Kalkulasi matematis progres dinamis dari `workspaceStore.tasks` | **PENDING** |
| **BLOK 2** | **Fase 6** | **Halaman Project Detail Cockpit (`/projects/[slug]`)**<br>- Hapus tab internal Supabase (`PDET-002`)<br>- Penambahan tab Notes/Scratchpad per proyek<br>- Graceful 404 page & modal konfirmasi hapus ganda | **PENDING** |
| **BLOK 2** | **Fase 7** | **Halaman Sprints & Iterations (`/sprints`)**<br>- Migrasi relasi ke SSOT `tasks.sprint_id` (hapus dual-write)<br>- Perbaikan kalender navigasi rentang minggu<br>- Integrasi klik kartu tugas ke `<TaskDrawer />` | **PENDING** |
| **BLOK 2** | **Fase 8** | **Halaman Release Phase Roadmap (`/roadmap`)**<br>- Rebuild kolom menjadi Release Phases (`Backlog` $\rightarrow$ `MVP` $\rightarrow$ `v1.1` $\rightarrow$ `v2.0` $\rightarrow$ `Released`)<br>- Pemetaan proyek dan milestone ke release phase | **PENDING** |
| **BLOK 2** | **Fase 9** | **Halaman Repositories Catalog (`/repos`)**<br>- Pemangkasan ~340 baris duplikasi tab inspector GitHub<br>- Strict repository matching (`REPO-002`)<br>- Pagination `per_page=100` & 1-klik Import as Managed Project | **PENDING** |
| **BLOK 2** | **Fase 10** | **Halaman Telemetry & DevOps Health (`/telemetry`)**<br>- Live ping riil ke Supabase & GitHub rate limits (`TELE-001`)<br>- Indikator runtime environment aktual<br>- Tombol Export Backup JSON seluruh tabel | **PENDING** |
| **BLOK 3** | **Fase 11** | **Otomasi Lanjutan & GitHub Sync**<br>- Deteksi kode `ENG-xxx` pada commit/PR & auto-move ke `deployed`<br>- Modal 1-klik Confirmed Sprint Rollover (`AUTO-002`) | **PENDING** |
| **BLOK 3** | **Fase 12** | **CI/CD Quality Gate & Automated Tests**<br>- Konfigurasi framework Vitest & 6 test suites<br>- Integrasi pipeline `.github/workflows/ci.yml` (typecheck + test + build) | **PENDING** |
| **BLOK 3** | **Fase 13** | **Dead Code Pruning & Final Audit Sign-Off**<br>- Hapus `app/pages/focus.vue` & `server/middleware/visit.ts`<br>- Audit regresi end-to-end seluruh 8 rute<br>- Sign-off resmi pemilik proyek | **PENDING** |

---

## 5. Dokumentasi REST API

Seluruh endpoint API berada di bawah `/api/**` dan dibungkus oleh penanganan seragam [`withApiHandler`](file:///d:/Project/REWORK/Management/server/utils/handler.ts). Operasi mutasi (`POST`, `PUT`, `PATCH`, `DELETE`) dilindungi oleh [`server/middleware/auth.ts`](file:///d:/Project/REWORK/Management/server/middleware/auth.ts).

### 5.1. Tasks & Deliverables API
| Method | Path | Auth Required | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Tidak | Mengambil daftar tugas (dapat difilter via `projectSlug`, `status`, `priority`). |
| `POST` | `/api/tasks` | **Ya** | Membuat tugas baru (auto-generates format ID `ENG-xxx`). |
| `GET` | `/api/tasks/:id` | Tidak | Mengambil detail deliverable berdasarkan UUID atau `task_id`. |
| `PUT` | `/api/tasks/:id` | **Ya** | Memperbarui atribut tugas (status, prioritas, sprintId, deskripsi checklist). |
| `DELETE` | `/api/tasks/:id` | **Ya** | Menghapus tugas dari sistem. |

### 5.2. Projects API
| Method | Path | Auth Required | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Tidak | Mengambil daftar seluruh proyek terdaftar. |
| `POST` | `/api/projects` | **Ya** | Mendaftarkan proyek baru (membutuhkan `title`, `slug`). |
| `GET` | `/api/projects/:slug` | Tidak | Mengambil metadata lengkap proyek berdasarkan slug. |
| `PUT` | `/api/projects/:slug` | **Ya** | Memperbarui metadata proyek (title, description, githubRepo, deployUrl, releasePhase). |
| `DELETE` | `/api/projects/:slug` | **Ya** | Menghapus proyek dari sistem (cascade delete deliverables). |

### 5.3. Sprints API
| Method | Path | Auth Required | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sprints` | Tidak | Mengambil daftar seluruh siklus sprint. |
| `POST` | `/api/sprints` | **Ya** | Membuat siklus sprint baru (name, startDate, endDate). |
| `PUT` | `/api/sprints/:id` | **Ya** | Memperbarui detail sprint atau menutup status sprint. |

### 5.4. Notes & Scratchpad API
| Method | Path | Auth Required | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notes` | Tidak | Mengambil daftar catatan ide/bug (dapat difilter via `projectSlug`). |
| `POST` | `/api/notes` | **Ya** | Menambahkan catatan ide baru (`projectSlug`, `category: 'idea'|'bug'|'maintenance'`, `content`). |
| `PUT` | `/api/notes/:id` | **Ya** | Memperbarui isi catatan atau menandai referensi `promoted_task_id`. |
| `DELETE` | `/api/notes/:id` | **Ya** | Menghapus catatan dari scratchpad. |

### 5.5. GitHub Gateway Proxy
| Method | Path | Auth Required | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/github/repos` | Tidak | Mengambil katalog repositori akun pemilik (cached 5 menit). |
| `GET` | `/api/github/commits` | Tidak | Mengambil daftar commit terbaru (`?repo=owner/repo`). |
| `GET` | `/api/github/branches` | Tidak | Mengambil daftar branch pada repositori. |
| `POST` | `/api/github/create-issue` | **Ya** | Membuat issue GitHub baru (terlindungi allowlist repositori). |
| `POST` | `/api/github/workflow-rerun` | **Ya** | Memicu rerun GitHub Actions (terlindungi allowlist repositori). |

### 5.6. Telemetry & Backup API
| Method | Path | Auth Required | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/telemetry` | Tidak | Live ping latensi Supabase, status rate-limit GitHub, dan deteksi environment. |
| `GET` | `/api/backup/export` | **Ya** | Mengunduh payload dump JSON seluruh tabel database. |

---

## 6. Struktur Direktori Proyek

```
Management/
├── .github/
│   └── workflows/ci.yml             # Pipeline GitHub Actions (typecheck, test, build)
├── app/
│   ├── app.vue                      # Root Layout & Global Modals Mount Point
│   └── pages/                       # Halaman Rute Nuxt
│       ├── index.vue                # / (Dashboard Command Center)
│       ├── tasks.vue                # /tasks (Full 5-Column Kanban & Queue)
│       ├── projects/
│       │   ├── index.vue            # /projects (Projects Hub)
│       │   └── [slug].vue           # /projects/:slug (Project Detail Cockpit)
│       ├── sprints.vue              # /sprints (Weekly Iterations & Calendar)
│       ├── roadmap.vue              # /roadmap (Release Phase Roadmap)
│       ├── repos.vue                # /repos (Repositories Catalog & Importer)
│       └── telemetry.vue            # /telemetry (DevOps Health & Backup)
├── assets/css/
│   └── main.css                     # Tailwind directives & Dark Obsidian styles
├── components/                      # Komponen Vue 3.5 Dark Obsidian Bento
│   ├── Dashboard.vue                # Dashboard Cockpit View
│   ├── KanbanBoard.vue              # Papan Kanban 5-Kolom
│   ├── TaskDrawer.vue               # Global Drawer Deliverable Inspector
│   ├── AddTaskModal.vue             # Modal Global Pembuatan Tugas
│   ├── AddProjectModal.vue          # Modal Global Pembuatan Proyek
│   ├── EditProjectModal.vue         # Modal Global Penyuntingan Proyek (Fase 5)
│   ├── dashboard/                   # Subkomponen Dashboard Bento
│   ├── kanban/                      # Subkomponen Papan Kanban
│   ├── tasks/                       # Companion Panels (Active Focus & Scratchpad)
│   ├── project/                     # Subkomponen Detail Proyek
│   ├── sprint/                      # Subkomponen Iterasi Mingguan
│   └── search/                      # Subkomponen OmniSearch (⌘K)
├── composables/                     # Reactive Vue Composables
│   ├── useWorkspaceStore.ts         # Singleton Workspace Store (SSOT)
│   ├── useTaskDrawer.ts             # State Pengendali TaskDrawer
│   ├── useQuickTask.ts              # State Pengendali AddTaskModal
│   ├── useOmniSearch.ts             # State & Logika Pencarian Cepat ⌘K
│   ├── useTasks.ts                  # Tasks API Client
│   ├── useProjects.ts               # Projects API Client
│   ├── useSprints.ts                # Sprints API Client
│   └── useGitHub.ts                 # GitHub Gateway Client
├── docs/                            # Dokumentasi Resmi & Rencana Kerja
│   ├── master-remediation-plan.md   # Master Remediation Plan (13 Fase)
│   ├── management-system-audit.md   # Audit Awal Sistem
│   └── nexura-requirements-and-reaudit.md # Dokumen Spesifikasi Kebutuhan
├── server/                          # Nitro Backend Serverless Engine
│   ├── api/                         # REST API Endpoints
│   ├── database/migrations/         # Skrip SQL Migration Supabase
│   ├── middleware/                  # Server Middleware (auth.ts - auth gate mutasi)
│   ├── plugins/                     # Server Plugins (seed.ts - idempotent initialization)
│   ├── repositories/                # Storage Repositories (Supabase PostgREST & Nitro KV)
│   ├── schemas/                     # Zod Validation Schemas
│   └── utils/                       # Server Utilities (handler, allowlist, note, errors)
├── tests/                           # Master Automated Test Suite
│   └── unit/                        # 19 Test Suites (259 Tests Passing, Node Test Runner)
├── types/                           # Definisi Tipe TypeScript
├── DOCUMENTATION.md                 # Dokumentasi Lengkap Sistem
├── nuxt.config.ts                   # Konfigurasi Nuxt 4
└── package.json                     # Manifest Dependensi & Skrip NPM
```

---

## 7. Panduan Instalasi & Pengoperasian

### 7.1. Prasyarat Lingkungan
- **Node.js:** Versi 20.x atau lebih baru.
- **NPM:** Versi 10.x atau lebih baru.
- **Akun Supabase:** Proyek Supabase dengan ekstensi SQL aktif.
- **GitHub Personal Access Token:** Token GitHub (minimal scope `repo`, `workflow`, `read:packages`).

### 7.2. Konfigurasi File Lingkungan (`.env`)
Buat file `.env` di akar direktori proyek dengan menyalin contoh berikut:

```env
# GitHub API Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=bagja-iskandar

# Supabase PostgreSQL Configuration
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOi...              # Anon / Publishable Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Wajib untuk mutasi server backend

# Nexura Server Security Gate
NEXURA_ACCESS_KEY=your_secure_random_hex_key_here

# Runtime Environment
NODE_ENV=development
```

### 7.3. Menjalankan Skrip Pengembangan
```bash
# 1. Instalasi dependensi
npm install

# 2. Menjalankan server pengembangan lokal (Hot Module Replacement)
npm run dev
# Akses melalui peramban di http://localhost:3000

# 3. Pemeriksaan tipe TypeScript (Static Typecheck)
npm run typecheck

# 4. Menjalankan pengujian otomatis (Master Test Suite: 259 tests)
npm test

# 5. Menjalankan pengujian dengan audit Code Coverage (Target >= 80%)
npm run test:coverage

# 6. Membangun bundle produksi (Nitro / Vercel Preset)
npm run build
```

---

## 8. Panduan Kontribusi & Protokol Kode (Code Protocol)

1. **Prinsip Zero-Tolerance Data Honesty (`UX-002`):**  
   Dilarang keras menyuntikkan angka sintetis atau fallback fiktif saat data bernilai 0. Tampilkan angka 0 murni dan render empty state visual yang tenang dan informatif.
2. **Prinsip Styling Freeze (Dark Obsidian Bento UI):**  
   Dilarang menghapus atau mengubah token visual gelap pada `assets/css/` atau struktur Bento Grid tanpa persetujuan eksplisit pemilik proyek.
3. **Prinsip Single Source of Truth Storage:**  
   Gunakan repositori Supabase secara terpusat. Jangan pernah menyuntikkan fallback mutasi diam-diam ke penyimpanan ephemeral serverless.
4. **Prinsip Clickable References:**  
   Seluruh referensi file dalam dokumentasi dan laporan teknis wajib menggunakan format markdown link yang dapat diklik (*clickable markdown links*).
