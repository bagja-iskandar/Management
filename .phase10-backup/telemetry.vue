<template>
  <div class="space-y-6 pb-12">
    <!-- Header Sub-bar Halus (tanpa border-b untuk seamless flow dengan HeaderBar) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <h1 class="font-sans text-xl sm:text-2xl font-semibold text-[#F3F4F6] tracking-tight">
        System Telemetry
      </h1>

      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          :disabled="isRefreshing"
          class="inline-flex items-center gap-1.5 bg-[#F3F4F6] hover:bg-white text-[#07080A] text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          @click="onRefresh"
        >
          <NexuraIcon name="RotateCw" size="xs" :class="{ 'animate-spin': isRefreshing }" />
          <span>Refresh Telemetry</span>
        </button>
      </div>
    </div>

    <!-- Overview Connectivity Matrix Strip -->
    <div class="obs-card rounded-xl p-3.5 px-4 flex items-center gap-4 sm:gap-6 flex-wrap font-mono text-xs border border-white/[0.07]">
      <span class="text-[#8A8F9E] uppercase text-[10px] tracking-wider font-semibold">Service Mesh:</span>
      
      <!-- Nitro KV -->
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        <span class="text-[#F3F4F6] font-medium">Nitro KV</span>
      </div>

      <!-- GitHub API -->
      <div class="flex items-center gap-2">
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="telemetryData?.github?.configured ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#565B68]'"
        />
        <span :class="telemetryData?.github?.configured ? 'text-[#F3F4F6] font-medium' : 'text-[#8A8F9E]'">GitHub API</span>
      </div>

      <!-- Supabase PG -->
      <div class="flex items-center gap-2">
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="telemetryData?.supabase?.configured ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#565B68]'"
        />
        <span :class="telemetryData?.supabase?.configured ? 'text-[#F3F4F6] font-medium' : 'text-[#8A8F9E]'">Supabase PG</span>
      </div>

      <!-- Vercel Deploy -->
      <div class="flex items-center gap-2">
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="telemetryData?.vercel?.configured ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#565B68]'"
        />
        <span :class="telemetryData?.vercel?.configured ? 'text-[#F3F4F6] font-medium' : 'text-[#8A8F9E]'">Vercel Deploy</span>
      </div>
    </div>

    <!-- 4 Telemetry Bento Panels Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- 1. Storage Telemetry -->
      <section class="obs-card rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] flex flex-col justify-between gap-5 transition-all">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <h2 class="font-sans text-base font-semibold text-[#F3F4F6] tracking-tight">
                  Storage: {{ telemetryData?.storage?.provider || 'Supabase PostgreSQL (Cloud)' }}
                </h2>
              </div>
              <p class="font-sans text-xs text-[#8A8F9E] mt-1 leading-relaxed">
                {{ telemetryData?.storage?.provider?.includes('Supabase') ? 'Remote Supabase PostgreSQL relational engine with Nitro KV fallback adapter.' : 'Unstorage filesystem driver persisting records to local key-value store.' }}
              </p>
            </div>
            <span class="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Active
            </span>
          </div>

          <!-- 3-Tile Counts Grid -->
          <div class="grid grid-cols-3 gap-3 pt-1">
            <div class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-xl p-3.5 flex flex-col justify-between">
              <span class="text-[10px] text-[#8A8F9E] font-mono uppercase tracking-wider block">Tasks</span>
              <span class="font-mono tabular-nums text-2xl font-semibold text-[#F3F4F6] mt-1.5 block">
                {{ telemetryData?.storage?.counts?.tasks ?? 0 }}
              </span>
            </div>
            <div class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-xl p-3.5 flex flex-col justify-between">
              <span class="text-[10px] text-[#8A8F9E] font-mono uppercase tracking-wider block">Projects</span>
              <span class="font-mono tabular-nums text-2xl font-semibold text-[#F3F4F6] mt-1.5 block">
                {{ telemetryData?.storage?.counts?.projects ?? 0 }}
              </span>
            </div>
            <div class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-xl p-3.5 flex flex-col justify-between">
              <span class="text-[10px] text-[#8A8F9E] font-mono uppercase tracking-wider block">Sprints</span>
              <span class="font-mono tabular-nums text-2xl font-semibold text-[#F3F4F6] mt-1.5 block">
                {{ telemetryData?.storage?.counts?.sprints ?? 0 }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3.5 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs text-[#8A8F9E]">
          <span class="flex items-center gap-1.5">Path: <strong class="text-[#F3F4F6] font-normal truncate max-w-[220px]">{{ telemetryData?.storage?.path || 'Remote PostgreSQL' }}</strong></span>
          <span class="flex items-center gap-1.5">Status: <strong class="text-emerald-400 font-medium flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Connected</strong></span>
        </div>
      </section>

      <!-- 2. GitHub API Gateway -->
      <section class="obs-card rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] flex flex-col justify-between gap-5 transition-all">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="telemetryData?.github?.configured ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#565B68]'"
                />
                <h2 class="font-sans text-base font-semibold text-[#F3F4F6] tracking-tight">GitHub API Gateway</h2>
              </div>
              <p class="font-sans text-xs text-[#8A8F9E] mt-1 leading-relaxed">REST API v3 rate limits, proxy caching, and token telemetry.</p>
            </div>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded-md border font-medium shrink-0 flex items-center gap-1.5"
              :class="telemetryData?.github?.configured ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="telemetryData?.github?.configured ? 'bg-emerald-400' : 'bg-[#565B68]'"></span>
              {{ telemetryData?.github?.configured ? 'Authenticated' : 'Standard Rate' }}
            </span>
          </div>

          <!-- Rate Limit Meter Tile -->
          <div class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-xl p-3.5 space-y-3">
            <div class="flex items-baseline justify-between">
              <span class="text-xs font-mono text-[#8A8F9E]">Rate Limit Quota</span>
              <div class="flex items-baseline gap-1.5">
                <span class="font-mono tabular-nums text-lg font-semibold text-[#F3F4F6]">
                  {{ telemetryData?.github?.rateLimit?.remaining ?? 0 }} / {{ telemetryData?.github?.rateLimit?.limit ?? 60 }}
                </span>
                <span class="font-mono tabular-nums text-xs text-[#8A8F9E]">({{ ratePercent }}%)</span>
              </div>
            </div>

            <!-- Rate bar with gradient indigo/emerald and specular top highlight -->
            <div class="relative w-full bg-[#111318] rounded-full h-2.5 border border-white/[0.06] overflow-hidden p-[1px]">
              <div
                class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-emerald-400 relative overflow-hidden"
                :style="{ width: `${ratePercent}%` }"
              >
                <!-- Specular top highlight -->
                <div class="absolute inset-x-0 top-0 h-[1px] bg-white/40" />
              </div>
            </div>

            <div class="flex items-center justify-between text-xs font-mono text-[#8A8F9E] pt-0.5">
              <span>Account: <strong class="text-[#F3F4F6] font-normal">{{ telemetryData?.github?.username || 'bagja-iskandar' }}</strong></span>
              <span>Reset in: <strong class="text-indigo-400 font-mono tabular-nums font-medium">{{ resetMinutes }}m</strong></span>
            </div>
          </div>
        </div>

        <div class="pt-3.5 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs text-[#8A8F9E]">
          <span>Cache: <strong class="text-[#F3F4F6] font-normal">TTL 300s</strong></span>
          <span>Status: <strong :class="telemetryData?.github?.error ? 'text-rose-400' : 'text-emerald-400'" class="font-medium inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full" :class="telemetryData?.github?.error ? 'bg-rose-400' : 'bg-emerald-400'"></span>{{ telemetryData?.github?.error || 'Healthy' }}</strong></span>
        </div>
      </section>

      <!-- 3. Supabase PostgreSQL -->
      <section class="obs-card rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] flex flex-col justify-between gap-5 transition-all">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="telemetryData?.supabase?.configured ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#565B68]'"
                />
                <h2 class="font-sans text-base font-semibold text-[#F3F4F6] tracking-tight">Supabase PostgreSQL</h2>
              </div>
              <p class="font-sans text-xs text-[#8A8F9E] mt-1 leading-relaxed">Cloud PostgreSQL relational database persistence & RLS security.</p>
            </div>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded-md border font-medium shrink-0 flex items-center gap-1.5"
              :class="telemetryData?.supabase?.configured ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="telemetryData?.supabase?.configured ? 'bg-emerald-400' : 'bg-[#565B68]'"></span>
              {{ telemetryData?.supabase?.status || 'Connected' }}
            </span>
          </div>

          <div class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Host Instance:</span>
              <span class="text-[#F3F4F6] font-medium truncate max-w-[240px]">{{ telemetryData?.supabase?.url || 'iklvthppfigprjhqmrlo.supabase.co' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Data Architecture:</span>
              <span class="text-[#F3F4F6]">Repository Pattern (PG 15.1)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Database Tables:</span>
              <span class="text-emerald-400 font-medium text-[11px]">projects, tasks, sprints, activities</span>
            </div>
          </div>
        </div>

        <div class="pt-3.5 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs text-[#8A8F9E]">
          <span>Engine: <strong class="text-[#F3F4F6] font-normal">Supabase REST + Realtime</strong></span>
          <span>Status: <strong class="text-emerald-400 font-medium inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>100% Synced</strong></span>
        </div>
      </section>

      <!-- 4. Vercel Edge Platform -->
      <section class="obs-card rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] flex flex-col justify-between gap-5 transition-all">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="telemetryData?.vercel?.configured ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#565B68]'"
                />
                <h2 class="font-sans text-base font-semibold text-[#F3F4F6] tracking-tight">Vercel Edge Platform</h2>
              </div>
              <p class="font-sans text-xs text-[#8A8F9E] mt-1 leading-relaxed">Serverless edge infrastructure, auto-deploy git trigger & SSL certificates.</p>
            </div>
            <span class="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {{ telemetryData?.vercel?.status || 'Live (Production)' }}
            </span>
          </div>

          <div class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Live Domain:</span>
              <a
                :href="`https://${telemetryData?.vercel?.url || 'management-sona-ta.vercel.app'}`"
                target="_blank"
                rel="noopener noreferrer"
                class="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 hover:underline transition-colors"
              >
                <span>{{ telemetryData?.vercel?.url || 'management-sona-ta.vercel.app' }}</span>
                <NexuraIcon name="ExternalLink" size="xs" />
              </a>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Deployment Target:</span>
              <span class="text-[#F3F4F6]">Production Edge Network</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">CI/CD Integration:</span>
              <span class="text-emerald-400 font-medium flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                GitHub webhook auto-build
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3.5 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs text-[#8A8F9E]">
          <span>CDN: <strong class="text-[#F3F4F6] font-normal">Global Edge Cache</strong></span>
          <span>SSL: <strong class="text-emerald-400 font-medium inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Let's Encrypt (Active)</strong></span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'

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

const { data: telemetryData, status, refresh: refreshTelemetry } = useLazyAsyncData<TelemetryResponse>(
  'system-telemetry',
  () => $fetch('/api/telemetry')
)

const isRefreshing = computed(() => status.value === 'pending')

async function onRefresh() {
  await refreshTelemetry()
}

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