import { getArray, setArray } from '../utils/store'

export default defineEventHandler(async (event) => {
    const body = await readBody<{ name: string; status?: 'todo'|'proses'|'selesai'; date?: string }>(event)
    if (!body?.name) throw createError({ statusCode: 400, statusMessage: 'name required' })

    const tasks = await getArray<any>('tasks')
    const id = tasks.length ? Math.max(...tasks.map((t:any)=>t.id)) + 1 : 1
    const today = new Date().toISOString().slice(0,10)

    const task = {
        id,
        name: body.name,
        status: body.status ?? 'todo',
        date:  body.date ?? today
    }
    tasks.push(task)
    await setArray('tasks', tasks)
    return task
})
