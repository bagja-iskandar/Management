# Dokumen Spesifikasi Requirement Resmi & Laporan Audit Ulang (Gap Analysis & Roadmap Remediasi) — Nexura Management

**Dokumen:** `docs/nexura-requirements-and-reaudit.md`  
**Dokumen Pembanding:** `docs/management-system-audit.md`  
**Status:** Baseline Requirement Disetujui Pemilik Proyek (Sesi Discovery 1–8 Selesai)  
**Tanggal Penetapan:** 25 Oktober 2026  

---

# BAGIAN I — DOKUMEN SPESIFIKASI REQUIREMENT (HASIL DISCOVERY SESI 1–8)

## 1. Executive Summary
Dokumen ini merupakan hasil penggalian kebutuhan (*Requirement Rediscovery*) dari nol bersama pemilik proyek untuk mendefinisikan ulang arah produk, kebutuhan fungsional, otomatisasi, pengalaman pengguna, dan batasan teknis **Nexura Management**.

Melalui 8 sesi tanya jawab kritis (25 keputusan terverifikasi), terungkap bahwa penyebab utama Nexura jarang digunakan selama ini bukanlah kurangnya jumlah halaman, melainkan:
1. **Ketidaksesuaian Alur Kerja Inti:** Tidak adanya tempat cepat untuk menangkap **ide mendadak (*Idea Scratchpad*)** dan **error/bug** per proyek, serta halaman utama `/tasks` yang belum memiliki **Ruang Kerja Papan Kanban Penuh** beserta panel **Active Focus & Checklist**.
2. **Defisit Kepercayaan Data:** Banyaknya metrik, persentase progres, dan status layanan yang dikodekan secara statis (*hardcoded*) sehingga informasi di layar tidak mencerminkan kondisi proyek sebenarnya.
3. **Tumpang Tindih Peran Antarhalaman:** Duplikasi besar antara `/repos` dan `/projects/:slug`, adanya tab `Supabase` yang salah konteks di dalam detail proyek, serta halaman `/roadmap` kuartalan (`Q1–Q4`) yang tidak cocok untuk cara kerja pengembang tunggal (*solo engineer*).

Dokumen ini menetapkan spesifikasi requirement dengan ID terstruktur (`FR-*`, `NFR-*`, `AUTO-*`, `INT-*`, `UX-*`, `SEC-*`) sekaligus menyajikan **Laporan Audit Ulang (*Gap Analysis*)** yang membandingkan requirement baru ini terhadap *codebase* aktual dan dokumen audit sebelumnya (`docs/management-system-audit.md`).

---

## 2. Product Vision
**Nexura Management** adalah *Personal Engineering Command Center* — ruang kerja harian tunggal bagi pemilik proyek untuk menangkap ide mendadak, mencatat *error/bug* dan *maintenance*, mengeksekusi tugas di atas papan Kanban dan *Weekly Sprint*, merencanakan rilis berbasis versi (`v1.0`, `v1.1`, `v2.0`), serta memantau kondisi langsung seluruh proyek dan repositori GitHub di satu tempat dengan data yang 100% jujur dan akurat.

---

## 3. Target Users
- **Pengguna Utama (`Terkonfirmasi`):** *Single-Owner / Solo Software Engineer* (pemilik *workspace* sendiri).
- **Karakteristik Penggunaan:** Menangani beberapa proyek perangkat lunak dan riset secara paralel, bekerja langsung dengan GitHub dan Vercel, membutuhkan kecepatan input tinggi (*low-friction capture*), serta mengelola seluruh infrastruktur di atas layanan *Free Tier* (\$0).

---

## 4. Problem Statement
Dalam pekerjaan teknis sehari-hari, pemilik proyek menghadapi empat masalah nyata:
1. **Kebingungan Prioritas Lintas Proyek:** Sulit menentukan tugas apa yang harus dikerjakan berikutnya ketika menangani beberapa proyek sekaligus.
2. **Kehilangan Ide Mendadak & Catatan Bug:** Sering muncul ide fitur baru atau temuan *error/maintenance* untuk suatu proyek secara tiba-tiba, namun Nexura saat ini hanya menyediakan formulir pembuatan *Deliverable* formal dengan tenggat waktu, tanpa ruang *Scratchpad / Idea & Bug Inbox* yang cepat.
3. **Kelelahan Berpindah Tab (*Context Switching*):** Harus membuka banyak tab terpisah untuk memeriksa progres tugas, daftar *error*, status *commit/PR*, dan *build* CI/CD dari seluruh proyek.
4. **Ketidakpercayaan pada Aplikasi Saat Ini:** Data yang tampil di `/projects` dan `/` masih menggunakan angka *fallback* statis/palsu, ditambah banyaknya aksi yang belum tuntas (seperti halaman `/tasks` yang tidak memiliki papan Kanban penuh dan tidak dapat membuka `TaskDrawer`).

---

## 5. Goals dan Non-Goals

### 5.1. Goals (Tujuan yang Ingin Dicapai)
1. Menyediakan **Ruang Kerja Kanban Terpadu (`/tasks`)** yang menggabungkan papan Kanban 5-tahap, tabel matriks, panel **Active Focus & Checklist**, dan **Idea Scratchpad & Bug Inbox**.
2. Menjadikan **Detail Proyek (`/projects/:slug`)** sebagai ruang kerja lengkap per proyek (*Overview, Kanban Proyek, Idea Scratchpad & Catatan Teknis, Log Error/Maintenance, serta Kokpit GitHub & Deployment*).
3. Menjadikan **Dashboard (`/`)** sebagai layar pemantauan 5-detik yang fokus pada 4 hal: *Hero & Quick Capture*, *Active Execution Queue*, *Kesehatan & Status Langsung Semua Proyek*, dan *Live DevOps Stream*.
4. Menjamin **100% Kejujuran Data** (menghapus seluruh angka palsu/statis) dan **Integritas Penyimpanan Tunggal** di Supabase PostgreSQL.
5. Mengotomatiskan penautan dan pembaruan status tugas dari aktivitas GitHub (`ENG-xxx`, PR *merged*, Issue *closed*) tanpa mewajibkan pemasangan *Webhook* manual (*Zero-Setup Auto-Sync*).
6. Mengamankan akses aplikasi dan database menggunakan **GitHub OAuth (khusus pemilik) + Fallback Access Key `.env`** dan penguncian RLS Supabase.

### 5.2. Non-Goals (Hal yang Tidak Ingin Dicapai)
1. **Bukan Aplikasi Kolaborasi Tim / Multi-Tenant:** Tidak membangun manajemen banyak pengguna, peran (*RBAC*), komentar tim, atau delegasi tugas antar-anggota.
2. **Bukan Sistem Kotak Masuk Notifikasi Mandiri:** Tidak membangun halaman `/inbox` atau lonceng notifikasi aktivitas klik sendiri (*self-spam*).
3. **Bukan Perencana Kuartal Korporat (`Q1–Q4`):** Tidak lagi menggunakan pembagian kuartal fiskal korporat pada `/roadmap`.
4. **Bukan Duplikator Inspektur GitHub di `/repos`:** Tidak lagi menampilkan 6 panel inspeksi mendalam GitHub di halaman `/repos` karena sudah dipusatkan di dalam `/projects/:slug`.
5. **Bukan Infrastruktur Berbayar:** Tidak menggunakan layanan di luar batas *Free Tier* (\$0).

---

## 6. Functional Requirements (`FR`)

