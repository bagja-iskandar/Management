# NEXURA MANAGEMENT — DEEP SUBSYSTEM & FUNCTIONAL AUDIT
**(Kanban, GitHub & DevOps, Tasks, Sprints, Scratchpad, Project Cockpit, Dashboard & Settings)**

> **Status:** `DOCUMENTED FOR EXECUTOR ANALYSIS`  
> **Scope:** Seluruh subsistem fungsional Nexura Management (`d:\Project_Center\REWORK\Management`)  
> **Keterkaitan Dokumen:** Dokumen ini melengkapi [master-refactoring-and-ui-enhancement-roadmap.md](./master-refactoring-and-ui-enhancement-roadmap.md) (fokus arsitektur folder, clean code, dan komponen UI `Base*.vue`) dengan audit mendalam terhadap **logika bisnis, alur interaksi, sinkronisasi data client-server, integrasi GitHub/DevOps, dan akurasi metrik**.  
> **Aturan Tata Kelola:** Wajib mematuhi `.agents/rules/multi-agent-governance.md` (5-Phase Gate, Strict File Boundary per Role Eksekutor, dan Styling Freeze Rule).

---

## Daftar Isi
1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Domain 1: Sistem Kanban & Halaman Deliverables (`/tasks`)](#2-domain-1-sistem-kanban--halaman-deliverables-tasks)
3. [Domain 2: `TaskDrawer.vue`, `AddTaskModal.vue` & Sinkronisasi State Task](#3-domain-2-taskdrawervue-addtaskmodalvue--sinkronisasi-state-task)
4. [Domain 3: Integrasi GitHub, Cache Nitro & Sync Engine](#4-domain-3-integrasi-github-cache-nitro--sync-engine)
5. [Domain 4: Weekly Sprints (`/sprints`) & Architecture Roadmap (`/roadmap`)](#5-domain-4-weekly-sprints-sprints--architecture-roadmap-roadmap)
6. [Domain 5: Idea Scratchpad (`notes`) & Split-Brain Ideation](#6-domain-5-idea-scratchpad-notes--split-brain-ideation)
7. [Domain 6: Project Cockpit (`/projects/[slug]`) & Vercel Deployment Tab](#7-domain-6-project-cockpit-projectsslug--vercel-deployment-tab)
8. [Domain 7: Dashboard (`/`), Telemetry & Settings (`/settings`)](#8-domain-7-dashboard--telemetry--settings-settings)
9. [Matriks Penugasan Eksekutor & File Boundaries (`SYS-01` s/d `SYS-13`)](#9-matriks-penugasan-eksekutor--file-boundaries-sys-01-sd-sys-13)
10. [Rencana Implementasi Komprehensif (Tahap C)](#10-rencana-implementasi-komprehensif-tahap-c)
11. [Rincian Eksekusi 3 Gelombang (Wave 1, Wave 2, Wave 3)](#11-rincian-eksekusi-3-gelombang-wave-1-wave-2-wave-3)
12. [Kontrak Integrasi Antar-Eksekutor & Schema Types](#12-kontrak-integrasi-antar-eksekutor--schema-types)
13. [Strategi Pengujian QA & Zero-Regression Matrix](#13-strategi-pengujian-qa--zero-regression-matrix)
14. [Rencana Kontinjensi, Eskalasi & Definition of Done](#14-rencana-kontinjensi-eskalasi--definition-of-done)

---

## 1. Ringkasan Eksekutif

Berdasarkan audit empiris baris-demi-baris pada codebase aktual, ditemukan **22 ketidaksempurnaan fungsional, bug logika state, celah sinkronisasi data, dan fitur *placebo/mock*** yang dikelompokkan ke dalam **13 paket remediasi (`SYS-01` s/d `SYS-13`)** pada **7 domain utama**:

1. **Sistem Kanban & Task Management (`KanbanBoard.vue`, `KanbanColumn.vue`, `TaskCard.vue`, `app/pages/tasks.vue`)**
2. **Task Drawer & Modal Create (`components/modals/task/TaskDrawer.vue`, `components/modals/task/AddTaskModal.vue`)**
3. **Integrasi GitHub, Cache Server Nitro & Sync Engine (`composables/useGitHub.ts`, `server/api/github/**`, `server/utils/github-sync.ts`)**
4. **Weekly Sprints & Rollover (`composables/useSprintWorkspace.ts`, `app/pages/sprints.vue`, `components/sprint/*`)**
5. **Idea Scratchpad / Notes (`components/notes/IdeaScratchpadPanel.vue`, `composables/useNotes.ts`, `server/api/notes/**`)**
6. **Project Cockpit & Vercel Deployment Tab (`app/pages/projects/[slug].vue`, `components/project/ProjectVercelTab.vue`)**
7. **Dashboard Metrics, Roadmap, Telemetry & Settings (`components/dashboard/*`, `app/pages/roadmap.vue`, `app/pages/settings.vue`)**

---

## 2. Domain 1: Sistem Kanban & Halaman Deliverables (`/tasks`)

### 2.1. Pengurutan Kartu (*Sorting*) di `/tasks` Diabaikan oleh `KanbanBoard.vue` (`SYS-03`)
- **Lokasi File & Baris:**
  - `app/pages/tasks.vue` (baris `134-143` dan `735-751`)
  - `components/kanban/KanbanBoard.vue` (baris `187-194`)
- **Bukti Empiris & Akar Masalah:**
  - Di halaman `/tasks`, toolbar menyediakan dropdown `sortBy` (*Newest First*, *Oldest First*, *Priority: High to Low*, *By Status*, *Name: A to Z*) dan mengoper `:tasks="filteredTasks"` yang sudah diurutkan ke `<KanbanBoard />` (`tasks.vue:228`).
  - Namun, computed `processedTasks` di `components/kanban/KanbanBoard.vue:187-194` **menimpa (*override*) urutan tersebut secara paksa** dengan mengurutkan ulang `localTasksList` berdasarkan `priorityOrder` (`critical: 4 > high: 3 > medium: 2 > low: 1`) lalu `(a.taskId || a.id).localeCompare(...)`.
  - **Dampak:** Mengubah dropdown Sort di halaman `/tasks` saat berada di mode Kanban **tidak memberikan efek visual apa pun**.
- **Arahan Perbaikan untuk Eksekutor (`page-workspaces-executor`):**
  - Tambahkan prop opsional `preserveOrder?: boolean` pada `KanbanBoard.vue` (default `false` untuk halaman yang tidak memiliki pengontrol sort eksternal, dan `true` saat dipanggil dari `app/pages/tasks.vue`), atau biarkan `KanbanBoard.vue` menghormati urutan array `props.tasks` jika parent sudah mengurutkannya.

### 2.2. Tidak Ada Dukungan *Vertical Reordering* di Dalam Kolom yang Sama & Panggilan API Redundan (`SYS-03`, `SYS-11`)
- **Lokasi File & Baris:**
  - `types/task.ts` (baris `4-21`)
  - `server/schemas/task.schema.ts` (baris `19-32`)
  - `components/kanban/KanbanColumn.vue` (baris `5-8`, `52-65`)
  - `components/kanban/KanbanBoard.vue` (baris `301-318`)
- **Bukti Empiris & Akar Masalah:**
  1. Entitas `Task` belum memiliki properti `position` / `sortOrder`, dan event `@dragover` / `@drop` hanya dipasang pada container kolom luar (`KanbanColumn.vue:5-8`), bukan di antara item `TaskCard`.
  2. Pada fungsi `onDrop()` di `components/kanban/KanbanBoard.vue:301-318`, tidak ada guard `if (task.status === newStatus) return`. Men-drag sebuah kartu dan menjatuhkannya kembali di kolom yang sama tetap memutasi `localTasksList`, memicu emit `update-status` (`baris 317`), dan memanggil `PUT /api/tasks/:id` ke server secara redundan.
- **Arahan Perbaikan untuk Eksekutor (`page-workspaces-executor`):**
  - Tambahkan guard `if (!task || task.status === newStatus) return` pada `onDrop()` di `KanbanBoard.vue` sebelum memutasi state atau mengirim emit `update-status`.

### 2.3. Bug Tombol Panah (`<` / `>`) pada Kolom `BLOCKED` & Aksesibilitas Touch/Keyboard (`SYS-11`)
- **Lokasi File & Baris:**
  - `components/kanban/KanbanBoard.vue` (baris `94-97`)
  - `components/kanban/TaskCard.vue` (baris `13-17`, `37-58`, `146`, `161`)
- **Bukti Empiris & Akar Masalah:**
  1. **Simetri Arah Panah yang Salah pada Kolom `BLOCKED`:** Di `components/kanban/KanbanBoard.vue:94-97`, kolom `blocked` mengatur `:can-move-left="true"`, `:can-move-right="true"`, `move-left-target="running_sprint"`, **DAN** `move-right-target="running_sprint"`. Akibatnya, baik tombol panah kiri (`<`) maupun kanan (`>`) pada kartu di kolom `BLOCKED` memindahkan kartu ke kolom yang sama (`running_sprint`), padahal kolom di sebelah kanan `BLOCKED` adalah `DONE` (`deployed`).
  2. **Tidak Bisa Memindahkan Kartu ke `BLOCKED` pada Perangkat Sentuh (Mobile/Tablet):** HTML5 Drag-and-Drop bawaan browser tidak bekerja pada layar sentuh tanpa polyfill. Pengguna mobile bergantung pada tombol `<` dan `>` pada `TaskCard.vue`. Karena progresi kolom bersifat linier (`idea ↔ in_queue ↔ running_sprint ↔ deployed`), pengguna layar sentuh/keyboard **tidak pernah bisa memindahkan kartu ke status `blocked`** dari papan Kanban. Perhatikan bahwa di `TaskCard.vue:146,161` sudah dideklarasikan prop `canMoveBlocked?: boolean` dan emit `(e: 'toggle-blocked', task: Task): void`, tetapi **tidak pernah di-render di `<template>` (dead code)**.
  3. **Keyboard Focus Tidak Terlihat di Desktop:** Wrapper tombol `<` / `>` di `TaskCard.vue:37` menggunakan class `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` tanpa `sm:focus-within:opacity-100`. Saat pengguna menekan `Tab` pada keyboard di desktop, tombol `<` atau `>` yang sedang fokus tetap transparan (`opacity: 0`).
- **Arahan Perbaikan untuk Eksekutor (`page-workspaces-executor`):**
  - Ubah `move-right-target` pada kolom `blocked` di `KanbanBoard.vue:97` menjadi `"deployed"`.
  - Tambahkan `sm:focus-within:opacity-100` pada container tombol aksi di `TaskCard.vue:37`.
  - Sambungkan tombol/aksi `toggle-blocked` pada `TaskCard.vue` dan `KanbanColumn.vue` agar pengguna touch/keyboard dapat menandai atau melepas status `blocked`.

### 2.4. Kolom Kanban Memanjang Tanpa Batas (*No Internal Scroll*), Kebocoran Filter Status & Badge Sprint Generik (`SYS-11`)
- **Lokasi File & Baris:**
  - `components/kanban/KanbanColumn.vue` (baris `3`, `51`)
  - `components/kanban/TaskCard.vue` (baris `68-70`, `86-91`)
  - `app/pages/tasks.vue` (baris `149`, `156-162`, `381-400`, `478-494`, `652-657`, `704-706`, `803-822`)
- **Bukti Empiris & Akar Masalah:**
  1. **Kolom Tidak Memiliki Batas Tinggi Maksimum (`max-h`):** `KanbanColumn.vue:3` menggunakan `h-full min-h-[calc(100vh-175px)]`, tetapi root `<div class="space-y-4">` di `app/pages/tasks.vue:2` tidak mengunci tinggi container. Akibatnya, kolom dengan banyak kartu merentangkan seluruh halaman secara vertikal dan `overflow-y-auto` pada `KanbanColumn.vue:51` tidak pernah aktif untuk *internal column scrolling*.
  2. **Kebocoran Filter `status` dari URL / Mode Tabel ke Mode Kanban:** Tab filter status di `tasks.vue:149` hanya ditampilkan saat `v-if="viewMode === 'table'"`. Namun `filteredTasks` (`tasks.vue:704-706`) tetap memfilter berdasarkan `statusFilter.value` meskipun `viewMode === 'kanban'`. Jika pengguna membuka `/tasks?status=blocked` atau memilih tab status di mode Tabel lalu beralih ke mode Kanban, 4 dari 5 kolom Kanban menjadi kosong tanpa indikator filter status yang terlihat.
  3. **Counter Analytics Summary Mengabaikan Filter Aktif:** Di `tasks.vue:652-657`, `allCount`, `ideaCount`, `inQueueCount`, `runningSprintCount`, `deployedCount`, dan `blockedCount` dihitung dari `tasksList.value` mentah, bukan dari task yang sudah difilter berdasarkan Project/Priority/Tag/Search.
  4. **Badge `"Sprint"` Statis di `TaskCard.vue`:** `TaskCard.vue:86-91` menampilkan teks literal `<span v-if="task.sprintId">Sprint</span>` alih-alih menampilkan label minggu Sprint aktual (misalnya `W45`) atau nama Sprint dari store.
  5. **Raw Markdown Checklist di Preview Kartu/Tabel:** `TaskCard.vue:68-70` dan `tasks.vue:271-273` menampilkan `task.description` mentah (termasuk sintaks `- [ ] item`) sebagai teks biasa tanpa memisahkan teks naratif dari indikator progres checklist (misal `2/4`).

---

## 3. Domain 2: `TaskDrawer.vue`, `AddTaskModal.vue` & Sinkronisasi State Task

### 3.1. Lima Bug Kritis pada `TaskDrawer.vue` (`SYS-01`)
- **Lokasi File & Baris:**
  - `components/modals/task/TaskDrawer.vue` (baris `114-126`, `168`, `262-291`, `478-486`, `509-592`, `629-699`)
- **Bukti Empiris & Akar Masalah:**
  1. **Absennya Field `sprintId`:** Di `TaskDrawer.vue:509-538` (state `form`) dan `629-643` (`submitSave` payload), field `sprintId` sama sekali tidak ada. Pengguna yang membuka `TaskDrawer` tidak bisa melihat task tersebut berada di Sprint mana, tidak bisa menetapkan Sprint, dan tidak bisa memindahkan/melepas Sprint.
  2. **Status `'idea'` Hilang dari `statusOptions`:** Di `TaskDrawer.vue:550-555`, `statusOptions` hanya berisi 4 status (`in_queue`, `running_sprint`, `deployed`, `blocked`) dan `statusBadgeClass` (`baris 564-576`) tidak memiliki cabang `'idea'`. Jika pengguna membuka kartu dari kolom `IDEA` di Kanban lalu memilih status lain di `TaskDrawer`, pengguna tidak dapat mengembalikannya ke `'idea'`.
  3. **Mustahil Melepas (*Unlink*) Project dari Task (`projectSlug: ""` Menjadi `undefined`):**
     Di `TaskDrawer.vue:637`:
     ```ts
     projectSlug: form.projectSlug || undefined,
     ```
     Saat pengguna memilih opsi `(None / General)` pada dropdown Project (`TaskDrawer.vue:168`, nilai `""`), `form.projectSlug || undefined` menghasilkan `undefined`. Saat dikirim melalui `$fetch`, `JSON.stringify` menghapus properti yang bernilai `undefined` dari body request! Server tidak pernah menerima `projectSlug: null`, sehingga task **tetap terikat pada project lama**. (Hal yang sama terjadi pada `dueDate: form.dueDate || undefined` di `baris 640` ketika pengguna menghapus tanggal tenggat!).
  4. **Korupsi Baseline Rollback Optimistis pada `submitSave()`:**
     Di `TaskDrawer.vue:646-653`, `submitSave()` memanggil `updateTaskInStore(targetId, payload)` **sebelum** memanggil `await tasksApi.updateTask(targetId, payload)`.
     Karena `updateTaskInStore` langsung memutasi `workspaceStore.tasks` di memori sebelum `tasksApi.updateTask` memanggil `applyOptimisticPatch` (`composables/useWorkspaceStore.ts:224-234`), fungsi `applyOptimisticPatch` menyalin `currentEntity` yang **sudah terlanjur dimutasi** ke dalam `serverConfirmedBaseline`! Akibatnya, jika request `PUT /api/tasks/:id` gagal di jaringan, mekanisme rollback gagal mengembalikan state asli.
  5. **Tidak Ada Input `githubPrUrl`, Salah Tebak Repo GitHub, & Double PUT Request:**
     - `form.githubPrUrl` dilacak di state (`baris 519, 535, 642`), tetapi **tidak ada elemen `<input>` di template** untuk melihat atau mengedit URL Pull Request.
     - Pada `effectiveRepo` (`TaskDrawer.vue:478-486`), nama repositori ditebak sebagai `` `bagja-iskandar/${currentTask.value.projectSlug}` `` alih-alih mencari `project.githubRepo` dari `workspaceStore.projects`! Jika `projectSlug` berbeda dengan nama repo GitHub asli, pembuatan issue akan gagal (404/403).
     - Pada `handleCreateIssue()` (`TaskDrawer.vue:666-693`), setelah `POST /api/github/create-issue` selesai (yang di sisi server `server/api/github/create-issue.post.ts:43-52` **sudah memperbarui task di database**), `TaskDrawer.vue:693` memanggil `await tasksApi.updateTask(currentTask.value.id, patch)` untuk kedua kalinya.
  6. **Duplikasi Parser Checklist & Ketiadaan Tombol Hapus Item Checklist:**
     - `TaskDrawer.vue:270-291` tidak memiliki tombol hapus per item checklist, dan tombol tambah item (`appendChecklistItem` di `baris 590-592`) langsung menyisipkan teks hardcoded `- [ ] New deliverable item`. Sementara itu, `components/tasks/ActiveFocusPanel.vue:371-494` menulis ulang parser checklist sendiri alih-alih memakai `composables/useMarkdownChecklist.ts`.

### 3.2. Kesenjangan Auto-Bind `sprintId` Antara `POST /api/tasks` vs `PUT /api/tasks/:id` (`SYS-02`)
- **Lokasi File & Baris:**
  - `server/api/tasks.post.ts` (baris `6-26`)
  - `server/api/tasks/[id].put.ts` (baris `17-33`)
  - `server/repositories/supabase/mappers.ts` (baris `8-21`, `35`)
- **Bukti Empiris & Akar Masalah:**
  1. Pada `PUT /api/tasks/:id` (`server/api/tasks/[id].put.ts:17-33`), jika `patch.status === 'running_sprint'` dan task belum memiliki `sprintId`, server otomatis mencari Sprint aktif dan mengisi `patch.sprintId = activeSprint.id`.
  2. Sebaliknya, pada `POST /api/tasks` (`server/api/tasks.post.ts:6-26`), logika auto-bind tersebut **sama sekali tidak ada**. Ketika pengguna menekan tombol `+ Add` pada kolom Kanban `RUNNING` (`status: 'running_sprint'`), task dibuat dengan `sprintId: null`. Task tersebut tampil di kolom `RUNNING` pada `/tasks` dan `ActiveFocusPanel`, tetapi **tidak pernah muncul di halaman `/sprints`**.
  3. Di `server/repositories/supabase/mappers.ts:8-21` dan `server/utils/store.ts:73-89`, nilai `null` dari database dipetakan menjadi `undefined` (`sprintId: row.sprint_id || undefined`, `dueDate: row.due_date || undefined`, `projectSlug: row.project_slug || undefined`). Ketika diserialisasi ke JSON, key bernilai `undefined` hilang dari objek response, sehingga `{ ...tasks.value[idx], ...confirmedServerData }` di store frontend berisiko mempertahankan nilai lama jika sebuah field di-reset menjadi `null`.

### 3.3. Ketidaksempurnaan `AddTaskModal.vue` & Shortcut Palsu `Ctrl+N` (`SYS-01`)
- **Lokasi File & Baris:**
  - `components/modals/task/AddTaskModal.vue` (baris `220-233`, `288-292`, `386`)
  - `app/pages/tasks.vue` (baris `688`)
  - `app/pages/index.vue` (baris `29`)
  - `app/app.vue` (baris `122-129`)
- **Bukti Empiris & Akar Masalah:**
  1. `AddTaskModal.vue` tidak memiliki pemilih `status` maupun `sprintId` di UI, serta tidak menampilkan indikator status tujuan saat dibuka dari tombol `+ Add` pada kolom Kanban tertentu.
  2. Fungsi helper `getDefaultDueDate()` di `AddTaskModal.vue:288-292` adalah *dead code* (tidak pernah dipanggil).
  3. Tombol *New Deliverable* di `tasks.vue:688` dan `index.vue:29` menampilkan label shortcut `Ctrl+N` (yang di browser tidak bisa di-intercept karena membuka jendela browser baru), sedangkan shortcut sebenarnya yang terdaftar di `app/app.vue:122-129` adalah tombol `C`.

---

## 4. Domain 3: Integrasi GitHub, Cache Nitro & Sync Engine

### 4.1. Cache Server Nitro (`defineCachedFunction`) Tidak Pernah Di-invalidate atau Di-bypass (`SYS-05`)
- **Lokasi File & Baris:**
  - `server/api/github/repos.get.ts` (`L5-42`, `maxAge: 300`)
  - `server/api/github/commits.get.ts` (`L7-39`, `maxAge: 300`)
  - `server/api/github/branches.get.ts` (`L7-30`, `maxAge: 300`)
  - `server/api/github/commit-detail.get.ts` (`L7-53`, `maxAge: 300`)
  - `server/api/github/global-commits.get.ts` (`L7-54`, `maxAge: 180`)
  - `server/api/github/packages.get.ts` (`L7-116`, `maxAge: 60`)
  - `server/api/github/security.get.ts` (`L30-178`, `maxAge: 60`)
  - `server/api/github/pulls-issues.get.ts` (`L7-122`, `maxAge: 30`)
  - `server/api/github/workflows.get.ts` (`L7-47`, `maxAge: 30`)
  - `server/api/github/workflow-jobs.get.ts` (`L7-40`, `maxAge: 30`)
  - `server/api/github/deployments.get.ts` (`L12-131`, `maxAge: 30`)
  - `composables/useGitHub.ts` (`L28-64`)
- **Bukti Empiris & Akar Masalah:**
  - Ke-11 endpoint GET GitHub di atas membungkus logika fetch dengan `defineCachedFunction` milik Nitro menggunakan `getKey` statis tanpa `shouldBypassCache` (misalnya membaca query `?refresh=1`) dan tanpa penghapusan cache saat terjadi mutasi POST:
    1. Setelah membuat GitHub Issue (`POST /api/github/create-issue`), UI langsung memanggil `refreshPullsIssues()`. Karena `pulls-issues.get.ts` masih menyajikan cache 30 detik, issue yang baru dibuat tidak muncul di daftar.
    2. Setelah memicu rerun workflow (`POST /api/github/workflow-rerun`), `app/pages/projects/[slug].vue:862` memanggil `await refreshWorkflows()`, yang langsung mengembalikan status workflow lama dari cache.
    3. Saat pengguna mengklik tombol **"Sync GitHub Repos"** di `/repos` (`app/pages/repos.vue:629-632`), `repos.get.ts` mengembalikan respons cache selama 5 menit penuh (`maxAge: 300`).
    4. Di `composables/useGitHub.ts:28-64`, `useGitHubCommits` tidak menyertakan parameter `limit` ke dalam key `useLazyAsyncData` maupun daftar `watch`.

### 4.2. `POST /api/github/sync` Hanya Memindai PR & Bug Mismatch `syncedCount` vs `linkedCount` (`SYS-06`)
- **Lokasi File & Baris:**
  - `server/api/github/sync.post.ts` (baris `11-17`, `59-105`)
  - `server/utils/github-sync.ts` (baris `39`, `68-72`)
  - `composables/useSprintWorkspace.ts` (baris `367-376`)
- **Bukti Empiris & Akar Masalah:**
  1. **Hanya Memindai Pull Requests:** Walaupun komentar fungsi di `server/utils/github-sync.ts:39` menyebutkan ekstraksi kode `ENG-xxx` dari *commit messages, PR titles, or bodies*, `server/api/github/sync.post.ts:64` **hanya memanggil `/repos/${repo}/pulls?state=all&per_page=30`**—tidak pernah memindai commit maupun menyinkronkan status GitHub Issues yang sudah ditutup (*closed*).
  2. **Kontrak Response Tidak Cocok (`linkedCount` vs `syncedCount`):**
     - `server/api/github/sync.post.ts:99-105` mengembalikan `{ ok: true, deployedCount, linkedCount, updatedTasks, timestamp }`.
     - Namun `composables/useSprintWorkspace.ts:367-376` membaca `const synced = res?.syncedCount ?? 0`. Karena `res.syncedCount` selalu `undefined`, pesan toast selalu menampilkan `"GitHub Sync: 0 deliverables updated, X deployed"` meskipun banyak task yang terhubung!
  3. **Pencocokan PR Lintas Project Tanpa Filter `projectSlug`:** Di `sync.post.ts:74-76`, PR dari seluruh repositori dicocokkan terhadap seluruh task di workspace tanpa memastikan bahwa `task.projectSlug` sesuai dengan project pemilik repositori tersebut.

### 4.3. Duplikasi Task Saat Mengimpor GitHub Issue ke Kanban (`SYS-06`)
- **Lokasi File & Baris:**
  - `components/modals/devops/PullRequestsIssuesModal.vue` (baris `305`, `623-653`)
  - `composables/useProjectCockpit.ts` (baris `226-251`)
- **Bukti Empiris & Akar Masalah:**
  - Status bahwa sebuah GitHub Issue telah diimpor ke Kanban hanya disimpan di objek lokal sementara `reactive<Record<number, boolean>>({})` (`importedIssues` di `PullRequestsIssuesModal.vue` dan `inPanelImportedIssues` di `useProjectCockpit.ts`).
  - Aplikasi **tidak pernah mengecek** apakah di `workspaceStore.tasks.value` sudah ada task dengan `t.githubIssueNumber === issue.number` atau `t.githubIssueUrl === issue.htmlUrl`!
  - Akibatnya, pengguna dapat mengimpor Issue yang sama dari panel in-page lalu mengimpornya lagi dari modal, atau me-refresh halaman dan mengimpor Issue yang sama berulang kali menjadi banyak task duplikat.

### 4.4. Bug Truncation Penghitungan Issue di `pulls-issues.get.ts` & Penanganan Error 401/403 GitHub (`SYS-12`)
- **Lokasi File & Baris:**
  - `server/api/github/pulls-issues.get.ts` (baris `27-48`, `78-105`, `144`)
  - `server/api/github/security.get.ts` (baris `80-82`, `112-114`, `140-142`)
  - `server/api/github/deployments.get.ts` (baris `46-52`)
  - `composables/useSession.ts` (baris `89-93`)
- **Bukti Empiris & Akar Masalah:**
  1. **Bug Endpoint `/issues` GitHub REST API:** Endpoint `/repos/:owner/:repo/issues?state=all&per_page=10` milik GitHub mengembalikan **PR dan Issue sekaligus**. Di `pulls-issues.get.ts:79`, kode memfilter `rawIssues.filter(item => !item.pull_request)` dari 10 item yang dikembalikan. Jika 10 item terbaru di repo tersebut adalah Pull Request, maka `issues` menjadi `[]` (`0` issue) meskipun repo memiliki puluhan Issue aktif! Selain itu, `openPrCount`, `closedPrCount`, `openIssueCount`, dan `closedIssueCount` (`baris 102-105`) hanya menghitung dari potongan 10 item tersebut.
  2. **Error 401/403 Ditelan & Di-cache vs Logout Sesi Workspace Palsu:**
     - `repos.get.ts`, `workflows.get.ts`, `deployments.get.ts`, dan `pulls-issues.get.ts` menangkap semua error dengan `catch { return [] }` lalu meng-cache array kosong tersebut hingga 5 menit.
     - `security.get.ts` menangkap error 403/401 dan mengatur `enabled.secretScanning = false`, sehingga UI menampilkan scanner berstatus `"Disabled"` padahal token hanya terkena rate-limit atau kurang scope.
     - Sebaliknya, endpoint yang melempar HTTP `401` (`GITHUB_AUTH_FAILED`) jika diteruskan ke `session.handleApiError(err)` (`composables/useSession.ts:89-93`) akan memicu `if (status === 401 || code === 'UNAUTHORIZED')` yang **mengubah status sesi Nexura menjadi `unauthenticated`** (salah mengira error token GitHub sebagai berakhirnya sesi login Nexura!).

---

## 5. Domain 4: Weekly Sprints (`/sprints`) & Architecture Roadmap (`/roadmap`)

### 5.1. Gagal Menghapus Task dari Sprint, Bug Status `'idea'`, & Tidak Bisa Membuka `TaskDrawer` (`SYS-04`)
- **Lokasi File & Baris:**
  - `composables/useSprintWorkspace.ts` (baris `98-104`, `170-183`, `215`, `293-300`, `320`, `399-402`)
  - `components/sprint/DeliverablesMatrix.vue` (baris `190-335`)
  - `components/modals/sprint/AddTargetModal.vue` (baris `118`)
  - `app/pages/sprints.vue` (baris `318-324`)
- **Bukti Empiris & Akar Masalah:**
  1. **Task Gagal Dihapus dari Sprint Jika Terdaftar di `sprint.taskIds`:**
     `activeWeekTasks` (`useSprintWorkspace.ts:98-104`) memfilter task dengan kondisi `t.sprintId === sId || activeSprint.value?.taskIds?.includes(t.id)`. Namun `removeTaskFromWeek(task)` (`baris 293-300`) hanya memanggil `tasksApi.updateTask(task.id, { sprintId: '' })` tanpa menghapus `task.id` dari `sprint.taskIds`, dan mengirim string kosong `''` alih-alih `null`. Selain itu, jika task yang dihapus dari Sprint masih berstatus `running_sprint`, saat task tersebut diedit kemudian hari, `server/api/tasks/[id].put.ts:17` akan otomatis mengikatnya kembali ke Sprint aktif!
  2. **Task `'idea'` yang Ditambahkan dari Backlog ke Sprint Hilang dari Hitungan Status:**
     Saat pengguna menambahkan task dari backlog melalui `AddTargetModal.vue:118` (`addExistingTaskToWeek`), jika task tersebut berstatus `'idea'`, statusnya tidak diubah menjadi `'in_queue'`. Di `useSprintWorkspace.ts:215`, `pendingTasks` hanya menghitung `in_queue` dan `blocked`. Akibatnya, task berstatus `'idea'` dihitung dalam `totalDeliverablesCount`, tetapi **tidak masuk ke `Pending`, `In Flight`, maupun `Done`**.
  3. **`ensureSprintForCurrentWeek()` Selalu Membuat Sprint Berstatus `'active'`:**
     Di `useSprintWorkspace.ts:170-183`, saat pengguna bernavigasi ke minggu depan (`weekOffset > 0`) untuk merencanakan Sprint mendatang lalu menambahkan target, `ensureSprintForCurrentWeek()` membuat Sprint minggu depan tersebut dengan `status: 'active'` (`baris 179`), bukan `'planned'`.
  4. **Kartu Deliverable di `/sprints` Tidak Membuka `TaskDrawer`:**
     Di `components/sprint/DeliverablesMatrix.vue:190-335`, mengklik kartu deliverable atau judulnya sama sekali tidak memanggil `openTaskDrawer(task)`. Pengguna di halaman `/sprints` tidak bisa melihat atau mengedit deskripsi, checklist, prioritas, maupun tanggal tenggat task.
  5. **Label Tombol Header `"New Sprint"` Menyesatkan:**
     Di `app/pages/sprints.vue:318-324`, tombol header diberi label `"New Sprint"`, tetapi memanggil `openModalWithTab('create')` yang membuka modal tambah deliverable (`AddTargetModal.vue`), bukan membuat Sprint baru.
  6. **Rollover Berjalan Sekuensial (`for...of`):**
     `onConfirmRollover` (`useSprintWorkspace.ts:399-402`) memindahkan task satu per satu di dalam loop `for (const task of tasksToMove) { await tasksApi.updateTask(...) }` alih-alih paralel menggunakan `Promise.all`.

### 5.2. Keterbatasan Interaksi pada Architecture Roadmap (`/roadmap`)
- **Lokasi File & Baris:**
  - `app/pages/roadmap.vue` (baris `197-375`, `609-630`, `738-754`)
- **Bukti Empiris:**
  - Board 5 kolom di `/roadmap` menampilkan entitas `Project` berdasarkan `releasePhase` (`backlog`, `mvp`, `v1.1`, `v2.0`, `released`) tanpa dukungan drag-and-drop antar-fase (pengguna harus menggunakan `<select>` kecil di footer kartu pada `baris 324-340`), tidak memiliki daftar rincian (*drill-down*) task/blocker di dalam kartu project, dan header halaman tidak memiliki tombol `+ New Project`.

---

## 6. Domain 5: Idea Scratchpad (`notes`) & Split-Brain Ideation

### 6.1. Tidak Ada UI Edit Note, Duplikasi Composable, & Bug Promosi Palsu (`SYS-09`)
- **Lokasi File & Baris:**
  - `components/notes/IdeaScratchpadPanel.vue` (baris `178-264`, `425-547`)
  - `composables/useNotes.ts` (baris `41-89`)
  - `server/api/notes/[id].put.ts` (baris `1-18`)
- **Bukti Empiris & Akar Masalah:**
  1. **Tidak Ada UI untuk Mengedit Catatan:** Endpoint `PUT /api/notes/:id` dan metode `useNotes().updateNote(id, patch)` sudah tersedia, tetapi `IdeaScratchpadPanel.vue:178-264` **sama sekali tidak menyediakan tombol atau mode edit** untuk mengubah isi (`content`) atau kategori (`category`) catatan yang sudah disimpan.
  2. **`IdeaScratchpadPanel.vue` Mengabaikan `useNotes.ts` & Menyimpan Task Palsu Saat Gagal Promote:**
     - `IdeaScratchpadPanel.vue:425-547` menulis ulang fungsi `submitNote`, `deleteNote`, dan `promoteNoteToKanban` secara lokal tanpa memakai `composables/useNotes.ts`.
     - Jika `POST /api/notes` gagal (`baris 462-464`), catatan optimistis dengan ID palsu `note-<timestamp>` tetap tertinggal di `workspaceStore.notes`. Ketika pengguna mengklik **Promote to Kanban** pada catatan tersebut, `POST /api/notes/:id/promote` mengembalikan error 404, lalu blok `catch` (`baris 504-544`) membuat task lokal palsu (`id: 'task-' + Date.now()`) di memori yang **tidak pernah dikirim ke `POST /api/tasks`**, sehingga hilang saat halaman di-refresh!
  3. **Badge `"Promoted to Kanban (#ENG-xxx)"` Tidak Bisa Diklik:**
     Di `IdeaScratchpadPanel.vue:237-243`, indikator bahwa catatan sudah dipromosikan menjadi task hanyalah elemen `<div>` statis, bukan tombol interaktif untuk membuka task terkait di `TaskDrawer.vue`.

---

## 7. Domain 6: Project Cockpit (`/projects/[slug]`) & Vercel Deployment Tab

### 7.1. `ProjectVercelTab.vue` Menampilkan Data Palsu (*Hardcoded Mock*) Saat Tidak Ada GitHub Deployment (`SYS-10`)
- **Lokasi File & Baris:**
  - `components/project/ProjectVercelTab.vue` (baris `19-89`, `159-188`, `212`, `237`, `252-310`)
  - `components/project/ProjectLiveDeploymentCard.vue` (baris `208`, `250-251`)
- **Bukti Empiris & Akar Masalah:**
  - Tidak ada satu pun kode di `server/api/**` yang memanggil Vercel REST API (`api.vercel.com`). Data deployment di `ProjectVercelTab.vue` berasal dari `/api/github/deployments`.
  - Ketika repositori project tidak memiliki data GitHub Deployments, `ProjectVercelTab.vue` jatuh ke **data palsu yang di-hardcode**:
    1. Selalu menampilkan `Framework: Nuxt 4 / Nitro` (`baris 24`), `Branch: main` (`baris 20`), `STATUS: Ready (Live)` (`baris 57`), `SSL CERTIFICATE: Let's Encrypt (Active)` (`baris 79`), dan `BUILD DURATION: 48s (Nitro server)` (`baris 86`) untuk semua project.
    2. Menampilkan output terminal build palsu (`Nuxt 4 production bundle ready`, `Total assets: 2.81 MB`) (`baris 159-165`).
    3. Jika *ping* ke `liveUrl` gagal di jaringan (`baris 297-298`), blok `catch` menghasilkan angka latensi acak palsu: `pingLatency.value = Math.floor(Math.random() * 20) + 35` ms! (`ProjectLiveDeploymentCard.vue:250-251` juga meng-hardcode `45` ms pada blok `catch`).
    4. Menampilkan 3 riwayat rilis palsu (`Production Release (Phase 4 & 5)`, `Preview Branch (PR #12)`, `Initial Setup Release`) dengan commit SHA palsu `943bce0`, `aa56120`, `5856ac9` (`baris 252-280`).
    5. Tombol **"Trigger Redeploy"** (`baris 183`, `304-310`) hanya menjalankan `setTimeout(..., 2000)` lalu memunculkan `alert('Redeployment triggered successfully via Vercel Webhook!')` tanpa melakukan panggilan jaringan apa pun!

---

## 8. Domain 7: Dashboard (`/`), Telemetry & Settings (`/settings`)

### 8.1. Ketidakakuratan Perhitungan Metrik di Dashboard (`SYS-08`)
- **Lokasi File & Baris:**
  - `components/dashboard/Dashboard.vue` (baris `32-40`, `153-157`)
  - `components/dashboard/UnifiedHeroBanner.vue` (baris `47-73`, `136-147`)
  - `components/dashboard/RecentShipmentsCard.vue` (baris `96-103`)
  - `components/dashboard/WorkspacePulse.vue` (baris `141-146`)
  - `components/layout/AlertBar.vue` (baris `25-39`, `55-69`)
- **Bukti Empiris & Akar Masalah:**
  1. **Persentase Sprint di `UnifiedHeroBanner.vue` Menghitung Semua Task Sepanjang Masa:**
     Header dan Tile 2 pada `UnifiedHeroBanner.vue` berlabel `Weekly Focus · Sprint Wxx`, namun `completedCount` (`baris 136`) dan `totalCount` (`baris 140`) menghitung seluruh `props.tasks` di workspace tanpa memfilter `t.sprintId === props.sprint?.id`. Akibatnya, persentase penyelesaian Sprint di Dashboard (`/`) tidak pernah cocok dengan halaman Weekly Sprints (`/sprints`).
  2. **Tile CI/CD Builds di Dashboard Hardcoded Mati:**
     `Dashboard.vue:36-37` mengoper prop statis `:ci-workflow-count="0"` dan `:ci-success-rate="null"` ke `UnifiedHeroBanner.vue`, sehingga Tile 3 selalu menampilkan `--` dan `No active checks` (namun tetap menampilkan titik hijau berkedip `animate-pulse` di `UnifiedHeroBanner.vue:64`).
  3. **`RecentShipmentsCard.vue` Tidak Mengurutkan Berdasarkan Waktu Deploy:**
     Di `RecentShipmentsCard.vue:96-103`, `deployedTasks.value.slice(0, 4)` langsung memotong 4 item pertama tanpa mengurutkan berdasarkan `updatedAt` terbaru (`b.updatedAt.localeCompare(a.updatedAt)`).
  4. **Ketidakcocokan Zona Waktu UTC vs Lokal untuk Task Overdue:**
     `Dashboard.vue:153` menghitung `todayStr` dengan `now.toISOString().slice(0, 10)` (UTC), sedangkan `WorkspacePulse.vue:141` menggunakan `getLocalDateString()` (waktu lokal). Bagi pengguna di UTC+7, antara pukul 00:00 hingga 07:00 WIB keduanya menampilkan status *overdue* yang berbeda.
  5. **Inkonsistensi Klik pada `AlertBar.vue`:**
     Mengklik task urgent/blocked di `AlertBar.vue:25-39, 55-69` yang memiliki `projectSlug` akan memindahkan halaman ke `/projects/[slug]`, sedangkan jika tidak memiliki `projectSlug` akan membuka `TaskDrawer`. Seharusnya klik pada alert task langsung membuka `TaskDrawer` agar blocker bisa segera ditangani.

### 8.2. Tiga Fitur *Placebo* di Halaman Settings (`/settings`) (`SYS-07`)
- **Lokasi File & Baris:**
  - `app/pages/settings.vue` (baris `130-139`, `158-182`, `226-275`, `299-368`)
  - `composables/useThemePreset.ts` (baris `14`, `43-89`)
  - `server/api/auth/session.post.ts` (baris `44-50`)
- **Bukti Empiris & Akar Masalah:**
  1. **Tombol `"Sign Out"` Hanya Mengubah State Memori Tanpa Menghapus Cookie `HttpOnly`:**
     Token sesi disimpan di dalam cookie `HttpOnly` bernama `nexura_session` (`server/api/auth/session.post.ts:44-50`). Fungsi `onClearSession()` di `app/pages/settings.vue:361-364` hanya mengubah `session.authStatus.value = 'unauthenticated'` di memori browser tanpa memanggil endpoint server untuk menghapus cookie tersebut. Akibatnya, begitu pengguna mengklik *Refresh Status* atau memuat ulang halaman, `GET /api/auth/session` membaca cookie `HttpOnly` yang masih aktif dan pengguna **otomatis kembali masuk (*Write Enabled*)**!
  2. **Theme & Appearance Selector 100% Placebo:**
     `selectTheme(id)` di `settings.vue:328-334` hanya menyimpan ke `localStorage.setItem('nexura:theme', id)` tanpa mengubah `document.body.dataset.preset`. Sementara itu, `composables/useThemePreset.ts` tidak pernah diimpor di `app/app.vue` maupun `settings.vue`, serta terdapat perbedaan ID (`'indigo'` di `settings.vue` vs `'default'` di `useThemePreset.ts`).
  3. **Angka Fallback Telemetry Palsu Saat Loading/Error:**
     Di `settings.vue:158-182`, badge status selalu menampilkan `OPERATIONAL`, latensi Supabase memiliki fallback `{{ telemetry?.supabase?.latencyMs ?? 42 }}ms`, dan GitHub rate limit memiliki fallback `{{ telemetry?.github?.rateLimit?.remaining ?? 4892 }} / 5000`. Saat server gagal terhubung atau sedang memuat, pengguna disuguhi angka palsu seolah-olah sistem sehat.

### 8.3. Ketidaksinkronan Script Database `all_in_one_setup.sql` & Dead Endpoints (`SYS-13`)
- **Lokasi File & Baris:**
  - `server/database/migrations/all_in_one_setup.sql` (baris `45`)
  - `server/schemas/task.schema.ts` (baris `30`)
  - `server/api/activities.get.ts` (`L1-12`) & `server/api/stats.get.ts` (`L1-63`)
- **Bukti Empiris:**
  1. Di `all_in_one_setup.sql:45`, constraint `CHECK (status IN ('in_queue', 'running_sprint', 'deployed', 'blocked'))` belum menyertakan `'idea'`, serta belum menyertakan tabel `project_notes` dan kolom `projects.release_phase` yang ada di migrasi `003_system_alignment_and_rls_lockdown.sql`.
  2. Di `server/schemas/task.schema.ts:30`, `githubIssueNumber: z.coerce.number().optional()` belum `.nullable()`, sehingga pengiriman `null` akan dikonversi menjadi `0` oleh `Number(null)`.
  3. Endpoint `GET /api/activities` dan `GET /api/stats` tidak pernah dipanggil di seluruh komponen/halaman frontend (*dead code*).

---

## 9. Matriks Penugasan Eksekutor & File Boundaries (`SYS-01` s/d `SYS-13`)

Sesuai aturan **Single Execution Owner** pada `.agents/rules/multi-agent-governance.md` Bab 6.1, berikut adalah pembagian tanggung jawab file secara ketat untuk tim eksekutor:

| Kode | Prioritas | Role Eksekutor Pemilik | File yang Dimodifikasi (Sesuai File Boundary) | Rincian Aksi Teknis |
|---|---|---|---|---|
| **SYS-01** | **P0** | **`frontend-store-executor`** | `components/modals/task/TaskDrawer.vue`, `components/modals/task/AddTaskModal.vue`, `app/app.vue`, `composables/useWorkspaceStore.ts`, `composables/useTasks.ts` | 1) Tambahkan selector `sprintId`, opsi status `'idea'`, dan input `githubPrUrl` di `TaskDrawer.vue`.<br>2) Perbaiki pengiriman `null` saat unlink `projectSlug` / `dueDate` / `sprintId` (jangan diubah jadi `undefined`).<br>3) Hapus pemanggilan `updateTaskInStore` sebelum `tasksApi.updateTask` di `submitSave()` agar baseline rollback tidak rusak.<br>4) Gunakan `project.githubRepo` dari store pada `effectiveRepo` di `TaskDrawer.vue` dan hapus `updateTask` redundan pasca `createGitHubIssue`.<br>5) Tambahkan selector `status` & `sprintId` di `AddTaskModal.vue`. |
| **SYS-02** | **P0** | **`backend-api-executor`** | `server/api/tasks.post.ts`, `server/api/tasks/[id].put.ts`, `server/repositories/supabase/mappers.ts`, `server/schemas/task.schema.ts` | 1) Tambahkan auto-bind `sprintId` ke Sprint aktif pada `POST /api/tasks` jika `status === 'running_sprint'`.<br>2) Pastikan `mapTaskRow` mengembalikan `null` secara konsisten untuk field opsional yang dikosongkan.<br>3) Ubah `githubIssueNumber` di `task.schema.ts` agar mendukung `.nullable()`. |
| **SYS-03** | **P0** | **`page-workspaces-executor`** | `components/kanban/KanbanBoard.vue`, `app/pages/tasks.vue` | 1) Hormati urutan `filteredTasks` dari `tasks.vue` di dalam `KanbanBoard.vue` (`preserveOrder`).<br>2) Tambahkan guard `if (task.status === newStatus) return` pada `onDrop()`.<br>3) Sinkronkan `statusFilter` saat beralih antara mode Tabel dan Kanban di `tasks.vue`. |
| **SYS-04** | **P0** | **`frontend-store-executor`** & **`page-workspaces-executor`** | `composables/useSprintWorkspace.ts`, `components/sprint/DeliverablesMatrix.vue`, `components/modals/sprint/AddTargetModal.vue`, `app/pages/sprints.vue` | 1) Di `useSprintWorkspace.ts`, pastikan `removeTaskFromWeek` mengirim `{ sprintId: null }` dan membersihkan `sprint.taskIds`.<br>2) Saat menambahkan task `'idea'` ke Sprint, promosikan statusnya ke `'in_queue'` atau hitung di `pendingTasks`.<br>3) Gunakan status `'planned'` saat membuat Sprint untuk minggu mendatang (`weekOffset > 0`) dan gunakan `Promise.all` saat Rollover.<br>4) Sambungkan klik kartu di `DeliverablesMatrix.vue` ke `openTaskDrawer(task)`. |
| **SYS-05** | **P0** | **`backend-api-executor`** & **`frontend-store-executor`** | `server/api/github/*.get.ts`, `server/api/github/create-issue.post.ts`, `server/api/github/workflow-rerun.post.ts`, `composables/useGitHub.ts` | 1) Tambahkan dukungan bypass cache (`shouldBypassCache: () => query.refresh === 'true'`) pada `defineCachedFunction` di endpoint GitHub.<br>2) Invalidate cache terkait setelah `create-issue.post.ts` dan `workflow-rerun.post.ts`.<br>3) Sertakan `limit` pada key & watch `useGitHubCommits`. |
| **SYS-06** | **P0** | **`backend-api-executor`** & **`frontend-store-executor`** | `server/api/github/sync.post.ts`, `composables/useSprintWorkspace.ts`, `components/modals/devops/PullRequestsIssuesModal.vue`, `composables/useProjectCockpit.ts` | 1) Selaraskan kontrak response `sync.post.ts` (`syncedCount` / `linkedCount`) dan filter pencocokan PR berdasarkan project pemilik repo.<br>2) Cek `workspaceStore.tasks.value` berdasarkan `githubIssueNumber` / `githubIssueUrl` untuk mencegah duplikasi impor Issue ke Kanban. |
| **SYS-07** | **P0** | **`backend-api-executor`**, **`frontend-store-executor`**, & **`page-workspaces-executor`** | `server/api/auth/session.delete.ts` (baru), `composables/useSession.ts`, `composables/useThemePreset.ts`, `app/app.vue`, `app/pages/settings.vue` | 1) Buat endpoint `DELETE /api/auth/session` untuk menghapus cookie `HttpOnly` `nexura_session` saat Sign Out.<br>2) Aktifkan `useThemePreset()` di `app.vue` dan `settings.vue` dengan menyamakan ID preset.<br>3) Hapus angka fallback palsu (`42ms`, `4892/5000`) di `settings.vue` saat telemetry bernilai `null`. |
| **SYS-08** | **P1** | **`page-workspaces-executor`** | `components/dashboard/Dashboard.vue`, `components/dashboard/UnifiedHeroBanner.vue`, `components/dashboard/RecentShipmentsCard.vue`, `components/layout/AlertBar.vue` | 1) Filter task berdasarkan `activeSprint.id` untuk metrik Sprint di `UnifiedHeroBanner.vue`.<br>2) Urutkan `deployedTasks` berdasarkan `updatedAt` desc di `RecentShipmentsCard.vue`.<br>3) Gunakan `getLocalDateString()` secara konsisten di `Dashboard.vue` dan buka `TaskDrawer` saat alert task di `AlertBar.vue` diklik. |
| **SYS-09** | **P1** | **`frontend-store-executor`** & **`page-workspaces-executor`** | `components/notes/IdeaScratchpadPanel.vue`, `composables/useNotes.ts` | 1) Gunakan `useNotes.ts` di `IdeaScratchpadPanel.vue`, tambahkan fitur inline edit catatan (`updateNote`), hapus fallback pembuatan task palsu lokal saat promote gagal, dan jadikan badge `#ENG-xxx` dapat diklik untuk membuka `TaskDrawer`. |
| **SYS-10** | **P1** | **`page-workspaces-executor`** | `components/project/ProjectVercelTab.vue`, `components/project/ProjectLiveDeploymentCard.vue` | 1) Ganti log terminal palsu, durasi `48s` palsu, latensi acak palsu, 3 rilis historis palsu, dan tombol *Trigger Redeploy* `alert()` dengan *empty/disconnected state* yang jujur berdasarkan data aktual `props.deployments` dan `props.project`. |
| **SYS-11** | **P1** | **`page-workspaces-executor`** | `components/kanban/KanbanBoard.vue`, `components/kanban/KanbanColumn.vue`, `components/kanban/TaskCard.vue`, `components/tasks/ActiveFocusPanel.vue` | 1) Perbaiki `move-right-target="deployed"` pada kolom `blocked`.<br>2) Tambahkan `sm:focus-within:opacity-100` dan tombol `toggle-blocked` pada `TaskCard.vue`, serta tampilkan nama/minggu Sprint aktual.<br>3) Gunakan `useMarkdownChecklist` di `ActiveFocusPanel.vue`. |
| **SYS-12** | **P2** | **`backend-api-executor`** & **`frontend-store-executor`** | `server/api/github/pulls-issues.get.ts`, `server/api/github/security.get.ts`, `composables/useSession.ts` | 1) Pisahkan pengambilan Issue murni dari PR di `pulls-issues.get.ts` dan jangan meng-cache error 401/403 sebagai array kosong.<br>2) Pastikan `useSession.handleApiError` tidak melogout sesi Nexura ketika menerima error `GITHUB_AUTH_FAILED`. |
| **SYS-13** | **P2** | **`security-db-executor`** & **`qa-automation-executor`** | `server/database/migrations/all_in_one_setup.sql`, `tests/unit/**` | 1) Selaraskan `all_in_one_setup.sql` dengan migrasi `003` (status `'idea'`, tabel `project_notes`, `release_phase`).<br>2) Tambahkan unit/contract test untuk memvalidasi perbaikan `SYS-01` s/d `SYS-12`. |


