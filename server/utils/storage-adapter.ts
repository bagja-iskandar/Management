export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>
  setItem<T>(key: string, value: T): Promise<void>
}

export function createStorageAdapter(): StorageAdapter {
  return {
    async getItem<T>(key: string) {
      const storage = useStorage('data:')
      const result = await storage.getItem<T>(key)
      return result === undefined ? null : result
    },

    async setItem<T>(key: string, value: T) {
      const storage = useStorage('data:')
      await storage.setItem(key, value)
    }
  }
}
