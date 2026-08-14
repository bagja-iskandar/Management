# ENGINEERING.md — Kondisi dan Standar Engineering

_Last updated: 2026-08-14. Diisi berdasarkan investigasi langsung ke source code._

---

## 1. Kondisi Engineering Saat Ini

### TypeScript
- Project menggunakan TypeScript via Nuxt — semua file `.ts` dan `.vue` (dengan `<script setup lang="ts">`)
- `tsconfig.json` mendelegasikan sepenuhnya ke `.nuxt/tsconfig.*.json` — konfigurasi TS dikontrol oleh Nuxt
- Tidak ada konfigurasi strict mode eksplisit — bergantung pada default Nuxt yang umumnya cukup strict

**Status Masalah TypeScript:**

| ID | File | Masalah | Status |
|---|---|---|---|
| TS-01 | `components/dashboard.vue` | Mendefinisikan `type Status`, `type Stat`, `type Row` secara lokal padahal sudah ada di `types/` | ✅ **Resolved (Phase 1c)** |
| TS-02 | `composables/useStats.ts` | `$fetch('/api/stats')` tanpa generic type — return type `unknown` | ⏳ Target Phase 2b |
| TS-03 | `composables/useProjects.ts` | `$fetch('/api/projects')` tanpa generic type — return type `unknown` | ⏳ Target Phase 2b |
| TS-04 | `components/ConfirmDialog.vue` | Props di-destructure ke `const` biasa — nilai tidak reaktif | ✅ **Resolved (Phase 1b)** via `computed` |
| TS-05 | `components/dashboard.vue` | `statusClass()` function didefinisikan di baris 135–141 tapi tidak pernah dipanggil di template komponen ini | ⏳ Target Phase 2d |

### Composables
- Pattern: plain function returns object dengan async methods — bukan Vue composable idiomatis (`ref`, `computed`, dll.)
- Tidak ada caching — setiap call ke `getStats()`, `getProjects()` dll. membuat `$fetch` baru
- Error handling diserahkan ke caller — composable tidak menangani error sendiri
- `useTasks.ts` sudah cukup lengkap: 5 methods (getTasks, getActivities, createTask, updateTask, deleteTask)

### Server / API Layer
**Yang sudah baik:**
- `withApiHandler` wrapper konsisten di semua endpoint — centralized error catching
- `validation.ts` sudah ada: `requireString`, `validateStatus`, `validateDate` — digunakan di POST dan PUT
- `throwApiError` menghasilkan error terstruktur dengan `statusCode`, `code`, `details`
- `storage-adapter.ts` mendefinisikan `StorageAdapter` interface — desain testable (injectable)
- `migrateNumericIds` di `store.ts` menunjukkan awareness backward compatibility

**Masalah yang ditemukan:**
| ID | File | Masalah | Status |
|---|---|---|---|
| SRV-01 | `server/api/task/[id].put.ts` | Baris 11: query manual `tasks.find()` lalu baris 20: `updateItem()` juga melakukan find — dua kali baca array | ⏳ Target Phase 2e |
| SRV-02 | `server/utils/validation.ts` | `readJsonBody` call `throwApiError` yang return `never` tapi TypeScript tidak inferring return type `never` dengan benar | ⏳ Backlog |
| SRV-03 | `server/utils/store.ts` | `createStorageAdapter()` di-call setiap operasi dari `storage()` function — membuat instance baru setiap call | ⏳ Backlog |

### Client / Frontend Layer
**Yang sudah baik:**
- `useAsyncData` digunakan untuk data fetching dengan key yang unik (deduplikasi)
- `refreshNuxtData()` digunakan untuk invalidasi cache setelah mutasi
- Confirm dialog pattern (tidak menggunakan `window.confirm()`)
- `isBusy` ref sebagai loading state, dengan `finally` block untuk reset
- Error feedback alert banner di Dashboard & Projects jika asyncData gagal ✅

