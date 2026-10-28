<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    role="presentation"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-2xl bg-[#111318] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-5 outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-target-title"
    >
      <!-- Modal Header -->
      <div class="flex items-start justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <h2 id="modal-target-title" class="text-base font-semibold text-[#F3F4F6] font-sans">
            Set Focus Targets
          </h2>
          <p class="font-sans text-xs text-[#8A8F9E] mt-0.5">
            Add key deliverables to {{ weekLabel }}
          </p>
        </div>
        <button
          type="button"
          class="text-[#8A8F9E] hover:text-[#F3F4F6] p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
          aria-label="Close modal"
          @click="$emit('close')"
        >
          <NexuraIcon name="X" size="sm" />
        </button>
      </div>

      <!-- Modal Segmented Tabs -->
      <div class="flex items-center gap-2 border-b border-white/[0.06] pb-3 font-sans text-xs">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'backlog' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04]'"
          @click="activeTab = 'backlog'"
        >
          <span>Pick from Backlog</span>
          <span class="font-mono tabular-nums text-xs opacity-75">({{ filteredBacklog.length }})</span>
        </button>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
          :class="activeTab === 'create' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium' : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04]'"
          @click="activeTab = 'create'"
        >
          <NexuraIcon name="Plus" size="xs" />
          <span>Create New Deliverable</span>
        </button>
      </div>

      <!-- Tab 1: Pick from Backlog -->
      <div v-if="activeTab === 'backlog'" class="space-y-4">
        <!-- Search Filter -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#565B68]">
            <NexuraIcon name="Search" size="xs" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search unassigned backlog tasks..."
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-8 pr-8 py-2 text-xs font-sans text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-[#565B68] hover:text-[#F3F4F6] cursor-pointer"
            @click="searchQuery = ''"
          >
            <NexuraIcon name="X" size="xs" />
          </button>
        </div>

        <!-- Backlog List -->
        <div class="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <div
            v-if="filteredBacklog.length === 0"
            class="py-10 text-center font-sans text-xs text-[#8A8F9E]"
          >
            No unassigned backlog tasks available. Create a new deliverable below!
          </div>

          <div
            v-for="bt in filteredBacklog"
            :key="bt.id"
            class="p-3 rounded-lg bg-[#07080A] border border-white/[0.06] hover:border-white/[0.12] transition-colors flex items-center justify-between gap-3"
          >
            <div class="min-w-0 space-y-1.5 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono tabular-nums text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  #{{ bt.taskId || 'ENG-000' }}
                </span>
                <span class="font-mono text-xs bg-white/[0.04] text-[#8A8F9E] px-1.5 py-0.5 rounded border border-white/[0.06] flex items-center gap-1">
                  <NexuraIcon name="Folder" size="xs" class="text-[#8A8F9E]" />
                  <span>{{ bt.projectSlug || 'management' }}</span>
                </span>
                <span
                  class="font-mono text-xs px-1.5 py-0.5 rounded"
                  :class="getPriorityBadgeClass(bt.priority)"
                >
                  {{ bt.priority }}
                </span>
              </div>
              <div class="font-sans text-xs text-[#F3F4F6] font-medium truncate">
                {{ bt.name }}
              </div>
            </div>

            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-white text-[#07080A] font-sans text-xs font-medium transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              @click="$emit('add-existing', bt)"
            >
              <NexuraIcon name="Plus" size="xs" />
              <span>Add to Focus</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: Create New Deliverable Directly -->
      <div v-else-if="activeTab === 'create'">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <label class="font-sans text-xs font-medium text-[#F3F4F6]">Deliverable Title *</label>
            <input
              v-model="name"
              type="text"
              placeholder="e.g. Design spatiotemporal EEG transformer network"
              class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-sans text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition"
              required
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-sans text-xs font-medium text-[#F3F4F6]">Project *</label>
              <select
                v-model="projectSlug"
                class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition cursor-pointer"
                required
              >
                <option
                  v-for="p in projects"
                  :key="p.slug"
                  :value="p.slug"
                >
                  {{ p.slug }} ({{ p.title }})
                </option>
                <option v-if="!projects?.length" value="management">management (Workspace)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-sans text-xs font-medium text-[#F3F4F6]">Priority *</label>
              <select
                v-model="priority"
                class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition cursor-pointer"
                required
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-sans text-xs font-medium text-[#F3F4F6]">Initial Status</label>
              <select
                v-model="status"
                class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition cursor-pointer"
              >
                <option value="in_queue">In Queue</option>
                <option value="running_sprint">Running (In Flight)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-sans text-xs font-medium text-[#F3F4F6]">Due Date</label>
              <input
                v-model="dueDate"
                type="date"
                class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="font-sans text-xs font-medium text-[#F3F4F6]">Tech Tags (comma separated)</label>
            <input
              v-model="tags"
              type="text"
              placeholder="e.g. PyTorch, CUDA, Transformer"
              class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-sans text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.08] transition cursor-pointer"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-sans font-medium text-[#F3F4F6] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              :disabled="submitting"
            >
              <NexuraIcon v-if="!submitting" name="Plus" size="xs" />
              <span v-if="submitting">Creating...</span>
              <span v-else>Create & Add to Focus</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import type { Task, Project, TaskPriority, TaskStatus } from '~/types'

const props = defineProps<{
  initialTab: 'backlog' | 'create'
  weekLabel: string
  unassignedTasks: Task[]
  projects: Project[]
  submitting: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add-existing', task: Task): void
  (e: 'create-deliverable', payload: {
    name: string
    projectSlug: string
    priority: TaskPriority
    status: TaskStatus
    dueDate?: string
    techTags: string[]
  }): void
}>()

const activeTab = ref<'backlog' | 'create'>(props.initialTab || 'backlog')
const searchQuery = ref('')

const name = ref('')
const projectSlug = ref(props.projects?.[0]?.slug || 'management')
const priority = ref<TaskPriority>('high')
const status = ref<TaskStatus>('in_queue')
const dueDate = ref('')
const tags = ref('')

const filteredBacklog = computed(() => {
  let list = props.unassignedTasks || []
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.taskId || '').toLowerCase().includes(q) ||
        (t.projectSlug || '').toLowerCase().includes(q)
    )
  }
  return list
})

function getPriorityBadgeClass(p?: TaskPriority | string) {
  if (p === 'critical') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  if (p === 'high') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  if (p === 'medium') return 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
  return 'bg-white/[0.04] text-[#8A8F9E] border border-white/[0.06]'
}

function handleSubmit() {
  const techTags = tags.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  emit('create-deliverable', {
    name: name.value,
    projectSlug: projectSlug.value,
    priority: priority.value,
    status: status.value,
    dueDate: dueDate.value || undefined,
    techTags
  })
}
</script>
