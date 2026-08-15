<template>
  <section class="quick-panel">
    <h2>Quick Actions</h2>
    <p>Create a new task or navigate to manage projects and deliverables.</p>
    <div class="quick-actions">
      <button type="button" class="action-card" @click="$emit('add')" :disabled="disabled">
        <span class="action-icon primary">+</span>
        <span class="action-title">Add Task</span>
      </button>
      <NuxtLink to="/projects" class="action-card">
        <span class="action-icon cyan">📁</span>
        <span class="action-title">Manage Projects</span>
      </NuxtLink>
      <NuxtLink to="/tasks" class="action-card">
        <span class="action-icon violet">📋</span>
        <span class="action-title">Tasks Hub</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ disabled?: boolean }>()
</script>

<style scoped>
.quick-panel {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 24px;
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-ambient);
}

.quick-panel h2 {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-heading);
}

.quick-panel p {
  margin: 0 0 18px;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  min-height: 110px;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-heading);
  text-decoration: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  background: var(--glass-surface-hover);
  border-color: var(--glass-border-highlight);
  box-shadow: var(--shadow-card);
}

.action-card:disabled,
.action-card[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 800;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
}

.action-icon.primary {
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: var(--color-primary);
}

.action-icon.cyan {
  background: rgba(6, 182, 212, 0.15);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: var(--color-cyan);
}

.action-icon.violet {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: var(--color-violet);
}

.action-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-heading);
}

@media (max-width: 640px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
  .action-card {
    min-height: auto;
    flex-direction: row;
    align-items: center;
  }
}
</style>