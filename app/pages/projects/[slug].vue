<template>
  <div :class="['relative', (activeTab === 'dashboard' || activeTab === 'deliverables' || activeTab === 'kanban' || activeTab === 'matrix') ? 'space-y-3 sm:space-y-3.5 xl:h-full xl:flex xl:flex-col xl:min-h-0 xl:pb-0' : 'space-y-6 pb-12']">
    <!-- ================================================================= -->
    <!-- STATE 1: LOADING SKELETON BENTO LOADER                            -->
    <!-- ================================================================= -->
    <div
      v-if="detailState === 'LOADING'"
      class="space-y-6 animate-pulse select-none"
      role="status"
      aria-label="Loading project detail"
    >
      <!-- Skeleton Hero -->
      <div class="obs-card p-6 rounded-2xl bg-[#111318] border border-white/[0.07] space-y-4">
        <div class="h-6 bg-white/[0.08] rounded w-1/3"></div>
        <div class="h-4 bg-white/[0.04] rounded w-2/3"></div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div class="h-14 bg-white/[0.04] rounded-xl"></div>
          <div class="h-14 bg-white/[0.04] rounded-xl"></div>
          <div class="h-14 bg-white/[0.04] rounded-xl"></div>
          <div class="h-14 bg-white/[0.04] rounded-xl"></div>
        </div>
      </div>

      <!-- Skeleton Bento Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
        <div class="h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 2: CONNECTION ERROR CARD                                    -->
    <!-- ================================================================= -->
    <div
      v-else-if="detailState === 'ERROR'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-rose-500/30 p-8 space-y-4 max-w-lg mx-auto my-12"
      role="alert"
    >
      <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
        <NexuraIcon name="AlertTriangle" size="lg" />
      </div>
      <h2 class="font-mono text-lg font-semibold text-[#F3F4F6]">Connection Failed</h2>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">
        Failed to synchronize project telemetry from the server.
      </p>
      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#F3F4F6] border border-white/[0.08] transition-colors cursor-pointer"
          @click="retryFetchProjects"
        >
          <NexuraIcon name="RefreshCw" size="xs" />
          <span>Retry</span>
        </button>
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white font-semibold transition-colors cursor-pointer"
        >
          <NexuraIcon name="ArrowLeft" size="xs" />
          <span>Back to Projects Hub</span>
        </NuxtLink>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 3: PROJECT NOT FOUND 404 BENTO CARD                         -->
    <!-- ================================================================= -->
    <div
      v-else-if="detailState === 'NOT_FOUND'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-white/[0.08] p-8 space-y-4 max-w-lg mx-auto my-12"
    >
      <div class="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8A8F9E]">
        <NexuraIcon name="FolderX" size="lg" />
      </div>
      <h2 class="font-mono text-lg font-semibold text-[#F3F4F6]">Project Not Found</h2>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">
        No project with slug <span class="font-mono text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-indigo-300">{{ slug }}</span> exists in the current workspace.
      </p>
      <div class="pt-2">
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white font-semibold transition-colors cursor-pointer"
        >
          <NexuraIcon name="ArrowLeft" size="xs" />
          <span>Back to Projects Hub</span>
        </NuxtLink>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 4: READY STATE (FULL COCKPIT)                               -->
    <!-- ================================================================= -->
    <div v-else-if="detailState === 'READY' && currentProject" :class="[(activeTab === 'dashboard' || activeTab === 'deliverables' || activeTab === 'kanban' || activeTab === 'matrix') ? 'space-y-3 sm:space-y-3.5 xl:h-full xl:flex xl:flex-col xl:min-h-0' : 'space-y-6']">
      <!-- Stale Error Warning Banner -->
      <div
        v-if="isStaleProjectsError"
        class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono flex items-center justify-between shrink-0"
        role="status"
      >
        <div class="flex items-center gap-2">
          <NexuraIcon name="AlertTriangle" size="xs" class="text-amber-400" />
          <span>Warning: Displaying cached project metadata. Background synchronization failed.</span>
        </div>
        <button
          type="button"
          class="text-xs underline hover:no-underline font-medium cursor-pointer"
          @click="retryFetchProjects"
        >
          Retry Sync
        </button>
      </div>

      <!-- Mobile / Tablet Tab Strip (< lg only) -->
      <div class="lg:hidden sticky top-0 z-20 -mx-3 sm:-mx-5 -mt-3 sm:-mt-5 lg:mt-0 px-3 sm:px-5 py-2 bg-[#0B0C10]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none">
        <button
          v-for="tab in projectTabs"
          :key="tab.id"
          type="button"
          @click="onSelectTab(tab.id)"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0 cursor-pointer"
          :class="activeTab === tab.id
            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_8px_rgba(99,102,241,0.2)] font-semibold'
            : 'bg-white/[0.03] text-[#8A8F9E] hover:text-[#F3F4F6] border-white/[0.06] hover:bg-white/[0.06]'"
        >
          <NexuraIcon :name="tab.icon" size="xs" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.count !== undefined && tab.count > 0" class="font-mono tabular-nums text-[10px] px-1 rounded bg-white/[0.06]">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Project Hero (Dashboard Tab Only) -->
      <ProjectHeroHeader
        v-if="activeTab === 'dashboard'"
        :project="currentProject"
        :completed-count="completedCount"
        :total-tasks-count="totalTasksCount"
        :derived-percentage="derivedPercentage"
        class="shrink-0"
      />

      <!-- ================================================================= -->
      <!-- VIEW 1: PROJECT DASHBOARD (DEFAULT)                               -->
      <!-- ================================================================= -->
      <div v-if="activeTab === 'dashboard'" class="space-y-3 sm:space-y-3.5 xl:flex-1 xl:flex xl:flex-col xl:min-h-0">
        <!-- 4-Pillar DevOps Bento Cockpit Matrix -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5 shrink-0">
          <ProjectCicdCard
            :repo="currentProject.githubRepo || ''"
            :workflows="projectWorkflows || []"
            :pending="workflowsPending"
            :is-rerunning="rerunningRunId !== null"
            class="h-full"
            @open-log="openTabRunLogModal"
            @rerun="onRerunWorkflowById"
            @refresh="refreshWorkflows"
          />

          <ProjectLiveDeploymentCard
            :repo="currentProject.githubRepo || ''"
            :deploy-url="currentProject.deployUrl || ''"
            :deployments="projectDeployments"
            :pending="deploymentsPending"
            class="h-full"
            @open-modal="isDeploymentModalOpen = true"
            @refresh="refreshDeployments"
          />

          <ProjectSecurityCard
            :repo="currentProject.githubRepo || ''"
            :security="projectSecurity"
            :pending="securityPending"
            class="h-full"
            @open-modal="isSecurityModalOpen = true"
            @refresh="refreshSecurity"
          />

          <ProjectPackageCard
            :repo="currentProject.githubRepo || ''"
            :packages="projectPackages"
            :pending="packagesPending"
            class="h-full"
            @open-modal="isPackageModalOpen = true"
            @refresh="refreshPackages"
          />
        </div>

        <!-- Bottom Bento Row: GitHub Pulse & Project Focus Deliverables -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5 xl:flex-1 xl:min-h-0">
          <ProjectCommitsPreview
            :commits="commits || []"
            :commits-pending="commitsPending"
            :branches="branches || []"
            :branches-pending="branchesPending"
            :selected-branch="selectedBranch"
            class="h-full"
            @select-branch="(b: string) => selectedBranch = b"
            @view-all-commits="onSelectTab('github')"
          />

          <ProjectPriorityDeliverables
            :priority-tasks="priorityTasksList"
            class="h-full"
            @open-matrix="onSetDeliverableViewMode('table')"
            @task-click="onTaskClick"
          />
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- VIEW 2: PROJECT DELIVERABLES WORKSPACE (UNIFIED KANBAN & TABLE)   -->
      <!-- ================================================================= -->
      <section
        v-else-if="activeTab === 'deliverables' || activeTab === 'kanban' || activeTab === 'matrix'"
        aria-label="Project Deliverables Workspace"
        class="space-y-4 xl:flex-1 xl:flex xl:flex-col xl:min-h-0"
      >
        <!-- Render Kanban Board -->
        <KanbanBoard
          v-if="deliverableViewMode === 'kanban'"
          :tasks="projectTasks"
          class="xl:flex-1 xl:flex xl:flex-col xl:min-h-0"
          @update-status="onUpdateTaskStatus"
          @add-task="onAddTaskToColumn"
          @task-click="onTaskClick"
        />

        <!-- Render Deliverables Table / Matrix -->
        <ProjectTaskMatrix
          v-else
          :tasks="projectTasks"
          @task-click="onTaskClick"
          @toggle-status="toggleMatrixTaskStatus"
          @delete-task="onTaskClick"
        />
      </section>

      <!-- ================================================================= -->
      <!-- VIEW 4: GITHUB INTEGRATION DEEP COCKPIT                           -->
      <!-- ================================================================= -->
      <section v-else-if="activeTab === 'github'" aria-label="GitHub Integration" class="obs-card p-6 rounded-2xl bg-[#111318] border border-white/[0.07] space-y-4 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div class="flex items-center gap-2.5">
            <NexuraIcon name="GitBranch" size="md" class="text-indigo-400" />
            <div>
              <h2 class="font-mono text-sm font-semibold text-[#F3F4F6]">GitHub Repository Integration</h2>
              <p class="text-xs text-[#8A8F9E]">
                Live branch telemetry and latest commit log from {{ currentProject.githubRepo || 'linked repository' }}.
              </p>
            </div>
          </div>

          <a
            v-if="currentProject.githubRepo"
            :href="`https://github.com/${currentProject.githubRepo}`"
            target="_blank"
            rel="noopener noreferrer"
            class="group font-mono text-xs text-indigo-400 hover:underline flex items-center gap-1.5"
          >
            <span>Open on GitHub</span>
            <NexuraIcon name="ArrowUpRight" size="xs" class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        <!-- Pull Requests & Issues Feed -->
        <ProjectPullsIssuesFeed
          :project-pulls-issues="projectPullsIssues || null"
          :pulls-issues-pending="pullsIssuesPending"
          :in-panel-importing-id="inPanelImportingId"
          :in-panel-imported-issues="inPanelImportedIssues"
          :open-prs-count="tabOpenPrsCount"
          :open-issues-count="tabOpenIssuesCount"
          :merged-prs-count="tabMergedPrsCount"
          :closed-issues-count="tabClosedIssuesCount"
          @open-modal="isPullsIssuesModalOpen = true"
          @refresh="refreshPullsIssues"
          @import-issue="importIssueFromFeed"
        />

        <!-- GitHub Actions Telemetry -->
        <ProjectWorkflowRunsFeed
          :workflows="projectWorkflows || []"
          :workflows-pending="workflowsPending"
          :rerunning-run-id="rerunningRunId"
          @refresh="refreshWorkflows"
          @open-log="openTabRunLogModal"
          @rerun="handleTabWorkflowRerun"
        />

        <!-- Deployments & Environments Cockpit -->
        <ProjectDeploymentFeed
          :deployments="projectDeployments || null"
          :pending="deploymentsPending"
          :deploy-url="currentProject.deployUrl || ''"
          :target-environment-name="targetEnvironmentName"
          :live-url="activeTabLiveUrl"
          :deployment-status-dot-class="tabDeploymentStatusDotClass"
          :commit-check-badge-class="tabCommitCheckBadgeClass"
          :passed-checks-count="tabPassedChecksCount"
          :total-checks-count="tabTotalChecksCount"
          :commit-check-summary-text="tabCommitCheckSummaryText"
          @open-modal="isDeploymentModalOpen = true"
          @refresh="refreshDeployments"
        />

        <!-- Security & Vulnerability Audit -->
        <ProjectSecurityFeed
          :security="projectSecurity || null"
          :pending="securityPending"
          :repo="currentProject.githubRepo || ''"
          :status-dot-class="tabSecurityStatusDotClass"
          :scanner-secret-class="scannerSecretClass"
          :scanner-secret-status-text="scannerSecretStatusText"
          @open-modal="isSecurityModalOpen = true"
          @refresh="refreshSecurity"
        />

        <!-- Package & Container Registry Feed -->
        <ProjectPackageFeed
          :packages="projectPackages || null"
          :pending="packagesPending"
          :status-dot-class="tabPackageStatusDotClass"
          :docker-snippet="tabDockerSnippet"
          :copied-snippet="tabCopiedSnippet"
          @open-modal="isPackageModalOpen = true"
          @refresh="refreshPackages"
          @copy-snippet="copyTabSnippet"
        />

        <!-- Commits Stream & Branches List -->
        <ProjectGitActivityFeed
          :commits="commits || []"
          :commits-pending="commitsPending"
          :branches="branches || []"
          :branches-pending="branchesPending"
          :selected-branch="selectedBranch"
          @select-branch="(b: string) => selectedBranch = b"
        />
      </section>

      <!-- ================================================================= -->
      <!-- VIEW 5: VERCEL CLOUD TELEMETRY                                    -->
      <!-- ================================================================= -->
      <section v-else-if="activeTab === 'vercel'" aria-label="Vercel Cloud Telemetry">
        <ProjectVercelTab
          :project="currentProject"
          :deployments="projectDeployments"
        />
      </section>

      <!-- ================================================================= -->
      <!-- VIEW 6: PROJECT NOTES & IDEAS SCRATCHPAD                          -->
      <!-- ================================================================= -->
      <section v-else-if="activeTab === 'notes'" aria-label="Project Notes and Scratchpad">
        <IdeaScratchpadPanel
          :key="currentProject.slug"
          :project-slug="currentProject.slug"
          :is-drawer="false"
        />
      </section>

      <!-- ================================================================= -->
      <!-- VIEW 7: PROJECT SETTINGS & DANGER ZONE                            -->
      <!-- ================================================================= -->
      <section v-else-if="activeTab === 'settings'" aria-label="Project Settings" class="space-y-6">
        <!-- Card 1: Project Metadata & Configuration -->
        <div class="obs-card rounded-2xl p-6 bg-[#111318] border border-white/[0.07] space-y-5">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <NexuraIcon name="Settings" size="sm" />
              </div>
              <div>
                <h2 class="font-mono text-sm font-semibold text-[#F3F4F6]">Project Configuration</h2>
                <p class="text-xs text-[#8A8F9E]">Update repository bindings, project title, and deployment URLs</p>
              </div>
            </div>
            <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[#8A8F9E]">
              SLUG: {{ currentProject.slug }}
            </span>
          </div>

          <!-- Metadata Form Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div class="space-y-1.5">
              <label class="text-[#8A8F9E]">Project Title</label>
              <input
                v-model="editProjectForm.title"
                type="text"
                placeholder="Project title..."
                class="w-full bg-[#07080A] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-[#F3F4F6] outline-none transition"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-[#8A8F9E]">GitHub Repository (owner/repo)</label>
              <input
                v-model="editProjectForm.githubRepo"
                type="text"
                placeholder="e.g. bagja-iskandar/Management"
                class="w-full bg-[#07080A] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-[#F3F4F6] outline-none transition"
              />
            </div>

            <div class="space-y-1.5 md:col-span-2">
              <label class="text-[#8A8F9E]">Project Description</label>
              <textarea
                v-model="editProjectForm.description"
                rows="3"
                placeholder="Short description of this project..."
                class="w-full bg-[#07080A] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/50 rounded-xl p-3 text-xs text-[#F3F4F6] outline-none transition resize-none"
              ></textarea>
            </div>

            <div class="space-y-1.5 md:col-span-2">
              <label class="text-[#8A8F9E]">Live Production URL</label>
              <input
                v-model="editProjectForm.deployUrl"
                type="url"
                placeholder="https://..."
                class="w-full bg-[#07080A] border border-white/[0.08] hover:border-white/[0.15] focus:border-indigo-500/50 rounded-xl px-3.5 py-2 text-xs text-[#F3F4F6] outline-none transition"
              />
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <span v-if="projectSaveFeedback" class="font-mono text-xs text-emerald-400 flex items-center gap-1.5">
              <NexuraIcon name="CheckCircle2" size="xs" />
              <span>{{ projectSaveFeedback }}</span>
            </span>
            <span v-else></span>

            <button
              type="button"
              :disabled="isSavingProject"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-mono font-semibold text-white transition cursor-pointer shadow-sm"
              @click="onSaveProjectSettings"
            >
              <NexuraIcon v-if="!isSavingProject" name="Save" size="xs" />
              <NexuraIcon v-else name="Loader2" size="xs" class="animate-spin" />
              <span>{{ isSavingProject ? 'Saving...' : 'Save Changes' }}</span>
            </button>
          </div>
        </div>

        <!-- Card 2: Danger Zone -->
        <div class="obs-card rounded-2xl p-6 bg-[#111318] border border-rose-500/30 space-y-4 shadow-sm">
          <div class="flex items-center justify-between border-b border-rose-500/20 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
                <NexuraIcon name="AlertTriangle" size="sm" />
              </div>
              <div>
                <h2 class="font-mono text-sm font-semibold text-rose-400">Danger Zone</h2>
                <p class="text-xs text-[#8A8F9E]">Irreversible project deletion and telemetry purge</p>
              </div>
            </div>
            <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
              DESTRUCTIVE
            </span>
          </div>

          <p class="text-xs text-[#8A8F9E] leading-relaxed">
            Deleting this project will permanently decouple all associated deliverables, purge cached GitHub & deployment activity, and erase project workspace metadata. This action requires typing the exact project slug to confirm.
          </p>

          <div class="pt-2 flex justify-end">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold transition cursor-pointer"
              @click="openDeleteProjectModal"
            >
              <NexuraIcon name="Trash2" size="xs" />
              <span>Delete This Project</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Double-Confirmation Delete Project Modal -->
      <div
        v-if="confirmDeleteProject"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-modal-title"
      >
        <div class="w-full max-w-md bg-[#111318] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <NexuraIcon name="AlertTriangle" size="md" />
            </div>
            <div>
              <h3 id="delete-project-modal-title" class="font-mono text-base font-semibold text-[#F3F4F6]">
                Delete Project Permanently?
              </h3>
              <p class="font-sans text-xs text-[#8A8F9E] mt-1">
                This action cannot be undone. All associated task milestone links will be permanently unlinked.
              </p>
            </div>
          </div>

          <div v-if="deleteError" class="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-mono" role="alert">
            {{ deleteError }}
          </div>

          <div class="space-y-2 pt-1">
            <label for="confirm-slug-input" class="block font-mono text-xs text-[#8A8F9E]">
              Type <span class="font-bold text-rose-400 font-mono select-all">{{ currentProject.slug }}</span> to confirm:
            </label>
            <input
              id="confirm-slug-input"
              v-model="confirmSlugInput"
              type="text"
              autofocus
              placeholder="Enter project slug"
              class="w-full bg-[#07080A] border border-white/[0.08] focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 rounded-xl px-3.5 py-2 text-sm text-[#F3F4F6] font-mono placeholder-[#565B68] focus:outline-none"
              :disabled="isDeleting"
              @keydown.enter="onProjectDeleted"
            />
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#8A8F9E] hover:text-[#F3F4F6] transition cursor-pointer"
              :disabled="isDeleting"
              @click="closeDeleteProjectModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/40 disabled:text-rose-400/40 disabled:cursor-not-allowed text-white text-xs font-mono font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm"
              :disabled="!isSlugMatched || isDeleting"
              @click="onProjectDeleted"
            >
              <NexuraIcon v-if="isDeleting" name="Loader2" size="xs" class="animate-spin" />
              <span>{{ isDeleting ? 'Deleting...' : 'Delete Project Permanently' }}</span>
            </button>
          </div>
        </div>
      </div>

      <WorkflowLogModal
        :is-open="isLogModalOpen"
        :repo="currentProject.githubRepo || ''"
        :run="selectedRunForModal"
        @close="isLogModalOpen = false"
      />

      <SecurityAlertModal
        :is-open="isSecurityModalOpen"
        :repo="currentProject.githubRepo || ''"
        :summary="projectSecurity || null"
        @close="isSecurityModalOpen = false"
      />

      <DeploymentModal
        :is-open="isDeploymentModalOpen"
        :repo="currentProject.githubRepo || ''"
        :deploy-url="currentProject.deployUrl"
        :summary="projectDeployments || null"
        @close="isDeploymentModalOpen = false"
      />

      <PullRequestsIssuesModal
        :is-open="isPullsIssuesModalOpen"
        :repo="targetRepo"
        :project-slug="currentProject.slug"
        :summary="projectPullsIssues || null"
        @close="isPullsIssuesModalOpen = false"
        @issue-created="onCockpitIssueCreated"
        @task-imported="onCockpitTaskImported"
      />

      <PackageModal
        :is-open="isPackageModalOpen"
        :repo="targetRepo"
        :summary="projectPackages"
        @close="isPackageModalOpen = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  Project,
  Task,
  TaskStatus,
  GitHubWorkflowRun
} from '~/types'
import type { ProjectTabId } from '~/composables/useProjectNav'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useProjects } from '~/composables/useProjects'
import { useTasks } from '~/composables/useTasks'
import { useQuickTask } from '~/composables/useQuickTask'
import { useTaskDrawer } from '~/composables/useTaskDrawer'
import { useHeaderActions, type HeaderAction } from '~/composables/useHeaderActions'
import {
  useGitHubCommits,
  useGitHubBranches,
  useGitHubWorkflows,
  useGitHubSecurity,
  useGitHubDeployments,
  useGitHubPullsAndIssues,
  useGitHubPackages,
  rerunWorkflow
} from '~/composables/useGitHub'
import { useProjectCockpit, resolveTab } from '~/composables/useProjectCockpit'

