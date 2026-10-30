<template>
  <div class="space-y-6 pb-12">
    <!-- ================================================================= -->
    <!-- STATE 1: LOADING SKELETON BENTO LOADER                            -->
    <!-- ================================================================= -->
    <div
      v-if="roadmapDataState === 'LOADING'"
      class="space-y-6 animate-pulse select-none"
      role="status"
      aria-label="Loading architecture roadmap"
    >
      <!-- Skeleton Header -->
      <div class="obs-card p-6 rounded-2xl bg-[#111318] border border-white/[0.07] space-y-4">
        <div class="h-6 bg-white/[0.08] rounded w-1/4"></div>
        <div class="h-4 bg-white/[0.04] rounded w-1/2"></div>
      </div>

      <!-- Skeleton Board Columns -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
        <div v-for="i in 5" :key="i" class="h-80 bg-white/[0.03] border border-white/[0.06] rounded-2xl"></div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 2: CONNECTION ERROR CARD                                    -->
    <!-- ================================================================= -->
    <div
      v-else-if="roadmapDataState === 'ERROR'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-rose-500/30 p-8 space-y-4 max-w-lg mx-auto my-12"
      role="alert"
    >
      <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
        <NexuraIcon name="AlertTriangle" size="lg" />
      </div>
      <h2 class="font-mono text-lg font-semibold text-[#F3F4F6]">Connection Failed</h2>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto">
        Failed to synchronize roadmap projects telemetry from the server.
      </p>
      <div class="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-[#F3F4F6] border border-white/[0.08] transition-colors cursor-pointer"
          @click="workspaceStore.initializeWorkspace(true)"
        >
          <NexuraIcon name="RefreshCw" size="xs" />
          <span>Retry</span>
        </button>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 3: GLOBAL EMPTY STATE CARD                                  -->
    <!-- ================================================================= -->
    <div
      v-else-if="roadmapDataState === 'SUCCESS_EMPTY'"
      class="py-16 text-center rounded-2xl bg-[#111318] border border-white/[0.08] p-8 space-y-4 max-w-lg mx-auto my-12"
    >
      <div class="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
        <NexuraIcon name="Layers" size="lg" />
      </div>
      <h2 class="font-mono text-lg font-semibold text-[#F3F4F6]">No Projects Registered</h2>
      <p class="font-sans text-xs text-[#8A8F9E] max-w-sm mx-auto leading-relaxed">
        No architecture projects currently exist in this workspace. Create your first project in the Projects Hub to begin tracking roadmap milestones.
      </p>
      <div class="flex items-center justify-center gap-3 pt-2">
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-mono text-white font-semibold transition-colors cursor-pointer"
        >
          <NexuraIcon name="Plus" size="xs" />
          <span>Go to Projects Hub</span>
        </NuxtLink>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- STATE 4: READY STATE (FULL ROADMAP WORKSPACE)                     -->
    <!-- ================================================================= -->
    <div v-else-if="roadmapDataState === 'READY'" class="space-y-6">
      <!-- Stale Data Warning Banner -->
      <div
        v-if="isStaleDataWarning"
        class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono flex items-center justify-between"
        role="status"
      >
        <div class="flex items-center gap-2">
          <NexuraIcon name="AlertTriangle" size="xs" class="text-amber-400" />
          <span>Warning: Displaying cached roadmap telemetry. Background synchronization failed.</span>
        </div>
        <button
          type="button"
          class="text-xs underline hover:no-underline font-medium cursor-pointer"
          @click="workspaceStore.initializeWorkspace(true)"
        >
          Retry Sync
        </button>
      </div>

      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div class="space-y-1">
          <h1 class="font-sans text-xl sm:text-2xl font-semibold text-[#F3F4F6] tracking-tight">
            Architecture Roadmap
          </h1>
          <p class="font-sans text-xs text-[#8A8F9E]">
            Strategic milestone progression across canonical release phases.
          </p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <!-- Deliverables Search Input -->
          <div class="relative w-44 sm:w-56">
            <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#565B68]">
              <NexuraIcon name="Search" size="xs" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filter projects..."
              class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 outline-none transition font-sans"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-[#565B68] hover:text-[#F3F4F6] cursor-pointer"
              @click="searchQuery = ''"
            >
              <NexuraIcon name="X" size="xs" />
            </button>
          </div>

          <!-- Hub Link -->
          <NuxtLink
            to="/projects"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.08] transition"
          >
            <span>Projects Hub</span>
            <NexuraIcon name="ArrowRight" size="xs" />
          </NuxtLink>
        </div>
      </div>

      <!-- Feedback Toast -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div
          v-if="feedbackMessage"
          class="p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 shadow-lg"
          :class="feedbackType === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'"
          role="status"
        >
          <div class="flex items-center gap-2">
            <NexuraIcon
              :name="feedbackType === 'error' ? 'AlertTriangle' : 'CheckCircle2'"
              size="sm"
              class="shrink-0"
              :class="feedbackType === 'error' ? 'text-rose-400' : 'text-emerald-400'"
            />
            <span>{{ feedbackMessage }}</span>
          </div>
          <button
            type="button"
            class="text-xs hover:opacity-80 shrink-0 cursor-pointer p-1 rounded hover:bg-white/[0.04]"
            aria-label="Dismiss feedback"
            @click="feedbackMessage = ''"
          >
            <NexuraIcon name="X" size="xs" />
          </button>
        </div>
      </transition>

      <!-- Empty Search Result -->
      <div
        v-if="filteredProjects.length === 0"
        class="py-12 text-center rounded-2xl bg-[#111318] border border-white/[0.07] space-y-2"
      >
        <div class="w-10 h-10 mx-auto rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-[#565B68]">
          <NexuraIcon name="Search" size="sm" />
        </div>
        <h3 class="font-sans text-sm font-semibold text-[#F3F4F6]">No matching projects</h3>
        <p class="font-sans text-xs text-[#8A8F9E]">No roadmap projects match your current search criteria.</p>
        <button
          type="button"
          class="text-indigo-400 hover:text-indigo-300 font-sans text-xs underline cursor-pointer pt-1 inline-block"
          @click="searchQuery = ''"
        >
          Clear Search
        </button>
      </div>

      <!-- VIEW 1: 5-COLUMN RELEASE PHASE BOARD -->
      <div v-else-if="activeViewMode === 'board'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
          <div
            v-for="phase in CANONICAL_RELEASE_PHASES"
            :key="phase.id"
            class="flex flex-col rounded-2xl bg-[#0B0C10] border border-white/[0.06] p-3 space-y-3 min-h-[380px]"
          >
            <!-- Column Header -->
            <div class="p-2 border-b border-white/[0.06] space-y-1">
              <div class="flex items-center justify-between gap-1.5">
                <span
                  class="font-mono text-xs font-semibold px-2 py-0.5 rounded border truncate"
                  :class="phase.badgeClass"
                >
                  {{ phase.label }}
                </span>
                <span class="font-mono tabular-nums text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-[#8A8F9E] border border-white/[0.08] shrink-0">
                  {{ getProjectsByPhase(phase.id).length }}
                </span>
              </div>
              <p class="font-sans text-[11px] text-[#8A8F9E] line-clamp-2 leading-tight">
                {{ phase.description }}
              </p>
            </div>

            <!-- Column Empty State -->
            <div
              v-if="getProjectsByPhase(phase.id).length === 0"
              class="flex-1 py-10 px-3 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/[0.05] flex flex-col items-center justify-center space-y-1.5"
            >
              <NexuraIcon name="Inbox" size="sm" class="text-[#565B68]" />
              <p class="font-sans text-[11px] text-[#565B68] leading-tight max-w-[160px]">
                No projects in this phase.
              </p>
            </div>

            <!-- Project Cards in Column -->
            <div v-else class="space-y-2.5 flex-1">
              <article
                v-for="project in getProjectsByPhase(phase.id)"
                :key="project.id"
                class="obs-card p-3.5 rounded-xl bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] transition-all space-y-2.5 shadow-sm group"
              >
                <!-- Card Header: Title & Priority -->
                <div class="space-y-1">
                  <div class="flex items-start justify-between gap-1.5">
                    <NuxtLink
                      :to="`/projects/${project.slug}`"
                      class="font-sans text-xs sm:text-sm font-semibold text-[#F3F4F6] group-hover:text-indigo-300 transition-colors line-clamp-1"
                      :title="project.title"
                    >
                      {{ project.title }}
                    </NuxtLink>
                    <span
                      class="font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-medium shrink-0 border"
                      :class="getPriorityBadgeClass(project.priority)"
                    >
                      {{ project.priority }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-mono text-[10px] text-[#8A8F9E]">/{{ project.slug }}</span>
                    <span
                      class="font-mono text-[10px] px-1.5 py-0.5 rounded capitalize border font-medium"
                      :class="getStatusBadgeClass(project.status)"
                    >
                      {{ project.status }}
                    </span>
                    <!-- Anomaly Badge -->
                    <span
                      v-if="classifyReleasePhase(project.releasePhase).isAnomaly"
                      class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1"
                      :title="`Unknown release phase value: '${classifyReleasePhase(project.releasePhase).originalValue}'`"
                    >
                      <NexuraIcon name="AlertTriangle" size="xs" />
                      <span>Unknown Phase</span>
                    </span>
                  </div>
                </div>

                <!-- Description -->
                <p v-if="project.description" class="font-sans text-[11px] text-[#8A8F9E] line-clamp-2 leading-relaxed">
                  {{ project.description }}
                </p>

                <!-- Progress Bar & Deliverables Count -->
                <div class="pt-1 border-t border-white/[0.04]">
                  <div v-if="!isTaskMetricsAvailable" class="flex items-center gap-1 text-[10px] font-mono text-[#8A8F9E]">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Tasks Syncing...</span>
                  </div>
                  <div v-else class="space-y-1">
                    <div class="flex items-center justify-between text-[10px] font-mono">
                      <span class="text-[#8A8F9E] tabular-nums">
                        {{ getProjectTasks(project.slug).length }} tasks
                        <span class="text-emerald-400">({{ getProjectTasks(project.slug).filter(t => t.status === 'deployed').length }} deployed)</span>
                      </span>
                      <span class="text-[#F3F4F6] font-semibold tabular-nums">{{ getProjectProgress(project.slug) }}%</span>
                    </div>
                    <div class="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        class="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                        :style="{ width: `${getProjectProgress(project.slug)}%` }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Tech tags -->
                <div v-if="project.techStack?.length" class="flex items-center gap-1 flex-wrap pt-0.5">
                  <span
                    v-for="tech in project.techStack.slice(0, 3)"
                    :key="tech"
                    class="font-mono text-[9px] bg-white/[0.03] text-[#8A8F9E] border border-white/[0.06] rounded px-1.5 py-0.2"
                  >
                    {{ tech }}
                  </span>
                  <span v-if="project.techStack.length > 3" class="font-mono text-[9px] text-[#565B68]">
                    +{{ project.techStack.length - 3 }}
                  </span>
                </div>

                <!-- Card Footer: Quick Phase Selector & Direct Actions -->
                <div class="pt-2 border-t border-white/[0.04] flex items-center justify-between gap-1 flex-wrap">
                  <!-- Quick Phase Selector -->
                  <div class="relative inline-block">
                    <select
                      :id="`board-phase-select-${project.id}`"
                      :value="classifyReleasePhase(project.releasePhase).phase"
                      :disabled="isUpdatingPhase[project.id]"
                      aria-label="Change Release Phase"
                      class="bg-[#07080A] text-[#F3F4F6] text-[10px] font-mono rounded px-1.5 py-0.5 pr-5 border border-white/[0.08] hover:border-white/[0.16] focus:border-indigo-500/60 outline-none transition appearance-none cursor-pointer disabled:opacity-50"
                      @change="onUpdateReleasePhase(project, ($event.target as HTMLSelectElement).value as ReleasePhase)"
                    >
                      <option
                        v-for="p in CANONICAL_RELEASE_PHASES"
                        :key="p.id"
                        :value="p.id"
                        class="bg-[#111318] text-[#F3F4F6]"
                      >
                        {{ p.id.toUpperCase() }}
                      </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-[#8A8F9E]">
                      <NexuraIcon
                        :name="isUpdatingPhase[project.id] ? 'RotateCw' : 'ChevronDown'"
                        size="xs"
                        :class="{ 'animate-spin text-indigo-400': isUpdatingPhase[project.id] }"
                      />
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-1">
                    <a
                      v-if="project.deployUrl"
                      :href="project.deployUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                      :title="`Open live app: ${project.deployUrl}`"
                    >
                      <NexuraIcon name="ExternalLink" size="xs" />
                    </a>
                    <NuxtLink
                      :to="`/projects/${project.slug}`"
                      class="p-1 rounded hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.06] transition"
                      title="View Project Cockpit"
                    >
                      <NexuraIcon name="ArrowRight" size="xs" />
                    </NuxtLink>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW 2: CHRONOLOGICAL TIMELINE VIEW -->
      <div v-else-if="activeViewMode === 'timeline'" class="relative py-4">
        <!-- Spine Line -->
        <div class="absolute left-4 sm:left-8 top-4 bottom-4 w-0.5 bg-white/[0.08]" aria-hidden="true"></div>

        <div class="space-y-8">
          <div
            v-for="project in timelineProjects"
            :key="project.id"
            class="relative flex items-start"
          >
            <!-- Timeline Dot Marker -->
            <div class="absolute left-4 sm:left-8 -translate-x-1/2 mt-4 z-10">
              <div
                class="w-4 h-4 rounded-full border-4 border-[#0B0C10] transition-transform hover:scale-125"
                :class="classifyReleasePhase(project.releasePhase).phase === 'released'
                  ? 'bg-emerald-400 ring-4 ring-emerald-400/20'
                  : classifyReleasePhase(project.releasePhase).phase === 'backlog'
                  ? 'bg-[#565B68] ring-4 ring-white/[0.05]'
                  : 'bg-indigo-400 ring-4 ring-indigo-400/20'"
                :title="`Phase: ${classifyReleasePhase(project.releasePhase).phase}`"
              ></div>
            </div>

            <!-- Card -->
            <article
              class="ml-10 sm:ml-16 w-full p-5 sm:p-6 rounded-2xl bg-[#111318] border border-white/[0.07] hover:border-white/[0.14] transition-all group shadow-sm"
              :class="classifyReleasePhase(project.releasePhase).phase === 'released'
                ? 'hover:border-emerald-500/30 hover:shadow-[0_0_24px_rgba(16,185,129,0.08)]'
                : 'hover:border-indigo-500/30 hover:shadow-[0_0_24px_rgba(99,102,241,0.08)]'"
            >
              <!-- Card Top Header -->
              <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-white/[0.04]">
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Release Phase Badge -->
                    <span
                      class="font-mono text-xs font-semibold px-2 py-0.5 rounded border"
                      :class="getPhaseBadgeClass(classifyReleasePhase(project.releasePhase).phase)"
                    >
                      {{ getPhaseLabel(classifyReleasePhase(project.releasePhase).phase) }}
                    </span>

                    <!-- Anomaly Badge -->
                    <span
                      v-if="classifyReleasePhase(project.releasePhase).isAnomaly"
                      class="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1"
                      :title="`Legacy/Non-standard phase value in database: '${classifyReleasePhase(project.releasePhase).originalValue}'`"
                    >
                      <NexuraIcon name="AlertTriangle" size="xs" />
                      <span>Unknown Phase: "{{ classifyReleasePhase(project.releasePhase).originalValue }}"</span>
                    </span>

                    <span class="text-white/20 select-none">•</span>

                    <NuxtLink
                      :to="`/projects/${project.slug}`"
                      class="font-sans text-base sm:text-lg font-semibold text-[#F3F4F6] hover:text-indigo-300 transition-colors"
                    >
                      {{ project.title }}
                    </NuxtLink>
                  </div>
                  <span class="font-mono text-xs text-[#565B68] mt-1 block">/{{ project.slug }}</span>
                </div>

                <!-- Right Header: Status, Live Link & Quick Phase Selector -->
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Live App Link -->
                  <a
                    v-if="project.deployUrl"
                    :href="project.deployUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group/link"
                    :title="`Open live site: ${project.deployUrl}`"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Live App</span>
                    <NexuraIcon name="ExternalLink" size="xs" class="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                  </a>

                  <!-- Status Badge -->
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono capitalize border font-medium"
                    :class="getStatusBadgeClass(project.status)"
                  >
                    {{ project.status || 'Active' }}
                  </span>

                  <!-- Quick Phase Selector -->
                  <div class="relative inline-block">
                    <select
                      :id="`timeline-phase-select-${project.id}`"
                      :value="classifyReleasePhase(project.releasePhase).phase"
                      :disabled="isUpdatingPhase[project.id]"
                      aria-label="Change Release Phase"
                      class="bg-[#07080A] text-[#F3F4F6] text-xs font-mono rounded-lg px-2 py-1 pr-6 border border-white/[0.08] hover:border-white/[0.16] focus:border-indigo-500/60 outline-none transition appearance-none cursor-pointer disabled:opacity-50"
                      @change="onUpdateReleasePhase(project, ($event.target as HTMLSelectElement).value as ReleasePhase)"
                    >
                      <option
                        v-for="p in CANONICAL_RELEASE_PHASES"
                        :key="p.id"
                        :value="p.id"
                        class="bg-[#111318] text-[#F3F4F6]"
                      >
                        {{ p.label }}
                      </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-[#8A8F9E]">
                      <NexuraIcon
                        :name="isUpdatingPhase[project.id] ? 'RotateCw' : 'ChevronDown'"
                        size="xs"
                        :class="{ 'animate-spin text-indigo-400': isUpdatingPhase[project.id] }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <p class="font-sans text-xs text-[#8A8F9E] mt-3 leading-relaxed">
                {{ project.description || 'Active architecture project tracked in the workspace roadmap.' }}
              </p>

              <!-- Progress Bar -->
              <div class="mt-3">
                <div v-if="!isTaskMetricsAvailable" class="flex items-center gap-1.5 text-xs font-mono text-[#8A8F9E]">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>Tasks Syncing...</span>
                </div>
                <div v-else class="space-y-1.5 max-w-md">
                  <div class="flex items-center justify-between text-xs font-mono">
                    <span class="text-[#8A8F9E] text-[11px]">Milestone Completion Progress</span>
                    <span class="text-[#F3F4F6] font-semibold tabular-nums text-xs">{{ getProjectProgress(project.slug) }}%</span>
                  </div>
                  <div class="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      class="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                      :style="{ width: `${getProjectProgress(project.slug)}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Metadata 3-Column Bento Grid -->
              <div class="mt-4 pt-3 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <!-- Tile 1: Timeline Target -->
                <div class="p-3 rounded-xl bg-[#07080A] border border-white/[0.06]">
                  <span class="text-[10px] text-[#8A8F9E] uppercase tracking-wider block font-mono">Timeline Target</span>
                  <span class="text-[#F3F4F6] mt-1 block truncate tabular-nums">
                    {{ formatDate(project.startDate) }} – {{ formatDate(project.dueDate) }}
                  </span>
                </div>

                <!-- Tile 2: Linked Tasks Count -->
                <div class="p-3 rounded-xl bg-[#07080A] border border-white/[0.06]">
                  <span class="text-[10px] text-[#8A8F9E] uppercase tracking-wider block font-mono">Linked Tasks</span>
                  <span class="text-[#F3F4F6] mt-1 block tabular-nums">
                    {{ getProjectTasks(project.slug).length }} tasks
                    <span class="text-emerald-400 text-[11px]">({{ getProjectTasks(project.slug).filter(t => t.status === 'deployed').length }} deployed)</span>
                  </span>
                </div>

                <!-- Tile 3: Repository Connection -->
                <div class="p-3 rounded-xl bg-[#07080A] border border-white/[0.06]">
                  <span class="text-[10px] text-[#8A8F9E] uppercase tracking-wider block font-mono">Repository</span>
                  <span class="text-indigo-300/90 mt-1 block truncate font-medium">
                    {{ project.githubRepo || project.slug }}
                  </span>
                </div>
              </div>

              <!-- Footer: Tech Tags & Navigation -->
              <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div v-if="project.techStack?.length" class="flex items-center gap-1.5 flex-wrap">
                  <span
                    v-for="tech in project.techStack"
                    :key="tech"
                    class="font-mono text-[10px] bg-white/[0.04] text-[#8A8F9E] border border-white/[0.06] rounded px-2 py-0.5"
                  >
                    {{ tech }}
                  </span>
                </div>
                <div v-else></div>

                <NuxtLink
                  :to="`/projects/${project.slug}`"
                  class="inline-flex items-center justify-center gap-1.5 font-mono text-xs px-3.5 py-1.5 rounded-lg border transition-all focus:outline-none bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F4F6] border border-white/[0.08]"
                >
                  <span>View Project Cockpit</span>
                  <NexuraIcon name="ArrowRight" size="xs" />
                </NuxtLink>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import NexuraIcon from '~~/components/ui/NexuraIcon.vue'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useProjects } from '~/composables/useProjects'
import { useHeaderActions } from '~/composables/useHeaderActions'
import { CANONICAL_RELEASE_PHASES, type ReleasePhase, type Project, type Task } from '~/types'

// Single Source of Truth Workspace Store
const workspaceStore = useWorkspaceStore()
const projectsApi = useProjects()

// View Filter & Search State
const activeViewMode = ref<'board' | 'timeline'>('board')
const searchQuery = ref('')

// Contextual Action Bar integration
const { setActions, clearActions } = useHeaderActions()

async function refreshRoadmap() {
  try {
    await workspaceStore.refreshWorkspace()
    showFeedback('Roadmap refreshed')
  } catch (err: any) {
    showFeedback('Failed to refresh: ' + (err.message || 'Unknown error'), 'error')
  }
}

// Initialize workspace store if not yet hydrated
onMounted(async () => {
  watchEffect(() => {
    setActions([
      {
        id: 'view-board',
        label: 'Board View',
        icon: 'LayoutGrid',
        variant: activeViewMode.value === 'board' ? 'primary' : 'secondary',
        handler: () => {
          activeViewMode.value = 'board'
        }
      },
      {
        id: 'view-timeline',
        label: 'Timeline View',
        icon: 'GitCommit',
        variant: activeViewMode.value === 'timeline' ? 'primary' : 'secondary',
        handler: () => {
          activeViewMode.value = 'timeline'
        }
      },
      {
        id: 'refresh-roadmap',
        label: 'Refresh',
        icon: 'RotateCw',
        variant: 'secondary',
        handler: () => refreshRoadmap()
      }
    ])
  })

  if (!workspaceStore.isInitialized.value) {
    await workspaceStore.initializeWorkspace()
  }
})

onBeforeUnmount(() => {
  clearActions()
})

// Deterministic 4-State Machine & Cache Resilience
const roadmapDataState = computed<'LOADING' | 'ERROR' | 'SUCCESS_EMPTY' | 'READY'>(() => {
  const projectsList = workspaceStore.projects.value || []
  const hasProjects = projectsList.length > 0
  const projectsHydration = workspaceStore.hydrationStatus.value.projects

  if (hasProjects) {
    return 'READY'
  }
  if (projectsHydration === 'error') {
    return 'ERROR'
  }
  if (!workspaceStore.isInitialized.value || projectsHydration === 'loading') {
    return 'LOADING'
  }
  return 'SUCCESS_EMPTY'
})

const isStaleDataWarning = computed(() => {
  return workspaceStore.hydrationStatus.value.projects === 'error' && (workspaceStore.projects.value || []).length > 0
})

const isTaskMetricsAvailable = computed(() => {
  return workspaceStore.hydrationStatus.value.tasks === 'success' || (workspaceStore.tasks.value || []).length > 0
})

// Normalization & Anomaly Classification
export interface PhaseClassification {
  phase: ReleasePhase
  isAnomaly: boolean
  originalValue?: string | null
}

function classifyReleasePhase(rawPhase?: string | null): PhaseClassification {
  if (!rawPhase || typeof rawPhase !== 'string') {
    return { phase: 'backlog', isAnomaly: false }
  }

  const normalized = rawPhase.trim().toLowerCase()

  // Canonical phases
  if (normalized === 'backlog' || normalized === 'mvp' || normalized === 'v1.1' || normalized === 'v2.0' || normalized === 'released') {
    return { phase: normalized as ReleasePhase, isAnomaly: false }
  }

  // Legacy v1.0 mapping to mvp
  if (normalized === 'v1.0' || normalized === 'v1') {
    return { phase: 'mvp', isAnomaly: false }
  }

  // Unknown string / anomaly
  return { phase: 'backlog', isAnomaly: true, originalValue: rawPhase }
}

// Filtered projects by search query
const filteredProjects = computed<Project[]>(() => {
  let list = [...(workspaceStore.projects.value ?? [])]
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.techStack && p.techStack.some(t => t.toLowerCase().includes(q)))
    )
  }
  return list
})

// Chronologically sorted projects for Timeline View
const timelineProjects = computed<Project[]>(() => {
  const list = [...filteredProjects.value]
  list.sort((a, b) => {
    if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate)
    if (a.startDate) return -1
    if (b.startDate) return 1
    return a.title.localeCompare(b.title)
  })
  return list
})

