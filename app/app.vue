<template>
  <div class="flex justify-center h-screen bg-[#09090B] overflow-hidden relative selection:bg-[#C98A4B]/20 selection:text-[#F5F2EB]">
    <!-- Static Engineering Telemetry Grid (Structure Architectural Theme) -->
    <StructureStaticGrid />

    <!-- Master Centered Workspace Shell: Sidebar Dock moves with content! -->
    <div class="max-w-[1440px] w-full flex h-full relative z-10 px-2 sm:px-3 mx-auto">
      <!-- UI Shell Dock (Directly adjacent to content with tight gap) -->
      <Sidebar class="relative z-40 shrink-0" />

      <!-- Main Application Column (HeaderBar + Content Views) -->
      <div
        class="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative ml-2 sm:ml-3"
        :class="{ 'md:mr-2 md:sm:mr-3': isProjectPage }"
      >
        <!-- Floating Transparent HeaderBar Overlay -->
        <HeaderBar class="absolute top-0 inset-x-0 z-30 pointer-events-none" />

        <!-- Scrollable Content Canvas (Content passes underneath HeaderBar) -->
        <main class="flex-1 overflow-y-auto no-scrollbar pt-16 px-2.5 sm:px-3.5 pb-2.5 sm:pb-3.5 flex flex-col min-h-0">
          <div class="w-full flex-1 flex flex-col min-h-0">
            <NuxtPage />
          </div>
        </main>
      </div>

      <!-- Project Shell Dock (Right side, symmetric 1:1 to Sidebar) -->
      <ProjectNavDock v-if="isProjectPage" class="relative z-40 shrink-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ProjectNavDock from '../components/project/ProjectNavDock.vue'

const route = useRoute()
const isProjectPage = computed(() => {
  return route.name === 'projects-slug' || (/^\/projects\/[^/]+/.test(route.path) && route.path !== '/projects')
})
</script>