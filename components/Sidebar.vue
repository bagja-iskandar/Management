<template>
  <!-- Desktop Unified Left Sidebar (Linear/Raycast style w-56 rail) -->
  <aside
    class="w-56 shrink-0 hidden lg:flex flex-col py-2.5 px-2 select-none h-full overflow-hidden"
    aria-label="Unified Left Sidebar"
    v-bind="$attrs"
  >
    <!-- Zona 1 (Fixed Top): Brand Header -->
    <div class="shrink-0 pb-2.5">
      <!-- Workspace Brand Header (Pure Workspace Identity without duplicate + button) -->
      <div class="flex items-center px-2 py-1">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center border border-white/15 bg-gradient-to-b from-white/15 to-white/5 shadow-inner">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div class="text-sm font-bold tracking-tight text-[#F3F4F6] flex items-center gap-1.5 font-sans">
              Nexura
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Zona 2 (Scrollable Body): Workspace Navigation & Active Projects Tree -->
    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 space-y-4">
      <!-- Primary Workspace Navigation -->
      <div class="space-y-0.5">
        <div class="px-2.5 pb-1 text-[11px] font-semibold tracking-wider uppercase text-[#8A8F9E]/70 font-sans">
          Workspace
        </div>

        <!-- 1. Command Center -->
        <NuxtLink
          to="/"
          class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition group"
          :class="[
            isRouteActive('/')
              ? 'bg-white/[0.07] text-[#F3F4F6] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
          ]"
        >
          <span class="flex items-center gap-2.5 font-sans">
            <NexuraIcon
              name="LayoutDashboard"
              size="md"
              :class="isRouteActive('/') ? 'text-[#818CF8]' : 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'"
            />
            Command Center
          </span>
          <span
            v-if="isRouteActive('/')"
            class="w-1.5 h-1.5 rounded-full shrink-0 ml-auto"
            style="background: var(--obs-accent-light)"
          ></span>
          <NexuraIcon
            v-else
            name="ChevronRight"
            size="xs"
            class="text-[#8A8F9E] opacity-0 group-hover:opacity-60 transition-opacity shrink-0 ml-auto"
          />
        </NuxtLink>

        <!-- 2. My Tasks & Queue -->
        <NuxtLink
          to="/tasks"
          class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition group"
          :class="[
            isRouteActive('/tasks')
              ? 'bg-white/[0.07] text-[#F3F4F6] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
          ]"
        >
          <span class="flex items-center gap-2.5 font-sans">
            <NexuraIcon
              name="CheckSquare"
              size="md"
              :class="isRouteActive('/tasks') ? 'text-[#818CF8]' : 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'"
            />
            My Tasks & Queue
          </span>
          <span class="h-5 px-1.5 rounded-md font-mono tabular-nums text-xs inline-flex items-center justify-center bg-white/[0.05] text-[#8A8F9E] border border-white/[0.06] shrink-0 ml-auto">
            {{ tasksCount }}
          </span>
        </NuxtLink>

        <!-- 3. Weekly Sprints -->
        <NuxtLink
          to="/sprints"
          class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition group"
          :class="[
            isRouteActive('/sprints')
              ? 'bg-white/[0.07] text-[#F3F4F6] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
          ]"
        >
          <span class="flex items-center gap-2.5 font-sans">
            <NexuraIcon
              name="Calendar"
              size="md"
              :class="isRouteActive('/sprints') ? 'text-[#818CF8]' : 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'"
            />
            Weekly Sprints
          </span>
          <span class="h-5 px-1.5 rounded-md font-mono tabular-nums text-xs inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 ml-auto">
            {{ activeSprintCode }}
          </span>
        </NuxtLink>

        <!-- 4. Architecture Roadmap -->
        <NuxtLink
          to="/roadmap"
          class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition group"
          :class="[
            isRouteActive('/roadmap')
              ? 'bg-white/[0.07] text-[#F3F4F6] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
          ]"
        >
          <span class="flex items-center gap-2.5 font-sans">
            <NexuraIcon
              name="Map"
              size="md"
              :class="isRouteActive('/roadmap') ? 'text-[#818CF8]' : 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'"
            />
            Roadmap
          </span>
          <span
            v-if="isRouteActive('/roadmap')"
            class="w-1.5 h-1.5 rounded-full shrink-0 ml-auto"
            style="background: var(--obs-accent-light)"
          ></span>
          <NexuraIcon
            v-else
            name="ChevronRight"
            size="xs"
            class="text-[#8A8F9E] opacity-0 group-hover:opacity-60 transition-opacity shrink-0 ml-auto"
          />
        </NuxtLink>

        <!-- 5. GitHub Repositories -->
        <NuxtLink
          to="/repos"
          class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition group"
          :class="[
            isRouteActive('/repos')
              ? 'bg-white/[0.07] text-[#F3F4F6] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
          ]"
        >
          <span class="flex items-center gap-2.5 font-sans">
            <NexuraIcon
              name="GitBranch"
              size="md"
              :class="isRouteActive('/repos') ? 'text-[#818CF8]' : 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'"
            />
            GitHub Repositories
          </span>
          <span class="h-5 px-1.5 rounded-md font-mono tabular-nums text-xs inline-flex items-center justify-center bg-white/[0.05] text-[#8A8F9E] border border-white/[0.06] shrink-0 ml-auto">
            {{ reposCount }}
          </span>
        </NuxtLink>

        <!-- 6. System Telemetry -->
        <NuxtLink
          to="/telemetry"
          class="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition group"
          :class="[
            isRouteActive('/telemetry')
              ? 'bg-white/[0.07] text-[#F3F4F6] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
              : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
          ]"
        >
          <span class="flex items-center gap-2.5 font-sans">
            <NexuraIcon
              name="Activity"
              size="md"
              :class="isRouteActive('/telemetry') ? 'text-[#818CF8]' : 'text-[#8A8F9E] group-hover:text-[#F3F4F6]'"
            />
            System Telemetry
          </span>
          <span
            v-if="isRouteActive('/telemetry')"
            class="w-1.5 h-1.5 rounded-full shrink-0 ml-auto"
            style="background: var(--obs-accent-light)"
          ></span>
          <NexuraIcon
            v-else
            name="ChevronRight"
            size="xs"
            class="text-[#8A8F9E] opacity-0 group-hover:opacity-60 transition-opacity shrink-0 ml-auto"
          />
        </NuxtLink>
      </div>

      <!-- Section: Active Projects -->
      <div class="space-y-1 pt-1">
        <div class="px-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-[#8A8F9E]/70 font-sans">
          <span>Active Projects</span>
          <NuxtLink
            to="/projects"
            class="text-[#8A8F9E] hover:text-white transition cursor-pointer text-xs p-0.5 rounded hover:bg-white/5"
            title="All Projects"
          >
            <NexuraIcon name="ChevronRight" size="xs" />
          </NuxtLink>
        </div>

        <!-- Project Tree List -->
        <div
          v-for="project in displayedProjects"
          :key="project.slug"
          class="space-y-0.5"
        >
          <!-- Project Root Interactive Row: Left Chevron + Status Dot + Project Name ... Progress% -->
          <div
            class="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition group"
            :class="[
              isProjectActive(project.slug)
                ? 'bg-white/[0.07] text-[#F3F4F6] border border-white/[0.07]'
                : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
            ]"
          >
            <!-- Left Group: Chevron button + Project Link (Status Dot + Name) -->
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <!-- Chevron expand/collapse on LEFT -->
              <button
                type="button"
                @click.stop="toggleProjectExpand(project.slug, $event)"
                class="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[#8A8F9E] hover:text-[#F3F4F6] transition-transform duration-200 cursor-pointer shrink-0"
                :class="isExpanded(project.slug) ? 'rotate-90 text-[#F3F4F6]' : 'rotate-0'"
                aria-label="Toggle Project Navigation"
              >
                <NexuraIcon name="ChevronRight" size="xs" />
              </button>

              <!-- Status dot + Project name link -->
              <NuxtLink
                :to="`/projects/${project.slug}`"
                @click="onProjectClick(project.slug)"
                class="flex items-center gap-2 truncate flex-1 min-w-0 cursor-pointer"
              >
                <span class="w-2 h-2 rounded-full shrink-0" :class="project.dotColor"></span>
                <span class="truncate font-sans font-medium">{{ project.name }}</span>
              </NuxtLink>
            </div>

            <!-- Right: Progress % badge -->
            <span class="font-mono tabular-nums text-xs text-[#565B68] group-hover:text-[#8A8F9E] shrink-0 ml-1.5">
              {{ project.progress }}%
            </span>
          </div>

          <!-- Contextual Tree Accordion Container -->
          <div
            class="grid transition-[grid-template-rows] duration-200 ease-out"
            :class="isExpanded(project.slug) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'"
          >
            <div class="overflow-hidden">
              <div class="ml-3 pl-3 border-l border-white/[0.08] space-y-0.5 py-1">
                <!-- 1. Cockpit Overview -->
                <button
                  type="button"
                  @click="selectProjectTab(project.slug, 'dashboard')"
                  class="w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition cursor-pointer group/item"
                  :class="[
                    isSubItemActive(project.slug, 'dashboard')
                      ? 'bg-white/[0.07] text-[#F3F4F6] font-medium border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
                  ]"
                >
                  <span class="flex items-center gap-2 truncate">
                    <NexuraIcon
                      name="LayoutDashboard"
                      size="xs"
                      :class="isSubItemActive(project.slug, 'dashboard') ? 'text-indigo-400' : 'text-[#8A8F9E] group-hover/item:text-[#F3F4F6]'"
                    />
                    <span class="truncate font-sans">Overview</span>
                  </span>
                  <span
                    v-if="isSubItemActive(project.slug, 'dashboard')"
                    class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                  ></span>
                </button>

                <!-- 2. Kanban Board -->
                <button
                  type="button"
                  @click="selectProjectTab(project.slug, 'kanban')"
                  class="w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition cursor-pointer group/item"
                  :class="[
                    isSubItemActive(project.slug, 'kanban')
                      ? 'bg-white/[0.07] text-[#F3F4F6] font-medium border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
                  ]"
                >
                  <span class="flex items-center gap-2 truncate">
                    <NexuraIcon
                      name="Columns3"
                      size="xs"
                      :class="isSubItemActive(project.slug, 'kanban') ? 'text-indigo-400' : 'text-[#8A8F9E] group-hover/item:text-[#F3F4F6]'"
                    />
                    <span class="truncate font-sans">Kanban Board</span>
                  </span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span
                      v-if="isProjectActive(project.slug) && projectNav.tasksCount.value > 0"
                      class="h-4 px-1 rounded font-mono tabular-nums text-xs inline-flex items-center justify-center"
                      :class="isSubItemActive(project.slug, 'kanban') ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.06] text-[#8A8F9E]'"
                    >
                      {{ projectNav.tasksCount.value }}
                    </span>
                    <span
                      v-if="isSubItemActive(project.slug, 'kanban')"
                      class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                    ></span>
                  </div>
                </button>

                <!-- 3. Deliverables Matrix -->
                <button
                  type="button"
                  @click="selectProjectTab(project.slug, 'matrix')"
                  class="w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition cursor-pointer group/item"
                  :class="[
                    isSubItemActive(project.slug, 'matrix')
                      ? 'bg-white/[0.07] text-[#F3F4F6] font-medium border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
                  ]"
                >
                  <span class="flex items-center gap-2 truncate">
                    <NexuraIcon
                      name="CheckSquare"
                      size="xs"
                      :class="isSubItemActive(project.slug, 'matrix') ? 'text-indigo-400' : 'text-[#8A8F9E] group-hover/item:text-[#F3F4F6]'"
                    />
                    <span class="truncate font-sans">Deliverables</span>
                  </span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span
                      v-if="isProjectActive(project.slug) && projectNav.matrixCount.value > 0"
                      class="h-4 px-1 rounded font-mono tabular-nums text-xs inline-flex items-center justify-center"
                      :class="isSubItemActive(project.slug, 'matrix') ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.06] text-[#8A8F9E]'"
                    >
                      {{ projectNav.matrixCount.value }}
                    </span>
                    <span
                      v-if="isSubItemActive(project.slug, 'matrix')"
                      class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                    ></span>
                  </div>
                </button>

                <!-- 4. GitHub Stream -->
                <button
                  type="button"
                  @click="selectProjectTab(project.slug, 'github')"
                  class="w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition cursor-pointer group/item"
                  :class="[
                    isSubItemActive(project.slug, 'github')
                      ? 'bg-white/[0.07] text-[#F3F4F6] font-medium border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
                  ]"
                >
                  <span class="flex items-center gap-2 truncate">
                    <NexuraIcon
                      name="GitBranch"
                      size="xs"
                      :class="isSubItemActive(project.slug, 'github') ? 'text-indigo-400' : 'text-[#8A8F9E] group-hover/item:text-[#F3F4F6]'"
                    />
                    <span class="truncate font-sans">GitHub Stream</span>
                  </span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span
                      v-if="isProjectActive(project.slug) && projectNav.commitsCount.value > 0"
                      class="h-4 px-1 rounded font-mono tabular-nums text-xs inline-flex items-center justify-center"
                      :class="isSubItemActive(project.slug, 'github') ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.06] text-[#8A8F9E]'"
                    >
                      {{ projectNav.commitsCount.value }}
                    </span>
                    <span
                      v-if="isSubItemActive(project.slug, 'github')"
                      class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                    ></span>
                  </div>
                </button>

                <!-- 5. Vercel Deployments -->
                <button
                  type="button"
                  @click="selectProjectTab(project.slug, 'vercel')"
                  class="w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition cursor-pointer group/item"
                  :class="[
                    isSubItemActive(project.slug, 'vercel')
                      ? 'bg-white/[0.07] text-[#F3F4F6] font-medium border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
                  ]"
                >
                  <span class="flex items-center gap-2 truncate">
                    <NexuraIcon
                      name="Triangle"
                      size="xs"
                      :class="isSubItemActive(project.slug, 'vercel') ? 'text-indigo-400' : 'text-[#8A8F9E] group-hover/item:text-[#F3F4F6]'"
                    />
                    <span class="truncate font-sans">Vercel Edge</span>
                  </span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live Deployment"></span>
                    <span
                      v-if="isSubItemActive(project.slug, 'vercel')"
                      class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                    ></span>
                  </div>
                </button>

                <!-- 6. Project Notes & Ideas -->
                <button
                  type="button"
                  @click="selectProjectTab(project.slug, 'notes')"
                  class="w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition cursor-pointer group/item"
                  :class="[
                    isSubItemActive(project.slug, 'notes')
                      ? 'bg-white/[0.07] text-[#F3F4F6] font-medium border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                      : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-transparent'
                  ]"
                >
                  <span class="flex items-center gap-2 truncate">
                    <NexuraIcon
                      name="FileText"
                      size="xs"
                      :class="isSubItemActive(project.slug, 'notes') ? 'text-indigo-400' : 'text-amber-400/80'"
                    />
                    <span class="truncate font-sans">Notes &amp; Ideas</span>
                  </span>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400/80" title="Notes &amp; Ideas"></span>
                    <span
                      v-if="isSubItemActive(project.slug, 'notes')"
                      class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
                    ></span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Zona 3 (Pinned Bottom Dock): System Telemetry Status Pod -->
    <div class="shrink-0 pt-3 border-t border-white/[0.06] px-2 space-y-2">
      <div class="flex items-center justify-between text-xs font-sans">
        <span class="flex items-center gap-2 text-[#8A8F9E]">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Supabase + GitHub
        </span>
        <span class="font-mono tabular-nums text-xs text-[#F3F4F6]">4,892/5k</span>
      </div>
      <div class="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden" title="API Rate Limit: 94% remaining">
        <div class="h-full rounded-full bg-emerald-400/80" style="width: 94%"></div>
      </div>

      <!-- Session Auth Status Button -->
      <button
        type="button"
        @click="session.openAuthModal"
        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-xs transition cursor-pointer group"
        :title="session.isAuthenticated.value ? 'Session Active (Verified)' : 'Click to Authenticate Session'"
        aria-label="Session Authentication Status"
      >
        <span class="flex items-center gap-1.5 text-[#8A8F9E] group-hover:text-[#F3F4F6]">
          <NexuraIcon
            name="KeyRound"
            size="xs"
            :class="session.isAuthenticated.value ? 'text-emerald-400' : 'text-amber-400'"
          />
          <span class="text-[11px] font-sans font-medium">Session</span>
        </span>
        <span
          class="text-[10px] font-mono px-1.5 py-0.5 rounded border"
          :class="session.isAuthenticated.value
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'"
        >
          {{ session.isAuthenticated.value ? 'Active' : 'Unverified' }}
        </span>
      </button>
    </div>
  </aside>

  <!-- Mobile Bottom Navigation (Floating Dock for Smartphone / Tablet) -->
  <nav
    class="lg:hidden fixed bottom-2 inset-x-2 h-14 bg-[#111318]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl z-50 flex items-center justify-around px-2 shadow-2xl select-none"
    aria-label="Mobile Navigation"
  >
    <!-- Command Center -->
    <NuxtLink
      to="/"
      class="p-2 rounded-xl transition-all"
      :class="[isRouteActive('/') ? 'text-[#818CF8] bg-white/[0.08]' : 'text-[#8A8F9E] hover:text-[#F3F4F6]']"
      aria-label="Command Center"
    >
      <NexuraIcon name="LayoutDashboard" size="lg" />
    </NuxtLink>

    <!-- Tasks -->
    <NuxtLink
      to="/tasks"
      class="p-2 rounded-xl transition-all relative"
      :class="[isRouteActive('/tasks') ? 'text-[#818CF8] bg-white/[0.08]' : 'text-[#8A8F9E] hover:text-[#F3F4F6]']"
      aria-label="Tasks"
    >
      <NexuraIcon name="CheckSquare" size="lg" />
    </NuxtLink>

    <!-- Quick Add Button (Retained on Mobile) -->
    <button
      type="button"
      @click="openAddTask"
      class="w-10 h-10 rounded-full bg-[#F3F4F6] hover:bg-white text-[#07080A] flex items-center justify-center font-bold shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
      aria-label="Create Deliverable"
    >
      <NexuraIcon name="Plus" size="md" :stroke-width="2.2" />
    </button>

    <!-- Sprints -->
    <NuxtLink
      to="/sprints"
      class="p-2 rounded-xl transition-all"
      :class="[isRouteActive('/sprints') ? 'text-[#818CF8] bg-white/[0.08]' : 'text-[#8A8F9E] hover:text-[#F3F4F6]']"
      aria-label="Sprints"
    >
      <NexuraIcon name="Calendar" size="lg" />
    </NuxtLink>

    <!-- Repos -->
    <NuxtLink
      to="/repos"
      class="p-2 rounded-xl transition-all"
      :class="[isRouteActive('/repos') ? 'text-[#818CF8] bg-white/[0.08]' : 'text-[#8A8F9E] hover:text-[#F3F4F6]']"
      aria-label="Repositories"
    >
      <NexuraIcon name="GitBranch" size="lg" />
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import NexuraIcon from './ui/NexuraIcon.vue'
import { useProjectNav, type ProjectTabId } from '~/composables/useProjectNav'
import { useWorkspaceStore } from '~/composables/useWorkspaceStore'
import { useSession } from '~/composables/useSession'

