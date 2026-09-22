export interface Stat {
  label: string
  value: string | number
  delta: string
  trend: 'up' | 'down'
  subtitle?: string
}