| ID | Deskripsi Requirement | Alasan / Masalah yang Diselesaikan | Prioritas | Dasar Keputusan | Kriteria Penerimaan (Acceptance Criteria) | Dependensi | Status Validasi |
|---|---|---|---|---|---|---|---|
| **FR-001** | **Ruang Kerja Kanban & Tugas Terpadu (`/tasks`):** Halaman `/tasks` wajib menyediakan mode tampilan **Papan Kanban Penuh** (selain mode Tabel & Grup Status) yang dapat difilter untuk semua proyek atau per proyek spesifik. | Pengguna ingin memaksimalkan eksekusi Kanban di halaman utama `/tasks`, bukan hanya tabel baris. | **P0** | Jawaban 6 (C) & Jawaban 24 (B) | 1. Terdapat sakelar tampilan *Kanban Board \| Table Matrix \| Grouped List* di `/tasks`.<br>2. Filter proyek memfilter kartu Kanban secara *real-time*. | `UX-002`, `FR-002` | Terkonfirmasi |
| **FR-002** | **Alur 5 Kolom Standar Kanban:** Papan Kanban menggunakan urutan aliran kerja dari kiri ke kanan: (1) `idea` (*Idea / Backlog*), (2) `in_queue` (*To Do / Queue*), (3) `running_sprint` (*In Progress*), (4) `blocked` (*Testing / Bug / Blocked*), (5) `deployed` (*Done / Deployed*). | Urutan lama menaruh `ERROR` di kolom paling kiri dan belum memiliki tahap `Idea / Backlog`. | **P0** | Jawaban 6 (A), Jawaban 7, & Konfirmasi Sesi 8 | 1. Skema status mendukung kelima tahap.<br>2. Kartu dapat dipindahkan antar-5 kolom dengan *drag-and-drop* `0ms` optimistik dan tersimpan di Supabase. | Migrasi SQL `tasks.status` | Terkonfirmasi |
| **FR-003** | **Panel Pendamping "Idea Scratchpad & Bug Inbox" (Global di `/tasks` & Per Proyek di `/projects/:slug`):** Menyediakan ruang catatan bebas (Markdown/poin cepat) untuk menampung ide mendadak, daftar *bug/error*, atau catatan *maintenance* per proyek, dilengkapi tombol 1-klik **"Promote to Kanban"** yang mengubah poin ide/bug menjadi kartu tugas. | Pemilik sering tiba-tiba mendapat ide baru atau menemukan bug untuk suatu proyek tetapi tidak punya tempat mencatat cepat sebelum dijadikan tugas formal. | **P0** | Jawaban 2, 4 (B), 5 (C), 8 (A) | 1. Pengguna dapat menulis catatan ide/bug per proyek.<br>2. Catatan tersimpan di database Supabase.<br>3. Tombol *Promote* membuat kartu baru di kolom `idea`, `in_queue`, atau `blocked` (`Bug`). | Tabel/kolom `project_notes` di Supabase | Terkonfirmasi |
| **FR-004** | **Panel Pendamping "Active Focus & Checklist" di Ruang Kerja Kanban (`/tasks`):** Menampilkan 1–2 tugas yang sedang aktif dikerjakan (`running_sprint` pada sprint aktif) beserta daftar *sub-task/checklist* Markdown-nya secara terbuka di atas/samping papan Kanban. | Memudahkan eksekusi harian dan pencentangan *checklist* tanpa harus berulang kali membuka modal `TaskDrawer`. | **P0** | Jawaban 8 (B) & Jawaban 9 | 1. Tugas yang sedang berjalan tampil di panel *Active Focus*.<br>2. Mencetang item *checklist* langsung memperbarui deskripsi tugas di database. | `FR-007` (`/sprints`), `UX-003` | Terkonfirmasi |
| **FR-005** | **Katalog Proyek Aktif dengan Metrik Nyata & CRUD Lengkap (`/projects`):** Halaman `/projects` wajib menghitung progres (`%`), jumlah tugas (`deployed/total`), tenggat waktu, dan status langsung dari data nyata di database, serta menyediakan tombol **Create Project**, **Edit Project**, dan **Delete Project**. | Saat ini `/projects` menggunakan angka progres statis (`75%`, `90%`), tombol tambah proyek hilang dari template, dan belum ada fitur edit proyek. | **P0** | Jawaban 4 (A), Jawaban 20 (A) | 1. Progres proyek dengan 0 tugas tampil `0% (0/0 tasks)`.<br>2. Progres di `/projects` identik dengan `/projects/:slug`.<br>3. Pengguna dapat membuat, mengedit, dan menghapus proyek dari UI. | `SEC-002` | Terkonfirmasi |
| **FR-006** | **Ruang Kerja Detail Proyek Lengkap (`/projects/:slug`):** Menyediakan workspace terpusat per proyek yang mencakup: (1) *Overview & Konteks Proyek*, (2) *Kanban & Matrix Proyek*, (3) *Idea Scratchpad & Error/Maintenance Log Proyek*, serta (4) *Kokpit GitHub & Deployment* proyek tersebut. Tab `Supabase` internal dihapus, dan `slug` tidak valid wajib menampilkan status `404 Project Not Found`. | Cara kerja pemilik berpusat pada proyek (*Project-Centric*); seluruh konteks manajemen dan teknis satu proyek harus tuntas di `/projects/:slug`. | **P1** | Jawaban 12, 13 (A), 14 (A) | 1. Tab `Supabase` tidak lagi tampil di `/projects/:slug`.<br>2. Tab *Ideas & Notes* hadir di `/projects/:slug`.<br>3. Mengakses `/projects/slug-asing` menampilkan halaman 404 jujur. | `FR-003`, `INT-001` | Terkonfirmasi |
| **FR-007** | **Perencanaan & Evaluasi Weekly Sprints (`/sprints`):** Mempertahankan `/sprints` untuk menetapkan objektif mingguan (Senin–Minggu), menarik tugas ke sprint minggu yang dipilih secara akurat, dan melihat riwayat capaian per minggu. Rute warisan `/focus` dihapus sebagai file halaman mandiri. | Pemilik disiplin merencanakan target kerja mingguan (Senin–Minggu) dan mengevaluasi capaian tiap minggu. | **P1** | Jawaban 9 (B) | 1. Memilih minggu di dropdown `/sprints` benar-benar menampilkan sprint untuk minggu tersebut.<br>2. Objektif sprint disimpan 100% di database (bukan `localStorage`).<br>3. Penugasan tugas ke sprint dilakukan dalam 1 operasi API atomik. | `AUTO-002`, `SEC-002` | Terkonfirmasi |
| **FR-008** | **Peta Jalan Berbasis Fase & Versi Rilis (`/roadmap`):** Mengubah halaman `/roadmap` dari pengelompokan kuartal korporat (`Q1–Q4`) menjadi pengelompokan berbasis **Fase / Versi Rilis (`Backlog / Unversioned`, `MVP / v1.0`, `v1.1`, `v2.0`, `Released`)** per proyek. | Kuartal `Q1–Q4` tidak relevan untuk proyek pribadi; pengelompokan versi rilis (`v1.0`, `v1.1`) jauh lebih fungsional. | **P2** | Jawaban 10 (D) | 1. Tugas dan milestone proyek dapat diberi atribut `releaseVersion` / `phase` (misal `v1.0`).<br>2. Halaman `/roadmap` menampilkan progres penyelesaian tiap versi rilis secara nyata. | Kolom opsional `release_version` | Terkonfirmasi |
| **FR-009** | **Katalog Akun GitHub & Gerbang Impor (`/repos`):** Menyederhanakan `/repos` menjadi katalog seluruh repositori GitHub pemilik untuk memantau status ringkas dan mengimpor repo menjadi proyek di Nexura. Mengklik repo yang sudah berstatus *Managed* langsung membuka `/projects/:slug`. Aksi **Detach** hanya mengosongkan `githubRepo` tanpa menghapus proyek. | Menghilangkan duplikasi ~450 baris kode dengan `/projects/:slug` dan memperbaiki bug fatal tombol *Detach* yang menghapus proyek. | **P0** (Fix Detach) / **P1** (Simplify UI) | Jawaban 13 (A) | 1. Klik *Detach* hanya memanggil `updateProject(slug, { githubRepo: null })`.<br>2. Panel inspektur 6-bagian di bawah `/repos` dihapus dan diganti navigasi langsung ke `/projects/:slug`. | `INT-001` | Terkonfirmasi |
| **FR-010** | **Pusat Diagnostik & Cadangan Sistem (`/telemetry`):** Memusatkan pemantauan kesehatan sistem internal Nexura (status koneksi nyata ke Supabase, kuota *GitHub API Rate Limit*, status *environment*) serta menyediakan tombol **Export Backup JSON** satu-klik. | Memisahkan telemetri internal aplikasi dari halaman bisnis dan menyediakan cadangan data yang mudah. | **P1** (Honest Status) / **P2** (Backup JSON) | Jawaban 14 (A) & Jawaban 22 (A) | 1. Jika Supabase terputus, `/telemetry` menampilkan `Disconnected` secara jujur (tanpa `\|\| true`).<br>2. Tombol *Export Backup JSON* mengunduh seluruh data `projects`, `sprints`, `tasks`, dan `notes`. | `SEC-001`, `SEC-002` | Terkonfirmasi |

---

## 7. Nonfunctional Requirements (`NFR`)

| ID | Deskripsi Requirement | Alasan / Masalah yang Diselesaikan | Prioritas | Dasar Keputusan | Kriteria Penerimaan |
|---|---|---|---|---|---|
| **NFR-001** | **Biaya Infrastruktur \$0 (100% Free Tier):** Seluruh arsitektur wajib berjalan di dalam batas gratis *Vercel Hobby*, *Supabase Free Tier*, dan *GitHub REST API* tanpa komponen berbayar. | Menjaga keberlanjutan alat kerja pribadi tanpa beban biaya bulanan. | **P0** | Jawaban 23 (A) | Tidak ada dependensi pada Redis berbayar, worker berbayar, atau layanan cloud berbayar. |
| **NFR-002** | **Kinerja & Efisiensi Kuota API:** Pemuatan halaman awal tidak boleh melakukan panggilan API duplikat ke endpoint yang sama, dan permintaan detail GitHub pada `/projects/:slug` hanya dipicu saat tab terkait dibuka (*lazy tab fetching*). | Saat ini inisialisasi aplikasi memicu 3–4 panggilan duplikat ke `/api/tasks` dan 7 panggilan GitHub sekaligus. | **P1** | Jawaban 17 & Audit Sistem | 1. Hanya 1 permintaan `/api/tasks` dan `/api/projects` saat muat awal.<br>2. Tab GitHub/Security hanya di-*fetch* saat tab dibuka. |
| **NFR-003** | **Kualitas Kode & Otomatisasi Pengujian Inti di CI:** Pipeline GitHub Actions wajib menjalankan `nuxt typecheck` (`vue-tsc`) dan *automated tests* (`Vitest`) untuk skema validasi, repositori data, dan perhitungan metrik sebelum `nuxt build`. | Mencegah regresi tombol mati, ketidakcocokan tipe prop/emit, dan bug perhitungan metrik. | **P1/P2** | Jawaban 17 (A) | `.github/workflows/ci.yml` gagal otomatis jika ada error tipe TypeScript atau tes unit/API yang gagal. |

---

## 8. Automation Requirements (`AUTO`)

