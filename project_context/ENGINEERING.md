# ENGINEERING.md — Standar Engineering & Konvensi Teknis Nexura

> **Status:** RATIFIED & HARDENED (Production-Ready)  
> **Last Updated:** 29 Oktober 2026  
> **Lead Architect & Orchestrator:** Bagja Iskandar & Antigravity Head Agent  
> **Design Pattern:** Precision Dark Obsidian Bento UI (Linear / Raycast Inset Shell)  
> **Master Reference:** [`DOCUMENTATION.md`](../DOCUMENTATION.md) | [`docs/master-remediation-plan.md`](../docs/master-remediation-plan.md)

---

## 1. Standar Rekayasa & Arsitektur Kode

### 1.1. TypeScript Strictness
- Proyek berjalan di atas TypeScript Strict Mode via konfigurasi Nuxt 4 (`.nuxt/tsconfig.json`).
- Seluruh komponen Vue wajib menggunakan sintaks Composition API `<script setup lang="ts">`.
- Props didefinisikan menggunakan generic syntax: `defineProps<Props>()`.
- Emits didefinisikan menggunakan generic syntax: `defineEmits<{ (e: 'event', payload: T): void }>()`.
- Dilarang keras menggunakan `any` tanpa alasan teknis yang terdokumentasi; gunakan Zod schemas untuk memvalidasi tipe runtime yang tidak pasti.

### 1.2. Unified State Management (`useWorkspaceStore.ts`)
- **Canonical Singleton:** State global aplikasi dipusatkan pada [`composables/useWorkspaceStore.ts`](../composables/useWorkspaceStore.ts) menggunakan `useState` bawaan Nuxt.
- **Single Coordinated Hydration:** Inisialisasi awal saat boot di `app/app.vue` mengeksekusi paralel `initializeWorkspace()`, meniadakan 25 kunci cache terfragmentasi sebelumnya.
- **Optimistic UI:** Mutasi data (pemindahan kolom Kanban, checklist Markdown, pembuatan proyek) langsung memutasi state memori lokal (0ms) sambil menyinkronkan data ke API di latar belakang. Jika sinkronisasi gagal, state di-rollback secara otomatis.

### 1.3. Server Layer & Dual-Adapter Repository
- **Centralized Handler (`withApiHandler`):** Seluruh REST endpoint di bawah `/api/**` dibungkus dengan [`server/utils/handler.ts`](../server/utils/handler.ts).
- **Unified Security Gate:** Seluruh operasi mutasi (`POST`, `PUT`, `PATCH`, `DELETE`) dilindungi oleh [`server/middleware/auth.ts`](../server/middleware/auth.ts) yang memvalidasi Bearer token atau session cookie.
- **Repository Pattern:** Seluruh akses data menggunakan abstraksi repository (`server/repositories/`).
- **PostgREST Query Hardening (`SEC-004`):**
  - Meniadakan interpolasi string mentah pada pemanggilan `.or(...)`.
  - Menggunakan pencarian deterministik: `ENG-xxx` diarahkan ke `.eq('task_id', val)`, UUID diarahkan ke `.eq('id', val)`.
- **Zero Silent Data Loss Policy:**
  - Repositori Supabase tidak lagi melakukan failover mutasi diam-diam ke Nitro KV. Kegagalan database di cloud produksi menghasilkan error HTTP 503 secara jujur (*fail-fast*).

---

## 2. Standar Desain Visual: Precision Dark Obsidian Bento UI

### 2.1. Filosofi Desain
Mengadopsi standar visual modern ala **Linear / Raycast / Cursor**:
- Kanvas dingin: Outer Void `#07080A`, Inset Workspace Canvas `#0B0C10`, Specular Surface `#111318`.
- Teks berkontras tinggi: Teks utama Crisp Alabaster `#F3F4F6`, teks sekunder Cool Slate `#8A8F9E`.
- Aksen utama: Obsidian Cool Indigo (`#6366F1` / `#818CF8`) dan tombol aksi utama putih Crisp Alabaster (`bg-[#F3F4F6] text-[#07080A]`).

### 2.2. Aturan Tipografi & Ergonomi Layar
1. **Font UI Default:** Gunakan `font-sans` (`Inter`) untuk semua elemen navigasi, judul kartu, nama tugas, deskripsi, dan tombol.
2. **Font Data & Metrik:** Gunakan `font-mono` (`JetBrains Mono`) **hanya** untuk identifier: Task ID (`#ENG-104`), commit SHA (`a75e740`), angka metrik/KPI (`78%`), nama branch/repo, dan jam.
3. **Batas Ukuran Minimum:** Batas minimum font yang diizinkan adalah `text-xs` (`12px`). Dilarang menggunakan ukuran mikro `text-[9px]`, `text-[10px]`, atau `text-[11px]` demi menjaga keterbacaan.

