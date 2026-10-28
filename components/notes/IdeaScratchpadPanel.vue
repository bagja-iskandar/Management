<template>
  <div
    class="flex flex-col bg-[#0D0E12] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden transition-all duration-200"
    :class="containerClass"
  >
    <!-- Header Bar -->
    <div class="px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#111318]/60 backdrop-blur-sm">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <NexuraIcon name="Lightbulb" size="sm" />
        </div>
        <div>
          <h2 class="text-sm font-semibold text-[#F3F4F6] flex items-center gap-2">
            <span>Idea Scratchpad & Bug Inbox</span>
            <span class="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.08] text-[#8A8F9E]">
              {{ filteredNotes.length }}
            </span>
          </h2>
          <p class="text-[11px] text-[#8A8F9E]">Quick capture thoughts, defects, & maintenance items</p>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          v-if="isDrawer"
          type="button"
          class="p-1.5 rounded-lg text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/5 transition-colors focus:outline-none"
          title="Close panel"
          @click="$emit('close')"
        >
          <NexuraIcon name="X" size="sm" />
        </button>
      </div>
    </div>

    <!-- Quick Capture Bar -->
    <div class="p-4 border-b border-white/[0.08] bg-[#111318]/40 space-y-3 shrink-0">
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <!-- Category Pill Selection -->
        <div class="flex items-center gap-1.5 p-1 rounded-xl bg-[#07080A] border border-white/[0.06]">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            :class="category === 'idea'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/5 border border-transparent'"
            @click="category = 'idea'"
          >
            <NexuraIcon name="Sparkles" size="xs" :class="category === 'idea' ? 'text-amber-400' : 'text-[#8A8F9E]'" />
            <span>Idea</span>
          </button>

          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            :class="category === 'bug'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/5 border border-transparent'"
            @click="category = 'bug'"
          >
            <NexuraIcon name="Bug" size="xs" :class="category === 'bug' ? 'text-rose-400' : 'text-[#8A8F9E]'" />
            <span>Bug</span>
          </button>

          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            :class="category === 'maintenance'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/5 border border-transparent'"
            @click="category = 'maintenance'"
          >
            <NexuraIcon name="Wrench" size="xs" :class="category === 'maintenance' ? 'text-indigo-400' : 'text-[#8A8F9E]'" />
            <span>Maintenance</span>
          </button>
        </div>

        <!-- Project Selector Dropdown -->
        <div class="flex items-center gap-1.5">
          <label for="project-select" class="text-[11px] font-mono text-[#8A8F9E] hidden sm:inline">Project:</label>
          <div class="relative">
            <select
              id="project-select"
              v-model="selectedProjectSlug"
              class="appearance-none bg-[#07080A] border border-white/[0.08] hover:border-white/[0.15] text-[#F3F4F6] text-xs font-mono rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="" disabled>Select project...</option>
              <option
                v-for="proj in availableProjects"
                :key="proj.slug"
                :value="proj.slug"
              >
                {{ proj.title || proj.slug }}
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8A8F9E]">
              <NexuraIcon name="ChevronDown" size="xs" />
            </div>
          </div>
        </div>
      </div>

      <!-- Textarea with shortcut hint -->
      <div class="relative">
        <textarea
          ref="textareaRef"
          v-model="newContent"
          rows="2"
          placeholder="Capture a raw idea, defect note, or technical chore... (Ctrl+Enter to save)"
          class="w-full bg-[#07080A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 resize-none transition-all font-sans"
          @keydown.ctrl.enter.prevent="submitNote"
          @keydown.meta.enter.prevent="submitNote"
        ></textarea>

        <div class="flex items-center justify-between pt-1 px-1">
          <span class="text-[10px] font-mono text-[#565B68]">Press <kbd class="px-1 py-0.5 rounded bg-white/5 border border-white/[0.08] text-[#8A8F9E]">Ctrl+Enter</kbd> to save</span>
          <button
            type="button"
            :disabled="!newContent.trim() || isSubmitting"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            :class="categorySubmitButtonClass"
            @click="submitNote"
          >
            <NexuraIcon v-if="!isSubmitting" name="Plus" size="xs" />
            <NexuraIcon v-else name="Loader2" size="xs" class="animate-spin" />
            <span>Capture Note</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Tabs & Search -->
    <div class="px-4 py-2 border-b border-white/[0.06] bg-[#0A0B0E] flex items-center justify-between gap-2 shrink-0">
      <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          v-for="tab in filterTabs"
          :key="tab.id"
          type="button"
          class="px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
          :class="activeFilter === tab.id
            ? 'bg-white/10 text-[#F3F4F6] font-semibold'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/5'"
          @click="activeFilter = tab.id"
        >
          <span>{{ tab.label }}</span>
          <span class="text-[9px] px-1 rounded-full bg-white/5 tabular-nums">{{ tab.count }}</span>
        </button>
      </div>

      <div class="relative w-36 sm:w-48 shrink-0">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter notes..."
          class="w-full bg-[#111318] border border-white/[0.06] rounded-md pl-7 pr-2 py-1 text-[11px] text-[#F3F4F6] placeholder-[#565B68] focus:outline-none focus:border-indigo-500/40"
        />
        <NexuraIcon name="Search" size="xs" class="absolute left-2 top-2 text-[#565B68]" />
      </div>
    </div>

    <!-- Notes List Body -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 custom-scrollbar">
      <!-- Empty state -->
      <div
        v-if="!filteredNotes.length"
        class="h-44 flex flex-col items-center justify-center text-center border border-dashed border-white/[0.08] rounded-xl p-4 bg-[#07080A]/40"
      >
        <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8A8F9E] mb-2">
          <NexuraIcon name="Sparkles" size="sm" />
        </div>
        <p class="text-xs font-mono text-[#F3F4F6] font-medium">No notes in this view</p>
        <p class="text-[11px] text-[#8A8F9E] mt-0.5 max-w-xs">
          Capture fresh thoughts, edge-case bugs, or maintenance ideas using the bar above.
        </p>
      </div>

      <!-- Note Cards -->
      <div
        v-for="note in filteredNotes"
        :key="note.id"
        class="group relative bg-[#111318]/70 border border-white/[0.06] hover:border-white/[0.14] rounded-xl p-3.5 transition-all duration-150 flex flex-col gap-2.5"
        :class="[
          note.category === 'idea' ? 'hover:border-amber-500/30' : '',
          note.category === 'bug' ? 'hover:border-rose-500/30' : '',
          note.category === 'maintenance' ? 'hover:border-indigo-500/30' : '',
          note.promotedTaskId ? 'opacity-85 bg-[#090A0D]' : ''
        ]"
      >
        <!-- Header row of note card: Badge, Project, Time, Delete button -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            <!-- Category Badge -->
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] tabular-nums uppercase font-semibold border"
              :class="getCategoryBadgeClass(note.category)"
            >
              <NexuraIcon :name="getCategoryIcon(note.category)" size="xs" />
              <span>{{ note.category }}</span>
            </span>

            <!-- Project Tag -->
            <span
              v-if="note.projectSlug"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] bg-white/5 border border-white/[0.06] text-[#8A8F9E]"
            >
              <NexuraIcon name="Folder" size="xs" />
              <span>{{ note.projectSlug }}</span>
            </span>

            <!-- Relative Timestamp -->
            <span class="text-[10px] font-mono text-[#565B68]">
              {{ formatRelativeTime(note.createdAt) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-1 rounded text-[#565B68] hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus:outline-none cursor-pointer"
              title="Delete note"
              @click="deleteNote(note.id)"
            >
              <NexuraIcon name="Trash2" size="xs" />
            </button>
          </div>
        </div>

        <!-- Note Content -->
        <p class="text-xs text-[#F3F4F6] font-sans whitespace-pre-wrap leading-relaxed select-text">
          {{ note.content }}
        </p>

        <!-- Footer / Promote Action -->
        <div class="pt-2 border-t border-white/[0.04] flex items-center justify-between gap-2">
          <!-- Promoted state -->
          <div v-if="note.promotedTaskId" class="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <NexuraIcon name="CheckCircle2" size="xs" />
            <span>Promoted to Kanban</span>
            <span v-if="getPromotedTaskLabel(note.promotedTaskId)" class="text-[#8A8F9E]">
              ({{ getPromotedTaskLabel(note.promotedTaskId) }})
            </span>
          </div>

          <!-- Promote to Kanban Button -->
          <button
            v-else
            type="button"
            :disabled="promotingNoteId === note.id"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ml-auto cursor-pointer focus:outline-none border"
            :class="[
              note.category === 'bug'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-400'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400'
            ]"
            @click="promoteNoteToKanban(note)"
          >
            <NexuraIcon v-if="promotingNoteId !== note.id" name="Sparkles" size="xs" />
            <NexuraIcon v-else name="Loader2" size="xs" class="animate-spin" />
            <span>Promote to Kanban</span>
            <NexuraIcon name="ArrowRight" size="xs" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ProjectNote, NoteCategory, Task } from '~/types'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    isDrawer?: boolean
    projectSlug?: string
    containerClass?: string
  }>(),
  {
    isDrawer: false,
    projectSlug: '',
    containerClass: 'h-full min-h-[520px]'
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'promoted', task: Task): void
}>()