| ID | Deskripsi Requirement | Alasan / Masalah yang Diselesaikan | Prioritas | Dasar Keputusan | Kriteria Penerimaan |
|---|---|---|---|---|---|
| **AUTO-001** | **Zero-Setup GitHub Auto-Sync (Penautan & Transisi Status Otomatis):** Saat data *commits*, *PR*, atau *Issues* GitHub dimuat untuk suatu proyek, sistem secara otomatis: (1) menautkan *commit/PR* yang memuat kode `ENG-xxx` ke tugas terkait, dan (2) mengubah status tugas menjadi `deployed` (*Done*) apabila GitHub Issue terkait telah `closed` atau PR terkait telah `merged`, disertai *toast* pemberitahuan. | Mengurangi pekerjaan manual memperbarui status tugas setelah selesai melakukan *merge* PR atau menutup *issue* di GitHub, tanpa kerepotan memasang *Webhook* manual di tiap repo. | **P1** | Jawaban 15 (C) & Jawaban 16 (A, C) | 1. Tugas dengan `githubIssueNumber` yang berstatus `closed` di GitHub otomatis diperbarui menjadi `deployed`.<br>2. Muncul *toast* informasi: *"Synced X tasks from GitHub activity"*. |
| **AUTO-002** | **One-Click Confirmed Sprint Rollover:** Saat memasuki minggu baru dan terdapat sprint aktif minggu sebelumnya yang melewati `endDate` dengan tugas yang belum `deployed`, halaman `/sprints` menampilkan banner konfirmasi 1-klik: **"Selesaikan Sprint Minggu Lalu & Pindahkan X Tugas Belum Selesai ke Minggu Ini"**. | Memudahkan kelanjutan kerja antar-minggu tanpa risiko perpindahan buta di latar belakang saat pengguna sedang tidak aktif. | **P1** | Jawaban 15 (C) & Jawaban 16 (C) | Klik tombol *Rollover* menandai sprint lama sebagai `completed`, membuat/mengaktifkan sprint minggu baru, dan memindahkan seluruh tugas belum selesai ke sprint baru dalam 1 transaksi API. |
| **AUTO-003** | **Batasan Larangan Tindakan Otomatis Destruktif (*Automation Guardrails*):** Sistem dilarang keras menghapus proyek, menghapus tugas, atau memicu *rerun* GitHub Actions secara otomatis tanpa klik konfirmasi manual dari pengguna. | Mencegah kehilangan data atau konsumsi menit GitHub Actions yang tidak disengaja. | **P0** | Jawaban 16 | Tidak ada kode *background job* atau *sync* yang memanggil `deleteProject`, `deleteTask`, atau `workflow-rerun`. |

---

## 9. Integration Requirements (`INT`)

| ID | Deskripsi Requirement | Alasan / Masalah yang Diselesaikan | Prioritas | Dasar Keputusan | Kriteria Penerimaan |
|---|---|---|---|---|---|
| **INT-001** | **Integrasi GitHub Terpusat per Proyek:** Integrasi GitHub REST API (*Repos, Commits + Inline Diff, Branches, Actions Workflows + Rerun, Security Alerts, Deployments, PRs & Issues + Create Issue*) difokuskan pada proyek yang dikelola di `/projects/:slug` dan aliran ringkas di Dashboard (`/`). | Menghilangkan kebingungan peran antara `/repos` dan `/projects/:slug` serta menghemat kuota *rate limit* GitHub PAT. | **P1** | Jawaban 12 & Jawaban 13 (A) | Seluruh fitur inspeksi GitHub untuk proyek aktif dapat diakses dari dalam `/projects/:slug`, dan pembuatan *GitHub Issue* dari `TaskDrawer` menggunakan `project.githubRepo` yang sebenarnya (bukan nama *hardcoded*). |
| **INT-002** | **Allowlist Keamanan Repositori GitHub:** Seluruh *endpoint* `/api/github/*` (khususnya mutasi `create-issue` dan `workflow-rerun`) wajib memvalidasi bahwa parameter `repo` adalah milik `GITHUB_USERNAME` pemilik atau terdaftar di tabel `projects.github_repo`. | Mencegah penyalahgunaan `GITHUB_TOKEN` server untuk mengakses atau memodifikasi repositori pihak ketiga. | **P0** | Jawaban 21 & Audit Keamanan | Permintaan ke `/api/github/*` dengan nama `owner/repo` asing ditolak dengan HTTP `403 Forbidden`. |

---

## 10. UX/UI Requirements (`UX`)

| ID | Deskripsi Requirement | Alasan / Masalah yang Diselesaikan | Prioritas | Dasar Keputusan | Kriteria Penerimaan |
|---|---|---|---|---|---|
| **UX-001** | **Tata Letak Dashboard 4-Fokus Bersih (`/`):** Halaman utama Dashboard (`/`) wajib hanya memuat 4 area fokus: (1) *Hero & Quick Capture Bar* (untuk input cepat Ide, Bug, atau Tugas), (2) *Active Execution Queue*, (3) *Kesehatan & Status Langsung Semua Proyek Aktif*, dan (4) *Live DevOps Stream*. Panel duplikat (*Kanban bawah*, *Infrastructure Mesh*, dan kartu *Vercel Production*) dihapus dari Dashboard. | Mencegah kepadatan berlebih (*visual bloat*) di halaman utama dan menampilkan status langsung seluruh proyek dalam 5 detik pertama. | **P0** | Jawaban 18 & Jawaban 19 (A) | 1. Kartu *Active Projects Health Radar* tampil di Dashboard.<br>2. Bar *Quick Capture* tersedia di Dashboard.<br>3. Tidak ada lagi papan Kanban atau *Infrastructure Mesh* di bawah Dashboard. |
| **UX-002** | **Kejujuran Tampilan Data 100% (*Zero Fake Metrics*):** Seluruh halaman dilarang menampilkan angka, persentase, tanggal, atau status koneksi palsu (*hardcoded fallback*). Jika nilai aktual adalah `0`, tampilkan `0` atau *empty state* yang informatif; jika terjadi kegagalan API, tampilkan status *error* yang jujur. | Angka palsu (`14 in-flight`, `78% velocity`, `90% progress`, `'32ms · OK'` saat gagal) menghancurkan kepercayaan pengguna pada aplikasi. | **P0** | Jawaban 4 (A) & Jawaban 20 (A) | Nol kemunculan angka *fallback* statis pada seluruh kode sumber komponen dan halaman. |
| **UX-003** | **Layanan Global `<TaskDrawer />` & Sinkronisasi Cache Kanonik:** `<TaskDrawer />`, `<AddTaskModal />`, dan `<AddProjectModal />` dipasang secara global di `app/app.vue`. Mengklik tugas di halaman mana pun (`/`, `/tasks`, `/sprints`, `/projects/:slug`, `/roadmap`, maupun hasil `OmniSearch` `Ctrl+K`) wajib membuka `TaskDrawer` dengan daftar proyek dinamis dari database. | Saat ini klik tugas di `/tasks`, `/sprints`, dan `OmniSearch` gagal membuka `TaskDrawer`, serta dropdown proyek di `TaskDrawer` terkunci pada 3 nama proyek statis. | **P0** | Jawaban 20 (A) & Jawaban 24 (B) | 1. Klik tugas di `/tasks`, `/sprints`, dan `OmniSearch` langsung membuka `TaskDrawer`.<br>2. Perubahan tugas langsung terlihat di semua halaman tanpa *refresh* browser. |
| **UX-004** | **Optimalisasi `OmniSearch` (`Ctrl+K`) sebagai Command Deck:** `OmniSearch` mendukung pembukaan langsung `TaskDrawer` saat memilih tugas, aksi mutasi status cepat di panel pratinjau kanan, pembuatan tugas/ide instan saat hasil pencarian `0` (*Zero-Result Quick Capture*), serta riwayat item yang baru diakses (*Recent Items*). | Memaksimalkan fitur pencarian global menjadi alat eksekusi cepat lintas halaman. | **P1** | Permintaan Eksplisit Pemilik & Jawaban 20 (A) | Menekan `Enter` pada tugas di `OmniSearch` membuka `TaskDrawer`, dan mengetik judul baru yang belum ada menawarkan tombol *Create Deliverable / Idea*. |

---

## 11. Security dan Data Integrity Requirements (`SEC`)

| ID | Deskripsi Requirement | Alasan / Masalah yang Diselesaikan | Prioritas | Dasar Keputusan | Kriteria Penerimaan |
|---|---|---|---|---|---|
| **SEC-001** | **Autentikasi Wajib Pemilik (*GitHub OAuth + Fallback Access Key*):** Seluruh halaman dan *endpoint* `/api/*` wajib dilindungi oleh middleware autentikasi server (`server/middleware/auth.ts`) yang mendukung login **GitHub OAuth** (dibatasi ketat hanya untuk `GITHUB_USERNAME` pemilik) serta *fallback* **Access Key darurat** dari `.env` (`NEXURA_ACCESS_KEY`), disimpan dalam *cookie* sesi `HTTP-only` bertanda tangan. | Aplikasi di-deploy di domain publik Vercel; tanpa login, siapa pun di internet dapat menghapus database atau menyalahgunakan `GITHUB_TOKEN`. | **P0** | Jawaban 21 (C) | Permintaan tanpa sesi valid ke halaman aplikasi diarahkan ke `/login`, dan permintaan ke `/api/*` ditolak dengan HTTP `401 Unauthorized`. |
| **SEC-002** | **Penguncian RLS Supabase & Penghapusan Eksposur URL Publik:** Kebijakan RLS `FOR ALL USING (true)` untuk peran publik/`anon` pada tabel `projects`, `sprints`, dan `tasks` wajib dicabut (hanya mengizinkan akses dari server Nitro via `service_role`), dan `supabaseUrl` dihapus dari `runtimeConfig.public`. | Mencegah akses baca/tulis langsung ke PostgREST Supabase dari luar server aplikasi. | **P0** | Jawaban 21 (C) | Akses langsung ke REST API Supabase menggunakan kunci `anon` ditolak oleh RLS. |
| **SEC-003** | **Sumber Kebenaran Tunggal Supabase (Tanpa *Silent Split-Brain Fallback*):** Di lingkungan produksi/ketika Supabase dikonfigurasi, aplikasi dilarang mengalihkan kegagalan tulis/baca secara diam-diam ke penyimpanan lokal Nitro KV (`markSupabaseOffline`). Jika Supabase gagal, kembalikan status HTTP error yang jujur kepada pengguna. | Menulis ke KV lokal saat Supabase gagal menyebabkan kehilangan data diam-diam (*split-brain*) terutama di lingkungan *serverless* Vercel. | **P0** | Jawaban 22 (A) | Kegagalan koneksi atau constraint database mengembalikan respons error HTTP (`400`/`500`/`503`) yang ditampilkan di UI, bukan ditelan menjadi `[]` atau disimpan diam-diam di KV lokal. |

---

## 12. Constraints dan Trade-offs

1. **Batasan Biaya & Hosting (`Constraint`):** Wajib \$0 (*Free Tier* Vercel Hobby + Supabase Free + GitHub API).
   - *Trade-off yang Diterima:* Karena Vercel Hobby menggunakan fungsi *serverless* tanpa koneksi WebSocket permanen, sinkronisasi GitHub dilakukan melalui **Zero-Setup Auto-Sync (*On-Fetch Reconciliation*)** saat aplikasi aktif/dimuat, bukan melalui worker antrean latar belakang 24/7.
