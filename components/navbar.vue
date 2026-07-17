/* navbar.vue*/

<template>
  <header>
    <div class="brand">
      <span class="brand-mark">M</span>
      <NuxtLink to="/">Dashboard</NuxtLink>
    </div>

    <nav v-if="!open">
      <NuxtLink to="/">Dashboard</NuxtLink>
      <NuxtLink to="/projects">Projects</NuxtLink>
      <NuxtLink to="/contact">Contact</NuxtLink>
    </nav>

    <div class="header-end">
      <button aria-label="Toggle menu" @click="open = !open">
        {{ open ? 'Tutup' : 'Menu' }}
      </button>
      <div class="avatar" aria-label="User profile">B</div>
    </div>

    <nav class="mobile-menu" v-if="open">
      <NuxtLink to="/" @click="open=false">Dashboard</NuxtLink>
      <NuxtLink to="/projects" @click="open=false">Projects</NuxtLink>
      <NuxtLink to="/contact" @click="open=false">Contact</NuxtLink>
    </nav>
  </header>
</template>


<script setup lang="ts">
const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { open.value = false })
</script>

<style src="../assets/css/navbar.css" scoped></style>