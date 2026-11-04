import { createError } from 'h3'
import type { INoteRepository, PromoteNoteOverrides, PromoteNoteResult } from '../repositories/contracts/note.repository'
import { taskRepository } from '../repositories'

/**
 * Extracts a clean title from note content:
 * - Takes the first non-empty line
 * - Strips Markdown headers, bold, italics, inline code, links
 * - Removes any remaining newline characters
 * - Slices up to 80 characters
 */
export function extractNoteTitle(content: string): string {
  if (!content) return 'Untitled Note'

  const firstNonEmpty =
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) || ''

  const clean = firstNonEmpty
    .replace(/^#+\s*/, '')
    .replace(/[*_~`#\[\]()]/g, '')
    .trim()

  return (clean.slice(0, 80) || 'Untitled Note').trim()
}

/**
 * Shared note promotion logic:
 * - Validates note existence and promotion idempotency
 * - Maps category to Kanban column status and priority:
 *   - 'bug' => status 'in_queue', priority 'high'
 *   - 'maintenance' => status 'in_queue', priority 'medium'
 *   - 'idea' / default => status 'idea', priority 'medium'
 * - Creates task via taskRepository and updates note with promotedTaskId
 */
export async function promoteNoteToTask(
  repo: INoteRepository,
  id: string,
  overrides?: PromoteNoteOverrides
): Promise<PromoteNoteResult> {
  const note = await repo.findById(id)
  if (!note) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Note not found'
    })
  }

  if (note.promotedTaskId) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Note has already been promoted to a task'
    })
  }

  const cleanTitle = extractNoteTitle(note.content)

  // Smart Category Mapping
  let targetStatus: 'idea' | 'in_queue' = 'idea'
  let defaultPriority: 'low' | 'medium' | 'high' = 'medium'

  if (note.category === 'bug') {
    targetStatus = 'in_queue'
    defaultPriority = 'high'
  } else if (note.category === 'maintenance') {
    targetStatus = 'in_queue'
    defaultPriority = 'medium'
  } else {
    targetStatus = 'idea'
    defaultPriority = 'medium'
  }

  const priority = (overrides?.priority as any) || defaultPriority

  const task = await taskRepository.create({
    name: cleanTitle,
    description: note.content,
    status: targetStatus,
    priority,
    dueDate: overrides?.dueDate,
    projectSlug: note.projectSlug,
    techTags: ['scratchpad', note.category]
  })

  const updatedNote = await repo.update(id, {
    promotedTaskId: task.id
  })

  if (!updatedNote) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update note with promoted task ID'
    })
  }

  return {
    note: updatedNote,
    task
  }
}