const workspaceStore = useWorkspaceStore()

// State
const category = ref<NoteCategory>('idea')
const selectedProjectSlug = ref(props.projectSlug || '')
const newContent = ref('')
const isSubmitting = ref(false)
const promotingNoteId = ref<string | null>(null)
const activeFilter = ref<'all' | 'idea' | 'bug' | 'maintenance'>('all')
const searchQuery = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Initialize notes if empty
onMounted(async () => {
  if (!workspaceStore.notes.value.length) {
    try {
      await workspaceStore.fetchWorkspaceNotes(props.projectSlug || undefined)
    } catch {
      // Gracefully handled in store
    }
  }

  // Pre-select project if none selected
  if (!selectedProjectSlug.value && workspaceStore.projects.value.length) {
    selectedProjectSlug.value = workspaceStore.projects.value[0].slug
  }
})

// Available projects
const availableProjects = computed(() => {
  return workspaceStore.projects.value || []
})

// Filter tabs with dynamic counts
const filterTabs = computed(() => {
  const allNotes = workspaceStore.notes.value || []
  return [
    { id: 'all' as const, label: 'All', count: allNotes.length },
    { id: 'idea' as const, label: 'Ideas', count: allNotes.filter((n) => n.category === 'idea').length },
    { id: 'bug' as const, label: 'Bugs', count: allNotes.filter((n) => n.category === 'bug').length },
    { id: 'maintenance' as const, label: 'Maint.', count: allNotes.filter((n) => n.category === 'maintenance').length }
  ]
})

