<template>
  <section class="obs-card rounded-xl p-3.5 space-y-2.5 border border-white/[0.08] bg-[#0E1015]/90 flex flex-col justify-between">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
      <div class="flex items-center gap-2">
        <NexuraIcon name="Activity" size="sm" class="text-indigo-400 shrink-0" />
        <h2 class="text-sm font-semibold text-[#F3F4F6]">Workspace Pulse</h2>
      </div>

      <!-- State Status Badge -->
      <div class="flex items-center gap-1.5 font-mono text-[11px]">
        <template v-if="pulseState === 'LOADING'">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span class="text-amber-300">Syncing</span>
        </template>
        <template v-else-if="pulseState === 'DATA_UNAVAILABLE'">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          <span class="text-rose-300">Telemetry Err</span>
        </template>
        <template v-else-if="pulseState === 'ATTENTION_REQUIRED'">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
          <span class="text-rose-300">Attention Req</span>
        </template>
        <template v-else>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span class="text-emerald-300">Nominal</span>
        </template>
      </div>
    </div>

    <!-- Body Views by 4 Authoritative States -->
    <div class="py-0.5">
      <!-- 1. LOADING STATE -->
      <div
        v-if="pulseState === 'LOADING'"
        class="space-y-2 py-1 animate-pulse"
        role="status"
        aria-label="Loading workspace pulse telemetry"
      >
        <div class="h-3.5 bg-white/[0.06] rounded w-2/3"></div>
        <div class="h-12 bg-white/[0.04] rounded-lg"></div>
      </div>

      <!-- 2. DATA_UNAVAILABLE STATE -->
      <div
        v-else-if="pulseState === 'DATA_UNAVAILABLE'"
        class="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2.5 text-xs text-rose-300 font-mono"
        role="alert"
      >
        <NexuraIcon name="AlertTriangle" size="sm" class="text-rose-400 shrink-0" />
        <div>
          <div class="font-semibold text-rose-200">Operational Telemetry Unavailable</div>
          <div class="text-[11px] text-rose-300/80">Unable to establish pulse telemetry with workspace store.</div>
        </div>
      </div>

      <!-- 3. ATTENTION_REQUIRED STATE (2-Column Alert Counters) -->
      <div v-else-if="pulseState === 'ATTENTION_REQUIRED'" class="space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <!-- Blockers Card -->
          <div
            class="p-2.5 rounded-lg border transition font-mono"
            :class="blockedCount > 0 ? 'bg-rose-500/10 border-rose-500/25' : 'bg-white/[0.03] border-white/[0.06]'"
          >
            <div class="text-[10px] uppercase tracking-wider text-[#8A8F9E]">Blockers</div>
            <div
              class="text-lg font-bold mt-0.5"
              :class="blockedCount > 0 ? 'text-rose-400' : 'text-[#F3F4F6]'"
            >
              {{ blockedCount }}
            </div>
            <div class="text-[10px] text-[#8A8F9E] mt-0.5 truncate">
              {{ blockedCount > 0 ? 'Halted streams' : 'No blockers' }}
            </div>
          </div>

          <!-- Overdue Card -->
          <div
            class="p-2.5 rounded-lg border transition font-mono"
            :class="overdueCount > 0 ? 'bg-amber-500/10 border-amber-500/25' : 'bg-white/[0.03] border-white/[0.06]'"
          >
            <div class="text-[10px] uppercase tracking-wider text-[#8A8F9E]">Overdue</div>
            <div
              class="text-lg font-bold mt-0.5"
              :class="overdueCount > 0 ? 'text-amber-400' : 'text-[#F3F4F6]'"
            >
              {{ overdueCount }}
            </div>
            <div class="text-[10px] text-[#8A8F9E] mt-0.5 truncate">
              {{ overdueCount > 0 ? 'Behind schedule' : 'On schedule' }}
            </div>
          </div>
        </div>

        <div class="text-[11px] font-mono text-rose-300/90 flex items-center gap-1.5 pt-0.5">
          <NexuraIcon name="AlertCircle" size="xs" class="text-rose-400 shrink-0" />
          <span>Requires operational triage to restore velocity.</span>
        </div>
      </div>

      <!-- 4. NO_CRITICAL_ISSUES STATE (Nominal Banner) -->
      <div
        v-else
        class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3"
      >
        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <NexuraIcon name="ShieldCheck" size="sm" class="text-emerald-400" />
        </div>
        <div>
          <div class="text-xs font-semibold text-emerald-300 font-sans">No Critical Issues</div>
          <div class="text-[11px] font-mono text-[#8A8F9E] mt-0.5">
            0 blockers &amp; 0 overdue deliverables across active projects.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task, Project } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

export type PulseStateType = 'LOADING' | 'DATA_UNAVAILABLE' | 'ATTENTION_REQUIRED' | 'NO_CRITICAL_ISSUES'

const props = withDefaults(
  defineProps<{
    tasks?: Task[]
    projects?: Project[]
    hydrationStatus?: Record<string, string> | string
  }>(),
  {
    tasks: () => [],
    projects: () => [],
    hydrationStatus: 'idle'
  }
)

// Timezone-safe local date string helper (YYYY-MM-DD)
function getLocalDateString(d = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Blocked Count
const blockedCount = computed(() => {
  return (props.tasks || []).filter((t) => t.status === 'blocked').length
})

// Overdue Count (Deployed tasks are never overdue)
const overdueCount = computed(() => {
  const todayStr = getLocalDateString()
  return (props.tasks || []).filter(
    (t) => t.status !== 'deployed' && t.dueDate && t.dueDate.slice(0, 10) < todayStr
  ).length
})

// 4 Authoritative Semantic States
const pulseState = computed<PulseStateType>(() => {
  const status = props.hydrationStatus
  const isTasksLoading =
    status === 'loading' ||
    (typeof status === 'object' && status !== null && (status as Record<string, string>).tasks === 'loading')

  if (isTasksLoading) {
    return 'LOADING'
  }

  const isTasksError =
    status === 'error' ||
    (typeof status === 'object' && status !== null && (status as Record<string, string>).tasks === 'error') ||
    !props.tasks

  if (isTasksError) {
    return 'DATA_UNAVAILABLE'
  }

  if (blockedCount.value > 0 || overdueCount.value > 0) {
    return 'ATTENTION_REQUIRED'
  }

  return 'NO_CRITICAL_ISSUES'
})
</script>
