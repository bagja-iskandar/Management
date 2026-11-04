<template>
  <BaseModal
    :model-value="effectiveIsOpen"
    title="Connect to Project"
    subtitle="Map GitHub repository to Nexura Management"
    icon="FolderPlus"
    icon-color="text-indigo-400"
    max-width="lg"
    @close="onClose"
  >
    <form class="space-y-4" @submit.prevent="onConfirm">
      <!-- Target Repository (Read-only Security Safeguard) -->
      <div class="space-y-1.5 p-3 rounded-xl bg-[#0B0C10] border border-white/[0.06]">
        <span class="font-sans text-[11px] font-medium text-[#8A8F9E] block">
          Target Repository
        </span>
        <div class="flex items-center gap-2">
          <NexuraIcon name="GitBranch" size="xs" class="text-indigo-400" />
          <BaseBadge variant="tech" :label="repo?.name || repo?.fullName || 'No Repository Selected'" />
          <span v-if="repo?.language" class="text-[11px] font-mono text-[#8A8F9E] ml-auto">
            {{ repo.language }}
          </span>
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

      <!-- Modal Footer -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06] mt-4">
        <BaseButton
          variant="secondary"
          :disabled="isConnecting"
          @click="onClose"
        >
          Cancel
        </BaseButton>

        <BaseButton
          type="submit"
          variant="primary"
          :loading="isConnecting"
          icon="Plus"
        >
          Connect Project
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import BaseModal from '~/components/ui/BaseModal.vue'
import BaseInput from '~/components/ui/BaseInput.vue'
import BaseSelect from '~/components/ui/BaseSelect.vue'
import BaseButton from '~/components/ui/BaseButton.vue'
import BaseBadge from '~/components/ui/BaseBadge.vue'
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
