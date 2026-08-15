<template>
  <div class="activity-table">
    <div class="table-row header">
      <span>TASK / PROJECT</span>
      <span>STATUS</span>
      <span>ASSIGNEE</span>
      <span>DATE</span>
      <span class="actions-cell">ACTION</span>
    </div>

    <div v-if="!rows?.length" class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">📋</div>
      <h3 class="empty-state-title">No tasks found</h3>
      <p class="empty-state-desc">No tasks match your current filter or query. Create a new task to see activity.</p>
    </div>

    <div v-for="(row, idx) in rows" :key="row.id" class="table-row">
      <div class="task-info-cell">
        <div class="task-icon-tile" aria-hidden="true">
          <span v-if="idx % 3 === 0">❖</span>
          <span v-else-if="idx % 3 === 1">&lt;/&gt;</span>
          <span v-else>🚀</span>
        </div>
        <div class="task-title-group">
          <span class="task-name">{{ row.name }}</span>
          <span class="task-project">{{ getProjectLabel(row) }}</span>
        </div>
      </div>

      <div>
        <span :class="['status-badge', statusClass(row.status)]">
          <span class="sr-only">Status: </span>{{ statusLabel(row.status) }}
        </span>
      </div>

      <div class="assignee-cell">
        <div class="assignee-avatar" title="Bagja Iskandar" aria-label="Assignee Bagja">
          <span>B</span>
        </div>
      </div>

      <div class="date-cell">{{ formatDate(row.date) }}</div>

      <div class="actions-cell">
        <button 
          class="action-btn toggle-btn" 
          type="button" 
          @click="$emit('toggle', row)" 
          :aria-label="`Update status for ${row.name}`"
          title="Toggle status"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
        <button 
          class="action-btn delete-btn" 
          type="button" 
          @click="$emit('delete', row)" 
          :aria-label="`Delete ${row.name}`"
          title="Delete task"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '../types'

const props = defineProps<{ rows: Task[] }>()

function statusClass(status: Task['status']) {
  return {
    todo: 'todo',
    proses: 'proses',
    selesai: 'selesai'
  }[status]
}

function statusLabel(status: Task['status']) {
  return {
    todo: 'To Do',
    proses: 'In Progress',
    selesai: 'Completed'
  }[status] ?? status
}

function getProjectLabel(row: Task) {
  const n = row.name.toLowerCase()
  if (n.includes('hitnet') || n.includes('eeg')) return 'Project Alpha • TF-HiTNet'
  if (n.includes('portfolio') || n.includes('web') || n.includes('deploy')) return 'Project Beta • Management Web'
  return 'Project Core • Workspace'
}

function formatDate(d?: string) {
  if (!d) return 'Today'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}
</script>

<style scoped>
.activity-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.8fr 1fr 0.8fr;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.03);
  transition: all 0.15s ease;
}

.table-row.header {
  color: var(--text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: transparent;
  padding: 8px 16px 12px;
  border-top: none;
  border-left: none;
  border-right: none;
}

.table-row:not(.header):hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.task-info-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.task-icon-tile {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.88rem;
  color: #c084fc;
  flex-shrink: 0;
}

.task-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.task-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-project {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.assignee-cell {
  display: flex;
  align-items: center;
}

.assignee-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #c0c1ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.date-cell {
  color: #94a3b8;
  font-size: 0.88rem;
}

.actions-cell {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  box-shadow: none;
}

.action-btn svg {
  width: 15px;
  height: 15px;
}

.toggle-btn {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
}

.toggle-btn:hover {
  background: rgba(99, 102, 241, 0.25);
  color: #ffffff;
}

.delete-btn {
  background: rgba(244, 63, 94, 0.1);
  border-color: rgba(244, 63, 94, 0.25);
  color: #fca5a5;
}

.delete-btn:hover {
  background: rgba(244, 63, 94, 0.25);
  color: #ffffff;
}

/* Status Badges with Stitch Styling */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 600;
  width: fit-content;
}

.status-badge.selesai {
  background: rgba(6, 182, 212, 0.12);
  border: 1px solid rgba(6, 182, 212, 0.35);
  color: #38bdf8;
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.15);
}

.status-badge.proses {
  background: rgba(168, 85, 247, 0.12);
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #c084fc;
  box-shadow: 0 0 10px rgba(168, 85, 247, 0.15);
}

.status-badge.todo {
  background: rgba(100, 116, 139, 0.15);
  border: 1px solid rgba(100, 116, 139, 0.35);
  color: #94a3b8;
}

@media (max-width: 840px) {
  .table-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .table-row.header {
    display: none;
  }
  .assignee-cell {
    display: none;
  }
  .actions-cell {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>