import type {
  OmniSearchItem,
  OmniSearchScope,
  HighlightSegment,
  PrefixMode,
  ParsedQuery
} from './omniSearchTypes'

export const SEARCH_HISTORY_STORAGE_KEY = 'nexura:omni_search_history'
export const MAX_SEARCH_HISTORY = 3

/**
 * Splits text into highlighted and plain segments based on [start, end] ranges.
 */
export function splitHighlights(text: string, ranges?: [number, number][]): HighlightSegment[] {
  if (!text) return []
  if (!ranges || ranges.length === 0) {
    return [{ text, isHighlight: false }]
  }

  // Normalize, sort, and merge overlapping ranges
  const sorted = [...ranges]
    .filter(([s, e]) => s >= 0 && e > s && s < text.length)
    .sort((a, b) => a[0] - b[0])

  const merged: [number, number][] = []
  for (const range of sorted) {
    if (merged.length === 0) {
      merged.push([range[0], Math.min(range[1], text.length)])
    } else {
      const prev = merged[merged.length - 1]
      if (range[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], Math.min(range[1], text.length))
      } else {
        merged.push([range[0], Math.min(range[1], text.length)])
      }
    }
  }

  const segments: HighlightSegment[] = []
  let cursor = 0

  for (const [start, end] of merged) {
    if (start > cursor) {
      segments.push({
        text: text.slice(cursor, start),
        isHighlight: false
      })
    }
    segments.push({
      text: text.slice(start, end),
      isHighlight: true
    })
    cursor = end
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      isHighlight: false
    })
  }

  return segments
}

/**
 * Safely opens an external URL in a new window.
 * Strictly permits only 'http:' and 'https:' protocols (rejects 'javascript:', 'data:', etc.).
 * Always enforces 'noopener,noreferrer' window features (NEW-SEC-01).
 */
