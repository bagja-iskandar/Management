/**
 * Pure formatting utilities for Nexura Management (Zero-state, tree-shakable)
 */

export interface TaskIdInput {
  taskId?: string | null
  id?: string | null
}

/**
 * Format a task identifier into standard #ID format (e.g. #ENG-001 or #a1b2c3d).
 */
export function formatTaskId(
  task?: TaskIdInput | null,
  options: { prefix?: boolean } = { prefix: true }
): string {
  if (!task) return options.prefix ? '#TASK' : 'TASK'
  const rawId = task.taskId?.trim() || (task.id ? task.id.slice(0, 7) : '')
  if (!rawId) return options.prefix ? '#TASK' : 'TASK'

  const cleanId = rawId.startsWith('#') ? rawId.slice(1) : rawId
  return options.prefix ? `#${cleanId}` : cleanId
}

/**
 * Format an ISO date string into short (e.g., 'Jan 15') or medium (e.g., 'Jan 15, 2026') date.
 */
export function formatDate(
  isoDate?: string | null,
  style: 'short' | 'medium' = 'short'
): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return String(isoDate)

  if (style === 'medium') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format an ISO date string into human-friendly relative time (e.g., 'just now', '5m ago', 'yesterday').
 */
export function formatRelativeTime(isoDate?: string | null): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return String(isoDate)

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return 'just now'

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Generate a local ISO date string (YYYY-MM-DD), with optional day offset.
 */
export function getLocalDateString(offsetDays: number = 0): string {
  const d = new Date()
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays)
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if a due date is strictly in the past (before today's local midnight).
 */
export function isOverdue(dueDate?: string | null): boolean {
  if (!dueDate) return false
  const target = new Date(dueDate)
  if (isNaN(target.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return target.getTime() < today.getTime()
}
