import { computed, type Ref, type WritableComputedRef } from 'vue'
import {
  parseChecklist,
  toggleChecklistStep,
  appendChecklistStep,
  removeChecklistStep,
  type ChecklistItem
} from '~/utils/markdown-checklist'

export interface ChecklistStats {
  total: number
  completed: number
  percentage: number
}

/**
 * Reactive checklist composable wrapping pure markdown-checklist utilities.
 */
export function useMarkdownChecklist(description: Ref<string> | WritableComputedRef<string>) {
  const checklistItems = computed<ChecklistItem[]>(() => {
    return parseChecklist(description.value || '')
  })

  const checklistStats = computed<ChecklistStats>(() => {
    const total = checklistItems.value.length
    const completed = checklistItems.value.filter((i) => i.completed).length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, percentage }
  })

  function toggle(stepIndex: number): string {
    const updated = toggleChecklistStep(description.value || '', stepIndex)
    description.value = updated
    return updated
  }

  function add(stepText: string): string {
    const updated = appendChecklistStep(description.value || '', stepText)
    description.value = updated
    return updated
  }

  function remove(stepIndex: number): string {
    const updated = removeChecklistStep(description.value || '', stepIndex)
    description.value = updated
    return updated
  }

  return {
    checklistItems,
    checklistStats,
    toggle,
    add,
    remove
  }
}
