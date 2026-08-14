<template>
  <section class="quick-panel">
    <h2>Quick Actions</h2>
    <p>Create a new task or navigate to manage projects and contact the team.</p>
    <div class="quick-actions">
      <button type="button" class="action-card" @click="$emit('add')" :disabled="disabled">
        <span class="action-icon">+</span>
        <span>Add Task</span>
      </button>
      <NuxtLink to="/projects" class="action-card secondary">
        <span class="action-icon">📁</span>
        <span>Manage Projects</span>
      </NuxtLink>
      <NuxtLink to="/contact" class="action-card tertiary">
        <span class="action-icon">👤</span>
        <span>Contact Team</span>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ disabled?: boolean }>()
</script>

<style scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.action-card {
  display: grid;
  place-items: start;
  gap: 12px;
  padding: 22px;
  min-height: 140px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--surface-muted);
  color: var(--text);
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 38px rgba(56, 75, 112, 0.08);
}

.action-card:disabled,
.action-card[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  background: rgba(56, 75, 112, 0.12);
  color: var(--primary);
  font-size: 1.2rem;
}

.action-card span:last-child {
  font-weight: 700;
}

.action-card.secondary .action-icon {
  background: rgba(80, 118, 135, 0.14);
  color: var(--secondary);
}

.action-card.tertiary .action-icon {
  background: rgba(255, 82, 82, 0.14);
  color: var(--danger);
}
</style>