// server/utils/store.ts
import { randomUUID } from 'node:crypto'
import { createStorageAdapter } from './storage-adapter'
import type { Task, Project } from '~/types'

function storage() {
  return createStorageAdapter()
}

export async function getArray<T = any>(key: string): Promise<T[]> {
  const data = await storage().getItem<T[]>(key)
  return Array.isArray(data) ? data : []
}

export async function setArray<T = any>(key: string, arr: T[]) {
  await storage().setItem(key, arr)
}

export async function getValue<T = unknown>(key: string): Promise<T | null> {
  return await storage().getItem<T>(key)
}

export async function setValue<T = unknown>(key: string, value: T) {
  await storage().setItem(key, value)
}

export function genId() {
  return randomUUID()
}

const normalizeId = (value: string | number) => String(value)

let taskIdSeqMutex = Promise.resolve()

export async function getNextTaskId(): Promise<string> {
  return new Promise((resolve, reject) => {
    taskIdSeqMutex = taskIdSeqMutex.then(async () => {
      try {
        const tasks = await getArray<Task>('tasks')
        let maxNum = 0
        for (const t of tasks) {
          const match = String(t.taskId || '').match(/(\d+)/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num > maxNum) maxNum = num
          }
        }
        const currentSeq = (await getValue<number>('task-seq')) ?? 0
        const next = Math.max(maxNum, currentSeq) + 1
        await setValue('task-seq', next)
        resolve('ENG-' + String(next).padStart(3, '0'))
      } catch (e) {
        reject(e)
      }
    })
  })
}

export function normalizeTask(task: any): Task {
  const legacyStatusMap: Record<string, Task['status']> = {
    todo: 'in_queue',
    proses: 'running_sprint',
    selesai: 'deployed'
  }
  const status: Task['status'] =
    task.status && ['in_queue', 'running_sprint', 'deployed', 'blocked'].includes(task.status)
      ? task.status
      : (legacyStatusMap[task.status] ?? 'in_queue')

  return {
    id: task.id || genId(),
    taskId: task.taskId || 'ENG-000',
    projectSlug: task.projectSlug,
    name: task.name || '',
    description: task.description,
    status,
    priority: task.priority || 'medium',
    techTags: Array.isArray(task.techTags) ? task.techTags : [],
    dueDate: task.dueDate,
    sprintId: task.sprintId,
    date: task.date || new Date().toISOString().slice(0, 10),
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
    githubIssueUrl: task.githubIssueUrl,
    githubIssueNumber:
      task.githubIssueNumber !== undefined && task.githubIssueNumber !== null
        ? Number(task.githubIssueNumber)
        : undefined,
    githubPrUrl: task.githubPrUrl
  }
}

export function normalizeProject(proj: any): Project {
  return {
    id: proj.id || genId(),
    slug: proj.slug || '',
    title: proj.title || '',
    description: proj.description,
    status: proj.status || 'active',
    priority: proj.priority || 'medium',
    githubRepo: proj.githubRepo,
    deployUrl: proj.deployUrl,
    techStack: Array.isArray(proj.techStack) ? proj.techStack : [],
    startDate: proj.startDate,
    dueDate: proj.dueDate,
    createdAt: proj.createdAt || new Date().toISOString(),
    updatedAt: proj.updatedAt || new Date().toISOString()
  }
}

export async function migrateNumericIds<T extends { id?: string | number }>(key: string): Promise<void> {
  const items = await getArray<T>(key)
  let changed = false

  const normalized = items.map((item) => {
    const id = item.id
    const needsMigration =
      id === undefined ||
      typeof id === 'number' ||
      (typeof id === 'string' && id.trim() !== '' && /^[0-9]+$/.test(id))

    if (!needsMigration) {
      return item
    }

    changed = true
    return { ...item, id: genId() } as T
  })

  if (changed) {
    await setArray(key, normalized)
  }
}

export async function getById<T = any>(key: string, id: string | number): Promise<T | null> {
  const arr = await getArray<T>(key)
  const targetId = normalizeId(id)
  const cleanId = String(id).replace(/^#/, '').trim().toLowerCase()
  return arr.find((item) => {
    const itemId = normalizeId((item as any).id)
    const itemTaskId = String((item as any).taskId || '').replace(/^#/, '').trim().toLowerCase()
    return itemId === targetId || (cleanId && itemTaskId === cleanId)
  }) ?? null
}

export async function createItem<T extends { id?: string | number; createdAt?: string; updatedAt?: string }>(
  key: string,
  item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<T> {
  const arr = await getArray<T>(key)
  const now = new Date().toISOString()
  const newItem = { ...(item as any), id: genId(), createdAt: now, updatedAt: now } as T
  arr.push(newItem)
  await setArray(key, arr)
  return newItem
}

export async function updateItem<T extends { id: string | number; updatedAt?: string }>(
  key: string,
  id: string | number,
  patch: Partial<T>
): Promise<T | null> {
  const arr = await getArray<T>(key)
  const targetId = normalizeId(id)
  const cleanId = String(id).replace(/^#/, '').trim().toLowerCase()
  const idx = arr.findIndex((item) => {
    const itemId = normalizeId((item as any).id)
    const itemTaskId = String((item as any).taskId || '').replace(/^#/, '').trim().toLowerCase()
    return itemId === targetId || (cleanId && itemTaskId === cleanId)
  })
  if (idx === -1) return null
  const now = new Date().toISOString()
  const existing = arr[idx] as any
  const updated = { ...existing, ...patch, id: existing.id, updatedAt: now } as T
  arr[idx] = updated
  await setArray(key, arr)
  return updated
}

export async function removeItem<T = any>(key: string, id: string | number): Promise<boolean> {
  const arr = await getArray<T>(key)
  const targetId = normalizeId(id)
  const cleanId = String(id).replace(/^#/, '').trim().toLowerCase()
  const next = arr.filter((item) => {
    const itemId = normalizeId((item as any).id)
    const itemTaskId = String((item as any).taskId || '').replace(/^#/, '').trim().toLowerCase()
    return itemId !== targetId && (!cleanId || itemTaskId !== cleanId)
  })
  const changed = next.length !== arr.length
  if (changed) await setArray(key, next)
  return changed
}

export async function getBySlug<T extends { slug: string }>(key: string, slug: string): Promise<T | null> {
  const arr = await getArray<T>(key)
  return arr.find((item) => item.slug === slug) ?? null
}

export async function updateItemBySlug<T extends { slug: string; updatedAt?: string }>(
  key: string,
  slug: string,
  patch: Partial<T>
): Promise<T | null> {
  const arr = await getArray<T>(key)
  const idx = arr.findIndex((item) => item.slug === slug)
  if (idx === -1) return null
  const now = new Date().toISOString()
  const existing = arr[idx] as any
  const updated = { ...existing, ...patch, slug: existing.slug, updatedAt: now } as T
  arr[idx] = updated
  await setArray(key, arr)
  return updated
}

export async function removeItemBySlug<T extends { slug: string }>(key: string, slug: string): Promise<boolean> {
  const arr = await getArray<T>(key)
  const next = arr.filter((item) => item.slug !== slug)
  const changed = next.length !== arr.length
  if (changed) await setArray(key, next)
  return changed
}
