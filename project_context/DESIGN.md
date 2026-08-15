# DESIGN.md — Kondisi dan Arah UI/UX

_Last updated: 2026-08-15. Diisi berdasarkan implementasi Polymorphism Dark Glass dan eksplorasi Stitch (Project ID: 9689375760914620032)._

---

## 1. Design System — Polymorphism Dark Glass

Project menggunakan visual language **Dark Polymorphism / Dark Glassmorphism** pada canvas `#0B0F19` dengan token CSS terpusat di `assets/css/main.css`:

```css
--glass-bg: #0B0F19;                         /* Deep Canvas Navy */
--glass-surface: rgba(17, 24, 39, 0.75);      /* Frosted Card Surface */
--glass-border: rgba(255, 255, 255, 0.08);    /* Subtle Glass Border */
--glass-border-focus: rgba(99, 102, 241, 0.6);/* Indigo Focus Ring */
--glass-input: rgba(15, 23, 42, 0.85);        /* Tactile Glass Well */
--accent-indigo: #6366F1;                     /* Primary Accent */
--accent-cyan: #06B6D4;                       /* Secondary Accent / Progress */
--accent-violet: #A855F7;                     /* Tertiary Accent */
--color-danger: #F43F5E;                      /* Rose Error / Danger */
--color-success: #10B981;                     /* Emerald Success */
--font-family: 'Inter', system-ui, sans-serif;
```

### Karakteristik Visual
- **Canvas Ambien**: Background gelap dengan radial glow mesh (indigo di top-left, violet di right, cyan di bottom-right).
- **Glass Surfaces**: Kartu semi-transparan dengan `backdrop-filter: blur(16px)` dan border highlight 1px pemantul cahaya.
- **Left Sidebar Navigation (230px)**: Terkunci di sisi kiri pada desktop (`position: fixed; width: 230px; height: 100vh;`) dan responsif drawer di mobile.
- **Centered Layout**: Konten utama dibatasi `max-width: 1450px; margin: 0 auto;` dengan whitespace seimbang untuk kenyamanan visual di monitor ultrawide (3440px+).

---

## 2. Struktur Halaman & Komponen

### Halaman Aktif
1. **Dashboard (`/`)**:
   - Welcome Banner dengan highlight cyan (`#38BDF8`).
   - 4 Kartu KPI (`StatCard.vue`) dengan typography 2.4rem bold dan circular glowing icon.
   - Action Pills Toolbar (`⊕ New Task`, `📁 Manage Projects`, `📋 Tasks Hub`, sync button, live search).
   - Middle Analytics Grid: Task Overview SVG curve chart (`Weekly|Monthly` toggle) dan Project Status SVG dynamic donut gauge.
   - Recent Activity Table (`ActivityTable.vue`) dengan task icon tiles (`❖`, `</>`, `🚀`) dan semantik status pills.
2. **Projects Hub (`/projects`)**:
   - Status Filter Tabs (`All`, `Active`, `Planned`, `On Hold`, `Completed` dengan count badges).
   - Live search input dan sorting dropdown.
   - Scalable 3-column project cards dengan task count, due date, dan derived progress bar.
   - Tombol pemicu `⊕ New Project` (`AddProjectModal.vue`).
3. **Project Detail (`/projects/[slug]`)**:
   - Breadcrumb navigasi: `Projects / [Project Title]`.
   - Hero metadata card dengan status & priority pills.
   - Derived Progress metric card (68%) dan 4-stat breakdown chips.
   - Associated project tasks table dengan inline status toggle.
4. **Tasks Hub (`/tasks`)**:
   - Multi-filter toolbar (Live search, Project selector, Priority selector, Status tabs, Sort).
   - Task Management Table lengkap dengan rotasi status instan dan konfirmasi hapus.
   - Tombol pemicu `⊕ New Task` (`AddTaskModal.vue`).

### Modals & Dialogs
- **`AddProjectModal.vue`**: Form pembuatan proyek baru dengan fokus trap dan penjelasan derived progress.
- **`AddTaskModal.vue`**: Form pembuatan task baru dengan project selector combobox, priority pills, dan due date.
- **`ConfirmDialog.vue`**: Alertdialog konfirmasi hapus destruktif dengan warning icon rose glowing dan focus trap.

> **Catatan Cakupan**: Halaman **Contact** telah dihapus sepenuhnya karena website ini difokuskan sebagai personal project & task management dashboard. Fitur multi-user SaaS (Team, Roles, Settings, Calendar) dikecualikan.
