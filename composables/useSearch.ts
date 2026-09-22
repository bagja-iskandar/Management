export function useSearch() {
  const searchQuery = useState<string>('nexura:search_query', () => '')

  function setSearch(query: string) {
    searchQuery.value = query
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  return {
    searchQuery,
    setSearch,
    clearSearch
  }
}
