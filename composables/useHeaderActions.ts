import { ref, computed } from 'vue'

export type HeaderActionVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface HeaderButtonAction {
  type?: 'button'
  id: string
  label: string
  icon?: any
  variant?: HeaderActionVariant
  size?: 'xs' | 'sm' | 'md'
  shortcut?: string
  disabled?: boolean
  loading?: boolean
  handler: () => void | Promise<void>
}

export interface HeaderSegmentedAction {
  type: 'segmented'
  id: string
  modelValue: string | number
  options: Array<{
    value: string | number
    label: string
    icon?: any
    count?: number
    disabled?: boolean
  }>
  size?: 'xs' | 'sm' | 'md'
  onChange: (val: any) => void
}

export type HeaderAction = HeaderButtonAction | HeaderSegmentedAction

// Module-level reactive singleton state (avoids SSR devalue serialization error for functions)
const actionsState = ref<HeaderAction[]>([])

export function useHeaderActions() {
  function setActions(actions: HeaderAction[]) {
    // Pada server SSR (non-test), jangan isi aksi agar tidak terjadi cross-request leakage di server
    if ((import.meta as any).server && process.env.NODE_ENV !== 'test') {
      return
    }
    actionsState.value = actions
  }

  function clearActions() {
    actionsState.value = []
  }

  return {
    actions: computed(() => actionsState.value),
    setActions,
    clearActions
  }
}
