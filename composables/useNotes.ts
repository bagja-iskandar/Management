import { ref, computed } from 'vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import type { ProjectNote, NoteCategory, Task, TaskStatus, TaskPriority } from '~/types'

export interface CreateNoteInput {
  projectSlug?: string | null
  category?: NoteCategory
  content: string
}

/**
 * Shared notes composable providing CRUD operations and smart Kanban promotion.
 * Synchronizes directly with useWorkspaceStore.notes.
 */
export function useNotes() {
  const workspaceStore = useWorkspaceStore()
  const promotingNoteId = ref<string | null>(null)
  const isSubmitting = ref(false)

  const notes = computed(() => workspaceStore.notes.value)

  async function fetchNotes(projectSlug?: string): Promise<ProjectNote[]> {
    return await workspaceStore.fetchWorkspaceNotes(projectSlug)
  }

  async function createNote(input: CreateNoteInput): Promise<ProjectNote> {
    const tempId = 'temp-note-' + Date.now()
    const now = new Date().toISOString()
    const pSlug = input.projectSlug || 'management'
    const category: NoteCategory = input.category || 'idea'

    const optimisticNote: ProjectNote = {
      id: tempId,
      projectSlug: pSlug,
      category,
      content: input.content.trim(),
      promotedTaskId: null,
      createdAt: now,
      updatedAt: now
    }

    workspaceStore.addNoteToStore(optimisticNote)
    isSubmitting.value = true

    try {
      const res = await $fetch<ProjectNote>('/api/notes', {
        method: 'POST',
        body: {
          projectSlug: pSlug,
          category,
          content: optimisticNote.content
        }
      })

      if (res && res.id) {
        workspaceStore.updateNoteInStore(tempId, res)
        return res
      }
      return optimisticNote
    } catch (err) {
      console.warn('[useNotes] Failed to create note on server, keeping optimistic note:', err)
      return optimisticNote
    } finally {
      isSubmitting.value = false
    }
  }

  async function updateNote(id: string, patch: Partial<ProjectNote>): Promise<ProjectNote | null> {
    const existing = notes.value.find((n) => n.id === id)
    if (!existing) return null

    return await workspaceStore.enqueueEntityMutation(
      'note',
      id,
      async () => {
        try {
          const res = await $fetch<ProjectNote>(`/api/notes/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: patch
          })
          if (res) {
            workspaceStore.updateNoteInStore(id, res)
            return res
          }
          return { ...existing, ...patch, updatedAt: new Date().toISOString() }
        } catch (err) {
          console.warn('[useNotes] Failed to update note on server:', err)
          throw err
        }
      },
      patch
    )
  }

  async function deleteNote(id: string): Promise<void> {
    const existing = notes.value.find((n) => n.id === id)
    const snapshot = existing ? JSON.parse(JSON.stringify(existing)) : null
    workspaceStore.removeNoteFromStore(id)

    return await workspaceStore.enqueueEntityMutation(
      'note',
      id,
      async () => {
        try {
          await $fetch(`/api/notes/${encodeURIComponent(id)}`, { method: 'DELETE' })
        } catch (err: any) {
          const status = err?.statusCode || err?.data?.statusCode || err?.response?.status
          if (status === 404) {
            console.warn(`[useNotes.deleteNote] Note ${id} already removed from server (404), skipping rollback.`)
            return
          }
          if (snapshot) {
            workspaceStore.addNoteToStore(snapshot)
          }
          throw err
        }
      }
    )
  }

  async function promoteNoteToTask(note: ProjectNote): Promise<Task> {
    if (promotingNoteId.value) {
      throw new Error('Another note is currently being promoted')
    }
    promotingNoteId.value = note.id

    try {
      const res = await $fetch<{ success: boolean; task: Task; note?: ProjectNote }>(
        `/api/notes/${encodeURIComponent(note.id)}/promote`,
        { method: 'POST' }
      )

      if (res && res.task) {
        workspaceStore.addTaskToStore(res.task)
        workspaceStore.updateNoteInStore(note.id, {
          promotedTaskId: res.task.id,
          updatedAt: new Date().toISOString()
        })
        return res.task
      }
      throw new Error('Promotion response did not contain task')
    } catch (err) {
      console.error('[useNotes] Remote note promotion failed:', err)
      throw err
    } finally {
      promotingNoteId.value = null
    }
  }

  return {
    notes,
    promotingNoteId,
    isSubmitting,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    promoteNoteToTask
  }
}
