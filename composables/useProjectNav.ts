export type ProjectTabId = 'dashboard' | 'deliverables' | 'kanban' | 'matrix' | 'github' | 'vercel' | 'notes' | 'settings'

export function useProjectNav() {
  const activeTab = useState<ProjectTabId>('projectNav_activeTab', () => 'dashboard')
  const deliverableViewMode = useState<'kanban' | 'table'>('projectNav_deliverableViewMode', () => 'kanban')
  const tasksCount = useState<number>('projectNav_tasksCount', () => 0)
  const matrixCount = useState<number>('projectNav_matrixCount', () => 0)
  const commitsCount = useState<number>('projectNav_commitsCount', () => 0)
  const hasGithub = useState<boolean>('projectNav_hasGithub', () => false)

  function setActiveTab(tab: ProjectTabId) {
    if (tab === 'kanban') {
      activeTab.value = 'deliverables'
      deliverableViewMode.value = 'kanban'
      return
    }
    if (tab === 'matrix') {
      activeTab.value = 'deliverables'
      deliverableViewMode.value = 'table'
      return
    }
    activeTab.value = tab
  }

  function setViewMode(mode: 'kanban' | 'table') {
    deliverableViewMode.value = mode
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
    deliverableViewMode,
    tasksCount,
    matrixCount,
    commitsCount,
    hasGithub,
    setActiveTab,
    setViewMode,
    setCounts
  }
}