defineOptions({
  inheritAttrs: false
})

const route = useRoute()
const projectNav = useProjectNav()

const expandedProjects = ref<Set<string>>(new Set())

function isExpanded(slug: string): boolean {
  return expandedProjects.value.has(slug)
}

function toggleProjectExpand(slug: string, event?: Event) {
  if (event) {
    event.stopPropagation()
  }
  const next = new Set(expandedProjects.value)
  if (next.has(slug)) {
    next.delete(slug)
  } else {
    next.add(slug)
  }
  expandedProjects.value = next
}

function ensureProjectExpanded(slug: string) {
  if (!expandedProjects.value.has(slug)) {
    const next = new Set(expandedProjects.value)
    next.add(slug)
    expandedProjects.value = next
  }
}

function onProjectClick(slug: string) {
  ensureProjectExpanded(slug)
  if (!isProjectActive(slug)) {
    projectNav.setActiveTab('dashboard')
  }
}

function isRouteActive(path: string): boolean {
  if (!route?.path) return false
  if (path === '/') {
    return route.path === '/'
  }
  if (path === '/sprints') {
    return route.path.startsWith('/sprints')
  }
  return route.path.startsWith(path)
}

function isProjectActive(slug: string): boolean {
  if (!route?.path) return false
  return route.path === `/projects/${slug}` || route.path.startsWith(`/projects/${slug}/`)
}

