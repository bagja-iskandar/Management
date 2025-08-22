export default defineEventHandler(async (event) => {
    // Abaikan static/asset agar tidak meledak
    const url = event.path || ''
    if (url.startsWith('/_nuxt') || url.startsWith('/__nuxt_error')) return

    const storage = useStorage('data:')
    const v = (await storage.getItem<number>('visits')) ?? 0
    await storage.setItem('visits', v + 1)
})