---

## 10. Rencana Implementasi Komprehensif (Tahap C)

Sesuai tata kelola `.agents/rules/multi-agent-governance.md` Bab 4 (Tahap C) dan hasil konsolidasi diskusi tim analisis pada Bab 1–9 di atas, bagian ini menetapkan **Master Implementation Plan** untuk merealisasikan remedi ke-22 temuan empiris secara bertahap, deterministik, dan tanpa regresi.

### 10.1. Prinsip Dasar & Batasan Mutlak Arsitektur
1. **Strict File Ownership (Single Execution Owner):**
   Setiap file hanya boleh disentuh oleh eksekutor yang berwenang sesuai matriks Bab 9. Dilarang keras melakukan modifikasi file secara bersamaan (*concurrent editing*).
2. **Zero Fake Metrics & Zero Placebo:**
   Seluruh data hardcoded acak, log terminal palsu, latensi buatan, dan tombol `alert()` wajib digantikan dengan status jujur (*truthful state*) berbasis data server aktual atau `BaseEmptyState` yang transparan.
3. **Preservasi 367 Baseline Passing Tests:**
   Setiap langkah pengerjaan wajib mempertahankan kelulusan 100% dari 367 unit tests yang telah ada. Pengujian dijalankan secara otomatis pada setiap akhir checkpoint gelombang.