2. **Standarisasi Kolom Kanban vs Kustomisasi Bebas per Proyek (`Trade-off`):**
   - *Keputusan:* Menggunakan 5 kolom standar seragam (`Idea/Backlog`, `To Do/Queue`, `In Progress`, `Blocked/Bug`, `Done/Deployed`) di semua proyek agar papan Kanban gabungan di halaman `/tasks` dan metrik di Dashboard selalu sinkron tanpa pemetaan rumit.
3. **Kesederhanaan Halaman `/repos` vs Kelengkapan `/projects/:slug` (`Trade-off`):**
   - *Keputusan:* Menghapus panel inspektur 6-bagian dari `/repos` demi menghilangkan duplikasi kode ~450 baris dan memusatkan seluruh inspeksi mendalam di dalam `/projects/:slug`.

---

## 13. Prioritas: P0, P1, P2, dan Deferred

### Prioritas P0 — Fondasi Keamanan, Kejujuran Data, & Ruang Kerja Harian (Wajib Selesai Pertama)
- `SEC-001`, `SEC-002`, `SEC-003`, `INT-002`: Autentikasi GitHub OAuth + Fallback Key, penguncian RLS Supabase, dan penghapusan *silent fallback* KV.
- `UX-002`: Penghapusan total seluruh angka/progres/status palsu (*hardcoded*) di semua halaman.
- `UX-003`: Penyatuan kunci cache Nuxt (`useWorkspace*`) dan pengangkatan `<TaskDrawer />`, `<AddTaskModal />`, `<AddProjectModal />` menjadi layanan global di `app/app.vue`.
- `FR-001`, `FR-002`, `FR-003`, `FR-004`: Ruang kerja `/tasks` dengan **Papan Kanban Penuh 5-Kolom**, **Idea Scratchpad & Bug Inbox** (beserta tombol *Promote to Kanban*), dan panel **Active Focus & Checklist**.
- `UX-001`: Pembersihan tata letak **Dashboard (`/`)** menjadi 4 fokus utama (*Hero & Quick Capture*, *Active Execution Queue*, *Active Projects Health Radar*, *Live DevOps Stream*).
- `FR-005` & `FR-009` (Bagian Kritis): Perhitungan progres nyata + CRUD proyek lengkap di `/projects`, serta perbaikan bug tombol **Detach** di `/repos` agar tidak menghapus proyek.

### Prioritas P1 — Kelengkapan Workspace Proyek, Sprint, Pencarian, & Auto-Sync
- `FR-006`, `INT-001`: Penyempurnaan `/projects/:slug` (penambahan tab/panel *Project Scratchpad & Error/Maintenance Log*, penghapusan tab `Supabase` internal, dan halaman 404 untuk slug tidak valid).
- `FR-009` (Penyederhanaan UI): Penyederhanaan `/repos` menjadi katalog ringan & gerbang impor.
- `FR-007`, `AUTO-002`: Perbaikan pemilih minggu di `/sprints`, transaksi tunggal penugasan sprint, penghapusan `/focus`, dan fitur **1-Klik Sprint Rollover**.
- `AUTO-001`: Implementasi **Zero-Setup GitHub Auto-Sync** (penautan otomatis `ENG-xxx` dan penyelesaian otomatis tugas saat PR *merged* / Issue *closed*).
- `UX-004`, `NFR-002`: Peningkatan `OmniSearch` (*In-Palette Quick Mutators*, *Zero-Result Quick Capture*, *Recent Items*) dan *lazy-loading* tab GitHub.

### Prioritas P2 — Peta Jalan Versi Rilis, Backup Data, & Gerbang Kualitas CI
- `FR-008`: Perombakan halaman `/roadmap` menjadi peta jalan berbasis **Fase / Versi Rilis (`MVP / v1.0`, `v1.1`, `v2.0`)**.
- `FR-010`: Fitur **Export Backup JSON** satu-klik di halaman `/telemetry`.
- `NFR-003`: Pemasangan `Vitest` dan pengaktifan gerbang `typecheck` + *unit/API test* di `.github/workflows/ci.yml`.

### Ditunda (*Deferred*) & Ditolak (*Rejected*)
- **Ditunda (`Deferred`):** Pengaitan langsung kartu Kanban ke *branch/commit* spesifik di atas permukaan kartu (Jawaban 6), dan *endpoint* GitHub Webhook latar belakang (Jawaban 16).
- **Ditolak (`Rejected`):** Sistem kotak masuk notifikasi mandiri, fitur multi-pengguna/RBAC, dan kuartal korporat Q1–Q4.

---

## 14. Acceptance Criteria Tingkat Sistem
1. **Keamanan:** Tidak ada satu pun halaman atau endpoint API yang dapat diakses tanpa sesi login pemilik yang sah.
2. **Kejujuran Data:** Proyek baru dengan 0 tugas selalu menampilkan progres `0% (0/0 tasks)` di `/`, `/projects`, `/projects/:slug`, dan `/roadmap`.
3. **Alur Ide ke Eksekusi:** Pengguna dapat mengetik ide mendadak atau *error* baru dari *Quick Capture* (di `/` atau `/tasks` atau `/projects/:slug`) dalam waktu < 5 detik, lalu mempromosikannya menjadi kartu Kanban dengan 1 klik.
4. **Konsistensi Global:** Mengklik tugas dari halaman mana pun atau dari `OmniSearch` (`Ctrl+K`) selalu membuka `TaskDrawer` yang sama, dan perubahan langsung tersinkronisasi di seluruh halaman tanpa *hard refresh*.
5. **Keamanan Aksi Repositori:** Melepas tautan repositori (*Detach*) di `/repos` tidak pernah menghapus proyek atau tugas dari database.

---

## 15. Assumptions dan Unverified Hypotheses
1. **`ASM-001` (Perilaku Frekuensi Penggunaan):** Diasumsikan bahwa setelah data palsu dihapus, UI Dashboard dirampingkan ke 4 fokus utama, dan fitur *Idea Scratchpad* + *Maximized Kanban* tersedia di `/tasks`, frekuensi penggunaan harian oleh pemilik akan meningkat secara signifikan. *(Akan diverifikasi melalui penggunaan nyata pasca-Fase P0).*
2. **`ASM-002` (Konvensi Penamaan Commit/PR):** Untuk fitur `AUTO-001` (*Auto-Link `ENG-xxx`*), diasumsikan pemilik bersedia menyertakan kode tugas (misal `ENG-012`) pada pesan *commit* atau judul *Pull Request*, atau membuat *GitHub Issue* langsung dari tombol di `TaskDrawer`.
3. **`ASM-003` (Akses Migrasi SQL Supabase Produksi):** Diasumsikan pemilik memiliki akses ke SQL Editor Supabase produksi untuk menjalankan skrip migrasi penambahan tabel/kolom catatan ide (`project_notes`), status `'idea'`, kolom `release_version`, dan pencabutan RLS `anon`.

---

## 16. Open Decisions
Tidak ada keputusan arsitektur atau produk tingkat tinggi yang masih menggantung; seluruh 25 poin keputusan pada Sesi 1–8 telah dikonfirmasi oleh pemilik proyek. Detail visual mikro (seperti tata letak piksel kartu di dalam tema *Dark Obsidian*) dapat diselaraskan langsung saat implementasi.

---

## 17. Requirement Traceability Matrix

| Requirement ID | Sesi & Pertanyaan Sumber | Modul / Rute Terdampak | Temuan Audit Lama Terkait (`docs/management-system-audit.md`) |
|---|---|---|---|
| **FR-001** | Sesi 3 — Pertanyaan 6 (C) | `/tasks`, `components/KanbanBoard.vue` | `TASK-001`, `TASK-002` |
| **FR-002** | Sesi 3 — Pertanyaan 6 (A), 7, 25 | `types/task.ts`, `server/schemas/task.schema.ts`, `KanbanBoard.vue` | `TASK-002` |
| **FR-003** | Sesi 1–3 — Pertanyaan 2, 4 (B), 5 (C), 8 (A) | `/tasks`, `/projects/:slug`, `/`, `server/api/notes*` (baru) | *Kebutuhan Baru Hasil Discovery* |
| **FR-004** | Sesi 3 — Pertanyaan 8 (B), 9 | `/tasks`, `/sprints` | *Kebutuhan Baru Hasil Discovery* |
| **FR-005** | Sesi 2–3 — Pertanyaan 4 (A), 20 (A) | `/projects`, `components/EditProjectModal.vue` | `PROJ-001`, `PROJ-002`, `PROJ-003`, `PROJ-004` |
| **FR-006** | Sesi 3 — Pertanyaan 12, 13 (A), 14 (A) | `/projects/:slug` | `PDET-001`, `PDET-002`, `PDET-003`, `PDET-005` |
| **FR-007** | Sesi 3 — Pertanyaan 9 (B) | `/sprints`, `/focus` | `SPRI-001`, `SPRI-002`, `SPRI-003`, `SPRI-004`, `FOCU-001` |
| **FR-008** | Sesi 3 — Pertanyaan 10 (D) | `/roadmap` | `ROAD-001`, `ROAD-002`, `ROAD-003` |
| **FR-009** | Sesi 3 — Pertanyaan 13 (A) | `/repos` | `REPO-001`, `REPO-002`, `REPO-003` |
| **FR-010** | Sesi 3 & 6 — Pertanyaan 14 (A), 22 (A) | `/telemetry`, `server/api/telemetry.get.ts` | `TELE-001` |
| **AUTO-001** | Sesi 4 — Pertanyaan 15 (C), 16 (A) | `server/api/github/*`, `composables/useGitHub.ts` | Bagian 13.3 (`Auto-Link Commit/PR`) |
| **AUTO-002** | Sesi 4 — Pertanyaan 15 (C), 16 (C) | `/sprints`, `server/api/sprints*` | `SPRI-004` |
| **UX-001** | Sesi 5 — Pertanyaan 18, 19 (A) | `/`, `components/Dashboard.vue`, `components/dashboard/*` | `DASH-001`, `DASH-002`, `DASH-003`, `DASH-005` |
| **UX-002** | Sesi 5 — Pertanyaan 20 (A) | Seluruh Halaman & Komponen | `DASH-001..003`, `PROJ-001`, `ROAD-001..002`, `TASK-004`, `TELE-001` |
| **UX-003** | Sesi 5 — Pertanyaan 20 (A) | `app/app.vue`, `composables/useTasks.ts`, `TaskDrawer.vue` | `ARCH-001`, `DASH-004`, `TASK-001` |
| **UX-004** | Sesi 5 — Pertanyaan 20 (A) & Bagian 20 | `composables/useOmniSearch.ts`, `components/search/*` | `OMNI-001` s/d `OMNI-006` |
| **SEC-001..003** | Sesi 6 — Pertanyaan 21 (C), 22 (A) | `server/middleware/auth.ts`, `server/repositories/*`, Migrasi SQL | `SEC-001`, `SEC-002`, `SEC-003`, `SEC-004`, `DATA-003`, `REL-001` |

