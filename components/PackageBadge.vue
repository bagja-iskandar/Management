<template>
  <div class="inline-flex items-center">
    <!-- Loading State -->
    <div
      v-if="pending && !summary"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border border-white/[0.06] bg-white/[0.02] text-[#756F68] select-none"
      :class="compact ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'"
      title="Syncing package telemetry..."
    >
      <span class="w-1.5 h-1.5 rounded-full bg-[#756F68] animate-pulse"></span>
      <span>📦 Syncing...</span>
    </div>

    <!-- Status Badge Button -->
    <button
      v-else
      type="button"
      class="inline-flex items-center gap-1.5 font-mono rounded-full border transition-all select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-current"
      :class="[badgeContainerClasses, compact ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1']"
      :title="badgeTooltip"
      @click.stop="isModalOpen = true"
    >
      <!-- Indicator Dot -->
      <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="dotClasses"></span>

      <!-- Badge Text -->
      <span class="font-medium whitespace-nowrap">{{ badgeText }}</span>
    </button>

    <!-- Package & Container Registry Modal -->
    <PackageModal
      :is-open="isModalOpen"
      :repo="repo || ''"
      :summary="summary"
      @close="isModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { useGitHubPackages } from '../composables/useGitHub'
import PackageModal from './PackageModal.vue'

const props = withDefaults(
  defineProps<{
    repo?: string
    compact?: boolean
  }>(),
  {
    repo: '',
    compact: false
  }
)

const repoRef = toRef(props, 'repo')
const { packages: summary, pending } = useGitHubPackages(repoRef)

const isModalOpen = ref(false)

const totalPackages = computed(() => summary.value?.totalPackages ?? summary.value?.packages?.length ?? 0)

const badgeText = computed(() => {
  if (!summary.value) {
    return '📦 Packages'
  }

  if (summary.value.hasScope === false) {
    return '📦 Packages (Setup)'
  }

  if (totalPackages.value > 0) {
    return `📦 ${totalPackages.value} Pkg${totalPackages.value > 1 ? 's' : ''}`
  }

  return '📦 0 Packages'
})

const badgeContainerClasses = computed(() => {
  if (!summary.value) {
    return 'border-white/[0.08] bg-white/[0.03] text-[#756F68] hover:text-[#F5F2EB]'
  }

  if (summary.value.hasScope === false) {
    return 'border-[#C98A4B]/30 bg-[#C98A4B]/10 text-[#C98A4B] hover:bg-[#C98A4B]/20'
  }

  if (totalPackages.value > 0) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
  }

  return 'border-white/[0.08] bg-white/[0.03] text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/[0.06]'
})

const dotClasses = computed(() => {
  if (!summary.value) {
    return 'bg-[#756F68]'
  }

  if (summary.value.hasScope === false) {
    return 'bg-[#C98A4B] animate-pulse'
  }

  if (totalPackages.value > 0) {
    return 'bg-emerald-400'
  }

  return 'bg-[#756F68]'
})

const badgeTooltip = computed(() => {
  if (!summary.value) {
    return 'Inspect package registry telemetry'
  }

  if (summary.value.hasScope === false) {
    return 'GitHub token read:packages scope required — Click to configure'
  }

  if (totalPackages.value > 0) {
    return `${totalPackages.value} package(s) published — Click to view registry telemetry`
  }

  return '0 packages published — Click to inspect container registry'
})
</script>
