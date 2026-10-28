# DESIGN.md — Precision Dark Obsidian Design System

_Last updated: 2026-10-22. Migrasi penuh dari Charcoal-Ochre Console ke **Precision Dark Obsidian** (Linear / Raycast / Cursor Inset Architecture)._

---

## 1. Design Philosophy

Nexura beralih dari estetika **Charcoal-Ochre Engineering Console** (`#0B0A09` + `#C98A4B` + `#F5F2EB`) ke **Precision Dark Obsidian** — sebuah bahasa visual modern berstandar *developer tools* kelas dunia (**Linear, Raycast, Cursor, Vercel Geist**).

### Mengapa Charcoal-Ochre Ditinggalkan?
1. **Thermal Clash (Tabrakan Suhu Warna):** Permukaan hitam dingin (`#09090B`) yang dipadukan dengan teks krem hangat (`#F5F2EB`) dan abu-cokelat (`#756F68`) menciptakan kontras yang keruh (*muddy contrast*) dan melelahkan mata.
2. **Visual Fragmentation (Pulau-Pulau Mengambang):** *Floating capsule dock* tanpa label teks dan *floating header islands* yang terpisah-pisah di atas *telemetry grid* membuat mata kehilangan jangkar struktural (*structural anchor*).
3. **Overuse of Monospace:** Penggunaan `font-mono` di hampir seluruh elemen navigasi dan label membuat UI terasa kaku seperti terminal tua.

### Prinsip Visual Baru (Precision Dark Obsidian)
- **Unified Cool Temperature:** Seluruh kanvas, permukaan, teks, dan aksen berada pada spektrum dingin-netral (*achromatic slate/obsidian* + *cool indigo/violet*), menghasilkan kontras setajam kristal (*crisp contrast*) yang nyaman ditatap berjam-jam.
- **Inset Workspace Architecture:** Shell luar berwarna hitam pekat (`#07080A` — *Obsidian Void*) menampung **Unified Left Sidebar** yang menyatu dengan kanvas dasar, sementara **Main Workspace** dibingkai sebagai panel cekung/inset (`#0B0C10`, `rounded-2xl`, `border-white/[0.07]`) dengan *subtle radial top-glow*.
- **Specular 1px Elevation (Bukan Flat, Bukan Heavy Blur):** Kedalaman permukaan diciptakan melalui *top-edge inner highlight* (`inset 0 1px 0 0 rgba(255,255,255,0.07)`) dan gradasi vertikal super-tipis (`rgba(255,255,255,0.025)` → `0`), menyerupai kepingan kaca obsidian matte yang presisi.
- **Sans-First Readability, Mono-for-Data:** `Inter` (`font-sans`) menjadi fondasi utama keterbacaan UI (navigasi, judul task, deskripsi, tombol), sedangkan `JetBrains Mono` (`font-mono`) dikhususkan secara ketat untuk ID (`NX-142` / `ENG-104`), commit SHA (`a75e740`), metrik angka, persentase, dan jam.

---

## 2. Color Tokens (`tailwind.config.ts` & CSS Variables)

### Primary Obsidian Palette

| Token (`tailwind.config.ts`) | CSS Variable | Hex | RGB | Penggunaan |
|------------------------------|--------------|-----|-----|-----------|
| `void` | `--obs-void` | `#07080A` | `7, 8, 10` | Outer shell background & Left Sidebar base |
| `canvas` | `--obs-canvas` | `#0B0C10` | `11, 12, 16` | Inset Main Workspace background & deep code/diff blocks |
| `surface` | `--obs-surface` | `#111318` | `17, 19, 24` | Card surfaces, panels, tables, modal containers, inputs |
| `surface-elevated` | `--obs-elevated` | `#171920` | `23, 25, 32` | Elevated cards, dropdowns, tooltips, active segmented tabs |
| `surface-hover` | `--obs-hover` | `#1D2029` | `29, 32, 41` | Hover state untuk baris tabel/task dan tombol sekunder |
| `foreground` *(alias: `bone`)* | `--obs-text` | `#F3F4F6` | `243, 244, 246` | Primary text — judul, nilai KPI, nama task, tombol utama (Crisp Alabaster) |
| `muted` | `--obs-muted` | `#8A8F9E` | `138, 143, 158` | Secondary text — label, breadcrumb non-aktif, metadata (Cool Slate) |
| `dim` | `--obs-dim` | `#565B68` | `86, 91, 104` | Tertiary text — section group header, placeholder, disabled |
| `accent` *(alias: `ochre`)* | `--obs-accent` | `#6366F1` | `99, 102, 241` | Primary Accent — Cool Indigo untuk focus ring, active indicators, progress bar |
| `accent-light` | `--obs-accent-light` | `#818CF8` | `129, 140, 248` | Highlighted accent text, active icons, subtle glowing dots |
| `accent-dim` *(alias: `ochre-dim`)* | `--obs-accent-dim` | `#4338CA` | `67, 56, 202` | Subtle accent borders & inactive accent badges |

