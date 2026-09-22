import type { Project } from '~/types'

export function useProjects() {
  async function getProjects() {
    return await $fetch<Project[]>('/api/projects')
  }

  async function getProject(slug: string) {
    const list = await getProjects()
    return list.find((p) => p.slug === slug) || null
  }

  async function createProject(payload: Partial<Project> & { slug?: string; title: string }) {
    const created = await $fetch<Project>('/api/projects', { method: 'POST', body: payload })
    try {
      refreshNuxtData(['projects', 'projects-detail', 'repos-projects-list', 'roadmap-projects'])
    } catch {}
    return created
  }

  async function updateProject(slug: string, patch: Partial<Project>) {
    const updated = await $fetch<Project>(`/api/projects/${slug}`, { method: 'PUT', body: patch })
    try {
      refreshNuxtData(['projects', 'projects-detail', 'repos-projects-list', 'roadmap-projects'])
    } catch {}
    return updated
  }

  async function deleteProject(slug: string) {
    const res = await $fetch(`/api/projects/${slug}`, { method: 'DELETE' })
    try {
      refreshNuxtData(['projects', 'projects-detail', 'repos-projects-list', 'roadmap-projects'])
    } catch {}
    return res
  }

  return { getProjects, getProject, createProject, updateProject, deleteProject }
}
