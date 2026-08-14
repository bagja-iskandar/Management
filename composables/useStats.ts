import type { Stat } from '~/types'

export function useStats() {
  async function getStats() {
    return await $fetch<Stat[]>('/api/stats')
  }

  return { getStats }
}

