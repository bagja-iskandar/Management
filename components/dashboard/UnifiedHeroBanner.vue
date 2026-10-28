<template>
  <section class="obs-card rounded-2xl p-4 sm:p-5 border border-white/[0.08] bg-[#0E1015]/90 backdrop-blur-md">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
      <!-- Blok Kiri (LG 5 Kolom - Weekly Focus) -->
      <div class="lg:col-span-5 flex flex-col justify-center space-y-2.5">
        <!-- Top header row -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <NexuraIcon name="Target" size="sm" class="text-indigo-400 shrink-0" />
            <h2 class="text-sm font-semibold text-[#F3F4F6] font-sans truncate">
              Weekly Focus · Sprint {{ sprintWeekLabel }}
            </h2>
          </div>
          <span class="font-mono text-xs font-semibold text-emerald-400 tabular-nums shrink-0">
            {{ completedCount }} of {{ totalCount }} Done ({{ progressPercentage }}%)
          </span>
        </div>

        <!-- Progress bar -->
        <div class="h-1.5 rounded-full bg-white/[0.06] overflow-hidden w-full">
          <div
            class="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 transition-all duration-700 ease-out"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Blok Kanan (LG 7 Kolom - 4 KPI Metrics) -->
      <div class="lg:col-span-7 lg:border-l lg:border-white/[0.06] lg:pl-6">
        <div class="grid grid-cols-2 sm:grid-cols-4">
          <!-- 1. In-Flight -->
          <div class="flex flex-col justify-between pr-4 sm:pr-5 border-r border-white/[0.06] pb-3 sm:pb-0">
            <div class="flex items-center justify-between gap-1.5 text-xs text-[#8A8F9E]">
              <span class="truncate">In-Flight</span>
            </div>
            <div class="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F4F6] tabular-nums mt-1">
              {{ inFlightCount }}
            </div>
            <div class="text-[11px] text-[#8A8F9E] mt-0.5 truncate">
              {{ highPriorityCount }} high priority
            </div>
          </div>

          <!-- 2. Completion Rate -->
          <div class="flex flex-col justify-between pl-4 sm:px-5 sm:border-r border-white/[0.06] pb-3 sm:pb-0">
            <div class="flex items-center justify-between gap-1.5 text-xs text-[#8A8F9E]">
              <span class="truncate">Completion Rate</span>
              <span class="font-mono text-[11px] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30 shrink-0">
                {{ sprintWeekLabel }}
              </span>
            </div>
            <div class="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F4F6] tabular-nums mt-1">
              {{ velocityPercentage }}%
            </div>
            <div class="text-[11px] text-[#8A8F9E] mt-0.5 truncate">
              {{ velocityHealth }}
            </div>
          </div>

          <!-- 3. CI/CD Builds -->
          <div class="flex flex-col justify-between pt-3 sm:pt-0 pr-4 sm:px-5 border-r border-white/[0.06] border-t sm:border-t-0">
            <div class="flex items-center justify-between gap-1.5 text-xs text-[#8A8F9E]">
              <span class="truncate">CI/CD Builds</span>
              <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse shrink-0"></span>
            </div>
            <div class="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F4F6] tabular-nums mt-1">
              <span v-if="ciSuccessRate !== null">{{ ciSuccessRate }}%</span>
              <span v-else>--</span>
            </div>
            <div class="text-[11px] font-mono text-emerald-400/90 font-medium mt-0.5 truncate">
              {{ ciChecksSummary }}
            </div>
          </div>

          <!-- 4. Open PRs -->
          <div class="flex flex-col justify-between pt-3 sm:pt-0 pl-4 sm:pl-5 border-t sm:border-t-0 border-white/[0.06]">
            <div class="flex items-center justify-between gap-1.5 text-xs text-[#8A8F9E]">
              <span class="truncate">Open PRs</span>
            </div>
            <div class="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#F3F4F6] tabular-nums mt-1">
              {{ openPrCount }}
            </div>
            <div class="text-[11px] text-[#8A8F9E] mt-0.5 truncate">
              Across {{ activeReposCount }} repos
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task, Sprint, Project } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    tasks?: Task[]
    sprint?: Sprint | null
    projects?: Project[]
    ciWorkflowCount?: number
    openPrCount?: number
    ciSuccessRate?: number | null
    ciChecksSummary?: string
    objective?: string
  }>(),
  {
    tasks: () => [],
    sprint: null,
    projects: () => [],
    ciWorkflowCount: 0,
    openPrCount: undefined,
    ciSuccessRate: null,
    ciChecksSummary: undefined,
    objective: undefined
  }
)

const sprintWeekLabel = computed(() => {
  if (props.sprint?.name) {
    const match = props.sprint.name.match(/\d+/)
    if (match) return `W${match[0]}`
    return props.sprint.name
  }
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `W${weekNo}`
})

const completedCount = computed(() => {
  return (props.tasks || []).filter((t) => t.status === 'deployed').length
})

const totalCount = computed(() => {
  return (props.tasks || []).length
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const inFlightCount = computed(() => {
  return (props.tasks || []).filter((t) => t.status === 'running_sprint').length
})

const highPriorityCount = computed(() => {
  return (props.tasks || []).filter(
    (t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'deployed'
  ).length
})

const velocityPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return progressPercentage.value
})

const velocityHealth = computed(() => {
  if (totalCount.value === 0) return 'No deliverables'
  return velocityPercentage.value >= 70 ? 'On track' : 'Attention needed'
})

const ciChecksSummary = computed(() => {
  if (props.ciChecksSummary) return props.ciChecksSummary
  if (props.ciSuccessRate === null || props.ciWorkflowCount === 0) return 'No active checks'
  return `${props.ciWorkflowCount} checks passed`
})

const openPrCount = computed(() => {
  if (props.openPrCount !== undefined) return props.openPrCount
  return (props.tasks || []).filter((t) => Boolean(t.githubPrUrl)).length
})

const activeReposCount = computed(() => {
  return props.projects?.length || 0
})
</script>
