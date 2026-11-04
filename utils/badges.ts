/**
 * Pure badge and visual tag utilities for Nexura Management (Zero-state, tree-shakable)
 */
import type { TaskStatus, TaskPriority } from '~/types/task'

/**
 * Normalize any arbitrary status string into canonical TaskStatus enum.
 */
export function normalizeStatus(raw?: string | null): TaskStatus {
  const s = (raw || '').toLowerCase().trim().replace(/[-\s]+/g, '_')
  switch (s) {
    case 'idea':
    case 'ideas':
      return 'idea'
    case 'in_queue':
    case 'queue':
    case 'todo':
    case 'backlog':
    case 'in_review':
      return 'in_queue'
    case 'running_sprint':
    case 'running':
    case 'in_progress':
    case 'in_flight':
    case 'inflight':
    case 'active':
      return 'running_sprint'
    case 'deployed':
    case 'done':
    case 'completed':
    case 'shipped':
      return 'deployed'
    case 'blocked':
    case 'block':
    case 'rejected':
      return 'blocked'
    default:
      return 'in_queue'
  }
}

/**
 * Get readable human label for a TaskStatus.
 */
export function getStatusLabel(status?: TaskStatus | string | null): string {
  if (!status) return 'In Queue'
  const normalized = normalizeStatus(status)
  switch (normalized) {
    case 'idea':
      return 'Idea'
    case 'in_queue':
      return 'In Queue'
    case 'running_sprint':
      return 'Running'
    case 'deployed':
      return 'Deployed'
    case 'blocked':
      return 'Blocked'
  }
}

/**
 * Get Tailwind CSS badge class set for a TaskStatus in Precision Dark Obsidian Bento theme.
 */
export function getStatusBadgeClass(status?: TaskStatus | string | null): string {
  if (!status) return 'bg-white/5 text-[#8A8F9E] border-white/10'
  const normalized = normalizeStatus(status)
  switch (normalized) {
    case 'idea':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'in_queue':
      return 'bg-white/5 text-[#8A8F9E] border-white/10'
    case 'running_sprint':
      return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
    case 'deployed':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'blocked':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  }
}

/**
 * Get Tailwind CSS badge class set for a TaskPriority.
 */
export function getPriorityBadgeClass(priority?: TaskPriority | string | null): string {
  switch (priority) {
    case 'critical':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    case 'high':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'medium':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    case 'low':
      return 'bg-white/5 text-[#8A8F9E] border-white/10'
    default:
      return 'bg-white/5 text-[#8A8F9E] border-white/10'
  }
}

/**
 * Get hexadecimal color value for a TaskPriority.
 */
export function getPriorityColor(priority?: TaskPriority | string | null): string {
  switch (priority) {
    case 'critical':
      return '#F43F5E'
    case 'high':
      return '#F59E0B'
    case 'medium':
      return '#EAB308'
    case 'low':
      return '#8A8F9E'
    default:
      return '#8A8F9E'
  }
}