4. **Batas Mutlak 14 File GitHub (`security-headers.spec.mjs:102`):**
   Folder `server/api/github/` dikunci tepat 14 file handler oleh test suite CI. Eksekutor **dilarang menambah file baru** di folder tersebut. Seluruh logika bypass/invalidation cache wajib diimplementasikan di dalam 14 file eksisting atau diletakkan di `server/utils/**`.
5. **Styling & Layout Preservation:**
   Tidak ada perombakan tema atau penghapusan visual Tailwind Dark Obsidian Bento (`#07080A`, `#111318`, `#818CF8`). Perubahan hanya dilakukan untuk menyambungkan binding reaktif, props, dan event handlers.

### 10.2. Scope Pekerjaan (In-Scope vs Out-of-Scope)
- **In-Scope:**
  - Remediasi `SYS-01` s/d `SYS-13` pada 7 domain subsistem.
  - Pembuatan endpoint `DELETE /api/auth/session` dan update `server/middleware/auth.ts`.
  - Penyelarasan serialisasi `null` (bukan `undefined`) pada mappers, schemas, dan forms.
  - Implementasi bypass cache `?refresh=true` pada 11 endpoint GET GitHub.
  - Penambahan suite tes baru `tests/unit/subsystem-remediation.spec.mjs`.
  - Penyelarasan skema DDL `all_in_one_setup.sql`.
