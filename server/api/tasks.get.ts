import { getArray } from "../utils/store"

export default defineEventHandler(async () => {
    const tasks = await getArray<any>('tasks')
    return tasks
})


