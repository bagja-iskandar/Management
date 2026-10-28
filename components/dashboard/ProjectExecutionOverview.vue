<template>
  <section class="obs-card rounded-xl p-3.5 space-y-2 border border-white/[0.08] bg-[#0E1015]/90 flex flex-col">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
      <div class="flex items-center gap-2">
        <NexuraIcon name="BarChart3" size="sm" class="text-indigo-400 shrink-0" />
        <h2 class="text-sm font-semibold text-[#F3F4F6]">Project Execution Overview</h2>
        <span class="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.05] text-[#8A8F9E]">
          {{ projects.length }} Projects
        </span>
      </div>

      <!-- Horizontal Color Legend (5 dots) -->
      <div class="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono text-[#8A8F9E] flex-wrap">
        <div
          v-for="cfg in STATUS_CONFIG"
          :key="cfg.status"
          class="flex items-center gap-1.5"
        >
          <span class="w-2 h-2 rounded-full shrink-0" :class="cfg.dotClass"></span>
          <span>{{ cfg.label }}</span>
        </div>
      </div>
    </div>

    <!-- Pinned Axis Row (Scale Header) -->
    <div class="flex items-center gap-3 px-1 pt-0.5">
      <div class="w-36 sm:w-40 shrink-0 font-mono text-[11px] text-[#8A8F9E] pl-1">
        Project
      </div>
      <div class="flex-1 relative flex justify-between font-mono text-[10px] text-[#8A8F9E] px-1">
        <span v-for="(tick, idx) in tickMarks" :key="idx">{{ tick }}</span>
      </div>
    </div>

    <!-- Scrollable Rows Container -->
    <div
      v-if="allRows.length > 0"
      class="max-h-[160px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1 select-none"
      tabindex="0"
      role="region"
      aria-label="Project execution status bars"
    >
      <div
        v-for="project in allRows"
        :key="project.id"
        class="flex items-center gap-3 p-1 rounded hover:bg-white/[0.03] transition cursor-pointer group"
        @click="handleRowClick(project)"
      >
        <!-- Left Label: Title + Total -->
        <div class="w-36 sm:w-40 shrink-0 flex items-center justify-between pr-2 min-w-0">
          <span
            class="text-xs text-[#F3F4F6] truncate group-hover:text-white transition font-medium"
            :title="project.title"
          >
            {{ project.title }}
          </span>
          <span class="font-mono text-[11px] text-[#8A8F9E] shrink-0 ml-1.5">
            {{ project.total }}
          </span>
        </div>

        <!-- Right Track: Stacked Bar -->
        <div class="flex-1 h-3.5 rounded-md overflow-hidden bg-white/[0.03] border border-white/[0.06] flex relative">
          <!-- Vertical Gridlines (25%, 50%, 75%) -->
          <div class="absolute top-0 bottom-0 left-[25%] border-r border-dashed border-white/[0.06] pointer-events-none z-10"></div>
          <div class="absolute top-0 bottom-0 left-[50%] border-r border-dashed border-white/[0.06] pointer-events-none z-10"></div>
          <div class="absolute top-0 bottom-0 left-[75%] border-r border-dashed border-white/[0.06] pointer-events-none z-10"></div>

          <!-- Ghost Track when 0 deliverables -->
          <div
            v-if="project.total === 0"
            class="absolute inset-0 flex items-center px-2 text-[10px] text-zinc-500 font-mono italic select-none"
          >
            0 deliverables staged
          </div>

          <!-- Stacked Color Segments -->
          <template v-else>
            <div
              v-for="seg in project.segments"
              :key="seg.status"
              class="h-full transition-all duration-300 relative"
              :class="seg.bgClass"
              :style="{ width: `${seg.widthPercent}%` }"
              :title="`${project.title} · ${seg.label}: ${seg.count} (${seg.percentage}%)`"
              @mouseenter="onSegmentHover($event, project, seg)"
              @mouseleave="onSegmentLeave"
            ></div>
          </template>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="p-4 text-center text-xs text-[#8A8F9E] font-mono bg-white/[0.02] border border-white/[0.04] rounded-lg"
    >
      No active projects staged.
    </div>

    <!-- Simplified Tooltip V1 (Teleported, 4 fields only) -->
    <Teleport to="body">
      <div
        v-if="hoveredTooltip"
        class="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-lg bg-[#0E1015] border border-white/[0.12] shadow-xl text-xs font-mono space-y-0.5"
        :style="{ left: `${hoveredTooltip.x}px`, top: `${hoveredTooltip.y}px` }"
      >
        <div class="text-[#F3F4F6] font-semibold font-sans">{{ hoveredTooltip.projectTitle }}</div>
        <div class="text-[#8A8F9E] flex items-center gap-2">
          <span>{{ hoveredTooltip.statusLabel }}:</span>
          <span class="text-white font-bold">{{ hoveredTooltip.count }}</span>
          <span class="text-indigo-300">({{ hoveredTooltip.percentage }}%)</span>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Project, Task, TaskStatus } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