type DetailState = 'LOADING' | 'ERROR' | 'NOT_FOUND' | 'READY'

const route = useRoute()
const router = useRouter()
const slug = computed(() => (route.params.slug as string) || 'management')

const projectNav = useProjectNav()
const { activeTab, deliverableViewMode } = projectNav

// SSOT Workspace Store
const workspaceStore = useWorkspaceStore()
const { projects: storeProjects, tasks: storeTasks, hydrationStatus } = workspaceStore
const projectsApi = useProjects()
const tasksApi = useTasks()

onMounted(async () => {
  if (!workspaceStore.isInitialized.value) {
    await workspaceStore.initializeWorkspace()
  }
})

// Current Project derived from SSOT store (Zero fake fallback fabrication)
const currentProject = computed<Project | null>(() => {
  const list = storeProjects.value || []
  const currentSlug = slug.value.toLowerCase()
  return list.find(p => p.slug.toLowerCase() === currentSlug) || null
})

// GitHub integration (Safely computed from targetRepo)
const targetRepo = computed(() => currentProject.value?.githubRepo || '')
const selectedBranch = ref<string | undefined>(undefined)
const { commits, pending: commitsPending } = useGitHubCommits(targetRepo, 50, selectedBranch)
const { branches, pending: branchesPending } = useGitHubBranches(targetRepo)

