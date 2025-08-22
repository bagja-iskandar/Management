import { getArray, setArray } from '@@/server/utils/store'

export default defineEventHandler( async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const patch = await readBody<Partial<{ name:string; status:'todo'|'proses'|'selesai'; date:string }>>(event)

    const tasks = await getArray<any>('tasks')
    const idx = tasks.findIndex((t:any)=> t.id === id)
    if (idx === -1) throw createError({ statusCode:404, statusMessage:'task not found' })

    tasks[idx] = { ...tasks[idx], ...patch }
    await setArray('tasks', tasks)
    return tasks[idx]
})
