import type { Task, Project, Sprint, ProjectNote } from '~/types'

export type EntityHydrationStatus = 'idle' | 'loading' | 'success' | 'error'

export interface HydrationStatus {
  tasks: EntityHydrationStatus
  projects: EntityHydrationStatus
  sprints: EntityHydrationStatus
  notes: EntityHydrationStatus
}

export type EntityType = 'task' | 'project' | 'sprint' | 'note'

export interface EntityContext<T = any> {
  serverConfirmedBaseline: T
  activeMutationsCount: number
}

// Module-level singletons for in-flight coordination and mutation serialization
let inFlightHydrationPromise: Promise<{
  tasks: Task[]
  projects: Project[]
  sprints: Sprint[]
  notes: ProjectNote[]
}> | null = null

const entityQueues = new Map<string, Promise<unknown>>()
const entityContexts = new Map<string, EntityContext>()

function getEntityKey(entityType: EntityType, idOrKey: string): string {
  return `${entityType}:${idOrKey}`
}

export function useWorkspaceStore() {
  const tasks = useState<Task[]>('workspace:tasks', () => [])
  const projects = useState<Project[]>('workspace:projects', () => [])
  const sprints = useState<Sprint[]>('workspace:sprints', () => [])
  const notes = useState<ProjectNote[]>('workspace:notes', () => [])

  const isLoading = useState<boolean>('workspace:loading', () => false)
  const isInitialized = useState<boolean>('workspace:initialized', () => false)
  const lastError = useState<string | null>('workspace:last_error', () => null)

  const hydrationStatus = useState<HydrationStatus>('workspace:hydration_status', () => ({
    tasks: 'idle',
    projects: 'idle',
    sprints: 'idle',
    notes: 'idle'
  }))

  async function fetchWorkspaceTasks(params?: Record<string, any>): Promise<Task[]> {
    hydrationStatus.value.tasks = 'loading'
    try {
      const data = await $fetch<Task[]>('/api/tasks', { params })
      tasks.value = data || []
      hydrationStatus.value.tasks = 'success'
      return tasks.value
    } catch (err: any) {
      hydrationStatus.value.tasks = 'error'
      console.error('[useWorkspaceStore] fetchWorkspaceTasks failed:', err)
      throw err
    }
  }

  async function fetchWorkspaceProjects(): Promise<Project[]> {
    hydrationStatus.value.projects = 'loading'
    try {
      const data = await $fetch<Project[]>('/api/projects')
      projects.value = data || []
      hydrationStatus.value.projects = 'success'
      return projects.value
    } catch (err: any) {
      hydrationStatus.value.projects = 'error'
      console.error('[useWorkspaceStore] fetchWorkspaceProjects failed:', err)
      throw err
    }
  }

  async function fetchWorkspaceSprints(): Promise<Sprint[]> {
    hydrationStatus.value.sprints = 'loading'
    try {
      const data = await $fetch<Sprint[]>('/api/sprints')
      sprints.value = data || []
      hydrationStatus.value.sprints = 'success'
      return sprints.value
    } catch (err: any) {
      hydrationStatus.value.sprints = 'error'
      console.error('[useWorkspaceStore] fetchWorkspaceSprints failed:', err)
      throw err
    }
  }

  async function fetchWorkspaceNotes(projectSlug?: string): Promise<ProjectNote[]> {
    hydrationStatus.value.notes = 'loading'
    try {
      const params = projectSlug ? { projectSlug } : undefined
      const data = await $fetch<ProjectNote[]>('/api/notes', { params })
      notes.value = data || []
      hydrationStatus.value.notes = 'success'
      return notes.value
    } catch (err: any) {
      hydrationStatus.value.notes = 'error'
      // Gracefully handle not-found or during transition when endpoint is not yet mounted
      console.warn('[useWorkspaceStore] fetchWorkspaceNotes:', err?.message || err)
      return notes.value
    }
  }

  /**
   * Coordinated initial hydration with shared in-flight promise.
   * Runs a single parallel batch fetch across all entities.
   * Concurrent calls reuse the active inFlightHydrationPromise to prevent duplicate HTTP requests.
   */
  async function initializeWorkspace(force = false) {
    if (isInitialized.value && !force) {
      return {
        tasks: tasks.value,
        projects: projects.value,
        sprints: sprints.value,
        notes: notes.value
      }
    }

    if (inFlightHydrationPromise && !force) {
      return await inFlightHydrationPromise
    }

    isLoading.value = true
    lastError.value = null
    hydrationStatus.value = {
      tasks: 'loading',
      projects: 'loading',
      sprints: 'loading',
      notes: 'loading'
    }

    inFlightHydrationPromise = (async () => {
      try {
        const [tasksRes, projectsRes, sprintsRes, notesRes] = await Promise.allSettled([
          $fetch<Task[]>('/api/tasks'),
          $fetch<Project[]>('/api/projects'),
          $fetch<Sprint[]>('/api/sprints'),
          $fetch<ProjectNote[]>('/api/notes').catch(() => [] as ProjectNote[])
        ])

        if (tasksRes.status === 'fulfilled') {
          tasks.value = tasksRes.value || []
          hydrationStatus.value.tasks = 'success'
        } else {
          hydrationStatus.value.tasks = 'error'
          console.error('[useWorkspaceStore] Initial tasks fetch error:', tasksRes.reason)
        }

        if (projectsRes.status === 'fulfilled') {
          projects.value = projectsRes.value || []
          hydrationStatus.value.projects = 'success'
        } else {
          hydrationStatus.value.projects = 'error'
          console.error('[useWorkspaceStore] Initial projects fetch error:', projectsRes.reason)
        }

        if (sprintsRes.status === 'fulfilled') {
          sprints.value = sprintsRes.value || []
          hydrationStatus.value.sprints = 'success'
        } else {
          hydrationStatus.value.sprints = 'error'
          console.error('[useWorkspaceStore] Initial sprints fetch error:', sprintsRes.reason)
        }

        if (notesRes.status === 'fulfilled') {
          notes.value = notesRes.value || []
          hydrationStatus.value.notes = 'success'
        } else {
          hydrationStatus.value.notes = 'error'
        }

        isInitialized.value = true
        return {
          tasks: tasks.value,
          projects: projects.value,
          sprints: sprints.value,
          notes: notes.value
        }
      } catch (err: any) {
        lastError.value = err?.message || 'Failed to initialize workspace'
        console.error('[useWorkspaceStore] initializeWorkspace fatal error:', err)
        throw err
      } finally {
        isLoading.value = false
        inFlightHydrationPromise = null
      }
    })()

    return await inFlightHydrationPromise
  }

  async function refreshWorkspace() {
    return await initializeWorkspace(true)
  }

  // --- Entity Mutation Serialization & Authoritative Server Baseline ---

  /**
   * Applies an optimistic patch to the reactive store while snapshotting the baseline.
   */
  function applyOptimisticPatch(
    entityType: EntityType,
    idOrKey: string,
    patch: Record<string, any>
  ) {
    const key = getEntityKey(entityType, idOrKey)

    let currentEntity: any = null
    if (entityType === 'task') {
      currentEntity = tasks.value.find(t => t.id === idOrKey || t.taskId === idOrKey)
    } else if (entityType === 'project') {
      currentEntity = projects.value.find(p => p.slug === idOrKey || p.id === idOrKey)
    } else if (entityType === 'sprint') {
      currentEntity = sprints.value.find(s => s.id === idOrKey)
    } else if (entityType === 'note') {
      currentEntity = notes.value.find(n => n.id === idOrKey)
    }

    if (currentEntity) {
      const existingCtx = entityContexts.get(key)
      if (!existingCtx || existingCtx.activeMutationsCount === 0) {
        entityContexts.set(key, {
          serverConfirmedBaseline: JSON.parse(JSON.stringify(currentEntity)),
          activeMutationsCount: 1
        })
      } else {
        existingCtx.activeMutationsCount += 1
      }
    }

    if (entityType === 'task') updateTaskInStore(idOrKey, patch)
    else if (entityType === 'project') updateProjectInStore(idOrKey, patch)
    else if (entityType === 'sprint') updateSprintInStore(idOrKey, patch)
    else if (entityType === 'note') updateNoteInStore(idOrKey, patch)

    return {
      entityKey: key,
      rollback: () => handleMutationSettled(entityType, idOrKey, patch, false),
      commit: (confirmedServerData?: any) => handleMutationSettled(entityType, idOrKey, patch, true, confirmedServerData)
    }
  }

  /**
   * Handles settlement of a mutation.
   * If failed: applies targeted field rollback (only fields that still match the failed patch are reverted).
   * If successful: advances the serverConfirmedBaseline.
   */
  function handleMutationSettled(
    entityType: EntityType,
    idOrKey: string,
    patch: Record<string, any>,
    isSuccess: boolean,
    confirmedServerData?: any
  ) {
    const key = getEntityKey(entityType, idOrKey)
    const ctx = entityContexts.get(key)

    if (isSuccess) {
      if (ctx) {
        if (confirmedServerData) {
          ctx.serverConfirmedBaseline = JSON.parse(JSON.stringify(confirmedServerData))
          if (entityType === 'task') updateTaskInStore(idOrKey, confirmedServerData)
          else if (entityType === 'project') updateProjectInStore(idOrKey, confirmedServerData)
          else if (entityType === 'sprint') updateSprintInStore(idOrKey, confirmedServerData)
          else if (entityType === 'note') updateNoteInStore(idOrKey, confirmedServerData)
        } else {
          ctx.serverConfirmedBaseline = { ...ctx.serverConfirmedBaseline, ...patch }
        }
        ctx.activeMutationsCount = Math.max(0, ctx.activeMutationsCount - 1)
        if (ctx.activeMutationsCount === 0) {
          entityContexts.delete(key)
        }
      }
    } else {
      if (ctx && ctx.serverConfirmedBaseline) {
        let currentEntity: any = null
        if (entityType === 'task') {
          currentEntity = tasks.value.find(t => t.id === idOrKey || t.taskId === idOrKey)
        } else if (entityType === 'project') {
          currentEntity = projects.value.find(p => p.slug === idOrKey || p.id === idOrKey)
        } else if (entityType === 'sprint') {
          currentEntity = sprints.value.find(s => s.id === idOrKey)
        } else if (entityType === 'note') {
          currentEntity = notes.value.find(n => n.id === idOrKey)
        }

        if (currentEntity) {
          const rollbackPatch: Record<string, any> = {}
          for (const field of Object.keys(patch)) {
            // Revert field only if current value has not been overwritten by another operation
            if (currentEntity[field] === patch[field]) {
              rollbackPatch[field] = ctx.serverConfirmedBaseline[field]
            }
          }
          if (Object.keys(rollbackPatch).length > 0) {
            if (entityType === 'task') updateTaskInStore(idOrKey, rollbackPatch)
            else if (entityType === 'project') updateProjectInStore(idOrKey, rollbackPatch)
            else if (entityType === 'sprint') updateSprintInStore(idOrKey, rollbackPatch)
            else if (entityType === 'note') updateNoteInStore(idOrKey, rollbackPatch)
          }
        }

        ctx.activeMutationsCount = Math.max(0, ctx.activeMutationsCount - 1)
        if (ctx.activeMutationsCount === 0) {
          entityContexts.delete(key)
        }
      }
    }
  }

  /**
   * Enqueues an entity mutation ensuring per-entity execution ordering.
   */
  function enqueueEntityMutation<T>(
    entityType: EntityType,
    idOrKey: string,
    mutationFn: () => Promise<T>,
    patch?: Record<string, any>
  ): Promise<T> {
    const key = getEntityKey(entityType, idOrKey)
    const prevPromise = entityQueues.get(key) || Promise.resolve()

    if (patch) {
      applyOptimisticPatch(entityType, idOrKey, patch)
    }

    const currentPromise = prevPromise
      .catch(() => {})
      .then(async () => {
        try {
          const result = await mutationFn()
          if (patch) {
            handleMutationSettled(entityType, idOrKey, patch, true, result)
          }
          return result
        } catch (err) {
          if (patch) {
            handleMutationSettled(entityType, idOrKey, patch, false)
          }
          throw err
        }
      })

    entityQueues.set(key, currentPromise)
    currentPromise.finally(() => {
      if (entityQueues.get(key) === currentPromise) {
        entityQueues.delete(key)
      }
    })

    return currentPromise
  }

  // --- Canonical Optimistic Helper Functions for instant UI response (0ms) ---
  function addTaskToStore(newTask: Task) {
    const exists = tasks.value.some(t => t.id === newTask.id)
    if (!exists) {
      tasks.value = [newTask, ...tasks.value]
    }
  }

  function updateTaskInStore(id: string, patch: Partial<Task>) {
    const idx = tasks.value.findIndex(t => t.id === id || t.taskId === id)
    if (idx !== -1) {
      tasks.value[idx] = { ...tasks.value[idx], ...patch }
    }
  }

  function removeTaskFromStore(id: string) {
    tasks.value = tasks.value.filter(t => t.id !== id && t.taskId !== id)
  }

  function addProjectToStore(newProject: Project) {
    const exists = projects.value.some(p => p.id === newProject.id || p.slug === newProject.slug)
    if (!exists) {
      projects.value = [newProject, ...projects.value]
    }
  }

  function updateProjectInStore(slug: string, patch: Partial<Project>) {
    const idx = projects.value.findIndex(p => p.slug === slug || p.id === slug)
    if (idx !== -1) {
      projects.value[idx] = { ...projects.value[idx], ...patch }
    }
  }

  function removeProjectFromStore(slug: string) {
    projects.value = projects.value.filter(p => p.slug !== slug && p.id !== slug)
  }

  function addSprintToStore(newSprint: Sprint) {
    const exists = sprints.value.some(s => s.id === newSprint.id)
    if (!exists) {
      sprints.value = [newSprint, ...sprints.value]
    }
  }

  function updateSprintInStore(id: string, patch: Partial<Sprint>) {
    const idx = sprints.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      sprints.value[idx] = { ...sprints.value[idx], ...patch }
    }
  }

  function removeSprintFromStore(id: string) {
    sprints.value = sprints.value.filter(s => s.id !== id)
  }

  function addNoteToStore(newNote: ProjectNote) {
    const exists = notes.value.some(n => n.id === newNote.id)
    if (!exists) {
      notes.value = [newNote, ...notes.value]
    }
  }

  function updateNoteInStore(id: string, patch: Partial<ProjectNote>) {
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) {
      notes.value[idx] = { ...notes.value[idx], ...patch }
    }
  }

  function removeNoteFromStore(id: string) {
    notes.value = notes.value.filter(n => n.id !== id)
  }

  return {
    tasks,
    projects,
    sprints,
    notes,
    isLoading,
    isInitialized,
    lastError,
    hydrationStatus,
    entityQueues,
    entityContexts,
    fetchWorkspaceTasks,
    fetchWorkspaceProjects,
    fetchWorkspaceSprints,
    fetchWorkspaceNotes,
    initializeWorkspace,
    refreshWorkspace,
    applyOptimisticPatch,
    handleMutationSettled,
    enqueueEntityMutation,
    addTaskToStore,
    updateTaskInStore,
    removeTaskFromStore,
    addProjectToStore,
    updateProjectInStore,
    removeProjectFromStore,
    addSprintToStore,
    updateSprintInStore,
    removeSprintFromStore,
    addNoteToStore,
    updateNoteInStore,
    removeNoteFromStore
  }
}
