<template>
  <section class="px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl bg-[#111114] border border-white/[0.07] shadow-lg relative overflow-hidden group">
    <!-- Ambient Glow Accent -->
    <div class="absolute -top-16 -right-16 w-64 h-64 bg-[#C98A4B]/6 rounded-full blur-2xl pointer-events-none transition-all group-hover:bg-[#C98A4B]/10"></div>

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 relative z-10">
      <!-- Left: Project Identity & Scope (Compact) -->
      <div class="space-y-1.5 min-w-0 flex-1">
        <!-- Main Line: Title + Status + GitHub Tag -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="font-mono text-lg sm:text-xl font-bold text-[#F5F2EB] tracking-tight truncate">
            {{ project.title }}
          </h1>

          <!-- Status Pill -->
          <span
            class="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-0.5 rounded-full uppercase font-medium border shrink-0"
            :class="project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-[#C98A4B]/10 text-[#C98A4B] border-[#C98A4B]/25'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="project.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-[#C98A4B]'"></span>
            <span>{{ project.status || 'Active' }}</span>
          </span>

          <!-- GitHub Repository Tag -->
          <a
            v-if="project.githubRepo"
            :href="`https://github.com/${project.githubRepo}`"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#18181C] hover:bg-[#C98A4B]/15 text-zinc-300 hover:text-[#F5F2EB] border border-white/[0.08] hover:border-[#C98A4B]/40 font-mono text-xs transition-all duration-200 group/gh shrink-0 shadow-sm"
            :title="`Open ${project.githubRepo} on GitHub`"
          >
            <svg class="w-3.5 h-3.5 text-[#C98A4B] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span class="font-medium text-[#F5F2EB]">{{ project.githubRepo }}</span>
            <svg class="w-2.5 h-2.5 text-[#756F68] group-hover/gh:text-[#C98A4B] transition-transform group-hover/gh:translate-x-0.5 group-hover/gh:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>
        </div>

        <!-- Secondary Subtitle: Description & Tech Stack Inline -->
        <div class="flex items-center gap-3 text-xs text-[#756F68] font-mono flex-wrap">
          <p v-if="project.description" class="font-sans text-[11px] sm:text-xs text-[#8E877F] line-clamp-1 max-w-xl">
            {{ project.description }}
          </p>
          <div v-if="project.techStack?.length" class="flex items-center gap-1 shrink-0">
            <span
              v-for="tech in project.techStack.slice(0, 3)"
              :key="tech"
              class="px-1.5 py-0.2 rounded bg-white/[0.03] border border-white/[0.06] text-[#756F68] text-[9px]"
            >
              {{ tech }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Milestone & Deployed (Compact) -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- Milestone Progress Card -->
        <div class="px-3 py-2 rounded-xl bg-[#09090B]/80 border border-white/[0.08] flex flex-col justify-between gap-1.5 min-w-[180px] sm:w-52">
          <div class="flex items-center justify-between font-mono text-[10px]">
            <span class="uppercase tracking-wider text-[#756F68]">Milestone</span>
            <strong class="text-xs font-bold text-[#F5F2EB]">{{ derivedPercentage }}%</strong>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-gradient-to-r from-[#8B6535] via-[#C98A4B] to-[#F3B775] h-full rounded-full transition-all duration-500"
              :style="{ width: `${derivedPercentage}%` }"
            ></div>
          </div>

          <div class="font-mono text-[9px] text-[#756F68] text-right">
            {{ completedCount }}/{{ totalTasksCount }} tasks
          </div>
        </div>

        <!-- Deployed Metric Card -->
        <div class="px-3 py-2 rounded-xl bg-[#09090B]/80 border border-white/[0.08] flex flex-col items-center justify-center min-w-[70px] text-center">
          <span class="font-mono text-[9px] uppercase tracking-wider text-[#756F68]">Deployed</span>
          <span class="font-mono text-base font-bold text-emerald-400 leading-tight mt-0.5">{{ completedCount }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Project } from '~/types'

defineProps<{
  project: Project
  completedCount: number
  totalTasksCount: number
  derivedPercentage: number
}>()
</script>
