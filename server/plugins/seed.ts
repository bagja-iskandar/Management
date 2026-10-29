import type { Task, Project, Sprint } from '~/types'
import {
  getArray,
  setArray,
  getValue,
  setValue,
  genId,
  migrateNumericIds,
  normalizeTask,
  normalizeProject
} from '../utils/store'

export default defineNitroPlugin(async () => {
  // 0. One-time idempotency guard: prevent clobbering state on subsequent boots
  const isSeeded = await getValue<boolean>('nitro_seed_v2_completed')
  if (isSeeded) {
    return
  }

  await migrateNumericIds<Task>('tasks')

  // 1. Projects: Clean mock projects, preserve or create the real active project
  const projects = await getArray<Project>('projects')
  // Filter out prototype mock projects
  let cleanProjects = projects
    .filter((p) => !['tf-hitnet-eeg', 'neural-signal-lab'].includes(p.slug))
    .map(normalizeProject)

  if (cleanProjects.length === 0) {
    cleanProjects = [
      {
        id: genId(),
        slug: 'management',
        title: 'Management Workspace',
        description: 'Personal engineering command center and workspace telemetry.',
        status: 'active',
        priority: 'high',
        githubRepo: 'bagja-iskandar/Management',
        deployUrl: 'https://nexura-management.vercel.app',
        techStack: ['Nuxt 4', 'Vue 3', 'Tailwind CSS', 'TypeScript'],
        startDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: new Date().toISOString()
      }
    ]
  }
  await setArray('projects', cleanProjects)

  // 2. Sprints / Weekly Focus: Clean mock tasks references without deleting ENG deliverables
  let sprints = await getArray<Sprint>('sprints')
  if (sprints.length === 0) {
    const initialSprint: Sprint = {
      id: genId(),
      name: 'Week 38 · 14–20 Sep 2026',
      status: 'active',
      startDate: '2026-09-14',
      endDate: '2026-09-20',
      taskIds: [],
      objective: 'Connect GitHub integration and establish live engineering workflow.',
      createdAt: '2026-09-14T08:00:00.000Z'
    }
    sprints = [initialSprint]
  } else {
    // Purge only local-* dummy references; PRESERVE ENG deliverables
    sprints = sprints.map((s) => ({
      ...s,
      taskIds: (s.taskIds || []).filter((id) => !id.startsWith('local-'))
    }))
  }
  await setArray('sprints', sprints)

  // 3. Tasks: Purge legacy prototype mocks while preserving all genuine tasks
  const tasks = await getArray<Task>('tasks')
  const realTasks = tasks
    .filter((t) => !t.id.startsWith('local-'))
    .map(normalizeTask)

  await setArray('tasks', realTasks)

  // 4. Reset task sequence counter if only clean tasks remain
  const currentSeq = await getValue<number>('task-seq')
  if (!currentSeq || (currentSeq > 100 && realTasks.length === 0)) {
    await setValue('task-seq', realTasks.length)
  }

  // 5. Mark seeding as completed
  await setValue('nitro_seed_v2_completed', true)
})
