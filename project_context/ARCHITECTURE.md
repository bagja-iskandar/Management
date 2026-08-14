# ARCHITECTURE.md — Struktur dan Arsitektur Aktual

_Last updated: 2026-08-14. Diisi berdasarkan investigasi langsung ke source code._

---

## 1. Gambaran Arsitektur

Project menggunakan **Nuxt 4** dengan arsitektur full-stack monolith:
- **Frontend**: Vue 3 SPA di-serve oleh Nitro
- **Backend**: Nitro server dengan API routes (H3 event handlers)
- **Storage**: Nitro unstorage — file-based KV store di `.data/kv/`
- **Tidak ada** database eksternal, tidak ada service terpisah

```
Browser
  └─ HTTP Request
       ├─ GET / (halaman) → Nitro → SSR/Hydration → Vue 3 SPA
       └─ /api/* → Nitro API Routes → Storage (.data/kv/)
```

---

## 2. Struktur Direktori Aktual

```
Management/
├── app/                          # Nuxt 4 app directory (aktif)
│   ├── app.vue                   # Root layout: <Navbar> + <NuxtPage>
│   └── pages/
│       ├── index.vue             # Route /  → render <Dashboard>
│       ├── projects.vue          # Route /projects
│       └── contact.vue          # Route /contact
│
├── components/                   # Di root, BUKAN di app/ (lihat catatan)
│   ├── dashboard.vue             # Komponen utama dashboard (orchestrator)
│   ├── navbar.vue                # Header navigasi
│   ├── ActivityTable.vue         # Tabel daftar tasks
│   ├── StatCard.vue              # KPI card individual
│   ├── QuickPanel.vue            # Panel quick actions
│   ├── ConfirmDialog.vue         # Modal konfirmasi hapus
│   └── TaskForm.vue              # Form input task baru
│
├── composables/                  # Di root, BUKAN di app/
│   ├── useTasks.ts               # API calls: getTasks, getActivities, createTask, updateTask, deleteTask
│   ├── useStats.ts               # API calls: getStats
│   └── useProjects.ts            # API calls: getProjects
│
├── types/                        # Di root
│   ├── index.ts                  # Barrel export
│   ├── task.ts                   # interface Task
│   ├── project.ts               # interface Project
│   └── stat.ts                  # interface Stat
│
├── server/
│   ├── api/
│   │   ├── activities.get.ts     # GET /api/activities
│   │   ├── tasks.get.ts          # GET /api/tasks
│   │   ├── tasks.post.ts         # POST /api/tasks
│   │   ├── stats.get.ts          # GET /api/stats
│   │   ├── projects.get.ts       # GET /api/projects
│   │   └── task/
│   │       ├── [id].put.ts       # PUT /api/task/:id
│   │       └── [id].delete.ts    # DELETE /api/task/:id
│   ├── plugins/
│   │   └── seed.ts               # Nitro plugin: isi data awal jika kosong
│   ├── middleware/
│   │   └── visit.ts              # Hitung page views (HTML requests only)
│   └── utils/
│       ├── store.ts              # CRUD helpers: getArray, setArray, createItem, updateItem, removeItem, genId
│       ├── storage-adapter.ts    # Interface StorageAdapter + implementasi Nitro useStorage
│       ├── handler.ts            # withApiHandler: try/catch wrapper untuk semua endpoint
│       ├── validation.ts         # readJsonBody, requireString, validateStatus, validateDate
│       └── errors.ts             # throwApiError, formatError
│
├── assets/
│   └── css/
│       ├── main.css              # Global styles, CSS variables, layout, typography, .feedback.error
│       ├── dashboard.css         # Dashboard & table component styles (scoped via <style src>)
│       └── navbar.css            # Navbar styles (scoped via <style src>)
│
├── public/
│   ├── favicon.ico
│   └── robots.txt               # User-Agent: *, Disallow: (allow all)
│
├── .data/                        # Runtime storage (gitignored)
│   └── kv/
│       ├── tasks                 # JSON array Task[] — format aktif (UUID ids)
│       ├── projects              # JSON array Project[]
│       └── visits                # JSON number
│
├── nuxt.config.ts                # Nuxt 4 config
├── tsconfig.json                 # Delegasi ke .nuxt/tsconfig.*.json
├── package.json                  # Dependencies
└── skill/                        # Directory berisi skill definitions (tidak terkait runtime)
```

---

## 3. Konvensi Nuxt 4 yang Digunakan

Nuxt 4 memperkenalkan `app/` directory sebagai direktori utama. Project ini **sebagian** mengadopsi konvensi ini:

