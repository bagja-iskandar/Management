import type { Task, Project } from '~/types'
import { getArray, setArray, getValue, setValue, genId, migrateNumericIds } from '../utils/store'

export default defineNitroPlugin(async () => {
  await migrateNumericIds<Task>('tasks')

  const tasks = await getArray<Task>('tasks')
  if (!tasks.length) {
    await setArray('tasks', [
      { id: genId(), name: 'Refactor TF-HiTNet fusion', status: 'selesai', date: '2025-08-18' },
      { id: genId(), name: 'Tambah co-attention EEG', status: 'proses', date: '2025-08-19' },
      { id: genId(), name: 'Tulis dokumentasi Nuxt', status: 'todo', date: '2025-08-20' },
      { id: genId(), name: 'Deploy portfolio', status: 'proses', date: '2025-08-20' }
    ])
  }

  const projects = await getArray<Project>('projects')
  if (!projects.length) {
    await setArray('projects', [
      { slug: 'tf-hitnet-eeg', title: 'TF-HiTNet EEG Emotion' },
      { slug: 'nuxt-portfolio', title: 'Nuxt Portfolio' }
    ])
  }

  const visits = await getValue<number>('visits')
  if (visits === null) await setValue('visits', 1200)
})