function getProjectsByPhase(phaseId: ReleasePhase): Project[] {
  return filteredProjects.value.filter(p => classifyReleasePhase(p.releasePhase).phase === phaseId)
}

function getPhaseBadgeClass(phase: ReleasePhase): string {
  const match = CANONICAL_RELEASE_PHASES.find(p => p.id === phase)
  return match?.badgeClass || 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]'
}

function getPhaseLabel(phase: ReleasePhase): string {
  const match = CANONICAL_RELEASE_PHASES.find(p => p.id === phase)
  return match?.label || phase.toUpperCase()
}

// Metric Honesty & Zero-Division Guard
function getProjectTasks(slug: string): Task[] {
  const all = workspaceStore.tasks.value ?? []
  const targetSlug = (slug || '').trim().toLowerCase()
  return all.filter(t => (t.projectSlug || '').trim().toLowerCase() === targetSlug)
}

function getProjectProgress(slug: string): number | null {
  if (!isTaskMetricsAvailable.value) {
    return null
  }
  const projectTasks = getProjectTasks(slug)
  if (projectTasks.length === 0) {
    return 0
  }
  const deployedCount = projectTasks.filter(t => t.status === 'deployed').length
  return Math.round((deployedCount / projectTasks.length) * 100)
}

function formatDate(d?: string | null): string {
  if (!d) return 'TBD'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return 'TBD'
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return 'TBD'
  }
}

