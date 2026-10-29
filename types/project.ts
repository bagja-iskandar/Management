export type ProjectStatus = 'active' | 'maintenance' | 'planned' | 'on-hold' | 'completed' | 'archived'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical'

export type ReleasePhase = 'backlog' | 'mvp' | 'v1.1' | 'v2.0' | 'released'

export function isCanonicalReleasePhase(val: unknown): val is ReleasePhase {
  return typeof val === 'string' && ['backlog', 'mvp', 'v1.1', 'v2.0', 'released'].includes(val)
}

export const CANONICAL_RELEASE_PHASES = [
  { id: 'backlog', label: 'Backlog & Discovery', badgeClass: 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]', description: 'Architectural concepts & exploratory ideas' },
  { id: 'mvp', label: 'MVP / v1.0 Foundation', badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25', description: 'Core functional baseline ready for validation' },
  { id: 'v1.1', label: 'v1.1 Polish & Iteration', badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25', description: 'UX polish, bug fixes & operational stability' },
  { id: 'v2.0', label: 'v2.0 Next Horizon', badgeClass: 'bg-violet-500/10 text-violet-300 border-violet-500/25', description: 'Major architectural expansion & scale' },
  { id: 'released', label: 'Released & Live Ops', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', description: 'Production deployed & continuous maintenance' }
] as const

export interface Project {
  id: string
  slug: string
  title: string
  description?: string
  status: ProjectStatus
  priority: ProjectPriority
  githubRepo?: string | null
  deployUrl?: string | null
  techStack: string[]
  startDate?: string | null
  dueDate?: string | null
  releasePhase?: string
  createdAt: string
  updatedAt: string
}
