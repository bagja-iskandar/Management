export default defineNitroPlugin(async () => {
    const storage = useStorage('data:')

    // Tasks
    const tasks = await storage.getItem<any[]>('tasks')
    if (!tasks) {
        await storage.setItem('tasks', [
            { id: 1, name: 'Refactor TF-HiTNet fusion', status: 'selesai',  date: '2025-08-18' },
            { id: 2, name: 'Tambah co-attention EEG',  status: 'proses',   date: '2025-08-19' },
            { id: 3, name: 'Tulis dokumentasi Nuxt', status: 'todo',     date: '2025-08-20' },
            { id: 4, name: 'Deploy portfolio', status: 'proses',   date: '2025-08-20' }
        ])
    }

    // Projects (dummy untuk KPI)
    const projects = await storage.getItem<any[]>('projects')
    if (!projects) {
        await storage.setItem('projects', [
            { slug: 'tf-hitnet-eeg', title: 'TF-HiTNet EEG Emotion' },
            { slug: 'nuxt-portfolio', title: 'Nuxt Portfolio' }
        ])
    }

    // Visitors (dummy counter)
    const visits = await storage.getItem<number>('visits')
    if (!visits) await storage.setItem('visits', 1200)
})
