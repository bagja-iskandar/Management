<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      :aria-label="`GitHub PRs & Issues Cockpit for ${repo}`"
      tabindex="-1"
      @click.self="close"
    >
      <div
        class="w-full max-w-4xl bg-[#111318] border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto max-h-[90vh] text-[#F3F4F6]"
        @click.stop
      >
        <!-- ======================================================== -->
        <!-- TERMINAL WINDOW HEADER                                   -->
        <!-- ======================================================== -->
        <div class="px-5 py-3.5 bg-[#0D0F12] border-b border-white/[0.07] flex items-center justify-between gap-4 shrink-0">
          <!-- Left: Title & Subtitle -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" aria-hidden="true"></span>
            <div class="min-w-0">
              <div class="font-sans text-sm font-semibold text-[#F3F4F6] truncate">
                GitHub PRs & Issues Cockpit
              </div>
              <div class="font-mono text-xs text-[#8A8F9E] truncate">
                telemetry://cockpit/{{ repo || 'bagja-iskandar/Management' }}
              </div>
            </div>
          </div>

          <!-- Right: GitHub External Link & Close Button -->
          <div class="flex items-center gap-2.5 shrink-0">
            <a
              v-if="repo"
              :href="`https://github.com/${repo}`"
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-xs text-[#8A8F9E] hover:text-[#F3F4F6] transition-colors inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] group"
              title="Open repository on GitHub"
            >
              <span>GitHub</span>
              <NexuraIcon name="ExternalLink" size="xs" class="text-[#8A8F9E] group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <button
              type="button"
              class="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] border border-white/[0.06] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
              aria-label="Close modal"
              @click="close"
            >
              <NexuraIcon name="X" size="sm" />
            </button>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TAB SWITCHER                                             -->
        <!-- ======================================================== -->
        <div class="px-5 py-2.5 bg-[#0D0F12]/80 border-b border-white/[0.07] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div class="p-1 rounded-lg bg-[#07080A] border border-white/[0.06] inline-flex items-center gap-1" role="tablist">
            <!-- Tab 1: Pull Requests -->
            <button
              type="button"
              role="tab"
              :aria-selected="currentTab === 'prs'"
              class="px-3 py-1.5 rounded-md font-mono text-xs transition-all border flex items-center gap-1.5 cursor-pointer focus:outline-none"
              :class="currentTab === 'prs'
                ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
                : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
              @click="currentTab = 'prs'"
            >
              <NexuraIcon name="GitPullRequest" size="xs" class="text-indigo-400" />
              <span>Pull Requests</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] font-mono tabular-nums">
                {{ summary?.openPrCount ?? 0 }}
              </span>
            </button>

            <!-- Tab 2: Issues -->
            <button
              type="button"
              role="tab"
              :aria-selected="currentTab === 'issues'"
              class="px-3 py-1.5 rounded-md font-mono text-xs transition-all border flex items-center gap-1.5 cursor-pointer focus:outline-none"
              :class="currentTab === 'issues'
                ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
                : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
              @click="currentTab = 'issues'"
            >
              <NexuraIcon name="CircleDot" size="xs" class="text-amber-400" />
              <span>Issues</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] font-mono tabular-nums">
                {{ summary?.openIssueCount ?? 0 }}
              </span>
            </button>

            <!-- Tab 3: Quick New Issue -->
            <button
              type="button"
              role="tab"
              :aria-selected="currentTab === 'new_issue'"
              class="px-3 py-1.5 rounded-md font-mono text-xs transition-all border flex items-center gap-1.5 cursor-pointer focus:outline-none"
              :class="currentTab === 'new_issue'
                ? 'bg-white/[0.08] text-[#F3F4F6] border-white/[0.1] shadow-inner font-semibold'
                : 'text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.03] border-transparent'"
              @click="currentTab = 'new_issue'"
            >
              <NexuraIcon name="Plus" size="xs" />
              <span>New Issue</span>
            </button>
          </div>

          <!-- Total Summary Pill -->
          <div class="font-mono tabular-nums text-xs text-[#8A8F9E] hidden sm:flex items-center gap-2">
            <span>{{ (summary?.pullRequests || []).length }} PRs</span>
            <span class="text-white/20">·</span>
            <span>{{ (summary?.issues || []).length }} Issues</span>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TAB CONTENT BODY                                         -->
        <!-- ======================================================== -->
        <div class="p-5 overflow-y-auto space-y-3 max-h-[65vh] bg-[#111318]">
          <!-- ======================================================== -->
          <!-- TAB 1: PULL REQUESTS STREAM                              -->
          <!-- ======================================================== -->
          <div v-if="currentTab === 'prs'" class="space-y-3">
            <div v-if="pullRequestsList.length > 0" class="space-y-2.5">
              <div
                v-for="pr in pullRequestsList"
                :key="pr.id"
                class="p-4 rounded-xl bg-[#0D0F12] border border-white/[0.07] hover:border-white/[0.14] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                <!-- PR Details -->
                <div class="space-y-1.5 flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- PR Status Pill -->
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border uppercase tracking-wider"
                      :class="getPrBadgeClass(pr)"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="getPrDotClass(pr)"></span>
                      <span>{{ getPrStatusText(pr) }}</span>
                    </span>

                    <!-- PR Number -->
                    <span class="font-mono tabular-nums text-xs text-indigo-400 font-semibold">
                      #{{ pr.number }}
                    </span>

                    <!-- PR Title -->
                    <span class="font-sans text-xs text-[#F3F4F6] font-semibold truncate max-w-md" :title="pr.title">
                      {{ pr.title }}
                    </span>
                  </div>

                  <!-- Metadata Row: Author + Branches + SHA + Comments -->
                  <div class="flex items-center gap-2.5 font-mono text-xs text-[#8A8F9E] flex-wrap">
                    <!-- Author avatar & name -->
                    <div class="inline-flex items-center gap-1.5">
                      <img
                        v-if="pr.authorAvatar"
                        :src="pr.authorAvatar"
                        :alt="pr.authorName"
                        class="w-4 h-4 rounded-full border border-white/10"
                      />
                      <span class="text-[#8A8F9E]">{{ pr.authorName }}</span>
                    </div>

                    <span class="text-white/20">•</span>

                    <!-- Branch routing -->
                    <div class="inline-flex items-center gap-1.5 bg-[#07080A] px-2 py-0.5 rounded border border-white/[0.06] text-[10px]">
                      <span class="text-indigo-400 font-medium">{{ pr.headBranch }}</span>
                      <NexuraIcon name="ArrowRight" size="xs" class="text-[#565B68]" />
                      <span class="text-[#F3F4F6]/80">{{ pr.baseBranch }}</span>
                    </div>

                    <!-- Short commit SHA -->
                    <span v-if="pr.headSha" class="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] text-[10px] text-[#F3F4F6]">
                      {{ pr.headSha }}
                    </span>

                    <!-- Comments count -->
                    <span v-if="pr.commentsCount > 0" class="inline-flex items-center gap-1 text-[#8A8F9E]">
                      <NexuraIcon name="MessageSquare" size="xs" class="text-[#8A8F9E]" />
                      <span class="font-mono tabular-nums">{{ pr.commentsCount }}</span>
                    </span>

                    <span class="text-white/20">•</span>
                    <span class="text-[#8A8F9E]">{{ formatRelativeTime(pr.updatedAt || pr.createdAt) }}</span>
                  </div>
                </div>

                <!-- Right Action: Open on GitHub Button -->
                <div class="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <a
                    :href="pr.htmlUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F3F4F6] font-mono text-xs border border-white/[0.08] hover:border-indigo-500/40 transition-colors inline-flex items-center gap-1.5 group cursor-pointer"
                    title="Open PR on GitHub"
                  >
                    <span>Open on GitHub</span>
                    <NexuraIcon name="ExternalLink" size="xs" class="text-[#8A8F9E] group-hover:text-indigo-400 transition-colors" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Empty PR state -->
            <div
              v-else
              class="py-12 flex flex-col items-center justify-center border border-white/[0.07] rounded-xl bg-[#0D0F12] text-center space-y-2 font-mono"
            >
              <div class="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#565B68]">
                <NexuraIcon name="GitPullRequest" size="md" />
              </div>
              <div class="text-xs text-[#F3F4F6] font-medium">No pull requests found.</div>
              <div class="text-xs text-[#8A8F9E]">There are currently no pull requests recorded for this repository.</div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- TAB 2: ISSUES STREAM                                     -->
          <!-- ======================================================== -->
          <div v-else-if="currentTab === 'issues'" class="space-y-3">
            <div v-if="issuesList.length > 0" class="space-y-2.5">
              <div
                v-for="issue in issuesList"
                :key="issue.id"
                class="p-4 rounded-xl bg-[#0D0F12] border border-white/[0.07] hover:border-white/[0.14] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                <!-- Issue Details -->
                <div class="space-y-1.5 flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Issue Status Pill -->
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border uppercase tracking-wider"
                      :class="issue.state === 'open' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="issue.state === 'open' ? 'bg-emerald-400' : 'bg-rose-400'"></span>
                      <span>{{ issue.state === 'open' ? 'Open' : 'Closed' }}</span>
                    </span>

                    <!-- Issue #number -->
                    <span class="font-mono tabular-nums text-xs text-indigo-400 font-semibold">
                      #{{ issue.number }}
                    </span>

                    <!-- Issue Title -->
                    <span class="font-sans text-xs text-[#F3F4F6] font-semibold truncate max-w-md" :title="issue.title">
                      {{ issue.title }}
                    </span>
                  </div>

                  <!-- Author & Labels Row -->
                  <div class="flex items-center gap-2 font-mono text-xs text-[#8A8F9E] flex-wrap">
                    <div class="inline-flex items-center gap-1.5">
                      <img
                        v-if="issue.authorAvatar"
                        :src="issue.authorAvatar"
                        :alt="issue.authorName"
                        class="w-4 h-4 rounded-full border border-white/10"
                      />
                      <span class="text-[#8A8F9E]">{{ issue.authorName }}</span>
                    </div>

                    <span class="text-white/20">•</span>

                    <!-- Subtle Labels Pills -->
                    <div v-if="issue.labels && issue.labels.length > 0" class="flex items-center gap-1 flex-wrap">
                      <span
                        v-for="lbl in issue.labels"
                        :key="lbl.name"
                        class="px-2 py-0.2 rounded-full font-mono text-[10px] border"
                        :style="getLabelStyle(lbl.color)"
                      >
                        {{ lbl.name }}
                      </span>
                    </div>
                    <span v-else class="text-[#565B68] text-[10px]">no labels</span>

                    <span class="text-white/20">•</span>

                    <!-- Comments count -->
                    <span v-if="issue.commentsCount > 0" class="inline-flex items-center gap-1 text-[#8A8F9E]">
                      <NexuraIcon name="MessageSquare" size="xs" class="text-[#8A8F9E]" />
                      <span class="font-mono tabular-nums">{{ issue.commentsCount }}</span>
                    </span>

                    <span class="text-white/20">•</span>
                    <span class="text-[#8A8F9E]">{{ formatRelativeTime(issue.updatedAt || issue.createdAt) }}</span>
                  </div>
                </div>

                <!-- Actions: Import to Kanban & Open on GitHub -->
                <div class="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <!-- Import to Kanban Action Button -->
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-lg font-mono text-xs border transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    :class="importedIssues[issue.number]
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30 shadow-sm'"
                    :disabled="importingIssueId === issue.id || !!importedIssues[issue.number]"
                    @click="importIssueToKanban(issue)"
                  >
                    <NexuraIcon
                      v-if="importingIssueId === issue.id"
                      name="RotateCw"
                      size="xs"
                      class="animate-spin text-indigo-400"
                    />
                    <NexuraIcon
                      v-else-if="importedIssues[issue.number]"
                      name="Check"
                      size="xs"
                      class="text-emerald-400"
                    />
                    <NexuraIcon
                      v-else
                      name="Plus"
                      size="xs"
                      class="text-indigo-400"
                    />
                    <span>{{ importedIssues[issue.number] ? 'Imported' : 'Import to Kanban' }}</span>
                  </button>

                  <!-- Open on GitHub Button -->
                  <a
                    :href="issue.htmlUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F9E] hover:text-[#F3F4F6] font-mono text-xs border border-white/[0.08] transition-colors inline-flex items-center gap-1 group cursor-pointer"
                    title="Open Issue on GitHub"
                  >
                    <NexuraIcon name="ExternalLink" size="xs" class="text-[#8A8F9E] group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Empty Issues state -->
            <div
              v-else
              class="py-12 flex flex-col items-center justify-center border border-white/[0.07] rounded-xl bg-[#0D0F12] text-center space-y-2 font-mono"
            >
              <div class="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#565B68]">
                <NexuraIcon name="CircleDot" size="md" />
              </div>
              <div class="text-xs text-[#F3F4F6] font-medium">No issues found.</div>
              <div class="text-xs text-[#8A8F9E]">There are no open or closed issues in this repository.</div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- TAB 3: QUICK NEW ISSUE FORM                              -->
          <!-- ======================================================== -->
          <div v-else-if="currentTab === 'new_issue'" class="space-y-4">
            <div class="p-4 sm:p-5 rounded-xl bg-[#0D0F12] border border-white/[0.07] space-y-4">
              <div class="border-b border-white/[0.06] pb-3">
                <h3 class="font-mono text-xs uppercase tracking-wider text-[#F3F4F6] font-bold">
                  Quick Create GitHub Issue
                </h3>
                <p class="font-sans text-xs text-[#8A8F9E] mt-0.5">
                  Publish a new issue directly to <span class="font-mono text-indigo-400">{{ repo }}</span>.
                </p>
              </div>

              <!-- Feedback Banner -->
              <div
                v-if="createdSuccessMessage"
                class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <NexuraIcon name="Check" size="xs" class="shrink-0 text-emerald-400" />
                  <span>{{ createdSuccessMessage }}</span>
                </div>
                <button
                  type="button"
                  class="text-emerald-400 hover:text-white p-1 rounded hover:bg-emerald-500/20 cursor-pointer"
                  @click="createdSuccessMessage = ''"
                >
                  <NexuraIcon name="X" size="xs" />
                </button>
              </div>

              <div
                v-if="createdErrorMessage"
                class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <NexuraIcon name="AlertCircle" size="xs" class="shrink-0 text-rose-400" />
                  <span>{{ createdErrorMessage }}</span>
                </div>
                <button
                  type="button"
                  class="text-rose-400 hover:text-white p-1 rounded hover:bg-rose-500/20 cursor-pointer"
                  @click="createdErrorMessage = ''"
                >
                  <NexuraIcon name="X" size="xs" />
                </button>
              </div>

              <form class="space-y-4 font-mono text-xs" @submit.prevent="submitNewIssue">
                <!-- Title Field -->
                <div class="space-y-1.5">
                  <label for="issue-title" class="text-[#8A8F9E] uppercase text-[11px] font-semibold block">
                    Issue Title *
                  </label>
                  <input
                    id="issue-title"
                    v-model="newIssueForm.title"
                    type="text"
                    required
                    placeholder="e.g. Implement WebSocket heartbeat reconnect logic"
                    class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-colors"
                  />
                </div>

                <!-- Description / Body Field -->
                <div class="space-y-1.5">
                  <label for="issue-body" class="text-[#8A8F9E] uppercase text-[11px] font-semibold block">
                    Description & Specifications (Markdown)
                  </label>
                  <textarea
                    id="issue-body"
                    v-model="newIssueForm.body"
                    rows="5"
                    placeholder="Detailed bug report, reproduction steps, or deliverable requirements..."
                    class="w-full bg-[#07080A] border border-white/[0.08] rounded-lg p-3.5 text-xs text-[#F3F4F6] placeholder-[#565B68] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-colors leading-relaxed"
                  ></textarea>
                </div>

                <!-- Tech Tags / Labels Editor -->
                <div class="space-y-2">
                  <label class="text-[#8A8F9E] uppercase text-[11px] font-semibold block">
                    Issue Labels / Tech Tags
                  </label>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      v-for="(tag, idx) in newIssueForm.techTags"
                      :key="tag"
                      class="inline-flex items-center gap-1.5 font-mono text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full px-2.5 py-0.5"
                    >
                      <span>{{ tag }}</span>
                      <button
                        type="button"
                        class="hover:text-rose-400 ml-0.5 focus:outline-none cursor-pointer"
                        title="Remove label"
                        @click="removeNewIssueTag(idx)"
                      >
                        <NexuraIcon name="X" size="xs" />
                      </button>
                    </span>

                    <div class="inline-flex items-center gap-1 bg-[#07080A] border border-white/[0.08] rounded-full p-1 pl-3">
                      <input
                        v-model="newTagInput"
                        type="text"
                        placeholder="+ add label"
                        class="bg-transparent text-xs text-[#F3F4F6] placeholder-[#565B68] focus:outline-none w-24 font-mono"
                        @keydown.enter.prevent="addNewIssueTag"
                      />
                      <button
                        type="button"
                        class="w-5 h-5 rounded-full bg-white/[0.06] hover:bg-indigo-500 hover:text-white text-xs text-[#8A8F9E] flex items-center justify-center transition-colors cursor-pointer"
                        @click="addNewIssueTag"
                      >
                        <NexuraIcon name="Plus" size="xs" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg text-[#8A8F9E] hover:text-[#F3F4F6] hover:bg-white/[0.04] border border-white/[0.08] text-xs font-mono transition-colors cursor-pointer"
                    @click="resetNewIssueForm"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    class="px-5 py-2 rounded-lg bg-[#F3F4F6] hover:bg-white text-[#07080A] text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    :disabled="isSubmittingIssue || !newIssueForm.title.trim()"
                  >
                    <NexuraIcon
                      v-if="isSubmittingIssue"
                      name="RotateCw"
                      size="xs"
                      class="animate-spin text-[#07080A]"
                    />
                    <span>{{ isSubmittingIssue ? 'Submitting to GitHub...' : 'Submit Issue to GitHub' }}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TERMINAL MODAL FOOTER                                    -->
        <!-- ======================================================== -->
        <div class="px-5 py-3 bg-[#0D0F12] border-t border-white/[0.07] flex items-center justify-between text-xs font-mono text-[#8A8F9E] shrink-0">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>REST API v3 Ready</span>
          </div>

          <div>
            <span>Press </span>
            <kbd class="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#F3F4F6] text-[10px] border border-white/[0.08] font-mono">ESC</kbd>
            <span> to close</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { createGitHubIssue } from '../composables/useGitHub'
import type { GitHubRepoActivitySummary, GitHubPullRequest, GitHubIssueItem } from '../types'
import NexuraIcon from './ui/NexuraIcon.vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    repo: string
    projectSlug?: string
    summary?: GitHubRepoActivitySummary | null
  }>(),
  {
    projectSlug: '',
    summary: null
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'issueCreated', issue: { number: number; title: string; htmlUrl: string }): void
  (e: 'taskImported', task: any): void
}>()