- **Out-of-Scope:**
  - Penambahan library UI pihak ketiga atau ikon baru di luar Lucide/NexuraIcon.
  - Migrasi database destruktif yang menghapus tabel eksisting di production.
  - Pembuatan sistem background worker / message queue mandiri di luar serverless Nitro runtime.

---

## 11. Rincian Eksekusi 3 Gelombang (Wave 1, Wave 2, Wave 3)

Pengerjaan diatur secara sekuensial ke dalam **3 Gelombang (Waves)** untuk memastikan dependensi logis tertata rapi dan tidak terjadi *race condition* antar-eksekutor:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WAVE 1: CORE ENGINE & STATE INTEGRITY (P0 FOUNDATIONS)                      │
│ Durasi Perkiraan: Sesi 1                                                    │
│ Fokus: Auto-bind sprint, null unlinking, rollback baseline & sign-out       │
├─────────────────────────────────────────────────────────────────────────────┤
│ WAVE 2: GITHUB INTEGRATION, CACHE & WORKSPACES (P0 - P1)                    │
│ Durasi Perkiraan: Sesi 2                                                    │
│ Fokus: Nitro cache bypass, sync engine dual-key, sprints & kanban a11y      │
├─────────────────────────────────────────────────────────────────────────────┤
│ WAVE 3: SCRATCHPAD, VERCEL CLEANUP & FINAL TEST SUITE (P1 - P2)             │
│ Durasi Perkiraan: Sesi 3                                                    │
│ Fokus: Notes store migration, vercel empty state, DDL & QA regression suite │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 11.1. WAVE 1: CORE ENGINE & STATE INTEGRITY (P0 FOUNDATIONS)

