export function useProjects() {
  async function getProjects() {
    return await $fetch('/api/projects')
  }

  return { getProjects }
}
