<template>
  <section class="p-6 rounded-xl bg-[#111114] border border-white/[0.06] space-y-4">
    <div>
      <h2 class="font-mono text-sm font-semibold text-[#F5F2EB] uppercase tracking-wider">Quick Actions</h2>
      <p class="font-sans text-xs text-[#756F68] mt-1">Direct operations to accelerate development workflows.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <button
        type="button"
        class="flex flex-col items-start p-4 rounded-lg bg-[#09090B] border border-white/[0.06] hover:border-[#C98A4B] hover:shadow-glow-ochre transition-all group disabled:opacity-50 disabled:cursor-not-allowed text-left"
        :disabled="disabled"
        @click="$emit('add')"
      >
        <span class="w-8 h-8 rounded bg-[#C98A4B]/15 text-[#C98A4B] border border-[#C98A4B]/30 flex items-center justify-center font-mono text-base font-bold mb-3 group-hover:scale-105 transition-transform">
          +
        </span>
        <span class="font-sans text-sm font-medium text-[#F5F2EB]">Create Task</span>
        <span class="font-sans text-xs text-[#756F68] mt-0.5">Queue new engineering issue</span>
      </button>

      <NuxtLink
        to="/projects"
        class="flex flex-col items-start p-4 rounded-lg bg-[#09090B] border border-white/[0.06] hover:border-[#C98A4B] hover:shadow-glow-ochre transition-all group text-left"
      >
        <span class="w-8 h-8 rounded bg-white/5 text-[#F5F2EB] border border-white/[0.1] flex items-center justify-center font-mono text-sm mb-3 group-hover:scale-105 transition-transform">
          📁
        </span>
        <span class="font-sans text-sm font-medium text-[#F5F2EB]">Projects Hub</span>
        <span class="font-sans text-xs text-[#756F68] mt-0.5">Manage repositories & repos</span>
      </NuxtLink>

      <NuxtLink
        to="/tasks"
        class="flex flex-col items-start p-4 rounded-lg bg-[#09090B] border border-white/[0.06] hover:border-[#C98A4B] hover:shadow-glow-ochre transition-all group text-left"
      >
        <span class="w-8 h-8 rounded bg-white/5 text-[#F5F2EB] border border-white/[0.1] flex items-center justify-center font-mono text-sm mb-3 group-hover:scale-105 transition-transform">
          ❖
        </span>
        <span class="font-sans text-sm font-medium text-[#F5F2EB]">Task Matrix</span>
        <span class="font-sans text-xs text-[#756F68] mt-0.5">Full filterable sprint matrix</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
defineEmits<{ (e: 'add'): void }>()
</script>