---

## 18. Baseline untuk Audit Ulang
Dengan disetujuinya Spesifikasi Requirement di atas (Pertanyaan 25 — Opsi A), bagian selanjutnya dari dokumen ini melakukan **Audit Ulang (*Re-Audit & Gap Analysis*)** dengan membandingkan spesifikasi requirement ini terhadap kondisi aktual *codebase* dan temuan pada `docs/management-system-audit.md`.


---

# BAGIAN II — LAPORAN AUDIT ULANG (GAP ANALYSIS) & ROADMAP REMEDIASI

Bagian ini membandingkan **Spesifikasi Requirement Baseline (Bagian I)** terhadap kondisi aktual *codebase* Nexura Management (`d:\Project_Center\REWORK\Management`) serta merekonsiliasinya dengan temuan pada dokumen audit teknis awal (`docs/management-system-audit.md`).

---

## 19. Evaluasi Pemenuhan Requirement terhadap Codebase Aktual

### 19.1. Requirement yang Sudah Terpenuhi (*Fulfilled*)
Hanya fondasi infrastruktur dasar yang saat ini sudah sesuai tanpa memerlukan perubahan arsitektur besar:

| ID Requirement | Bukti Implementasi Aktual di Codebase | Status |
| :--- | :--- | :--- |
| **NFR-001** (*Zero-Cost Stack*) | Menggunakan Nuxt 4 (`^4.1.2`), Tailwind CSS (`@nuxtjs/tailwindcss`), `@supabase/supabase-js`, dan `octokit` pada `package.json` tanpa ketergantungan layanan berbayar. | **Terpenuhi** |
| **Fondasi Drag & Drop Kanban Dasar** | `app/components/KanbanBoard.vue` sudah memiliki mekanisme *HTML5 drag-and-drop* antar kolom dan pembaruan status melalui `PATCH /api/tasks/:id`. | **Terpenuhi (Perlu Perluasan Kolom & View)** |
| **Fondasi Validasi Payload Dasar** | `server/schemas/task.schema.ts`, `project.schema.ts`, dan `sprint.schema.ts` sudah menggunakan `zod` bersama `server/utils/validation.ts` (`readValidatedBodyWithSchema`). | **Terpenuhi (Perlu Penyesuaian Enum & Schema Baru)** |

---

### 19.2. Requirement yang Baru Terpenuhi Sebagian (*Partially Fulfilled*)

| ID Requirement | Kondisi Aktual di Codebase | Gap (Kesenjangan) yang Harus Diperbaiki |
| :--- | :--- | :--- |
| **FR-001** (*Full Kanban View & Project Switcher di `/tasks`*) | `app/pages/tasks.vue` memiliki *filter* proyek (`projectFilter`), pencarian, serta mode `Table` dan `Grouped`, tetapi **tidak memiliki mode tampilan `KanbanBoard`**. Selain itu, rasio `"X% Complete"` di kartu *Project Overview* (`L115`) masih *hardcoded* `Math.round((count / (tasks.length || 1)) * 90)`. | Tambahkan *tab switcher* `Kanban \| Table \| Grouped` di `/tasks.vue`, pasang `KanbanBoard.vue` yang merespons `projectFilter`, dan perbaiki rumus persentase penyelesaian proyek secara jujur. |
| **FR-005** (*Katalog Proyek Jujur & CRUD Lengkap di `/projects`*) | `app/pages/projects/index.vue` menampilkan daftar proyek dan modal tambah proyek, namun: (1) kolom `progress` dan `tasks` disimpan statis saat buat proyek (`0%`, `0`) dan tidak pernah dihitung dari tabel `tasks`; (2) tombol pemicu di halaman tidak membuka `AddProjectModal` lokal karena salah *state binding*; (3) belum ada fitur **Edit Proyek**; (4) `DELETE /api/projects/:id` meninggalkan *orphan tasks* karena tidak menghapus/melepas `project_slug`. | Hitung `progress` dan jumlah `tasks` secara dinamis dari tabel `tasks`, perbaiki *binding* modal tambah proyek, tambahkan `EditProjectModal` + `PATCH /api/projects/:id`, dan tangani relasi tugas saat proyek dihapus. |
| **FR-006** (*Ruang Kerja Detail Proyek `/projects/:slug`*) | `app/pages/projects/[slug].vue` memiliki *tab* `Overview`, `Tasks`, `GitHub`, dan `Supabase`. Namun: (1) jika `slug` tidak ditemukan, halaman merender *fallback* palsu (`id: '0'`, `progress: 65`, `status: 'ACTIVE'`); (2) klik kartu di `KanbanBoard` tidak membuka `TaskDrawer`; (3) belum ada panel **Project Idea Scratchpad & Error/Maintenance Log**; (4) masih ada *tab* `Supabase` yang tidak dibutuhkan. | Hapus *fallback* proyek palsu (tampilkan 404 jujur), hubungkan klik kartu Kanban ke `TaskDrawer` global, tambahkan panel *Project Idea Scratchpad & Error/Maintenance Log*, dan hapus *tab* `Supabase`. |
| **FR-007** (*Perencanaan Sprint Mingguan `/sprints`*) | `app/pages/sprints.vue` sudah menghitung *window* Senin–Minggu dan menyimpan `taskIds` di `sprints`, namun: (1) metrik di *banner* bawah (`14 In-Flight`, `02 Blocked`, `78% Velocity`) *hardcoded*; (2) *progress checklist* di `composables/useTasks.ts` tidak menghitung format Markdown `- [x]`; (3) file `/focus.vue` yang duplikatif masih ada di `app/pages/focus.vue`. | Ganti seluruh angka *hardcoded* di `/sprints.vue` dengan perhitungan nyata dari `sprintTasks`, perbaiki *regex* `getChecklistProgress()` untuk mendukung `- [x]` / `- [ ]`, dan hapus `app/pages/focus.vue`. |
| **FR-009** (*Katalog & Gerbang Impor GitHub `/repos`*) | `app/pages/repos.vue` sudah mengambil daftar repositori GitHub dan memiliki alur impor ke proyek, namun: (1) tombol **"Detach"** (`L112–123`) memanggil `DELETE /api/projects/:id` sehingga **menghapus seluruh proyek di database** alih-alih melepas tautan repo; (2) menyimpan ~340 baris kode *GitHub Inspector* duplikat (`L166–504`); (3) hanya mengambil 12 repo (`per_page=12`). | Ubah aksi **"Detach"** menjadi `PATCH /api/projects/:id` (`{ githubRepo: '' }`), hapus panel *Inspector* duplikat di `/repos.vue` sehingga klik repo terkelola langsung mengarahkan ke `/projects/:slug`, dan naikkan batas pengambilan menjadi `per_page=100`. |
| **FR-010** (*Diagnostik Infrastruktur `/telemetry`*) | `app/pages/telemetry.vue` dan `server/api/telemetry.get.ts` sudah ada, tetapi: (1) status Supabase dipaksa `connected: Boolean(...) \|\| true`; (2) `apiLatencyMs` di-*hardcode* `42`; (3) ukuran *storage* dipalsukan (`projects * 12 + tasks * 4`); (4) belum ada tombol **Export Backup JSON**. | Ubah `/api/telemetry` agar melakukan *ping query* nyata ke Supabase dengan pengukuran waktu (`performance.now()`), tampilkan jumlah baris tabel secara jujur, pindahkan kartu *Infrastructure Mesh* dari Dashboard ke sini, dan tambahkan fitur **1-Click Export Backup JSON**. |
| **UX-001** (*Dashboard 4 Prioritas Utama `/`*) | `app/components/Dashboard.vue` sudah memiliki *Hero*, *Execution Queue*, *Project Matrix*, dan *DevOps Stream*, namun: (1) sebagian besar metrik di *Hero* (`72%`, `+14%`, `18h`, `12/16`) *hardcoded*; (2) belum memiliki **Quick Capture Bar** untuk mencatat *Idea/Bug/Task* secara instan; (3) masih memuat `KanbanBoard` penuh, `InfrastructureMeshCard`, dan kartu `Vercel Production` statis di bagian bawah. | Tambahkan **Quick Capture Bar** di zona atas Dashboard, hitung seluruh indikator *Hero* & *Project Health* dari data nyata, dan bersihkan komponen bawah yang redundan. |
| **UX-003** (*Konsistensi State & Global `TaskDrawer`*) | `TaskDrawer.vue` hanya di-*mount* secara lokal di `app/pages/tasks.vue`. Setiap halaman memanggil `useTasks()` yang membuat `ref([])` lokal terpisah sehingga mutasi di satu komponen tidak memperbarui komponen lain. | Pindahkan *state* ke *singleton store* berbasis `useState` dan pasang `TaskDrawer`, `AddTaskModal`, serta `AddProjectModal` satu kali secara global di `app/app.vue`. |
| **UX-004** (*`OmniSearch` `Ctrl+K` sebagai Global Command Palette*) | `OmniSearchModal.vue` dan `useOmniSearch.ts` sudah memiliki pencarian *fuzzy* dan navigasi *keyboard*, namun: (1) klik hasil tugas hanya melakukan `router.push('/tasks')` tanpa membuka tugas yang diklik; (2) hanya mengindeks 12 repo GitHub; (3) masih menampilkan rute `/focus`; (4) belum mengindeks *Idea Scratchpad & Bug Inbox* maupun *Quick Actions* (`> Buat Ide`, `> Buat Tugas`, `> Export JSON`). | Integrasikan pemilihan hasil tugas dengan `openTaskDrawer(task.id)`, indeks seluruh proyek/tugas/catatan *Scratchpad*, hapus `/focus`, dan tambahkan *Quick Commands*. |
| **INT-001** (*Integrasi GitHub Read/Write*) | Endpoint GitHub (`repos`, `details`, `commits`, `issues`, `pulls`, `workflows`, `comments`) sudah berfungsi melalui Octokit, namun setiap tab memicu *request* terpisah dan belum ada *in-memory cache* TTL di sisi server. | Tambahkan *server-side cache* ringan (TTL 60–120 detik) pada endpoint GitHub untuk mencegah *rate-limit* dan mempercepat perpindahan halaman. |

