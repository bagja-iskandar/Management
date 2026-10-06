<template>
  <div class="bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-6 sm:p-7 space-y-6 transition-all shadow-xl shadow-black/40">
    <!-- ======================================================== -->
    <!-- ZONA 1: HEADER                                           -->
    <!-- ======================================================== -->
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <!-- Title + Repo + Tags -->
      <div class="space-y-2.5 flex-1 min-w-0">
        <div class="flex items-center gap-3 flex-wrap">
          <NuxtLink
            :to="`/projects/${project.slug}`"
            class="font-mono text-xl sm:text-2xl font-bold text-[#F5F2EB] hover:text-[#C98A4B] transition-colors leading-tight truncate"
          >
            {{ project.title }}
          </NuxtLink>
        </div>

        <!-- Repo & Tech Stack Row -->
        <div class="flex items-center gap-3 flex-wrap">
          <!-- GitHub Repo Link -->
          <a
            v-if="project.githubRepo"
            :href="`https://github.com/${project.githubRepo}`"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-xs sm:text-sm text-[#756F68] hover:text-[#F5F2EB] transition-colors inline-flex items-center gap-1.5 hover:underline"
            :title="`Open ${project.githubRepo} on GitHub`"
          >
            <svg class="w-4 h-4 shrink-0 text-[#756F68]" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>{{ project.githubRepo }}</span>
          </a>
          <span v-else class="font-mono text-xs text-[#756F68]/60 italic">
            No repo connected
          </span>

          <span class="text-white/20 select-none">·</span>

          <!-- Tech Stack Tags -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span
              v-for="tech in project.techStack"
              :key="tech"
              class="font-mono text-[10px] bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/20 rounded-full px-2.5 py-0.5 font-medium"
            >
              {{ tech }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right Top: CI Badge + Security Badge + Deploy Status + Health Indicator -->
      <div class="flex items-center gap-2 shrink-0 flex-wrap">
        <!-- CI/CD Workflow Badge -->
        <WorkflowBadge
          v-if="project.githubRepo"
          :repo="project.githubRepo"
          compact
        />

        <!-- Security Badge -->
        <SecurityBadge
          v-if="project.githubRepo"
          :repo="project.githubRepo"
          compact
        />

        <!-- Deployment & Environments Badge -->
        <DeploymentBadge
          :repo="project.githubRepo"
          :deploy-url="project.deployUrl"
          compact
        />

        <!-- PRs & Issues Cockpit Badge -->
        <RepoActivityBadge
          v-if="project.githubRepo"
          :repo="project.githubRepo"
          :project-slug="project.slug"
          compact
        />

        <!-- Package & Container Registry Badge -->
        <PackageBadge
          v-if="project.githubRepo"
          :repo="project.githubRepo"
          compact
        />

        <!-- Health Indicator Badge -->
        <HealthBadge
          :last-commit-date="null"
          :blockers-count="blockers.length"
          :completion-rate="completionRate"
          :has-repo="!!project.githubRepo"
        />
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- ZONA 2: PROGRESS + BLOCKERS                              -->
    <!-- ======================================================== -->
    <div class="space-y-2.5">
      <!-- Progress Bar (Thin horizontal ochre fill) -->
      <div class="w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
        <div
          class="bg-[#C98A4B] h-full rounded-full transition-all duration-500"
          :style="{ width: `${completionRate}%` }"
        ></div>
      </div>

      <!-- Task Metrics Breakdown -->
      <div class="flex items-center justify-between text-xs font-mono text-[#756F68] flex-wrap gap-2">
        <span class="font-medium text-[#F5F2EB]">
          {{ deployedCount }}/{{ totalCount }} tasks
        </span>
        <span>
          {{ queueCount }} queue · {{ runningCount }} running · {{ deployedCount }} deployed
        </span>
      </div>

      <!-- Blockers Rows (if any) -->
      <div v-if="blockers.length > 0" class="space-y-1.5 pt-1">
        <div
          v-for="blocker in blockers"
          :key="blocker.id"
          class="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs font-mono text-red-400 flex items-start gap-2"
        >
          <span class="shrink-0 text-sm">⛔</span>
          <div class="flex-1 min-w-0">
            <NuxtLink
              :to="`/projects/${project.slug}`"
              class="font-bold underline hover:text-red-300 transition-colors"
            >
              #{{ displayTaskId(blocker) }} {{ blocker.name }}
            </NuxtLink>
            <span class="text-red-400/80 ml-1">
              — {{ blocker.description || 'Blocked task dependency' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- ZONA 3: READY TO PICK UP                                 -->
    <!-- ======================================================== -->
    <TaskQueue
      :tasks="tasks"
      :project-slug="project.slug"
      @task-click="$emit('task-click', $event)"
    />

    <!-- ======================================================== -->
    <!-- ZONA 4: RECENT COMMITS                                   -->
    <!-- ======================================================== -->
    <CommitList
      :repo="project.githubRepo"
      :limit="4"
    />

    <!-- Card Bottom Footer Action -->
    <div class="pt-2 flex items-center justify-between border-t border-white/[0.04]">
      <div class="font-mono text-[11px] text-[#756F68]">
        Slug: <span class="text-[#F5F2EB]">{{ project.slug }}</span>
      </div>

      <NuxtLink
        :to="`/projects/${project.slug}`"
        class="inline-flex items-center gap-1.5 font-mono text-xs text-[#C98A4B] hover:text-[#F5F2EB] transition-colors group"
      >
        <span>Open Project</span>
        <span class="group-hover:translate-x-1 transition-transform">→</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HealthBadge from './HealthBadge.vue'
import WorkflowBadge from './WorkflowBadge.vue'
import SecurityBadge from './SecurityBadge.vue'
import DeploymentBadge from './DeploymentBadge.vue'
import RepoActivityBadge from './RepoActivityBadge.vue'
import PackageBadge from './PackageBadge.vue'
import TaskQueue from './TaskQueue.vue'
import CommitList from './CommitList.vue'
import type { Project, Task } from '../types'

const props = withDefaults(
  defineProps<{
    project: Project
    tasks?: Task[]
  }>(),
  {
    tasks: () => []
  }
)

defineEmits<{
  (e: 'task-click', task: Task): void
}>()

const totalCount = computed(() => props.tasks.length)

const queueCount = computed(() => {
  return props.tasks.filter((t) => t.status === 'in_queue').length
})

const runningCount = computed(() => {
  return props.tasks.filter((t) => t.status === 'running_sprint').length
})

const deployedCount = computed(() => {
  return props.tasks.filter((t) => t.status === 'deployed').length
})

const blockers = computed(() => {
  return props.tasks.filter((t) => t.status === 'blocked')
})

const completionRate = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.min(100, Math.round((deployedCount.value / totalCount.value) * 100))
})

function displayTaskId(task: Task) {
  if (task.taskId) {
    return task.taskId.startsWith('#') ? task.taskId.slice(1) : task.taskId
  }
  return task.id.slice(0, 7).toUpperCase()
}
</script>