// Filtered notes list
const filteredNotes = computed(() => {
  let list = workspaceStore.notes.value || []

  // Project context filter (if props.projectSlug passed)
  if (props.projectSlug) {
    list = list.filter((n) => n.projectSlug === props.projectSlug)
  }

  // Category filter
  if (activeFilter.value !== 'all') {
    list = list.filter((n) => n.category === activeFilter.value)
  }

  // Search filter
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter((n) => n.content.toLowerCase().includes(query))
  }

  return list
})

// Category badge styling helper
function getCategoryBadgeClass(cat: NoteCategory) {
  switch (cat) {
    case 'idea':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'bug':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    case 'maintenance':
      return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
    default:
      return 'bg-white/5 text-[#8A8F9E] border-white/[0.08]'
  }
}

function getCategoryIcon(cat: NoteCategory) {
  switch (cat) {
    case 'idea':
      return 'Sparkles'
    case 'bug':
      return 'Bug'
    case 'maintenance':
      return 'Wrench'
    default:
      return 'FileText'
  }
}

const categorySubmitButtonClass = computed(() => {
  if (category.value === 'bug') {
    return 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.25)]'
  }
  if (category.value === 'maintenance') {
    return 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.25)]'
  }
  return 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.25)]'
})

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getPromotedTaskLabel(taskId: string): string {
  const t = workspaceStore.tasks.value.find((item) => item.id === taskId || item.taskId === taskId)
  return t ? `#${t.taskId || t.id.slice(0, 6)}` : ''
}