> **Backward Compatibility Note untuk Agent Coding:**
> Agar komponen lama tidak rusak saat masa transisi, pertahankan alias `bone` (`#F3F4F6`) dan `ochre` (`#6366F1`) / `ochre-dim` (`#4338CA`) di `tailwind.config.ts`, namun migrasikan semua template `.vue` dari hex hardcoded (`#C98A4B`, `#F5F2EB`, `#756F68`, `#141210`, `#111114`) ke token baru di atas.

### Optional Theme Presets (CSS Custom Properties)
Sistem mendukung pergantian aksen instan melalui atribut `data-preset` pada `<body>`:
- **`indigo` (Default — Linear Style):** `--obs-accent: #6366F1`, `--obs-accent-light: #818CF8`, `--obs-accent-glow: rgba(99, 102, 241, 0.16)`
- **`amethyst` (Obsidian.md Style):** `--obs-accent: #8B5CF6`, `--obs-accent-light: #A78BFA`, `--obs-accent-glow: rgba(139, 92, 246, 0.18)`
- **`stealth` (Vercel Geist Monochrome):** `--obs-accent: #E4E4E7`, `--obs-accent-light: #FAFAFA`, `--obs-accent-glow: rgba(255, 255, 255, 0.10)`
- **`emerald` (Supabase Studio Style):** `--obs-accent: #10B981`, `--obs-accent-light: #34D399`, `--obs-accent-glow: rgba(16, 185, 129, 0.16)`

### Semantic Status Colors

| Token | Hex | Tailwind Equivalent | Penggunaan |
|-------|-----|---------------------|-----------|
| `status-critical` | `#F43F5E` | `rose-500` (`text-rose-400`, `bg-rose-500/15`) | Critical priority, blockers, errors, destructive actions |
| `status-high` | `#F59E0B` | `amber-500` (`text-amber-400`, `bg-amber-500/15`) | High priority, PR review needed, warnings |
| `status-medium` | `#6366F1` | `indigo-500` (`text-indigo-300`, `bg-indigo-500/15`) | Medium priority, active in-progress tasks |
| `status-low` | `#8A8F9E` | `text-muted` (`bg-white/[0.05]`) | Low priority, queued/backlog |
| `status-success` | `#10B981` | `emerald-500` (`text-emerald-400`, `bg-emerald-500/15`) | Deployed, CI passed, healthy service |
| `status-running` | `#818CF8` | `indigo-400` (`text-indigo-300`, `bg-indigo-500/15`) | In progress, running sprint |

### Border & Surface Recipes (`assets/css/main.css`)

```css
/* Specular Obsidian Card (.obs-card / .console-card) */
.obs-card,
.console-card,
.card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.025) 0%, rgba(255, 255, 255, 0) 100%), #111318;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.07),
    0 4px 20px -4px rgba(0, 0, 0, 0.5);
  border-radius: 0.75rem;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

/* Inset Workspace Container (.obs-workspace) */
.obs-workspace {
  background:
    radial-gradient(900px 280px at 50% -60px, rgba(99, 102, 241, 0.15), transparent 70%),
    #0B0C10;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.08),
    0 20px 50px rgba(0, 0, 0, 0.7);
}
```

> **PENTING:** Hapus `.bg-telemetry-grid` dan `.bg-telemetry-grid-24` (atau jadikan `display: none` pada `<StructureStaticGrid />`). Kanvas Dark Obsidian mengandalkan kedalaman *matte-specular* dan *ambient radial top-glow*, bukan garis-garis *crosshair* cokelat yang mengganggu keterbacaan.

---

## 3. Typography

### Font Families

