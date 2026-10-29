<template>
  <div class="space-y-6 pb-12">
    <!-- Header Sub-bar Halus (tanpa border-b untuk seamless flow dengan HeaderBar) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div class="flex items-center gap-3">
        <h1 class="font-sans text-xl sm:text-2xl font-semibold text-[#F3F4F6] tracking-tight">
          System Telemetry
        </h1>
        <span
          class="font-mono text-[11px] px-2.5 py-0.5 rounded-full border font-medium capitalize"
          :class="telemetryData?.environment === 'production' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'"
        >
          {{ telemetryData?.environment || 'Development' }}
        </span>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Export Backup Button -->
        <button
          type="button"
          :disabled="isExporting"
          class="inline-flex items-center gap-1.5 bg-[#111318] hover:bg-white/[0.08] text-[#F3F4F6] border border-white/[0.12] text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          @click="onExportBackup"
        >
          <NexuraIcon name="Download" size="xs" :class="{ 'animate-bounce': isExporting }" />
          <span>{{ isExporting ? 'Exporting...' : 'Export Backup (JSON)' }}</span>
        </button>

        <!-- Refresh Telemetry Button -->
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

    <!-- Feedback Toast -->
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

    <!-- Stale Data Warning Banner -->
    <div
      v-if="isStaleData"
      class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs font-mono text-amber-300"
    >
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
        <span>⚠️ Stale Telemetry: Background probe failed. Displaying cached metrics in memory.</span>
      </div>
      <button
        type="button"
        class="underline hover:text-amber-200 cursor-pointer text-xs font-medium shrink-0"
        @click="onRefresh"
      >
        Retry Probe
      </button>
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
          :class="telemetryData?.supabase?.healthy ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : (telemetryData?.supabase?.configured ? 'bg-rose-400' : 'bg-[#565B68]')"
        />
        <span :class="telemetryData?.supabase?.healthy ? 'text-[#F3F4F6] font-medium' : 'text-[#8A8F9E]'">
          Supabase PG {{ telemetryData?.supabase?.latencyMs != null ? `(${telemetryData.supabase.latencyMs}ms)` : '' }}
        </span>
      </div>

      <!-- Vercel Deploy -->
      <div class="flex items-center gap-2">
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="telemetryData?.vercel?.isRuntime ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#565B68]'"
        />
        <span :class="telemetryData?.vercel?.isRuntime ? 'text-[#F3F4F6] font-medium' : 'text-[#8A8F9E]'">
          {{ telemetryData?.vercel?.isRuntime ? 'Vercel Edge (Live)' : 'Node.js (Local)' }}
        </span>
      </div>
    </div>

    <!-- State LOADING: Skeleton Cards -->
    <div v-if="telemetryState === 'LOADING'" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div v-for="i in 4" :key="i" class="obs-card rounded-2xl p-6 border border-white/[0.07] h-64 animate-pulse bg-white/[0.02]" />
    </div>

    <!-- State ERROR: Initial Fetch Failure Card -->
    <div
      v-else-if="telemetryState === 'ERROR'"
      class="obs-card rounded-2xl p-8 border border-rose-500/20 text-center space-y-4 bg-rose-500/[0.03]"
    >
      <div class="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
        <NexuraIcon name="AlertTriangle" size="md" />
      </div>
      <div>
        <h3 class="text-base font-semibold text-[#F3F4F6]">Unable to Load System Telemetry</h3>
        <p class="text-xs text-[#8A8F9E] mt-1 max-w-md mx-auto">
          The telemetry endpoint failed to return metrics. Check server logs or verify backend API connectivity.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 bg-[#F3F4F6] hover:bg-white text-[#07080A] text-xs font-medium px-4 py-2 rounded-lg transition cursor-pointer"
        @click="onRefresh"
      >
        <NexuraIcon name="RotateCw" size="xs" />
        <span>Retry Connection</span>
      </button>
    </div>

    <!-- State READY: 4 Telemetry Bento Panels Grid -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

          <!-- 4-Tile Entity Record Counts Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div class="bg-[#07080A] border border-white/[0.08] hover:border-white/[0.14] text-[#F3F4F6] rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div class="flex items-center justify-between text-[#8A8F9E]">
                <span class="text-[10px] font-mono uppercase tracking-wider block">Tasks</span>
                <NexuraIcon name="CheckSquare" size="xs" class="text-indigo-400/80" />
              </div>
              <span class="font-mono tabular-nums text-xl font-semibold text-[#F3F4F6] mt-2 block">
                {{ telemetryData?.storage?.counts?.tasks ?? 0 }}
              </span>
            </div>
            <div class="bg-[#07080A] border border-white/[0.08] hover:border-white/[0.14] text-[#F3F4F6] rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div class="flex items-center justify-between text-[#8A8F9E]">
                <span class="text-[10px] font-mono uppercase tracking-wider block">Projects</span>
                <NexuraIcon name="Folder" size="xs" class="text-indigo-400/80" />
              </div>
              <span class="font-mono tabular-nums text-xl font-semibold text-[#F3F4F6] mt-2 block">
                {{ telemetryData?.storage?.counts?.projects ?? 0 }}
              </span>
            </div>
            <div class="bg-[#07080A] border border-white/[0.08] hover:border-white/[0.14] text-[#F3F4F6] rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div class="flex items-center justify-between text-[#8A8F9E]">
                <span class="text-[10px] font-mono uppercase tracking-wider block">Sprints</span>
                <NexuraIcon name="Target" size="xs" class="text-indigo-400/80" />
              </div>
              <span class="font-mono tabular-nums text-xl font-semibold text-[#F3F4F6] mt-2 block">
                {{ telemetryData?.storage?.counts?.sprints ?? 0 }}
              </span>
            </div>
            <div class="bg-[#07080A] border border-white/[0.08] hover:border-white/[0.14] text-[#F3F4F6] rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div class="flex items-center justify-between text-[#8A8F9E]">
                <span class="text-[10px] font-mono uppercase tracking-wider block">Notes</span>
                <NexuraIcon name="FileText" size="xs" class="text-indigo-400/80" />
              </div>
              <span class="font-mono tabular-nums text-xl font-semibold text-[#F3F4F6] mt-2 block">
                {{ telemetryData?.storage?.counts?.notes ?? 0 }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3.5 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs text-[#8A8F9E]">
          <span class="flex items-center gap-1.5">Path: <strong class="text-[#F3F4F6] font-normal truncate max-w-[200px]">{{ telemetryData?.storage?.path || 'Remote PostgreSQL' }}</strong></span>
          <span class="flex items-center gap-1.5">Routing: <strong class="text-emerald-400 font-medium flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>{{ telemetryData?.storage?.routing || 'supabase' }}</strong></span>
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
                  :class="telemetryData?.supabase?.healthy ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : (telemetryData?.supabase?.configured ? 'bg-rose-400' : 'bg-[#565B68]')"
                />
                <h2 class="font-sans text-base font-semibold text-[#F3F4F6] tracking-tight">Supabase PostgreSQL</h2>
              </div>
              <p class="font-sans text-xs text-[#8A8F9E] mt-1 leading-relaxed">Cloud PostgreSQL relational database persistence & RLS security.</p>
            </div>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded-md border font-medium shrink-0 flex items-center gap-1.5"
              :class="supabaseBadgeClass"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="telemetryData?.supabase?.healthy ? 'bg-emerald-400' : (telemetryData?.supabase?.configured ? 'bg-rose-400' : 'bg-[#565B68]')"></span>
              {{ supabaseBadgeText }}
            </span>
          </div>

          <div class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Host Instance:</span>
              <span class="text-[#F3F4F6] font-medium truncate max-w-[240px]">{{ telemetryData?.supabase?.url || 'iklvthppfigprjhqmrlo.supabase.co' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Live Probe Latency:</span>
              <span class="font-mono font-medium tabular-nums" :class="telemetryData?.supabase?.latencyMs != null ? 'text-emerald-400' : 'text-zinc-500'">
                {{ telemetryData?.supabase?.latencyMs != null ? `${telemetryData.supabase.latencyMs}ms roundtrip` : 'No live probe latency' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Active Routing:</span>
              <span :class="telemetryData?.supabase?.active ? 'text-emerald-400' : 'text-amber-400'" class="font-medium">
                {{ telemetryData?.supabase?.active ? 'Connected to Remote PostgreSQL' : 'Fallback to Local Nitro KV' }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3.5 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs text-[#8A8F9E]">
          <span>Engine: <strong class="text-[#F3F4F6] font-normal">Supabase REST + Realtime</strong></span>
          <span>Status: <strong :class="telemetryData?.supabase?.healthy ? 'text-emerald-400' : 'text-rose-400'" class="font-medium inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full" :class="telemetryData?.supabase?.healthy ? 'bg-emerald-400' : 'bg-rose-400'"></span>{{ telemetryData?.supabase?.status || 'Not Configured' }}</strong></span>
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
                  :class="telemetryData?.vercel?.isRuntime ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-[#565B68]'"
                />
                <h2 class="font-sans text-base font-semibold text-[#F3F4F6] tracking-tight">Vercel Edge Platform</h2>
              </div>
              <p class="font-sans text-xs text-[#8A8F9E] mt-1 leading-relaxed">Serverless edge infrastructure, auto-deploy git trigger & SSL certificates.</p>
            </div>
            <span
              class="font-mono text-xs px-2.5 py-0.5 rounded-md border font-medium shrink-0 flex items-center gap-1.5"
              :class="telemetryData?.vercel?.isRuntime ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="telemetryData?.vercel?.isRuntime ? 'bg-emerald-400' : 'bg-zinc-500'"></span>
              {{ telemetryData?.vercel?.status || 'Offline (Local Development)' }}
            </span>
          </div>

          <div class="bg-[#07080A] border border-white/[0.08] text-[#F3F4F6] rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Live Domain:</span>
              <a
                v-if="telemetryData?.vercel?.url"
                :href="`https://${telemetryData.vercel.url}`"
                target="_blank"
                rel="noopener noreferrer"
                class="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 hover:underline transition-colors"
              >
                <span>{{ telemetryData.vercel.url }}</span>
                <NexuraIcon name="ExternalLink" size="xs" />
              </a>
              <span v-else class="text-zinc-500 font-normal">None (Localhost Dev)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Deployment Target:</span>
              <span class="text-[#F3F4F6]">{{ telemetryData?.vercel?.isRuntime ? 'Production Edge Network' : 'Local Node.js Development' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[#8A8F9E]">Vercel Token:</span>
              <span :class="telemetryData?.vercel?.configured ? 'text-emerald-400' : 'text-zinc-500'" class="font-medium">
                {{ telemetryData?.vercel?.configured ? 'Configured' : 'Not Set' }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3.5 border-t border-white/[0.06] flex items-center justify-between font-mono text-xs text-[#8A8F9E]">
          <span>CDN: <strong class="text-[#F3F4F6] font-normal">{{ telemetryData?.vercel?.isRuntime ? 'Global Edge Cache' : 'Local Memory' }}</strong></span>
          <span>Status: <strong :class="telemetryData?.vercel?.isRuntime ? 'text-emerald-400' : 'text-zinc-400'" class="font-medium inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full" :class="telemetryData?.vercel?.isRuntime ? 'bg-emerald-400' : 'bg-zinc-500'"></span>{{ telemetryData?.vercel?.status || 'Offline' }}</strong></span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'

interface TelemetryResponse {
  environment?: string
  storage: {
    provider: string
    routing: string
    path: string
    counts: {
      tasks: number
      projects: number
      sprints: number
      notes: number
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
    active: boolean
    healthy: boolean
    latencyMs: number | null
    status: string
    error: string | null
    url?: string
  }
  vercel: {
    provider: string
    configured: boolean
    status: string
    url: string | null
    isRuntime: boolean
  }
}

const { data: telemetryData, status, refresh: refreshTelemetry } = useLazyAsyncData<TelemetryResponse>(
  'system-telemetry',
  () => $fetch('/api/telemetry')
)

const isRefreshing = computed(() => status.value === 'pending')
const isExporting = ref(false)

// Feedback Toast State
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

function showFeedback(msg: string, type: 'success' | 'error' = 'success') {
  feedbackMessage.value = msg
  feedbackType.value = type
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedbackMessage.value = ''
  }, 4000)
}

const telemetryState = computed<'LOADING' | 'ERROR' | 'READY'>(() => {
  if (status.value === 'pending' && !telemetryData.value) {
    return 'LOADING'
  }
  if (status.value === 'error' && !telemetryData.value) {
    return 'ERROR'
  }
  return 'READY'
})

const isStaleData = computed(() => {
  return status.value === 'error' && Boolean(telemetryData.value)
})

async function onRefresh() {
  try {
    await refreshTelemetry()
    showFeedback('System telemetry metrics refreshed')
  } catch (err: any) {
    showFeedback(`Probe failed: ${err.message || 'Network error'}`, 'error')
  }
}

async function onExportBackup() {
  if (isExporting.value) return
  isExporting.value = true

  try {
    const backupData = await $fetch('/api/backup/export', {
      headers: {
        Accept: 'application/json'
      }
    })

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = `nexura-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    // Delayed cleanup of object URL to prevent interrupting browser download
    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl)
    }, 1000)

    showFeedback('Database snapshot exported successfully (JSON downloaded)')
  } catch (err: any) {
    console.error('Backup export failed:', err)
    showFeedback(`Backup export failed: ${err.message || 'Server error'}`, 'error')
  } finally {
    isExporting.value = false
  }
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

const supabaseBadgeText = computed(() => {
  const s = telemetryData.value?.supabase
  if (!s || !s.configured) return 'Not Configured'
  if (s.healthy && s.latencyMs != null) return `${s.latencyMs}ms · Healthy`
  return s.status || 'Offline'
})

const supabaseBadgeClass = computed(() => {
  const s = telemetryData.value?.supabase
  if (!s || !s.configured) return 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]'
  if (s.healthy) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
})
</script>
