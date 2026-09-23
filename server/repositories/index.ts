import { NitroTaskRepository } from './nitro/nitro-task.repository'
import { NitroProjectRepository } from './nitro/nitro-project.repository'
import { NitroSprintRepository } from './nitro/nitro-sprint.repository'
import { SupabaseTaskRepository } from './supabase/supabase-task.repository'
import { SupabaseProjectRepository } from './supabase/supabase-project.repository'
import { SupabaseSprintRepository } from './supabase/supabase-sprint.repository'
import type { ITaskRepository } from './contracts/task.repository'
import type { IProjectRepository } from './contracts/project.repository'
import type { ISprintRepository } from './contracts/sprint.repository'
import { getSupabaseClient } from '../utils/supabase'

export * from './contracts'

// Lazy instances
let _nitroTask: NitroTaskRepository | null = null
let _supabaseTask: SupabaseTaskRepository | null = null

let _nitroProject: NitroProjectRepository | null = null
let _supabaseProject: SupabaseProjectRepository | null = null

let _nitroSprint: NitroSprintRepository | null = null
let _supabaseSprint: SupabaseSprintRepository | null = null

function hasSupabase(): boolean {
  try {
    return Boolean(getSupabaseClient())
  } catch {
    return false
  }
}

function getTaskRepo(): ITaskRepository {
  if (hasSupabase()) {
    if (!_supabaseTask) _supabaseTask = new SupabaseTaskRepository()
    return _supabaseTask
  }
  if (!_nitroTask) _nitroTask = new NitroTaskRepository()
  return _nitroTask
}

function getProjectRepo(): IProjectRepository {
  if (hasSupabase()) {
    if (!_supabaseProject) _supabaseProject = new SupabaseProjectRepository()
    return _supabaseProject
  }
  if (!_nitroProject) _nitroProject = new NitroProjectRepository()
  return _nitroProject
}

function getSprintRepo(): ISprintRepository {
  if (hasSupabase()) {
    if (!_supabaseSprint) _supabaseSprint = new SupabaseSprintRepository()
    return _supabaseSprint
  }
  if (!_nitroSprint) _nitroSprint = new NitroSprintRepository()
  return _nitroSprint
}

// Transparent Proxy singletons: Routes requests to Supabase when configured, falls back to Nitro KV seamlessly
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
