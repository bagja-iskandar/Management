# ENGINEERING.md — Standar Engineering & Conventions

_Last updated: 2026-09-17. Updated untuk Charcoal-Ochre Console + Tailwind CSS + GitHub integration._

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

## 2. Styling: Tailwind CSS (Phase 6+)

### Migrasi dari CSS Custom Properties
- **Sebelum**: 3 file CSS (~1400 LOC) dengan CSS custom properties + scoped `<style src>`
- **Sesudah**: Tailwind CSS utility classes langsung di template `.vue` + minimal `main.css` (`@tailwind` directives + `@layer base/components`)

### File CSS Dihapus
- `assets/css/dashboard.css` → styling inline di template
- `assets/css/navbar.css` → styling inline di template

### Konvensi Tailwind
- Gunakan **custom tokens** dari `tailwind.config.ts` (canvas, surface, bone, muted, ochre)
- Gunakan `font-mono` untuk **semua telemetry identifiers**: task IDs, metrics, clocks, branch names, stats, delta tags
- Gunakan `font-sans` untuk body text, labels, descriptions
- Border hairline: `border-white/[0.06]` — bukan shadow berat
- Hover effect: `hover:border-[#C98A4B]` glow — bukan transform/translateY
- Focus ring: `focus:ring-1 focus:ring-[#C98A4B]` — ochre, bukan indigo

### No Inline Hex — Gunakan Token
```html
<!-- ✅ Benar -->
<div class="bg-canvas text-bone">
<span class="text-muted font-mono">

<!-- ❌ Hindari (kecuali belum ada token) -->
<div class="bg-[#0B0A09] text-[#F5F2EB]">
```

Exception: hex langsung diperbolehkan untuk one-off values yang tidak ada di token (e.g., specific opacity variants).

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
