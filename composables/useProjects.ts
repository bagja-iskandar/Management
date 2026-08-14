import type { Project } from '~/types'

export function useProjects() {
  async function getProjects() {
    return await $fetch<Project[]>('/api/projects')
  }

  return { getProjects }
}

