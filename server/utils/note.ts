/**
 * Extracts a clean title from note content:
 * - Takes the first non-empty line
 * - Strips Markdown headers, bold, italics, inline code, links
 * - Removes any remaining newline characters
 * - Slices up to 80 characters
 */
export function extractNoteTitle(content: string): string {
  if (!content) return 'Untitled Note'

  const firstNonEmpty = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) || ''

  const clean = firstNonEmpty
    .replace(/^#+\s*/, '')
    .replace(/[*_~`#\[\]()]/g, '')
    .trim()

  return (clean.slice(0, 80) || 'Untitled Note').trim()
}