watch(targetRepo, () => {
  selectedBranch.value = undefined
})
const { workflows: projectWorkflows, pending: workflowsPending, refresh: refreshWorkflows } = useGitHubWorkflows(targetRepo, 5)
const { data: projectSecurity, pending: securityPending, refresh: refreshSecurity } = useGitHubSecurity(targetRepo)
const { deployments: projectDeployments, pending: deploymentsPending, refresh: refreshDeployments } = useGitHubDeployments(targetRepo, 5)
const { activity: projectPullsIssues, pending: pullsIssuesPending, refresh: refreshPullsIssues } = useGitHubPullsAndIssues(targetRepo, 10)
const { packages: projectPackages, pending: packagesPending, refresh: refreshPackages } = useGitHubPackages(targetRepo)

// Modular Cockpit Composable
const cockpit = useProjectCockpit({
  currentProject,
  projectPackages,
  projectPullsIssues,
  projectDeployments,
  projectSecurity,
  refreshPullsIssues
})

const {
  syncTabFromRoute,
  onSelectTab,
  onSetDeliverableViewMode,
  isLogModalOpen,
  isSecurityModalOpen,
  isDeploymentModalOpen,
  isPullsIssuesModalOpen,
  isPackageModalOpen,
  selectedRunForModal,
  openTabRunLogModal,
  onCockpitTaskImported,
  onCockpitIssueCreated,
  confirmDeleteProject,
  confirmSlugInput,
  isDeleting,
  deleteError,
  isSlugMatched,
  openDeleteProjectModal,
  closeDeleteProjectModal,
  onProjectDeleted,
  editProjectForm,
  isSavingProject,
  projectSaveFeedback,
  tabPackageStatusDotClass,
  tabDockerSnippet,
  tabCopiedSnippet,
  copyTabSnippet,
  tabOpenPrsCount,
  tabOpenIssuesCount,
  tabMergedPrsCount,
  tabClosedIssuesCount,
  inPanelImportingId,
  inPanelImportedIssues,
  importIssueFromFeed,
  activeTabLiveUrl,
  targetEnvironmentName,
  tabDeploymentStatusDotClass,
  tabTotalChecksCount,
  tabPassedChecksCount,
  tabCommitCheckBadgeClass,
  tabCommitCheckSummaryText,
  tabSecurityStatusDotClass,
  scannerSecretClass,
  scannerSecretStatusText
} = cockpit

