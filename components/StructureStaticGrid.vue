<template>
  <div class="fixed inset-0 pointer-events-none z-0 bg-[#09090B] overflow-hidden" aria-hidden="true">
    <!-- 1. Static 64px Hairline Engineering Grid (Subtle, Clean, Dark Modern) -->
    <div
      class="absolute inset-0"
      style="
        background-image:
          linear-gradient(to right, rgba(255, 255, 255, 0.018) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
        background-size: 64px 64px;
      "
    />

    <!-- 2. Soft Radial Vignette for Content Readability -->
    <div
      class="absolute inset-0"
      style="
        background: radial-gradient(ellipse at 50% 30%, transparent 45%, #09090B 96%);
      "
    />
  </div>
</template>
