<template>
  <section class="obs-card rounded-2xl p-3.5 space-y-2 border border-white/[0.06] bg-surface">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
      <div class="flex items-center gap-2 min-w-0">
        <NexuraIcon name="Server" size="sm" class="text-accent-light shrink-0" />
        <h2 class="text-sm font-semibold text-foreground truncate">Infrastructure Mesh</h2>
      </div>
      <span
        class="font-mono text-xs px-2 py-0.5 rounded-lg border flex items-center gap-1.5 whitespace-nowrap shrink-0"
        :class="telemetryData?.environment === 'production'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-white/[0.04] text-muted border-white/[0.08]'"
        :title="telemetryData?.environment === 'production' ? 'Production Topology · 3 Services' : 'Development Topology · Local Runtime'"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="telemetryData?.environment === 'production' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'"
        ></span>
        {{ telemetryData?.environment === 'production' ? 'Prod · 3' : 'Dev · Local' }}
      </span>
    </div>

    <!-- 3-Column Compact Grid -->
    <div class="grid grid-cols-3 gap-1.5 text-xs">
      <!-- Tile 1: Supabase -->
      <div
        class="p-2 rounded-xl bg-canvas/80 border border-white/[0.06] flex flex-col justify-between gap-1.5 min-w-0"
        :title="supabaseSubtitle"
      >
        <div class="flex items-center gap-1.5 min-w-0">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="telemetryData?.supabase?.healthy ? 'bg-emerald-400 animate-pulse' : (telemetryData?.supabase?.configured ? 'bg-amber-400' : 'bg-zinc-600')"
          ></span>
          <span class="text-xs font-medium text-foreground truncate">Supabase</span>
        </div>
        <span
          class="w-full text-center font-mono text-xs px-1 py-0.5 rounded-md border truncate"
          :class="telemetryData?.supabase?.healthy
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : (telemetryData?.supabase?.configured
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-zinc-400 bg-white/[0.04] border-white/[0.08]')"
        >
          {{ telemetryData?.supabase?.healthy ? (telemetryData.supabase.latencyMs != null ? `${telemetryData.supabase.latencyMs}ms OK` : 'Connected') : (telemetryData?.supabase?.configured ? 'Standby' : 'Local') }}
        </span>
      </div>

      <!-- Tile 2: Runtime -->
      <div
        class="p-2 rounded-xl bg-canvas/80 border border-white/[0.06] flex flex-col justify-between gap-1.5 min-w-0"
        :title="telemetryData?.vercel?.isRuntime ? 'Vercel Edge Network · 200 OK' : 'Node.js App Server · Localhost'"
      >
        <div class="flex items-center gap-1.5 min-w-0">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="telemetryData?.vercel?.isRuntime ? 'bg-emerald-400 animate-pulse' : 'bg-accent-light'"
          ></span>
          <span class="text-xs font-medium text-foreground truncate">
            {{ telemetryData?.vercel?.isRuntime ? 'Edge' : 'Runtime' }}
          </span>
        </div>
        <button
          type="button"
          class="w-full font-mono text-xs text-accent-light bg-accent/15 hover:bg-accent/25 border border-accent/30 px-1.5 py-0.5 rounded-md transition cursor-pointer flex items-center justify-center gap-1 min-w-0"
          :disabled="isPinging"
          :title="pingResult || 'Ping Edge Liveness Probe'"
          @click="pingEdge"
        >
          <NexuraIcon name="Zap" size="xs" class="shrink-0" :class="{ 'animate-bounce': isPinging }" />
          <span class="truncate">{{ pingLabel }}</span>
        </button>
      </div>

      <!-- Tile 3: Storage -->
      <div
        class="p-2 rounded-xl bg-canvas/80 border border-white/[0.06] flex flex-col justify-between gap-1.5 min-w-0"
        :title="telemetryData?.storage?.provider || 'Dual-layer Persistence · Configured'"
      >
        <div class="flex items-center gap-1.5 min-w-0">
          <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span class="text-xs font-medium text-foreground truncate">Storage</span>
        </div>
        <span
          class="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded-md truncate text-center w-full"
          :title="telemetryData?.storage?.routing === 'supabase' ? 'PostgreSQL' : 'Active KV'"
        >
          {{ telemetryData?.storage?.routing === 'supabase' ? 'Postgres' : 'Active KV' }}
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

const pingLabel = computed(() => {
  if (pingResult.value === 'Timeout · Err') return 'Timeout'
  if (pingResult.value === 'Offline · Err') return 'Offline'
  return pingResult.value || 'Ping'
})

async function pingEdge() {
  isPinging.value = true
  const start = performance.now()
  try {
    await $fetch('/api/ping', { method: 'GET' })
    const elapsed = Math.round(performance.now() - start)
    pingResult.value = `${elapsed}ms`
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
