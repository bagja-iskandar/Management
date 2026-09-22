# DESIGN.md — Charcoal-Ochre Engineering Console Design System

_Last updated: 2026-09-17. Migrasi dari Polymorphism Dark Glass ke Charcoal-Ochre Console._

---

## 1. Design Philosophy

Nexura beralih dari estetika **Polymorphism Dark Glass** (Indigo/Violet/Cyan glassmorphism) ke **Charcoal-Ochre Engineering Console** — sebuah visual language yang terinspirasi oleh terminal, engineering dashboards, dan industrial control panels.

**Prinsip Visual:**
- **Density over Decoration** — setiap piksel menyajikan informasi, bukan ornamen.
- **Monospace for Telemetry** — semua identifier, metrics, dan data numerik menggunakan `font-mono` (JetBrains Mono).
- **Warm Accent on Cold Surface** — ochre gold (`#C98A4B`) sebagai satu-satunya warna aksen hangat di atas permukaan charcoal dingin.
- **Minimal Elevation** — bedakan layer dengan border hairline (`border-white/[0.06]`) bukan shadow berat.

---

## 2. Color Tokens (Tailwind CSS)

### Primary Palette

| Token | Hex | RGB | Penggunaan |
|-------|-----|-----|-----------|
| `canvas` | `#0B0A09` | `11, 10, 9` | Deepest background — body, page canvas |
| `surface` | `#141210` | `20, 18, 16` | Sidebar, card surfaces, panels, inputs |
| `surface-elevated` | `#1C1A17` | `28, 26, 23` | Hover states, elevated cards, active items |
| `bone` | `#F5F2EB` | `245, 242, 235` | Primary text — headings, values, titles (bone-ivory) |
| `muted` | `#756F68` | `117, 111, 104` | Secondary text — labels, timestamps, descriptions |
| `ochre` | `#C98A4B` | `201, 138, 75` | Accent — focus rings, active nav, highlights, CTAs |
| `ochre-dim` | `#8B6535` | `139, 101, 53` | Muted accent — inactive borders, subtle accents |

### Semantic Colors

| Token | Hex | Penggunaan |
|-------|-----|-----------|
| `status-critical` | `#EF4444` (red-500) | Critical priority, errors, destructive actions |
| `status-high` | `#F97316` (orange-500) | High priority |
| `status-medium` | `#EAB308` (yellow-500) | Medium priority |
| `status-low` | `#756F68` (muted) | Low priority |
| `status-success` | `#22C55E` (green-500) | Deployed, completed, online |
| `status-running` | `#3B82F6` (blue-500) | In progress, running sprint |

### Alpha Variants (untuk backgrounds)

```
ochre/10  → bg-[#C98A4B]/10    // active nav item background
ochre/15  → bg-[#C98A4B]/15    // branch pill, tag backgrounds
white/[0.06] → border-white/[0.06]  // hairline borders
white/5   → bg-white/5         // subtle surface differentiation
```

---

## 3. Typography

### Font Families

| Token | Stack | Penggunaan |
|-------|-------|-----------|
| `font-sans` | `'Inter', system-ui, -apple-system, sans-serif` | Body text, labels, descriptions |
| `font-mono` | `'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace` | **Semua telemetry identifiers**: task IDs, metrics, clocks, branch names, stats, deltas, KPI values |

### Scale

| Element | Class | Size |
|---------|-------|------|
| Page title | `font-mono text-lg font-semibold text-bone` | 18px |
| Section header | `font-mono text-xs tracking-wider uppercase text-muted` | 12px |
| KPI value | `font-mono text-3xl font-bold text-bone` | 30px |
| KPI delta | `font-mono text-xs text-ochre` | 12px |
| Task ID | `font-mono text-xs text-muted` | 12px |
| Task title | `font-sans text-sm font-medium text-bone` | 14px |
| Body text | `font-sans text-sm text-muted` | 14px |
| Navigation label | `font-sans text-sm font-medium` | 14px |
| Clock display | `font-mono text-xs text-muted` | 12px |

---

## 4. Layout Specifications

### Sidebar
- **Width**: Compact, `w-56` (224px) desktop / collapsible on mobile
- **Surface**: `bg-[#141210]`
- **Border**: `border-r border-white/[0.06]` — thin hairline right border
- **Position**: Fixed left, full height
- **Brand**: Top — monogram + "NEXURA" in `font-mono text-xs tracking-[0.2em] uppercase`
- **Navigation**: 5 items — icon (20px) + label, vertical stack
- **Active Item**: `bg-[#C98A4B]/10 text-[#C98A4B] border-l-2 border-[#C98A4B]`
- **Inactive Item**: `text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5`
- **Footer**: System status tile — `● Online • KV Storage`

### Header Bar
- **Height**: `h-14` (56px)
- **Surface**: `bg-[#141210]/80 backdrop-blur-xl`
- **Border**: `border-b border-white/[0.06]`
- **Contents** (left to right):
  1. Live clock — `font-mono text-xs text-muted` — UTC + WIB dual display
  2. Active branch pill — `font-mono text-xs bg-[#C98A4B]/15 text-[#C98A4B] rounded-full px-3 py-1`
  3. Sprint velocity KPI — `font-mono text-sm text-bone`
  4. Search input — `bg-[#141210] border border-white/[0.08] rounded-lg focus:ring-1 focus:ring-[#C98A4B]`

