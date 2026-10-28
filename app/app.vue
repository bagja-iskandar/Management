<template>
  <div class="w-full h-screen bg-[#07080A] text-[#F3F4F6] antialiased selection:bg-indigo-500/30 selection:text-white overflow-hidden relative">
    <!-- Frame Dalam: Unified Left Sidebar + Inset Workspace Panel -->
    <div class="w-full flex h-full p-2 sm:p-2.5 gap-2">
      <!-- Sidebar (Unified Left Rail on Desktop + Fixed Mobile Dock) -->
      <Sidebar class="w-56 shrink-0 hidden lg:flex select-none" />

      <!-- Inset Workspace Container (Linear / Cursor signature aesthetic) -->
      <main class="flex-1 obs-workspace rounded-2xl overflow-hidden flex flex-col min-w-0 relative">
        <!-- Unified Integrated Top Header Bar -->
        <HeaderBar class="shrink-0" />

        <!-- Scrollable Content Canvas (Clean viewport without pt-16 hack) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 min-h-0">
          <NuxtPage />
        </div>
      </main>
    </div>

    <!-- Global Create Deliverable Modal (Single Source of Truth) -->
    <AddTaskModal
      v-if="isAddTaskOpen"
      :projects="projectOptions"
      @close="closeAddTask"
      @create="onTaskCreated"
    />

    <!-- Global Task Drawer Modal (Single Source of Truth) -->
    <TaskDrawer
      :is-open="isDrawerOpen"
      :task-id="activeTaskId"
      @close="closeTaskDrawer"
    />

    <!-- Global Session Auth Modal (Single Source of Truth) -->
    <SessionAuthModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import TaskDrawer from '../components/TaskDrawer.vue'
import SessionAuthModal from '../components/SessionAuthModal.vue'
import { useWorkspaceStore } from '../composables/useWorkspaceStore'
import { useTaskDrawer } from '../composables/useTaskDrawer'
import { useTasks } from '~/composables/useTasks'
import { useQuickTask } from '~/composables/useQuickTask'
import { useSession } from '~/composables/useSession'
import { useOmniSearch } from '~/composables/useOmniSearch'
import type { TaskPriority } from '~/types'

const workspaceStore = useWorkspaceStore()
const session = useSession()
const { isDrawerOpen, activeTaskId, closeTaskDrawer } = useTaskDrawer()
const tasksApi = useTasks()
const { isAddTaskOpen, openAddTask, closeAddTask } = useQuickTask()
const { isOpen: isOmniSearchOpen, toggleSearch, openSearch } = useOmniSearch()

// Centralized keyboard shortcuts listener
function handleGlobalKeydown(e: KeyboardEvent) {
  // If session auth modal is open, ignore shortcuts so user can enter key undisturbed
  if (session.isAuthModalOpen.value) {
    return
  }

  // Ctrl+K / Cmd+K: Toggle OmniSearch (close any open z-50 drawer/modal first)
  if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
    e.preventDefault()
    if (isDrawerOpen.value || isAddTaskOpen.value) {
      closeTaskDrawer()
      closeAddTask()
      openSearch()
    } else {
      toggleSearch()
    }
    return
  }

  // Check if target is an editable input element
  const target = e.target as HTMLElement | null
  const isInput = Boolean(
    target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    )
  )

  if (isInput) return

  // Do not trigger single-key shortcuts if any modal/drawer is open
  if (isDrawerOpen.value || isAddTaskOpen.value || isOmniSearchOpen.value) {
    return
  }

  // '/': Open OmniSearch
  if (e.key === '/') {
    e.preventDefault()
    openSearch()
    return
  }

  // 'C' or 'c': Open AddTaskModal
  if (e.key === 'c' || e.key === 'C') {
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      openAddTask()
    }
  }
}

// Initialize unified reactive workspace store and check session at boot
onMounted(async () => {
  try {
    await Promise.allSettled([
      workspaceStore.initializeWorkspace(),
      session.checkSession()
    ])
  } catch (err) {
    console.error('[AppShell] Workspace boot initialization error:', err)
  }

  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// Derive project options directly from canonical workspace store
const projectOptions = computed(() => {
  return workspaceStore.projects.value.map((p) => ({
    label: p.title || p.slug,
    value: p.slug
  }))
})

async function onTaskCreated(payload: {
  name: string
  description?: string
  priority?: TaskPriority
  projectSlug?: string
  techTags?: string[]
  dueDate?: string
}) {
  try {
    await tasksApi.createTask({
      name: payload.name,
      description: payload.description,
      priority: payload.priority || 'medium',
      projectSlug: payload.projectSlug || 'management',
      techTags: payload.techTags || [],
      dueDate: payload.dueDate
    })
    closeAddTask()
  } catch (err) {
    console.error('Failed to create deliverable:', err)
  }
}
</script>
