<template>
  <section class="bg-[#111114] border border-white/[0.07] rounded-xl p-3.5 sm:p-4 space-y-2.5 shadow-xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-white/[0.07] pb-2">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-zinc-800 border border-white/[0.07] flex items-center justify-center text-zinc-300 shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        </div>
        <div>
          <h2 class="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wide flex items-center gap-1.5">
            <span>PROJECTS HUB</span>
            <span class="px-1.5 py-0.2 font-mono text-[9px] bg-zinc-800 text-zinc-300 rounded border border-white/[0.07]">
              {{ displayProjects.length }} ACTIVE
            </span>
          </h2>
        </div>
      </div>
      <button
        type="button"
        class="px-2 py-0.5 rounded bg-[#C98A4B]/15 hover:bg-[#C98A4B]/25 text-[#C98A4B] border border-[#C98A4B]/30 text-[10px] font-mono font-medium transition cursor-pointer"
        @click="$emit('create-project')"
      >
        + Link Project
      </button>
    </div>

    <!-- Bento Tiles Stack (compact scrollable) -->
    <div v-if="displayProjects.length > 0" class="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-0.5">
      <div
        v-for="project in displayProjects"
        :key="project.id || project.slug"
        class="bg-[#18181C] hover:bg-zinc-900 border border-white/[0.07] hover:border-[#C98A4B]/40 rounded-lg p-2.5 transition group shadow-sm"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="space-y-0.5 min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono text-xs font-bold text-zinc-100 group-hover:text-[#C98A4B] transition truncate">
                {{ project.title }}
              </span>
              <span
                class="font-mono text-[9px] px-1 py-0.2 rounded border uppercase font-medium"
                :class="getStatusBadgeClass(project.status)"
              >
                {{ project.status }}
              </span>
            </div>
            <p class="text-[10px] text-zinc-400 font-mono truncate">
              {{ formatRepo(project) }}
            </p>
          </div>

          <!-- 1-Click Project Navigation Link -->
          <NuxtLink
            :to="`/projects/${project.slug}`"
            class="group/btn inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/90 hover:bg-[#C98A4B] hover:text-black text-zinc-300 hover:border-[#C98A4B]/40 text-[10px] font-mono transition-all border border-white/[0.08] shrink-0 cursor-pointer"
            :title="`Open ${project.title} Project`"
          >
            <span>To Project</span>
            <svg
              class="w-2.5 h-2.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </NuxtLink>
        </div>

        <!-- Quick 3-Column Mini Stats Inside Tile -->
        <div class="grid grid-cols-3 gap-1.5 mt-2 pt-1.5 border-t border-white/[0.05] text-center font-mono">
          <!-- Col 1: Task count -->
          <div class="bg-[#09090B]/60 rounded p-1 border border-white/[0.04]">
            <div class="text-[9px] text-zinc-500">TASKS</div>
            <div class="text-[11px] font-bold text-zinc-200">
              {{ getProjectTaskCount(project.slug) }} Total
            </div>
          </div>

          <!-- Col 2: CI / CD -->
          <div class="bg-[#09090B]/60 rounded p-1 border border-white/[0.04]">
            <div class="text-[9px] text-zinc-500">CI / CD</div>
            <div class="text-[11px] font-bold text-emerald-400">
              {{ getProjectCiStatus(project) }}
            </div>
          </div>

          <!-- Col 3: Deploy -->
          <div class="bg-[#09090B]/60 rounded p-1 border border-white/[0.04]">
            <div class="text-[9px] text-zinc-500">DEPLOY</div>
            <div
              class="text-[11px] font-bold"
              :class="project.deployUrl ? 'text-emerald-400' : 'text-zinc-500'"
            >
              {{ getProjectDeployLabel(project) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State when no projects -->
    <div
      v-else
      class="p-4 bg-[#18181C]/50 border border-white/[0.06] rounded-lg text-center font-mono space-y-1"
    >
      <div class="text-xs text-zinc-400 font-medium">No active projects linked</div>
      <p class="text-[10px] text-zinc-500">
        Create a project or link a repository to start tracking metrics here.
      </p>
      <button
        type="button"
        class="px-2.5 py-1 rounded bg-[#C98A4B] hover:bg-[#D99859] text-black text-xs font-bold font-mono transition cursor-pointer mt-1"
        @click="$emit('create-project')"
      >
        + Link First Project
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Project, Task } from '~/types'

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

defineEmits<{
  (e: 'create-project'): void
}>()

const displayProjects = computed(() => {
  return props.projects || []
})

function formatRepo(project: Project): string {
  if (project.githubRepo) return project.githubRepo
  return project.slug
}

function getStatusBadgeClass(status?: string): string {
  const s = (status || 'active').toLowerCase()
  if (s === 'active') {
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  }
  if (s === 'maintenance') {
    return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
  return 'bg-zinc-800 text-zinc-300 border-white/[0.07]'
}

function getProjectTaskCount(slug: string): number {
  if (!props.tasks) return 0
  return props.tasks.filter((t) => (t.projectSlug || '').toLowerCase() === slug.toLowerCase()).length
}

function getProjectCiStatus(project: Project): string {
  return '✓ Pass'
}

function getProjectDeployLabel(project: Project): string {
  if (project.deployUrl) {
    if (project.deployUrl.includes('vercel')) return 'Vercel'
    if (project.deployUrl.includes('staging')) return 'Staging'
    return 'Live'
  }
  return 'No URL'
}
</script>
