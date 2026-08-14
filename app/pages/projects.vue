<template>
  <section class="projects-page">
    <div class="page-heading">
      <div>
        <h1>Projects</h1>
        <p>List of managed projects and their status overview.</p>
      </div>
      <NuxtLink to="/" class="button">Back to Dashboard</NuxtLink>
    </div>

    <div v-if="projectsError" class="feedback error" role="alert">
      Failed to load projects. Please refresh the page.
    </div>

    <div v-if="!projects?.length && !projectsError" class="empty-state">
      No projects registered at the moment.
    </div>

    <div v-else class="projects-grid">
      <article v-for="project in projects" :key="project.slug" class="project-card">
        <h2>{{ project.title }}</h2>
        <p>{{ project.description || 'Active project under management and performance tracking.' }}</p>
        <NuxtLink to="#summary" class="button secondary">View Summary</NuxtLink>
      </article>
    </div>

    <section id="summary" class="project-summary">
      <h2>Project Summary</h2>
      <p>Total projects: {{ projects?.length ?? 0 }}</p>
      <p>This page provides a foundation for detailed project tracking and roadmap updates.</p>
    </section>
  </section>
</template>

<script setup lang="ts">
const projectsApi = useProjects()
const { data: projects, error: projectsError } = await useAsyncData('projects', () => projectsApi.getProjects())
</script>
