# Nexura — Personal Engineering Command Center

Personal engineering command center berbasis Nuxt 4 untuk mengelola semua project GitHub, sprint kerja, dan deployment di satu tempat.

Dokumentasi lengkap: [DOCUMENTATION.md](./DOCUMENTATION.md)

## Tech Stack

- **Nuxt 4** (Vue 3 + TypeScript) — Full-stack framework
- **Tailwind CSS** — Charcoal-Ochre Console design system
- **Nitro** — Server API + GitHub API proxy
- **GitHub REST API** — Repos, commits, branches integration

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

## Design Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Canvas | `#0B0A09` | Page background |
| Surface | `#141210` | Sidebar, cards |
| Bone | `#F5F2EB` | Primary text |
| Muted | `#756F68` | Secondary text |
| Ochre | `#C98A4B` | Accent, focus |

## Environment Variables

```env
GITHUB_TOKEN=ghp_xxx        # Required — GitHub PAT
GITHUB_USERNAME=bagja-iskandar
SUPABASE_URL=                # Planned
VERCEL_TOKEN=                # Planned
```
