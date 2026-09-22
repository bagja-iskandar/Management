<template>
  <div class="bg-[#111114] border border-white/[0.06] rounded-xl p-3 sm:p-4 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06]">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-[#C98A4B]"></span>
        <h2 class="font-mono text-xs tracking-wider uppercase text-[#756F68] font-semibold">
          ACTIVE PROJECTS OVERVIEW
        </h2>
      </div>
      <NuxtLink
        to="/projects"
        class="font-mono text-[11px] text-[#756F68] hover:text-[#C98A4B] transition-colors flex items-center gap-1"
      >
        <span>View all</span>
        <span aria-hidden="true">&rarr;</span>
      </NuxtLink>
    </div>

    <!-- Ultra-dense Matrix Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse min-w-[620px]">
        <thead>
          <tr class="font-mono text-[10px] tracking-wider uppercase text-[#756F68] border-b border-white/[0.06]">
            <th scope="col" class="py-2 px-2.5 font-medium">Project</th>
            <th scope="col" class="py-2 px-2.5 font-medium">Progress</th>
            <th scope="col" class="py-2 px-2.5 font-medium">Tech Stack</th>
            <th scope="col" class="py-2 px-2.5 font-medium">Last Commit</th>
            <th scope="col" class="py-2 px-2.5 font-medium text-center">Deploy</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.04]">
          <tr
            v-for="item in displayProjects"
            :key="item.slug"
            class="group hover:bg-white/[0.03] transition-colors cursor-pointer"
            tabindex="0"
            role="link"
            :aria-label="`Open project ${item.title}`"
            @click="goToProject(item.slug)"
            @keydown.enter="goToProject(item.slug)"
          >
            <!-- Project Name + Repo -->
            <td class="py-2.5 px-2.5">
              <div class="flex flex-col">
                <NuxtLink
                  :to="`/projects/${item.slug}`"
                  class="font-mono text-xs font-semibold text-[#F5F2EB] group-hover:text-[#C98A4B] transition-colors flex items-center gap-1.5"
                  :title="`Open ${item.title} Dashboard & Kanban`"
                >
                  {{ item.title }}
                </NuxtLink>
                <span class="font-mono text-[10px] text-[#756F68] truncate max-w-[160px]">
                  {{ item.repo }}
                </span>
              </div>
            </td>

            <!-- Progress Bar + Fraction Done -->
            <td class="py-2.5 px-2.5">
              <div class="flex flex-col gap-1 w-28 sm:w-36">
                <div class="flex items-center justify-between font-mono text-[11px] text-[#756F68]">
                  <span>{{ item.completedTasks }}/{{ item.totalTasks }} done</span>
                  <span class="text-[#C98A4B] font-medium">{{ getProgressPercent(item) }}%</span>
                </div>
                <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    class="h-full bg-gradient-to-r from-[#8B6535] to-[#C98A4B] rounded-full transition-all duration-300"
                    :style="{ width: `${getProgressPercent(item)}%` }"
                  ></div>
                </div>
              </div>
            </td>

            <!-- Tech Stack Badges -->
            <td class="py-2.5 px-2.5">
              <div class="flex items-center gap-1 flex-wrap max-w-[200px]">
                <span
                  v-for="tech in item.techStack"
                  :key="tech"
                  class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/20 rounded px-1.5 py-0.2"
                >
                  {{ tech }}
                </span>
              </div>
            </td>

            <!-- Last Commit Message -->
            <td class="py-2.5 px-2.5 max-w-[180px]">
              <div class="font-mono text-xs italic text-[#756F68] truncate" :title="item.lastCommit">
                {{ item.lastCommit }}
              </div>
            </td>

            <!-- Deploy Indicator -->
            <td class="py-2.5 px-2.5 text-center">
              <div class="inline-flex items-center justify-center" :title="item.deployUrl || 'Live deploy'">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]"></span>
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ProjectOverviewItem {
  slug: string
  title: string
  repo: string
  completedTasks: number
  totalTasks: number
  techStack: string[]
  lastCommit: string
  deployUrl?: string
}

const props = defineProps<{
  projects?: ProjectOverviewItem[]
}>()

const displayProjects = computed(() => {
  return props.projects && props.projects.length > 0 ? props.projects : []
})

function getProgressPercent(item: ProjectOverviewItem): number {
  if (!item.totalTasks || item.totalTasks === 0) return 0
  return Math.min(100, Math.round((item.completedTasks / item.totalTasks) * 100))
}

function goToProject(slug: string) {
  navigateTo(`/projects/${slug}`)
}
</script>