export function safeOpenExternal(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false
  const trimmed = rawUrl.trim()
  if (!trimmed) return false

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(`[safeOpenExternal] Blocked unsafe protocol: ${parsed.protocol}`)
      }
      return false
    }

    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(parsed.href, '_blank', 'noopener,noreferrer')
      return true
    }
    return false
  } catch {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[safeOpenExternal] Invalid URL: ${rawUrl}`)
    }
    return false
  }
}

export function getSafeLocalStorage(): Storage | null {
  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage &&
      typeof window.localStorage.getItem === 'function' &&
      typeof window.localStorage.setItem === 'function'
    ) {
      return window.localStorage
    }
  } catch {
    // Ignore storage access errors
  }
  return null
}

export function isRecordableQuery(q: string): boolean {
  const trimmed = (q || '').trim()
  if (!trimmed) return false
  if (['>', '#', '@', '!'].includes(trimmed)) return false
  return true
}

export function parseSearchQuery(raw: string): ParsedQuery {
  const trimmed = (raw || '').trim()
  if (trimmed.startsWith('>')) {
    return {
      prefixMode: 'action',
      cleanQuery: trimmed.slice(1).trim().toLowerCase()
    }
  }
  if (trimmed.startsWith('#')) {
    return {
      prefixMode: 'tag',
      cleanQuery: trimmed.slice(1).trim().toLowerCase()
    }
  }
  if (trimmed.startsWith('@')) {
    return {
      prefixMode: 'project',
      cleanQuery: trimmed.slice(1).trim().toLowerCase()
    }
  }
  if (trimmed.startsWith('!')) {
    return {
      prefixMode: 'blocker',
      cleanQuery: trimmed.slice(1).trim().toLowerCase()
    }
  }
  return {
    prefixMode: 'none',
    cleanQuery: trimmed.toLowerCase()
  }
}

export interface ScoreItemResult {
  score: number
  titleRanges?: [number, number][]
  subtitleRanges?: [number, number][]
}

/**
 * Fast Fuzzy Matching and Scoring Engine ($O(N)$ zero-lag).
 */
export function scoreItem(
  item: OmniSearchItem,
  query: string,
  prefixMode: PrefixMode,
  activeScope: OmniSearchScope = 'all'
): ScoreItemResult {
  // Prefix filtering rules
  if (prefixMode === 'action') {
    if (item.type !== 'action' && item.type !== 'navigation') {
      return { score: -1 }
    }
  } else if (prefixMode === 'tag') {
    const tags = item.tags || []
    if (tags.length === 0) {
      return { score: -1 }
    }
    if (query) {
      const hasTag = tags.some((t) => t.toLowerCase().includes(query))
      if (!hasTag) {
        return { score: -1 }
      }
    }
  } else if (prefixMode === 'project') {
    const isProjectEntity = item.type === 'project' || Boolean(item.projectSlug)
    if (!isProjectEntity) {
      return { score: -1 }
    }
    if (query) {
      const projectMatches =
        item.projectSlug?.toLowerCase().includes(query) ||
        (item.type === 'project' && item.title.toLowerCase().includes(query))
      if (!projectMatches) {
        return { score: -1 }
      }
    }
  } else if (prefixMode === 'blocker') {
    const isCriticalOrBlocked =
      item.status === 'blocked' || item.priority === 'critical'
    if (!isCriticalOrBlocked) {
      return { score: -1 }
    }
  } else {
    // Scope filter when no explicit prefix override
    if (activeScope !== 'all') {
      if (activeScope === 'action') {
        if (item.type !== 'action' && item.type !== 'navigation') return { score: -1 }
      } else if (item.type !== activeScope) {
        return { score: -1 }
      }
    }
  }

  // Default sorting when query is empty
  if (!query) {
    let base = 100
    if (prefixMode === 'project' && item.type === 'project') base += 60
    if (item.type === 'action') base += 50
    if (item.priority === 'critical') base += 50
    if (item.status === 'blocked') base += 40
    if (item.status === 'active' || item.status === 'running_sprint') base += 30
    return { score: base }
  }

  let score = 0
  let titleRanges: [number, number][] | undefined
  let subtitleRanges: [number, number][] | undefined

  const titleLower = (item.title || '').toLowerCase()
  const subtitleLower = (item.subtitle || '').toLowerCase()
  const badgeLower = (item.badge || '').toLowerCase()

  // 1. Exact ID match (+1000) e.g. "DEL-01", "ENG-001", "W42"
  if (badgeLower === query || item.id.toLowerCase().endsWith(query)) {
    score += 1000
  }

  // 2. Exact Title match (+800)
  if (titleLower === query) {
    score += 800
    titleRanges = [[0, item.title.length]]
  }

  // 3. Prefix Match on Title (+500)
  if (titleLower.startsWith(query)) {
    score += 500
    titleRanges = [[0, query.length]]
  } else {
    // Word boundary prefix match
    const wordMatchIndex = titleLower.indexOf(' ' + query)
    if (wordMatchIndex !== -1) {
      score += 380
      titleRanges = [[wordMatchIndex + 1, wordMatchIndex + 1 + query.length]]
    }
  }

  // 4. Acronym Match (+400) e.g. "cc" -> Command Center, "w42" -> Weekly Sprint 42, "tfs" -> tf-hitnet-stream
  const words = item.title.split(/[\s\-_]+/).filter(Boolean)
  const acronym = words.map((w) => w[0]).join('').toLowerCase()
  if (acronym === query || acronym.startsWith(query)) {
    score += 400
  }

  // 5. Consecutive Substring Match (+200 + position bonuses)
  const titleIdx = titleLower.indexOf(query)
  if (titleIdx !== -1) {
    score += 200 + Math.max(0, 100 - titleIdx * 4)
    if (!titleRanges) {
      titleRanges = [[titleIdx, titleIdx + query.length]]
    }
  }

  const subIdx = subtitleLower.indexOf(query)
  if (subIdx !== -1) {
    score += 120 + Math.max(0, 60 - subIdx * 2)
    subtitleRanges = [[subIdx, subIdx + query.length]]
  }

  // 6. Tech Tag match (+250 exact/prefix, +180 substring)
  if (item.tags?.some((t) => t.toLowerCase() === query || t.toLowerCase().startsWith(query))) {
    score += 250
  } else if (item.tags?.some((t) => t.toLowerCase().includes(query))) {
    score += 180
  }

  // 6b. Project Slug match under @ prefix (+200)
  if (prefixMode === 'project' && item.projectSlug?.toLowerCase().includes(query)) {
    score += 200
  }

  // 7. Description match (+80)
  if (item.description?.toLowerCase().includes(query)) {
    score += 80
  }

  // 8. Urgency & State Boosts
  if (item.priority === 'critical') score += 50
  if (item.status === 'blocked') score += 40
  if (item.status === 'active' || item.status === 'running_sprint') score += 30

  // 9. Fuzzy character subsequence fallback if no match yet
  if (score === 0) {
    let qIdx = 0
    let matchCount = 0
    let consecutive = 0
    const matchedPositions: number[] = []

    for (let i = 0; i < titleLower.length && qIdx < query.length; i++) {
      if (titleLower[i] === query[qIdx]) {
        matchedPositions.push(i)
        qIdx++
        matchCount++
        consecutive++
        score += 10 + consecutive * 5
      } else {
        consecutive = 0
      }
    }

    if (qIdx === query.length) {
      // All characters matched in sequence
      score += 50
      // Convert matched positions into ranges
      titleRanges = []
      let rangeStart = matchedPositions[0]
      let prev = rangeStart
      for (let i = 1; i < matchedPositions.length; i++) {
        const curr = matchedPositions[i]
        if (curr === prev + 1) {
          prev = curr
        } else {
          titleRanges.push([rangeStart, prev + 1])
          rangeStart = curr
          prev = curr
        }
      }
      titleRanges.push([rangeStart, prev + 1])
    } else {
      score = -1 // No match
    }
  }

  return { score, titleRanges, subtitleRanges }
}