#### Langkah 1.1: `SYS-02` Backend Auto-Bind Sprint & Mapper Null Normalization
- **Eksekutor:** `backend-api-executor`
- **File Target:**
  - `server/api/tasks.post.ts`
  - `server/repositories/supabase/mappers.ts`
  - `server/utils/store.ts`
  - `server/schemas/task.schema.ts`
  - `types/task.ts`
- **Tindakan Teknis:**
  1. Pada `server/api/tasks.post.ts`, tambahkan pencarian Sprint aktif jika `body.status === 'running_sprint'` dan `!body.sprintId`, lalu bind `sprintId = activeSprint.id`.
  2. Pada `server/repositories/supabase/mappers.ts:8-21` dan `server/utils/store.ts:70-90`, ganti evaluasi `row.col || undefined` menjadi `row.col ?? null` untuk kolom nullable (`projectSlug`, `dueDate`, `sprintId`, `githubIssueUrl`, `githubIssueNumber`, `githubPrUrl`).
  3. Pada `server/schemas/task.schema.ts:30`, perbarui `githubIssueNumber: z.coerce.number().nullable().optional()`.
  4. Pada `types/task.ts:19`, perbarui tipe menjadi `githubIssueNumber?: number | null`.

#### Langkah 1.2: `SYS-01` TaskDrawer & AddTaskModal Null Unlink & Rollback Baseline Fix
- **Eksekutor:** `frontend-store-executor`
- **File Target:**
  - `components/modals/task/TaskDrawer.vue`
  - `components/modals/task/AddTaskModal.vue`
