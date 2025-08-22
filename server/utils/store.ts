// server/utils/store.ts
import { promises as fs } from 'fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', '..', '.data')

async function ensureDir() {
    await fs.mkdir(DATA_DIR, { recursive: true })
}

async function readJson<T>(file: string): Promise<T | null> {
    try {
        const raw = await fs.readFile(file, 'utf8')
        return JSON.parse(raw) as T
    } catch (e: any) {
        if (e.code === 'ENOENT') return null
        throw e
    }
}

async function writeJson(file: string, data: any) {
    await ensureDir()
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8')
}

function fileFor(key: string) {
    return join(DATA_DIR, `${key}.json`)
}

export async function getArray<T = any>(key: string): Promise<T[]> {
    const file = fileFor(key)
    const data = await readJson<T[]>(file)
    return Array.isArray(data) ? data : []
}

export async function setArray<T = any>(key: string, arr: T[]) {
    const file = fileFor(key)
    await writeJson(file, arr)
}

export function genId() {
    return randomUUID()
}

export async function getById<T = any>(key: string, id: string): Promise<T | null> {
    const arr = await getArray<T>(key)
    return (arr as any[]).find((x) => x.id === id) ?? null
}

export async function createItem<T extends { id?: string; createdAt?: string; updatedAt?: string }>(
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

export async function updateItem<T extends { id: string; updatedAt?: string }>(
    key: string,
    id: string,
    patch: Partial<T>
): Promise<T | null> {
    const arr = await getArray<T>(key)
    const idx = (arr as any[]).findIndex((x) => (x as any).id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    const updated = { ...(arr as any[])[idx], ...patch, id, updatedAt: now }
    ;(arr as any[])[idx] = updated
    await setArray(key, arr)
    return updated as T
}

export async function removeItem(key: string, id: string): Promise<boolean> {
    const arr = await getArray<any>(key)
    const next = arr.filter((x) => x.id !== id)
    const changed = next.length !== arr.length
    if (changed) await setArray(key, next)
    return changed
}
