<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    role="presentation"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-2xl bg-[#111114] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-5 outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-target-title"
    >
      <!-- Modal Header -->
      <div class="flex items-start justify-between pb-3 border-b border-white/[0.06]">
        <div>
          <h2 id="modal-target-title" class="font-mono text-base font-semibold text-[#F5F2EB]">
            Set Focus Targets
          </h2>
          <p class="font-sans text-xs text-[#756F68] mt-0.5">
            Add key deliverables to {{ weekLabel }}
          </p>
        </div>
        <button
          type="button"
          class="text-[#756F68] hover:text-[#F5F2EB] p-1 font-mono text-sm transition-colors cursor-pointer"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Modal Tabs -->
      <div class="flex items-center gap-2 border-b border-white/[0.06] pb-3 font-mono text-xs">
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
          :class="activeTab === 'backlog' ? 'bg-[#C98A4B]/15 text-[#C98A4B] border border-[#C98A4B]/30 font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5'"
          @click="activeTab = 'backlog'"
        >
          Pick from Backlog ({{ filteredBacklog.length }})
        </button>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
          :class="activeTab === 'create' ? 'bg-[#C98A4B]/15 text-[#C98A4B] border border-[#C98A4B]/30 font-semibold' : 'text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5'"
          @click="activeTab = 'create'"
        >
          ⊕ Create New Deliverable
        </button>
      </div>

      <!-- Tab 1: Pick from Backlog -->
      <div v-if="activeTab === 'backlog'" class="space-y-4">
        <!-- Search Filter -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search unassigned backlog tasks..."
            class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#756F68] hover:text-[#F5F2EB] cursor-pointer"
            @click="searchQuery = ''"
          >
            ✕
          </button>
        </div>

        <!-- Backlog List -->
        <div class="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          <div
            v-if="filteredBacklog.length === 0"
            class="py-10 text-center font-mono text-xs text-[#756F68]"
          >
            No unassigned backlog tasks available. Create a new deliverable below!
          </div>

          <div
            v-for="bt in filteredBacklog"
            :key="bt.id"
            class="p-3 rounded-lg bg-[#09090B] border border-white/[0.04] hover:border-white/[0.08] transition-colors flex items-center justify-between gap-3"
          >
            <div class="min-w-0 space-y-1 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono text-xs font-semibold text-[#C98A4B] bg-[#C98A4B]/10 px-1.5 py-0.2 rounded border border-[#C98A4B]/20">
                  #{{ bt.taskId || 'ENG-000' }}
                </span>
                <span class="font-mono text-[11px] bg-white/5 text-[#756F68] px-1.5 py-0.2 rounded">
                  📁 {{ bt.projectSlug || 'management' }}
                </span>
                <span
                  class="font-mono text-[10px] px-1.5 py-0.2 rounded"
                  :class="getPriorityBadgeClass(bt.priority)"
                >
                  {{ bt.priority }}
                </span>
              </div>
              <div class="font-sans text-xs text-[#F5F2EB] font-medium truncate">
                {{ bt.name }}
              </div>
            </div>

            <button
              type="button"
              class="px-3 py-1.5 rounded-md bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-mono text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer"
              @click="$emit('add-existing', bt)"
            >
              <span>+</span>
              <span>Add to Focus</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: Create New Deliverable Directly -->
      <div v-else-if="activeTab === 'create'">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Deliverable Title *</label>
            <input
              v-model="name"
              type="text"
              placeholder="e.g. Design spatiotemporal EEG transformer network"
              class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
              required
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Project *</label>
              <select
                v-model="projectSlug"
                class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
                required
              >
                <option
                  v-for="p in projects"
                  :key="p.slug"
                  :value="p.slug"
                >
                  📁 {{ p.slug }} ({{ p.title }})
                </option>
                <option v-if="!projects?.length" value="management">📁 management (Workspace)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Priority *</label>
              <select
                v-model="priority"
                class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
                required
              >
                <option value="critical">⚡ Critical</option>
                <option value="high">⚡ High</option>
                <option value="medium">⚡ Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Initial Status</label>
              <select
                v-model="status"
                class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
              >
                <option value="in_queue">In Queue</option>
                <option value="running_sprint">Running (In Flight)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Due Date</label>
              <input
                v-model="dueDate"
                type="date"
                class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="font-sans text-xs font-semibold text-[#F5F2EB]">Tech Tags (comma separated)</label>
            <input
              v-model="tags"
              type="text"
              placeholder="e.g. PyTorch, CUDA, Transformer"
              class="w-full bg-[#09090B] border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs font-mono text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-sans text-[#756F68] hover:text-[#F5F2EB] transition-colors cursor-pointer"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg bg-[#C98A4B] hover:bg-[#8B6535] text-xs font-mono font-semibold text-[#09090B] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              :disabled="submitting"
            >
              <span v-if="submitting">Creating...</span>
              <span v-else>⊕ Create & Add to Focus</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
  if (p === 'critical') return 'bg-red-500/10 text-red-400 border border-red-500/20'
  if (p === 'high') return 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
  if (p === 'medium') return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
  return 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
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