### Main Workspace
- **Background**: `bg-[#0B0A09]`
- **Padding**: `p-6`
- **Max width**: `max-w-7xl` (1280px) centered
- **Overflow**: `overflow-y-auto`

---

## 5. Component Design Specs

### Telemetry Stat Card
```
┌─────────────────────────────────┐
│  ACTIVE TASKS        ↑12%      │  ← font-mono text-xs text-muted (label) + text-ochre (delta)
│  47                            │  ← font-mono text-3xl font-bold text-bone
│  from current sprint           │  ← font-sans text-xs text-muted
└─────────────────────────────────┘
Surface: bg-[#141210] border border-white/[0.06] rounded-xl p-5
```

### Task Card (Kanban)
```
┌─────────────────────────────────┐
│  #ENG-104                      │  ← font-mono text-xs text-muted
│  Implement OAuth flow          │  ← text-bone font-medium text-sm
│  ●  HIGH        vue  nuxt     │  ← priority pill + tech tags
└─────────────────────────────────┘
Surface: bg-[#141210] border border-white/[0.06] rounded-lg p-4
Hover:   hover:border-[#C98A4B] hover:shadow-[0_0_12px_rgba(201,138,75,0.15)]
```

### Priority Pills
| Priority | Dot | Background | Text |
|----------|-----|-----------|------|
| Critical | Pulsing red dot (animation) | `bg-red-500/15` | `text-red-400` |
| High | Static orange dot | `bg-orange-500/15` | `text-orange-400` |
| Medium | Static yellow dot | `bg-yellow-500/15` | `text-yellow-400` |
| Low | Static gray dot | `bg-white/5` | `text-muted` |

### Tech Stack Tags
```
font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] rounded px-1.5 py-0.5
```

### Kanban Column
```
Column Header: font-mono text-xs tracking-wider uppercase text-muted + count badge
Column Body:   bg-[#0B0A09] rounded-xl min-h-[400px] p-3 space-y-3
Count Badge:   font-mono text-[10px] bg-white/5 text-muted rounded-full px-2 py-0.5
```

---

## 6. Interaction & Animation

### Focus States
- All interactive elements: `focus:ring-1 focus:ring-[#C98A4B] focus:outline-none`
- Search input: `focus:ring-1 focus:ring-[#C98A4B]` — 1px ochre focus ring

### Hover Effects
- Task Card: `transition-all duration-200 hover:border-[#C98A4B] hover:shadow-[0_0_12px_rgba(201,138,75,0.15)]`
- Nav Item: `transition-colors duration-150 hover:text-bone hover:bg-white/5`
- Button: `transition-all duration-150 hover:bg-surface-elevated`

### Animations
- **Pulse Dot** (critical priority): `@keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }` — 2s infinite
- **Clock tick**: Real-time update setiap detik via `setInterval`

### Transitions
- Page navigation: instant (0ms) via `useLazyAsyncData` + `getCachedData` payload caching

---

## 7. Halaman & Komponen

### Navigasi (5 halaman utama)
1. **Dashboard** (`/`) — Command Center: telemetry row + Kanban board
2. **Active Sprints** (`/sprints`) — Sprint management & velocity tracking
3. **Architecture Roadmap** (`/roadmap`) — Visual timeline & milestones
4. **Code Repos** (`/repos`) — GitHub repos browser, commits, branches
5. **System Telemetry** (`/telemetry`) — Service health & API rate limits

### Halaman Pendukung (existing, redesigned)
- **Projects Hub** (`/projects`) — Project cards dengan GitHub repo linking
- **Project Detail** (`/projects/[slug]`) — Tabs: Overview | Tasks | GitHub | Deployments
- **Tasks Hub** (`/tasks`) — Full task matrix & multi-dimension filters

### Modals & Dialogs
- **AddTaskModal** — Extended fields (projectSlug, priority, techTags, dueDate)
- **AddProjectModal** — Extended fields (githubRepo, deployUrl, techStack)
- **ConfirmDialog** — Destructive action confirmation (preserved dari Phase 3)

---

## 8. Migrasi dari Design Lama

| Aspek | Polymorphism Dark Glass (Lama) | Charcoal-Ochre Console (Baru) |
|-------|-------------------------------|-------------------------------|
| Canvas BG | `#0B0F19` (navy) | `#0B0A09` (charcoal) |
| Surface | `rgba(17, 24, 39, 0.75)` glass | `#141210` solid |
| Primary Accent | `#6366F1` (indigo) | `#C98A4B` (ochre) |
| Secondary | `#06B6D4` (cyan) + `#A855F7` (violet) | Tidak ada — single accent |
| Text Primary | `#DFE2F1` (blue-tinted white) | `#F5F2EB` (bone-ivory) |
| Text Muted | `#908FA0` (lavender) | `#756F68` (warm gray) |
| Borders | `rgba(255,255,255,0.08)` + blur | `border-white/[0.06]` hairline, no blur |
| Effects | Glass blur, radial glow mesh, neon SVG | Minimal — border glow on hover only |
| Styling | CSS Custom Properties (~700 LOC) | Tailwind CSS utility classes |
| Font | Inter only | Inter (prose) + JetBrains Mono (telemetry) |

> **Catatan**: Seluruh aksesibilitas dari Phase 3 (focus trap, ARIA, sr-only) dipertahankan di design baru.
