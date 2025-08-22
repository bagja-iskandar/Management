export default defineEventHandler( async () => {
    const storage = useStorage('data:')
    const tasks    = (await storage.getItem<any[]>('tasks'))    ?? []
    const projects = (await storage.getItem<any[]>('projects')) ?? []
    const visits   = (await storage.getItem<number>('visits'))  ?? 0

    const selesai = tasks.filter(t=> t.status === 'selesai').length
    const bugs    = tasks.filter(t=> /bug/i.test(t.name) || t.status === 'todo').length // simple proxy

    return [
        { label: 'Total Project', value: projects.length, delta: '+2', trend: 'up' },
        { label: 'Task Selesai',  value: selesai,         delta: '+1', trend: 'up' },
        { label: 'Bug Terbuka',   value: bugs,            delta: '-1', trend: 'down' },
        { label: 'Pengunjung',    value: visits,          delta: '+10', trend: 'up' },
    ]
})