// Submit new note
async function submitNote() {
  const content = newContent.value.trim()
  if (!content || isSubmitting.value) return

  const pSlug = selectedProjectSlug.value || (availableProjects.value[0]?.slug ?? 'core')
  const tempId = 'note-' + Date.now()
  const nowIso = new Date().toISOString()

  const optimisticNote: ProjectNote = {
    id: tempId,
    projectSlug: pSlug,
    category: category.value,
    content,
    promotedTaskId: null,
    createdAt: nowIso,
    updatedAt: nowIso
  }

  // 0ms optimistic add
  workspaceStore.addNoteToStore(optimisticNote)
  newContent.value = ''
  isSubmitting.value = true

  try {
    const res = await $fetch<ProjectNote>('/api/notes', {
      method: 'POST',
      body: {
        projectSlug: pSlug,
        category: optimisticNote.category,
        content: optimisticNote.content
      }
    })

    if (res && res.id) {
      // Replace temp note with saved note
      workspaceStore.updateNoteInStore(tempId, res)
    }
  } catch (err) {
    console.warn('[IdeaScratchpadPanel] API error, keeping optimistic note:', err)
  } finally {
    isSubmitting.value = false
    textareaRef.value?.focus()
  }
}

// Delete note
async function deleteNote(id: string) {
  // 0ms optimistic remove
  workspaceStore.removeNoteFromStore(id)
  try {
    await $fetch(`/api/notes/${id}`, { method: 'DELETE' })
  } catch (err) {
    console.warn('[IdeaScratchpadPanel] Failed to delete note on server:', err)
  }
}

// Promote note to Kanban
async function promoteNoteToKanban(note: ProjectNote) {
  if (promotingNoteId.value) return
  promotingNoteId.value = note.id

  try {
    const res = await $fetch<{ success: boolean; task: Task; note?: ProjectNote }>(
      `/api/notes/${note.id}/promote`,
      { method: 'POST' }
    )

    if (res && res.task) {
      // Add task to store in 'idea' status
      workspaceStore.addTaskToStore(res.task)

      // Mark note as promoted
      workspaceStore.updateNoteInStore(note.id, {
        promotedTaskId: res.task.id,
        updatedAt: new Date().toISOString()
      })

      emit('promoted', res.task)
    }
  } catch (err) {
    console.warn('[IdeaScratchpadPanel] Promote API fallback:', err)

    // Fallback if backend route failed: create task directly via workspaceStore
    const firstLine = note.content.split('\n')[0].replace(/^[-*#\s]+/, '').trim()
    const taskTitle = firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine || 'Promoted Idea'

    const localNewTask: Task = {
      id: 'task-' + Date.now(),
      taskId: 'ENG-' + Math.floor(100 + Math.random() * 900),
      projectSlug: note.projectSlug || null,
      name: taskTitle,
      description: note.content,
      status: 'idea',
      priority: note.category === 'bug' ? 'high' : 'medium',
      techTags: [note.category],
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    workspaceStore.addTaskToStore(localNewTask)
    workspaceStore.updateNoteInStore(note.id, {
      promotedTaskId: localNewTask.id
    })
    emit('promoted', localNewTask)
  } finally {
    promotingNoteId.value = null
  }
}
</script>
