<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Tile 1: Velocity Completion (%) -->
    <div class="obs-card rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-white/[0.12] space-y-3">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs uppercase tracking-wider text-muted">Velocity Completion</span>
          <NexuraIcon name="Zap" size="sm" class="text-accent-light" />
        </div>
        <div class="flex items-baseline gap-2 mt-2">
          <span class="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-foreground">
            {{ completionPercentage }}%
          </span>
          <span class="font-mono tabular-nums text-xs text-muted">
            ({{ completedCount }}/{{ totalDeliverablesCount }})
          </span>
        </div>
      </div>

      <div class="space-y-1.5 pt-2 border-t border-white/[0.06]">
        <!-- Velocity Progress Bar with Accent Gradient & Specular Top Highlight -->
        <div class="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden p-[1px] shadow-inner">
          <div
            class="h-full rounded-full bg-gradient-to-r from-accent-dim via-accent to-accent-light transition-all duration-500 ease-out shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)]"
            :style="{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }"
          ></div>
        </div>
        <div class="flex justify-between font-mono tabular-nums text-xs text-dim pt-0.5">
          <span>{{ Math.max(0, totalDeliverablesCount - completedCount) }} remaining</span>
          <span>{{ remainingDaysText }}</span>
        </div>
      </div>
    </div>

    <!-- Tile 2: Active In-Flight -->
    <div class="obs-card rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-white/[0.12] space-y-3">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs uppercase tracking-wider text-muted">Active In-Flight</span>
          <NexuraIcon name="Clock" size="sm" class="text-accent-light" />
        </div>
        <div class="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-accent-light mt-2">
          {{ inFlightCount }}
        </div>
      </div>
      <div class="pt-2 border-t border-white/[0.06] flex items-center justify-between font-sans text-xs text-muted">
        <span>Tasks in execution cycle</span>
        <span class="inline-flex items-center gap-1.5 font-mono text-xs text-accent-light">
          <span class="w-1.5 h-1.5 rounded-full bg-accent-light" :class="{ 'animate-pulse': inFlightCount > 0 }"></span>
          <span>Running</span>
        </span>
      </div>
    </div>

    <!-- Tile 3: Pending Queue -->
    <div class="obs-card rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-white/[0.12] space-y-3">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs uppercase tracking-wider text-muted">Pending Queue</span>
          <NexuraIcon name="AlertTriangle" size="sm" class="text-amber-400/80" />
        </div>
        <div class="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-foreground mt-2">
          {{ pendingCount }}
        </div>
      </div>
      <div class="pt-2 border-t border-white/[0.06] flex items-center justify-between font-sans text-xs text-muted">
        <span>Queued for kickoff</span>
        <span class="font-mono tabular-nums text-xs text-dim bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
          Ready
        </span>
      </div>
    </div>

    <!-- Tile 4: Deployed Deliverables -->
    <div class="obs-card rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-white/[0.12] space-y-3">
      <div>
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs uppercase tracking-wider text-muted">Deployed Deliverables</span>
          <NexuraIcon name="CheckCircle2" size="sm" class="text-emerald-400" />
        </div>
        <div class="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-emerald-400 mt-2">
          {{ completedCount }}
        </div>
      </div>
      <div class="pt-2 border-t border-white/[0.06] flex items-center justify-between font-sans text-xs text-muted">
        <span>Shipped & verified</span>
        <span class="font-mono tabular-nums text-xs text-dim truncate max-w-[130px]" :title="weekLabel">
          {{ weekLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'

defineProps<{
  weekLabel: string
  remainingDaysText: string
  completionPercentage: number
  completedCount: number
  totalDeliverablesCount: number
  inFlightCount: number
  pendingCount: number
}>()
</script>