onMounted(() => {
  syncTabFromRoute()
})

watch(() => route.params.slug, () => {
  syncTabFromRoute()
})

watch(() => route.query.tab, (newVal) => {
  if (newVal) {
    projectNav.setActiveTab(resolveTab(newVal, projectNav))
  }
})

watch(() => route.query.view, (newVal) => {
  if (newVal === 'kanban' || newVal === 'table') {
    projectNav.setViewMode(newVal as 'kanban' | 'table')
  }
})

// Project Settings update mutation
async function onSaveProjectSettings() {
  if (!currentProject.value || isSavingProject.value) return
  isSavingProject.value = true
  projectSaveFeedback.value = ''
  try {
    await projectsApi.updateProject(currentProject.value.slug, {
      title: editProjectForm.title,
      description: editProjectForm.description,
      githubRepo: editProjectForm.githubRepo,
      deployUrl: editProjectForm.deployUrl
    })
    projectSaveFeedback.value = 'Project configuration saved successfully!'
    setTimeout(() => {
      projectSaveFeedback.value = ''
    }, 4000)
  } catch (err: any) {
    console.error('Failed to update project settings:', err)
    projectSaveFeedback.value = `Failed: ${err?.message || 'Error saving settings'}`
  } finally {
    isSavingProject.value = false
  }
}

