<template>
  <div class="space-y-6 pb-12 select-none">
    <!-- Header Sub-bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div>
        <h1 class="font-sans text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
          System Settings & Environment
        </h1>
        <p class="font-sans text-xs text-muted mt-0.5">
          Configure security credentials, inspect infrastructure telemetry, and customize workspace preferences.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="font-mono text-xs px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1.5"
          :class="isAuthenticated ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="isAuthenticated ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
          {{ isAuthenticated ? 'Session Active' : 'Read-Only Session' }}
        </span>
      </div>
    </div>

    <!-- Feedback Banner -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <div
        v-if="feedbackMessage"
        class="p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 shadow-lg"
        :class="feedbackType === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'"
        role="status"
      >
        <div class="flex items-center gap-2">
          <NexuraIcon
            :name="feedbackType === 'error' ? 'AlertTriangle' : 'CheckCircle2'"
            size="sm"
            class="shrink-0"
            :class="feedbackType === 'error' ? 'text-rose-400' : 'text-emerald-400'"
          />
          <span>{{ feedbackMessage }}</span>
        </div>
        <button
          type="button"
          class="text-xs hover:opacity-80 shrink-0 cursor-pointer p-1 rounded hover:bg-white/[0.04]"
          aria-label="Dismiss feedback"
          @click="feedbackMessage = ''"
        >
          <NexuraIcon name="X" size="xs" />
        </button>
      </div>
    </transition>

    <!-- 3-Pillar Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- ================================================================= -->
      <!-- BENTO CARD 1: SESSION & SECURITY COCKPIT                          -->
      <!-- ================================================================= -->
      <section class="obs-card rounded-2xl p-5 sm:p-6 border border-white/[0.07] bg-surface flex flex-col justify-between gap-6 shadow-sm">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <NexuraIcon name="ShieldCheck" size="sm" />
              </div>
              <div>
                <h2 class="font-sans text-sm font-semibold text-foreground tracking-tight">Security & Session</h2>
                <p class="font-sans text-xs text-muted">Manage administrative access key & authorization state</p>
              </div>
            </div>
            <span
              class="font-mono text-xs px-2 py-0.5 rounded border"
              :class="isAuthenticated ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
            >
              {{ isAuthenticated ? 'WRITE ENABLED' : 'READ ONLY' }}
            </span>
          </div>

          <p class="text-xs text-muted leading-relaxed">
            Write actions (creating, updating, and deleting tasks or projects) require a valid cryptographic access key. When unauthenticated, the workspace operates in deterministic read-only mode.
          </p>

          <!-- Access Key Input Form -->
          <div class="space-y-2 pt-2">
            <label class="block font-mono text-xs text-muted">
              Workspace Access Key
            </label>
            <div class="relative">
              <input
                v-model="accessKeyInput"
                :type="showAccessKey ? 'text' : 'password'"
                placeholder="Enter access key..."
                autocomplete="off"
                spellcheck="false"
                class="w-full bg-void border border-white/[0.08] hover:border-white/[0.15] focus:border-emerald-500/50 rounded-xl px-3.5 py-2 pr-10 text-xs font-mono text-foreground outline-none transition placeholder:text-dim"
                @keydown.enter="onSubmitAccessKey"
              />
              <button
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition p-1 cursor-pointer"
                :title="showAccessKey ? 'Hide key' : 'Show key'"
                @click="showAccessKey = !showAccessKey"
              >
                <NexuraIcon :name="showAccessKey ? 'EyeOff' : 'Eye'" size="xs" />
              </button>
            </div>
            <span v-if="authError" class="block font-mono text-xs text-rose-400">
              {{ authError }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2.5 pt-3 border-t border-white/[0.06]">
          <button
            type="button"
            :disabled="isSubmitting || !accessKeyInput.trim()"
            class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-foreground hover:bg-white disabled:opacity-50 disabled:pointer-events-none text-xs font-mono font-semibold text-void transition cursor-pointer shadow-sm"
            @click="onSubmitAccessKey"
          >
            <NexuraIcon v-if="!isSubmitting" name="KeyRound" size="xs" />
            <NexuraIcon v-else name="Loader2" size="xs" class="animate-spin" />
            <span>{{ isSubmitting ? 'Verifying...' : 'Authenticate' }}</span>
          </button>

          <button
            v-if="isAuthenticated"
            type="button"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-400 border border-white/[0.08] hover:border-rose-500/30 text-xs font-mono text-muted transition cursor-pointer"
            title="Terminate Active Session"
            @click="onClearSession"
          >
            <NexuraIcon name="LogOut" size="xs" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- BENTO CARD 2: INFRASTRUCTURE & REPO ALLOWLIST                     -->
      <!-- ================================================================= -->
      <section class="obs-card rounded-2xl p-5 sm:p-6 border border-white/[0.07] bg-surface flex flex-col justify-between gap-6 shadow-sm">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <NexuraIcon name="Server" size="sm" />
              </div>
              <div>
                <h2 class="font-sans text-sm font-semibold text-foreground tracking-tight">Telemetry & Allowlist</h2>
                <p class="font-sans text-xs text-muted">Infrastructure connectivity & allowed repository scope</p>
              </div>
            </div>
            <span class="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>

          <div class="space-y-2.5 bg-void border border-white/[0.06] rounded-xl p-3.5 font-mono text-xs">
            <!-- Supabase Status -->
            <div class="flex items-center justify-between">
              <span class="text-muted flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full" :class="(telemetry?.supabase?.ok || telemetry?.supabase?.healthy) ? 'bg-emerald-400' : 'bg-zinc-500'"></span>
                <span>Supabase Live Probe</span>
              </span>
              <span v-if="(telemetry?.supabase?.ok || telemetry?.supabase?.healthy) && telemetry?.supabase?.latencyMs != null" class="text-emerald-400 font-medium">
                Healthy · {{ telemetry.supabase.latencyMs }}ms
              </span>
              <span v-else class="text-zinc-500">
                —
              </span>
            </div>

            <!-- GitHub Rate Limit -->
            <div class="flex items-center justify-between">
              <span class="text-muted flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full" :class="telemetry?.github?.rateLimit ? 'bg-emerald-400' : 'bg-zinc-500'"></span>
                <span>GitHub API Quota</span>
              </span>
              <span v-if="telemetry?.github?.rateLimit" class="text-foreground tabular-nums font-semibold">
                {{ telemetry.github.rateLimit.remaining }} / {{ telemetry.github.rateLimit.limit }}
              </span>
              <span v-else class="text-zinc-500 font-mono">
                — / —
              </span>
            </div>

            <!-- Environment Status -->
            <div class="flex items-center justify-between">
              <span class="text-muted flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                <span>Runtime Node</span>
              </span>
              <span class="text-zinc-300">{{ telemetry?.environment ?? 'Development (Localhost)' }}</span>
            </div>
          </div>

          <!-- Permitted GitHub Allowlist Repositories -->
          <div class="space-y-1.5">
            <span class="block font-mono text-xs text-muted">
              Allowed GitHub Repositories (Strict Policy)
            </span>
            <div class="max-h-[110px] overflow-y-auto custom-scrollbar space-y-1 pr-1 font-mono text-xs">
              <div
                v-for="repo in allowedRepos"
                :key="repo"
                class="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-void/80 border border-white/[0.04] text-foreground"
              >
                <div class="flex items-center gap-2 truncate">
                  <NexuraIcon name="GitBranch" size="xs" class="text-emerald-400 shrink-0" />
                  <span class="truncate text-xs">{{ repo }}</span>
                </div>
                <span class="text-xs leading-none uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                  Allowed
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-muted">
          <span>Security Policy</span>
          <span class="text-emerald-300">Enforced via SSR Allowlist</span>
        </div>
      </section>

      <!-- ================================================================= -->
      <!-- BENTO CARD 3: VISUAL ENVIRONMENT PREFERENCES                      -->
      <!-- ================================================================= -->
      <section class="obs-card rounded-2xl p-5 sm:p-6 border border-white/[0.07] bg-surface flex flex-col justify-between gap-6 shadow-sm">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <NexuraIcon name="Palette" size="sm" />
              </div>
              <div>
                <h2 class="font-sans text-sm font-semibold text-foreground tracking-tight">Theme & Appearance</h2>
                <p class="font-sans text-xs text-muted">Precision Dark Obsidian Bento visual presets</p>
              </div>
            </div>
            <span class="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.08]">
              DARK VOID
            </span>
          </div>

          <p class="text-xs text-muted leading-relaxed">
            All themes adhere to the Precision Dark Obsidian aesthetic, featuring cool void backdrops (<code class="font-mono text-xs text-foreground">#07080A</code>) and elevated glass cards.
          </p>

          <!-- Theme Choices -->
          <div class="space-y-2 pt-1">
            <button
              v-for="preset in themePresets"
              :key="preset.id"
              type="button"
              class="w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer"
              :class="currentPreset === preset.id
                ? 'bg-white/[0.08] border-accent/50 text-white shadow-sm'
                : 'bg-void/60 border-white/[0.05] hover:border-white/[0.12] text-muted hover:text-foreground'"
              @click="onSelectTheme(preset.id)"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" :style="{ backgroundColor: preset.accentColor }"></span>
                <div>
                  <div class="text-xs font-medium text-foreground">{{ preset.label }}</div>
                  <div class="text-xs text-muted font-mono">{{ preset.description }}</div>
                </div>
              </div>
              <NexuraIcon v-if="currentPreset === preset.id" name="Check" size="xs" class="text-accent-light" />
            </button>
          </div>
        </div>

        <div class="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-muted">
          <span>Current Active</span>
          <span class="text-accent-light font-semibold">{{ presetLabel }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useThemePreset, THEME_PRESETS, type ThemePresetId } from '~/composables/useThemePreset'
import NexuraIcon from '~/components/ui/NexuraIcon.vue'
import { useSession } from '~/composables/useSession'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useHeaderActions } from '~/composables/useHeaderActions'

// Session & Security
const session = useSession()
const { isAuthenticated, authError, isSubmitting, loginWithAccessKey, checkSession } = session
const accessKeyInput = ref('')
const showAccessKey = ref(false)

// Workspace & Telemetry Data
const workspaceStore = useWorkspaceStore()
const { data: telemetry, refresh: refreshTelemetry } = useLazyAsyncData('settings-telemetry', () =>
  $fetch<any>('/api/telemetry').catch(() => null)
)

const allowedRepos = computed<string[]>(() => {
  const projectRepos = (workspaceStore.projects.value || [])
    .map((p) => p.githubRepo)
    .filter((r): r is string => Boolean(r))
  const base = ['bagja-iskandar/Management', 'bagja-iskandar/nexura-app-server']
  return Array.from(new Set([...base, ...projectRepos]))
})

// Visual Theme Presets (SSOT from useThemePreset)
const { currentPreset, currentPresetOption, setPreset } = useThemePreset()
const presetLabel = computed(() => currentPresetOption.value?.label ?? currentPreset.value)
const themePresets = THEME_PRESETS

function onSelectTheme(id: ThemePresetId) {
  setPreset(id)
  showFeedback(`Visual theme changed to ${presetLabel.value}`)
}

// Toast Feedback System
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')

function showFeedback(msg: string, type: 'success' | 'error' = 'success') {
  feedbackMessage.value = msg
  feedbackType.value = type
  setTimeout(() => {
    if (feedbackMessage.value === msg) {
      feedbackMessage.value = ''
    }
  }, 4000)
}

async function onSubmitAccessKey() {
  if (!accessKeyInput.value.trim() || isSubmitting.value) return
  const ok = await loginWithAccessKey(accessKeyInput.value.trim())
  if (ok) {
    accessKeyInput.value = ''
    showFeedback('Authentication successful! Full administrative write session unlocked.')
  } else {
    showFeedback('Invalid access key provided.', 'error')
  }
}

async function onClearSession() {
  await session.logout()
  showFeedback('Signed out. Workspace session converted to Read-Only.')
}

async function onRefreshAll() {
  try {
    await Promise.allSettled([checkSession(), refreshTelemetry()])
    showFeedback('System telemetry & authentication status refreshed')
  } catch (err: any) {
    showFeedback(`Refresh failed: ${err?.message || 'Network error'}`, 'error')
  }
}

// Header Actions integration
const { setActions, clearActions } = useHeaderActions()

onMounted(() => {
  setActions([
    {
      id: 'refresh-settings',
      label: 'Refresh Status',
      icon: 'RotateCw',
      variant: 'secondary',
      handler: onRefreshAll
    }
  ])
})

onBeforeUnmount(() => {
  clearActions()
})
</script>
