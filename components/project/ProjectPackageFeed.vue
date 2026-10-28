<template>
  <div class="p-4 sm:p-5 rounded-2xl bg-[#07080A]/80 border border-white/[0.06] space-y-4">
    <!-- Panel Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full shrink-0" :class="statusDotClass"></span>
        <div>
          <h3 class="font-mono text-xs uppercase tracking-wider text-[#F3F4F6] font-bold flex items-center gap-2">
            <span>Package &amp; Container Registry Feed</span>
            <span
              v-if="packages && packages.packages?.length > 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tabular-nums"
            >
              {{ packages.packages.length }} Package{{ packages.packages.length > 1 ? 's' : '' }}
            </span>
            <span
              v-else-if="packages && packages.hasScope === false"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"
            >
              Setup Required
            </span>
            <span
              v-else
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-[#8A8F9E] border border-white/[0.06]"
            >
              Live Registry
            </span>
          </h3>
          <p class="font-sans text-[11px] text-[#8A8F9E]">
            Published container images (GHCR), NPM packages, and artifact distribution telemetry.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Inspect Registry Button -->
        <button
          type="button"
          class="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-mono text-[11px] font-semibold border border-indigo-500/30 transition-colors focus:ring-1 focus:ring-indigo-500/50 focus:outline-none cursor-pointer"
          title="Inspect package registry in modal"
          @click="$emit('open-modal')"
        >
          <span>Inspect Registry</span>
          <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] font-mono text-[11px] border border-white/[0.06] transition-colors focus:ring-1 focus:ring-indigo-500/50 focus:outline-none cursor-pointer"
          :disabled="pending"
          title="Refresh package telemetry"
          @click="$emit('refresh')"
        >
          <NexuraIcon
            name="RotateCw"
            size="xs"
            :class="{ 'animate-spin text-indigo-400': pending }"
          />
          <span>{{ pending ? 'Syncing...' : 'Refresh' }}</span>
        </button>
      </div>
    </div>

    <!-- 3 Bento Metric Tiles -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="p-3.5 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E] flex items-center justify-between">
          <span>Total Packages</span>
          <span class="w-1.5 h-1.5 rounded-full" :class="(packages?.packages?.length || 0) > 0 ? 'bg-emerald-400' : 'bg-[#565B68]'"></span>
        </span>
        <div
          class="font-mono text-2xl font-bold tabular-nums"
          :class="(packages?.packages?.length || 0) > 0 ? 'text-emerald-400' : 'text-[#F3F4F6]'"
        >
          {{ packages ? (packages.totalPackages ?? packages.packages?.length ?? 0) : '—' }}
        </div>
        <div class="font-mono text-[10px] text-[#8A8F9E] truncate">
          Container &amp; package artifacts
        </div>
      </div>

      <div class="p-3.5 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E] flex items-center justify-between">
          <span>Scope Status</span>
          <span class="w-1.5 h-1.5 rounded-full" :class="packages?.hasScope ? 'bg-emerald-400' : 'bg-amber-400'"></span>
        </span>
        <div
          class="font-mono text-2xl font-bold"
          :class="packages?.hasScope ? 'text-emerald-400' : 'text-amber-400'"
        >
          {{ packages?.hasScope ? 'Active' : 'Setup Required' }}
        </div>
        <div class="font-mono text-[10px] text-[#8A8F9E] truncate">
          read:packages PAT scope
        </div>
      </div>

      <div class="p-3.5 rounded-xl bg-[#111318] border border-white/[0.06] flex flex-col justify-between gap-1">
        <span class="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9E] flex items-center justify-between">
          <span>Supported Formats</span>
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        </span>
        <div class="font-mono text-lg font-bold text-[#F3F4F6]">
          Docker · NPM · Maven
        </div>
        <div class="font-mono text-[10px] text-[#8A8F9E] truncate">
          ghcr.io &amp; OCI registries
        </div>
      </div>
    </div>

    <!-- Body State 1: Syncing -->
    <div v-if="pending && (!packages || !packages.packages)" class="py-8 text-center font-mono text-xs text-indigo-400 animate-pulse">
      Syncing package &amp; container registry telemetry...
    </div>

    <!-- Body State 2: Scope Setup Required -->
    <div
      v-else-if="packages && packages.hasScope === false"
      class="p-4 rounded-xl bg-[#111318] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
    >
      <div class="flex items-start gap-3 text-[#8A8F9E]">
        <NexuraIcon name="KeyRound" size="sm" class="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <span class="text-[#F3F4F6] font-bold block mb-0.5">Token Scope Missing</span>
          <span>The <code class="font-mono text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">read:packages</code> scope is required on your GitHub PAT to read published container images or npm packages.</span>
        </div>
      </div>
      <a
        href="https://github.com/settings/tokens"
        target="_blank"
        rel="noopener noreferrer"
        class="group font-mono text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1 shrink-0 self-start sm:self-center"
      >
        <span>Configure Token Scopes on GitHub</span>
        <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </div>

    <!-- Body State 3: Scope Active & Clean State (0 packages) -->
    <div
      v-else-if="packages && packages.hasScope === true && (!packages.packages || packages.packages.length === 0)"
      class="p-6 rounded-xl bg-[#111318] border border-white/[0.04] text-center space-y-3"
    >
      <div class="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-indigo-400">
        <NexuraIcon name="Package" size="lg" />
      </div>
      <div class="space-y-1">
        <h4 class="font-mono text-xs font-bold text-[#F3F4F6]">
          No packages published for this repository yet.
        </h4>
        <p class="font-sans text-xs text-[#8A8F9E]">
          Publish container images to GitHub Container Registry (ghcr.io) to inspect them here.
        </p>
      </div>

      <div class="pt-1 max-w-lg mx-auto text-left">
        <div class="text-[10px] font-mono uppercase tracking-wider text-[#8A8F9E] mb-1 flex items-center justify-between">
          <span>Push snippet</span>
          <button
            type="button"
            class="hover:text-indigo-400 transition-colors focus:outline-none cursor-pointer inline-flex items-center gap-1"
            @click="$emit('copy-snippet', dockerSnippet)"
          >
            <NexuraIcon :name="copiedSnippet ? 'Check' : 'Copy'" size="xs" :class="copiedSnippet ? 'text-emerald-400' : ''" />
            <span>{{ copiedSnippet ? 'Copied' : 'Copy command' }}</span>
          </button>
        </div>

        <div class="bg-[#07080A] border border-white/[0.08] rounded-xl p-3 font-mono text-xs text-[#F3F4F6] flex items-center justify-between gap-2 overflow-x-auto">
          <span class="text-indigo-400 select-none">$</span>
          <code class="flex-1 select-all text-xs text-[#F3F4F6]">{{ dockerSnippet }}</code>
          <button
            type="button"
            class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors shrink-0 cursor-pointer"
            title="Copy to clipboard"
            @click="$emit('copy-snippet', dockerSnippet)"
          >
            <NexuraIcon name="Copy" size="xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Body State 4: Scope Active & Packages Available -->
    <div
      v-else-if="packages && packages.packages && packages.packages.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <div
        v-for="pkg in packages.packages.slice(0, 6)"
        :key="pkg.id"
        class="p-3.5 rounded-xl bg-[#111318] border border-white/[0.04] hover:border-white/[0.1] transition-colors space-y-2.5"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="font-mono text-xs font-bold text-[#F3F4F6] truncate" :title="pkg.name">
              {{ pkg.name }}
            </div>
            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                class="px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold uppercase border"
                :class="getPackageTypeBadgeClass(pkg.packageType)"
              >
                {{ pkg.packageType }}
              </span>
              <span
                class="px-1.5 py-0.2 rounded-full font-mono text-[10px] border capitalize"
                :class="pkg.visibility === 'public' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-purple-500/30 bg-purple-500/10 text-purple-400'"
              >
                {{ pkg.visibility }}
              </span>
            </div>
          </div>

          <a
            v-if="pkg.htmlUrl"
            :href="pkg.htmlUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="group p-0.5 font-mono text-[11px] text-[#8A8F9E] hover:text-indigo-400 shrink-0 inline-flex items-center"
            title="Open on GitHub"
          >
            <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <div class="flex items-center justify-between font-mono text-[10px] text-[#8A8F9E] pt-1.5 border-t border-white/[0.04]">
          <span class="tabular-nums">{{ pkg.versionCount }} version{{ pkg.versionCount === 1 ? '' : 's' }}</span>
          <span class="tabular-nums">{{ formatTime(pkg.updatedAt || pkg.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubPackageOverview } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

defineProps<{
  packages: GitHubPackageOverview | null
  pending: boolean
  statusDotClass: string
  dockerSnippet: string
  copiedSnippet: boolean
}>()

defineEmits<{
  (e: 'open-modal'): void
  (e: 'refresh'): void
  (e: 'copy-snippet', text: string): void
}>()

function getPackageTypeBadgeClass(pkgType: string) {
  if (pkgType === 'container' || pkgType === 'docker') return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
  if (pkgType === 'npm') return 'border-rose-500/30 bg-rose-500/10 text-rose-400'
  if (pkgType === 'maven') return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  return 'border-white/[0.08] bg-white/[0.02] text-[#8A8F9E]'
}

function formatTime(dateStr: string): string {
  if (!dateStr) return 'recently'
  try {
    const d = new Date(dateStr)
    const diff = Math.floor((Date.now() - d.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  } catch {
    return dateStr
  }
}
</script>
