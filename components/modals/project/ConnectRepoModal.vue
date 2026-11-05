<template>
  <BaseModal
    :model-value="effectiveIsOpen"
    :closable="false"
    title="Connect to Project"
    subtitle="Map GitHub repository to Nexura Management"
    icon="FolderPlus"
    icon-color="text-indigo-400"
    max-width="lg"
    @close="onClose"
  >
    <form id="connect-repo-form" class="space-y-4" @submit.prevent="onConfirm">
      <!-- Target Repository Bento Card -->
      <div class="p-3.5 rounded-xl bg-[#07080A]/80 border border-white/[0.08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-mono text-[11px] font-medium text-[#8A8F9E] flex items-center gap-1.5 uppercase tracking-wider">
            <NexuraIcon name="GitBranch" size="xs" class="text-indigo-400" />
            Target Repository
          </span>
          <span
            v-if="repo?.language"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.04] text-[#8A8F9E] border border-white/[0.06]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            {{ repo.language }}
          </span>
        </div>
        <div class="flex items-center gap-2 font-mono text-xs text-[#F3F4F6] bg-black/40 px-3 py-2 rounded-lg border border-white/[0.05]">
          <NexuraIcon name="Github" size="xs" class="text-[#8A8F9E] shrink-0" />
          <span class="truncate font-semibold tracking-tight">{{ repo?.fullName || repo?.name || 'No Repository Selected' }}</span>
        </div>
      </div>

      <!-- Project Title -->
      <BaseInput
        v-model="form.title"
        label="Project Title"
        placeholder="e.g. TF-HiTNet EEG Transformer"
        required
        @input="onTitleInput"
      />

      <!-- Project Slug -->
      <BaseInput
        v-model="form.slug"
        label="Project Slug"
        placeholder="e.g. tf-hitnet-eeg"
        hint="Unique slug identifier for workspace routing"
        required
      />

      <!-- Description -->
      <BaseInput
        v-model="form.description"
        label="Description"
        placeholder="Brief description of project deliverables and scope..."
        type="textarea"
        :rows="3"
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Primary Stack -->
        <BaseInput
          v-model="form.primaryTech"
          label="Primary Stack"
          placeholder="e.g. TypeScript, PyTorch"
        />

        <!-- Priority -->
        <BaseSelect
          v-model="form.priority"
          label="Priority"
          :options="priorityOptions"
        />
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-end gap-3 w-full">
        <BaseButton
          type="button"
          variant="secondary"
          :disabled="isConnecting"
          @click="onClose"
        >
          Cancel
        </BaseButton>

        <BaseButton
          type="submit"
          form="connect-repo-form"
          variant="primary"
          :loading="isConnecting"
          icon="Plus"
        >
          Connect Project
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import BaseModal from '~/components/ui/BaseModal.vue'
import BaseInput from '~/components/ui/BaseInput.vue'
import BaseSelect from '~/components/ui/BaseSelect.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import NexuraIcon from '~/components/ui/NexuraIcon.vue'
import type { GitHubRepoSummary } from '~/types'

export interface ConnectRepoModalProps {
  isOpen?: boolean
  modelValue?: boolean
  repo?: GitHubRepoSummary | null
  isConnecting?: boolean
}

const props = withDefaults(defineProps<ConnectRepoModalProps>(), {
  isOpen: undefined,
  modelValue: undefined,
  repo: null,
  isConnecting: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'confirm',
    payload: {
      title: string
      slug: string
      description: string
      primaryTech: string
      priority: string
      githubRepo: string
    }
  ): void
}>()

const effectiveIsOpen = computed(() => {
  if (typeof props.modelValue === 'boolean') return props.modelValue
  if (typeof props.isOpen === 'boolean') return props.isOpen
  return false
})

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

const form = reactive({
  title: '',
  slug: '',
  description: '',
  primaryTech: '',
  priority: 'medium'
})

const isCustomSlug = ref(false)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function onTitleInput() {
  if (!isCustomSlug.value) {
    form.slug = slugify(form.title)
  }
}

watch(
  () => props.repo,
  (newRepo) => {
    if (newRepo) {
      form.title = newRepo.name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
      form.slug = slugify(newRepo.name)
      form.description = newRepo.description || ''
      form.primaryTech = newRepo.language || ''
      form.priority = 'medium'
      isCustomSlug.value = false
    }
  },
  { immediate: true }
)

function onClose() {
  emit('update:modelValue', false)
  emit('close')
}

function onConfirm() {
  if (!form.title.trim() || !form.slug.trim()) return

  emit('confirm', {
    title: form.title.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    primaryTech: form.primaryTech.trim(),
    priority: form.priority,
    githubRepo: props.repo?.fullName || props.repo?.name || ''
  })
}
</script>
