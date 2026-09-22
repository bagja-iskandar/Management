<template>
  <Teleport to="body">
    <div
      v-if="activeTask"
      class="fixed pointer-events-none z-[999999] select-none"
      :style="{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '300px',
        height: '180px',
        transform: 'translate(-50%, -20px) rotate(2deg) scale(1.02)',
        willChange: 'transform, left, top'
      }"
    >
      <div class="bg-[#111114] border-2 border-[#C98A4B] rounded-xl p-3.5 h-full flex flex-col justify-between shadow-[0_25px_50px_rgba(0,0,0,0.98),0_0_24px_rgba(201,138,75,0.45)] ring-1 ring-[#C98A4B]/60 box-border">
        <!-- Top Row: #ENG-xxx & Priority Badge -->
        <div class="flex items-center justify-between h-5 shrink-0">
          <span class="font-mono text-xs text-[#C98A4B] font-bold tracking-tight">
            #{{ activeTask.taskId ? (activeTask.taskId.startsWith('#') ? activeTask.taskId.slice(1) : activeTask.taskId) : activeTask.id.slice(0, 7) }}
          </span>
          <div
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider font-semibold border shrink-0"
            :class="activeTask.priority === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/40' : activeTask.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'"
          >
            <span>{{ activeTask.priority || 'medium' }}</span>
            <span>⚡</span>
          </div>
        </div>

        <!-- Middle Section: Task Title & Description -->
        <div class="my-auto py-0.5 space-y-0.5 overflow-hidden">
          <h4 class="text-[#F5F2EB] font-medium text-sm leading-snug line-clamp-2 h-[38px] flex items-center">
            <span class="line-clamp-2">{{ activeTask.name }}</span>
          </h4>
          <p class="text-xs text-[#756F68] line-clamp-1 font-sans h-[16px] truncate">
            {{ activeTask.description || '' }}
          </p>
        </div>

        <!-- Bottom Section: Date & Tags/Badges -->
        <div class="pt-2 border-t border-white/[0.04] space-y-1.5 shrink-0">
          <div class="flex items-center gap-2 text-[10px] font-mono h-4">
            <span v-if="activeTask.dueDate" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/[0.06] text-[#756F68]">
              <span>📅</span>
              <span>{{ activeTask.dueDate }}</span>
            </span>
          </div>
          <div class="flex items-center gap-1.5 overflow-hidden h-5">
            <template v-if="activeTask.techTags && activeTask.techTags.length">
              <span
                v-for="tag in activeTask.techTags.slice(0, 3)"
                :key="tag"
                class="font-mono text-[10px] bg-[#C98A4B]/15 text-[#C98A4B] border border-[#C98A4B]/30 rounded px-2 py-0.2 font-medium shrink-0 truncate max-w-[85px]"
              >
                {{ tag }}
              </span>
            </template>
            <span v-else class="font-mono text-[10px] text-[#756F68]/60 italic shrink-0">#core</span>
            <span
              v-if="activeTask.status === 'blocked'"
              class="ml-auto font-mono text-[9px] bg-red-500/20 text-red-400 border border-red-500/40 rounded px-1.5 py-0.5 uppercase tracking-wider font-bold shrink-0"
            >
              ERROR
            </span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Task } from '~/types'

defineProps<{
  activeTask: Task | null
  position: { x: number; y: number }
}>()
</script>
