<template>
  <div class="space-y-4">
    <!-- Header Section with Dual-Mode Toggle & Companion Panel Triggers -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
      <div>
        <h1 class="text-xl sm:text-2xl font-semibold text-[#F3F4F6] tracking-tight font-sans">
          Tasks &amp; Queue Workspace
        </h1>
        <p class="text-xs text-[#8A8F9E] font-sans mt-0.5">
          Unified deliverable execution center with full 5-column Kanban, checklist cockpit, and scratchpad.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <!-- View Mode Switcher (Kanban vs Table) -->
        <div class="p-1 rounded-lg bg-[#07080A] border border-white/[0.08] inline-flex items-center gap-1 shadow-inner" role="group" aria-label="View Mode">
          <button
            type="button"
            class="px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            :class="viewMode === 'kanban'
              ? 'bg-white/[0.1] text-white font-semibold shadow-sm border border-white/[0.1]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'"
            @click="setViewMode('kanban')"
          >
            <NexuraIcon name="LayoutGrid" size="xs" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            :class="viewMode === 'table'
              ? 'bg-white/[0.1] text-white font-semibold shadow-sm border border-white/[0.1]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'"
            @click="setViewMode('table')"
          >
            <NexuraIcon name="List" size="xs" />
            <span>Table</span>
          </button>
        </div>

        <!-- Active Focus Toggle Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition border cursor-pointer"
          :class="showActiveFocus
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
            : 'bg-[#07080A] hover:bg-white/[0.04] text-[#8A8F9E] hover:text-[#F3F4F6] border-white/[0.08]'"
          title="Toggle Active Focus checklist panel"
          @click="showActiveFocus = !showActiveFocus"
        >
          <NexuraIcon name="Zap" size="xs" :class="showActiveFocus ? 'text-indigo-400' : 'text-[#8A8F9E]'" />
          <span>Active Focus</span>
          <span
            v-if="runningSprintCount > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-indigo-200 font-bold"
          >
            {{ runningSprintCount }}
          </span>
        </button>

        <!-- Scratchpad Slide-Over Toggle Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition border cursor-pointer"
          :class="showScratchpad
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            : 'bg-[#07080A] hover:bg-white/[0.04] text-[#8A8F9E] hover:text-[#F3F4F6] border-white/[0.08]'"
          title="Open Idea Scratchpad slide-over"
          @click="showScratchpad = !showScratchpad"
        >
          <NexuraIcon name="Sparkles" size="xs" :class="showScratchpad ? 'text-amber-400' : 'text-[#8A8F9E]'" />
          <span>Scratchpad</span>
          <span
            v-if="notesCount > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-200 font-bold"
          >
            {{ notesCount }}
          </span>
        </button>

        <!-- New Deliverable Action Button -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-white text-xs font-semibold text-[#07080A] transition cursor-pointer active:scale-95 shadow-sm"
          @click="openAddTask"
        >
          <NexuraIcon name="Plus" size="xs" :stroke-width="2.4" />
          <span>New Deliverable</span>
        </button>
      </div>
    </div>

    <!-- Active Focus Companion Panel (Collapsible) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform opacity-0 -translate-y-2"
      enter-to-class="transform opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform opacity-100 translate-y-0"
      leave-to-class="transform opacity-0 -translate-y-2"
    >
      <ActiveFocusPanel
        v-if="showActiveFocus"
        :project-slug="projectFilter === 'all' ? undefined : projectFilter"
        @close="showActiveFocus = false"
      />
    </transition>

    <!-- Success Feedback Alert -->
    <div
      v-if="successFeedback"
      class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center justify-between"
      role="status"
    >
      <div class="flex items-center gap-2">
        <NexuraIcon name="CheckCircle2" size="sm" class="text-emerald-400 shrink-0" />
        <span>{{ successFeedback }}</span>
      </div>
      <button
        type="button"
        class="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
        @click="successFeedback = ''"
      >
        Dismiss
      </button>
    </div>

    <!-- Multi-Filter & Search Toolbar -->
    <div class="obs-card rounded-xl p-3.5 space-y-3.5 border border-white/[0.07]">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <!-- Search Input -->
        <div class="lg:col-span-4 relative">
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#565B68]">
            <NexuraIcon name="Search" size="sm" />
          </div>
          <input
            v-model="search"
            type="search"
            placeholder="Search deliverables by name, ID, or description..."
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition"
            aria-label="Search tasks"
          />
        </div>

        <!-- Project Selector -->
        <div class="lg:col-span-2 relative">
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#565B68]">
            <NexuraIcon name="Folder" size="sm" />
          </div>
          <select
            v-model="projectFilter"
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 cursor-pointer outline-none transition"
            aria-label="Filter by Project"
          >
            <option value="all">All Projects</option>
            <option v-for="p in projectsList" :key="p.slug" :value="p.slug">{{ p.title || p.slug }}</option>
          </select>
        </div>

        <!-- Priority Selector -->
        <div class="lg:col-span-2 relative">
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#565B68]">
            <NexuraIcon name="Zap" size="sm" />
          </div>
          <select
            v-model="priorityFilter"
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 cursor-pointer outline-none transition"
            aria-label="Filter by Priority"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <!-- Tech Tag Selector -->
        <div class="lg:col-span-2 relative">
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#565B68]">
            <NexuraIcon name="Tag" size="sm" />
          </div>
          <select
            v-model="tagFilter"
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 cursor-pointer outline-none transition"
            aria-label="Filter by Tag"
          >
            <option value="all">All Tags</option>
            <option v-for="tag in availableTags" :key="tag" :value="tag">#{{ tag }}</option>
          </select>
        </div>

        <!-- Sort Dropdown -->
        <div class="lg:col-span-2 relative">
          <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#565B68]">
            <NexuraIcon name="SlidersHorizontal" size="sm" />
          </div>
          <select
            v-model="sortBy"
            class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono text-[#F3F4F6] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 cursor-pointer outline-none transition"
            aria-label="Sort tasks"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="priority-desc">Priority: High to Low</option>
            <option value="status">By Status</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      <!-- Status Tabs Segmented Control (Visible in Table mode) -->
      <div
        v-if="viewMode === 'table'"
        class="p-1 rounded-lg bg-[#07080A] border border-white/[0.06] inline-flex items-center gap-1 overflow-x-auto max-w-full"
        role="tablist"
        aria-label="Task Status Filter"
      >
        <button
          v-for="tab in [
            { id: 'all', label: 'All', count: allCount },
            { id: 'idea', label: 'Ideas', count: ideaCount },
            { id: 'in_queue', label: 'Queued', count: inQueueCount },
            { id: 'running_sprint', label: 'In Flight', count: runningSprintCount },
            { id: 'blocked', label: 'Blocked / Bug', count: blockedCount },
            { id: 'deployed', label: 'Deployed', count: deployedCount }
          ]"
          :key="tab.id"
          type="button"
          class="px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer border"
          :class="statusFilter === tab.id
            ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
            : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
          @click="statusFilter = tab.id as any"
        >
          <span>{{ tab.label }}</span>
          <span class="text-xs px-1.5 py-0.5 rounded font-mono bg-white/[0.05] text-[#8A8F9E]">{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="tasksError"
      class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center justify-between"
      role="alert"
    >
      <div class="flex items-center gap-2">
        <NexuraIcon name="AlertTriangle" size="sm" class="text-rose-400 shrink-0" />
        <span>Failed to load tasks from server.</span>
      </div>
      <button
        type="button"
        class="underline hover:no-underline font-medium cursor-pointer"
        @click="reloadTasks"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="!filteredTasks.length && !tasksError"
      class="py-16 text-center rounded-xl obs-card border border-white/[0.07] space-y-3"
    >
      <div class="w-10 h-10 mx-auto rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[#565B68]">
        <NexuraIcon name="Inbox" size="lg" class="text-[#565B68]" />
      </div>
      <h3 class="font-sans text-sm font-semibold text-[#F3F4F6]">No deliverables match query</h3>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">Try resetting your status, priority, or project filters.</p>
      <div class="flex items-center justify-center gap-2 pt-1">
        <button
          type="button"
          class="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-sans text-[#F3F4F6] border border-white/[0.08] transition cursor-pointer"
          @click="resetFilters"
        >
          Clear Filters
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F4F6] hover:bg-white text-xs font-medium text-[#07080A] transition cursor-pointer active:scale-95"
          @click="openAddTask"
        >
          <NexuraIcon name="Plus" size="xs" :stroke-width="2.2" />
          <span>New Deliverable</span>
        </button>
      </div>
    </div>

    <!-- DUAL-MODE VIEW: KANBAN BOARD -->
    <div v-else-if="viewMode === 'kanban'" class="space-y-4">
      <KanbanBoard
        :tasks="filteredTasks"
        @update-status="handleUpdateStatus"
        @task-click="handleTaskClick"
        @add-task="openAddTask"
      />
    </div>

    <!-- DUAL-MODE VIEW: CONCISE TASKS TABLE -->
    <div v-else class="obs-card rounded-xl p-3 sm:p-4 space-y-2 border border-white/[0.07]">
      <!-- Header Table (Desktop) -->
      <div class="hidden md:grid md:grid-cols-12 gap-3 px-3 py-2 font-mono text-xs uppercase tracking-wider text-[#565B68] border-b border-white/[0.06] pb-2">
        <span class="col-span-2">Task ID</span>
        <span class="col-span-4">Deliverable &amp; Tech</span>
        <span class="col-span-2">Project</span>
        <span class="col-span-1">Priority</span>
        <span class="col-span-1">Status</span>
        <span class="col-span-1">Due Date</span>
        <span class="col-span-1 text-right">Action</span>
      </div>

      <!-- Rows (Clicking row opens task drawer) -->
      <div
        v-for="t in filteredTasks"
        :key="t.id"
        class="bg-[#07080A] hover:bg-[#171920] border border-white/[0.05] hover:border-white/[0.1] rounded-lg p-3 transition items-center grid grid-cols-1 md:grid-cols-12 gap-3 group cursor-pointer"
        @click="handleTaskClick(t)"
      >
        <!-- Task ID Monospace -->
        <div class="col-span-2 flex items-center gap-2">
          <span class="font-mono text-xs text-[#8A8F9E] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] shrink-0">
            #{{ formatTaskId(t) }}
          </span>
        </div>

        <!-- Task Title & Description -->
        <div class="col-span-4 min-w-0">
          <div
            class="text-sm font-medium truncate group-hover:text-white transition"
            :class="normalizeStatus(t.status) === 'deployed' ? 'text-[#565B68] line-through' : 'text-[#F3F4F6]'"
            :title="t.name"
          >
            {{ t.name }}
          </div>
          <div class="font-sans text-xs text-[#8A8F9E] truncate mt-0.5" :title="t.description">
            {{ t.description || 'Milestone deliverable for personal engineering workspace.' }}
          </div>
          <!-- Tech Tags & Linked Issue/PR -->
          <div v-if="t.techTags?.length || t.githubPrUrl || t.githubIssueUrl" class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span
              v-for="tag in t.techTags"
              :key="tag"
              class="font-mono text-xs bg-white/[0.04] text-[#8A8F9E] border border-white/[0.06] rounded px-1.5 py-0.5"
            >
              {{ tag }}
            </span>
            <a
              v-if="t.githubPrUrl"
              :href="t.githubPrUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 font-mono text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 transition"
              title="Open Pull Request"
              @click.stop
            >
              <NexuraIcon name="ExternalLink" size="xs" />
              <span>PR</span>
            </a>
            <a
              v-if="t.githubIssueUrl"
              :href="t.githubIssueUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 font-mono text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 transition"
              title="Open Issue"
              @click.stop
            >
              <NexuraIcon name="ExternalLink" size="xs" />
              <span>Issue</span>
            </a>
          </div>
        </div>

        <!-- Project Badge (Clean Honest Fallback: task.projectSlug || 'Unassigned') -->
        <div class="col-span-2">
          <span class="inline-flex items-center gap-1.5 text-xs text-[#8A8F9E] bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded font-mono truncate max-w-full">
            <NexuraIcon name="Folder" size="xs" class="shrink-0 text-[#8A8F9E]" />
            <span class="truncate">{{ getProjectName(t) }}</span>
          </span>
        </div>

        <!-- Priority Dot & Badge -->
        <div class="col-span-1">
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-xs uppercase"
            :class="getPriorityBadgeClass(t.priority)"
          >
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="getPriorityDotClass(t.priority)"
              aria-hidden="true"
            ></span>
            <span>{{ t.priority || 'Medium' }}</span>
          </span>
        </div>

        <!-- Status Badge -->
        <div class="col-span-1">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            :class="getStatusBadgeClass(t.status)"
          >
            {{ getStatusLabel(t.status) }}
          </span>
        </div>

        <!-- Date (Clean Honest Fallback: if (!d) return 'No Due Date') -->
        <div class="col-span-1 font-mono text-xs text-[#8A8F9E] whitespace-nowrap">
          {{ formatDate(t.dueDate || t.date) }}
        </div>

        <!-- Action Buttons -->
        <div class="col-span-1 flex items-center justify-end gap-1">
          <button
            type="button"
            class="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors focus:ring-1 focus:ring-indigo-500/50 focus:outline-none cursor-pointer"
            :aria-label="`Toggle status for ${t.name}`"
            title="Cycle status (Queued → In Flight → Deployed)"
            @click.stop="toggleStatus(t)"
          >
            <NexuraIcon name="RotateCw" size="sm" />
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg hover:bg-rose-500/15 text-[#8A8F9E] hover:text-rose-400 transition-colors focus:ring-1 focus:ring-rose-500/50 focus:outline-none cursor-pointer"
            :aria-label="`Delete ${t.name}`"
            title="Delete deliverable"
            @click.stop="deleteTask(t)"
          >
            <NexuraIcon name="Trash2" size="sm" />
          </button>
        </div>
      </div>
    </div>

    <!-- Analytics Summary Panel -->
    <section class="obs-card rounded-xl p-4 space-y-2.5 border border-white/[0.07]">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-mono uppercase tracking-wider text-[#8A8F9E] font-semibold flex items-center gap-2">
          <NexuraIcon name="Sparkles" size="xs" class="text-indigo-400" />
          <span>Deliverables Analytics Summary</span>
        </h2>
        <span class="text-xs text-[#565B68] font-mono">Live Matrix</span>
      </div>
      <div class="flex items-center gap-2.5 flex-wrap font-mono text-xs">
        <span class="px-2.5 py-1 rounded-lg bg-[#07080A] text-[#F3F4F6] border border-white/[0.08] shadow-specular">
          Total: <span class="text-white font-semibold">{{ allCount }}</span>
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Deployed: <span class="font-semibold">{{ deployedCount }}</span>
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          In Flight: <span class="font-semibold">{{ runningSprintCount }}</span>
        </span>
        <span class="px-2.5 py-1 rounded-lg bg-[#07080A] text-[#8A8F9E] border border-white/[0.06]">
          Queued: <span class="font-semibold text-[#F3F4F6]">{{ inQueueCount }}</span>
        </span>
        <span v-if="ideaCount > 0" class="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
          Ideas: <span class="font-semibold">{{ ideaCount }}</span>
        </span>
        <span v-if="blockedCount > 0" class="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Blocked: <span class="font-semibold">{{ blockedCount }}</span>
        </span>
      </div>
      <p class="font-sans text-xs text-[#8A8F9E] leading-relaxed">
        Deliverables are systematically linked with managed projects to calculate derived milestone velocities and burn-down rates across the workspace.
      </p>
    </section>

    <!-- Slide-Over Idea Scratchpad Panel -->
    <div v-if="showScratchpad" class="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="scratchpad-slideover-title">
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" @click="showScratchpad = false" />
      <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div class="w-screen max-w-lg shadow-2xl h-full flex flex-col">
          <IdeaScratchpadPanel
            :is-drawer="true"
            :project-slug="projectFilter === 'all' ? '' : projectFilter"
            container-class="h-full rounded-none border-l border-white/[0.08]"
            @close="showScratchpad = false"
            @promoted="onScratchpadPromoted"
          />
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmDialog
      v-if="confirmOpen"
      title="Delete Task Deliverable"
      :message="`Are you sure you want to permanently delete '${confirmTarget?.name}'? This action cannot be reversed.`"
      confirm-text="Delete Deliverable"
      cancel-text="Keep Task"
      :busy="isBusy"
      @confirm="onConfirmDelete"
      @cancel="() => { confirmOpen = false; confirmTarget = null }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Task, TaskPriority, TaskStatus } from '~/types'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import KanbanBoard from '~~/components/KanbanBoard.vue'
import ActiveFocusPanel from '~~/components/tasks/ActiveFocusPanel.vue'
import IdeaScratchpadPanel from '~~/components/notes/IdeaScratchpadPanel.vue'
import ConfirmDialog from '~~/components/ConfirmDialog.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useTaskDrawer } from '~/composables/useTaskDrawer'
import { useQuickTask } from '~/composables/useQuickTask'
import { useOmniSearch } from '~/composables/useOmniSearch'
import { useTasks } from '~/composables/useTasks'
import { useProjects } from '~/composables/useProjects'

// Workspace singletons
const route = useRoute()
const router = useRouter()
const workspaceStore = useWorkspaceStore()
const { openTaskDrawer } = useTaskDrawer()
const { openAddTask } = useQuickTask()
const { isOpen: isOmniSearchOpen } = useOmniSearch()
const tasksApi = useTasks()
const projectsApi = useProjects()

// View Mode (Kanban vs Table) with LocalStorage persistence
const viewMode = ref<'kanban' | 'table'>('kanban')

// Companion Panel toggles
const showActiveFocus = ref(false)
const showScratchpad = ref(false)

// Search & Filters
const search = ref('')
const projectFilter = ref('all')
const priorityFilter = ref('all')
const tagFilter = ref('all')
const statusFilter = ref<'all' | 'idea' | 'in_queue' | 'running_sprint' | 'deployed' | 'blocked'>('all')
const sortBy = ref<'date-desc' | 'date-asc' | 'priority-desc' | 'status' | 'name-asc'>('date-desc')

const validStatuses = new Set(['all', 'idea', 'in_queue', 'running_sprint', 'deployed', 'blocked'])

watch(
  () => route.query,
  (q) => {
    if (typeof q.status === 'string' && validStatuses.has(q.status)) {
      statusFilter.value = q.status as typeof statusFilter.value
    }
    if (typeof q.project === 'string' && q.project.trim() !== '') {
      projectFilter.value = q.project.trim()
    }
    if (q.scratchpad === '1' || q.scratchpad === 'true') {
      showScratchpad.value = true
    } else if (typeof q.status === 'string' && !q.scratchpad) {
      showScratchpad.value = false
    }
  },
  { immediate: true }
)

watch(showScratchpad, (open) => {
  if (!open && route.query.scratchpad) {
    const nextQuery = { ...route.query }
    delete nextQuery.scratchpad
    router.replace({ query: nextQuery })
  }
})

watch(isOmniSearchOpen, (open) => {
  if (open && showScratchpad.value) {
    showScratchpad.value = false
  }
})

// Confirm dialog & feedback states
const confirmOpen = ref(false)
const confirmTarget = ref<Task | null>(null)
const isBusy = ref(false)
const successFeedback = ref('')
const tasksError = ref<any>(null)

// Load view preference and ensure workspace data is hydrated
onMounted(async () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('nexura:tasks_view_mode')
    if (saved === 'kanban' || saved === 'table') {
      viewMode.value = saved
    }
  }

  if (!workspaceStore.isInitialized.value) {
    try {
      await workspaceStore.initializeWorkspace()
    } catch (err) {
      tasksError.value = err
    }
  }
})

function setViewMode(mode: 'kanban' | 'table') {
  viewMode.value = mode
  if (mode === 'kanban') {
    statusFilter.value = 'all'
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('nexura:tasks_view_mode', mode)
  }
}

async function reloadTasks() {
  tasksError.value = null
  try {
    await workspaceStore.refreshWorkspace()
  } catch (err) {
    tasksError.value = err
  }
}

// SSOT Reactive task list from workspace store
const tasksList = computed<Task[]>(() => workspaceStore.tasks.value || [])
const projectsList = computed(() => workspaceStore.projects.value || [])
const notesCount = computed(() => (workspaceStore.notes.value || []).length)

// Unique tech tags from tasksList
const availableTags = computed<string[]>(() => {
  const set = new Set<string>()
  for (const t of tasksList.value) {
    if (t.techTags && Array.isArray(t.techTags)) {
      for (const tag of t.techTags) {
        if (tag) set.add(tag)
      }
    }
  }
  return Array.from(set).sort()
})

// Task ID Formatter
function formatTaskId(t: Task): string {
  if (t.taskId) return t.taskId.replace(/^#/, '')
  return `ENG-${String(t.id).slice(-3).padStart(3, '0')}`
}

/**
 * Metric Honesty: Project Name Getter
 * Fallback to task.projectSlug || 'Unassigned' (Zero fake 'management' fallback)
 */
function getProjectName(task: Task): string {
  return task.projectSlug || 'Unassigned'
}

/**
 * Metric Honesty: Due Date Formatter
 * Fallback to 'No Due Date' (Zero fake 'Sep 2026' fallback)
 */
function formatDate(d?: string) {
  if (!d) return 'No Due Date'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}

function getStatusLabel(status?: string): string {
  if (!status) return 'Queued'
  const s = status.toLowerCase()
  if (s === 'idea') return 'Idea'
  if (s === 'deployed' || s === 'selesai') return 'Deployed'
  if (s === 'running_sprint' || s === 'in_progress' || s === 'proses') return 'In Progress'
  if (s === 'blocked') return 'Blocked'
  if (s === 'in_review') return 'In Review'
  return 'Queued'
}

function normalizeStatus(status?: string): TaskStatus {
  if (!status) return 'in_queue'
  const s = status.toLowerCase()
  if (s === 'idea') return 'idea'
  if (s === 'deployed' || s === 'selesai') return 'deployed'
  if (s === 'running_sprint' || s === 'in_progress' || s === 'proses') return 'running_sprint'
  if (s === 'blocked') return 'blocked'
  return 'in_queue'
}

function getStatusBadgeClass(status?: string): string {
  const raw = (status || '').toLowerCase()
  if (raw === 'in_review') {
    return 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
  }
  const s = normalizeStatus(status)
  if (s === 'idea') return 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
  if (s === 'deployed') return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
  if (s === 'running_sprint') return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
  if (s === 'blocked') return 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
  return 'bg-white/[0.04] text-[#8A8F9E] border border-white/[0.08]'
}

function getPriorityBadgeClass(priority?: string): string {
  const p = (priority || '').toLowerCase()
  if (p === 'critical') return 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
  if (p === 'high') return 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
  if (p === 'medium') return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
  return 'bg-white/[0.04] text-[#8A8F9E] border border-white/[0.08]'
}

function getPriorityDotClass(priority?: string): string {
  const p = (priority || '').toLowerCase()
  if (p === 'critical') return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
  if (p === 'high') return 'bg-amber-400'
  if (p === 'medium') return 'bg-indigo-400'
  return 'bg-[#565B68]'
}

// Live Counts
const allCount = computed(() => tasksList.value.length)
const ideaCount = computed(() => tasksList.value.filter(t => normalizeStatus(t.status) === 'idea').length)
const inQueueCount = computed(() => tasksList.value.filter(t => normalizeStatus(t.status) === 'in_queue').length)
const runningSprintCount = computed(() => tasksList.value.filter(t => normalizeStatus(t.status) === 'running_sprint').length)
const deployedCount = computed(() => tasksList.value.filter(t => normalizeStatus(t.status) === 'deployed').length)
const blockedCount = computed(() => tasksList.value.filter(t => normalizeStatus(t.status) === 'blocked').length)

// Filter & Sort deliverables
const filteredTasks = computed(() => {
  let list = [...tasksList.value]

  // Status Filter (Applied in table mode, or if filtered in kanban)
  if (statusFilter.value !== 'all') {
    list = list.filter(t => normalizeStatus(t.status) === statusFilter.value)
  }

  // Project Filter
  if (projectFilter.value !== 'all') {
    list = list.filter(t => getProjectName(t).toLowerCase() === projectFilter.value.toLowerCase())
  }

  // Priority Filter
  if (priorityFilter.value !== 'all') {
    list = list.filter(t => (t.priority || 'medium').toLowerCase() === priorityFilter.value.toLowerCase())
  }

  // Tag Filter
  if (tagFilter.value !== 'all') {
    list = list.filter(t => (t.techTags || []).includes(tagFilter.value))
  }

  // Search Filter
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q) ||
      (t.taskId ?? '').toLowerCase().includes(q) ||
      getProjectName(t).toLowerCase().includes(q) ||
      (t.techTags ?? []).some(tag => tag.toLowerCase().includes(q))
    )
  }

  // Sort
  list.sort((a, b) => {
    if (sortBy.value === 'name-asc') return a.name.localeCompare(b.name)
    if (sortBy.value === 'priority-desc') {
      const pMap: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
      return (pMap[b.priority || 'medium'] || 0) - (pMap[a.priority || 'medium'] || 0)
    }
    if (sortBy.value === 'status') {
      const sMap: Record<string, number> = { blocked: 5, in_queue: 4, idea: 3, running_sprint: 2, deployed: 1 }
      return (sMap[normalizeStatus(b.status)] || 0) - (sMap[normalizeStatus(a.status)] || 0)
    }
    if (sortBy.value === 'date-asc') {
      return (a.dueDate || a.date || a.createdAt || '').localeCompare(b.dueDate || b.date || b.createdAt || '')
    }
    // Default date-desc
    return (b.dueDate || b.date || b.createdAt || '').localeCompare(a.dueDate || a.date || a.createdAt || '')
  })

  return list
})

