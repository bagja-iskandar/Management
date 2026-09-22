<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      :aria-label="`GitHub Packages & Container Registry for ${repo || 'repository'}`"
      tabindex="-1"
      @click.self="close"
    >
      <div
        class="w-full max-w-2xl bg-[#09090B] border border-white/[0.08] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden my-8 max-h-[88vh]"
        @click.stop
      >
        <!-- ======================================================== -->
        <!-- TERMINAL WINDOW HEADER                                   -->
        <!-- ======================================================== -->
        <div class="px-5 py-3.5 bg-[#111114] border-b border-white/[0.06] flex items-center justify-between gap-4">
          <!-- Left: Title & Subtitle -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="statusDotClass"
              aria-hidden="true"
            ></span>
            <div class="min-w-0">
              <div class="font-mono text-xs font-bold text-[#F5F2EB] truncate">
                GitHub Packages &amp; Container Registry
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                packages://ghcr.io/{{ repo || 'bagja-iskandar/management' }}
              </div>
            </div>
          </div>

          <!-- Right: Open on GitHub + Close Button -->
          <div class="flex items-center gap-3 shrink-0">
            <a
              v-if="repo"
              :href="`https://github.com/${repo}/pkgs/container`"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-xs text-[#C98A4B] hover:text-[#F5F2EB] transition-colors inline-flex items-center gap-1 group"
              title="Open Packages on GitHub"
            >
              <span>Packages</span>
              <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <button
              type="button"
              class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C98A4B] cursor-pointer"
              aria-label="Close modal"
              @click="close"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- 3 BENTO TELEMETRY TILES                                  -->
        <!-- ======================================================== -->
        <div class="p-5 pb-0 bg-[#09090B]">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <!-- Bento 1: Total Packages -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Total Packages</span>
              <div class="flex items-baseline gap-2">
                <span
                  class="font-mono text-xl font-bold"
                  :class="totalPackagesCount > 0 ? 'text-emerald-400' : 'text-[#F5F2EB]'"
                >
                  {{ summary ? totalPackagesCount : '—' }}
                </span>
                <span class="font-mono text-[10px] text-[#756F68]">artifacts</span>
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                {{ totalPackagesCount > 0 ? 'Published to registry' : 'No images active' }}
              </div>
            </div>

            <!-- Bento 2: Scope Status -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Scope Status</span>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" :class="scopeDotClass"></span>
                <span
                  class="font-mono text-base sm:text-lg font-bold"
                  :class="summary?.hasScope ? 'text-emerald-400' : 'text-[#C98A4B]'"
                >
                  {{ summary?.hasScope ? 'Active' : 'Setup Required' }}
                </span>
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                read:packages scope
              </div>
            </div>

            <!-- Bento 3: Supported Formats -->
            <div class="p-3 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-1">
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#756F68]">Supported Formats</span>
              <div class="flex items-baseline gap-1 font-mono text-xs font-bold text-[#F5F2EB] truncate">
                <span>Docker · NPM · Maven</span>
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
                ghcr.io &amp; OCI artifacts
              </div>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- CONTENT BODY                                             -->
        <!-- ======================================================== -->
        <div class="p-5 space-y-5 overflow-y-auto max-h-[calc(88vh-190px)]">
          <!-- CASE 1: Scope Setup Required (hasScope === false) -->
          <div
            v-if="summary?.hasScope === false"
            class="p-4 rounded-xl bg-[#111114] border border-[#C98A4B]/30 space-y-4"
          >
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-lg bg-[#C98A4B]/10 border border-[#C98A4B]/20 text-[#C98A4B] shrink-0">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>

              <div class="space-y-1.5 flex-1 min-w-0">
                <h4 class="font-mono text-xs uppercase tracking-wider text-[#F5F2EB] font-bold">
                  GitHub Token Scope Missing
                </h4>
                <p class="font-sans text-xs text-[#756F68] leading-relaxed">
                  The <code class="font-mono text-[#C98A4B] bg-[#C98A4B]/10 px-1 py-0.5 rounded border border-[#C98A4B]/20">read:packages</code> scope is required on your GitHub PAT to read published container images or npm packages.
                </p>
              </div>
            </div>

            <!-- Action button -->
            <div class="pt-2 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span class="font-mono text-[11px] text-[#756F68]">
                Authorize token at github.com/settings/tokens
              </span>

              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C98A4B]/15 hover:bg-[#C98A4B]/25 text-[#C98A4B] font-mono text-xs font-semibold border border-[#C98A4B]/40 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-[#C98A4B] group"
              >
                <span>Configure Token Scopes on GitHub</span>
                <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          <!-- CASE 2: Scope Active (hasScope === true) -->
          <template v-else-if="summary?.hasScope === true">
            <!-- 2A: Clean state (0 packages) -->
            <div
              v-if="!summary.packages || summary.packages.length === 0"
              class="p-6 rounded-xl bg-[#111114] border border-white/[0.06] text-center space-y-4"
            >
              <div class="w-10 h-10 mx-auto rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-lg">
                📦
              </div>

              <div class="space-y-1">
                <h4 class="font-mono text-xs font-bold text-[#F5F2EB]">
                  No packages published for this repository yet.
                </h4>
                <p class="font-sans text-xs text-[#756F68] max-w-md mx-auto">
                  Push your Docker or OCI container image to GitHub Container Registry to track release telemetry.
                </p>
              </div>

              <!-- Terminal Snippet -->
              <div class="pt-2 max-w-lg mx-auto text-left">
                <div class="text-[10px] font-mono uppercase tracking-wider text-[#756F68] mb-1.5 flex items-center justify-between">
                  <span>Push snippet</span>
                  <button
                    type="button"
                    class="hover:text-[#C98A4B] transition-colors focus:outline-none cursor-pointer"
                    @click="copySnippet(dockerSnippet)"
                  >
                    {{ copiedSnippet ? 'Copied ✓' : 'Copy command' }}
                  </button>
                </div>

                <div class="bg-[#09090B] border border-white/[0.08] rounded-xl p-3 font-mono text-xs text-[#F5F2EB] flex items-center justify-between gap-2 overflow-x-auto">
                  <span class="text-[#C98A4B] select-none">$</span>
                  <code class="flex-1 select-all text-xs text-[#F5F2EB]">{{ dockerSnippet }}</code>
                  <button
                    type="button"
                    class="p-1 rounded bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] transition-colors shrink-0"
                    title="Copy to clipboard"
                    @click="copySnippet(dockerSnippet)"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- 2B: Packages List -->
            <div v-else class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-mono text-xs uppercase tracking-wider text-[#756F68] flex items-center gap-2">
                  <span>Published Packages</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white/5 border border-white/[0.06] text-[#756F68]">
                    {{ summary.packages.length }}
                  </span>
                </h3>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="pkg in summary.packages"
                  :key="pkg.id"
                  class="p-4 rounded-xl bg-[#111114] hover:bg-[#18181C] border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-3"
                >
                  <!-- Row 1: Name, Type Badge, Visibility, and Link -->
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0 flex-wrap">
                      <span class="font-mono text-sm font-bold text-[#F5F2EB] truncate">
                        {{ pkg.name }}
                      </span>

                      <!-- Package Type Badge -->
                      <span
                        class="font-mono text-[10px] px-2 py-0.5 rounded border uppercase font-semibold tracking-wider"
                        :class="getPackageTypeBadgeClass(pkg.packageType)"
                      >
                        {{ pkg.packageType }}
                      </span>

                      <!-- Visibility Pill -->
                      <span
                        class="font-mono text-[10px] px-1.5 py-0.2 rounded-full border capitalize"
                        :class="pkg.visibility === 'public'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-purple-500/30 bg-purple-500/10 text-purple-400'"
                      >
                        {{ pkg.visibility }}
                      </span>
                    </div>

                    <!-- Open on GitHub Action -->
                    <a
                      v-if="pkg.htmlUrl"
                      :href="pkg.htmlUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 font-mono text-xs text-[#C98A4B] hover:text-[#F5F2EB] transition-colors shrink-0 group"
                      title="Open on GitHub"
                    >
                      <span>Open on GitHub</span>
                      <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>

                  <!-- Row 2: Version count, updated date, and repo owner -->
                  <div class="flex items-center justify-between font-mono text-[11px] text-[#756F68] pt-1 border-t border-white/[0.04] flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-[#F5F2EB]/80">
                        {{ pkg.versionCount }} version{{ pkg.versionCount === 1 ? '' : 's' }}
                      </span>
                      <span v-if="pkg.owner" class="text-white/20 select-none">·</span>
                      <span v-if="pkg.owner">
                        by {{ pkg.owner }}
                      </span>
                    </div>

                    <span>
                      Updated {{ formatRelativeTime(pkg.updatedAt || pkg.createdAt) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- CASE 3: Loading or null summary -->
          <div v-else class="py-10 text-center font-mono text-xs text-[#756F68]">
            <span class="inline-block w-2 h-2 rounded-full bg-[#C98A4B] animate-pulse mr-2"></span>
            Syncing registry telemetry...
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { GitHubPackageSummary } from '~/types'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    repo?: string
    summary: GitHubPackageSummary | null
  }>(),
  {
    repo: '',
    summary: null
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

function close() {
  emit('close')
}

// ESC Key Listener
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (typeof window !== 'undefined') {
      if (open) {
        window.addEventListener('keydown', onKeyDown)
      } else {
        window.removeEventListener('keydown', onKeyDown)
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.isOpen && typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeyDown)
  }
})

// Computeds
const totalPackagesCount = computed(() => props.summary?.totalPackages ?? props.summary?.packages?.length ?? 0)

const statusDotClass = computed(() => {
  if (!props.summary) return 'bg-[#756F68]'
  if (!props.summary.hasScope) return 'bg-[#C98A4B]'
  if (totalPackagesCount.value > 0) return 'bg-emerald-400'
  return 'bg-[#756F68]'
})

const scopeDotClass = computed(() => {
  if (!props.summary) return 'bg-[#756F68]'
  return props.summary.hasScope ? 'bg-emerald-400' : 'bg-[#C98A4B]'
})

const dockerSnippet = computed(() => {
  const r = props.repo ? props.repo.toLowerCase() : 'bagja-iskandar/management'
  return `docker push ghcr.io/${r}:latest`
})

const copiedSnippet = ref(false)
async function copySnippet(text: string) {
  try {
    if (navigator?.clipboard) {
      await navigator.clipboard.writeText(text)
      copiedSnippet.value = true
      setTimeout(() => {
        copiedSnippet.value = false
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

function getPackageTypeBadgeClass(type?: string): string {
  switch (type?.toLowerCase()) {
    case 'container':
    case 'docker':
      return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
    case 'npm':
      return 'border-[#C98A4B]/30 bg-[#C98A4B]/10 text-[#C98A4B]'
    case 'maven':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-400'
    default:
      return 'border-white/[0.08] bg-white/5 text-[#756F68]'
  }
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
</script>
