# Master Remediation & Architectural Alignment Plan: Nexura Management
**Dokumen Referensi Resmi:** [`docs/master-remediation-plan.md`](file:///d:/Project/REWORK/Management/docs/master-remediation-plan.md)  
**Peran & Otoritas:** Documentation & Architecture Lead, Nexura Management  
**Status Dokumen:** ADAPTED & ALIGNED — 13 INDEPENDENT PHASES ACROSS 3 LOGICAL BLOCKS  
**Baseline Dokumen:** [`docs/management-system-audit.md`](file:///d:/Project/REWORK/Management/docs/management-system-audit.md) & [`docs/nexura-requirements-and-reaudit.md`](file:///d:/Project/REWORK/Management/docs/nexura-requirements-and-reaudit.md)  
**Lingkup Kode:** Full-Stack Nuxt 4 (`^4.1.2`, Vue 3.5 + Nitro Engine), Supabase PostgreSQL, GitHub REST API v3, Vercel Serverless  
**Tanggal Penetapan:** 25 Oktober 2026  

---

## 1. Executive Summary & Latar Belakang Arsitektur

### 1.1. Hakikat dan Karakteristik Nexura Management
**Nexura Management** dirancang sebagai sebuah **Personal Engineering Command Center** yang terintegrasi untuk seorang *Single-Owner / Solo Software Engineer*. Sistem ini menggabungkan manajemen proyek piranti lunak, antrean deliverable teknis (*Task Deliverables*), siklus iterasi mingguan (*Weekly Sprints*), pemetaan versi rilis (*Release Phase Roadmap*), penangkapan ide dan *bug log* seketika (*Idea Scratchpad & Bug Inbox*), serta integrasi telemetri *DevOps* langsung dari **GitHub REST API v3** dan **Vercel Edge Platform**, dengan persistensi cloud pada **Supabase PostgreSQL**.

Arsitektur aplikasi dibangun di atas fondasi:
1. **Frontend Layer:** Nuxt 4 (`^4.1.2`) dengan Vue 3.5, TypeScript strict mode, Vite bundler, dan Tailwind CSS.
2. **Serverless Engine:** Nitro Server Engine yang menyediakan antarmuka API REST seragam (`/api/**`) dibungkus oleh utilitas penanganan terpusat [`withApiHandler`](file:///d:/Project/REWORK/Management/server/utils/handler.ts).
3. **Penyimpanan Utama:** Supabase PostgreSQL yang terkelola via `@supabase/supabase-js`.
4. **DevOps Proxy:** Octokit REST client dengan *caching* server-side (`defineCachedFunction`) untuk menjaga efisiensi batas kuota GitHub Personal Access Token (PAT).

---

### 1.2. Koreksi Arsitektural Pemilik Proyek: Dari 4 Fase Menjadi 13 Fase Terpadu (3 Blok)
Rencana awal 4 fase yang dipadatkan dinilai oleh Pemilik Proyek terlalu berisiko (*crammed*), menggabungkan terlalu banyak perombakan halaman ke dalam satu gelombang implementasi yang mempersulit penelusuran regresi. 

Untuk memastikan remediasi berjalan presisi, aman, dan dapat diaudit secara transparan, arsitektur rencana kerja ditata ulang secara tegas menjadi **3 Blok Logis** dan **13 Fase Mandiri (1 Halaman = 1 Fase Remediasi Mandiri)**:

```mermaid
flowchart TD
    subgraph BLOK1["BLOK 1: FONDASI ARSITEKTUR & FITUR GLOBAL"]
        P0["Fase 0: Security Lockdown & Database Alignment (100% Selesai)"]
        P1["Fase 1: Global Workspace Store & Shell Infrastructure (100% Selesai)"]
        P2["Fase 2: Global OmniSearch & Command Engine (100% Selesai)"]
        P0 --> P1 --> P2
    end

    subgraph BLOK2["BLOK 2: REMEDIASI 1 HALAMAN PER FASE"]
        P3["Fase 3: Tasks & Queue Workspace (100% Selesai)"]
        P4["Fase 4: Dashboard Command Center (100% Selesai)"]
        P5["Fase 5: Projects Hub (100% Selesai)"]
        P6["Fase 6: Project Detail Cockpit (100% Selesai)"]
        P7["Fase 7: Sprints & Iterations (100% Selesai)"]
        P8["Fase 8: Release Phase Roadmap (100% Selesai)"]
        P9["Fase 9: Repositories Catalog (100% Selesai)"]
        P10["Fase 10: Telemetry & DevOps Health (100% Selesai)"]
        P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9 --> P10
    end

    subgraph BLOK3["BLOK 3: OTOMASI SISTEM, PENGUJIAN & SIGN-OFF"]
        P11["Fase 11: Otomasi Lanjutan & GitHub Sync (100% Selesai)"]
        P12["Fase 12: CI/CD Quality Gate & Automated Tests (100% Selesai)"]
        P13["Fase 13: Dead Code Pruning & Final Audit Sign-Off (100% Selesai)"]
        P11 --> P12 --> P13
    end

    BLOK1 --> BLOK2 --> BLOK3
```

---

### 1.3. Status UI/UX "Dark Obsidian Bento" yang Aktif & Wajib Dilindungi (Styling Freeze Rule)
Pohon kerja (*working tree*) saat ini memiliki antarmuka pengguna presisi bertema **Dark Obsidian Bento UI** (proporsi Bento Grid 8:4, palet monokromatik gelap void `#07080A`, inset canvas `#0B0C10`, specular surface `#111318`, aksen border halus `border-white/[0.06]`, *monospace typography badges*, serta custom obsidian scrollbars).

> [!IMPORTANT]
> **Protokol Perlindungan Desain (UI/UX Freeze Rule):**  
> Seluruh pekerjaan remediasi arsitektur, keamanan, skema database, dan repositori backend **DILARANG KERAS** merombak estetika visual, menghapus token CSS pada [`assets/css/`](file:///d:/Project/REWORK/Management/assets/css/), atau membatalkan perbaikan yang telah berjalan pada komponen:
> - [`components/Dashboard.vue`](file:///d:/Project/REWORK/Management/components/Dashboard.vue)
> - [`components/dashboard/UnifiedHeroBanner.vue`](file:///d:/Project/REWORK/Management/components/dashboard/UnifiedHeroBanner.vue)
> - [`components/dashboard/ActiveExecutionQueue.vue`](file:///d:/Project/REWORK/Management/components/dashboard/ActiveExecutionQueue.vue)
> - [`components/dashboard/RecentShipmentsCard.vue`](file:///d:/Project/REWORK/Management/components/dashboard/RecentShipmentsCard.vue)
> - [`components/dashboard/InfrastructureMeshCard.vue`](file:///d:/Project/REWORK/Management/components/dashboard/InfrastructureMeshCard.vue)
> - [`components/OmniSearchModal.vue`](file:///d:/Project/REWORK/Management/components/OmniSearchModal.vue) & [`components/search/`](file:///d:/Project/REWORK/Management/components/search/)
> - [`composables/useOmniSearch.ts`](file:///d:/Project/REWORK/Management/composables/useOmniSearch.ts) & [`composables/useQuickTask.ts`](file:///d:/Project/REWORK/Management/composables/useQuickTask.ts)
>
> Seluruh remediasi teknis wajib disuntikkan secara non-destruktif di bawah lapisan komponen visual ini (*plug underneath, preserve the shell*).

---

### 1.4. Diagram Arsitektur: Saat Ini (Flawed/Fragmented) vs Target (Hardened/Unified)

#### A. Arsitektur Sebelum Remediasi (Kondisi Rentan & Terfragmentasi)
Sistem mengalami pemisahan status (*split-brain*), ketiadaan autentikasi, eksposur URL Supabase ke klien, kebocoran PostgREST publik via RLS terbuka, dan fragmentasi 25 kunci cache Nuxt:

```mermaid
flowchart TD
    subgraph ClientCurrent["Client Browser (Nuxt 4 / Vue 3.5)"]
        UI_Current["9 File Rute (/, /tasks, /projects, /repos, /sprints, dll.)"]
        DisjointCache["25+ Disjoint Cache Keys (useLazyAsyncData)\n- tasks-data, tasks-page, omni-tasks, sidebar-tasks...\n- Multiplikasi 11 concurrent HTTP requests saat boot"]
        FakeMetrics["Synthetic Fallback UI Logic\n- 14 in flight, 3 high priority, 78% velocity\n- 75%, 90% progress via slug regex matching"]
        ClientExposure["Exposure: runtimeConfig.public.supabaseUrl\n- Direct PostgREST probing risk"]
    end

    subgraph ServerCurrent["Nitro Server Layer (Vercel Serverless)"]
        NoAuth["MISSING AUTHENTICATION (SEC-001)\n- Semua endpoint /api/** terbuka untuk publik"]
        UnrestrictedGH["GitHub Endpoints (INT-002)\n- create-issue & workflow-rerun terima arbitrary repo"]
        ProxyFailover["Dynamic Dual-Adapter Failover (SEC-003 / DATA-001)\n- markSupabaseOffline() timeout 60 detik\n- Silent rerouting ke .data/kv/ tanpa notifikasi"]
    end

    subgraph StorageCurrent["Penyimpanan Terfragmentasi"]
        SupaDB_Open[("Supabase PostgreSQL\nRLS: USING (true) WITH CHECK (true)\nPeran anon memiliki hak penuh (SEC-002)")]
        NitroKV_Ephemeral[("Nitro Storage (.data/kv/)\nEphemeral Storage pada Vercel Serverless\nDATA LOSS: Hilang permanen saat container freeze")]
        GitHub_Raw["GitHub REST API v3 (Eksposur Token Server)"]
    end

    UI_Current --> DisjointCache
    DisjointCache -->|11x Parallel Requests| NoAuth
    DisjointCache -.->|Bypass Server| SupaDB_Open
    NoAuth --> UnrestrictedGH
    NoAuth --> ProxyFailover
    ProxyFailover -->|Jika Normal| SupaDB_Open
    ProxyFailover -.->|Jika Gangguan Jaringan (60s)| NitroKV_Ephemeral
    UnrestrictedGH --> GitHub_Raw
```

#### B. Arsitektur Target (Kondisi Kokoh, Terpadu & Jujur)
Arsitektur target mengeliminasi *split-brain*, memusatkan status pada reactive store Nuxt `useState`, mengunci autentikasi server-side dan Supabase RLS, serta menerapkan prinsip **Zero-Tolerance Data Honesty**:

```mermaid
flowchart TD
    subgraph ClientTarget["Client Layer (Dark Obsidian Bento UI Protected)"]
        ShellTarget["app/app.vue (Global Modals: TaskDrawer, AddTaskModal, AddProjectModal, EditProjectModal)"]
        StoreTarget["Unified Reactive Workspace Store (composables/useWorkspaceStore.ts)\n- Canonical state via useState()\n- Coordinated hydration at boot (initializeWorkspace)\n- Optimistic UI update 0ms"]
        HonestUI["Zero-Tolerance Data Honesty (UX-002)\n- Render 0 saat 0; clean empty states\n- Real calculated metrics: (deployed/total) * 100"]
    end

    subgraph ServerTarget["Nitro Server Layer (Hardened Security)"]
        AuthGate["server/middleware/auth.ts (SEC-001)\n- Bearer token / nexura_session cookie verification\n- Enforce key in production; safe fallback in dev"]
        GHAllowlist["server/utils/github-allowlist.ts (INT-002)\n- Strict allowlist: GITHUB_USERNAME & projects.github_repo"]
        StaticRepo["server/repositories/index.ts (Static Selection at Boot)\n- Production Mode: Supabase (Service Role Only)\n- Local Offline Mode: Nitro KV (hanya jika no creds)\n- NO DYNAMIC FALLBACK: Fail-fast HTTP 503"]
    end

    subgraph StorageTarget["Persistensi Terproteksi (Single Source of Truth)"]
        SupaDB_Locked[("Supabase PostgreSQL\n- RLS anon dicabut total (REVOKE ALL)\n- Akses eksklusif service_role via Server Backend\n- Relasi SSOT: tasks.sprint_id\n- Table project_notes & release_phase v1.0/v2.0")]
        GitHub_Safe["GitHub REST API v3 (Protected Proxy with Octokit Caching)"]
    end

    ShellTarget --> StoreTarget
    StoreTarget -->|HTTP + Bearer / Cookie| AuthGate
    AuthGate --> GHAllowlist
    AuthGate --> StaticRepo
    StaticRepo -->|Service Role Key Only| SupaDB_Locked
    GHAllowlist --> GitHub_Safe
```

---

## 2. Matriks Revalidasi Audit & Temuan Real Codebase

Berdasarkan investigasi statis terhadap seluruh baris kode aktual pada repositori, berikut adalah status terverifikasi resmi (*Evidence-Based Verification*):

| ID Temuan | Klasifikasi | Status Terverifikasi Aktual | Tingkat Keparahan | Lokasi File & Baris Kode | Dampak Nyata pada Sistem | Strategi Remediasi Teknis |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Security | **RESOLVED (Fase 0)** | **Critical (P0)** | [`server/middleware/auth.ts`](file:///d:/Project/REWORK/Management/server/middleware/auth.ts) | Endpoint mutasi terbuka publik tanpa autentikasi. | Pasang auth middleware yang memvalidasi header Bearer token atau cookie sesi `nexura_session`. |
| **SEC-002** | Security | **RESOLVED (Fase 0)** | **Critical (P0)** | [`server/database/migrations/003_system_alignment_and_rls_lockdown.sql`](file:///d:/Project/REWORK/Management/server/database/migrations/003_system_alignment_and_rls_lockdown.sql) | Anon key memiliki hak penuh PostgREST. | Jalankan Migration 003: cabut hak `anon`, batasi akses PostgREST eksklusif untuk `service_role`. |
| **INT-002** | Security | **RESOLVED (Fase 0)** | **Critical (P0)** | [`server/utils/github-allowlist.ts`](file:///d:/Project/REWORK/Management/server/utils/github-allowlist.ts) | Menerima parameter `repo` sembarang pada endpoint GitHub. | Bangun allowlist repositori: tolak repo di luar milik pemilik (`bagja-iskandar`) atau yang terdaftar di database. |
| **REPO-001** | Data Destruction | **RESOLVED (Fase 0)** | **Critical (P0)** | [`app/pages/repos.vue`](file:///d:/Project/REWORK/Management/app/pages/repos.vue) | Tombol "Detach" menghapus proyek dan memutus tugas secara destruktif. | Ganti aksi detach menjadi `projectsApi.updateProject(slug, { githubRepo: null })`. |
| **REPO-002** | Data Safety | **RESOLVED (Fase 9)** | **High (P1)** | [`app/pages/repos.vue`](file:///d:/Project/REWORK/Management/app/pages/repos.vue) | Fuzzy matching `p.slug === repoName` salah menautkan proyek generik. | Cocokkan secara ketat hanya pada: `p.githubRepo && p.githubRepo.toLowerCase() === repo.fullName.toLowerCase()`. |
| **SEC-003** / **DATA-001** | Data Loss | **RESOLVED (Fase 0)** | **Critical (P0)** | [`server/repositories/supabase/*.ts`](file:///d:/Project/REWORK/Management/server/repositories/supabase/) | Gangguan jaringan memicu failover ke ephemeral Nitro KV (data hilang di Vercel). | Hapus `this.fallback` pada penulisan mutasi; lempar error HTTP 503 secara transparan. |
| **SEC-004** | Security | **RESOLVED (Fase 12)** | **Medium (P1)** | [`server/repositories/supabase/supabase-task.repository.ts`](file:///d:/Project/REWORK/Management/server/repositories/supabase/supabase-task.repository.ts) | Interpolasi string mentah pada PostgREST query DSL `.or()`. | Gunakan pemilahan deterministik: jika `ENG-xxx` cari via `task_id`; jika UUID cari via `id`. |
| **ARCH-001** | Architecture | **RESOLVED (Fase 1)** | **High (P1)** | [`composables/useWorkspaceStore.ts`](file:///d:/Project/REWORK/Management/composables/useWorkspaceStore.ts) | 25 kunci cache Nuxt terfragmentasi dan 11 request paralel saat boot. | Bangun Singleton Reactive Workspace Store dengan `useState` dan single coordinated hydration. |
| **SPRI-001** | Data Integrity | **RESOLVED (Fase 7)** | **High (P1)** | [`app/pages/sprints.vue`](file:///d:/Project/REWORK/Management/app/pages/sprints.vue) | Hubungan ganda `tasks.sprint_id` dan `sprints.task_ids[]` memicu desinkronisasi. | Jadikan `tasks.sprint_id` sebagai Single Source of Truth (SSOT). Turunkan `sprint.taskIds` secara dinamis. |
| **DASH-001** | Data Honesty | **RESOLVED (Fase 4)** | **Critical (P0)** | [`components/dashboard/UnifiedHeroBanner.vue`](file:///d:/Project/REWORK/Management/components/dashboard/UnifiedHeroBanner.vue) | Merender metrik palsu (14 in flight, 3 high priority, 78% velocity). | Ganti fallback palsu dengan nilai 0 murni dan render honest empty states. |
| **PROJ-001** | Data Honesty | **RESOLVED (Fase 5)** | **Critical (P0)** | [`app/pages/projects/index.vue`](file:///d:/Project/REWORK/Management/app/pages/projects/index.vue) | Progres di-hardcode (75%, 90%) berdasarkan regex slug. | Hitung dinamis dari array tasks: `Math.round((deployedCount / totalTasks) * 100) || 0`. |
| **PROJ-002** | Functional Gap | **RESOLVED (Fase 5)** | **High (P1)** | [`app/pages/projects/index.vue`](file:///d:/Project/REWORK/Management/app/pages/projects/index.vue) | Tombol "+ New Project" tidak ada di header bar sehingga modal tidak bisa dibuka. | Tambahkan tombol "+ New Project" pada header bar halaman dan hubungkan ke modal global. |
| **PROJ-004** | Functional Gap | **RESOLVED (Fase 5)** | **Medium (P1)** | [`components/EditProjectModal.vue`](file:///d:/Project/REWORK/Management/components/EditProjectModal.vue) | Tidak ada modal untuk menyunting metadata proyek. | Buat komponen `<EditProjectModal />` dan integrasikan ke alur edit proyek. |
| **TELE-001** | Data Honesty | **RESOLVED (Fase 10)** | **Medium (P1)** | [`server/api/telemetry.get.ts`](file:///d:/Project/REWORK/Management/server/api/telemetry.get.ts) | Mengembalikan `connected: true` tanpa ping riil; melaporkan status Live di dev. | Lakukan live ping ke Supabase dan GitHub rate-limit API; laporkan environment sebenarnya. |
| **TASK-004** | Data Honesty | **RESOLVED (Fase 3)** | **Medium (P1)** | [`app/pages/tasks.vue`](file:///d:/Project/REWORK/Management/app/pages/tasks.vue) | Default proyek `'management'` dan tanggal kosong `'Sep 2026'`. | Tampilkan `'Unassigned'` untuk tugas tanpa proyek dan `'No Due Date'` untuk tugas tanpa tanggal. |
| **OMNI-001** | Functional Gap | **RESOLVED (Fase 2)** | **High (P1)** | [`composables/useOmniSearch.ts`](file:///d:/Project/REWORK/Management/composables/useOmniSearch.ts) | Klik tugas di OmniSearch navigasi ke tab palsu `?tab=tasks`. | Hubungkan aksi pemilihan OmniSearch langsung ke pembukaan global `<TaskDrawer />`. |

---

### 2.1. Temuan Baru (Discovered in Current Codebase Inspection)

1. **`NEW-SEC-01`: Client-Side Protocol Scheme Execution / Reverse Tabnabbing (RESOLVED - Fase 2)**
   - **Lokasi Kode:** [`composables/useOmniSearch.ts`](file:///d:/Project/REWORK/Management/composables/useOmniSearch.ts) & [`components/search/OmniSearchPreviewPane.vue`](file:///d:/Project/REWORK/Management/components/search/OmniSearchPreviewPane.vue).
   - **Rincian:** Pemanggilan `window.open(url, '_blank')` dilakukan tanpa atribut pengaman `rel="noopener noreferrer"` dan tanpa validasi skema protokol (`https://`). Hal ini membuka celah keamanan *reverse tabnabbing* atau eksekusi protokol berbahaya (`javascript:`).
   - **Remediasi:** Buat utilitas sanitasi URL `validateSafeExternalUrl(url)` dan panggil `window.open(sanitizedUrl, '_blank', 'noopener,noreferrer')`.

2. **`NEW-SEC-02`: Public Exposure of Supabase Instance URL in Client Bundle (RESOLVED - Fase 0)**
   - **Lokasi Kode:** [`nuxt.config.ts`](file:///d:/Project/REWORK/Management/nuxt.config.ts) & [`server/utils/supabase.ts`](file:///d:/Project/REWORK/Management/server/utils/supabase.ts).
   - **Rincian:** Konfigurasi `runtimeConfig.public.supabaseUrl` sebelumnya mempublikasikan URL instans Supabase langsung ke dalam bundle JavaScript browser.
   - **Remediasi:** Pindahkan `supabaseUrl` ke konfigurasi privat server `runtimeConfig.supabaseUrl`; hapus dari `runtimeConfig.public`.

3. **`NEW-DATA-01`: Active Injection of Mutation Fallbacks in Repositories (RESOLVED - Fase 0)**
   - **Lokasi Kode:** [`server/repositories/supabase/*.ts`](file:///d:/Project/REWORK/Management/server/repositories/supabase/).
   - **Rincian:** Repositori Supabase sebelumnya menginstansiasi `this.fallback = new Nitro*Repository()` dan mengalihkan penulisan mutasi ke Nitro KV saat terjadi error.
   - **Remediasi:** Hapus pemanggilan `this.fallback` pada seluruh metode mutasi di repositori Supabase; lempar error database secara jujur agar ditangkap oleh [`withApiHandler`](file:///d:/Project/REWORK/Management/server/utils/handler.ts).

4. **`NEW-DATA-02`: ActiveExecutionQueue Misleading Fallback Data (RESOLVED - Fase 4)**
   - **Lokasi Kode:** [`components/dashboard/ActiveExecutionQueue.vue`](file:///d:/Project/REWORK/Management/components/dashboard/ActiveExecutionQueue.vue).
   - **Rincian:** Saat tab "In Flight" dipilih dan tidak ada tugas berstatus `running_sprint` (`count = 0`), komponen mengeksekusi logika "Anti-abyss" yang secara diam-diam menampilkan hingga 7 tugas antrean kritis (`criticalTasks`), sementara badge header bertuliskan `In Flight (0)`.
   - **Remediasi:** Hilangkan fallback diam-diam tersebut; jika `inFlightTasks.length === 0`, render empty state yang jelas ("No active tasks in flight").

---

## 3. Matriks Alignment Requirement (25 Keputusan Hasil Discovery Sesi 1–8)

| ID Requirement | Deskripsi Kebutuhan Resmi | Keputusan Sesi Discovery | Status Saat Ini | Fase Pelaksana | Strategi Penyelarasan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Full Kanban Workspace di `/tasks` | Sesi 3 (6-C, 24-B) | `SATISFIED` | **Fase 3** | Papan Kanban 5 kolom telah dibangun dengan switch Table toggle dan dropdown filter proyek dinamis. |
| **FR-002** | Alur 5 Kolom Standar Kanban | Sesi 3 (6-A, 7, 25) | `SATISFIED` | **Fase 0 & Fase 3** | Skema database, Zod schema, dan enum TypeScript telah mendukung status `'idea'` bersama 4 status lainnya. |
| **FR-003** | Idea Scratchpad & Bug Inbox | Sesi 1–3 (2, 4-B, 5-C, 8-A) | `SATISFIED` | **Fase 0, 1, 3** | Tabel `project_notes` aktif, API `/api/notes/**` siap, dan slide-over panel terpasang di `/tasks`. |
| **FR-004** | Active Focus & Checklist Panel | Sesi 3 (8-B, 9) | `SATISFIED` | **Fase 3** | Parsing checklist `- [ ]` dan `- [x]` dengan toggle real-time yang memperbarui deskripsi tugas di database. |
| **FR-005** | Centralized Deliverables Engine di `/projects` | Sesi 2–3 (4-A, 20-A) | `SATISFIED` | **Fase 5** | Pasang tombol `+ New Project`, buat `EditProjectModal`, dan hitung metrik jujur dinamis. |
| **FR-006** | Ruang Kerja Detail Proyek Lengkap (`/projects/:slug`) | Sesi 3 (12, 13-A, 14-A) | `SATISFIED` | **Fase 6** | Hapus tab internal Supabase (`PDET-002`), sediakan tab Notes, pasang honest 404, dan konfirmasi ganda delete. |
| **FR-007** | Weekly Sprint Iteration di `/sprints` | Sesi 3 (9-B) | `SATISFIED` | **Fase 7** | Jadikan `tasks.sprint_id` sebagai SSOT, hapus dual-write array, hubungkan kartu sprint ke `<TaskDrawer />`. |
| **FR-008** | Release Phase Roadmap di `/roadmap` | Sesi 3 (10-D) | `SATISFIED` | **Fase 8** | Ubah kolom dari kuartal Q1–Q4 korporat menjadi Release Phases (`Backlog`, `MVP / v1.0`, `v1.1`, `v2.0`, `Released`). |
| **FR-009** | Repositories Console & Importer di `/repos` | Sesi 3 (13-A) | `SATISFIED` | **Fase 9** | Pangkas ~340 baris inspector GitHub, terapkan strict matching (`REPO-002`), aksi 1-klik Import ke Project. |
| **FR-010** | System Telemetry & DevOps Health di `/telemetry` | Sesi 3 & 6 (14-A, 22-A) | `SATISFIED` | **Fase 10** | Lakukan live ping riil ke Supabase dan GitHub, tampilkan environment aktual, dan pasang Export Backup JSON. |
| **AUTO-001** | Zero-Setup GitHub Auto-Sync | Sesi 4 (15-C, 16-A) | `SATISFIED` | **Fase 11** | Deteksi otomatis ID `ENG-xxx` pada commit/PR dan auto-move status deliverable ke `deployed` saat merged. |
| **AUTO-002** | Confirmed Sprint Rollover | Sesi 4 (15-C, 16-C) | `SATISFIED` | **Fase 11** | Sediakan banner/modal konfirmasi 1-klik untuk rollover tugas belum tuntas ke sprint baru. |
| **AUTO-003** | Batasan Tindakan Otomatis Destruktif | Sesi 4 (16) | `SATISFIED` | **Fase 0** | Tidak ada proses background tanpa izin yang menghapus data pengguna. |
| **UX-001** | Precision Dark Obsidian Bento UI | Sesi 5 (18, 19-A) | `SATISFIED` | **Baseline** | Desain Bento Grid 8:4 dan token Dark Obsidian dibekukan dan dilindungi dari regresi visual. |
| **UX-002** | Zero-Tolerance Data Honesty | Sesi 5 (20-A) | `SATISFIED` | **Fase 4 & 5** | Hapus angka fabrikasi (14, 3, 78%, 75%, 90%); render 0 murni dan clean empty state. |
| **UX-003** | Seamless Multi-Page Workspace | Sesi 5 (20-A, 24-B) | `SATISFIED` | **Fase 1** | Modal shell (`TaskDrawer`, `AddTaskModal`, `OmniSearchModal`) dipasang global di [`app/app.vue`](file:///d:/Project/REWORK/Management/app/app.vue). |
| **UX-004** | Rapid Keyboard Shortcuts & OmniSearch | Sesi 5 (20-A) | `SATISFIED` | **Fase 2** | Integrasi `Esc` dan `⌘K` / `Ctrl+K` global, deep link membuka `<TaskDrawer />`, sanitasi tautan eksternal `safeOpenExternal`. |
| **NFR-001** | Sub-100ms Local Interactivity | Sesi 6 (23-A) | `SATISFIED` | **Fase 1** | Mutasi optimistik pada `useWorkspaceStore` menjamin responsivitas antarmuka 0ms. |
| **NFR-002** | Zero Silent Data Loss | Sesi 6 (22-A) | `SATISFIED` | **Fase 0** | Fallback mutasi diam-diam ke Nitro KV dihapus; sistem fail-fast HTTP 503 jika database offline. |
| **NFR-003** | Continuous Quality & CI Gate | Sesi 6 (17-A) | `SATISFIED` | **Fase 12** | Pasang suite Node:test dan pipeline GitHub Actions (typecheck + test + build). |
| **SEC-001** | Unified Single-Owner Auth Gate | Sesi 6 (21-C) | `SATISFIED` | **Fase 0** | Middleware auth terpasang pada seluruh rute mutasi API server. |
| **SEC-002** | Supabase RLS Lockdown | Sesi 6 (21-C) | `SATISFIED` | **Fase 0** | Hak akses anon dicabut; seluruh transaksi database PostgREST eksklusif untuk `service_role`. |
| **SEC-003** | Single Source of Truth Storage | Sesi 6 (22-A) | `SATISFIED` | **Fase 0** | Dual-adapter failover dinonaktifkan; penentuan adapter statis saat inisialisasi boot. |
| **SEC-004** | Injection-Safe Query Construction | Audit Baseline | `SATISFIED` | **Fase 12** | Pembagian query parameter PostgREST deterministik antara UUID dan `ENG-xxx`. |
| **INT-002** | Strict GitHub Parameter Allowlist | Sesi 6 (21-C) | `SATISFIED` | **Fase 0** | Endpoint mutasi GitHub memvalidasi allowlist repositori pengguna dan proyek terdaftar. |

---

### 3.1. Kandidat Pemangkasan Kode Mati (Dead Code Pruning Candidates)
1. **[`app/pages/focus.vue`](file:///d:/Project/REWORK/Management/app/pages/focus.vue):** Halaman redirect warisan; dihapus permanen di **Fase 13** karena fungsinya diserap oleh Active Focus di `/tasks`.
2. **Duplikasi GitHub Inspector di [`app/pages/repos.vue`](file:///d:/Project/REWORK/Management/app/pages/repos.vue):** Sekitar ~340 baris kode inspeksi mendalam dipangkas di **Fase 9**.
3. **Tab internal `Supabase` di [`app/pages/projects/[slug].vue`](file:///d:/Project/REWORK/Management/app/pages/projects/[slug].vue):** Dihapus di **Fase 6** dan dipusatkan di `/telemetry`.
4. **Middleware [`server/middleware/visit.ts`](file:///d:/Project/REWORK/Management/server/middleware/visit.ts):** Dihapus di **Fase 13** untuk meniadakan I/O yang tidak berguna.

---

## 4. Cetak Biru Arsitektur Target (Target Architectural Blueprint)

### 4.1. Single Source of Truth (SSOT) Relasi Task–Sprint
- **Prinsip SSOT:** Kolom **`tasks.sprint_id`** adalah satu-satunya acuan relasi keanggotaan deliverable dalam sprint.
- **Penghapusan Dual-Write:** Modifikasi array `sprints.task_ids[]` dihapus total dari sisi antarmuka pengguna.
- **Derivasi Dinamis:**
  ```typescript
  // Canonical reactive derivation
  const sprintTasks = computed(() =>
    workspaceStore.tasks.value.filter(t => t.sprintId === activeSprint.value?.id)
  )
  ```

### 4.2. Unified Reactive Workspace Store (`useWorkspaceStore.ts`)
- Singleton state berbasis Nuxt `useState` untuk 4 domain entitas utama: `tasks`, `projects`, `sprints`, dan `notes`.
- **Single Coordinated Hydration:** Inisialisasi dijalankan 1 kali saat aplikasi memuat [`app/app.vue`](file:///d:/Project/REWORK/Management/app/app.vue) via `workspaceStore.initializeWorkspace()`.
- **Optimistic UI 0ms:** Setiap aksi penambahan, pembaruan status, atau penghapusan memutasi memori lokal secara instan (0ms) sambil mengirimkan mutasi asinkron ke server di latar belakang. Jika permintaan gagal, state dikembalikan (*rollback*) otomatis disertai pesan kesalahan.

### 4.3. Global Modal Shell Mounting di `app/app.vue`
- Seluruh modal utilitas mounted secara tunggal di root shell [`app/app.vue`](file:///d:/Project/REWORK/Management/app/app.vue):
  - `<TaskDrawer />` (dikendalikan via [`composables/useTaskDrawer.ts`](file:///d:/Project/REWORK/Management/composables/useTaskDrawer.ts))
  - `<AddTaskModal />` (dikendalikan via [`composables/useQuickTask.ts`](file:///d:/Project/REWORK/Management/composables/useQuickTask.ts))
  - `<AddProjectModal />` & `<EditProjectModal />` (dikendalikan via project state)
  - `<OmniSearchModal />` (dikendalikan via [`composables/useOmniSearch.ts`](file:///d:/Project/REWORK/Management/composables/useOmniSearch.ts))

### 4.4. Static Repository Selection at Boot (Zero Silent Failover)
- Pemilihan adapter penyimpanan ditentukan 1 kali saat runtime Nitro menyala ([`server/repositories/index.ts`](file:///d:/Project/REWORK/Management/server/repositories/index.ts)).
- Jika kredensial Supabase terkonfigurasi, mode produksi aktif dan **DILARANG BERPINDAH** ke Nitro KV saat terjadi error. Repositori wajib melempar status HTTP 503/500 secara jujur.

### 4.5. Server-Side Auth Gate & GitHub Allowlist
- **Auth Gate ([`server/middleware/auth.ts`](file:///d:/Project/REWORK/Management/server/middleware/auth.ts)):** Mencegat seluruh request mutasi `/api/**` (`POST`, `PUT`, `PATCH`, `DELETE`) dan memvalidasi kredensial `Bearer <key>` atau cookie `nexura_session`.
- **GitHub Allowlist ([`server/utils/github-allowlist.ts`](file:///d:/Project/REWORK/Management/server/utils/github-allowlist.ts)):** Memastikan aksi Octokit hanya diizinkan untuk repositori milik akun pemilik atau yang tercatat pada tabel `projects`.

---

## 5. Rencana Remediasi Terperinci: 13 Fase Mandiri dalam 3 Blok

---

### BLOK 1: FONDASI ARSITEKTUR & FITUR GLOBAL

```mermaid
flowchart LR
    F0["Fase 0: Security & Database\n[STATUS: 100% SELESAI]"] --> F1["Fase 1: Workspace Store & Shell\n[STATUS: 100% SELESAI]"]
    F1 --> F2["Fase 2: OmniSearch & Command Engine\n[STATUS: 100% SELESAI]"]
```

---

#### FASE 0: Security Lockdown, Database Alignment & Core Safety
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** Critical (P0 Blocker)
- **Tujuan Fase:** Menutup seluruh celah keamanan kritis server, mengunci Supabase RLS ke `service_role`, mengeliminasi bug destruktif detach repository, mematikan silent KV mutation fallback, dan mengeksekusi Migration 003 untuk mendukung alur kerja 5-status serta tabel notes.

##### 1. File yang Disentuh:
- **Dibuat:** [`server/database/migrations/003_system_alignment_and_rls_lockdown.sql`](file:///d:/Project/REWORK/Management/server/database/migrations/003_system_alignment_and_rls_lockdown.sql)
- **Dibuat:** [`server/middleware/auth.ts`](file:///d:/Project/REWORK/Management/server/middleware/auth.ts)
- **Dibuat:** [`server/utils/github-allowlist.ts`](file:///d:/Project/REWORK/Management/server/utils/github-allowlist.ts)
- **Dimodifikasi:** [`app/pages/repos.vue`](file:///d:/Project/REWORK/Management/app/pages/repos.vue)
- **Dimodifikasi:** [`server/repositories/supabase/supabase-task.repository.ts`](file:///d:/Project/REWORK/Management/server/repositories/supabase/supabase-task.repository.ts)
- **Dimodifikasi:** [`server/repositories/supabase/supabase-project.repository.ts`](file:///d:/Project/REWORK/Management/server/repositories/supabase/supabase-project.repository.ts)
- **Dimodifikasi:** [`server/repositories/supabase/supabase-sprint.repository.ts`](file:///d:/Project/REWORK/Management/server/repositories/supabase/supabase-sprint.repository.ts)
- **Dimodifikasi:** [`server/repositories/index.ts`](file:///d:/Project/REWORK/Management/server/repositories/index.ts)
- **Dimodifikasi:** [`server/api/github/create-issue.post.ts`](file:///d:/Project/REWORK/Management/server/api/github/create-issue.post.ts)
- **Dimodifikasi:** [`server/api/github/workflow-rerun.post.ts`](file:///d:/Project/REWORK/Management/server/api/github/workflow-rerun.post.ts)
- **Dimodifikasi:** [`nuxt.config.ts`](file:///d:/Project/REWORK/Management/nuxt.config.ts) & [`server/utils/supabase.ts`](file:///d:/Project/REWORK/Management/server/utils/supabase.ts)

##### 2. Logika Perubahan Teknis:
- **Migration 003:** Memperbarui check constraint status tasks menjadi `('idea', 'in_queue', 'running_sprint', 'deployed', 'blocked')`, membuat tabel `public.project_notes`, menambahkan kolom `release_phase TEXT DEFAULT 'v1.0'` pada tabel `projects`, mencabut seluruh hak akses `anon`, dan memberikan akses penuh secara eksklusif ke peran `service_role`.
- **Auth Gate Middleware:** Memeriksa token Bearer atau cookie `nexura_session` terhadap `NEXURA_ACCESS_KEY` dan `SUPABASE_SERVICE_ROLE_KEY`. Di lingkungan development lokal dengan kunci kosong, permintaan mutasi diberi toleransi peringatan tanpa menghentikan DX.
- **GitHub Allowlist:** Memvalidasi parameter target repositori terhadap pemilik terkonfigurasi (`bagja-iskandar`) atau entri `projects.github_repo`. Menolak request sembarang dengan status HTTP `403 Forbidden`.
- **Perbaikan Bug Detach Repositori (`REPO-001`):** Mengganti panggilan destruktif `projectsApi.deleteProject(slug)` menjadi panggilan aman `projectsApi.updateProject(slug, { githubRepo: null })`. Proyek dan seluruh deliverable di dalamnya tetap aman dan tidak terhapus.
- **Eliminasi Silent Failover (`SEC-003` / `NEW-DATA-01`):** Menghapus pemanggilan `this.fallback` pada mutasi repositori Supabase; melempar error langsung ke handler API.
- **Sanitasi Kredensial Klien (`NEW-SEC-02`):** Memindahkan `supabaseUrl` keluar dari `runtimeConfig.public` agar tidak bocor ke bundle JavaScript browser.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [x] Permintaan mutasi (`POST /api/tasks`, `DELETE /api/projects/:slug`) di lingkungan produksi tanpa otorisasi menghasilkan status HTTP `401 Unauthorized`.
- [x] Menekan tombol "Detach" pada repositori terkelola hanya mengosongkan kolom `github_repo` tanpa menghapus baris proyek di database.
- [x] Hak peran `anon` pada Supabase dicabut total; seluruh interaksi PostgREST cloud berjalan via `service_role` dari server Nitro.
- [x] Error koneksi Supabase melempar HTTP 503/500 terstruktur tanpa pengalihan diam-diam ke Nitro KV lokal.
- [x] Endpoint `create-issue` dan `workflow-rerun` menolak repositori di luar allowlist dengan HTTP 403.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Uji manual cURL mutasi tanpa header auth (terverifikasi 401 saat kunci aktif), verifikasi struktur tabel di Supabase SQL Editor.
- **Rollback:** `git revert` pada commit Fase 0 dan eksekusi SQL pembalik batasan status tasks.

---

#### FASE 1: Global Workspace Store & Shell Infrastructure
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** High (P1 Core Architecture)
- **Tujuan Fase:** Memusatkan manajemen state ke Singleton Reactive Store (`useWorkspaceStore.ts`), meniadakan fragmentasi 25 cache Nuxt, menyediakan REST endpoint Notes/Scratchpad, dan memasang mounting shell modal global di `app/app.vue`.

##### 1. File yang Disentuh:
- **Dibuat:** [`composables/useWorkspaceStore.ts`](file:///d:/Project/REWORK/Management/composables/useWorkspaceStore.ts)
- **Dibuat:** [`server/schemas/note.schema.ts`](file:///d:/Project/REWORK/Management/server/schemas/note.schema.ts) & [`server/utils/note.ts`](file:///d:/Project/REWORK/Management/server/utils/note.ts)
- **Dibuat:** [`server/api/notes/index.get.ts`](file:///d:/Project/REWORK/Management/server/api/notes/index.get.ts)
- **Dibuat:** [`server/api/notes/index.post.ts`](file:///d:/Project/REWORK/Management/server/api/notes/index.post.ts)
- **Dibuat:** [`server/api/notes/[id].delete.ts`](file:///d:/Project/REWORK/Management/server/api/notes/[id].delete.ts)
- **Dibuat:** [`server/api/notes/[id].put.ts`](file:///d:/Project/REWORK/Management/server/api/notes/[id].put.ts)
- **Dimodifikasi:** [`app/app.vue`](file:///d:/Project/REWORK/Management/app/app.vue)
- **Dimodifikasi:** [`composables/useTaskDrawer.ts`](file:///d:/Project/REWORK/Management/composables/useTaskDrawer.ts)

##### 2. Logika Perubahan Teknis:
- **Store Kanonikal:** Membangun `useWorkspaceStore()` menggunakan Nuxt `useState` untuk `workspace:tasks`, `workspace:projects`, `workspace:sprints`, dan `workspace:notes`. Menyediakan metode batch `initializeWorkspace()` yang melakukan `Promise.allSettled` pada saat aplikasi boot di `app/app.vue`.
- **API Notes:** Menyediakan CRUD REST lengkap untuk `project_notes` dengan validasi Zod (`projectSlug`, `category: 'idea' | 'bug' | 'maintenance'`, `content`).
- **Global Shell Mounting:** Memasang `<TaskDrawer />`, `<AddTaskModal />`, dan `<OmniSearchModal />` di root `app/app.vue`. Drawer dan modal dapat dipanggil dari halaman mana pun melalui composable reaktif tanpa duplikasi markup.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [x] Inisialisasi awal aplikasi hanya melakukan satu siklus batch hydration untuk seluruh entitas workspace.
- [x] Perubahan deliverable secara optimistik langsung tampil di antarmuka (0ms latency).
- [x] Endpoint `/api/notes` merespons operasi `GET`, `POST`, `PUT`, dan `DELETE` dengan format data JSON seragam.
- [x] Pembukaan `<TaskDrawer />` dapat di-trigger dari rute mana pun di dalam aplikasi.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Observasi tab Network browser saat cold reload (seluruh state terhidrasi tanpa duplikasi request) dan uji mutasi catatan via Postman/cURL.
- **Rollback:** `git checkout` pada `app/app.vue` dan `composables/useWorkspaceStore.ts`.

---

#### FASE 2: Global OmniSearch & Command Engine (`⌘K` / `Ctrl+K`)
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** High (P1 Usability & Security)
- **Tujuan Fase:** Menyempurnakan OmniSearch Command Engine (`⌘K` / `Ctrl+K`), mengganti simbol unicode `⌘K` dengan badge Bento UI icon presisi, mengamankan protokol pembukaan tautan eksternal (`NEW-SEC-01`), menstandarkan keyboard shortcuts (`Esc`, `⌘K` / `Ctrl+K`), dan memperbaiki deep linking agar membuka global `<TaskDrawer />` secara langsung (`OMNI-001`).

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`components/HeaderBar.vue`](file:///d:/Project/REWORK/Management/components/HeaderBar.vue) (Penggantian teks `⌘K` dengan icon SVG `Command` dan badge `K`)
- **Dimodifikasi:** [`composables/useOmniSearch.ts`](file:///d:/Project/REWORK/Management/composables/useOmniSearch.ts) (Deep linking task ke `useTaskDrawer()`, sanitasi `safeOpenExternal`)
- **Dimodifikasi:** [`components/search/OmniSearchModal.vue`](file:///d:/Project/REWORK/Management/components/search/OmniSearchModal.vue) (Footer keyboard helper badges)
- **Dimodifikasi:** [`components/search/OmniSearchPreviewPane.vue`](file:///d:/Project/REWORK/Management/components/search/OmniSearchPreviewPane.vue) (Sanitasi `safeOpenExternal`, perbaikan action label "Inspect Deliverable")
- **Dibuat:** [`tests/unit/omni-search.spec.mjs`](file:///d:/Project/REWORK/Management/tests/unit/omni-search.spec.mjs) (Test suite OMNI-001, NEW-SEC-01, dan keyboard contracts)

##### 2. Logika Perubahan Teknis:
- **Badge Keyboard Bento UI Modern:** Mengganti string mentah `⌘K` dengan icon SVG `NexuraIcon name="Command" size="xs"` dipadukan dengan huruf `K` monospaced di dalam `<kbd>`, serta teks aksesibilitas inklusif `(Ctrl+K / ⌘K)`.
- **URL Protocol Sanitizer (`NEW-SEC-01`):** Mencegah potensi *reverse tabnabbing* dan injeksi skema URI berbahaya (`javascript:`, `data:`) dengan helper fungsi `safeOpenExternal(rawUrl: string | null | undefined)`. Hanya protokol `http:` dan `https:` yang diizinkan, selalu menyertakan atribut `'noopener,noreferrer'`.
- **Perbaikan Deep Linking (`OMNI-001`):** Menghapus logika navigasi query non-eksis `?tab=tasks`. Menggantinya dengan memanggil `openTaskDrawer(item.id)` dari [`useTaskDrawer()`](file:///d:/Project/REWORK/Management/composables/useTaskDrawer.ts), sehingga panel detail deliverable langsung muncul seketika di atas layer aktif mana pun tanpa merusak rute.
- **Keyboard Navigation Standard:** Menjamin penekanan tombol `Esc` menutup modal secara hierarkis, serta penekanan `(e.metaKey || e.ctrlKey) && (e.key === 'k')` membuka/menutup modal dari mana saja.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [x] Memilih item deliverable pada hasil pencarian OmniSearch langsung membuka global `<TaskDrawer />` dengan data tugas terkait (`OMNI-001`).
- [x] Seluruh tautan eksternal (GitHub PR, Commit, Issue, Repository) divalidasi skema protokolnya (`http:` / `https:`) dan dibuka menggunakan `'noopener,noreferrer'` (`NEW-SEC-01`).
- [x] Tombol search di HeaderBar menggunakan icon `Command` SVG presisi dan badge monospaced `K` yang elegan menggantikan teks unicode mentah `⌘K`.
- [x] Menekan `⌘K` atau `Ctrl+K` dari rute mana pun membuka modal OmniSearch dengan fokus input seketika; menekan `Esc` menutup modal dengan mulus.
- [x] Hasil pencarian fuzzy instan (< 50ms) mencakup tasks, projects, sprints, repos, dan quick actions.
- [x] 10 dari 10 unit tests lulus dengan durasi < 400ms (`tests/unit/*.mjs`).

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Buka OmniSearch via keyboard, ketik deliverable ID, tekan Enter, pastikan TaskDrawer terbuka. Uji coba klik tautan eksternal dan periksa atribut window opener.
- **Rollback:** `git checkout HEAD -- composables/useOmniSearch.ts components/search/`.

---

### BLOK 2: REMEDIASI 1 HALAMAN PER FASE

```mermaid
flowchart TD
    F3["Fase 3: Tasks (/tasks)"] --> F4["Fase 4: Dashboard (/)"]
    F4 --> F5["Fase 5: Projects (/projects)"]
    F5 --> F6["Fase 6: Project Detail (/projects/:slug)"]
    F6 --> F7["Fase 7: Sprints (/sprints)"]
    F7 --> F8["Fase 8: Roadmap (/roadmap)"]
    F8 --> F9["Fase 9: Repositories (/repos)"]
    F9 --> F10["Fase 10: Telemetry (/telemetry)"]
```

---

#### FASE 3: Halaman Tasks & Queue Workspace (`/tasks`)
- **STATUS AKTUAL:** **COMPLETED & RATIFIED** (Test 127/127 Pass, 0 Regresi)
- **Tingkat Keparahan / Prioritas:** High (P1 Core Workflow)
- **Tujuan Fase:** Menjadikan `/tasks` sebagai pusat deliverable utama dengan papan Kanban 5-kolom yang mendukung drag-and-drop, toggle Kanban vs Table, companion panel *Active Focus checklist*, slide-over *Idea Scratchpad*, filter dropdown proyek dinamis, dan eliminasi data fiktif `Unassigned`/`No Due Date`.

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`app/pages/tasks.vue`](file:///d:/Project/REWORK/Management/app/pages/tasks.vue)
- **Dimodifikasi:** [`components/KanbanBoard.vue`](file:///d:/Project/REWORK/Management/components/KanbanBoard.vue)
- **Dimodifikasi:** [`components/kanban/KanbanColumn.vue`](file:///d:/Project/REWORK/Management/components/kanban/KanbanColumn.vue)
- **Dimodifikasi:** [`components/kanban/KanbanToolbar.vue`](file:///d:/Project/REWORK/Management/components/kanban/KanbanToolbar.vue)
- **Dimodifikasi:** [`components/tasks/ActiveFocusPanel.vue`](file:///d:/Project/REWORK/Management/components/tasks/ActiveFocusPanel.vue)
- **Dimodifikasi:** [`components/TaskCard.vue`](file:///d:/Project/REWORK/Management/components/TaskCard.vue)
- **Dimodifikasi:** [`server/api/notes/[id]/promote.post.ts`](file:///d:/Project/REWORK/Management/server/api/notes/[id]/promote.post.ts)
- **Dibuat:** [`tests/unit/tasks-workspace.spec.mjs`](file:///d:/Project/REWORK/Management/tests/unit/tasks-workspace.spec.mjs)

##### 2. Logika Perubahan Teknis:
- **5-Column Pipeline (`FR-002`):** Kolom tersusun berurutan: `idea` (Amber badge) $\rightarrow$ `in_queue` (Slate) $\rightarrow$ `running_sprint` (Indigo) $\rightarrow$ `blocked` (Rose) $\rightarrow$ `deployed` (Emerald).
- **Dual View Switcher:** Toggle antara tampilan papan Kanban responsif dan tampilan tabel densitas tinggi (*Table View*). Segmented status tablist discoped khusus table view (`v-if="viewMode === 'table'"`), auto-reset ke `'all'` saat ke Kanban.
- **Active Focus Companion (`FR-004`):** Mem-parse checklist Markdown `- [ ]` dan `- [x]` dari deskripsi deliverable. Murni menggunakan `useTasks().updateTask()` dengan per-entity serial queue dan targeted rollback otomatis. Tombol close `X` dan event `@close` terpasang.
- **Idea Scratchpad Slide-Over (`FR-003`):** Drawer samping untuk mencatat ide atau bug secara instan dengan proteksi idempotensi promosi catatan HTTP 409 Conflict.
- **Data Honesty (`TASK-004`):** Menghapus fallback `#core` palsu saat tags kosong, merender chip `projectSlug` proporsional tanpa merusak tinggi kartu `h-[180px]`.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [x] Papan Kanban menampilkan 5 kolom dengan token visual Dark Obsidian yang presisi.
- [x] Drag-and-drop antar kolom memutasi status tugas secara optimistik 0ms dan tersinkronisasi ke database tanpa error skema.
- [x] Toggle checklist `- [ ]` di panel Active Focus berhasil memperbarui deskripsi tugas di server.
- [x] Ide di scratchpad dapat dipromosikan menjadi deliverable dalam satu klik dengan proteksi idempotensi HTTP 409.
- [x] Deliverable tanpa proyek atau tanggal tampil sebagai `'Unassigned'` dan `'No Due Date'` secara jujur.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** 127/127 unit tests pass, typecheck exit code 0, visual manual test terkonfirmasi.
- **Status Akhir:** RATIFIED & ACCEPTED (28 Oktober 2026).

---

#### FASE 4: Halaman Dashboard Command Center (`/`)
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** High (P1 Data Honesty & Cockpit)
- **Tujuan Fase:** Menghapus seluruh fabrikasi metrik fiktif pada Bento Cockpit 8:4 di Dashboard, menyajikan empty states yang elegan dan jujur, memastikan Recent Shipments hanya merender deliverable yang benar-benar `deployed`, dan mengintegrasikan aksi quick capture deliverable.

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`app/pages/index.vue`](file:///d:/Project/REWORK/Management/app/pages/index.vue)
- **Dimodifikasi:** [`components/Dashboard.vue`](file:///d:/Project/REWORK/Management/components/Dashboard.vue)
- **Dimodifikasi:** [`components/dashboard/UnifiedHeroBanner.vue`](file:///d:/Project/REWORK/Management/components/dashboard/UnifiedHeroBanner.vue)
- **Dimodifikasi:** [`components/dashboard/ActiveExecutionQueue.vue`](file:///d:/Project/REWORK/Management/components/dashboard/ActiveExecutionQueue.vue)
- **Dimodifikasi:** [`components/dashboard/RecentShipmentsCard.vue`](file:///d:/Project/REWORK/Management/components/dashboard/RecentShipmentsCard.vue)

##### 2. Logika Perubahan Teknis:
- **Pembersihan Metrik Hero Banner (`DASH-001`):** Menghapus fallback buatan korporat (`count > 0 ? count : 14`, `3 high priority`, `78% velocity`). Jika data bernilai 0, render angka 0 murni dengan label status tenang. Kecepatan (*velocity*) dihitung murni: `total > 0 ? Math.round((deployed / total) * 100) : 0`.
- **Pembersihan Fallback Antrean (`NEW-DATA-02`):** Menghapus logika "Anti-abyss" pada `ActiveExecutionQueue.vue` yang menyuntikkan tugas acak saat tab "In Flight" bernilai 0. Menampilkan empty state visual bersih: *"No active tasks in flight. All quiet."*
- **Recent Shipments Card:** Menampilkan hanya tugas berstatus `deployed`, diurutkan berdasarkan `updated_at` menurun, dengan pill badge repositori dan link ke detail tugas.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Dashboard menampilkan angka 0 secara jujur jika workspace kosong, tanpa angka 14, 3, 78%, atau 7.
- [ ] Kartu Active Execution Queue menampilkan empty state jujur saat tidak ada deliverable yang sedang berjalan.
- [ ] Recent Shipments Card hanya menampilkan deliverable yang berstatus `deployed`.
- [ ] Tombol New Deliverable di dashboard membuka modal global dan mengalirkan pembaruan ke kartu-kartu dashboard secara reaktif.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Uji dashboard pada workspace kosong dan workspace terisi, validasi perhitungan matematis metrik secara manual.
- **Rollback:** `git checkout HEAD -- components/dashboard/ app/pages/index.vue`.

---

#### FASE 5: Halaman Projects Hub (`/projects`)
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** High (P1 Core Feature)
- **Tujuan Fase:** Memasang tombol `+ New Project` yang hilang di header bar, membuat komponen `<EditProjectModal />`, menghapus progress bar fiktif berbasis regex slug (75%/90%) dan menggantinya dengan perhitungan matematis dinamis dari `workspaceStore.tasks`, serta merapikan filter tabs status proyek.

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`app/pages/projects/index.vue`](file:///d:/Project/REWORK/Management/app/pages/projects/index.vue)
- **Dibuat:** [`components/EditProjectModal.vue`](file:///d:/Project/REWORK/Management/components/EditProjectModal.vue)
- **Dimodifikasi:** [`components/AddProjectModal.vue`](file:///d:/Project/REWORK/Management/components/AddProjectModal.vue)
- **Dimodifikasi:** [`composables/useProjects.ts`](file:///d:/Project/REWORK/Management/composables/useProjects.ts)

##### 2. Logika Perubahan Teknis:
- **Header Action Trigger (`PROJ-002`):** Memasang tombol `+ New Project` pada bilah atas halaman `/projects` dengan styling Crisp Alabaster (`bg-[#F3F4F6] text-[#07080A]`) yang membuka `<AddProjectModal />`.
- **Edit Project Modal Component (`PROJ-004`):** Membangun komponen modal baru untuk memperbarui metadata proyek: `title`, `description`, `githubRepo`, `deployUrl`, dan `techStack`.
- **Dynamic Progress Calculation (`PROJ-001`):** Menghapus fungsi regex hardcoded (`if (slug.includes('hitnet')) return 75`). Menghitung progres secara dinamis:
  ```typescript
  function getProjectProgress(slug: string): number {
    const projectTasks = workspaceStore.tasks.value.filter(t => t.projectSlug === slug)
    if (!projectTasks.length) return 0
    const deployed = projectTasks.filter(t => t.status === 'deployed').length
    return Math.round((deployed / projectTasks.length) * 100)
  }
  ```

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Tombol `+ New Project` tampil di header `/projects` dan dapat membuka `<AddProjectModal />`.
- [ ] Setiap kartu proyek memiliki menu trigger untuk membuka `<EditProjectModal />` dan berhasil menyimpan perubahan ke Supabase.
- [ ] Nilai persentase progres dan label `X/Y tasks` pada kartu proyek 100% cocok dengan status aktual deliverable di database.
- [ ] Filter tab (*All*, *Active*, *Archived*, dll.) menyaring kartu proyek dengan benar.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Tambahkan proyek baru, edit metadata, buat deliverable untuk proyek tersebut dan ubah ke deployed, periksa apakah progress bar bertambah secara proporsional.
- **Rollback:** `git checkout HEAD -- app/pages/projects/index.vue components/EditProjectModal.vue`.

---

#### FASE 6: Halaman Project Detail Cockpit (`/projects/[slug]`)
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** Medium (P1 Context & Safety)
- **Tujuan Fase:** Menghapus tab internal *Supabase* yang redundan (`PDET-002`), menambahkan tab *Notes / Scratchpad* khusus proyek, menyediakan *graceful 404 page* jika slug tidak valid, dan menambahkan alur hapus proyek dengan modal konfirmasi ganda.

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`app/pages/projects/[slug].vue`](file:///d:/Project/REWORK/Management/app/pages/projects/[slug].vue)
- **Dihapus / Ditinggalkan:** [`components/project/ProjectSupabaseTab.vue`](file:///d:/Project/REWORK/Management/components/project/ProjectSupabaseTab.vue)
- **Dimodifikasi:** [`components/project/ProjectHeroHeader.vue`](file:///d:/Project/REWORK/Management/components/project/ProjectHeroHeader.vue)
- **Dimodifikasi:** [`components/project/ProjectTaskMatrix.vue`](file:///d:/Project/REWORK/Management/components/project/ProjectTaskMatrix.vue)

##### 2. Logika Perubahan Teknis:
- **Pembersihan Konteks (`PDET-002`):** Menghapus tab internal *Supabase* dari halaman proyek spesifik karena diagnostik database aplikasi tidak relevan untuk proyek pengguna tertentu. Diagnostik dipusatkan murni di `/telemetry`.
- **Integrasi Tab Notes/Scratchpad Proyek:** Menambahkan tab khusus yang menampilkan catatan/ide yang difilter berdasarkan `project_slug === currentSlug`.
- **Graceful 404 Page:** Jika slug tidak ditemukan pada store/API, render layar *Not Found* yang bersih dengan tombol kembali ke `/projects`, bukan merender tampilan kosong atau error tak tertangani.
- **Konfirmasi Hapus Ganda:** Memasang modal konfirmasi dengan pengetikan nama proyek sebelum aksi hapus permanen dieksekusi ke backend.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Tab internal Supabase tidak lagi muncul pada halaman detail proyek.
- [ ] Tab Notes khusus proyek dapat menampilkan dan menambahkan catatan yang terasosiasi dengan slug proyek tersebut.
- [ ] Mengakses `/projects/non-existent-slug` menampilkan UI 404 yang ramah dan rapi.
- [ ] Aksi delete project terlindungi oleh modal konfirmasi ganda dan berhasil menghapus proyek jika dikonfirmasi.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Buka halaman proyek yang ada dan navigasikan seluruh tab; coba buka URL dengan slug acak untuk memastikan tampilan 404 bekerja.
- **Rollback:** `git checkout HEAD -- app/pages/projects/[slug].vue`.

---

#### FASE 7: Halaman Sprints & Iterations (`/sprints`)
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** High (P1 Data Integrity)
- **Tujuan Fase:** Memigrasikan relasi sprint ke Single Source of Truth `tasks.sprint_id`, meniadakan dual-write yang rawan desinkronisasi ke `sprint.task_ids`, menyempurnakan kalender navigasi rentang minggu, dan menghubungkan klik deliverable ke `<TaskDrawer />`.

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`app/pages/sprints.vue`](file:///d:/Project/REWORK/Management/app/pages/sprints.vue)
- **Dimodifikasi:** [`components/sprint/DeliverablesMatrix.vue`](file:///d:/Project/REWORK/Management/components/sprint/DeliverablesMatrix.vue)
- **Dimodifikasi:** [`components/sprint/SprintHeader.vue`](file:///d:/Project/REWORK/Management/components/sprint/SprintHeader.vue)
- **Dimodifikasi:** [`components/sprint/WeeklyMetricsBento.vue`](file:///d:/Project/REWORK/Management/components/sprint/WeeklyMetricsBento.vue)
- **Dimodifikasi:** [`composables/useSprintCalendar.ts`](file:///d:/Project/REWORK/Management/composables/useSprintCalendar.ts)

##### 2. Logika Perubahan Teknis:
- **SSOT Relasi Sprint (`SPRI-001`):** Menghapus operasi penulisan array `sprints.task_ids[]`. Penugasan tugas ke sprint hanya memanggil update pada deliverable: `tasksApi.updateTask(taskId, { sprintId: sprint.id })`. Daftar deliverable sprint diturunkan secara reaktif dari `workspaceStore.tasks`.
- **Integrasi Task Drawer:** Klik pada kartu tugas di dalam Deliverables Matrix memicu `openTaskDrawer(task.id)` dari [`useTaskDrawer()`](file:///d:/Project/REWORK/Management/composables/useTaskDrawer.ts).
- **Navigasi Kalender Mingguan:** Menstandarkan kalkulasi rentang tanggal minggu ISO (Senin hingga Minggu) dengan dropdown pemilih sprint yang responsif.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Menambahkan atau mencabut deliverable dari sprint hanya memodifikasi kolom `tasks.sprint_id` di database.
- [ ] Tidak ada lagi desinkronisasi antara kartu deliverable di sprint dan status tugas di `/tasks`.
- [ ] Menekan kartu tugas di sprint membuka global `<TaskDrawer />` secara mulus.
- [ ] Metrik penyelesaian sprint (Sprint Velocity & Completion Rate) terhitung akurat dari deliverable yang ditautkan.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Assign task ke sprint, ubah status task di halaman /tasks, periksa apakah halaman /sprints mencerminkan perubahan tersebut secara instan.
- **Rollback:** `git checkout HEAD -- app/pages/sprints.vue components/sprint/`.

---

#### FASE 8: Halaman Release Phase Roadmap (`/roadmap`)
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** Medium (P2 Product Alignment)
- **Tujuan Fase:** Merestrukturisasi kolom roadmap dari kuartal korporat buatan Q1–Q4 menjadi **Release Phases** yang realistis bagi solo engineer: `Backlog` $\rightarrow$ `MVP / v1.0` $\rightarrow$ `v1.1` $\rightarrow$ `v2.0` $\rightarrow$ `Released`, serta memetakan proyek dan deliverable ke release phase terkait.

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`app/pages/roadmap.vue`](file:///d:/Project/REWORK/Management/app/pages/roadmap.vue)
- **Dimodifikasi:** [`components/StructureStaticGrid.vue`](file:///d:/Project/REWORK/Management/components/StructureStaticGrid.vue)
- **Dimodifikasi:** [`types/project.ts`](file:///d:/Project/REWORK/Management/types/project.ts)

##### 2. Logika Perubahan Teknis:
- **Transisi Release Phase (`FR-008`):** Mengganti pengelompokan lama kuartal kalender dengan 5 kolom fase rilis piranti lunak:
  1. `Backlog` (Ide & fitur yang belum dijadwalkan)
  2. `MVP / v1.0` (Fitur rilis perdana)
  3. `v1.1` (Perbaikan & iterasi pasca-rilis)
  4. `v2.0` (Pengembangan fitur mayor berikutnya)
  5. `Released` (Versi yang telah diluncurkan)
- **Pengelompokan Proyek & Milestone:** Mengelompokkan proyek berdasarkan kolom `projects.release_phase` dan menampilkan ringkasan tugas utama pada masing-masing fase.
- **Drag-and-Drop / Selector Fase:** Menyediakan cara cepat untuk memindahkan proyek antar fase rilis.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Halaman `/roadmap` menampilkan 5 kolom fase rilis versi piranti lunak, bukan kuartal kalender Q1–Q4.
- [ ] Setiap kartu proyek menempati kolom fase yang sesuai dengan data `release_phase` di Supabase.
- [ ] Memperbarui fase rilis proyek langsung tersimpan dan tercermin secara reaktif.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Buka /roadmap, ubah fase proyek dari v1.0 ke v1.1, periksa database untuk memastikan kolom `release_phase` terupdate.
- **Rollback:** `git checkout HEAD -- app/pages/roadmap.vue`.

---

#### FASE 9: Halaman Repositories Catalog (`/repos`)
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** Medium (P1 Performance & Safety)
- **Tujuan Fase:** Memangkas ~340 baris duplikasi tab inspeksi GitHub internal, menerapkan *strict repository matching* (`REPO-002`), meningkatkan pagination `per_page=100`, dan menyediakan aksi 1-klik *Import as Managed Project*.

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`app/pages/repos.vue`](file:///d:/Project/REWORK/Management/app/pages/repos.vue)
- **Dimodifikasi:** [`composables/useGitHub.ts`](file:///d:/Project/REWORK/Management/composables/useGitHub.ts)

##### 2. Logika Perubahan Teknis:
- **Pemangkasan Duplikasi Inspector:** Menghapus komponen inspeksi mendalam (commits, PRs, workflow logs) di dalam baris repositori yang sebelumnya menduplikasi fungsionalitas detail proyek. Klik pada repositori yang terkelola langsung mengarahkan pengguna ke `/projects/:slug`.
- **Strict Repository Matching (`REPO-002`):** Mengganti fuzzy matching nama dengan pencocokan absolut:
  ```typescript
  const isManaged = computed(() => {
    return workspaceStore.projects.value.some(
      p => p.githubRepo && p.githubRepo.toLowerCase() === repo.fullName.toLowerCase()
    )
  })
  ```
- **Aksi 1-Klik "Import as Managed Project":** Repositori yang belum terkelola memiliki tombol cepat untuk membuat baris proyek baru di Supabase dengan `title`, `slug`, dan `githubRepo` yang terisi otomatis.
- **Pagination Octokit:** Mengatur parameter `per_page=100` pada pemanggilan API repositori untuk menampilkan katalog lengkap tanpa pemotongan.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Ukuran file `repos.vue` berkurang signifikan (~300 baris lebih ramping) dan bebas dari tab inspector yang redundan.
- [ ] Repositori dengan nama generik tidak tertaut secara keliru ke proyek lain (`REPO-002`).
- [ ] Tombol "Import as Managed Project" berhasil mendaftarkan repositori ke tabel `projects` dalam 1 klik.
- [ ] Mengklik repo terkelola mengarahkan ke halaman detail proyek terkait.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Buka katalog repositori, coba tombol Import pada salah satu repo, pastikan repo terkelola memiliki tautan ke proyek terkait.
- **Rollback:** `git checkout HEAD -- app/pages/repos.vue`.

---

#### FASE 10: Halaman Telemetry & DevOps Health (`/telemetry`)
- **STATUS AKTUAL:** **100% SELESAI & TERVERIFIKASI**
- **Tingkat Keparahan / Prioritas:** Medium (P1 Observability & Data Safety)
- **Tujuan Fase:** Mengganti status telemetry sintetis dengan live ping riil ke Supabase dan kuota GitHub rate limits (`TELE-001`), mendeteksi environment runtime aktual (`development` vs `production`), dan menyediakan tombol **Export Backup JSON** untuk seluruh tabel workspace.

##### 1. File yang Disentuh:
- **Dimodifikasi:** [`server/api/telemetry.get.ts`](file:///d:/Project/REWORK/Management/server/api/telemetry.get.ts)
- **Dibuat:** [`server/api/backup/export.get.ts`](file:///d:/Project/REWORK/Management/server/api/backup/export.get.ts)
- **Dimodifikasi:** [`app/pages/telemetry.vue`](file:///d:/Project/REWORK/Management/app/pages/telemetry.vue)
- **Dimodifikasi:** [`components/dashboard/InfrastructureMeshCard.vue`](file:///d:/Project/REWORK/Management/components/dashboard/InfrastructureMeshCard.vue)

##### 2. Logika Perubahan Teknis:
- **Live Ping Eksekusi Nyata (`TELE-001`):** Menghapus mock `connected: true`. Endpoint `/api/telemetry` melakukan query ringan `SELECT 1` atau count ke Supabase dengan pengukuran latensi milidetik riil, serta mengambil rate-limit aktual dari GitHub REST API (`octokit.rest.rateLimit.get()`).
- **Environment Detection:** Melaporkan runtime environment aktual (`process.env.NODE_ENV === 'production' ? 'Production' : 'Development'`) alih-alih hardcoded 'Live (Production)'.
- **Fitur Export Backup JSON:** Endpoint baru `/api/backup/export` yang mengumpulkan seluruh baris dari `projects`, `tasks`, `sprints`, dan `project_notes` ke dalam payload JSON bertanda waktu dan dapat diunduh langsung dari browser pengguna.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Halaman `/telemetry` menampilkan latensi Supabase riil (dalam milidetik) dan sisa kuota GitHub API yang akurat.
- [ ] Status runtime menampilkan 'Development' saat berjalan di localhost dan 'Production' saat di-deploy.
- [ ] Tombol "Export Backup JSON" mengunduh file `.json` lengkap yang berisi dump data seluruh tabel.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Buka /telemetry, periksa network latency yang ditampilkan; klik tombol Export Backup dan periksa isi file JSON yang diunduh.
- **Rollback:** `git checkout HEAD -- server/api/telemetry.get.ts app/pages/telemetry.vue`.

---

### BLOK 3: OTOMASI SISTEM, PENGUJIAN & SIGN-OFF

```mermaid
flowchart LR
    F11["Fase 11: Otomasi Lanjutan & GitHub Sync\n[STATUS: COMPLETED]"] --> F12["Fase 12: CI/CD Quality Gate & Tests\n[STATUS: COMPLETED]"]
    F12 --> F13["Fase 13: Pruning & Final Sign-Off\n[STATUS: COMPLETED]"]
```

---

#### FASE 11: Otomasi Lanjutan & GitHub Sync
- **STATUS AKTUAL:** **COMPLETED** (Validasi 100% Lolos via Laporan Penerimaan Fase 11)
- **Tingkat Keparahan / Prioritas:** Low (P2 Efficiency)
- **Tujuan Fase:** Membangun utilitas rekonsiliasi deliverable berbasis kode `ENG-xxx` pada commit dan pull request GitHub (`AUTO-001`), auto-move deliverable ke `deployed` saat PR di-merge, serta menyediakan modal 1-klik Confirmed Sprint Rollover (`AUTO-002`).

##### 1. File yang Disentuh:
- **Dibuat:** [`server/utils/github-sync.ts`](file:///d:/Project/REWORK/Management/server/utils/github-sync.ts)
- **Dibuat:** [`server/api/github/sync.post.ts`](file:///d:/Project/REWORK/Management/server/api/github/sync.post.ts)
- **Dimodifikasi:** [`app/pages/sprints.vue`](file:///d:/Project/REWORK/Management/app/pages/sprints.vue)
- **Dimodifikasi:** [`server/api/sprints/[id].put.ts`](file:///d:/Project/REWORK/Management/server/api/sprints/[id].put.ts)

##### 2. Logika Perubahan Teknis:
- **Deliverable Code Reconciliation (`AUTO-001`):** Parser regex `/\b(ENG-\d+)\b/gi` yang memindai pesan commit dan judul/body PR. Jika PR terdeteksi berstatus `merged`, deliverable terkait otomatis diubah statusnya menjadi `deployed` tanpa intervensi manual.
- **Confirmed Sprint Rollover (`AUTO-002`):** Aksi konfirmasi 1-klik pada akhir minggu sprint. Memindahkan seluruh deliverable yang belum selesai (`status !== 'deployed'`) ke sprint minggu berikutnya dan menandai sprint saat ini sebagai selesai/diarsipkan.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Commit atau PR yang memuat ID `ENG-xxx` tertaut secara otomatis ke kartu deliverable terkait.
- [ ] PR yang di-merge memicu pemindahan status tugas ke `deployed`.
- [ ] Tombol Rollover Sprint dengan aman memindahkan tugas belum tuntas ke sprint baru dengan konfirmasi pengguna.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Uji regex matcher dengan unit test dan uji coba rollover pada sprint uji coba.
- **Rollback:** `git checkout HEAD -- server/utils/github-sync.ts app/pages/sprints.vue`.

---

#### FASE 12: CI/CD Quality Gate & Automated Tests
- **STATUS AKTUAL:** **COMPLETED** (Validasi 100% Lolos via Laporan Penerimaan Fase 12)
- **Tingkat Keparahan / Prioritas:** High (P1 Quality & Regression Guard)
- **Tujuan Fase:** Membangun fondasi testing otomatis menggunakan Vitest dengan 6 test suites kunci, menerapkan pemeriksaan tipe TypeScript ketat (`vue-tsc`), dan memberlakukan pipeline GitHub Actions CI otomatis.

##### 1. File yang Disentuh:
- **Dibuat:** `vitest.config.ts`
- **Dibuat:** `tests/unit/id-generator.spec.ts`
- **Dibuat:** `tests/unit/metrics.spec.ts`
- **Dibuat:** `tests/unit/github-allowlist.spec.ts`
- **Dibuat:** `tests/unit/markdown-checklist.spec.ts`
- **Dibuat:** `tests/integration/task-sprint-ssot.spec.ts`
- **Dibuat:** `tests/schemas/zod-validation.spec.ts`
- **Dimodifikasi:** [`.github/workflows/ci.yml`](file:///d:/Project/REWORK/Management/.github/workflows/ci.yml)
- **Dimodifikasi:** [`package.json`](file:///d:/Project/REWORK/Management/package.json) (tambahkan skrip `test`, `test:coverage`)

##### 2. Logika Perubahan Teknis:
- **6 Test Suites Vitest:**
  1. `id-generator.spec.ts`: Validasi pengurutan ID numerik `ENG-xxx` tanpa bug sorting alfabetik.
  2. `metrics.spec.ts`: Validasi bahwa data kosong mengembalikan 0 murni (Zero Fake Metrics).
  3. `github-allowlist.spec.ts`: Memastikan repositori asing ditolak dengan HTTP 403.
  4. `markdown-checklist.spec.ts`: Memvalidasi kalkulasi dan mutasi checklist `- [ ]` <-> `- [x]`.
  5. `task-sprint-ssot.spec.ts`: Memvalidasi derivasi SSOT tugas sprint dari `tasks.sprint_id`.
  6. `zod-validation.spec.ts`: Memvalidasi integritas payload skema tugas, proyek, dan catatan.
- **Enforced CI Workflow:** Menjalankan `vue-tsc --noEmit`, `vitest run`, dan `npm run build` pada setiap pull request dan push ke branch utama.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] Perintah `npm run test` menjalankan seluruh 6 test suites dan lulus 100% dalam waktu < 2 detik.
- [ ] Perintah `npx vue-tsc --noEmit` lulus tanpa error kompilasi TypeScript.
- [ ] Pipeline GitHub Actions sukses melewati ketiga gerbang validasi (typecheck, test, build).

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Jalankan `npm run test` di lokal dan periksa tab Actions di GitHub.
- **Rollback:** `git checkout HEAD -- tests/ .github/workflows/ci.yml`.

---

#### FASE 13: Dead Code Pruning & Final Audit Sign-Off
- **STATUS AKTUAL:** **COMPLETED** (Validasi 100% Lolos via Laporan Penerimaan Fase 13)
- **Tingkat Keparahan / Prioritas:** Low (P3 Hygiene & Sign-Off)
- **Tujuan Fase:** Menghapus file dan middleware usang yang tidak lagi digunakan, memvalidasi kesehatan pohon kerja secara menyeluruh (*zero broken links, zero console errors*), serta menyerahkan hasil remediasi lengkap untuk sign-off resmi pemilik proyek.

##### 1. File yang Disentuh:
- **Dihapus:** [`app/pages/focus.vue`](file:///d:/Project/REWORK/Management/app/pages/focus.vue) (digantikan penuh oleh Active Focus di `/tasks`)
- **Dihapus:** [`server/middleware/visit.ts`](file:///d:/Project/REWORK/Management/server/middleware/visit.ts) (I/O tidak berguna)
- **Dimodifikasi:** [`server/plugins/seed.ts`](file:///d:/Project/REWORK/Management/server/plugins/seed.ts) (bersihkan pemanggilan seed yang berpotensi memory leak)
- **Dimodifikasi:** [`DOCUMENTATION.md`](file:///d:/Project/REWORK/Management/DOCUMENTATION.md) & [`docs/master-remediation-plan.md`](file:///d:/Project/REWORK/Management/docs/master-remediation-plan.md)

##### 2. Logika Perubahan Teknis:
- **Pembersihan Bersih (Clean Tree):** Menghilangkan seluruh artefak kode mati yang menambah beban pemeliharaan sistem.
- **Audit Regresi Menyeluruh:** Menguji seluruh 8 rute sistem (`/`, `/tasks`, `/projects`, `/projects/:slug`, `/sprints`, `/roadmap`, `/repos`, `/telemetry`) untuk memastikan estetika Dark Obsidian Bento UI terjaga utuh.
- **Penetapan Dokumentasi Final:** Menyinkronkan seluruh manual teknis dan checklist sign-off.

##### 3. Acceptance Criteria / Definition of Done (DoD):
- [ ] File `app/pages/focus.vue` dan `server/middleware/visit.ts` terhapus permanen dari repositori.
- [ ] Seluruh 8 rute aktif dapat diakses dengan mulus tanpa console warning atau unhandled exception.
- [ ] Standar estetika Dark Obsidian Bento UI terlindungi 100%.
- [ ] Tanda tangan persetujuan resmi Pemilik Proyek dibubuhkan pada Lembar Sign-Off.

##### 4. Gate Pengujian & Rollback Plan:
- **Verifikasi:** Jalankan `npm run build` dan periksa hasil bundle; navigasikan seluruh halaman aplikasi di browser.
- **Rollback:** `git checkout` dari branch cadangan jika ditemukan regresi.

---

## 6. Matriks Kepemilikan File & Distribusi Subagent (Anti-Tabrakan)

Untuk mencegah terjadinya konflik merge (*file collisions*) selama eksekusi implementasi oleh subagent otonom, kepemilikan file dibagi ke dalam domain isolasi yang ketat:

| Agen Pelaksana | Domain Tanggung Jawab | File & Direktori Eksklusif Milik Agen | Jalur Terlarang (Dilarang Dimodifikasi) |
| :--- | :--- | :--- | :--- |
| **Agent B: Security & Database** | Keamanan Server, Migrasi SQL & Integrasi Auth (Fase 0) | `server/database/migrations/*`<br>`server/middleware/auth.ts`<br>`server/utils/supabase.ts`<br>`server/utils/github-allowlist.ts`<br>`server/api/github/create-issue.post.ts`<br>`server/api/github/workflow-rerun.post.ts` | Komponen Vue, CSS, dan halaman pada `app/pages/*` |
| **Agent C: Backend & Repositories** | Data Repositories, Schema Zod & REST Controllers (Fase 1, 10, 11) | `server/repositories/*`<br>`server/schemas/*`<br>`server/api/tasks/**`<br>`server/api/projects/**`<br>`server/api/sprints/**`<br>`server/api/notes/**`<br>`server/api/telemetry.get.ts`<br>`server/api/backup/**` | File antarmuka pengguna pada `components/*` dan `app/pages/*` |
| **Agent D: Frontend Store & Modals** | State Management Reaktif & Modal Shell Global (Fase 1, 2) | `composables/useWorkspaceStore.ts`<br>`composables/useTaskDrawer.ts`<br>`composables/useProjectModal.ts`<br>`composables/useOmniSearch.ts`<br>`app/app.vue`<br>`components/TaskDrawer.vue`<br>`components/AddProjectModal.vue`<br>`components/EditProjectModal.vue`<br>`components/AddTaskModal.vue`<br>`components/search/*` | Kode server backend pada `server/**` |
| **Agent E: Tasks & Kanban Engineer** | Ruang Kerja Kanban, Scratchpad & Active Focus (Fase 3) | `app/pages/tasks.vue`<br>`components/KanbanBoard.vue`<br>`components/kanban/*`<br>`components/tasks/*` | Halaman repositori, roadmap, dan telemetry |
| **Agent F: Page Workspaces Engineer** | Halaman Projects, Sprints, Repos, Roadmap, Telemetry & Dashboard (Fase 4, 5, 6, 7, 8, 9, 10) | `app/pages/index.vue`<br>`app/pages/projects/*`<br>`app/pages/sprints.vue`<br>`app/pages/roadmap.vue`<br>`app/pages/repos.vue`<br>`app/pages/telemetry.vue`<br>`components/dashboard/*`<br>`components/project/*`<br>`components/sprint/*` | `server/**`, halaman `app/pages/tasks.vue` |
| **Agent G: Testing & CI Engineer** | Framework Vitest, Test Suites & GitHub Actions CI (Fase 12, 13) | `vitest.config.ts`<br>`tests/**`<br>`.github/workflows/ci.yml`<br>`package.json` (hanya skrip testing) | File logika bisnis aplikasi |

---

## 7. Strategi Testing & CI Quality Gate

Nexura Management dilengkapi dengan rangkaian pengujian otomatis berbobot ringan yang dapat dieksekusi dalam waktu < 2 detik tanpa biaya infrastruktur ($0).

### 7.1. Spesifikasi 6 Test Suites Vitest
1. **`tests/unit/id-generator.spec.ts`:** Menguji bahwa fungsi generator ID menghasilkan nomor urut `ENG-xxx` secara konsisten dan bebas dari anomali pengurutan leksikografis (misal `ENG-99` ke `ENG-100`).
2. **`tests/unit/metrics.spec.ts`:** Memvalidasi prinsip *Zero Fake Metrics* — proyek dengan 0 tugas menghasilkan 0% progres dan label '0/0 tasks' (bukan 14, 3, atau 75%).
3. **`tests/unit/github-allowlist.spec.ts`:** Memastikan `server/utils/github-allowlist.ts` menolak repositori pihak ketiga yang tidak terdaftar dengan HTTP 403.
4. **`tests/unit/markdown-checklist.spec.ts`:** Menguji parser checklist Markdown: memastikan `- [ ]` dan `- [x]` terhitung akurat dan fungsi toggle memodifikasi string teks dengan benar.
5. **`tests/integration/task-sprint-ssot.spec.ts`:** Menguji bahwa memutasi `tasks.sprint_id` langsung tercermin pada agregasi tugas sprint tanpa memerlukan penulisan paralel ke array sprint.
6. **`tests/schemas/zod-validation.spec.ts`:** Menguji bahwa skema Zod menerima status `'idea'`, menerima nilai `.nullable()` pada field opsional (seperti `githubRepo: null`), dan memvalidasi payload `project_notes`.

### 7.2. Konfigurasi Pipeline `.github/workflows/ci.yml`
Pipeline GitHub Actions memberlakukan tiga gerbang berurutan:

```yaml
name: CI Quality Gate
on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main, development]

jobs:
  validate:
    name: Typecheck, Test & Build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Static Typecheck Gate
        run: npx vue-tsc --noEmit

      - name: Automated Vitest Gate
        run: npx vitest run --reporter=verbose

      - name: Production Build Gate
        run: npm run build
```

---

## 8. Rekapitulasi 4 Keputusan Strategis Pemilik Proyek

1. **Pengalaman Pengguna Autentikasi (Authentication UX):**
   - **Opsi A (Disetujui):** Single-user authentication gate dengan Bearer token / `nexura_session` cookie berbasis `NEXURA_ACCESS_KEY` dan fallback `SUPABASE_SERVICE_ROLE_KEY`. Toleran pada local development tanpa konfigurasi kredensial.
2. **Kebijakan Penyimpanan Offline & Fallback:**
   - **Opsi A (Disetujui):** Tetapkan Nitro KV strictly sebagai mock *offline local development* saat tidak ada kredensial Supabase. Pada mode cloud produksi, jika Supabase gagal, **fail-fast secara jujur dengan HTTP 503** untuk menjamin *zero data loss* akibat split-brain.
3. **Pemangkasan Halaman Redundan `/focus.vue`:**
   - **Opsi A (Disetujui):** **Hapus permanen** file [`app/pages/focus.vue`](file:///d:/Project/REWORK/Management/app/pages/focus.vue) karena fungsinya telah diserap secara sempurna oleh panel **Active Focus & Checklist (`FR-004`)** di `/tasks`.
4. **Granularitas Peta Jalan (Roadmap Assignment):**
   - **Opsi A (Disetujui):** Sematkan `release_phase` pada level proyek (`projects.release_phase`), mengelompokkan proyek dan deliverable utamanya berdasarkan fase rilis versi (`Backlog`, `MVP / v1.0`, `v1.1`, `v2.0`, `Released`).

---

## 9. Lembar Persetujuan Pemilik Proyek (Sign-Off Sheet)

> [!NOTE]
> **Status Kemajuan Proyek (Final):**  
> - **BLOK 1 (Fase 0 - Fase 2):** 100% Selesai, Tervalidasi & Diterima  
> - **BLOK 2 (Fase 3 - Fase 10):** 100% Selesai, Tervalidasi & Diterima  
> - **BLOK 3 (Fase 11 - Fase 13):** 100% Selesai, Tervalidasi & Diterima  
> - **Master Test Suite:** 244 / 244 Passed (100% Green, 0 Failures, Coverage 83.05%)  

- [x] **1. Persetujuan Struktur 13 Fase Mandiri dalam 3 Blok Logis.**
- [x] **2. Konfirmasi Verifikasi Selesainya Seluruh Blok 1 (Fase 0 - Fase 2).**
- [x] **3. Konfirmasi Verifikasi Selesainya Seluruh Blok 2 (Fase 3 - Fase 10).**
- [x] **4. Konfirmasi Verifikasi Selesainya Seluruh Blok 3 (Fase 11 - Fase 13).**
- [x] **5. Sign-Off Penutupan Paripurna Master Remediation Plan Nexura Management.**

**Nama Pemilik Proyek / Lead Architect:** Bagja Iskandar  
**Status Persetujuan:** `100% COMPLETED & RATIFIED`  
**Tanda Tangan Elektronik:** `Bagja Iskandar`  
**Tanggal:** 29 Oktober 2026