function isSubItemActive(slug: string, tabId: ProjectTabId): boolean {
  if (!isProjectActive(slug)) return false
  return projectNav.activeTab.value === tabId
}

async function selectProjectTab(slug: string, tabId: ProjectTabId) {
  projectNav.setActiveTab(tabId)
  ensureProjectExpanded(slug)
  await navigateTo({
    path: `/projects/${slug}`,
    query: { tab: tabId }
  })
}

// Watch route path to automatically expand project accordion when on /projects/:slug
watch(
  () => route?.path,
  (newPath) => {
    if (!newPath) return
    const match = newPath.match(/^\/projects\/([^/?#]+)/)
    if (match && match[1]) {
      ensureProjectExpanded(match[1])
    }
  },
  { immediate: true }
)

const currentRouteProjectSlug = computed(() => {
  if (!route?.path) return null
  const match = route.path.match(/^\/projects\/([^/?#]+)/)
  return match ? match[1] : null
})

const session = useSession()
const { repos } = useGitHubRepos()
const { openAddTask } = useQuickTask()

const workspaceStore = useWorkspaceStore()
const tasks = workspaceStore.tasks
const projects = workspaceStore.projects
const sprints = workspaceStore.sprints

const tasksCount = computed(() => tasks.value?.length ?? 14)
const reposCount = computed(() => repos.value?.length ?? 8)

const activeSprintCode = computed(() => {
  const active = sprints.value?.find((s) => s.status === 'active')
  if (active) {
    const match = active.name.match(/W\d+/i)
    return match ? match[0].toUpperCase() : 'W42'
  }
  return 'W42'
})

// 4 fallback project slots to prevent Cumulative Layout Shift (CLS)
const defaultProjects = [
  { slug: 'nexura-command', name: 'nexura-command', progress: 78, dotColor: 'bg-indigo-400' },
  { slug: 'supabase-edge-sync', name: 'supabase-edge-sync', progress: 92, dotColor: 'bg-emerald-400' },
  { slug: 'telemetry-gateway', name: 'telemetry-gateway', progress: 45, dotColor: 'bg-amber-400' },
  { slug: 'realtime-broker', name: 'realtime-broker', progress: 60, dotColor: 'bg-sky-400' }
]

interface ProjectStat {
  total: number
  deployed: number
  progress: number
}

// Single-pass O(N) map counter over tasks.value for high-performance reactive computation
const projectStatsMap = computed(() => {
  const map = new Map<string, ProjectStat>()
  const list = tasks.value || []
  for (const t of list) {
    if (!t.projectSlug) continue
    let curr = map.get(t.projectSlug)
    if (!curr) {
      curr = { total: 0, deployed: 0, progress: 0 }
      map.set(t.projectSlug, curr)
    }
    curr.total++
    if (t.status === 'deployed') {
      curr.deployed++
    }
  }
  for (const stat of map.values()) {
    stat.progress = stat.total > 0 ? Math.round((stat.deployed / stat.total) * 100) : 0
  }
  return map
})

// O(N + M) displayed projects with O(1) stats lookup
const displayedProjects = computed(() => {
  const colors = ['bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-sky-400', 'bg-rose-400', 'bg-violet-400']
  let list: Array<{ slug: string; name: string; progress: number; dotColor: string }> = []
  const stats = projectStatsMap.value

  if (!projects.value || projects.value.length === 0) {
    list = [...defaultProjects]
  } else {
    list = projects.value.slice(0, 4).map((p, idx) => {
      const pStat = stats.get(p.slug)
      const progress = pStat ? pStat.progress : (idx === 0 ? 78 : idx === 1 ? 92 : idx === 2 ? 45 : 60)
      return {
        slug: p.slug,
        name: p.slug || p.title,
        progress,
        dotColor: colors[idx % colors.length]
      }
    })
  }

  // Ensure current active project is injected if not already in the top list
  const activeSlug = currentRouteProjectSlug.value
  if (activeSlug && !list.some((p) => p.slug === activeSlug)) {
    const fullProject = projects.value?.find((p) => p.slug === activeSlug)
    const pStat = stats.get(activeSlug)
    if (fullProject) {
      const progress = pStat ? pStat.progress : 50
      list.push({
        slug: fullProject.slug,
        name: fullProject.slug || fullProject.title,
        progress,
        dotColor: colors[list.length % colors.length]
      })
    } else {
      list.push({
        slug: activeSlug,
        name: activeSlug,
        progress: pStat ? pStat.progress : 50,
        dotColor: 'bg-indigo-400'
      })
    }
  }

  return list
})
</script>
