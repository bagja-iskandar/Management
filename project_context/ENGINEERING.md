# ENGINEERING.md — Standar Engineering & Conventions

_Last updated: 2026-10-22. Updated untuk Precision Dark Obsidian (Linear / Raycast Inset Architecture) + Tailwind CSS + Dual-Adapter Repository._

---

## 1. Kondisi Engineering

### TypeScript
- Project menggunakan TypeScript via Nuxt — semua file `.ts` dan `.vue` (dengan `<script setup lang="ts">`)
- `tsconfig.json` mendelegasikan sepenuhnya ke `.nuxt/tsconfig.*.json`
- Semua masalah TypeScript dari Phase 1–2 telah **resolved**

### Composables
- Pattern: plain function returns object dengan async methods
- Caching: `useLazyAsyncData` + `getCachedData` payload caching di consumer (bukan di composable)
- Invalidasi: `refreshNuxtData(key)` setelah mutasi
- Existing: `useTasks.ts`, `useStats.ts`, `useProjects.ts`
- Target baru: `useGitHub.ts` (Phase 9)

### Server / API Layer
- **Wrapper**: `withApiHandler` untuk semua endpoint — centralized error catching
- **Validation**: `readJsonBody`, `requireString`, `validateStatus`, `validateDate`
- **Storage**: `StorageAdapter` interface — pluggable (KV sekarang, Supabase nanti)
- **Error format**: `throwApiError` → H3 `createError` → `{ statusCode, code, details }`

### Client / Frontend Layer
- `useLazyAsyncData` dengan `getCachedData` untuk navigasi 0ms
- `refreshNuxtData()` untuk invalidasi setelah mutasi
- `isBusy` ref sebagai loading state dengan `finally` block
- Error feedback alert banner di semua halaman

### Semua Masalah Historis — Resolved

| ID | Masalah | Status |
|---|---|---|
| TS-01 | Tipe lokal duplikat di dashboard.vue | ✅ Phase 1c |
| TS-02 | `$fetch` tanpa generic type (useStats) | ✅ Phase 2b |
| TS-03 | `$fetch` tanpa generic type (useProjects) | ✅ Phase 2b |
| TS-04 | Props non-reaktif di ConfirmDialog | ✅ Phase 1b |
| TS-05 | Dead code `statusClass()` | ✅ Phase 2d |
| SVR-01 | Double query di `[id].put.ts` | ✅ Phase 2e |
| CLT-01 | Manual import Dashboard | ✅ Phase 2c |
| CLT-02 | Manual import Navbar | ✅ Phase 2c |
| CLT-03 | Missing error handling (dashboard) | ✅ Phase 1d |
| CLT-04 | Missing error handling (projects) | ✅ Phase 1d |
| CSS-01–05 | Fragile selectors, orphans, duplications | ✅ Phase 1e/1f/2f |

---

## 2. Styling: Tailwind CSS — Precision Dark Obsidian (Phase 13+)

### Filosofi & Standar Visual
- **Precision Dark Obsidian**: Seluruh komponen mengikuti standar visual **Linear / Raycast / Cursor** seperti yang didefinisikan secara lengkap di [DESIGN.md](./DESIGN.md) dan direferensikan di [mockup-dark-obsidian.html](./mockup-dark-obsidian.html).
- **Unified Cool Temperature**: Kanvas luar `void` (`#07080A`), workspace inset `canvas` (`#0B0C10`), kartu `surface` (`#111318`), teks utama `foreground` (`#F3F4F6`), teks sekunder `muted` (`#8A8F9E`), dan aksen utama `accent` (`#6366F1` / `#818CF8`).

### Konvensi Tailwind & CSS Layers
- Gunakan **semantic tokens** dari `tailwind.config.ts` (`void`, `canvas`, `surface`, `surface-elevated`, `foreground`, `muted`, `dim`, `accent`, `accent-light`).
- Gunakan class `.obs-workspace` untuk container utama halaman (di `app/app.vue`) dan `.obs-card` (atau `.console-card`) untuk setiap kartu agar mendapatkan **Specular 1px Top-Edge Highlight** (`inset 0 1px 0 0 rgba(255,255,255,0.07)`).
- **Aturan Tipografi Ergonomis**:
  - Gunakan `font-sans` (`Inter`) sebagai default untuk **semua elemen UI**: navigasi, judul kartu, nama task, deskripsi, tombol, dan tab.
  - Gunakan `font-mono` (`JetBrains Mono`) **hanya untuk data & identifier**: Task ID (`NX-142` / `ENG-104`), Commit SHA (`a75e740`), angka metrik/KPI (`78%`, `14`), nama branch/repo, dan jam.
  - **Batas Minimum Ukuran Font**: `text-xs` (`12px`). Jangan gunakan `text-[9px]`, `text-[10px]`, atau `text-[11px]` karena menurunkan keterbacaan.
