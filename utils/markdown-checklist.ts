/**
 * Pure Markdown checklist utilities for Nexura Management (Zero-state, tree-shakable)
 */

export interface ChecklistItem {
  text: string
  completed: boolean
  index: number
}

const CHECKLIST_REGEX = /^(\s*[-*]\s*\[)([ xX])(\]\s*.*)$/
const CHECKLIST_PREFIX_REGEX = /^\s*[-*]\s*\[[ xX]\]/

/**
 * Parse all Markdown checklist items (- [ ] / - [x] / * [ ] / * [x]) from content.
 * Returns each item's text, completed boolean, and original line index.
 */
export function parseChecklist(markdown?: string | null): ChecklistItem[] {
  if (!markdown) return []
  const lines = markdown.split('\n')
  const results: ChecklistItem[] = []

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('* [ ] ')) {
      results.push({
        index: idx,
        completed: false,
        text: trimmed.slice(6).trim()
      })
    } else if (
      trimmed.startsWith('- [x] ') ||
      trimmed.startsWith('- [X] ') ||
      trimmed.startsWith('* [x] ') ||
      trimmed.startsWith('* [X] ')
    ) {
      results.push({
        index: idx,
        completed: true,
        text: trimmed.slice(6).trim()
      })
    }
  })

  return results
}

/**
 * Toggle the completion status of a checklist step at given index.
 * Supports either lineIndex (direct line in markdown) or itemIndex (0-based item in checklist).
 */
export function toggleChecklistStep(markdown: string, stepIndex: number): string {
  if (!markdown) return ''
  const lines = markdown.split('\n')

  // Check if stepIndex directly points to a checklist line
  if (stepIndex >= 0 && stepIndex < lines.length && CHECKLIST_REGEX.test(lines[stepIndex])) {
    const targetLine = lines[stepIndex]
    lines[stepIndex] = targetLine.replace(CHECKLIST_REGEX, (_, prefix, check, suffix) => {
      const toggled = check.trim() ? ' ' : 'x'
      return `${prefix}${toggled}${suffix}`
    })
    return lines.join('\n')
  }

  // Fallback: treat stepIndex as the nth checklist item in parsed list
  const items = parseChecklist(markdown)
  if (stepIndex >= 0 && stepIndex < items.length) {
    const targetItem = items[stepIndex]
    const targetLine = lines[targetItem.index]
    if (targetLine && CHECKLIST_REGEX.test(targetLine)) {
      lines[targetItem.index] = targetLine.replace(CHECKLIST_REGEX, (_, prefix, check, suffix) => {
        const toggled = check.trim() ? ' ' : 'x'
        return `${prefix}${toggled}${suffix}`
      })
      return lines.join('\n')
    }
  }

  return markdown
}

/**
 * Append a new checklist step to the markdown content.
 */
export function appendChecklistStep(markdown: string, stepText: string): string {
  const trimmed = (stepText || '').trim()
  if (!trimmed) return markdown

  const stepLine = CHECKLIST_PREFIX_REGEX.test(trimmed) ? trimmed : `- [ ] ${trimmed}`
  const newline = markdown && !markdown.endsWith('\n') ? '\n' : ''
  return `${markdown}${newline}${stepLine}`
}

/**
 * Remove a checklist step from the markdown content.
 * Supports either lineIndex (direct line in markdown) or itemIndex (0-based item in checklist).
 */
export function removeChecklistStep(markdown: string, stepIndex: number): string {
  if (!markdown) return ''
  const lines = markdown.split('\n')

  // Check if stepIndex directly points to a checklist line
  if (stepIndex >= 0 && stepIndex < lines.length && CHECKLIST_PREFIX_REGEX.test(lines[stepIndex])) {
    lines.splice(stepIndex, 1)
    return lines.join('\n')
  }

  // Fallback: treat stepIndex as the nth checklist item in parsed list
  const items = parseChecklist(markdown)
  if (stepIndex >= 0 && stepIndex < items.length) {
    const targetItem = items[stepIndex]
    lines.splice(targetItem.index, 1)
    return lines.join('\n')
  }

  return markdown
}
