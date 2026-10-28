import type { Project } from '~/types'
import { useWorkspaceStore } from './useWorkspaceStore'
import { useSession } from './useSession'

export function useProjects() {
  const workspaceStore = useWorkspaceStore()
  const session = useSession()

  /**
   * Store-First Reading:
   * Returns reactive workspace store projects or initializes workspace once.
   */
  async function getProjects(): Promise<Project[]> {
    if (workspaceStore.isInitialized.value) {
      return workspaceStore.projects.value
    }

    await workspaceStore.initializeWorkspace()
    return workspaceStore.projects.value
  }

  /**
   * Store-First single project reader.
   * Resolves instantly from store if matched by slug or id.
   */
  async function getProject(slug: string): Promise<Project | null> {
    const existing = workspaceStore.projects.value.find(p => p.slug === slug || p.id === slug)
    if (existing) {
      return existing
    }

    try {
      return await $fetch<Project>(`/api/projects/${encodeURIComponent(slug)}`)
    } catch (err: any) {
      session.handleApiError(err)
      return null
    }
  }

  /**
   * Optimistic create with authoritative server resolution.
   * Eliminates blanket refreshNuxtData mass invalidation.
   */
  async function createProject(payload: Partial<Project> & { slug?: string; title: string }): Promise<Project> {
    const tempSlug = payload.slug || `temp-${Date.now()}`
    const tempId = `temp-${Date.now()}`
    const optimisticProject: Project = {
      id: tempId,
      slug: tempSlug,
      title: payload.title,
      description: payload.description,
      status: payload.status || 'active',
      priority: payload.priority || 'medium',
      techStack: payload.techStack || [],
      githubRepo: payload.githubRepo || null,
      deployUrl: payload.deployUrl || null,
      startDate: payload.startDate || null,
      dueDate: payload.dueDate || null,
      releasePhase: payload.releasePhase,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    }

    workspaceStore.addProjectToStore(optimisticProject)

    try {
      const created = await $fetch<Project>('/api/projects', { method: 'POST', body: payload })
      workspaceStore.removeProjectFromStore(tempSlug)
      workspaceStore.addProjectToStore(created)
      return created
    } catch (err: any) {
      workspaceStore.removeProjectFromStore(tempSlug)
      session.handleApiError(err)
      throw err
    }
  }

  /**
   * Protected optimistic update with per-entity serial queue and targeted field rollback.
   */
  async function updateProject(slug: string, patch: Partial<Project>): Promise<Project> {
    return await workspaceStore.enqueueEntityMutation(
      'project',
      slug,
      async () => {
        try {
          const updated = await $fetch<Project>(`/api/projects/${encodeURIComponent(slug)}`, {
            method: 'PUT',
            body: patch
          })
          return updated
        } catch (err: any) {
          session.handleApiError(err)
          throw err
        }
      },
      patch
    )
  }

  /**
   * Optimistic deletion with per-entity serial queue and snapshot recovery on failure.
   */
  async function deleteProject(slug: string): Promise<any> {
    const existingProject = workspaceStore.projects.value.find(p => p.slug === slug || p.id === slug)
    const snapshot = existingProject ? JSON.parse(JSON.stringify(existingProject)) : null
    workspaceStore.removeProjectFromStore(slug)

    return await workspaceStore.enqueueEntityMutation(
      'project',
      slug,
      async () => {
        try {
          const res = await $fetch(`/api/projects/${encodeURIComponent(slug)}`, { method: 'DELETE' })
          return res
        } catch (err: any) {
          if (snapshot) {
            workspaceStore.addProjectToStore(snapshot)
          }
          session.handleApiError(err)
          throw err
        }
      }
    )
  }

  return { getProjects, getProject, createProject, updateProject, deleteProject }
}
