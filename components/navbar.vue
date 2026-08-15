<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <NuxtLink to="/" class="brand-link" aria-label="Management Dashboard Home">
        <div class="brand-icon">M</div>
        <div class="brand-text">
          <span class="brand-title">Management</span>
          <span class="brand-badge">v2.0</span>
        </div>
      </NuxtLink>
      <button 
        class="mobile-toggle" 
        :aria-label="open ? 'Close navigation menu' : 'Open navigation menu'"
        :aria-expanded="open" 
        @click="open = !open"
      >
        <span class="toggle-icon">{{ open ? '✕' : '☰' }}</span>
      </button>
    </div>

    <nav class="sidebar-nav" :class="{ 'is-open': open }">
      <div class="nav-section-label">Menu</div>
      <NuxtLink to="/" class="nav-item" @click="open = false">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="9" rx="1"></rect>
          <rect x="14" y="3" width="7" height="5" rx="1"></rect>
          <rect x="14" y="12" width="7" height="9" rx="1"></rect>
          <rect x="3" y="16" width="7" height="5" rx="1"></rect>
        </svg>
        <span>Dashboard</span>
      </NuxtLink>

      <NuxtLink to="/projects" class="nav-item" @click="open = false">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>Projects</span>
      </NuxtLink>

      <NuxtLink to="/tasks" class="nav-item" @click="open = false">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <span>Tasks</span>
      </NuxtLink>
    </nav>

    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar" aria-hidden="true">B</div>
        <div class="user-info">
          <span class="user-name">Bagja Iskandar</span>
          <span class="user-status">
            <span class="status-dot" aria-hidden="true"></span>
            Personal Workspace
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { open.value = false })
</script>

<style src="../assets/css/navbar.css" scoped></style>