- **Tindakan Teknis:**
  1. Di `TaskDrawer.vue:646`, hapus pemanggilan prematur `updateTaskInStore(targetId, payload)`. Biarkan `tasksApi.updateTask` yang mengelola mutasi optimistis dan snapshot rollback baseline.
  2. Di `TaskDrawer.vue:637-640`, ubah serialisasi field agar mengirim `null` eksplisit saat dikosongkan:
     ```ts
     projectSlug: form.projectSlug ? form.projectSlug : null,
     dueDate: form.dueDate && form.dueDate.trim() ? form.dueDate.trim() : null,
     sprintId: form.sprintId ? form.sprintId : null,
     ```
  3. Tambahkan field `sprintId` pada form, template selector sprint yang membaca `workspaceStore.sprints`, opsi status `'idea'` di `statusOptions` dan `statusBadgeClass`, serta elemen `<input>` untuk `githubPrUrl`.
  4. Perbaiki `effectiveRepo` di `TaskDrawer.vue:478-486` agar membaca `project.githubRepo` dari `workspaceStore.projects` berdasarkan `currentTask.projectSlug`. Hapus pemanggilan kedua `tasksApi.updateTask` di `handleCreateIssue`.
  5. Di `AddTaskModal.vue`, tambahkan dropdown pemilih `status` dan `sprintId` yang terikat ke state pembuatan task, dan hapus *dead code* `getDefaultDueDate()`.

#### Langkah 1.3: `SYS-07` Backend `DELETE /api/auth/session` & Auth Middleware Whitelist
- **Eksekutor:** `backend-api-executor` & `security-db-executor`
- **File Target:**
  - `server/api/auth/session.delete.ts` (file baru) — *Owned by `backend-api-executor`*
  - `server/middleware/auth.ts` — *Owned by `security-db-executor`*
  - `composables/useSession.ts` — *Owned by `frontend-store-executor`*
  - `app/pages/settings.vue` — *Owned by `page-workspaces-executor`*