function resetFilters() {
  search.value = ''
  projectFilter.value = 'all'
  priorityFilter.value = 'all'
  tagFilter.value = 'all'
  statusFilter.value = 'all'
  sortBy.value = 'date-desc'
}

/**
 * Handle card click or table row click: Open Task Drawer Single Source of Truth
 */
function handleTaskClick(task: Task) {
  openTaskDrawer(task.id)
}

/**
 * Optimistic Kanban Board status transition handler
 */
async function handleUpdateStatus(taskId: string, newStatus: TaskStatus) {
  try {
    await tasksApi.updateTask(taskId, { status: newStatus })
  } catch (err) {
    console.error('[tasks] Failed to persist task status update:', err)
  }
}

/**
 * Promoted note callback from Idea Scratchpad
 */
function onScratchpadPromoted(promotedTask: Task) {
  successFeedback.value = `Promoted deliverable "${promotedTask.name}" to workspace!`
  setTimeout(() => { successFeedback.value = '' }, 4500)
}

/**
 * Cycle task status sequentially
 */
async function toggleStatus(task: Task) {
  isBusy.value = true
  const current = normalizeStatus(task.status)
  const nextMap: Record<TaskStatus, TaskStatus> = {
    idea: 'in_queue',
    in_queue: 'running_sprint',
    running_sprint: 'deployed',
    deployed: 'in_queue',
    blocked: 'in_queue'
  }
  const nextStatus = nextMap[current]

  try {
    await tasksApi.updateTask(task.id, { status: nextStatus })
  } catch (err) {
    console.error('[tasks] Failed to toggle task status:', err)
  } finally {
    isBusy.value = false
  }
}

function deleteTask(task: Task) {
  confirmTarget.value = task
  confirmOpen.value = true
}

async function onConfirmDelete() {
  if (!confirmTarget.value) return
  isBusy.value = true
  const targetId = confirmTarget.value.id
  try {
    await tasksApi.deleteTask(targetId)
    workspaceStore.removeTaskFromStore(targetId)
    confirmOpen.value = false
    confirmTarget.value = null
    successFeedback.value = 'Deliverable deleted successfully.'
    setTimeout(() => { successFeedback.value = '' }, 5000)
  } catch (err) {
    console.error('[tasks] Failed to delete task:', err)
  } finally {
    isBusy.value = false
  }
}
</script>
