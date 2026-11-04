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

    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    workspaceStore.updateNoteInStore(id, patch)

    try {
      const res = await $fetch<ProjectNote>(`/api/notes/${id}`, {
        method: 'PUT',
        body: patch
      })
      if (res) {
        workspaceStore.updateNoteInStore(id, res)
        return res
      }
      return updated
    } catch (err) {
      console.warn('[useNotes] Failed to update note on server:', err)
      return updated
    }
  }

  async function deleteNote(id: string): Promise<void> {
    const existing = notes.value.find((n) => n.id === id)
    workspaceStore.removeNoteFromStore(id)

    try {
      await $fetch(`/api/notes/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('[useNotes] Failed to delete note on server:', err)
      if (existing) {
        workspaceStore.addNoteToStore(existing)
      }
      throw err
    }
  }

  async function promoteNoteToTask(note: ProjectNote): Promise<Task> {
    if (promotingNoteId.value) {
      throw new Error('Another note is currently being promoted')
    }
    promotingNoteId.value = note.id

    try {
      const res = await $fetch<{ success: boolean; task: Task; note?: ProjectNote }>(
        `/api/notes/${note.id}/promote`,
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
      console.warn('[useNotes] Remote promote failed, performing optimistic promotion fallback:', err)

      const firstLine = note.content.split('\n')[0].replace(/^[-*#\s]+/, '').trim()
      const taskTitle = firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine || 'Promoted Idea'

      let fallbackStatus: TaskStatus = 'idea'
      let fallbackPriority: TaskPriority = 'medium'

      if (note.category === 'bug') {
        fallbackStatus = 'in_queue'
        fallbackPriority = 'high'
      } else if (note.category === 'maintenance') {
        fallbackStatus = 'in_queue'
        fallbackPriority = 'medium'
      }

      const localNewTask: Task = {
        id: 'task-' + Date.now(),
        taskId: 'ENG-' + Math.floor(100 + Math.random() * 900),
        projectSlug: note.projectSlug || null,
        name: taskTitle,
        description: note.content,
        status: fallbackStatus,
        priority: fallbackPriority,
        techTags: [note.category],
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      workspaceStore.addTaskToStore(localNewTask)
      workspaceStore.updateNoteInStore(note.id, {
        promotedTaskId: localNewTask.id
      })

      return localNewTask
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
