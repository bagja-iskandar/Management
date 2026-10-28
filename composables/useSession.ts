import { computed } from 'vue'

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated'

export interface SessionInfo {
  authenticated: boolean
  expiresAt?: string
  message?: string
}

export function useSession() {
  // Memory-only reactive state (zero persistent storage in localStorage/sessionStorage/JS cookies)
  const authStatus = useState<AuthStatus>('session:auth_status', () => 'unknown')
  const isAuthenticated = computed(() => authStatus.value === 'authenticated')
  const isAuthModalOpen = useState<boolean>('session:modal_open', () => false)
  const authError = useState<string | null>('session:auth_error', () => null)
  const isSubmitting = useState<boolean>('session:submitting', () => false)
  const networkWarning = useState<string | null>('session:network_warning', () => null)
  const csrfWarning = useState<string | null>('session:csrf_warning', () => null)

  /**
   * Check active session against GET /api/auth/session.
   * Safe check that never throws; updates authStatus accordingly.
   */
  async function checkSession(): Promise<boolean> {
    try {
      const res = await $fetch<SessionInfo>('/api/auth/session')
      if (res && res.authenticated) {
        authStatus.value = 'authenticated'
        return true
      }
      authStatus.value = 'unauthenticated'
      return false
    } catch {
      authStatus.value = 'unauthenticated'
      return false
    }
  }

  /**
   * Authenticate using access key via POST /api/auth/session.
   * On success: sets authStatus to 'authenticated', closes modal, clears error.
   * On failure: sets authError and returns false.
   * Zero persistent storage in JavaScript; server sets HttpOnly cookie.
   */
  async function loginWithAccessKey(accessKey: string): Promise<boolean> {
    authError.value = null
    isSubmitting.value = true
    try {
      const res = await $fetch<{ success: boolean; message?: string }>('/api/auth/session', {
        method: 'POST',
        body: { accessKey }
      })

      if (res?.success) {
        authStatus.value = 'authenticated'
        isAuthModalOpen.value = false
        authError.value = null
        return true
      }

      authError.value = 'Invalid access key'
      return false
    } catch (err: any) {
      const status = err?.statusCode || err?.status || err?.response?.status
      if (status === 401) {
        authError.value = 'Invalid access key'
      } else {
        authError.value = err?.data?.message || err?.message || 'Authentication failed'
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Centralized API error interceptor and policy coordinator.
   * - 401 UNAUTHORIZED: marks unauthenticated, triggers session auth modal, retains store.
   * - 403 CSRF_BLOCKED: flags CSRF warning without prompting for password/modal.
   * - Offline/Network: flags network warning without data destruction.
   * - 500: records server error telemetry.
   * NOTE: Strict No Auto-Retry policy (mutations are not automatically resent).
   */
  function handleApiError(error: any): void {
    const status = error?.statusCode || error?.status || error?.response?.status
    const code = error?.data?.code || error?.code

    if (status === 401 || code === 'UNAUTHORIZED') {
      authStatus.value = 'unauthenticated'
      isAuthModalOpen.value = true
      return
    }

    if (status === 403 || code === 'CSRF_BLOCKED') {
      csrfWarning.value = 'CSRF verification failed. Request blocked for security.'
      console.warn('[useSession] CSRF blocked action:', error?.message || error)
      return
    }

    if (
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      error?.message?.includes('fetch failed') ||
      error?.name === 'FetchError' ||
      error?.code === 'ECONNREFUSED'
    ) {
      networkWarning.value = 'Network connection interrupted. Workspace changes are preserved locally.'
      console.warn('[useSession] Network error:', error?.message || error)
      return
    }

    if (status >= 500) {
      console.error('[useSession] Server telemetry error:', status, error?.message || error)
      return
    }

    console.error('[useSession] Unhandled API error:', error)
  }

  function openAuthModal() {
    authError.value = null
    isAuthModalOpen.value = true
  }

  function closeAuthModal() {
    isAuthModalOpen.value = false
    authError.value = null
  }

  function clearWarnings() {
    networkWarning.value = null
    csrfWarning.value = null
  }

  return {
    authStatus,
    isAuthenticated,
    isAuthModalOpen,
    authError,
    isSubmitting,
    networkWarning,
    csrfWarning,
    checkSession,
    loginWithAccessKey,
    handleApiError,
    openAuthModal,
    closeAuthModal,
    clearWarnings
  }
}
