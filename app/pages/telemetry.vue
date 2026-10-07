<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
      <div>
        <div class="inline-flex items-center gap-1.5 font-mono text-xs text-[#C98A4B] bg-[#C98A4B]/10 px-2.5 py-0.5 rounded border border-[#C98A4B]/20 uppercase tracking-wider mb-2">
          <span>●</span>
          <span>System Health</span>
        </div>
        <h1 class="font-mono text-xl sm:text-2xl font-bold text-[#F5F2EB]">System Telemetry</h1>
        <p class="font-sans text-xs text-[#756F68] mt-1">Real-time infrastructure health, external API quotas, and storage persistence telemetry.</p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-mono text-xs border border-white/[0.08] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
          @click="refreshTelemetry"
        >
          <svg class="w-3.5 h-3.5 text-[#C98A4B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>Refresh Telemetry</span>
        </button>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F2EB] font-sans text-xs font-medium border border-white/[0.08] transition-colors focus:ring-1 focus:ring-[#C98A4B] focus:outline-none"
        >
          <svg class="w-3.5 h-3.5 text-[#756F68]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Dashboard</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Overview Connectivity Matrix Strip -->
    <div class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] flex items-center gap-4 sm:gap-6 flex-wrap font-mono text-xs">
      <span class="text-[#756F68] uppercase text-[10px] tracking-wider">Service Mesh:</span>
      <div class="flex items-center gap-1.5">
        <span class="text-green-500 animate-pulse">●</span>
        <span class="text-[#F5F2EB]">Nitro KV</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span :class="telemetryData?.github?.configured ? 'text-green-500' : 'text-[#756F68]'">●</span>
        <span class="text-[#F5F2EB]">GitHub API</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span :class="telemetryData?.supabase?.configured ? 'text-emerald-400 animate-pulse' : 'text-[#756F68]'">●</span>
        <span :class="telemetryData?.supabase?.configured ? 'text-[#F5F2EB]' : 'text-[#756F68]'">Supabase PG</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span :class="telemetryData?.vercel?.configured ? 'text-emerald-400 animate-pulse' : 'text-[#756F68]'">●</span>
        <span :class="telemetryData?.vercel?.configured ? 'text-[#F5F2EB]' : 'text-[#756F68]'">Vercel Deploy</span>
      </div>
    </div>

    <!-- 4 Telemetry Panels Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- 1. Storage: Nitro KV (Local) -->
      <section class="p-6 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-5">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 text-xs">●</span>
                <h2 class="font-mono text-base font-semibold text-[#F5F2EB]">Storage: {{ telemetryData?.storage?.provider || 'Supabase PostgreSQL (Cloud)' }}</h2>
              </div>
              <p class="font-sans text-xs text-[#756F68] mt-1">
                {{ telemetryData?.storage?.provider?.includes('Supabase') ? 'Remote Supabase PostgreSQL relational engine with Nitro KV fallback adapter.' : 'Unstorage filesystem driver persisting records to local key-value store.' }}
              </p>
            </div>
            <span class="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Active
            </span>
          </div>

          <!-- Counts Grid -->
          <div class="grid grid-cols-3 gap-3 pt-2 font-mono">
            <div class="p-3 rounded-lg bg-[#09090B] border border-white/[0.04]">
              <span class="text-[10px] text-[#756F68] uppercase tracking-wider block">Tasks</span>
              <span class="text-xl font-bold text-[#F5F2EB] mt-1 block">
                {{ telemetryData?.storage?.counts?.tasks ?? 0 }}
              </span>
            </div>
            <div class="p-3 rounded-lg bg-[#09090B] border border-white/[0.04]">
              <span class="text-[10px] text-[#756F68] uppercase tracking-wider block">Projects</span>
              <span class="text-xl font-bold text-[#F5F2EB] mt-1 block">
                {{ telemetryData?.storage?.counts?.projects ?? 0 }}
              </span>
            </div>
            <div class="p-3 rounded-lg bg-[#09090B] border border-white/[0.04]">
              <span class="text-[10px] text-[#756F68] uppercase tracking-wider block">Sprints</span>
              <span class="text-xl font-bold text-[#F5F2EB] mt-1 block">
                {{ telemetryData?.storage?.counts?.sprints ?? 0 }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/[0.04] flex items-center justify-between font-mono text-xs text-[#756F68]">
          <span>Path: <strong class="text-[#F5F2EB]">{{ telemetryData?.storage?.path || 'Remote PostgreSQL' }}</strong></span>
          <span>Status: <strong class="text-emerald-400">Connected</strong></span>
        </div>
      </section>

      <!-- 2. GitHub API Panel -->
      <section class="p-6 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-5">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span :class="telemetryData?.github?.configured ? 'text-green-500' : 'text-[#756F68]'" class="text-xs">●</span>
                <h2 class="font-mono text-base font-semibold text-[#F5F2EB]">GitHub API Gateway</h2>
              </div>
              <p class="font-sans text-xs text-[#756F68] mt-1">REST API v3 rate limits, proxy caching, and token telemetry.</p>
            </div>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded border"
              :class="telemetryData?.github?.configured ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-white/5 text-[#756F68] border-white/[0.08]'"
            >
              {{ telemetryData?.github?.configured ? 'Authenticated' : 'Standard Rate' }}
            </span>
          </div>

          <!-- Rate Limit Display -->
          <div class="space-y-2 pt-1 font-mono">
            <div class="flex items-baseline justify-between">
              <span class="text-xs text-[#756F68]">Rate Limit Quota</span>
              <span class="text-lg font-bold text-[#F5F2EB]">
                {{ telemetryData?.github?.rateLimit?.remaining ?? 0 }} / {{ telemetryData?.github?.rateLimit?.limit ?? 60 }}
              </span>
            </div>

            <!-- Rate bar -->
            <div class="w-full bg-[#09090B] rounded-full h-2 border border-white/[0.06] overflow-hidden">
              <div
                class="bg-[#C98A4B] h-full rounded-full transition-all duration-500"
                :style="{ width: `${ratePercent}%` }"
              ></div>
            </div>

            <div class="flex items-center justify-between text-xs text-[#756F68] pt-1">
              <span>Account: <strong class="text-[#F5F2EB]">{{ telemetryData?.github?.username || 'bagja-iskandar' }}</strong></span>
              <span>Reset in: <strong class="text-[#C98A4B]">{{ resetMinutes }}m</strong></span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/[0.04] flex items-center justify-between font-mono text-xs text-[#756F68]">
          <span>Cache: <strong class="text-[#F5F2EB]">TTL 300s</strong></span>
          <span>Status: <strong :class="telemetryData?.github?.error ? 'text-red-400' : 'text-green-400'">{{ telemetryData?.github?.error || 'Healthy' }}</strong></span>
        </div>
      </section>

      <!-- 3. Supabase Panel -->
      <section class="p-6 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-5">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span :class="telemetryData?.supabase?.configured ? 'text-emerald-400' : 'text-[#756F68]'" class="text-xs">●</span>
                <h2 class="font-mono text-base font-semibold text-[#F5F2EB]">Supabase PostgreSQL</h2>
              </div>
              <p class="font-sans text-xs text-[#756F68] mt-1">Cloud PostgreSQL relational database persistence & RLS security.</p>
            </div>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded border"
              :class="telemetryData?.supabase?.configured ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-[#756F68] border-white/08'"
            >
              {{ telemetryData?.supabase?.status || 'Connected' }}
            </span>
          </div>

          <div class="p-4 rounded-lg bg-[#09090B] border border-white/[0.04] space-y-2">
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-[#756F68]">Host Instance:</span>
              <span class="text-[#F5F2EB] font-bold">{{ telemetryData?.supabase?.url || 'iklvthppfigprjhqmrlo.supabase.co' }}</span>
            </div>
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-[#756F68]">Data Architecture:</span>
              <span class="text-[#F5F2EB]">Repository Pattern (PG 15.1)</span>
            </div>
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-[#756F68]">Database Tables:</span>
              <span class="text-emerald-400 font-semibold">projects, tasks, sprints, activities</span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/[0.04] flex items-center justify-between font-mono text-xs text-[#756F68]">
          <span>Engine: <strong class="text-[#F5F2EB]">Supabase REST + Realtime</strong></span>
          <span>Status: <strong class="text-emerald-400">100% Synced</strong></span>
        </div>
      </section>

      <!-- 4. Vercel Panel -->
      <section class="p-6 rounded-xl bg-[#111114] border border-white/[0.06] flex flex-col justify-between gap-5">
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-400 text-xs">●</span>
                <h2 class="font-mono text-base font-semibold text-[#F5F2EB]">Vercel Edge Platform</h2>
              </div>
              <p class="font-sans text-xs text-[#756F68] mt-1">Serverless edge infrastructure, auto-deploy git trigger & SSL certificates.</p>
            </div>
            <span class="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {{ telemetryData?.vercel?.status || 'Live (Production)' }}
            </span>
          </div>

          <div class="p-4 rounded-lg bg-[#09090B] border border-white/[0.04] space-y-2">
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-[#756F68]">Live Domain:</span>
              <a
                :href="`https://${telemetryData?.vercel?.url || 'management-sona-ta.vercel.app'}`"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[#C98A4B] hover:underline font-bold"
              >
                {{ telemetryData?.vercel?.url || 'management-sona-ta.vercel.app' }} ↗
              </a>
            </div>
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-[#756F68]">Deployment Target:</span>
              <span class="text-[#F5F2EB]">Production Edge Network</span>
            </div>
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-[#756F68]">CI/CD Integration:</span>
              <span class="text-emerald-400 font-semibold">GitHub webhook auto-build</span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-white/[0.04] flex items-center justify-between font-mono text-xs text-[#756F68]">
          <span>CDN: <strong class="text-[#F5F2EB]">Global Edge Cache</strong></span>
          <span>SSL: <strong class="text-emerald-400">Let's Encrypt (Active)</strong></span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TelemetryResponse {
  storage: {
    provider: string
    connected: boolean
    path: string
    counts: {
      tasks: number
      projects: number
      sprints: number
    }
  }
  github: {
    configured: boolean
    username: string
    rateLimit: {
      limit: number
      remaining: number
      reset: number
    }
    error: string | null
  }
  supabase: {
    provider: string
    configured: boolean
    status: string
    url?: string
  }
  vercel: {
    provider: string
    configured: boolean
    status: string
    url?: string
    isRuntime?: boolean
  }
}

const { data: telemetryData, refresh: refreshTelemetry } = useLazyAsyncData<TelemetryResponse>('system-telemetry', () => $fetch('/api/telemetry'))

const ratePercent = computed(() => {
  const rl = telemetryData.value?.github?.rateLimit
  if (!rl || !rl.limit) return 100
  return Math.max(5, Math.round((rl.remaining / rl.limit) * 100))
})

const resetMinutes = computed(() => {
  const resetEpoch = telemetryData.value?.github?.rateLimit?.reset
  if (!resetEpoch) return 60
  const diffSec = resetEpoch - Math.floor(Date.now() / 1000)
  return Math.max(1, Math.round(diffSec / 60))
})
</script>