- **Tindakan Teknis:**
  1. `backend-api-executor` membuat `server/api/auth/session.delete.ts` yang memanggil `deleteCookie(event, 'nexura_session', { path: '/', httpOnly: true, sameSite: 'lax' })`.
  2. `security-db-executor` memperbarui `server/middleware/auth.ts:87` untuk mengizinkan method `DELETE` pada path `/api/auth/session` tanpa memblokirnya dengan HTTP 401.
  3. `frontend-store-executor` menambahkan method `logout()` pada `useSession.ts` yang memanggil `DELETE /api/auth/session`.
  4. `page-workspaces-executor` memperbarui tombol Sign Out di `settings.vue:361-364` agar memanggil `await session.logout()`.

#### Langkah 1.4: `SYS-03` KanbanBoard Sort Preservation & Drop Guard
- **Eksekutor:** `page-workspaces-executor`
- **File Target:**
  - `components/kanban/KanbanBoard.vue`
  - `app/pages/tasks.vue`
- **Tindakan Teknis:**
  1. Pada `KanbanBoard.vue`, tambahkan prop `preserveOrder?: boolean` (default `false`). Jika `preserveOrder === true`, computed `processedTasks` langsung menggunakan urutan `props.tasks` dari parent tanpa menimpanya.
  2. Di `app/pages/tasks.vue:228`, berikan binding `:preserve-order="true"` pada `<KanbanBoard />`.
  3. Di `KanbanBoard.vue:301`, tambahkan guard pada `onDrop()`:
     ```ts
     const task = localTasksList.value.find(t => t.id === taskId || t.taskId === taskId)
     if (!task || task.status === newStatus) return
     ```
  4. Di `tasks.vue:704`, batasi filter `statusFilter` hanya aktif saat `viewMode === 'table'` agar kolom Kanban tidak hilang saat berpindah view.

* **Quality Checkpoint Wave 1:**
  - Jalankan `node --test tests/unit/*.spec.mjs` (wajib 367/367 PASS).
  - Jalankan `npx vue-tsc --noEmit` (0 errors).
  - Git Commit: `feat(core): complete wave 1 - task state integrity, auto-bind sprint, session signout, and kanban sort preservation (367 tests pass)`.

---

### 11.2. WAVE 2: GITHUB INTEGRATION, CACHE & WORKSPACES (P0 - P1)

#### Langkah 2.1: `SYS-05` Nitro Cache Bypass (`?refresh=true`) & Key Limit Watch
- **Eksekutor:** `backend-api-executor` & `frontend-store-executor`
- **File Target:**
  - `server/api/github/repos.get.ts`
  - `server/api/github/commits.get.ts`
  - `server/api/github/branches.get.ts`
  - `server/api/github/pulls-issues.get.ts`
  - `server/api/github/workflows.get.ts`
  - `server/api/github/deployments.get.ts`
  - `server/api/github/create-issue.post.ts`
  - `server/api/github/workflow-rerun.post.ts`
  - `composables/useGitHub.ts`
- **Tindakan Teknis:**
  1. Pada endpoint GET GitHub, tambahkan parameter `refresh?: boolean` pada fungsi `defineCachedFunction` dan opsi `shouldBypassCache: (_t, _r, _l, refresh) => Boolean(refresh)`. Handler membaca `getQuery(event).refresh === 'true'`.
  2. Di `create-issue.post.ts` dan `workflow-rerun.post.ts`, panggil invalidasi cache Nitro storage key terkait.
  3. Di `composables/useGitHub.ts:45-60`, sertakan `limit` ke dalam cache key template literal dan array `watch` pada `useGitHubCommits`.

#### Langkah 2.2: `SYS-06` GitHub Sync Engine Dual-Contract & Anti-Duplikasi Issue
- **Eksekutor:** `backend-api-executor` & `frontend-store-executor`
- **File Target:**
  - `server/api/github/sync.post.ts`
  - `composables/useSprintWorkspace.ts`
  - `components/modals/devops/PullRequestsIssuesModal.vue`
  - `composables/useProjectCockpit.ts`
- **Tindakan Teknis:**
  1. Pada `server/api/github/sync.post.ts:99-105`, kembalikan properti ganda:
     `{ ok: true, success: true, syncedCount: linkedCount, linkedCount, deployedCount, updatedTasks, timestamp }`.
  2. Di `sync.post.ts:74`, tambahkan pengecekan kesesuaian project agar PR hanya mencocokkan task yang memiliki `projectSlug` yang terikat pada repositori tersebut.
  3. Di `PullRequestsIssuesModal.vue` dan `useProjectCockpit.ts`, ganti flag memori lokal dengan verifikasi ke `workspaceStore.tasks.value` (`t.githubIssueNumber === issue.number || t.githubIssueUrl === issue.htmlUrl`) untuk mencegah duplikasi impor issue.

#### Langkah 2.3: `SYS-04` Weekly Sprints Null Unlink, Idea Status Promotion & Rollover Paralel
- **Eksekutor:** `frontend-store-executor` & `page-workspaces-executor`
- **File Target:**
  - `composables/useSprintWorkspace.ts`
  - `components/sprint/DeliverablesMatrix.vue`
  - `components/modals/sprint/AddTargetModal.vue`
  - `app/pages/sprints.vue`
- **Tindakan Teknis:**
  1. Di `useSprintWorkspace.ts:293-300`, ubah `removeTaskFromWeek` agar mengirim `{ sprintId: null }` dan membersihkan ID task dari `sprint.taskIds`.
  2. Saat task `'idea'` ditambahkan ke Sprint (`AddTargetModal.vue`), promosikan statusnya ke `'in_queue'` dan sertakan `'idea'` dalam `pendingTasks` di `useSprintWorkspace.ts`.
  3. Di `useSprintWorkspace.ts:179`, gunakan `status: weekOffset.value > 0 ? 'planned' : 'active'` saat membuat sprint mendatang, dan gunakan `Promise.all` pada loop rollover `onConfirmRollover`.
  4. Di `DeliverablesMatrix.vue`, tambahkan `@click="$emit('task-click', task)"` pada kartu deliverable dan hubungkan ke `openTaskDrawer` di `app/pages/sprints.vue`.

#### Langkah 2.4: `SYS-11` Kanban Touch `toggle-blocked`, Arrow Symmetry & Dynamic Sprint Badge
- **Eksekutor:** `page-workspaces-executor`
- **File Target:**
  - `components/kanban/KanbanBoard.vue`
  - `components/kanban/KanbanColumn.vue`
  - `components/kanban/TaskCard.vue`
  - `components/tasks/ActiveFocusPanel.vue`
- **Tindakan Teknis:**
  1. Di `KanbanBoard.vue:97`, ubah target panah kanan kolom `blocked` menjadi `move-right-target="deployed"`.
  2. Di `TaskCard.vue:37`, tambahkan modifier `sm:focus-within:opacity-100` agar tombol aksi terlihat saat menerima fokus keyboard.
  3. Render tombol aksi mikro `toggle-blocked` di `TaskCard.vue` agar pengguna layar sentuh dapat memindahkan task ke status `blocked`.
  4. Ganti teks statis `"Sprint"` di `TaskCard.vue:86-91` dengan label sprint dinamis (misal `W45` atau nama sprint dari store).
  5. Gunakan `composables/useMarkdownChecklist.ts` di `ActiveFocusPanel.vue`.

#### Langkah 2.5: `SYS-08` Dashboard Hero Sprint Filter, Shipments Sort & Timezone Parity
- **Eksekutor:** `page-workspaces-executor`
- **File Target:**
  - `components/dashboard/UnifiedHeroBanner.vue`
  - `components/dashboard/RecentShipmentsCard.vue`
  - `components/dashboard/Dashboard.vue`
  - `components/layout/AlertBar.vue`
- **Tindakan Teknis:**
  1. Di `UnifiedHeroBanner.vue:136-147`, filter task berdasarkan `props.sprint.id` untuk menghitung persentase progres Sprint yang sedang berjalan.
  2. Di `RecentShipmentsCard.vue:96-103`, urutkan `deployedTasks` secara descending berdasarkan `updatedAt` terbaru sebelum di-slice 4 item.
  3. Di `Dashboard.vue:153`, gunakan `getLocalDateString()` secara seragam untuk mendeteksi task overdue.
  4. Di `AlertBar.vue`, ubah klik pada task alert agar langsung membuka `TaskDrawer`.

* **Quality Checkpoint Wave 2:**
  - Jalankan `node --test tests/unit/*.spec.mjs` (wajib 367/367 PASS).
  - Jalankan `npx vue-tsc --noEmit` (0 errors).
  - Git Commit: `feat(workspaces): complete wave 2 - github cache bypass, sync engine contract, sprints rollover, and dashboard metric parity (367 tests pass)`.

---

### 11.3. WAVE 3: SCRATCHPAD, VERCEL CLEANUP & FINAL TEST SUITE (P1 - P2)

#### Langkah 3.1: `SYS-09` Scratchpad `useNotes` Integration & Fake Task Purge
- **Eksekutor:** `frontend-store-executor` & `page-workspaces-executor`
- **File Target:**
  - `components/notes/IdeaScratchpadPanel.vue`
  - `composables/useNotes.ts`
- **Tindakan Teknis:**
  1. Hapus implementasi CRUD lokal di `IdeaScratchpadPanel.vue:425-480` dan gunakan metode kanonik dari `composables/useNotes.ts`.
  2. Hapus pembuatan task palsu di blok `catch` pada `promoteNoteToKanban`. Tampilkan pesan error umpan balik yang jujur jika promosi gagal.
  3. Sediakan tombol inline edit catatan yang memanggil `updateNote(id, patch)`.
  4. Ubah badge `#ENG-xxx` di `IdeaScratchpadPanel.vue:237-243` menjadi tombol interaktif yang membuka `TaskDrawer`.

#### Langkah 3.2: `SYS-10` Project Vercel Tab Mock Removal & Honest Disconnected State
- **Eksekutor:** `page-workspaces-executor`
- **File Target:**
  - `components/project/ProjectVercelTab.vue`
  - `components/project/ProjectLiveDeploymentCard.vue`