function getStatusBadgeClass(status?: string): string {
  const s = (status || '').toLowerCase()
  if (s === 'maintenance') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
  if (s === 'completed' || s === 'deployed') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (s === 'on-hold') return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (s === 'planned') return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  if (s === 'archived') return 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]'
  return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
}

function getPriorityBadgeClass(priority?: string): string {
  const p = (priority || '').toLowerCase()
  if (p === 'critical') return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  if (p === 'high') return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (p === 'medium') return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
  return 'bg-white/[0.04] text-[#8A8F9E] border-white/[0.08]'
}

// Quick Phase Transition Handling
const isUpdatingPhase = ref<Record<string, boolean>>({})

async function onUpdateReleasePhase(project: Project, newPhase: ReleasePhase) {
  if (classifyReleasePhase(project.releasePhase).phase === newPhase || isUpdatingPhase.value[project.id]) return
  isUpdatingPhase.value[project.id] = true
  try {
    await projectsApi.updateProject(project.slug, { releasePhase: newPhase })
    showFeedback(`Moved "${project.title}" to ${newPhase.toUpperCase()}`)
  } catch (err: any) {
    showFeedback('Failed to update release phase: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    isUpdatingPhase.value[project.id] = false
  }
}

// Toast Feedback Handling
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

function showFeedback(msg: string, type: 'success' | 'error' = 'success') {
  feedbackMessage.value = msg
  feedbackType.value = type
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedbackMessage.value = ''
  }, 4000)
}
</script>