- **Hover & Focus State**:
  - Card hover: `hover:border-white/[0.13]` atau `hover:border-indigo-500/40`.
  - Focus ring: `focus-visible:ring-1 focus-visible:ring-[#6366F1] focus-visible:outline-none`.
  - Primary CTA Button: `bg-[#F3F4F6] hover:bg-white text-[#07080A] font-medium` (Crisp Alabaster).

### No Legacy Warm Hex — Gunakan Token Dark Obsidian
```html
<!-- ✅ Benar (Precision Dark Obsidian) -->
<div class="obs-card p-4 text-foreground">
  <h3 class="font-sans text-sm font-semibold text-foreground">Execution Radar</h3>
  <span class="font-mono text-xs text-muted">ENG-104</span>
</div>

<!-- ❌ Dilarang (Legacy Charcoal-Ochre hardcoded hex) -->
<div class="bg-[#141210] text-[#F5F2EB] border-[#C98A4B]">
  <span class="text-[#756F68] text-[10px]">ENG-104</span>
</div>
```

---

## 3. Naming Conventions

### Files
| Tipe | Convention | Contoh |
|------|-----------|--------|
| Components | PascalCase | `Sidebar.vue`, `KanbanBoard.vue`, `TaskCard.vue` |
| Components (layout) | lowercase | `dashboard.vue` (historical, accepted) |
| Composables | `useNoun` camelCase | `useTasks.ts`, `useGitHub.ts` |
| API routes | `noun.method.ts` | `tasks.get.ts`, `projects.post.ts` |
| API dynamic routes | `[param].method.ts` | `[id].put.ts`, `[slug].delete.ts` |
| Server utils | lowercase camelCase | `github.ts`, `store.ts` |
| Types | PascalCase interface | `Task`, `Project`, `Sprint`, `GitHubRepoSummary` |

### Components
- Semua menggunakan `<script setup lang="ts">`
- Props: `defineProps<Type>()` generic syntax
- Emits: `defineEmits<{ event: [payload] }>()` generic syntax
- Tidak ada Options API, tidak ada class components

### Task ID Format
- Sequential monospace: `ENG-001`, `ENG-002`, `ENG-003`, ...
- Stored di `task-seq` KV key sebagai counter
- Auto-generated di `tasks.post.ts`

---

## 4. API Convention

### Request/Response
- Request body: JSON — validated via `readJsonBody` + `requireString`
- Response: JSON — wrapped by `withApiHandler`
- Error: H3 `createError` → `{ statusCode, statusMessage, data: { code, details? } }`

### External API (GitHub)
- Auth: `Authorization: Bearer ${runtimeConfig.githubToken}`
- Caching: Nitro `cachedFunction` with `maxAge: 300` (5 menit)
- Error handling: 401 → "Invalid GitHub token", 403 → "Rate limited", graceful fallback

### Rate Limiting Strategy
- GitHub: 5,000 req/jam (authenticated)
- Cache semua GET responses selama 5 menit
- Dashboard polling: client-side refresh on demand (bukan auto-poll)

---

## 5. Data Flow Patterns

### CRUD Pattern
```
User Action → Component Event → Composable Method → $fetch to Nitro API
  → withApiHandler → validate → StorageAdapter → KV / Supabase
  → Return response → refreshNuxtData() → UI re-renders
```

### External API Pattern
```
Component → useLazyAsyncData → $fetch('/api/github/repos')
  → Nitro handler → cachedFunction(fetchFromGitHub, { maxAge: 300 })
  → Return cached or fresh data → Component renders
```

### Error Pattern
```
API failure → H3 createError → withApiHandler catches → returns error response
  → Client useLazyAsyncData.error → error banner rendered → retry button
```

---

## 6. Testing (Target)

**Status saat ini**: Tidak ada testing.

### Minimum Target
- [ ] Unit test `server/utils/store.ts` (CRUD helpers)
- [ ] Unit test `server/utils/validation.ts` (input validators)
- [ ] API integration test untuk endpoints utama
- [ ] E2E smoke test: create task, move via Kanban, verify

### Tooling (ketika diimplementasikan)
- `vitest` untuk unit & integration tests
- `@nuxt/test-utils` untuk Nuxt-specific testing

---

## 7. Environment Variables

```env
# GitHub (Required for Phase 9)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx          # PAT with repo + read:user scope
GITHUB_USERNAME=bagja-iskandar         # Default, also in runtimeConfig

# Supabase (Phase 10 — fill when ready)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...

# Vercel (Phase 11 — fill when ready)
VERCEL_TOKEN=xxxxxxxxxxxx
VERCEL_TEAM_ID=                        # Optional, for team projects
```

Semua env vars diakses via `runtimeConfig` (server-only, tidak terekspos ke client) kecuali `public.githubUsername`.
