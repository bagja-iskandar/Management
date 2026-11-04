export type OmniSearchScope = 'all' | 'task' | 'project' | 'sprint' | 'repo' | 'action' | 'note'
export type OmniItemType = 'task' | 'project' | 'sprint' | 'repo' | 'action' | 'navigation' | 'note'
export type PrefixMode = 'none' | 'action' | 'tag' | 'project' | 'blocker'

export interface OmniSearchItem {
  id: string
  title: string
  subtitle?: string
  description?: string
  type: OmniItemType
  categoryLabel: string
  icon: string
  iconColor?: string
  badge?: string
  badgeColor?: string
  tags?: string[]
  projectSlug?: string
  priority?: string
  status?: string
  score?: number
  titleHighlights?: [number, number][]
  subtitleHighlights?: [number, number][]
  payload?: any
  action: () => void | Promise<void>
  secondaryAction?: () => void | Promise<void>
  secondaryActionLabel?: string
  shortcutHint?: string
}

export interface HighlightSegment {
  text: string
  isHighlight: boolean
}

export interface ParsedQuery {
  prefixMode: PrefixMode
  cleanQuery: string
}

export interface IndexedOmniItem extends OmniSearchItem {
  flatIndex: number
  visualIndex: number
}

export interface ItemGroup {
  category: string
  rawCategory: string
  items: IndexedOmniItem[]
  totalCount: number
  hiddenCount: number
  maxScore: number
}
