<template>
  <section class="obs-card px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] shadow-sm relative overflow-hidden group transition-all">
    <!-- Ambient Specular Accent -->
    <div class="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-indigo-500/10"></div>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 relative z-10">
      <!-- Left: Project Identity & Scope (Compact) -->
      <div class="space-y-1.5 min-w-0 flex-1">
        <!-- Main Line: Title + Status + GitHub Tag -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="font-mono text-lg sm:text-xl font-bold text-[#F3F4F6] tracking-tight truncate">
            {{ project.title }}
          </h1>

          <!-- Status Pill -->
          <span
            class="inline-flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase font-medium border shrink-0"
            :class="project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="project.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'"></span>
            <span>{{ project.status || 'Active' }}</span>
          </span>

          <!-- GitHub Repository Tag -->
          <a
            v-if="project.githubRepo"
            :href="`https://github.com/${project.githubRepo}`"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07080A] hover:bg-white/5 text-[#F3F4F6] border border-white/[0.08] hover:border-indigo-500/40 font-mono text-xs transition-all duration-200 group/gh shrink-0 shadow-sm"
            :title="`Open ${project.githubRepo} on GitHub`"
          >
            <NexuraIcon name="GitBranch" size="xs" class="text-indigo-400 shrink-0" />
            <span class="font-medium text-[#F3F4F6]">{{ project.githubRepo }}</span>
            <NexuraIcon name="ArrowUpRight" size="xs" class="text-[#8A8F9E] group-hover/gh:text-indigo-300 transition-transform group-hover/gh:translate-x-0.5 group-hover/gh:-translate-y-0.5" />
          </a>
        </div>

        <!-- Secondary Subtitle: Description & Tech Stack Inline -->
        <div class="flex items-center gap-3 text-xs text-[#8A8F9E] font-mono flex-wrap">
          <p v-if="project.description" class="font-sans text-[11px] sm:text-xs text-[#8A8F9E] line-clamp-1 max-w-xl">
            {{ project.description }}
          </p>
          <div v-if="project.techStack?.length" class="flex items-center gap-1 shrink-0">
            <span
              v-for="tech in project.techStack.slice(0, 3)"
              :key="tech"
              class="px-1.5 py-0.2 rounded bg-white/[0.03] border border-white/[0.06] text-[#8A8F9E] text-[9px] font-mono"
            >
              {{ tech }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Milestone & Deployed (Compact) -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- Milestone Progress Card -->
        <div class="px-3.5 py-2 rounded-xl bg-[#07080A]/80 border border-white/[0.08] flex flex-col justify-between gap-1.5 min-w-[180px] sm:w-52">
          <div class="flex items-center justify-between font-mono text-[10px]">
            <span class="uppercase tracking-wider text-[#8A8F9E]">Milestone Velocity</span>
            <strong class="text-xs font-bold text-[#F3F4F6] tabular-nums">{{ derivedPercentage }}%</strong>
          </div>

          <!-- Progress Bar with specular highlight -->
          <div class="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
              :style="{ width: `${derivedPercentage}%` }"
            ></div>
          </div>

          <div class="font-mono text-[9px] text-[#8A8F9E] text-right tabular-nums">
            {{ completedCount }}/{{ totalTasksCount }} tasks
          </div>
        </div>

        <!-- Deployed Metric Card -->
        <div class="px-3.5 py-2 rounded-xl bg-[#07080A]/80 border border-white/[0.08] flex flex-col items-center justify-center min-w-[70px] text-center">
          <span class="font-mono text-[9px] uppercase tracking-wider text-[#8A8F9E]">Deployed</span>
          <span class="font-mono text-base font-bold text-emerald-400 tabular-nums leading-tight mt-0.5">{{ completedCount }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Project } from '~/types'
import NexuraIcon from '../ui/NexuraIcon.vue'

defineProps<{
  project: Project
  completedCount: number
  totalTasksCount: number
  derivedPercentage: number
}>()
</script>
