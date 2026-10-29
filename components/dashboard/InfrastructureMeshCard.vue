<template>
  <section class="obs-card rounded-xl p-4 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
      <div class="flex items-center gap-2">
        <NexuraIcon name="Server" size="sm" class="text-indigo-400 shrink-0" />
        <h2 class="text-sm font-semibold text-[#F3F4F6]">Infrastructure Mesh</h2>
      </div>
      <span
        class="font-mono text-xs px-2 py-0.5 rounded border flex items-center gap-1.5"
        :class="telemetryData?.environment === 'production'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="telemetryData?.environment === 'production' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'"
        ></span>
        {{ telemetryData?.environment === 'production' ? 'Production Topology · 3 Services' : 'Development Topology · Local Runtime' }}
      </span>
    </div>

    <!-- 3 Core Services Stack -->
    <div class="space-y-2.5 text-xs">
      <!-- 1. Supabase PostgreSQL -->
      <div class="p-2.5 rounded-lg bg-[#0B0C10]/80 border border-white/[0.06] flex items-center justify-between">
        <div class="min-w-0 pr-2">
          <div class="text-xs font-medium text-[#F3F4F6] flex items-center gap-2 truncate">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="telemetryData?.supabase?.healthy ? 'bg-emerald-400 animate-pulse' : (telemetryData?.supabase?.configured ? 'bg-amber-400' : 'bg-[#565B68]')"
            ></span>
            <span>Supabase PostgreSQL</span>
          </div>
          <div class="text-[11px] text-[#8A8F9E] font-mono mt-0.5 truncate">
            {{ supabaseSubtitle }}
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <span
            class="font-mono text-[11px] px-2 py-0.5 rounded border"
            :class="telemetryData?.supabase?.healthy
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : (telemetryData?.supabase?.configured
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-zinc-400 bg-white/[0.04] border-white/[0.08]')"
          >
            {{ telemetryData?.supabase?.healthy ? 'Connected' : (telemetryData?.supabase?.configured ? 'Standby' : 'Local Fallback') }}
          </span>
          <span v-if="telemetryData?.supabase?.latencyMs != null" class="text-[10px] text-emerald-400/90 font-mono hidden sm:inline tabular-nums">
            {{ telemetryData.supabase.latencyMs }}ms
          </span>
        </div>
      </div>

      <!-- 2. Application / Edge Runtime -->
      <div class="p-2.5 rounded-lg bg-[#0B0C10]/80 border border-white/[0.06] flex items-center justify-between">
        <div class="min-w-0 pr-2">
          <div class="text-xs font-medium text-[#F3F4F6] flex items-center gap-2 truncate">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="telemetryData?.vercel?.isRuntime ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'"
            ></span>
            <span>{{ telemetryData?.vercel?.isRuntime ? 'Vercel Edge Network' : 'Node.js App Server' }}</span>
          </div>
          <div class="text-[11px] text-[#8A8F9E] font-mono mt-0.5 truncate">
            {{ telemetryData?.vercel?.isRuntime ? '200 OK · Edge Liveness Probe' : 'Localhost · Liveness Probe' }}
          </div>
        </div>
        <button
          type="button"
          class="font-mono text-[11px] text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 shrink-0"
          :disabled="isPinging"
          @click="pingEdge"
        >
          <NexuraIcon name="Zap" size="xs" :class="{ 'animate-bounce': isPinging }" />
          <span>{{ pingResult || 'Ping Edge ⚡' }}</span>
        </button>
      </div>

      <!-- 3. Storage Persistence -->
      <div class="p-2.5 rounded-lg bg-[#0B0C10]/80 border border-white/[0.06] flex items-center justify-between">
        <div class="min-w-0 pr-2">
          <div class="text-xs font-medium text-[#F3F4F6] flex items-center gap-2 truncate">
            <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span>Storage Persistence</span>
          </div>
          <div class="text-[11px] text-[#8A8F9E] font-mono mt-0.5 truncate">
            {{ telemetryData?.storage?.provider || 'Dual-layer Persistence · Configured' }}
          </div>
        </div>
        <span class="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
          {{ telemetryData?.storage?.routing === 'supabase' ? 'PostgreSQL' : 'Active KV' }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import NexuraIcon from '../ui/NexuraIcon.vue'

interface TelemetrySummary {
  environment?: string
  storage?: {
    provider?: string
    routing?: string
  }
  supabase?: {
    configured?: boolean
    healthy?: boolean
    latencyMs?: number | null
  }
  vercel?: {
    isRuntime?: boolean
    status?: string
  }
}

const { data: telemetryData } = useLazyAsyncData<TelemetrySummary>(
  'system-telemetry',
  () => $fetch('/api/telemetry')
)

const supabaseSubtitle = computed(() => {
  if (telemetryData.value?.supabase?.healthy && telemetryData.value.supabase.latencyMs != null) {
    return `Supabase Cloud Engine · ${telemetryData.value.supabase.latencyMs}ms roundtrip`
  }
  if (telemetryData.value?.supabase?.configured) {
    return 'Supabase Cloud Engine · ap-southeast-1'
  }
  return 'Local Nitro Key-Value Fallback'
})

const isPinging = ref(false)
const pingResult = ref<string | null>(null)

async function pingEdge() {
  isPinging.value = true
  const start = performance.now()
  try {
    await $fetch('/api/ping', { method: 'GET' })
    const elapsed = Math.round(performance.now() - start)
    pingResult.value = `${elapsed}ms · OK`
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.toLowerCase().includes('timeout')) {
      pingResult.value = 'Timeout · Err'
    } else {
      pingResult.value = 'Offline · Err'
    }
  } finally {
    isPinging.value = false
    setTimeout(() => {
      pingResult.value = null
    }, 3000)
  }
}
</script>
