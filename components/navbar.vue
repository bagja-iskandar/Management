/* navbar.vue*/

<template>
  <header>
    <NuxtLink to="/">Dashboard</NuxtLink>


    <!-- Menu utama (desktop/umum) -->
    <nav v-if="!open">
      <NuxtLink to="/">Dashboard</NuxtLink>
      <NuxtLink to="/projects">Projects</NuxtLink>
      <NuxtLink to="/contact">Contact</NuxtLink>
    </nav>


    <!-- Tombol toggle untuk mobile -->
    <button aria-label="Toggle menu" @click="open = !open">
      {{ open ? 'Tutup' : 'Menu' }}
    </button>


    <!-- Menu versi mobile -->
    <nav v-if="open">
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