export function useStats() {
  async function getStats() {
    return await $fetch('/api/stats')
  }

  return { getStats }
}