interface SegmentInfo {
  status: TaskStatus
  label: string
  bgClass: string
  count: number
  percentage: number
  widthPercent: number
}

interface ProjectRow {
  id: string
  slug: string
  title: string
  isUnassigned?: boolean
  total: number
  counts: Record<TaskStatus, number>
  segments: SegmentInfo[]
}

const props = withDefaults(
  defineProps<{
    projects?: Project[]
    tasks?: Task[]
  }>(),
  {
    projects: () => [],
    tasks: () => []
  }
)

const STATUS_CONFIG: { status: TaskStatus; label: string; bgClass: string; dotClass: string }[] = [
  { status: 'idea', label: 'Idea', bgClass: 'bg-slate-500/80', dotClass: 'bg-slate-500' },
  { status: 'in_queue', label: 'In Queue', bgClass: 'bg-sky-400/90', dotClass: 'bg-sky-400' },
  { status: 'running_sprint', label: 'In Progress', bgClass: 'bg-indigo-500', dotClass: 'bg-indigo-500' },
  { status: 'blocked', label: 'Blocked', bgClass: 'bg-rose-500', dotClass: 'bg-rose-500' },
  { status: 'deployed', label: 'Deployed', bgClass: 'bg-emerald-400', dotClass: 'bg-emerald-400' }
]

// Raw Project Distributions
const projectDistributions = computed(() => {
  const tasks = props.tasks || []
  const projects = props.projects || []
  const knownSlugs = new Set(projects.map((p) => p.slug))

  // 1. Group tasks by project slug
  const taskMap = new Map<string, Task[]>()
  const unassignedTasks: Task[] = []

  for (const t of tasks) {
    if (t.projectSlug && knownSlugs.has(t.projectSlug)) {
      if (!taskMap.has(t.projectSlug)) {
        taskMap.set(t.projectSlug, [])
      }
      taskMap.get(t.projectSlug)!.push(t)
    } else {
      unassignedTasks.push(t)
    }
  }

  // 2. Build rows for registered projects
  const rows: {
    project: Project
    counts: Record<TaskStatus, number>
    total: number
  }[] = projects.map((p) => {
    const pTasks = taskMap.get(p.slug) || []
    const counts: Record<TaskStatus, number> = {
      idea: 0,
      in_queue: 0,
      running_sprint: 0,
      blocked: 0,
      deployed: 0
    }
    for (const t of pTasks) {
      if (t.status in counts) {
        counts[t.status]++
      }
    }
    const total = counts.idea + counts.in_queue + counts.running_sprint + counts.blocked + counts.deployed
    return {
      project: p,
      counts,
      total
    }
  })

  // 3. 3-Tier Priority Sorting
  rows.sort((a, b) => {
    // Tier 1: Projects with blocked > 0, sorted descending by blocker count
    if (a.counts.blocked > 0 && b.counts.blocked > 0) {
      return b.counts.blocked - a.counts.blocked
    }
    if (a.counts.blocked > 0) return -1
    if (b.counts.blocked > 0) return 1

    // Tier 2: Projects with running_sprint > 0 || in_queue > 0, descending by active tasks
    const aActive = a.counts.running_sprint + a.counts.in_queue
    const bActive = b.counts.running_sprint + b.counts.in_queue
    if (aActive > 0 && bActive > 0) {
      return bActive - aActive
    }
    if (aActive > 0) return -1
    if (bActive > 0) return 1

    // Tier 3: Other projects, descending by total
    if (b.total !== a.total) {
      return b.total - a.total
    }
    return a.project.title.localeCompare(b.project.title)
  })

  // 4. Unassigned tasks row
  const unassignedCounts: Record<TaskStatus, number> = {
    idea: 0,
    in_queue: 0,
    running_sprint: 0,
    blocked: 0,
    deployed: 0
  }
  for (const t of unassignedTasks) {
    if (t.status in unassignedCounts) {
      unassignedCounts[t.status]++
    }
  }
  const unassignedTotal =
    unassignedCounts.idea +
    unassignedCounts.in_queue +
    unassignedCounts.running_sprint +
    unassignedCounts.blocked +
    unassignedCounts.deployed

  return {
    rows,
    unassigned: {
      id: 'unassigned',
      slug: 'unassigned',
      title: 'Unassigned Deliverables',
      isUnassigned: true,
      counts: unassignedCounts,
      total: unassignedTotal
    }
  }
})

