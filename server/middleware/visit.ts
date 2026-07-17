import { getValue, setValue } from '../utils/store'

export default defineEventHandler(async (event) => {
  // Only count real HTML page views (Option A): skip assets and API requests
  const url = event.path || ''
  if (url.startsWith('/_nuxt') || url.startsWith('/__nuxt_error')) return

  const headers = getRequestHeaders(event)
  const accept = (headers.accept || '') as string
  if (!accept.includes('text/html')) return

  const visits = (await getValue<number>('visits')) ?? 0
  await setValue('visits', visits + 1)
})
