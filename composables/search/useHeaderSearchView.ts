import type { OmniSearchScope } from './omniSearchTypes'

export const scopeTriggerPills: { label: string; scope: OmniSearchScope }[] = [
  { label: 'Tasks', scope: 'task' },
  { label: 'Projects', scope: 'project' },
  { label: 'Sprints', scope: 'sprint' },
  { label: 'Repos', scope: 'repo' },
  { label: 'Notes', scope: 'note' },
  { label: 'Actions', scope: 'action' }
]

export const categoryDisplayNames: Record<string, string> = {
  'Actions': 'ACTIONS & COMMANDS',
  'Tasks & Deliverables': 'DELIVERABLES & TASKS',
  'Projects': 'PROJECTS',
  'Weekly Sprints': 'WEEKLY SPRINTS',
  'Repositories': 'REPOSITORIES',
  'Project Notes': 'PROJECT NOTES',
  'Quick Navigation': 'QUICK NAVIGATION'
}

export const categoryOrder = [
  'Actions',
  'Tasks & Deliverables',
  'Projects',
  'Weekly Sprints',
  'Repositories',
  'Project Notes',
  'Quick Navigation'
]

export function resolveLeadingIcon(prefixMode: string, activeScope: string): string {
  if (prefixMode === 'action') return 'Terminal'
  if (prefixMode === 'tag') return 'Hash'
  if (prefixMode === 'project') return 'Folder'
  if (prefixMode === 'blocker') return 'AlertTriangle'
  if (activeScope === 'action') return 'Terminal'
  if (activeScope === 'task') return 'CheckSquare'
  if (activeScope === 'project') return 'Folder'
  if (activeScope === 'sprint') return 'Calendar'
  if (activeScope === 'repo') return 'GitBranch'
  if (activeScope === 'note') return 'Sparkles'
  return 'Search'
}

export function resolveLeadingIconColor(prefixMode: string, activeScope: string): string {
  if (prefixMode === 'action' || activeScope === 'action') return 'text-emerald-400'
  if (prefixMode === 'tag') return 'text-indigo-400'
  if (prefixMode === 'project' || activeScope === 'project') return 'text-blue-400'
  if (prefixMode === 'blocker') return 'text-rose-400'
  if (activeScope === 'task') return 'text-indigo-400'
  if (activeScope === 'sprint') return 'text-purple-400'
  if (activeScope === 'repo') return 'text-emerald-400'
  if (activeScope === 'note') return 'text-yellow-400'
  return 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'
}

export function resolvePrefixChip(prefixMode: string, activeScope: string): { label: string; class: string } | null {
  if (prefixMode === 'action') {
    return { label: '> Actions', class: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' }
  }
  if (prefixMode === 'tag') {
    return { label: '# Tech Tags', class: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' }
  }
  if (prefixMode === 'project') {
    return { label: '@ Projects', class: 'bg-blue-500/10 text-blue-300 border border-blue-500/20' }
  }
  if (prefixMode === 'blocker') {
    return { label: '! Blockers', class: 'bg-rose-500/10 text-rose-300 border border-rose-500/20' }
  }
  if (activeScope === 'task') {
    return { label: 'Scope: Tasks', class: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' }
  }
  if (activeScope === 'project') {
    return { label: 'Scope: Projects', class: 'bg-blue-500/10 text-blue-300 border border-blue-500/20' }
  }
  if (activeScope === 'sprint') {
    return { label: 'Scope: Sprints', class: 'bg-purple-500/10 text-purple-300 border border-purple-500/20' }
  }
  if (activeScope === 'repo') {
    return { label: 'Scope: Repos', class: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' }
  }
  if (activeScope === 'action') {
    return { label: 'Scope: Actions', class: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' }
  }
  if (activeScope === 'note') {
    return { label: 'Scope: Notes', class: 'bg-amber-500/10 text-amber-300 border border-amber-500/20' }
  }
  return null
}