const currentTab = ref<'prs' | 'issues' | 'new_issue'>('prs')

function close() {
  emit('close')
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeyDown)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeyDown)
  }
})

const pullRequestsList = computed<GitHubPullRequest[]>(() => props.summary?.pullRequests || [])
const issuesList = computed<GitHubIssueItem[]>(() => props.summary?.issues || [])

// PR Badges formatting
function getPrBadgeClass(pr: GitHubPullRequest) {
  if (pr.state === 'merged') {
    return 'border-purple-500/30 bg-purple-500/10 text-purple-400'
  }
  if (pr.draft) {
    return 'border-white/[0.1] bg-white/[0.04] text-[#8A8F9E]'
  }
  if (pr.state === 'open') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  }
  return 'border-rose-500/30 bg-rose-500/10 text-rose-400'
}

function getPrDotClass(pr: GitHubPullRequest) {
  if (pr.state === 'merged') return 'bg-purple-400'
  if (pr.draft) return 'bg-[#8A8F9E]'
  if (pr.state === 'open') return 'bg-emerald-400'
  return 'bg-rose-400'
}

function getPrStatusText(pr: GitHubPullRequest) {
  if (pr.state === 'merged') return 'Merged'
  if (pr.draft) return 'Draft'
  if (pr.state === 'open') return 'Open'
  return 'Closed'
}

