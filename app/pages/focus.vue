<template>
  <div class="flex items-center justify-center min-h-[50vh]">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111114] border border-white/[0.08] text-xs font-mono text-[#756F68]">
      <span class="w-2 h-2 rounded-full bg-[#C98A4B] animate-ping" />
      <span>Redirecting to Weekly Focus...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    () => {
      return navigateTo('/sprints', { replace: true })
    }
  ]
})

await navigateTo('/sprints', { replace: true })
</script>
