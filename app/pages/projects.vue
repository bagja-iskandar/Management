<template>
  <section class="projects-page">
    <div class="page-heading">
      <div>
        <h1>Projects</h1>
        <p>Daftar proyek yang sedang dikelola dan ringkasan statusnya.</p>
      </div>
      <NuxtLink to="/" class="button">Kembali ke Dashboard</NuxtLink>
    </div>

    <div v-if="projectsError" class="feedback error" role="alert">
      Failed to load projects. Please refresh the page.
    </div>

    <div class="projects-grid">
      <article v-for="project in projects" :key="project.slug" class="project-card">
        <h2>{{ project.title }}</h2>
        <p>Slug: <code>{{ project.slug }}</code></p>
        <NuxtLink to="/" class="button">Lihat ringkasan</NuxtLink>
      </article>
    </div>

    <section class="project-summary">
      <h2>Ringkasan Proyek</h2>
      <p>Total proyek: {{ projects?.length ?? 0 }}</p>
      <p>Halaman ini menjadi dasar untuk menampilkan detail proyek dan roadmap selanjutnya.</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { useProjects } from '../../composables/useProjects'

const projectsApi = useProjects()
const { data: projects, error: projectsError } = await useAsyncData('projects', () => projectsApi.getProjects())
</script>
