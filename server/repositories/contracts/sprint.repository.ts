import type { Sprint } from '~/types'

export interface ISprintRepository {
  findAll(): Promise<Sprint[]>
  findById(id: string): Promise<Sprint | null>
  create(sprint: Omit<Sprint, 'id' | 'createdAt'>): Promise<Sprint>
  update(id: string, patch: Partial<Sprint>): Promise<Sprint | null>
  delete(id: string): Promise<boolean>
}
