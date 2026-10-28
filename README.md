# Nexura — Personal Engineering Command Center

Personal engineering command center berbasis Nuxt 4 untuk mengelola semua project GitHub, sprint kerja, dan deployment di satu tempat.

Dokumentasi lengkap: [DOCUMENTATION.md](./DOCUMENTATION.md)

## Tech Stack

- **Nuxt 4** (Vue 3 + TypeScript) — Full-stack framework
- **Tailwind CSS** — Precision Dark Obsidian design system (Linear / Raycast Inset Architecture)
- **Nitro** — Server API + Dual-Adapter Repository (Supabase PostgreSQL / Nitro KV) + GitHub API proxy
- **GitHub REST API** — Repos, commits, branches, workflows, PRs/issues, security & packages integration

## Setup

```bash
npm install
cp .env.example .env    # Add your GITHUB_TOKEN
npm run dev
```

Buka `http://localhost:3000`

## Build & Deploy

```bash
npm run build
npm run preview
```

## Features

- **Dashboard Command Center** — Real telemetry stats + Kanban board (IN_QUEUE → RUNNING_SPRINT → DEPLOYED)
- **GitHub Repos Browser** — List all repos, commits, branches from your GitHub account
- **Active Sprints** — Sprint management with velocity tracking
- **Architecture Roadmap** — Visual project milestone timeline
- **System Telemetry** — Service health monitoring
- **Projects Hub** — Project management linked to GitHub repos
- **Tasks Hub** — Multi-dimension task filtering & management
- **Task Cards** — Monospace `#ENG-xxx` IDs, priority pills, tech stack tags

## Design Tokens (Precision Dark Obsidian)

| Token | Hex | Usage |
|-------|-----|-------|
| Void | `#07080A` | Outer shell & unified sidebar base |
| Canvas | `#0B0C10` | Inset workspace background (`.obs-workspace`) |
| Surface | `#111318` | Specular 1px cards & panels (`.obs-card`) |
| Elevated | `#171920` | Elevated surfaces, dropdowns, active tabs |
| Foreground | `#F3F4F6` | Primary text & crisp CTA buttons (Crisp Alabaster) |
| Muted | `#8A8F9E` | Secondary text & metadata (Cool Slate) |
| Accent | `#6366F1` / `#818CF8` | Primary Obsidian Indigo accent, focus & active state |

## Environment Variables

```env
GITHUB_TOKEN=ghp_xxx        # Required — GitHub PAT
GITHUB_USERNAME=bagja-iskandar
SUPABASE_URL=                # Planned
VERCEL_TOKEN=                # Planned
```
