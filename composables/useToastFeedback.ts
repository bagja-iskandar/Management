export interface ToastMessage {
  id: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

let activeToastTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Shared global toast feedback notification composable.
 */
export function useToastFeedback() {
  const toast = useState<ToastMessage | null>('global:toast', () => null)

  function showToast(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration = 3000
  ) {
    if (activeToastTimer) {
      clearTimeout(activeToastTimer)
      activeToastTimer = null
    }

    toast.value = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      duration
    }

    if (duration > 0 && typeof window !== 'undefined') {
      activeToastTimer = setTimeout(() => {
        dismissToast()
      }, duration)
    }
  }

  function dismissToast() {
    if (activeToastTimer) {
      clearTimeout(activeToastTimer)
      activeToastTimer = null
    }
    toast.value = null
  }

  return {
    toast,
    showToast,
    dismissToast
  }
}
