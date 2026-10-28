<template>
  <div class="obs-card bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-4 sm:p-4.5 space-y-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
          <NexuraIcon name="Package" size="xs" />
        </div>
        <div>
          <h3 class="font-mono text-xs font-bold text-[#F3F4F6] uppercase tracking-wide flex items-center gap-2">
            <span>PACKAGES & REGISTRY</span>
            <span
              class="px-2 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider"
              :class="totalPackages > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-[#8A8F9E] border-white/[0.07]'"
            >
              {{ totalPackages > 0 ? `${totalPackages} PUBLISHED` : 'REGISTRY READY' }}
            </span>
          </h3>
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="flex items-center gap-1.5 font-mono text-xs">
        <button
          type="button"
          class="p-1 rounded-lg bg-[#07080A] hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.07] transition cursor-pointer"
          :disabled="pending"
          title="Refresh Packages"
          @click="$emit('refresh')"
        >
          <NexuraIcon
            name="RotateCw"
            size="xs"
            :class="{ 'animate-spin text-indigo-400': pending }"
          />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-3 flex-1 flex flex-col justify-between">
      <!-- Published Package Item if exists -->
      <div v-if="packagesList.length > 0" class="bg-[#07080A]/60 border border-white/[0.06] rounded-xl p-3 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono text-xs font-bold text-[#F3F4F6] truncate">
                {{ packagesList[0].name }}
              </span>
              <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                {{ packagesList[0].packageType }}
              </span>
            </div>
            <p class="text-[10px] text-[#8A8F9E] font-mono mt-1">
              <span class="tabular-nums">{{ packagesList[0].versionCount }}</span> versions recorded • {{ packagesList[0].visibility }}
            </p>
          </div>
          <span class="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 font-semibold">
            Active
          </span>
        </div>
      </div>

      <!-- Ready Setup Preview when no packages published yet -->
      <div v-else class="bg-[#07080A]/60 border border-white/[0.06] rounded-xl p-3 space-y-2 font-mono text-[10px]">
        <div class="flex items-center justify-between">
          <span class="text-[#8A8F9E]">Container & Artifact Target:</span>
          <span class="text-emerald-400 font-semibold">GHCR / NPM</span>
        </div>
        <div class="bg-[#07080A] px-2.5 py-1.5 rounded-lg border border-white/[0.04] text-[#8A8F9E] truncate flex items-center justify-between gap-2">
          <span class="truncate text-[#F3F4F6]">ghcr.io/{{ repo || 'repo' }}:latest</span>
          <span class="text-[#565B68] shrink-0 font-mono">docker</span>
        </div>
      </div>

      <!-- Action Strip -->
      <div class="flex items-center justify-between pt-1 font-mono text-[10px]">
        <span class="text-[#8A8F9E]">
          Target: {{ repo ? `${repo} packages` : 'GitHub Packages' }}
        </span>

        <button
          type="button"
          class="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition font-semibold shrink-0 cursor-pointer group"
          @click="$emit('open-modal')"
        >
          <span>Registry Details</span>
          <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubPackageSummary } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    repo?: string
    packages?: GitHubPackageSummary | null
    pending?: boolean
  }>(),
  {
    repo: '',
    packages: null,
    pending: false
  }
)

defineEmits<{
  (e: 'open-modal'): void
  (e: 'refresh'): void
}>()

const totalPackages = computed(() => props.packages?.totalPackages || 0)
const packagesList = computed(() => props.packages?.packages || [])
</script>
