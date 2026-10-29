import { getValue, setValue } from '../utils/store'

export default defineEventHandler((event) => {
  // Only count real HTML page views: skip assets and API requests
  const url = event.path || ''
  if (url.startsWith('/_nuxt') || url.startsWith('/__nuxt_error') || url.startsWith('/api/')) return

  const headers = getRequestHeaders(event)
  const accept = (headers.accept || '') as string
  if (!accept.includes('text/html')) return

  // Non-blocking visit telemetry
  const recordVisit = async () => {
    try {
      const visits = (await getValue<number>('visits')) ?? 0
      await setValue('visits', visits + 1)
    } catch {
      // Non-critical telemetry error ignored
    }
  }

  if (typeof event.waitUntil === 'function') {
    event.waitUntil(recordVisit())
  } else {
    recordVisit()
  }
})