// Contextual Action Bar integration
const { setActions, clearActions } = useHeaderActions()
const { openAddTask, openAddIdea } = useQuickTask()
const { openTaskDrawer } = useTaskDrawer()

onMounted(() => {
  watchEffect(() => {
    const repo = currentProject.value?.githubRepo
    const actions: HeaderAction[] = []

    if (activeTab.value === 'deliverables' || activeTab.value === 'kanban' || activeTab.value === 'matrix') {
      actions.push({
        type: 'segmented',
        id: 'deliverables-view',
        modelValue: deliverableViewMode.value,
        options: [
          { value: 'kanban', label: 'Board View', icon: 'Columns3' },
          { value: 'table', label: 'Table View', icon: 'Table' }
        ],
        onChange: (val: any) => onSetDeliverableViewMode(val)
      } as any)
    }

    actions.push({
      id: 'repo-link',
      label: 'GitHub Repo',
      icon: 'ExternalLink',
      variant: 'secondary',
      disabled: !repo,
      handler: () => {
        if (repo) {
          window.open(`https://github.com/${repo}`, '_blank')
        }
      }
    })

    actions.push({
      id: 'add-deliverable',
      label: 'Add Deliverable',
      icon: 'Plus',
      variant: 'primary',
      handler: () => openAddTask()
    })

    setActions(actions)
  })
})

