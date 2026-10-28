import { NitroTaskRepository } from './nitro/nitro-task.repository'
import { NitroProjectRepository } from './nitro/nitro-project.repository'
import { NitroSprintRepository } from './nitro/nitro-sprint.repository'
import { NitroNoteRepository } from './nitro/nitro-note.repository'
import { SupabaseTaskRepository } from './supabase/supabase-task.repository'
import { SupabaseProjectRepository } from './supabase/supabase-project.repository'
import { SupabaseSprintRepository } from './supabase/supabase-sprint.repository'
import { SupabaseNoteRepository } from './supabase/supabase-note.repository'
import type { ITaskRepository } from './contracts/task.repository'
import type { IProjectRepository } from './contracts/project.repository'
import type { ISprintRepository } from './contracts/sprint.repository'
import type { INoteRepository } from './contracts/note.repository'
import { getSupabaseClient } from '../utils/supabase'

export * from './contracts'

// Lazy instances
let _nitroTask: NitroTaskRepository | null = null
let _supabaseTask: SupabaseTaskRepository | null = null

let _nitroProject: NitroProjectRepository | null = null
let _supabaseProject: SupabaseProjectRepository | null = null

let _nitroSprint: NitroSprintRepository | null = null
let _supabaseSprint: SupabaseSprintRepository | null = null

let _nitroNote: NitroNoteRepository | null = null
let _supabaseNote: SupabaseNoteRepository | null = null

let _isSupabaseReachable: boolean | null = null
let _lastSupabaseCheck = 0

export function isNetworkError(err: any): boolean {
  if (!err) return false
  const msg = (typeof err === 'string' ? err : err.message || err.details || JSON.stringify(err)).toLowerCase()
  return (
    msg.includes('fetch failed') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('network') ||
    msg.includes('connection')
  )
}

export function markSupabaseOffline(reason?: string) {
  if (_isSupabaseReachable !== false) {
    console.warn(`[Storage] Supabase is unreachable (${reason || 'offline'}).`)
  }
  _isSupabaseReachable = false
  _lastSupabaseCheck = Date.now()
}

export function markSupabaseOnline() {
  if (_isSupabaseReachable !== true) {
    console.log('[Storage] Supabase is connected and active.')
  }
  _isSupabaseReachable = true
}

export function isSupabaseActive(): boolean {
  try {
    // Jika Supabase terbukti offline/unreachable saat boot, langsung gunakan Nitro KV tanpa menunggu timeout
    if (_isSupabaseReachable === false) {
      return false
    }
    return Boolean(getSupabaseClient())
  } catch {
    return false
  }
}

export function getTaskRepo(): ITaskRepository {
  if (isSupabaseActive()) {
    if (!_supabaseTask) _supabaseTask = new SupabaseTaskRepository()
    return _supabaseTask
  }
  if (!_nitroTask) _nitroTask = new NitroTaskRepository()
  return _nitroTask
}

export function getProjectRepo(): IProjectRepository {
  if (isSupabaseActive()) {
    if (!_supabaseProject) _supabaseProject = new SupabaseProjectRepository()
    return _supabaseProject
  }
  if (!_nitroProject) _nitroProject = new NitroProjectRepository()
  return _nitroProject
}

export function getSprintRepo(): ISprintRepository {
  if (isSupabaseActive()) {
    if (!_supabaseSprint) _supabaseSprint = new SupabaseSprintRepository()
    return _supabaseSprint
  }
  if (!_nitroSprint) _nitroSprint = new NitroSprintRepository()
  return _nitroSprint
}

export function getNoteRepo(): INoteRepository {
  if (isSupabaseActive()) {
    if (!_supabaseNote) _supabaseNote = new SupabaseNoteRepository()
    return _supabaseNote
  }
  if (!_nitroNote) _nitroNote = new NitroNoteRepository()
  return _nitroNote
}

// Transparent Proxy singletons: Routes requests to Supabase when configured, or to Nitro KV when Supabase is not configured
export const taskRepository: ITaskRepository = new Proxy({} as ITaskRepository, {
  get(_target, prop) {
    const repo = getTaskRepo()
    const val = (repo as any)[prop]
    return typeof val === 'function' ? val.bind(repo) : val
  }
})

export const projectRepository: IProjectRepository = new Proxy({} as IProjectRepository, {
  get(_target, prop) {
    const repo = getProjectRepo()
    const val = (repo as any)[prop]
    return typeof val === 'function' ? val.bind(repo) : val
  }
})

export const sprintRepository: ISprintRepository = new Proxy({} as ISprintRepository, {
  get(_target, prop) {
    const repo = getSprintRepo()
    const val = (repo as any)[prop]
    return typeof val === 'function' ? val.bind(repo) : val
  }
})

export const noteRepository: INoteRepository = new Proxy({} as INoteRepository, {
  get(_target, prop) {
    const repo = getNoteRepo()
    const val = (repo as any)[prop]
    return typeof val === 'function' ? val.bind(repo) : val
  }
})
