export type SprintStatus = 'planning' | 'active' | 'completed'

export interface Sprint {
  id: string
  name: string
  status: 'planning' | 'active' | 'completed'
  startDate: string
  endDate: string
  taskIds: string[]
  velocity?: number
  objective?: string
  createdAt: string
}
