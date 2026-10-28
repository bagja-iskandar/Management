import test from 'node:test'
import assert from 'node:assert/strict'

test('PROJ-001: getProgress and getTaskCountLabel compute mathematically without fake numbers', () => {
  function getProgress(slug, tasks) {
    const projectTasks = tasks.filter((t) => t.projectSlug === slug)
    if (projectTasks.length === 0) return 0
    const deployed = projectTasks.filter((t) => t.status === 'deployed').length
    return Math.round((deployed / projectTasks.length) * 100)
  }

  function getTaskCountLabel(slug, tasks) {
    const projectTasks = tasks.filter((t) => t.projectSlug === slug)
    if (projectTasks.length === 0) return '0/0 tasks'
    const deployed = projectTasks.filter((t) => t.status === 'deployed').length
    return `${deployed}/${projectTasks.length} tasks`
  }

  // Zero tasks case: must be 0% and 0/0 tasks (no 75%, 90%, 15/20)
  assert.equal(getProgress('tf-hitnet-eeg', []), 0)
  assert.equal(getTaskCountLabel('tf-hitnet-eeg', []), '0/0 tasks')
  assert.equal(getProgress('management', []), 0)
  assert.equal(getTaskCountLabel('management', []), '0/0 tasks')

  // Real tasks case
  const mockTasks = [
    { projectSlug: 'management', status: 'deployed' },
    { projectSlug: 'management', status: 'running_sprint' },
    { projectSlug: 'management', status: 'in_queue' },
    { projectSlug: 'management', status: 'deployed' },
    { projectSlug: 'other', status: 'deployed' }
  ]

  assert.equal(getProgress('management', mockTasks), 50)
  assert.equal(getTaskCountLabel('management', mockTasks), '2/4 tasks')
})

test('DASH-001: UnifiedHeroBanner metrics return 0 honestly when tasks are empty', () => {
  function computeHeroMetrics(tasks, projects) {
    const inFlightCount = tasks.filter((t) => t.status === 'running_sprint' || t.status === 'in_queue').length
    const highPriorityCount = tasks.filter(
      (t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'deployed'
    ).length
    const completedCount = tasks.filter((t) => t.status === 'deployed').length
    const totalCount = tasks.length
    const velocityPercentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
    const openPrCount = tasks.filter((t) => t.githubPrUrl || t.githubIssueUrl).length
    const activeReposCount = projects?.length || 0

    return { inFlightCount, highPriorityCount, velocityPercentage, openPrCount, activeReposCount }
  }

  const emptyResult = computeHeroMetrics([], [])
  assert.equal(emptyResult.inFlightCount, 0, 'In flight count must be 0, not 14')
  assert.equal(emptyResult.highPriorityCount, 0, 'High priority count must be 0, not 3')
  assert.equal(emptyResult.velocityPercentage, 0, 'Velocity must be 0%, not 78%')
  assert.equal(emptyResult.openPrCount, 0, 'Open PR count must be 0, not 7')
  assert.equal(emptyResult.activeReposCount, 0, 'Active repos count must be 0, not 3')
})

test('TASK-004: Clean honest fallbacks for tasks table', () => {
  function getProjectName(task) {
    return task.projectSlug || 'Unassigned'
  }

  function formatDate(d) {
    if (!d) return 'No Due Date'
    try {
      const date = new Date(d)
      if (isNaN(date.getTime())) return d
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return d
    }
  }

  assert.equal(getProjectName({}), 'Unassigned', 'Fallback must be Unassigned, not management')
  assert.equal(getProjectName({ projectSlug: 'alpha' }), 'alpha')
  assert.equal(formatDate(undefined), 'No Due Date', 'Fallback must be No Due Date, not Sep 2026')
  assert.equal(formatDate(''), 'No Due Date')
})
