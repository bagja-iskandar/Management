<template>
  <div class="bg-[#111114] border border-white/[0.07] rounded-xl p-4 space-y-3.5 shadow-lg relative overflow-hidden flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-[#C98A4B]/15 border border-[#C98A4B]/30 flex items-center justify-center text-[#C98A4B] shrink-0">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div>
          <h3 class="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-2">
            <span>PACKAGES & REGISTRY</span>
            <span
              class="px-1.5 py-0.2 rounded text-[9px] font-mono border"
              :class="totalPackages > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-white/[0.07]'"
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
          class="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-white/[0.07] transition cursor-pointer"
          :disabled="pending"
          title="Refresh Packages"
          @click="$emit('refresh')"
        >
          <svg
            class="w-3 h-3"
            :class="{ 'animate-spin text-[#C98A4B]': pending }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-3 flex-1 flex flex-col justify-between">
      <!-- Published Package Item if exists -->
      <div v-if="packagesList.length > 0" class="bg-[#18181C] border border-white/[0.06] rounded-lg p-3 space-y-2">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono text-xs font-bold text-zinc-100 truncate">
                {{ packagesList[0].name }}
              </span>
              <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/20 uppercase">
                {{ packagesList[0].packageType }}
              </span>
            </div>
            <p class="text-[10px] text-zinc-500 font-mono mt-1">
              {{ packagesList[0].versionCount }} versions recorded • {{ packagesList[0].visibility }}
            </p>
          </div>
          <span class="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 font-semibold">
            Active
          </span>
        </div>
      </div>

      <!-- Ready Setup Preview when no packages published yet -->
      <div v-else class="bg-[#18181C] border border-white/[0.06] rounded-lg p-3 space-y-2 font-mono text-[10px]">
        <div class="flex items-center justify-between">
          <span class="text-zinc-400">Container & Artifact Target:</span>
          <span class="text-emerald-400 font-semibold">GHCR / NPM</span>
        </div>
        <div class="bg-[#09090B] px-2.5 py-1.5 rounded border border-white/[0.04] text-zinc-400 truncate flex items-center justify-between gap-2">
          <span class="truncate text-zinc-300">ghcr.io/{{ repo || 'repo' }}:latest</span>
          <span class="text-zinc-600 shrink-0">docker</span>
        </div>
      </div>

      <!-- Action Strip -->
      <div class="flex items-center justify-between pt-1 font-mono text-[10px]">
        <span class="text-zinc-500">
          Target: {{ repo ? `${repo} packages` : 'GitHub Packages' }}
        </span>

        <button
          type="button"
          class="inline-flex items-center gap-1 text-[#C98A4B] hover:text-[#F5F2EB] transition font-semibold shrink-0 cursor-pointer group"
          @click="$emit('open-modal')"
        >
          <span>Registry Details</span>
          <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubPackageSummary } from '~/types'

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