---

### 19.3. Requirement yang Belum Terpenuhi Sama Sekali (*Unfulfilled / Missing*)

| ID Requirement | Deskripsi Kebutuhan yang Belum Ada di Codebase | Lokasi Implementasi Target |
| :--- | :--- | :--- |
| **FR-002** (*Alur 5 Kolom Kanban Standar*) | Enum `TaskStatus` saat ini hanya 4 status (`in_queue`, `running_sprint`, `deployed`, `blocked`) dengan urutan kolom di `KanbanBoard.vue` yang tidak kronologis (`deployed` berada di kolom ke-3 sebelum `blocked`). Status ke-5 **`idea`** (*Idea / Backlog*) belum ada. | `app/types/tasks.ts`, `server/schemas/task.schema.ts`, `app/components/KanbanBoard.vue`, dan migrasi SQL. |
| **FR-003** (*Idea Scratchpad & Bug Inbox + 1-Click Promote to Kanban*) | Belum ada tabel database, API endpoint, maupun komponen UI untuk mencatat ide mentah (*Catatan Ide*), daftar *error/bug*, dan catatan *maintenance* per proyek beserta tombol **"Promote to Kanban"**. | Tabel/kolom baru di Supabase (`project_notes` / `idea_items`), `/api/notes/*`, panel pendamping di `/tasks.vue`, dan tab/panel di `/projects/[slug].vue`. |
| **FR-004** (*Panel Active Focus & Checklist di `/tasks`*) | Halaman `/tasks.vue` belum memiliki panel pendamping yang menampilkan 1–2 tugas yang sedang dikerjakan (`running_sprint`) beserta *checklist* Markdown interaktifnya secara langsung. | Komponen `ActiveFocusPanel.vue` di dalam `app/pages/tasks.vue`. |
| **FR-008** (*Roadmap Berbasis Versi Rilis `MVP / v1.0 -> v1.1 -> v2.0`*) | `app/pages/roadmap.vue` saat ini mengelompokkan proyek ke dalam kuartal korporat `Q1–Q4` hanya berdasarkan huruf di nama `slug` (`slug.includes('v2')`) dan memalsukan tanggal rilis (`10 + idx * 3`). Belum ada atribut versi/fase rilis pada model data. | Tambahkan atribut `releasePhase` / `milestoneVersion` pada proyek/tugas dan bangun ulang `app/pages/roadmap.vue` berdasarkan fase rilis (`MVP / v1.0`, `v1.1`, `v2.0 / Backlog`). |
| **AUTO-001** (*Zero-Setup GitHub Auto-Sync*) | Belum ada rekonsiliasi otomatis yang mencocokkan ID tugas (`ENG-xxx`) pada pesan *commit*/PR/Issue GitHub ke tugas di Nexura atau memindahkan status tugas ke `deployed` saat PR terkait di-*merge*. | `server/utils/github-sync.ts` atau *hook* rekonsiliasi saat mengambil detail GitHub proyek (`GET /api/github/details`). |
| **AUTO-002** (*One-Click Confirmed Sprint Rollover*) | Belum ada deteksi sprint mingguan yang telah berakhir maupun tombol konfirmasi 1-klik untuk memindahkan tugas yang belum selesai (`!= 'deployed'`) ke sprint minggu berjalan. | `app/pages/sprints.vue` dan `POST /api/sprints/rollover`. |
| **SEC-001** (*Autentikasi GitHub OAuth + Fallback Access Key*) | Aplikasi saat ini **100% terbuka tanpa autentikasi**. Tidak ada halaman login, session cookie, ataupun `server/middleware/auth.ts`. | `server/middleware/auth.ts`, rute login `/login`, integrasi GitHub OAuth khusus akun pemilik + *fallback* kunci akses `.env`. |
| **SEC-002** (*Penguncian RLS Supabase*) | Migrasi `001_create_nexura_tables.sql` dan `002_create_sprints_table.sql` memberikan `USING (true) WITH CHECK (true)` kepada role publik `anon`. | Migrasi SQL baru `003_lockdown_rls_and_schema.sql` dan penggunaan `SUPABASE_SERVICE_ROLE_KEY` khusus di *server-side* Nuxt. |
| **SEC-003** (*Penghapusan Silent Fallback Nitro KV & Fitur Export Backup*) | `server/repositories/index.ts` masih membungkus setiap operasi database dengan `withRepositoryFallback()` yang diam-diam mengalihkan penulisan ke memori lokal `.data/kv` (`markSupabaseOffline`) ketika Supabase gagal. | Hapus `markSupabaseOffline` pada operasi mutasi di `server/repositories/index.ts` agar mengembalikan error HTTP yang jujur, serta buat endpoint `GET /api/backup/export`. |
| **INT-002** (*Validasi Allowlist Repositori GitHub*) | `POST /api/github/issues` dan `POST /api/github/comments` menerima parameter `owner` dan `repo` sembarang tanpa memeriksa apakah repo tersebut milik pengguna atau terdaftar di proyek. | Tambahkan validasi kepemilikan/allowlist repositori di `server/utils/github.ts`. |
| **NFR-003** (*CI Quality Gate: `typecheck` + `Vitest`*) | `.github/workflows/ci.yml` hanya menjalankan `npm run build`. Belum ada `vitest` maupun pengujian unit/API otomatis. | Tambahkan `vitest`, tulis pengujian unit untuk skema Zod, kalkulasi metrik, dan repositori, serta perbarui `.github/workflows/ci.yml`. |

---

## 20. Fitur di Codebase Tanpa Kebutuhan Terkonfirmasi (Kandidat Penghapusan / Penyederhanaan)

Sesuai aturan keselamatan repositori, daftar komponen/fitur di bawah ini **tidak memiliki kebutuhan terkonfirmasi** dari pemilik proyek dan direkomendasikan untuk **dihapus atau disederhanakan setelah Anda memberikan persetujuan eksplisit untuk tahap implementasi**:

| No | Fitur / Komponen di Codebase | Lokasi File | Alasan Penghapusan / Penyederhanaan | Keputusan Pemilik Proyek |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Halaman mandiri `/focus`** | `app/pages/focus.vue` & referensi `nav:focus` di `composables/useOmniSearch.ts` | Tidak ada di menu Sidebar dan fungsinya telah digantikan oleh panel **Active Focus & Checklist (`FR-004`)** di halaman `/tasks` serta halaman `/sprints` (`FR-007`). | Dikonfirmasi pada **Pertanyaan 9 (Opsi B)**. |
| 2 | **Tab internal `Supabase` di dalam Detail Proyek** | `app/pages/projects/[slug].vue` (`L56`, `L243–265`) | Menampilkan status koneksi database internal aplikasi Nexura di dalam setiap halaman proyek. Pemilik proyek mengonfirmasi bahwa seluruh proyek menggunakan database yang berbeda-beda dan diagnostik internal Nexura cukup berada di `/telemetry`. | Dikonfirmasi pada **Pertanyaan 14 (Opsi A)**. |
| 3 | **Panel Inspektur GitHub 6-Bagian yang Terduplikasi di `/repos`** | `app/pages/repos.vue` (`L166–504`) | Menduplikasi ~340 baris kode inspektur GitHub yang sudah ada secara lengkap di `/projects/[slug].vue`. Halaman `/repos` disederhanakan menjadi murni **Katalog & Gerbang Impor Akun GitHub (`FR-009`)**. | Dikonfirmasi pada **Pertanyaan 13 (Opsi A)**. |
| 4 | **Panel `KanbanBoard` Bawah, `InfrastructureMeshCard`, dan Kartu Statis `Vercel Production` di Dashboard (`/`)** | `app/components/Dashboard.vue` (`L49–95`) & `app/components/dashboard/InfrastructureMeshCard.vue` | Memenuhi halaman utama dengan informasi berulang. Kanban penuh kini dipusatkan di `/tasks` (`FR-001`), sedangkan `InfrastructureMeshCard` dipindahkan ke `/telemetry` (`FR-010`). | Dikonfirmasi pada **Pertanyaan 19 (Opsi A)**. |
| 5 | **Pengelompokan Kuartal Korporat `Q1–Q4` Palsu di `/roadmap`** | `app/pages/roadmap.vue` (`L8–43`) | Mengelompokkan proyek ke Q1–Q4 hanya dari pencocokan teks `slug` dan memalsukan tanggal rilis. Digantikan dengan pengelompokan **Versi / Fase Rilis (`MVP / v1.0 -> v1.1 -> v2.0`)** (`FR-008`). | Dikonfirmasi pada **Pertanyaan 10 (Opsi D)**. |
| 6 | **Mekanisme *Silent Write Fallback* ke Nitro KV (`markSupabaseOffline`)** | `server/repositories/index.ts`, `local-project.repository.ts`, `local-task.repository.ts`, `local-sprint.repository.ts` | Menyebabkan *split-brain* (data terlihat tersimpan di lokal saat Supabase lambat, namun hilang di produksi/saat *refresh*). | Dikonfirmasi pada **Pertanyaan 22 (Opsi A — `SEC-003`)**. |
| 7 | **Middleware Pencatat Kunjungan Lokal (`visit.ts`)** | `server/middleware/visit.ts` | Menulis `last_visit` ke penyimpanan KV lokal pada setiap *request* halaman tanpa pernah dibaca atau ditampilkan di bagian mana pun dari aplikasi. | Direkomendasikan untuk dihapus guna menghemat *overhead* I/O pada setiap *request*. |