- **Tindakan Teknis:**
  1. Hapus 3 riwayat rilis buatan dengan SHA palsu (`943bce0`, `aa56120`, `5856ac9`) di `ProjectVercelTab.vue:252-280`.
  2. Hapus cuplikan terminal build log palsu, durasi build `48s` statis, dan framework default `Nuxt 4 / Nitro` di `ProjectVercelTab.vue:159-165`.
  3. Hapus latensi acak palsu `Math.random()` pada blok `catch` di `ProjectVercelTab.vue:298` dan `ProjectLiveDeploymentCard.vue:250-251`. Tampilkan label `Unreachable / Offline` secara jujur.
  4. Hapus tombol *Trigger Redeploy* yang hanya menjalankan `alert()` placebo di `ProjectVercelTab.vue:304-310`.
  5. Tampilkan `BaseEmptyState` yang bersih dan informatif jika repositori belum memiliki riwayat deployment GitHub.

#### Langkah 3.3: `SYS-12` GitHub Pulls/Issues Separation & 401 Error Isolation
- **Eksekutor:** `backend-api-executor` & `frontend-store-executor`
- **File Target:**
  - `server/api/github/pulls-issues.get.ts`
  - `server/api/github/security.get.ts`
  - `composables/useSession.ts`
- **Tindakan Teknis:**
  1. Di `pulls-issues.get.ts:78-105`, terapkan paging buffer (`per_page=50`) sebelum memfilter `!item.pull_request` agar array issues tidak terpotong menjadi `0` saat PR mendominasi.
  2. Jangan meng-cache respons array kosong pada error 401/403 di endpoint GitHub; biarkan error terlempar agar cache tidak terkontaminasi.
  3. Di `composables/useSession.ts:89-93`, tambahkan isolasi error eksternal agar `code === 'GITHUB_AUTH_FAILED'` atau `code === 'GITHUB_RATE_LIMITED'` tidak memicu logout sesi internal Nexura.

#### Langkah 3.4: `SYS-13` DDL Alignment (`all_in_one_setup.sql`) & QA Test Suite
- **Eksekutor:** `security-db-executor` & `qa-automation-executor`
- **File Target:**
  - `server/database/migrations/all_in_one_setup.sql` — *Owned by `security-db-executor`*
  - `tests/unit/subsystem-remediation.spec.mjs` (file baru) — *Owned by `qa-automation-executor`*
- **Tindakan Teknis:**
  1. `security-db-executor` memperbarui `all_in_one_setup.sql:45` agar check constraint status menyertakan `'idea'`, menambahkan definisi tabel `public.project_notes`, kolom `release_phase` pada `projects`, dan mengunci RLS policy ke `service_role` (mencabut hak akses penuh `anon`).
  2. `qa-automation-executor` membuat test suite baru `tests/unit/subsystem-remediation.spec.mjs` yang memuat 16–18 contract assertions (sesuai matriks Bab 13).

* **Quality Checkpoint Wave 3:**
  - Jalankan `node --test tests/unit/*.spec.mjs` (wajib 367 baseline + ~16 test baru = **~383 PASS / 0 FAIL**).
  - Jalankan `npx vue-tsc --noEmit` (0 errors).
  - Jalankan `python -m graphify update .` untuk memperbarui AST knowledge graph.
  - Git Commit: `feat(audit): complete wave 3 - notes ssot, vercel honest state, ddl alignment, and subsystem remediation test suite (all tests pass)`.

---

## 12. Kontrak Integrasi Antar-Eksekutor & Schema Types

Untuk menjamin tidak ada desinkronisasi kontrak antar-eksekutor, disepakati spesifikasi antarmuka berikut:

### 12.1. Skema Zod & Tipe TypeScript (`types/task.ts` & `server/schemas/task.schema.ts`)
```typescript
// types/task.ts
export interface Task {
  id: string
  taskId: string
  title: string
  description?: string
  status: 'idea' | 'in_queue' | 'running_sprint' | 'deployed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  projectSlug?: string | null
  dueDate?: string | null
  sprintId?: string | null
  githubIssueUrl?: string | null
  githubIssueNumber?: number | null
  githubPrUrl?: string | null
  createdAt?: string
  updatedAt?: string
}
```

```typescript
// server/schemas/task.schema.ts
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['idea', 'in_queue', 'running_sprint', 'deployed', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  projectSlug: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  githubIssueUrl: z.string().url().optional().nullable(),
  githubIssueNumber: z.coerce.number().optional().nullable(),
  githubPrUrl: z.string().url().optional().nullable(),
})
```

### 12.2. Kontrak API GitHub Sync (`server/api/github/sync.post.ts`)
```typescript
export interface GitHubSyncResponse {
  ok: true
  success: true
  syncedCount: number
  linkedCount: number
  deployedCount: number
  updatedTasks: Array<{
    id: string
    taskId: string
    status: string
    githubPrUrl: string
  }>
  timestamp: string
}
```

### 12.3. Kontrak API Session Sign Out (`server/api/auth/session.delete.ts`)
```typescript
export interface SessionDeleteResponse {
  success: true
  message: 'Session cleared successfully'
}
```

---

## 13. Strategi Pengujian QA & Zero-Regression Matrix

Suite tes baru `tests/unit/subsystem-remediation.spec.mjs` dirancang oleh `qa-automation-executor` untuk memvalidasi seluruh remedi fungsional secara terisolasi tanpa mengubah 25 test suite eksisting:

| No | Kode Tes | Komponen / Endpoint | Target Validasi Teknis |
|:---:|:---|:---|:---|
| 1 | `TEST-SYS-01-UNLINK-01` | `TaskDrawer.vue` | Memastikan unlinking projectSlug, dueDate, sprintId mengirim `null` (bukan terhapus/undefined). |
| 2 | `TEST-SYS-01-ROLLBACK-01` | `TaskDrawer.vue` | Memastikan `updateTaskInStore` tidak dipanggil sebelum API updateTask selesai. |
| 3 | `TEST-SYS-02-AUTOBIND-01` | `POST /api/tasks` | Memastikan task status `running_sprint` otomatis terikat ke active sprint. |
| 4 | `TEST-SYS-02-MAPPER-01` | `mappers.ts` | Memastikan kolom database NULL dipetakan ke `null` (bukan `undefined`). |
| 5 | `TEST-SYS-03-SORT-01` | `KanbanBoard.vue` | Memastikan prop `preserveOrder` menghormati array urutan dari `tasks.vue`. |
| 6 | `TEST-SYS-03-GUARD-01` | `KanbanBoard.vue` | Memastikan `onDrop()` pada status yang sama tidak memicu emit mutasi. |
| 7 | `TEST-SYS-04-REMOVE-01` | `useSprintWorkspace.ts` | Memastikan `removeTaskFromWeek` mengirim `{ sprintId: null }` dan membersihkan `taskIds`. |
| 8 | `TEST-SYS-04-DRAWER-01` | `DeliverablesMatrix.vue` | Memastikan klik kartu deliverable memancarkan event `task-click`. |
| 9 | `TEST-SYS-05-BYPASS-01` | `server/api/github/*.get.ts` | Memastikan query `?refresh=true` memicu `shouldBypassCache`. |
| 10 | `TEST-SYS-05-LIMIT-01` | `useGitHubCommits.ts` | Memastikan parameter `limit` disertakan dalam asyncData cache key dan watch array. |
| 11 | `TEST-SYS-06-CONTRACT-01` | `POST /api/github/sync` | Memastikan response memuat `syncedCount` DAN `linkedCount` secara identik. |
| 12 | `TEST-SYS-06-DEDUP-01` | `PullRequestsIssuesModal.vue` | Memastikan issue yang nomornya sudah ada di store tasks ditandai imported (anti-duplikasi). |
| 13 | `TEST-SYS-07-SIGNOUT-01` | `DELETE /api/auth/session` | Memastikan endpoint menghapus cookie `nexura_session` dan diizinkan oleh middleware auth. |
| 14 | `TEST-SYS-08-HERO-01` | `UnifiedHeroBanner.vue` | Memastikan persentase sprint hanya menghitung task milik active sprint. |
| 15 | `TEST-SYS-10-HONEST-01` | `ProjectVercelTab.vue` | Memastikan tidak ada hardcoded SHA palsu (`943bce0`) atau latensi acak Math.random(). |
| 16 | `TEST-SYS-11-ARROW-01` | `KanbanBoard.vue` | Memastikan target panah kanan kolom `blocked` mengarah ke `deployed`. |
| 17 | `TEST-SYS-12-ERROR-01` | `useSession.ts` | Memastikan error `GITHUB_AUTH_FAILED` tidak memicu `authStatus = 'unauthenticated'`. |
| 18 | `TEST-SYS-13-DDL-01` | `all_in_one_setup.sql` | Memastikan skema memuat status `'idea'`, tabel `project_notes`, dan policy `service_role`. |

---

## 14. Rencana Kontinjensi, Eskalasi & Definition of Done

### 14.1. Strategi Kontinjensi & Rollback
- Setiap gelombang (Wave) dikerjakan dalam atomic git commits. Jika sebuah langkah dalam gelombang mengalami kegagalan uji atau regresi:
  1. Eksekutor dilarang memaksakan perbaikan di luar batas kepemilikan file.
  2. Head Agent melakukan rollback instan ke commit stabil checkpoint sebelumnya (`git revert`).
  3. Masalah dianalisis ulang bersama analis domain terkait sebelum mencoba kembali.

### 14.2. Kriteria Selesai (Definition of Done / DoD)
Pekerjaan subsistem ini dinyatakan selesai dan siap diratifikasi (`ACCEPTED`) apabila:
1. Seluruh 13 paket pekerjaan (`SYS-01` s/d `SYS-13`) terimplementasi 100% sesuai file boundaries.
2. Seluruh 367 unit/contract tests eksisting tetap lulus (`PASS`) tanpa kegagalan (0 fail).
3. Test suite baru `tests/unit/subsystem-remediation.spec.mjs` (16–18 assertions) lulus 100%.
4. TypeScript typecheck (`npx vue-tsc --noEmit`) menghasilkan 0 errors.
5. AST knowledge graph (`python -m graphify update .`) berhasil diperbarui dan sinkron.
6. Project Owner memverifikasi fungsionalitas dan memberikan akseptasi akhir.