// Issue Labels Styling helper
function getLabelStyle(colorHex?: string) {
  if (!colorHex) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#F3F4F6',
      borderColor: 'rgba(255, 255, 255, 0.1)'
    }
  }
  const cleanHex = colorHex.replace('#', '')
  return {
    backgroundColor: `#${cleanHex}15`,
    color: `#${cleanHex}`,
    borderColor: `#${cleanHex}40`
  }
}

// Relative time formatter
function formatRelativeTime(dateString?: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

// ========================================================
// IMPORT ISSUE TO KANBAN ACTION
// ========================================================
const importingIssueId = ref<number | null>(null)
const importedIssues = reactive<Record<number, boolean>>({})

async function importIssueToKanban(issue: GitHubIssueItem) {
  if (importingIssueId.value || importedIssues[issue.number]) return
  importingIssueId.value = issue.id

  try {
    const techTags = (issue.labels || []).map((l) => l.name)
    const taskPayload = {
      name: issue.title,
      description: `Imported from GitHub Issue #${issue.number}\nURL: ${issue.htmlUrl}`,
      projectSlug: props.projectSlug || undefined,
      githubIssueUrl: issue.htmlUrl,
      githubIssueNumber: issue.number,
      techTags: techTags.length > 0 ? techTags : ['github-issue'],
      status: 'in_queue',
      priority: 'medium'
    }

    const created = await $fetch('/api/tasks', {
      method: 'POST',
      body: taskPayload
    })

    importedIssues[issue.number] = true
    emit('taskImported', created)
  } catch (err: any) {
    console.error('Failed to import issue to Kanban:', err)
  } finally {
    importingIssueId.value = null
  }
}

// ========================================================
// QUICK NEW ISSUE FORM
// ========================================================
const isSubmittingIssue = ref(false)
const createdSuccessMessage = ref('')
const createdErrorMessage = ref('')
const newTagInput = ref('')

const newIssueForm = reactive({
  title: '',
  body: '',
  techTags: [] as string[]
})

function addNewIssueTag() {
  const tag = newTagInput.value.trim().toLowerCase()
  if (tag && !newIssueForm.techTags.includes(tag)) {
    newIssueForm.techTags.push(tag)
  }
  newTagInput.value = ''
}

function removeNewIssueTag(index: number) {
  newIssueForm.techTags.splice(index, 1)
}

function resetNewIssueForm() {
  newIssueForm.title = ''
  newIssueForm.body = ''
  newIssueForm.techTags = []
  newTagInput.value = ''
  createdSuccessMessage.value = ''
  createdErrorMessage.value = ''
}

async function submitNewIssue() {
  if (!newIssueForm.title.trim() || isSubmittingIssue.value) return
  isSubmittingIssue.value = true
  createdSuccessMessage.value = ''
  createdErrorMessage.value = ''

  try {
    const res = await createGitHubIssue({
      repo: props.repo,
      title: newIssueForm.title.trim(),
      body: newIssueForm.body.trim() || undefined,
      labels: newIssueForm.techTags.length > 0 ? newIssueForm.techTags : undefined
    })

    if (res.ok && res.issue) {
      createdSuccessMessage.value = `Issue #${res.issue.number} "${res.issue.title}" successfully created on GitHub!`
      emit('issueCreated', res.issue)
      newIssueForm.title = ''
      newIssueForm.body = ''
      newIssueForm.techTags = []
    } else {
      createdErrorMessage.value = 'Failed to create GitHub issue.'
    }
  } catch (err: any) {
    console.error('Failed to create issue:', err)
    createdErrorMessage.value = err?.data?.statusMessage || err?.message || 'Error creating issue.'
  } finally {
    isSubmittingIssue.value = false
  }
}
</script>