---

## 21. Rekonsiliasi dengan Temuan Audit Lama (`docs/management-system-audit.md`)

Tabel berikut memetakan hubungan antara temuan pada dokumen audit lama (`docs/management-system-audit.md`) dengan hasil *Requirement Rediscovery* terbaru:

### 21.1. Temuan Audit Lama yang Tetap Valid & Diperkuat oleh Requirement Baru
| ID Audit Lama | Ringkasan Temuan Audit Lama | Status dalam Requirement Baru |
| :--- | :--- | :--- |
| **`SEC-001` s/d `SEC-004`** | Aplikasi tanpa autentikasi, RLS Supabase terbuka untuk `anon`, endpoint mutasi GitHub tanpa *allowlist*, dan eksposur detail error internal. | **Diperkuat penuh** melalui **`SEC-001`**, **`SEC-002`**, dan **`INT-002`** (Pertanyaan 21 & 22). |
| **`ARCH-001`, `DASH-004`, `TASK-001`** | *State* `useProjects`/`useTasks` tidak terpusat (*per-component ref*) dan `TaskDrawer` hanya terpasang di `/tasks.vue`. | **Diperkuat penuh** melalui **`UX-003`** (Pertanyaan 20). |
| **`DASH-001..003`, `PROJ-001`, `TASK-004`, `SPRI-001`, `TELE-001`** | Metrik *hardcoded* (`72%`, `90%`, `14 in-flight`, `42ms`, `|| true`) yang merusak kepercayaan pengguna. | **Diperkuat penuh** melalui **`UX-002`** (Kebijakan 100% Data Jujur — Pertanyaan 20). |
| **`REPO-001`** | Tombol *"Detach"* di `/repos.vue` memanggil `DELETE /api/projects/:id` sehingga menghapus seluruh proyek. | **Diperkuat sebagai prioritas kritis P0** di **`FR-009`**. |
| **`SPRI-002`** | Regex `getChecklistProgress()` tidak mengenali format Markdown `- [x]` yang dibuat oleh `TaskDrawer.vue`. | **Diperkuat penuh** di **`FR-004`** dan **`FR-007`**. |
| **`OMNI-001` s/d `OMNI-006`** | `OmniSearch` (`Ctrl+K`) tidak membuka tugas yang diklik, membatasi 12 repo, dan belum memiliki *Quick Actions*. | **Diperkuat penuh** di **`UX-004`**. |

### 21.2. Rekomendasi Audit Lama yang Diubah / Disesuaikan oleh Keputusan Baru Pemilik Proyek
| ID / Bagian Audit Lama | Rekomendasi Awal pada Audit Lama | Perubahan Berdasarkan Keputusan Pemilik Proyek (Baseline Baru) |
| :--- | :--- | :--- |
| **`TASK-002` & `FR-001..004`** | Audit lama hanya menyarankan penambahan *tab* `Kanban` dan perbaikan status 4 kolom (`in_queue`, `running_sprint`, `blocked`, `deployed`). | **Diperluas secara signifikan (Pertanyaan 5–8)**: Halaman `/tasks` menjadi pusat kerja harian dengan **5 kolom standar** (menambahkan status **`idea`** di kolom pertama) + dua panel pendamping baru: **Idea Scratchpad & Bug Inbox (`FR-003`)** dengan tombol *Promote to Kanban* dan **Active Focus & Checklist (`FR-004`)**. |
| **`REPO-003` (Ekstraksi `RepoInspectorCockpit.vue` bersama)** | Audit lama menyarankan mengekstrak komponen inspektur GitHub agar dapat dipakai bersama di `/repos` dan `/projects/:slug`. | **Disederhanakan (Pertanyaan 13 — `FR-009`)**: Panel inspektur di `/repos` **dihapus seluruhnya** (bukan dipakai bersama). `/repos` murni menjadi Katalog & Gerbang Impor, sedangkan seluruh inspeksi teknis GitHub hanya ada di `/projects/:slug`. |
| **`PDET-002` (Tab `Supabase` di `/projects/:slug`)** | Audit lama memberi opsi memindahkan atau mengganti label tab `Supabase` di dalam detail proyek. | **Diputuskan secara tegas (Pertanyaan 14 — `FR-010`)**: Tab `Supabase` di dalam `/projects/:slug` **dihapus sepenuhnya**, dan diagnostik infrastruktur dipusatkan hanya di `/telemetry`. |
| **`ROAD-001` & `ROAD-002` (Perbaikan Kuartal `Q1–Q4`)** | Audit lama menyarankan perbaikan logika tanggal pada kuartal `Q1–Q4` atau menambahkan `targetQuarter`. | **Diubah konsepnya (Pertanyaan 10 — `FR-008`)**: Pemilik proyek menolak pengelompokan kuartal korporat `Q1–Q4` dan memilih pengelompokan berbasis **Versi / Fase Rilis (`MVP / v1.0 -> v1.1 -> v2.0 / Backlog`)**. |
| **Bagian 13.3 (`GitHub Webhooks`)** | Audit lama menempatkan *Inbound GitHub Webhooks* di Fasa 3. | **Diubah (Pertanyaan 16 — `AUTO-001`)**: Pemilik proyek memilih **Zero-Setup GitHub Auto-Sync** berbasis *on-fetch reconciliation* (tanpa perlu mengatur *webhook URL/secret* per repositori). Webhook diturunkan menjadi opsional/ditangguhkan. |

---

## 22. Risiko Keamanan dan Integritas Data yang Harus Ditangani Segera

1. **Eksposur Mutasi Tanpa Autentikasi (`SEC-001`, `INT-002`)**: Seluruh endpoint mutasi (`/api/projects*`, `/api/tasks*`, `/api/sprints*`, `/api/github/issues`, `/api/github/comments`) saat ini terbuka untuk publik dan menggunakan `GITHUB_TOKEN` milik pemilik proyek di sisi server.
2. **Kebocoran RLS Supabase (`SEC-002`)**: Kunci `SUPABASE_KEY` (`anon`) dapat digunakan langsung ke REST API Supabase karena kebijakan RLS saat ini adalah `USING (true) WITH CHECK (true)` untuk `anon`.
3. **Penghapusan Proyek Tidak Sengaja via Tombol "Detach" (`FR-009` / `REPO-001`)**: Mengklik tombol *"Detach"* pada halaman `/repos` memanggil `DELETE /api/projects/:id` yang menghapus proyek secara permanen dari Supabase.
4. **Kehilangan Data Diam-diam akibat *Split-Brain Fallback* (`SEC-003`)**: Jika koneksi Supabase terputus sesaat, `withRepositoryFallback()` menulis tugas/proyek baru ke memori lokal server `.data/kv` tanpa memberi tahu pengguna, sehingga data baru tersebut hilang dari database utama.

---

## 23. Perbaikan Global yang Wajib Dilakukan Sebelum Remediasi Per Halaman

Sebelum mengubah komponen halaman satu per satu, **5 fondasi global** berikut wajib diselesaikan terlebih dahulu agar tidak terjadi pengerjaan ulang (*rework*):

1. **Migrasi Skema Database & RLS (`server/database/migrations/003_nexura_v2_alignment.sql`)**:
   - Menambahkan nilai `'idea'` ke enum/check status tugas.
   - Menambahkan kolom `release_phase TEXT NOT NULL DEFAULT 'v1.0'` pada tabel `projects` (dan opsional `target_version` pada `tasks`).
   - Membuat tabel `project_notes` (`id`, `project_slug`, `category` [`'idea' | 'bug' | 'maintenance'`], `content`, `promoted_task_id`, `created_at`, `updated_at`) untuk mendukung **Idea Scratchpad & Bug Inbox (`FR-003`)**.
   - Mencabut kebijakan `USING (true)` dari role publik `anon` pada seluruh tabel (`SEC-002`).
2. **Penghapusan *Silent Fallback* KV & Pembuatan Endpoint Backup (`SEC-003`)**:
   - Memperbarui `server/repositories/index.ts` agar menggunakan `SUPABASE_SERVICE_ROLE_KEY` di sisi server dan menghentikan pengalihan tulis diam-diam ke Nitro KV.
   - Menambahkan endpoint `GET /api/backup/export` untuk mengunduh snapshot JSON seluruh tabel.
3. **Middleware Autentikasi & Allowlist GitHub (`SEC-001`, `INT-002`)**:
   - Menerapkan autentikasi sesi pemilik (GitHub OAuth + *fallback* `NEXURA_ACCESS_KEY` di `.env`) serta validasi repositori pada endpoint tulis GitHub.
4. **Unified Reactive Workspace Store (`UX-003`)**:
   - Mengubah `useProjects.ts`, `useTasks.ts`, `useSprints.ts`, dan menambahkan `useProjectNotes.ts` menggunakan `useState()` terpusat Nuxt agar seluruh halaman dan modal berbagi *cache* reaktif yang sama.
   - Memperbaiki helper `getChecklistProgress()` agar membaca `- [x]` dan `[x]` secara akurat.
5. **Global Workspace Modals & Toast di `app/app.vue` (`UX-003`, `UX-004`)**:
   - Memasang `<TaskDrawer />`, `<AddTaskModal />`, `<AddProjectModal />`, `<EditProjectModal />`, dan `<ToastContainer />` satu kali di `app/app.vue` sehingga dapat dipicu dari halaman mana pun maupun dari `OmniSearch` (`Ctrl+K`).

---

## 24. Kebutuhan Otomatisasi Pengujian untuk Mendukung Remediasi (`NFR-003`)

