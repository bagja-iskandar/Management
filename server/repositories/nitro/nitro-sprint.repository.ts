import type { ISprintRepository } from '../contracts/sprint.repository'
import type { Sprint } from '~/types'
import {
  getArray,
  getById,
  createItem,
  updateItem,
  removeItem
} from '../../utils/store'

export class NitroSprintRepository implements ISprintRepository {
  async findAll(): Promise<Sprint[]> {
    const sprints = await getArray<Sprint>('sprints')
    return sprints.slice().sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
  }

  async findById(id: string): Promise<Sprint | null> {
    return await getById<Sprint>('sprints', id)
  }

  async create(sprintData: Omit<Sprint, 'id' | 'createdAt'>): Promise<Sprint> {
    return await createItem<Sprint>('sprints', sprintData as any)
  }

  async update(id: string, patch: Partial<Sprint>): Promise<Sprint | null> {
    return await updateItem<Sprint>('sprints', id, patch)
  }

  async delete(id: string): Promise<boolean> {
    return await removeItem('sprints', id)
  }
}