| Token | Stack | Aturan Penggunaan |
|-------|-------|-------------------|
| `font-sans` | `'Inter', system-ui, -apple-system, sans-serif` | **Default untuk semua UI**: Navigasi sidebar, breadcrumbs, judul kartu, nama task, deskripsi, tombol, tab filter, modal form. |
| `font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | **Hanya untuk data & identifier**: Task ID (`NX-142` / `ENG-104`), Commit SHA (`a75e740`), nama branch/repo (`nexura-command`), angka KPI (`78%`, `14`), badge waktu (`4d left`, `WIB 12:48`), keyboard shortcut (`⌘K`). |

### Typography Scale

| Element | Utility Classes | Size |
|---------|-----------------|------|
| Workspace / Page Header | `font-sans text-sm font-semibold text-[#F3F4F6]` | 14px |
| Card / Section Title | `font-sans text-sm font-semibold text-[#F3F4F6]` | 14px |
| Sidebar Group Label | `font-sans text-xs font-medium text-[#565B68]` | 12px |
| KPI Metric Value | `font-mono text-2xl font-semibold tracking-tight text-[#F3F4F6]` | 24px |
| KPI Delta Pill | `font-mono text-xs px-1.5 py-0.5 rounded` | 12px |
| Task Row Title | `font-sans text-sm font-medium text-[#F3F4F6]` | 14px |
| Task ID / Commit SHA | `font-mono text-xs text-[#8A8F9E]` | 12px |
| Body / Secondary Text | `font-sans text-xs text-[#8A8F9E] leading-relaxed` | 12px |
| Minimum Font Size | **12px (`text-xs`)** — Hindari `text-[10px]` atau `text-[9px]` demi kenyamanan mata | ≥12px |

---

## 4. Layout Architecture (Linear / Cursor Inset Shell)

### 4.1 App Shell (`app/app.vue`)
Menggantikan layout *floating islands* lama dengan **Inset Workspace Frame**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Outer Void (#07080A, p-2 sm:p-2.5, gap-2)                                │
│ ┌──────────────────┐ ┌─────────────────────────────────────────────────┐ │
│ │ Left Sidebar     │ │ Inset Workspace (.obs-workspace, rounded-2xl)   │ │
│ │ (w-56, #07080A)  │ │ ┌─────────────────────────────────────────────┐ │ │
│ │                  │ │ │ Unified HeaderBar (h-13, border-b)          │ │ │
│ │ [N] Nexura    [+]│ │ ├─────────────────────────────────────────────┤ │ │
│ │ [🔍 Quick... ⌘K] │ │ │ Scrollable Content Body (p-5, space-y-5)    │ │ │
│ │                  │ │ │                                             │ │ │
│ │ Workspace        │ │ │  [KPI 1]   [KPI 2]   [KPI 3]   [KPI 4]      │ │ │
│ │ ● Command Center │ │ │                                             │ │ │
│ │   My Tasks    14 │ │ │  ┌─────────────────────────┐ ┌───────────┐  │ │ │
│ │   Sprints    W42 │ │ │  │ Left Execution (8 cols) │ │ Right     │  │ │ │
│ │   Roadmap        │ │ │  │ - Execution Radar       │ │ Context   │  │ │ │
│ │   GitHub Repos 8 │ │ │  │ - Global Commit Stream  │ │ (4 cols)  │  │ │ │
│ │                  │ │ │  └─────────────────────────┘ └───────────┘  │ │ │
│ │ Active Projects  │ │ └─────────────────────────────────────────────┘ │ │
│ │ ● nexura-cmd 78% │ └─────────────────────────────────────────────────┘ │
│ │ ● supa-sync  92% │                                                     │
│ │ ──────────────── │                                                     │
│ │ ● Online 4.8k/5k │                                                     │
│ └──────────────────┘                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Unified Left Sidebar (`components/Sidebar.vue`)
- **Lebar**: `w-56` (224px) pada desktop (`hidden lg:flex flex-col justify-between`), slide-over drawer pada mobile.
- **Tidak lagi berupa kapsul melayang tanpa teks**: Menampilkan ikon (`w-4 h-4`) **beserta label teks yang jelas (`text-xs font-medium`)** dan counter badge di sebelah kanan.
- **4 Bagian Vertikal**:
  1. **Brand Header**: Logo squircle bergradasi halus + nama `Nexura` + tombol quick-create (`+`).
  2. **Quick Command Trigger (`⌘K`)**: Tombol pencari bergaya Raycast/Linear (`bg-[#111318] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-xs text-[#8A8F9E]`).
  3. **Workspace Navigation**:
     - `Command Center` (`/`)
     - `My Tasks & Queue` (`/tasks`) — menampilkan jumlah task aktif
     - `Weekly Sprints` (`/sprints`) — menampilkan badge minggu aktif (mis. `W42`)
     - `Roadmap` (`/roadmap`)
     - `GitHub Repositories` (`/repos`) — menampilkan jumlah repo
     - `System Telemetry` (`/telemetry`)
  4. **Active Projects Shortcut List**: Menampilkan 3–5 proyek aktif dengan dot status warna dan persentase progres (`font-mono text-xs`) untuk navigasi 1-klik ke `/projects/[slug]`.
  5. **Bottom Telemetry Footer**: Status koneksi (`Supabase + GitHub`), kuota API (`4,892/5k`), dan progress bar tipis (`h-1 bg-emerald-400/80`).

### 4.3 Unified Header Bar (`components/HeaderBar.vue`)
- **Posisi**: Di bagian atas di dalam `.obs-workspace` (`h-13 px-5 border-b border-white/[0.06] bg-[#0B0C10]/60 backdrop-blur-md flex items-center justify-between`).
- **Kiri**: Breadcrumb bersih (`Workspace / Command Center`) + kapsul status sprint aktif (`Sprint W42 · 4d left`).
- **Kanan**:
  - Indikator jam & blocker (`WIB 12:48 | 0 Blockers` dalam pill `bg-white/[0.03] border border-white/[0.06] font-mono text-xs`).
  - **Primary Crisp CTA Button**: Tombol putih-alabaster kontras tinggi (`bg-[#F3F4F6] hover:bg-white text-[#07080A] text-xs font-medium px-3 py-1.5 rounded-lg`) untuk aksi utama halaman (mis. `+ New Deliverable` atau `+ New Project`).

---

## 5. Component Design Specifications

### 5.1 Specular KPI Row (4 Micro-Cards di Atas Dashboard)
Menggunakan grid 4 kolom (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5`):
1. **In-Flight Tasks**: Jumlah task aktif + badge delta/high priority.
2. **Sprint Velocity**: Persentase penyelesaian sprint minggu berjalan (`78%` · `11 of 14 deployed`).
3. **CI/CD Workflows**: Status kesehatan GitHub Actions across repos.
4. **Open PRs & Issues**: Jumlah PR/Issue terbuka dari seluruh proyek terkelola.

### 5.2 Asymmetric Bento Workspace (`12 Columns`: `8 Left` + `4 Right`)
- **Left Column (`xl:col-span-8 space-y-4`):**
  1. **Execution Radar (`PriorityTasksRadar.vue`)**:
     - Header dengan **Segmented Control Tabs** (`bg-[#0B0C10] p-0.5 rounded-lg border border-white/[0.06]`): `All Focus`, `High / Critical`, `In Flight`, `Blocked`.
     - Daftar baris task bergaya Linear (`divide-y divide-white/[0.05]`): setiap baris memiliki *priority glowing dot* (`w-2 h-2 rounded-full`), monospace ID (`NX-142` / `ENG-104`), judul task (`text-sm font-medium text-[#F3F4F6]`), pill nama repo/proyek, badge status, dan tanggal tenggat.
  2. **Global Commit Stream (`GlobalCommitsTable.vue`)**:
     - Daftar commit lintas repositori dengan dot status CI, badge SHA pendek (`font-mono text-xs bg-white/[0.05] border border-white/[0.07]`), pesan commit, nama repo, dan waktu relatif.
     - Klik baris commit akan membuka **Inline Diff Preview** (`bg-[#07080A] border-t border-white/[0.05] font-mono text-xs`) dengan highlight baris `+` (emerald) dan `-` (rose).
- **Right Column (`xl:col-span-4 space-y-4`):**
  1. **Quick Task Inspector Pod / Active Task Summary**: Menampilkan rincian cepat dari task yang dipilih (atau membuka `TaskDrawer.vue` yang dipoles dengan surface `#111318` dan border `#6366F1`).
  2. **Weekly Sprint Focus (`WeeklyFocusSnapshot.vue`)**: Menampilkan objektif mingguan, progress bar halus (`h-1.5` dengan warna `--obs-accent`), serta metrik *Completed vs Remaining*.
  3. **Managed Projects Hub (`CompactProjectsHub.vue`)**: Daftar ringkas proyek aktif dengan indikator deployment sehat dan persentase penyelesaian.

### 5.3 Kanban Board & Task Cards (`KanbanBoard.vue` & `TaskCard.vue`)
- **Kanban Column**: Surface `bg-[#0B0C10]/90 border border-white/[0.06] rounded-xl p-3`. Header menggunakan `font-sans text-xs font-semibold text-[#F3F4F6]` dengan badge jumlah item `font-mono text-xs bg-white/[0.06] text-[#8A8F9E]`.
- **Task Card**:
  - Menggunakan `.obs-card` (`bg-[#111318] border border-white/[0.07] rounded-xl p-3.5`).
  - Hover: `hover:border-indigo-500/40 hover:bg-[#171920]` dengan transisi halus `duration-150`.
  - Tech tags: `font-mono text-xs bg-white/[0.04] text-[#8A8F9E] border border-white/[0.06] rounded px-1.5 py-0.5` (tidak lagi berwarna cokelat/ochre).

---

## 6. Interaction, Accessibility & Animation Rules

### Focus & Selection
- Selection highlight: `selection:bg-indigo-500/30 selection:text-white`
- Keyboard focus ring: `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6366F1]`
- Primary CTA button: `bg-[#F3F4F6] hover:bg-white text-[#07080A] font-medium`
- Secondary button: `bg-[#111318] hover:bg-[#171920] text-[#F3F4F6] border border-white/[0.08]`

### Minimum Text & Contrast Guardrails
- **Dilarang menggunakan ukuran teks di bawah `12px` (`text-xs`)** untuk informasi penting. Ganti semua `text-[9px]`, `text-[10px]`, dan `text-[11px]` di komponen lama menjadi `text-xs` agar tidak membuat mata lelah.
- Kontras teks utama (`#F3F4F6` di atas `#0B0C10` / `#111318`) mencapai rasio **>15:1 (WCAG AAA)**.
- Kontras teks sekunder (`#8A8F9E` di atas `#111318`) mencapai rasio **>5.5:1 (WCAG AA)**.

---

## 7. Tabel Migrasi Token (Panduan Cepat untuk Coding Agent)

Saat melakukan refactoring komponen `.vue`, gunakan tabel pemetaan berikut untuk mengganti class lama ke **Precision Dark Obsidian**:

| Elemen / Class Lama (Charcoal-Ochre) | Ganti Menjadi (Precision Dark Obsidian) |
|--------------------------------------|-----------------------------------------|
| `bg-[#09090B]` / `bg-[#0B0A09]` (Outer Shell) | `bg-[#07080A]` (`bg-void`) |
| `bg-[#09090B]` (Main Workspace area) | `.obs-workspace` (`bg-[#0B0C10]` / `bg-canvas`) |
| `bg-[#111114]` / `bg-[#141210]` (Card / Panel) | `.obs-card` atau `bg-[#111318]` (`bg-surface`) |
| `bg-[#18181C]` / `bg-[#1C1A17]` (Elevated / Hover) | `bg-[#171920]` (`bg-surface-elevated`) / `hover:bg-[#1D2029]` |
| `text-[#F5F2EB]` / `text-bone` | `text-[#F3F4F6]` (`text-foreground`) |
| `text-[#756F68]` / `text-muted` | `text-[#8A8F9E]` (`text-muted`) |
| `text-[#C98A4B]` / `text-ochre` | `text-[#818CF8]` (`text-accent-light`) atau `text-indigo-400` |
| `bg-[#C98A4B]` (Primary Action Button) | `bg-[#F3F4F6] text-[#07080A] hover:bg-white` (Linear Crisp CTA) atau `bg-[#6366F1] text-white` |
| `bg-[#C98A4B]/10` / `bg-[#C98A4B]/15` | `bg-indigo-500/15 text-indigo-300 border-indigo-500/30` |
| `border-[#C98A4B]` / `focus:ring-[#C98A4B]` | `border-indigo-500/50` / `focus:ring-[#6366F1]` |
| `shadow-[0_0_12px_rgba(201,138,75,0.15)]` | `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)]` |
| `text-[9px]` / `text-[10px]` / `text-[11px]` | `text-xs` (12px minimum readability floor) |
| `<StructureStaticGrid />` / `.bg-telemetry-grid` | Hapus / nonaktifkan (ganti dengan `.obs-workspace` radial top-glow) |

> **Referensi Visual Interaktif**: Lihat prototipe HTML yang telah disetujui di artefak `nexura_dark_obsidian_mockup.html` sebagai acuan langsung tata letak, tipografi, dan pencahayaan.
