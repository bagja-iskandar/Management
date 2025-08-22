import { getArray, setArray } from '@@/server/utils/store'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    const tasks = await getArray<any>('tasks')
    const next = tasks.filter((t:any)=> t.id !== id)
    if (next.length === tasks.length) throw createError({ statusCode:404, statusMessage:'task not found' })
    await setArray('tasks', next)
    return { ok: true }
})