// Absolute Uniform Scale Formula
const maxScale = computed(() => {
  const totals: number[] = projectDistributions.value.rows.map((r) => r.total)
  if (projectDistributions.value.unassigned.total > 0) {
    totals.push(projectDistributions.value.unassigned.total)
  }
  const maxTotal = totals.length > 0 ? Math.max(0, ...totals) : 0
  return Math.max(5, Math.ceil(Math.max(5, maxTotal) / 5) * 5)
})

// 5 Tick Marks
const tickMarks = computed(() => {
  const m = maxScale.value
  return [
    0,
    Math.round(m * 0.25),
    Math.round(m * 0.5),
    Math.round(m * 0.75),
    m
  ]
})

// Combined Rows with Calculated Segments
const allRows = computed<ProjectRow[]>(() => {
  const scale = maxScale.value
  const result: ProjectRow[] = projectDistributions.value.rows.map(({ project, counts, total }) => {
    const segments: SegmentInfo[] = []
    for (const cfg of STATUS_CONFIG) {
      const count = counts[cfg.status]
      if (count > 0) {
        segments.push({
          status: cfg.status,
          label: cfg.label,
          bgClass: cfg.bgClass,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          widthPercent: (count / scale) * 100
        })
      }
    }
    return {
      id: project.id,
      slug: project.slug,
      title: project.title,
      isUnassigned: false,
      total,
      counts,
      segments
    }
  })

  // Append unassigned row at bottom if it has deliverables
  const unassigned = projectDistributions.value.unassigned
  if (unassigned.total > 0) {
    const segments: SegmentInfo[] = []
    for (const cfg of STATUS_CONFIG) {
      const count = unassigned.counts[cfg.status]
      if (count > 0) {
        segments.push({
          status: cfg.status,
          label: cfg.label,
          bgClass: cfg.bgClass,
          count,
          percentage: unassigned.total > 0 ? Math.round((count / unassigned.total) * 100) : 0,
          widthPercent: (count / scale) * 100
        })
      }
    }
    result.push({
      id: unassigned.id,
      slug: unassigned.slug,
      title: unassigned.title,
      isUnassigned: true,
      total: unassigned.total,
      counts: unassigned.counts,
      segments
    })
  }

  return result
})

// Tooltip State (Simplified V1: 4 fields only)
const hoveredTooltip = ref<{
  projectTitle: string
  statusLabel: string
  count: number
  percentage: number
  x: number
  y: number
} | null>(null)

function onSegmentHover(e: MouseEvent, project: ProjectRow, seg: SegmentInfo) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  hoveredTooltip.value = {
    projectTitle: project.title,
    statusLabel: seg.label,
    count: seg.count,
    percentage: seg.percentage,
    x: rect.left + rect.width / 2,
    y: rect.top - 6
  }
}

function onSegmentLeave() {
  hoveredTooltip.value = null
}

function handleRowClick(project: ProjectRow) {
  if (project.isUnassigned) {
    navigateTo('/tasks')
  } else {
    navigateTo(`/projects/${project.slug}`)
  }
}
</script>
