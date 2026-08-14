# DESIGN.md — Kondisi dan Arah UI/UX

_Last updated: 2026-08-14. Diisi berdasarkan investigasi langsung ke source code dan CSS._

---

## 1. Kondisi UI/UX Saat Ini

### Design System
Project menggunakan CSS custom properties (variables) sebagai dasar design token, didefinisikan di `assets/css/main.css`:

```css
--background: #FCFAEE   /* Krem/off-white — background halaman */
--surface:    #FFFFFF   /* Putih — kartu, panel */
--surface-muted: #F2F4F7
--panel:      #F8F9FB
--border:     rgba(56,75,112,0.12)
--text:        #1F2937  /* Slate dark */
--muted:       #556179
--primary:     #384B70  /* Navy/slate blue */
--secondary:   #507687
--danger:      #B8001F
--success:     #1F6D3B
--shadow:      0 20px 60px rgba(56,75,112,0.08)
--radius:      14px
```

Tema yang dihasilkan: **Light mode** dengan palet biru-navy sebagai primary. Nuansa hangat dari `--background: #FCFAEE` memberikan kesan premium.

> **Catatan**: `assets/css/base.css` mendefinisikan dark theme variables yang berbeda (`--bg:#0b0f19`) namun file ini **tidak di-import** — ini adalah orphan dari iterasi sebelumnya dan tidak mempengaruhi UI saat ini.

### Typography
Menggunakan system font stack (tidak ada Google Fonts):
```
system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Helvetica Neue, Arial, Noto Sans
```

### Layout
- Navbar sticky di atas (dark: `rgba(9,14,27,0.95)`) dengan backdrop blur
- Main content max-width `1160px` (dari `main.css`)
- Dashboard: wrapper card dengan padding 30px, border-radius 17.5px
- Stats grid: `repeat(auto-fit, minmax(220px, 1fr))`
- Dashboard body: 1 kolom di mobile, 2 kolom di ≥900px (QuickPanel | ActivityTable)

### Komponen Visual yang Ada
| Komponen | Kondisi |
|---|---|
| **StatCard** | Ada icon (emoji) + delta badge (up/down) + value + label |
| **ActivityTable** | Grid layout 4 kolom, status badge berwarna, row hover effect |
| **QuickPanel** | 3 action cards dalam grid 3 kolom |
| **ConfirmDialog** | Modal overlay dengan panel, keyboard dismiss (Escape), focus management, props reaktif via `computed` ✅ |
| **TaskForm** | Input + button inline |
| **Navbar** | Brand + desktop nav + mobile menu toggle + avatar placeholder |

### Animasi & Transisi
- Hover: `transform: translateY(-2px)` + `box-shadow` pada StatCard dan action cards
- Button: `transition: background 0.2s ease, transform 0.2s ease`
- Semua transisi minimal dan functional — belum ada micro-animation yang elaborate

---

## 2. Masalah UI/UX yang Teridentifikasi

### CSS Architecture (Teknikal)
- **Duplikasi rules**: `.button`, `.cd-overlay`, `.cd-panel` didefinisikan di **dua tempat**: `main.css` dan `dashboard.css`. Ini menyebabkan potensi specificity conflict dan maintenance burden (Target Phase 2).
- **Fragile selectors di `main.css`**: Telah **dibersihkan** di Phase 1e — layout dashboard kini 100% menggunakan class-based selectors di `dashboard.css`.
- **`base.css` orphan**: Telah **dihapus** di Phase 1f.

### Navbar
- Komentar `/* navbar.vue*/` ditempatkan di baris 1 file Vue, sebelum `<template>` — ini bukan HTML/Vue yang valid (meskipun mungkin tidak crash, tidak lazim).
- Mobile menu toggle menggunakan teks literal `"Menu"` / `"Tutup"` — tidak mengikuti konvensi hamburger icon standar.
- Di mobile (≤820px): avatar disembunyikan, desktop nav disembunyikan, toggle button muncul. Logika benar tapi implementasi JS dan CSS terpisah (toggle state di Vue, hide/show di CSS media query).

### Halaman Projects
- Menampilkan `Slug: <code>project.slug</code>` — developer-facing data tampil ke end user.
- Tombol "Lihat ringkasan" di setiap project card mengarah ke `/` (bukan ke halaman detail project).
- Tidak ada handling state kosong (jika projects array kosong).
- *(Note: Error banner state sudah ditambahkan di Phase 1d via `.feedback.error`)*

### Halaman Contact
- Form tidak mereset `feedback` message — pesan sukses persists sampai page reload atau form disubmit ulang.
- Nota "Form ini bersifat demo..." tampil di dalam card yang sama — posisi dan visibilitas perlu dipertimbangkan.

### Dashboard
- `TaskForm` di header (`.task-form-top`) dan button "+ Tambah Task" di sebelahnya keduanya ada — ada dua entry point untuk aksi yang sama (form dengan input dan tombol terpisah yang memanggil `createTask()` tanpa nama).
- Tidak ada empty state yang informatif saat `filtered` (hasil search) kosong tapi ada tasks — pesan "Tidak ada tugas" muncul hanya saat `rows` kosong total.
- *(Note: Error banner state sudah ditambahkan di Phase 1d via `.feedback.error`)*

### Accessibility
- `ConfirmDialog`: `role="dialog"` ada, tapi tidak ada focus trap — Tab key bisa keluar dari dialog (Target Phase 3).
- Status badge di ActivityTable hanya dibedakan dengan warna — tidak ada visually-hidden text untuk screen reader (Target Phase 3).
- Search input menggunakan `aria-label` (acceptable) tapi tidak ada associated `<label>` element.

---

## 3. Arah UI/UX untuk Rework

### Prioritas Tinggi (Correctness)
1. [x] Bersihkan CSS architecture: ganti/hapus nth-of-type selector dengan class-based (Selesai di Phase 1e ✅)
2. [x] Reaktivitas props ConfirmDialog (Selesai di Phase 1b ✅)
3. [x] Error handling & visual error feedback banner di Dashboard & Projects (Selesai di Phase 1d ✅)
4. [ ] Perbaiki focus trap di ConfirmDialog (Phase 3a)
5. [ ] Tambahkan visually-hidden text pada status badge (Phase 3c)
6. [ ] Perbaiki projects.vue — jangan tampilkan raw slug (Phase 3d)

### Prioritas Sedang (UX Quality)
1. [ ] Standarisasi bahasa UI ke English (Diputuskan PENDING-01, Phase 3)
2. [ ] Hamburger icon di mobile navbar
3. [ ] Auto-dismiss feedback message di contact form (Phase 3e)
4. [ ] Empty state yang lebih informatif (search no results vs benar-benar kosong)

### Prioritas Rendah (Polish)
1. [ ] Google Fonts (misal: Inter) untuk tipografi yang lebih konsisten lintas OS
2. [ ] Loading indicator antar navigasi (`<NuxtLoadingIndicator>`)
3. [ ] Micro-animation yang lebih elaborat pada StatCard atau table rows
