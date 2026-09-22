<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto bg-black/75 backdrop-blur-md transition-all"
    aria-labelledby="modal-task-title"
    role="dialog"
    aria-modal="true"
    @click.self="$emit('close')"
  >
    <!-- Centered Full-Rounded Modal Container -->
    <div
      class="relative w-full max-w-2xl bg-[#111114] border border-white/[0.1] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden text-[#F5F2EB] my-auto outline-none transition-all"
      @keydown.esc="$emit('close')"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-white/[0.07] bg-[#171513]/70 flex items-start justify-between gap-4 shrink-0 rounded-t-3xl">
        <div class="space-y-2 flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-xs text-[#C98A4B] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#C98A4B]/10 border border-[#C98A4B]/30">
              #{{ displayTaskId }}
            </span>
            <span
              class="font-mono text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full border tracking-wider"
              :class="statusBadgeClass"
            >
              {{ form.status.replace('_', ' ') }}
            </span>
            <span v-if="form.projectSlug" class="font-mono text-[10px] text-[#756F68] bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
              📁 {{ form.projectSlug }}
            </span>
            <!-- Linked GitHub Issue Badge -->
            <a
              v-if="form.githubIssueUrl"
              :href="form.githubIssueUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-[10px] text-[#C98A4B] bg-[#C98A4B]/10 hover:bg-[#C98A4B]/20 px-2.5 py-0.5 rounded-full border border-[#C98A4B]/30 inline-flex items-center gap-1 transition-colors group"
              title="Open linked issue on GitHub"
            >
              <span>🎯 Linked Issue #{{ form.githubIssueNumber || '' }}</span>
              <IconArrowUpRight class="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <!-- Create GitHub Issue Button -->
            <button
              v-else-if="effectiveRepo"
              type="button"
              class="font-mono text-[10px] text-[#756F68] hover:text-[#C98A4B] bg-white/[0.04] hover:bg-white/10 px-2.5 py-0.5 rounded-full border border-white/[0.06] hover:border-[#C98A4B]/30 inline-flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              :disabled="isCreatingIssue || busy"
              title="Create linked issue on GitHub"
              @click="handleCreateIssue"
            >
              <span v-if="isCreatingIssue" class="w-2.5 h-2.5 border border-[#C98A4B] border-t-transparent rounded-full animate-spin"></span>
              <span v-else>🎯</span>
              <span>{{ isCreatingIssue ? 'Creating Issue...' : 'Create GitHub Issue' }}</span>
            </button>
          </div>
          <input
            id="modal-task-title"
            v-model="form.name"
            type="text"
            class="w-full bg-transparent font-medium text-lg text-[#F5F2EB] border-b border-transparent hover:border-white/[0.15] focus:border-[#C98A4B] focus:outline-none transition-colors py-0.5"
            placeholder="Task deliverable title..."
          />
        </div>

        <!-- Close Button -->
        <button
          type="button"
          class="w-8 h-8 rounded-full flex items-center justify-center text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-[#C98A4B] shrink-0 border border-white/[0.06]"
          @click="$emit('close')"
          aria-label="Close dialog"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Scrollable Form Body -->
      <div class="p-6 space-y-6 overflow-y-auto flex-1 font-sans text-xs">
        <!-- 1. Status Selector Capsules -->
        <div class="space-y-2">
          <label class="font-mono text-xs uppercase text-[#756F68] tracking-wider block">
            Execution Status
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="s in statusOptions"
              :key="s.value"
              type="button"
              class="py-2.5 px-3 rounded-2xl font-mono text-xs border text-center transition-all flex items-center justify-center"
              :class="form.status === s.value ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B] font-semibold shadow-[0_0_12px_rgba(201,138,75,0.15)]' : 'bg-white/[0.02] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB] hover:bg-white/5'"
              @click="form.status = s.value"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <!-- 2. Priority Selector Capsules -->
        <div class="space-y-2">
          <label class="font-mono text-xs uppercase text-[#756F68] tracking-wider block">
            Priority Level
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="p in priorityOptions"
              :key="p.value"
              type="button"
              class="py-2.5 px-3 rounded-2xl font-mono text-xs border text-center transition-all flex items-center justify-center gap-2"
              :class="form.priority === p.value ? 'bg-[#C98A4B] text-[#09090B] font-bold border-[#C98A4B] shadow-[0_0_12px_rgba(201,138,75,0.25)]' : 'bg-white/[0.02] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB] hover:bg-white/5'"
              @click="form.priority = p.value"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="p.dotClass"></span>
              <span>{{ p.label }}</span>
            </button>
          </div>
        </div>

        <!-- 3. Project Slug & Due Date Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="font-mono text-xs uppercase text-[#756F68] tracking-wider block">
              Linked Project
            </label>
            <div class="relative">
              <select
                v-model="form.projectSlug"
                class="w-full bg-[#18181C] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none cursor-pointer appearance-none"
              >
                <option value="management">📁 management (Nexura Workspace)</option>
                <option value="tf-hitnet-eeg">📁 tf-hitnet-eeg</option>
                <option value="neural-signal-lab">📁 neural-signal-lab</option>
                <option value="">(None / General)</option>
              </select>
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#756F68] text-xs">▼</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="font-mono text-xs uppercase text-[#756F68] tracking-wider block">
              Due Date
            </label>
            <input
              v-model="form.dueDate"
              type="date"
              class="w-full bg-[#18181C] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 text-xs text-[#F5F2EB] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none font-mono"
            />
          </div>
        </div>

        <!-- 4. Tech Tags Editor (Full Rounded Pills) -->
        <div class="space-y-2">
          <label class="font-mono text-xs uppercase text-[#756F68] tracking-wider block">
            Tech Tags
          </label>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              v-for="(tag, idx) in form.techTags"
              :key="tag"
              class="inline-flex items-center gap-1.5 font-mono text-xs bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/30 rounded-full px-3 py-1"
            >
              <span>{{ tag }}</span>
              <button
                type="button"
                class="hover:text-red-400 font-bold text-xs focus:outline-none ml-0.5"
                @click="removeTag(idx)"
                title="Remove tag"
              >
                ×
              </button>
            </span>

            <div class="inline-flex items-center gap-1 bg-[#18181C] border border-white/[0.08] rounded-full p-1 pl-3">
              <input
                v-model="newTagInput"
                type="text"
                placeholder="+ add tag"
                class="bg-transparent text-xs text-[#F5F2EB] placeholder:text-[#756F68] focus:outline-none w-20 font-mono"
                @keydown.enter.prevent="addTag"
              />
              <button
                type="button"
                class="w-6 h-6 rounded-full bg-white/5 hover:bg-[#C98A4B] hover:text-[#09090B] text-xs text-[#756F68] flex items-center justify-center transition-colors font-bold"
                @click="addTag"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- 5. Task Description & Interactive Checklist -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="font-mono text-xs uppercase text-[#756F68] tracking-wider">
              Description & Checklist
            </label>
            <button
              type="button"
              class="font-mono text-[11px] text-[#C98A4B] hover:underline"
              @click="appendChecklistItem"
            >
              + Add Checklist item
            </button>
          </div>

          <!-- Description Textarea -->
          <textarea
            v-model="form.description"
            rows="4"
            class="w-full bg-[#18181C] border border-white/[0.08] rounded-2xl p-3.5 text-xs text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:outline-none font-mono leading-relaxed"
            placeholder="Write Markdown notes or task checklists (- [ ] Item)..."
          ></textarea>

          <!-- Parsed Interactive Checklist Items (if any) -->
          <div v-if="checklistItems.length" class="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <div class="font-mono text-[11px] text-[#756F68] mb-1">Interactive Checklist:</div>
            <div
              v-for="(item, i) in checklistItems"
              :key="i"
              class="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-colors"
              @click="toggleChecklist(i)"
            >
              <input
                type="checkbox"
                :checked="item.completed"
                class="rounded bg-[#18181C] border-white/20 text-[#C98A4B] focus:ring-[#C98A4B] cursor-pointer"
                @click.stop="toggleChecklist(i)"
              />
              <span
                class="font-mono text-xs"
                :class="item.completed ? 'line-through text-[#756F68]' : 'text-[#F5F2EB]'"
              >
                {{ item.text }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-4 border-t border-white/[0.07] bg-[#171513]/70 flex items-center justify-between gap-4 shrink-0 rounded-b-3xl">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="font-mono text-xs text-red-400 hover:text-red-300 hover:underline transition-colors px-2 py-1.5 rounded-xl"
            :disabled="busy"
            @click="$emit('delete', task)"
          >
            Delete Task
          </button>

          <!-- Linked Issue in footer -->
          <a
            v-if="form.githubIssueUrl"
            :href="form.githubIssueUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="hidden sm:inline-flex font-mono text-xs text-[#C98A4B] bg-[#C98A4B]/10 hover:bg-[#C98A4B]/20 border border-[#C98A4B]/30 px-3 py-1.5 rounded-2xl items-center gap-1.5 transition-colors group"
            title="Open linked issue on GitHub"
          >
            <span>🎯 Linked Issue #{{ form.githubIssueNumber || '' }}</span>
            <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

          <!-- Create Issue button in footer -->
          <button
            v-else-if="effectiveRepo"
            type="button"
            class="hidden sm:inline-flex font-mono text-xs text-[#756F68] hover:text-[#C98A4B] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-[#C98A4B]/30 px-3 py-1.5 rounded-2xl items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            :disabled="isCreatingIssue || busy"
            title="Create GitHub Issue"
            @click="handleCreateIssue"
          >
            <span v-if="isCreatingIssue" class="w-3 h-3 border-2 border-[#C98A4B] border-t-transparent rounded-full animate-spin"></span>
            <span v-else>🎯</span>
            <span>{{ isCreatingIssue ? 'Creating...' : 'Create GitHub Issue' }}</span>
          </button>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="px-4 py-2.5 rounded-2xl font-mono text-xs text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5 border border-white/[0.08] transition-colors"
            :disabled="busy"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-5 py-2.5 rounded-2xl font-mono text-xs bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-bold shadow-lg shadow-[#C98A4B]/20 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            :disabled="busy"
            @click="submitSave"
          >
            <span v-if="busy" class="w-3.5 h-3.5 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin"></span>
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { createGitHubIssue } from '../composables/useGitHub'
import type { Task, TaskStatus, TaskPriority } from '../types'

const props = defineProps<{
  task: Task
  busy?: boolean
  repo?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: Partial<Task>): void
  (e: 'delete', task: Task): void
}>()

const effectiveRepo = computed(() => {
  if (props.repo) return props.repo
  if (props.task.projectSlug) {
    const slug = props.task.projectSlug.toLowerCase()
    if (slug === 'management') return 'bagja-iskandar/Management'
    return `bagja-iskandar/${props.task.projectSlug}`
  }
  return 'bagja-iskandar/Management'
})

const isCreatingIssue = ref(false)
const newTagInput = ref('')

const form = reactive({
  name: props.task.name || '',
  description: props.task.description || '',
  status: props.task.status || ('in_queue' as TaskStatus),
  priority: props.task.priority || ('medium' as TaskPriority),
  projectSlug: props.task.projectSlug || '',
  techTags: [...(props.task.techTags || [])],
  dueDate: props.task.dueDate || '',
  githubIssueUrl: props.task.githubIssueUrl || '',
  githubIssueNumber: props.task.githubIssueNumber,
  githubPrUrl: props.task.githubPrUrl || ''
})

watch(
  () => props.task,
  (t) => {
    form.name = t.name || ''
    form.description = t.description || ''
    form.status = t.status || 'in_queue'
    form.priority = t.priority || 'medium'
    form.projectSlug = t.projectSlug || ''
    form.techTags = [...(t.techTags || [])]
    form.dueDate = t.dueDate || ''
    form.githubIssueUrl = t.githubIssueUrl || ''
    form.githubIssueNumber = t.githubIssueNumber
    form.githubPrUrl = t.githubPrUrl || ''
  },
  { deep: true }
)

const displayTaskId = computed(() => {
  if (props.task.taskId) {
    return props.task.taskId.startsWith('#') ? props.task.taskId.slice(1) : props.task.taskId
  }
  return props.task.id.slice(0, 7).toUpperCase()
})

const statusOptions: { label: string; value: TaskStatus }[] = [
  { label: 'In Queue', value: 'in_queue' },
  { label: 'Running', value: 'running_sprint' },
  { label: 'Deployed', value: 'deployed' },
  { label: 'Blocked', value: 'blocked' }
]

const priorityOptions: { label: string; value: TaskPriority; dotClass: string }[] = [
  { label: 'Critical', value: 'critical', dotClass: 'bg-red-400' },
  { label: 'High', value: 'high', dotClass: 'bg-orange-400' },
  { label: 'Medium', value: 'medium', dotClass: 'bg-yellow-400' },
  { label: 'Low', value: 'low', dotClass: 'bg-white/40' }
]

const statusBadgeClass = computed(() => {
  switch (form.status) {
    case 'deployed':
      return 'bg-green-500/15 text-green-400 border-green-500/30'
    case 'running_sprint':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'blocked':
      return 'bg-red-500/15 text-red-400 border-red-500/30'
    case 'in_queue':
    default:
      return 'bg-white/5 text-[#756F68] border-white/[0.08]'
  }
})

// Checklist parser
interface ChecklistItem {
  completed: boolean
  text: string
  rawLine: string
}

const checklistItems = computed<ChecklistItem[]>(() => {
  if (!form.description) return []
  const lines = form.description.split('\n')
  const items: ChecklistItem[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('* [ ] ')) {
      items.push({ completed: false, text: trimmed.slice(6), rawLine: line })
    } else if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ') || trimmed.startsWith('* [x] ')) {
      items.push({ completed: true, text: trimmed.slice(6), rawLine: line })
    }
  }

  return items
})

function toggleChecklist(index: number) {
  const item = checklistItems.value[index]
  if (!item) return
  const lines = form.description.split('\n')
  const updatedLines = lines.map((line) => {
    if (line === item.rawLine) {
      if (item.completed) {
        return line.replace(/(\*|\-)\s*\[(x|X)\]/, '$1 [ ]')
      } else {
        return line.replace(/(\*|\-)\s*\[ \]/, '$1 [x]')
      }
    }
    return line
  })
  form.description = updatedLines.join('\n')
}

function appendChecklistItem() {
  const newline = form.description && !form.description.endsWith('\n') ? '\n' : ''
  form.description += `${newline}- [ ] New deliverable item`
}

function addTag() {
  const tag = newTagInput.value.trim().toLowerCase()
  if (tag && !form.techTags.includes(tag)) {
    form.techTags.push(tag)
  }
  newTagInput.value = ''
}

function removeTag(index: number) {
  form.techTags.splice(index, 1)
}

function submitSave() {
  emit('save', {
    name: form.name.trim() || props.task.name,
    description: form.description,
    status: form.status,
    priority: form.priority,
    projectSlug: form.projectSlug || undefined,
    techTags: form.techTags,
    dueDate: form.dueDate || undefined,
    githubIssueUrl: form.githubIssueUrl || undefined,
    githubIssueNumber: form.githubIssueNumber || undefined,
    githubPrUrl: form.githubPrUrl || undefined
  })
}

async function handleCreateIssue() {
  if (!effectiveRepo.value || isCreatingIssue.value) return
  isCreatingIssue.value = true
  try {
    const res = await createGitHubIssue({
      repo: effectiveRepo.value,
      taskId: props.task.id,
      title: form.name.trim() || props.task.name,
      body: form.description || undefined,
      labels: form.techTags && form.techTags.length ? form.techTags : undefined
    })

    if (res?.ok && res?.issue) {
      form.githubIssueUrl = res.issue.htmlUrl
      form.githubIssueNumber = res.issue.number

      emit('save', {
        name: form.name.trim() || props.task.name,
        description: form.description,
        status: form.status,
        priority: form.priority,
        projectSlug: form.projectSlug || undefined,
        techTags: form.techTags,
        dueDate: form.dueDate || undefined,
        githubIssueUrl: res.issue.htmlUrl,
        githubIssueNumber: res.issue.number,
        githubPrUrl: form.githubPrUrl || undefined
      })
    }
  } catch (err) {
    console.error('Failed to create GitHub issue from task:', err)
  } finally {
    isCreatingIssue.value = false
  }
}
</script>
