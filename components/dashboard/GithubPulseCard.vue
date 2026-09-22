<template>
  <div class="bg-[#111114] border border-white/[0.06] rounded-xl p-3.5 sm:p-4 overflow-hidden flex flex-col justify-between">
    <div>
      <!-- Header & Subhead -->
      <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06]">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-[#C98A4B]"></span>
          <h2 class="font-mono text-xs tracking-wider uppercase text-[#756F68] font-semibold">
            GITHUB PULSE
          </h2>
        </div>
        <span class="font-mono text-xs text-[#C98A4B] font-semibold">
          This Week: {{ totalCommits }} commits
        </span>
      </div>

      <!-- Label -->
      <div class="text-[11px] font-mono text-[#756F68] mb-2.5">
        Most active repos:
      </div>

      <!-- Comparison Progress Bars -->
      <div class="space-y-2.5">
        <div
          v-for="repo in activeRepos"
          :key="repo.name"
          class="space-y-1 group"
        >
          <!-- Repo name + Commit count -->
          <div class="flex items-center justify-between font-mono text-xs">
            <span class="text-[#F5F2EB] font-medium group-hover:text-[#C98A4B] transition-colors">
              {{ repo.name }}
            </span>
            <span class="text-[11px] text-[#756F68]">
              {{ repo.commits }} commits
            </span>
          </div>

          <!-- Horizontal comparison bar -->
          <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              class="h-full bg-gradient-to-r from-[#8B6535] to-[#C98A4B] rounded-full transition-all duration-300"
              :style="{ width: `${repo.percentage}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="pt-2.5 mt-3 border-t border-white/[0.04] flex items-center justify-between font-mono text-[10px] text-[#756F68]">
      <span>Last push: {{ lastPush }}</span>
      <NuxtLink to="/repos" class="hover:text-[#C98A4B] transition-colors flex items-center gap-1">
        <span>Inspect repos</span>
        <span aria-hidden="true">&rarr;</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ActiveRepoPulse {
  name: string
  commits: number
  percentage: number
}

withDefaults(
  defineProps<{
    totalCommits?: number
    lastPush?: string
    activeRepos?: ActiveRepoPulse[]
  }>(),
  {
    totalCommits: 0,
    lastPush: '-',
    activeRepos: () => []
  }
)
</script>
