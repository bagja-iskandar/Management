import { getArray } from '../utils/store'   // atau '~/server/utils/store'

type Task = {
    id: number
    name: string
    status: 'todo' | 'proses' | 'selesai'
    date: string
}

export default defineEventHandler(async () => {
    const tasks = await getArray<Task>('tasks')

    return tasks
        .slice()
        .sort((a: Task, b: Task) => b.date.localeCompare(a.date))
        .map((t) => ({ id: t.id, name: t.name, status: t.status, date: t.date }))
})