onBeforeUnmount(() => {
  clearActions()
})

// 4-State Machine for Deterministic Lifecycle
const detailState = computed<DetailState>(() => {
  const projHydration = hydrationStatus.value.projects
  if (
    !workspaceStore.isInitialized.value &&
    (workspaceStore.isLoading.value || projHydration === 'loading' || projHydration === 'idle')
  ) {
    return 'LOADING'
  }
  if (projHydration === 'loading' && !currentProject.value) {
    return 'LOADING'
  }
  if (projHydration === 'error' && !currentProject.value) {
    return 'ERROR'
  }
  if (!currentProject.value) {
    return 'NOT_FOUND'
  }
  return 'READY'
})

const isStaleProjectsError = computed(() => {
  return hydrationStatus.value.projects === 'error' && !!currentProject.value
})

async function retryFetchProjects() {
  try {
    await workspaceStore.fetchWorkspaceProjects()
  } catch (err) {
    console.error('[projects] Failed to retry fetch projects:', err)
  }
}

// Rerun Workflow logic
const rerunningRunId = ref<number | null>(null)

function onRerunWorkflowById(runId: number) {
  const run = (projectWorkflows.value || []).find(r => r.id === runId)
  if (run) {
    handleTabWorkflowRerun(run)
  }
}

async function handleTabWorkflowRerun(run: GitHubWorkflowRun) {
  if (!currentProject.value?.githubRepo || rerunningRunId.value === run.id) return
  rerunningRunId.value = run.id
  try {
    await rerunWorkflow(currentProject.value.githubRepo, run.id)
    await refreshWorkflows()
  } catch (err) {
    console.error('Failed to rerun workflow:', err)
  } finally {
    rerunningRunId.value = null
  }
}

