import { ref, watch, onUnmounted, type Ref } from 'vue'

export interface UseModalLifecycleOptions {
  isOpen: Ref<boolean>
  panelRef?: Ref<HTMLElement | null | undefined>
  onClose?: () => void
  trapFocus?: boolean
  preventScroll?: boolean
  restoreFocus?: boolean
}

/**
 * Shared modal lifecycle composable providing:
 * 1. Body scroll lock during active visibility
 * 2. Escape key handling bound only while modal is open
 * 3. Focus trap within modal container
 * 4. Safe focus restoration guard (prevents focusing OmniSearch triggers)
 */
export function useModalLifecycle(options: UseModalLifecycleOptions) {
  const {
    isOpen,
    panelRef,
    onClose,
    trapFocus = true,
    preventScroll = true,
    restoreFocus = true
  } = options

  const previousActiveElement = ref<HTMLElement | null>(null)
  let previousBodyOverflow = ''

  function isOmniSearchElement(el: Element | null): boolean {
    if (!el) return false
    return (
      el.hasAttribute('data-omni-input') ||
      el.getAttribute('role') === 'combobox' ||
      el.id === 'header-search-input' ||
      el.classList.contains('omni-search-input')
    )
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen.value) return

    if (e.key === 'Escape') {
      e.stopPropagation()
      if (onClose) onClose()
      return
    }

    if (e.key === 'Tab' && trapFocus && panelRef?.value) {
      const focusableEls = panelRef.value.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusableEls.length === 0) return

      const firstEl = focusableEls[0]
      const lastEl = focusableEls[focusableEls.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
  }

  function lockScroll() {
    if (typeof document === 'undefined') return
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  function unlockScroll() {
    if (typeof document === 'undefined') return
    document.body.style.overflow = previousBodyOverflow || ''
  }

  function saveFocus() {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      if (!isOmniSearchElement(document.activeElement)) {
        previousActiveElement.value = document.activeElement
      } else {
        previousActiveElement.value = null
      }
    }
  }

  function restorePreviousFocus() {
    if (!restoreFocus || !previousActiveElement.value) return
    const el = previousActiveElement.value
    if (!isOmniSearchElement(el) && typeof el.focus === 'function') {
      try {
        el.focus()
      } catch {}
    }
    previousActiveElement.value = null
  }

  watch(
    isOpen,
    (open) => {
      if (typeof window === 'undefined') return
      if (open) {
        saveFocus()
        if (preventScroll) lockScroll()
        window.addEventListener('keydown', handleKeydown)
      } else {
        if (preventScroll) unlockScroll()
        window.removeEventListener('keydown', handleKeydown)
        restorePreviousFocus()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown)
      if (isOpen.value && preventScroll) {
        unlockScroll()
      }
    }
  })

  return {
    handleKeydown
  }
}
