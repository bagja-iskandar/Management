// server/utils/store.ts
import { randomUUID } from 'node:crypto'
import { createStorageAdapter } from './storage-adapter'

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
  return arr.find((item) => normalizeId((item as any).id) === normalizeId(id)) ?? null
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
  const idx = arr.findIndex((item) => normalizeId((item as any).id) === normalizeId(id))
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
  const next = arr.filter((item) => normalizeId((item as any).id) !== normalizeId(id))
  const changed = next.length !== arr.length
  if (changed) await setArray(key, next)
  return changed
}
