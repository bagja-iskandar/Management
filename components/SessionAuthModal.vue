<template>
  <div
    v-if="isAuthModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    @click.self="onCancel"
    role="presentation"
  >
    <div
      ref="dialogRef"
      class="w-full max-w-md bg-[#0B0C10] border border-white/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85)] rounded-2xl p-5 sm:p-6 flex flex-col gap-5 outline-none my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-auth-title"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 pb-3 border-b border-white/[0.06]">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <NexuraIcon name="KeyRound" size="sm" :stroke-width="2" />
          </div>
          <div>
            <h2 id="session-auth-title" class="font-sans text-sm font-semibold text-[#F3F4F6]">
              Verify Session Access
            </h2>
            <p class="font-sans text-xs text-[#8A8F9E] mt-0.5">
              Authenticate your active session to sync changes to the server.
            </p>
          </div>
        </div>
        <button
          type="button"
          class="w-7 h-7 rounded-lg hover:bg-white/[0.06] text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors flex items-center justify-center cursor-pointer shrink-0"
          aria-label="Close modal"
          @click="onCancel"
        >
          <NexuraIcon name="X" size="sm" :stroke-width="2" />
        </button>
      </div>

      <!-- Success Notification -->
      <div
        v-if="showSuccess"
        class="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn font-sans"
        role="status"
      >
        <NexuraIcon name="CheckCircle2" size="sm" class="shrink-0 text-emerald-400" />
        <span class="font-medium">Session verified successfully. Please proceed with your changes.</span>
      </div>

      <!-- Error Alert -->
      <div
        v-else-if="authError || localError"
        class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono tabular-nums flex items-center gap-2"
        role="alert"
      >
        <NexuraIcon name="AlertCircle" size="sm" class="shrink-0 text-rose-400" />
        <span>{{ authError || localError }}</span>
      </div>

      <!-- Auth Form -->
      <form v-if="!showSuccess" class="flex flex-col gap-4" @submit.prevent="submitKey" novalidate>
        <div class="flex flex-col gap-1.5">
          <label for="session-access-key-input" class="font-sans text-xs font-semibold text-[#F3F4F6]">
            Secret Access Key <span class="text-rose-400">*</span>
          </label>
          <input
            id="session-access-key-input"
            ref="inputRef"
            v-model="accessKeyInput"
            type="password"
            autocomplete="current-password"
            placeholder="Enter Nexura access key..."
            :disabled="isSubmitting"
            class="w-full bg-[#07080A] border border-white/[0.08] hover:border-white/[0.14] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 text-[#F3F4F6] placeholder-[#8A8F9E]/40 rounded-xl px-3.5 py-2.5 text-xs font-sans tracking-normal transition-all outline-none disabled:opacity-50"
            @keydown.esc="onCancel"
          />
          <div class="flex items-center gap-1.5 text-[11px] text-[#8A8F9E]/70 font-sans mt-0.5">
            <NexuraIcon name="ShieldCheck" size="xs" class="text-emerald-400 shrink-0" />
            <span>Keys are verified server-side and issued as an encrypted HttpOnly cookie.</span>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            :disabled="isSubmitting"
            class="px-3 py-1.5 rounded-lg text-xs font-medium font-sans text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-40"
            @click="onCancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!accessKeyInput.trim() || isSubmitting"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold font-sans bg-[#F3F4F6] hover:bg-white text-[#07080A] shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <NexuraIcon
              v-if="isSubmitting"
              name="Loader2"
              size="xs"
              class="animate-spin text-[#07080A]"
            />
            <NexuraIcon
              v-else
              name="ShieldCheck"
              size="xs"
              :stroke-width="2.2"
            />
            <span>{{ isSubmitting ? 'Verifying...' : 'Verify Session' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import NexuraIcon from './ui/NexuraIcon.vue'
import { useSession } from '~/composables/useSession'

const session = useSession()
const { isAuthModalOpen, authError, isSubmitting } = session

const accessKeyInput = ref('')
const localError = ref<string | null>(null)
const showSuccess = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const dialogRef = ref<HTMLDivElement | null>(null)

// Focus input whenever modal opens
watch(
  () => isAuthModalOpen.value,
  async (open) => {
    if (open) {
      localError.value = null
      showSuccess.value = false
      await nextTick()
      inputRef.value?.focus()
    } else {
      accessKeyInput.value = ''
      localError.value = null
      showSuccess.value = false
    }
  }
)

async function submitKey() {
  const trimmed = accessKeyInput.value.trim()
  if (!trimmed || isSubmitting.value) return

  localError.value = null
  try {
    const ok = await session.loginWithAccessKey(trimmed)
    if (ok) {
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
        session.closeAuthModal()
      }, 1400)
    } else {
      localError.value = session.authError.value || 'Invalid access key provided'
    }
  } finally {
    // Guaranteed zero memory retention of secret in local form state
    accessKeyInput.value = ''
  }
}

function onCancel() {
  if (isSubmitting.value) return
  accessKeyInput.value = ''
  localError.value = null
  showSuccess.value = false
  session.closeAuthModal()
}
</script>
