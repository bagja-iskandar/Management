export type ProjectTabId = 'dashboard' | 'kanban' | 'matrix' | 'github' | 'vercel' | 'supabase'

export function useProjectNav() {
  const activeTab = useState<ProjectTabId>('projectNav_activeTab', () => 'dashboard')
  const tasksCount = useState<number>('projectNav_tasksCount', () => 0)
  const matrixCount = useState<number>('projectNav_matrixCount', () => 0)
  const commitsCount = useState<number>('projectNav_commitsCount', () => 0)
  const hasGithub = useState<boolean>('projectNav_hasGithub', () => false)

  function setActiveTab(tab: ProjectTabId) {
    activeTab.value = tab
  }

  function setCounts(counts: {
    tasks?: number
    matrix?: number
    commits?: number
    hasGithub?: boolean
  }) {
    if (counts.tasks !== undefined) tasksCount.value = counts.tasks
    if (counts.matrix !== undefined) matrixCount.value = counts.matrix
    if (counts.commits !== undefined) commitsCount.value = counts.commits
    if (counts.hasGithub !== undefined) hasGithub.value = counts.hasGithub
  }

  return {
    activeTab,
    tasksCount,
    matrixCount,
    commitsCount,
    hasGithub,
    setActiveTab,
    setCounts
  }
}