**Status Masalah Client:**
| ID | File | Masalah | Status |
|---|---|---|---|
| CLT-01 | `app/pages/index.vue` | Manual `import Dashboard from '../../components/dashboard.vue'` — seharusnya Nuxt auto-import | ⏳ Target Phase 2c |
| CLT-02 | `app/app.vue` | Manual `import Navbar from '../components/navbar.vue'` — seharusnya Nuxt auto-import | ⏳ Target Phase 2c |
| CLT-03 | `components/dashboard.vue` | Tidak ada `error` handling dari `useAsyncData` | ✅ **Resolved (Phase 1d)** |
| CLT-04 | `app/pages/projects.vue` | Tidak ada `error` handling dari `useAsyncData` | ✅ **Resolved (Phase 1d)** |
| CLT-05 | `components/dashboard.vue` | Double entry point untuk create task: `<TaskForm>` di header + button "+ Tambah Task" | ⏳ Target Phase 3 |

### CSS / Styling
**Status Masalah CSS:**
| ID | File | Masalah | Status |
|---|---|---|---|
| CSS-01 | `main.css` | `section > div:nth-of-type(2/3/4)` selectors — fragile | ✅ **Resolved (Phase 1e)** — dihapus |
| CSS-02 | `main.css` vs `dashboard.css` | `.button`, `.cd-overlay`, `.cd-panel` didefinisikan di dua file — duplikasi | ⏳ Target Phase 2 |
| CSS-03 | `assets/css/base.css` | File tidak di-import — orphan dark theme variables | ✅ **Resolved (Phase 1f)** — dihapus |
| CSS-04 | `nuxt.config.ts` baris 6 | CSS path: `'../assets/css/main.css'` — relative path non-idiomatis | ✅ **Resolved (Phase 2a)** — `'~~/assets/css/main.css'` |

---

## 2. Testing

**Status: Tidak ada testing sama sekali.**

- Tidak ada file test (`*.test.ts`, `*.spec.ts`)
- Tidak ada test runner di `package.json` (tidak ada `vitest`, `jest`, `playwright`, dll.)
- Tidak ada `test` script di `package.json`

Untuk portfolio-grade project, minimal perlu:
- Unit test untuk `server/utils/` (store.ts, validation.ts)
- API integration test untuk endpoints utama

---

## 3. Code Conventions yang Teridentifikasi

### Naming
- Komponen: PascalCase untuk file yang merupakan "sub-komponen" (`ActivityTable.vue`, `StatCard.vue`), lowercase untuk layout-level (`dashboard.vue`, `navbar.vue`)
- Composables: `useNoun` pattern
- API files: `noun.method.ts` (e.g., `tasks.get.ts`) atau `[id].method.ts` untuk dynamic routes
- Server utils: lowercase camelCase function exports

### Component Pattern
- Semua komponen menggunakan `<script setup lang="ts">`
- Props didefinisikan dengan `defineProps<Type>()` generic syntax
- Emits didefinisikan dengan `defineEmits<...>()` generic syntax
- Tidak ada Options API, tidak ada class components

### Import Pattern (Saat Ini — Inkonsisten)
- Beberapa file menggunakan manual relative import meski Nuxt menyediakan auto-import
- Composables di beberapa tempat masih perlu di-import manual (seharusnya auto-import Nuxt)

---

## 4. Standar Engineering yang Perlu Diterapkan (Target)

### Must (Correctness)
- [x] Tidak ada tipe lokal yang menduplikasi `types/` (Phase 1c ✅)
- [x] Semua props reaktif (tidak di-destructure ke const biasa) (Phase 1b ✅)
- [x] Error state dari `useAsyncData` ditangani di UI (Phase 1d ✅)
- [x] CSS classes bukan nth-of-type selectors untuk layout (Phase 1e ✅)
- [x] Tidak ada file orphan (base.css, navbar.js, tasks.json) (Phase 1f ✅)
- [x] Ghost files di `pages/` root diselesaikan (Phase 1a ✅)

### Should (Quality)
- [ ] Composables menggunakan return types eksplisit (Phase 2b)
- [ ] Manual imports yang seharusnya auto-import dihapus (Phase 2c)
- [ ] Tidak ada duplikasi CSS rules (Phase 2)
- [x] CSS path di nuxt.config menggunakan alias `~~` (Phase 2a ✅)
- [ ] `statusClass()` function tidak duplikat antar komponen (Phase 2d)
- [ ] Optimasi query ganda di `[id].put.ts` (Phase 2e)

### Could (Portfolio Polish)
- [ ] Unit tests untuk server utilities
- [ ] JSDoc pada public composable functions
- [ ] `<NuxtLoadingIndicator>` untuk navigasi
- [ ] Focus trap pada ConfirmDialog
- [ ] Visually-hidden text pada status badges