| Direktori | Lokasi Aktual | Konvensi Nuxt 4 |
|---|---|---|
| `pages/` | `app/pages/` | ✅ Sesuai |
| `app.vue` | `app/app.vue` | ✅ Sesuai |
| `components/` | Root (`components/`) | ⚠️ Seharusnya `app/components/` |
| `composables/` | Root (`composables/`) | ⚠️ Seharusnya `app/composables/` |
| `types/` | Root (`types/`) | ⚠️ Seharusnya `app/types/` atau tetap di root |

Nuxt 4 dengan `app/` directory akan otomatis membaca `components/` dan `composables/` dari kedua lokasi, sehingga fungsionalitas **tidak terganggu** saat ini. Namun ada inkonsistensi struktural.

---

## 4. Alur Data Aktual

### Flow: Halaman Dashboard Load
```
browser → GET /
  → Nitro SSR → app/pages/index.vue → <Dashboard>
  → useAsyncData('stats') → $fetch('/api/stats')
      → server/api/stats.get.ts
      → getArray('tasks') + getArray('projects') + getValue('visits')
      → .data/kv/tasks, .data/kv/projects, .data/kv/visits
  → useAsyncData('activities') → $fetch('/api/activities')
      → server/api/activities.get.ts
      → getArray('tasks') → sort by date
```

### Flow: Tambah Task
```
user input → <TaskForm> emits 'create' → dashboard.createTask()
  → useTasks.createTask({ name }) → $fetch POST /api/tasks
  → tasks.post.ts → readJsonBody → requireString → createItem()
  → genId() + timestamp → arr.push → setArray('tasks', arr)
  → return Task
  → refreshNuxtData('activities') + refreshNuxtData('stats')
```

### Flow: Hapus Task
```
user click Hapus → ActivityTable emits 'delete' → dashboard.deleteTask()
  → confirmTarget = row, confirmOpen = true
  → <ConfirmDialog> muncul → user confirm → dashboard.onConfirmDelete()
  → useTasks.deleteTask(id) → $fetch DELETE /api/task/:id
  → [id].delete.ts → removeItem('tasks', id)
  → return { ok: true }
  → refreshNuxtData()
```

### Flow: Ubah Status Task
```
user click "Ubah Status" → ActivityTable emits 'toggle'
  → dashboard.toggleStatus(row) → status cycling: todo → proses → selesai → todo
  → useTasks.updateTask(id, { status: next })
  → $fetch PUT /api/task/:id → [id].put.ts → validateStatus → updateItem()
```

---

## 5. Storage Layer Detail

**Nitro Storage** (`useStorage('data:')`) adalah KV store abstraction yang dibacking oleh file di `.data/kv/`.

```
useStorage('data:')
  key: 'tasks'    → .data/kv/tasks    (JSON serialized array)
  key: 'projects' → .data/kv/projects (JSON serialized array)
  key: 'visits'   → .data/kv/visits   (JSON serialized number)
```

`storage-adapter.ts` membungkus `useStorage` di balik `StorageAdapter` interface — memungkinkan replacement dengan implementasi lain (test mock, Redis, dll.) tanpa mengubah `store.ts`.

---

## 6. API Contract

| Method | Path | Request Body | Response |
|---|---|---|---|
| GET | `/api/activities` | — | `Task[]` (sorted by date desc) |
| GET | `/api/tasks` | — | `Task[]` (sorted by date desc) |
| POST | `/api/tasks` | `{ name: string, status?, date? }` | `Task` |
| GET | `/api/stats` | — | `Stat[]` (4 KPI cards) |
| GET | `/api/projects` | — | `Project[]` |
| PUT | `/api/task/:id` | `Partial<{ name, status, date }>` | `Task` |
| DELETE | `/api/task/:id` | — | `{ ok: true }` |

Error responses mengikuti H3 `createError` format: `{ statusCode, statusMessage, data: { code, details? } }`

---

## 7. Catatan Arsitektural untuk Rework

- **Nuxt auto-import**: Composables dan komponen seharusnya tidak perlu manual import jika berada di lokasi yang tepat. Saat ini `app/app.vue` masih manual import `navbar.vue` dan `app/pages/index.vue` manual import `dashboard.vue` (Target Phase 2).
- **Pinia**: Terdaftar sebagai dependency tapi belum diimplementasikan. State management saat ini sepenuhnya lokal di `dashboard.vue` (Keputusan: biarkan terdaftar, evaluasi nanti).
- **Ghost pages/**: Tiga file kosong di `pages/` root telah **dihapus** di Phase 1a setelah verifikasi routing.
- **CSS architecture**: Fragile selectors `section > div:nth-of-type(...)` di `main.css` telah **dihapus** di Phase 1e. Duplikasi rule antara `main.css` dan `dashboard.css` (`.button`, `.cd-overlay`, `.cd-panel`) menjadi target Phase 2.