// Tasks filtered specifically for this project from SSOT storeTasks
const projectTasks = computed<Task[]>(() => {
  if (!currentProject.value) return []
  const currentSlug = currentProject.value.slug.toLowerCase()
  return (storeTasks.value || []).filter(t => (t.projectSlug || '').toLowerCase() === currentSlug)
})

const sortByPriority = (a: Task, b: Task) => {
  const pWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
  const diff = (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0)
  if (diff !== 0) return diff
  return (a.taskId || a.id).localeCompare(b.taskId || b.id)
}

const priorityTasksList = computed(() => {
  return projectTasks.value
    .filter(t => t.priority === 'critical' || t.priority === 'high')
    .sort(sortByPriority)
})

const completedCount = computed(() => projectTasks.value.filter(t => t.status === 'deployed').length)
const totalTasksCount = computed(() => projectTasks.value.length)
const commitsCount = computed(() => (commits.value || []).length)
const derivedPercentage = computed(() => {
  if (!totalTasksCount.value) return 0
  return Math.round((completedCount.value / totalTasksCount.value) * 100)
})

interface ProjectTabItem {
  id: ProjectTabId
  label: string
  icon: string
  count?: number
}

const projectTabs = computed<ProjectTabItem[]>(() => [
  { id: 'dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'deliverables', label: 'Deliverables', icon: 'CheckSquare', count: totalTasksCount.value },
  { id: 'github', label: 'GitHub', icon: 'GitBranch', count: commitsCount.value },
  { id: 'vercel', label: 'Vercel', icon: 'Globe' },
  { id: 'notes', label: 'Notes', icon: 'FileText' },
  { id: 'settings', label: 'Settings', icon: 'Settings' }
])

watchEffect(() => {
  projectNav.setCounts({
    tasks: projectTasks.value.length,
    matrix: projectTasks.value.length,
    commits: commitsCount.value,
    hasGithub: !!currentProject.value?.githubRepo
  })
})

async function onUpdateTaskStatus(taskId: string, newStatus: TaskStatus) {
  try {
    await tasksApi.updateTask(taskId, { status: newStatus })
  } catch (err) {
    console.error('Failed to update task status:', err)
  }
}

function onTaskClick(task: Task) {
  openTaskDrawer(task.id)
}

function onAddTaskToColumn(status: TaskStatus = 'in_queue') {
  const slug = currentProject.value?.slug || null
  if (status === 'idea') {
    openAddIdea(slug)
  } else {
    openAddTask(slug, status)
  }
}

async function toggleMatrixTaskStatus(task: Task) {
  const next: Record<TaskStatus, TaskStatus> = {
    idea: 'in_queue',
    in_queue: 'running_sprint',
    running_sprint: 'deployed',
    deployed: 'in_queue',
    blocked: 'in_queue'
  }
  const newStatus = next[task.status] || 'in_queue'
  await onUpdateTaskStatus(task.id, newStatus)
}
</script>
