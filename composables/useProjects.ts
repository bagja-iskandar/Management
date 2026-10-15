import type { Project } from '~/types'

const PROJECT_REFRESH_KEYS = [
  'projects',
  'projects-detail',
  'projects-data',
  'projects-list',
  'repos-projects-list',
  'roadmap-projects',
  'tasks-projects',
  'header-projects'
]

export function useProjects() {
  async function getProjects() {
    return await $fetch<Project[]>('/api/projects')
  }

  async function getProject(slug: string) {
    try {
      return await $fetch<Project>(`/api/projects/${encodeURIComponent(slug)}`)
    } catch {
      return null
    }
  }

  async function createProject(payload: Partial<Project> & { slug?: string; title: string }) {
    const created = await $fetch<Project>('/api/projects', { method: 'POST', body: payload })
    try {
      refreshNuxtData(PROJECT_REFRESH_KEYS)
    } catch {}
    return created
  }

  async function updateProject(slug: string, patch: Partial<Project>) {
    const updated = await $fetch<Project>(`/api/projects/${slug}`, { method: 'PUT', body: patch })
    try {
      refreshNuxtData(PROJECT_REFRESH_KEYS)
    } catch {}
    return updated
  }

  async function deleteProject(slug: string) {
    const res = await $fetch(`/api/projects/${slug}`, { method: 'DELETE' })
    try {
      refreshNuxtData(PROJECT_REFRESH_KEYS)
    } catch {}
    return res
  }

  return { getProjects, getProject, createProject, updateProject, deleteProject }
}