### 2.3. Specular Lighting & Bento Grid
- Gunakan class `.obs-workspace` untuk membungkus workspace inset pada `app/app.vue`.
- Gunakan class `.obs-card` (atau `.console-card`) untuk kartu specular dengan top-highlight 1px (`inset 0 1px 0 0 rgba(255,255,255,0.07)`).

---

## 3. Konvensi Penamaan (Naming Conventions)

| Tipe Entitas | Konvensi | Contoh |
|---|---|---|
| **Components** | PascalCase | `Sidebar.vue`, `KanbanBoard.vue`, `TaskDrawer.vue` |
| **Pages** | kebab-case / lowercase | `index.vue`, `tasks.vue`, `projects/index.vue`, `[slug].vue` |
| **Composables** | camelCase (`useNoun`) | `useWorkspaceStore.ts`, `useOmniSearch.ts`, `useTasks.ts` |
| **API Endpoints** | `noun.method.ts` / `[param].method.ts` | `tasks.get.ts`, `[id].put.ts`, `repos.get.ts` |
| **Repositories** | PascalCase + suffix | `SupabaseTaskRepository`, `NitroTaskRepository` |
| **Zod Schemas** | camelCase + `Schema` | `createTaskSchema`, `updateProjectSchema` |
| **Test Suites** | `*.spec.mjs` / `*.spec.ts` | `supabase-task-injection.spec.mjs`, `metrics.spec.mjs` |

---

## 4. Alur Data & Mutasi (Data Flow Architecture)

### 4.1. Alur Optimistic UI (Tasks & Kanban)
```
User Drag / Action
    ↓
Emit event ke handler komponen
    ↓
Composable call (useWorkspaceStore.updateTask(id, payload))
    ↓
1. Mutasi Optimistik Lokal (0ms) -> UI Kanban langsung re-render seketika
2. Server Sync via $fetch('/api/tasks/:id', { method: 'PUT', body: payload })
    ↓
withApiHandler -> Auth Gate Middleware -> SupabaseTaskRepository.update()
    ↓
Response OK -> sync silent selesai
Response Error -> Rollback state lokal & tampilkan toast notifikasi
```

### 4.2. Alur Active Focus & Markdown Checklist
```
User mengklik checkbox Markdown (- [ ] -> - [x])
    ↓
ActiveFocusPanel.toggleChecklist(task, itemIndex)
    ↓
Modifikasi string deskripsi lokal via regex replacing (- [ ] -> - [x])
    ↓
Simpan deskripsi baru via workspaceStore.updateTask(task.id, { description })
    ↓
Deskripsi tersimpan permanen di Supabase PostgreSQL
```

---

## 5. Standar Testing & Automated Quality Gate

Sistem menerapkan **Zero-Dependency Native Node.js Test Runner (`node:test`)** yang berkecepatan tinggi (< 3 detik) tanpa overhead framework eksternal:

### 5.1. Rangkaian Pengujian Master (18 Test Suites / 244 Tests)
1. `tests/unit/id-generator.spec.mjs` — Validasi generator ID `ENG-xxx` sekuensial dan pengurutan nomor.
2. `tests/unit/metrics.spec.mjs` — Verifikasi prinsip Zero Fake Metrics (kalkulasi progres 0/0 tasks = 0%).
3. `tests/unit/github-allowlist.spec.mjs` — Pengujian proteksi penolakan HTTP 403 untuk repositori di luar izin.
4. `tests/unit/markdown-checklist.spec.mjs` — Parser checklist `- [ ]` / `- [x]` dan kalkulasi rasio selesai.
5. `tests/unit/task-sprint-ssot.spec.mjs` — Integritas relasi sprint SSOT `tasks.sprint_id`.
6. `tests/unit/supabase-task-injection.spec.mjs` — Imunitas query PostgREST DSL terhadap query grammar injection.
7. *12 Test Suites lainnya* mencakup validasi skema Zod, auth middleware, store reactivity, dan telemetry ping.

### 5.2. Skrip Pengujian Otomatis
```bash
# 1. Menjalankan seluruh 244 tes unit
npm test

# 2. Menjalankan tes dengan audit Code Coverage
npm run test:coverage

# 3. Static TypeScript typecheck
npm run typecheck

# 4. Packaging rilis produksi
npm run build
```

---

## 6. Konfigurasi Lingkungan (`.env`)

```env
# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=bagja-iskandar

# Supabase PostgreSQL (Production Storage)
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOi...              # Anon / Publishable Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # Wajib untuk mutasi server backend

# Nexura Server Security Gate
NEXURA_ACCESS_KEY=your_secure_random_hex_key_here

# Runtime Environment
NODE_ENV=development
```