Sesuai keputusan pada **Pertanyaan 17 (Opsi A)**, strategi pengujian dibuat proporsional dan ringan:
1. **Static Typechecking (`npx nuxt typecheck`)**: Memastikan perubahan tipe `TaskStatus` (5 status), `Project` (`releasePhase`), dan `ProjectNote` bebas dari *type error* di seluruh halaman Vue dan endpoint Nitro.
2. **Unit & Contract Tests dengan `Vitest` (`tests/unit/*.test.ts`)**:
   - `schemas.test.ts`: Menguji validasi Zod untuk `TaskCreateSchema` (termasuk status `'idea'`), `ProjectUpdateSchema` (termasuk pelepasan `githubRepo: ''`), dan `ProjectNoteSchema`.
   - `metrics.test.ts`: Menguji fungsi kalkulasi progres proyek dari daftar tugas nyata, perhitungan *checklist* Markdown (`- [x]` vs `- [ ]`), dan logika pencocokan ID tugas `ENG-xxx` pada pesan *commit*/PR (`AUTO-001`).
   - `rollover.test.ts`: Menguji logika pemindahan tugas yang belum selesai (`status !== 'deployed'`) saat pergantian sprint mingguan (`AUTO-002`).
3. **Integrasi CI (`.github/workflows/ci.yml`)**: Menjalankan `npm run typecheck`, `npm run test`, dan `npm run build` secara otomatis pada setiap *push* dan *Pull Request*.

---

## 25. Urutan Implementasi & Roadmap Remediasi Terpadu

Berdasarkan prioritas eksekusi yang Anda pilih pada **Pertanyaan 24 (Opsi B)**, berikut adalah urutan implementasi bertahap yang paling aman dan efisien:

### Tahap 0 — Keselamatan Data, Skema Database, & Fondasi Global (Blocker / P0-A)
- **Cakupan Pekerjaan**:
  1. Buat migrasi SQL `003_nexura_v2_alignment.sql` (status `'idea'`, kolom `release_phase`, tabel `project_notes`, dan penguncian RLS `anon`).
  2. Hapus *silent fallback* penulisan lokal (`markSupabaseOffline`) di `server/repositories/index.ts` dan tambahkan endpoint `GET /api/backup/export`.
  3. Perbaiki bug kritis tombol **"Detach"** di `/repos.vue` agar memanggil `PATCH /api/projects/:id` (`{ githubRepo: '' }`), bukan `DELETE`.
  4. Konversi `useProjects`, `useTasks`, `useSprints`, dan `useProjectNotes` menjadi *singleton store* berbasis `useState` dan pasang `TaskDrawer`, `AddTaskModal`, `AddProjectModal`, `EditProjectModal`, serta `ToastContainer` secara global di `app/app.vue`.
- **Dependensi**: Tidak ada (fondasi awal).
- **Acceptance Criteria**:
  - Mengubah status tugas atau mengedit tugas di `TaskDrawer` langsung memperbarui tampilan di halaman mana pun tanpa *hard refresh*.
  - Mengklik *"Detach"* di `/repos` melepas tautan GitHub tanpa menghapus proyek.
  - Permintaan langsung menggunakan kunci publik `anon` ke tabel Supabase ditolak oleh RLS.
- **Rencana Pengujian**: Uji unit skema Zod baru + verifikasi mutasi lintas komponen.

### Tahap 1 — Ruang Kerja Harian: Maksimalisasi `/tasks` (5-Column Kanban + Idea Scratchpad + Active Focus) & Kejujuran Metrik (P0-B)
- **Cakupan Pekerjaan**:
  1. Perbarui `KanbanBoard.vue` dan tipe `TaskStatus` menjadi 5 kolom berurutan: `idea` $\rightarrow$ `in_queue` $\rightarrow$ `running_sprint` $\rightarrow$ `blocked` $\rightarrow$ `deployed`.
  2. Tambahkan mode tampilan **Full Kanban Board** + *Project Filter Switcher* di `app/pages/tasks.vue` (`FR-001`).
  3. Bangun komponen **Idea Scratchpad & Bug Inbox (`FR-003`)** beserta endpoint CRUD `/api/notes` dan fitur 1-klik **"Promote to Kanban"** (mengubah catatan ide/bug menjadi kartu Kanban berstatus `'idea'` atau `'blocked'`).
  4. Bangun panel **Active Focus & Checklist (`FR-004`)** di `/tasks.vue` dan perbaiki *regex* `getChecklistProgress()` agar mengenali `- [x]`.
  5. Hapus seluruh angka palsu/*hardcoded* di Dashboard (`/`), `/projects`, `/tasks`, dan `/sprints` (`UX-002`).
- **Dependensi**: Tahap 0 selesai.
- **Acceptance Criteria**:
  - Pemilik proyek dapat memilih proyek di `/tasks`, menulis ide/bug cepat di *Idea Scratchpad*, mempromosikannya ke papan Kanban 5 kolom dengan 1 klik, dan mencentang *checklist* di panel *Active Focus* dengan persentase progres yang akurat 100%.
  - Proyek dengan 0 tugas menampilkan progres `0%` secara jujur di seluruh halaman.
- **Rencana Pengujian**: Uji unit `getChecklistProgress()` dan kalkulator progres proyek + uji alur *Promote to Kanban*.

### Tahap 2 — Penyempurnaan Halaman Inti (`/`, `/projects`, `/projects/:slug`, `/repos`) & Pengamanan Auth (P1)
- **Cakupan Pekerjaan**:
  1. **Dashboard (`/`, `UX-001`)**: Tambahkan **Quick Capture Bar** (simpan cepat ke *Idea Scratchpad* / *Bug Inbox* / *Task Queue*) dan hapus `KanbanBoard` bawah, `InfrastructureMeshCard`, serta kartu statis `Vercel Production` (*dengan persetujuan Anda*).
  2. **Active Projects (`/projects`, `FR-005`)**: Hubungkan tombol tambah proyek ke modal global, tambahkan fitur **Edit Proyek**, dan hitung progres/jumlah tugas secara dinamis.
  3. **Project Detail (`/projects/:slug`, `FR-006`)**: Tambahkan panel **Project Idea Scratchpad & Error/Maintenance Log**, tampilkan 404 jujur untuk `slug` tidak dikenal, dan hapus tab internal `Supabase` (*dengan persetujuan Anda*).
  4. **GitHub Repositories (`/repos`, `FR-009`)**: Hapus panel *Inspector* duplikat 6-bagian (*dengan persetujuan Anda*), tingkatkan batas pengambilan repo (`per_page=100`), dan arahkan klik repo terkelola langsung ke `/projects/:slug`.
  5. **Keamanan (`SEC-001`, `INT-002`)**: Terapkan autentikasi pemilik (GitHub OAuth + *fallback* `NEXURA_ACCESS_KEY`) dan validasi *allowlist* repositori pada endpoint mutasi GitHub.
- **Dependensi**: Tahap 0 & Tahap 1 selesai.
- **Acceptance Criteria**:
  - Seluruh permintaan ke `/api/*` tanpa sesi pemilik atau *access key* ditolak dengan `401 Unauthorized`.
  - Dari Dashboard (`/`), pemilik proyek dapat langsung mengetik ide/bug baru dan memilih proyek tujuan dalam satu langkah.
  - Halaman `/repos` bersih dari duplikasi inspektur dan memuat seluruh repositori akun.
- **Rencana Pengujian**: Uji integrasi middleware autentikasi + uji validasi *allowlist* GitHub.

### Tahap 3 — Otomatisasi Ringan (`AUTO-001`, `AUTO-002`), Pembaruan `/roadmap` & `/telemetry`, serta `OmniSearch` (`Ctrl+K`) (P2)
- **Cakupan Pekerjaan**:
  1. **Zero-Setup GitHub Auto-Sync (`AUTO-001`)**: Tambahkan rekonsiliasi otomatis pada pengambilan detail GitHub yang menautkan *commit*/PR ber-ID `ENG-xxx` ke tugas dan memperbarui status tugas ke `deployed` saat PR terkait *merged* (dengan notifikasi *toast*).
  2. **One-Click Confirmed Sprint Rollover (`AUTO-002`)**: Tambahkan deteksi sprint berakhir dan tombol konfirmasi 1-klik di `/sprints` untuk memindahkan tugas yang belum selesai ke sprint baru, serta hapus file `app/pages/focus.vue` (*dengan persetujuan Anda*).
  3. **Release Phase Roadmap (`/roadmap`, `FR-008`)**: Bangun ulang `/roadmap` menggunakan pengelompokan **Versi / Fase Rilis (`MVP / v1.0 -> v1.1 -> v2.0 / Backlog`)**.
  4. **System Telemetry (`/telemetry`, `FR-010`)**: Ubah `/api/telemetry` menjadi *ping* nyata ke Supabase & GitHub, pindahkan `InfrastructureMeshCard` ke sini, dan tambahkan tombol **Export Backup JSON**.
  5. **Maksimalisasi `OmniSearch` (`UX-004`)**: Hubungkan pemilihan hasil tugas dengan `openTaskDrawer()`, indeks catatan *Idea Scratchpad*, dan tambahkan *Quick Commands* (`> Buat Ide`, `> Buat Tugas`, `> Export Backup`).
  6. **Quality Gate CI (`NFR-003`)**: Aktifkan `typecheck` dan `vitest` di `.github/workflows/ci.yml`.
- **Dependensi**: Tahap 1 & Tahap 2 selesai.
- **Acceptance Criteria**:
  - *Commit* atau PR yang memuat `ENG-xxx` otomatis tertaut ke tugas terkait saat halaman detail proyek dibuka.
  - Menekan `Ctrl+K` dan memilih tugas langsung membuka `TaskDrawer` untuk tugas tersebut dari halaman mana pun.
  - Pipeline CI menjalankan `typecheck`, `vitest`, dan `build` dengan sukses.
- **Rencana Pengujian**: Uji unit parser `ENG-xxx` (`AUTO-001`) dan logika *Sprint Rollover* (`AUTO-002`) + eksekusi penuh suite `vitest`.
