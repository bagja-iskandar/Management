export * from './useOmniSearch'

/**
 * Backwards compatibility wrapper for useSearch.
 * Internally synchronizes with useOmniSearch.
 */
export function useSearch() {
  const omni = useOmniSearch()

  return {
    ...omni,
    searchQuery: omni.rawQuery,
    setSearch: (query: string) => {
      omni.rawQuery.value = query
    },
    clearSearch: () => {
      omni.rawQuery.value = ''
    }
  }
}
