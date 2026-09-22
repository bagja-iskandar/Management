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
        class="w-full max-w-3xl bg-[#09090B] border border-white/[0.08] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden my-auto max-h-[90vh] text-[#F5F2EB]"
        @click.stop
      >
        <!-- ======================================================== -->
        <!-- TERMINAL WINDOW HEADER                                   -->
        <!-- ======================================================== -->
        <div class="px-5 py-3.5 bg-[#111114] border-b border-white/[0.06] flex items-center justify-between gap-4 shrink-0">
          <!-- Left: Title & Subtitle -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-2 h-2 rounded-full bg-[#C98A4B] animate-pulse shrink-0" aria-hidden="true"></span>
            <div class="min-w-0">
              <div class="font-mono text-xs font-bold text-[#F5F2EB] truncate">
                GitHub PRs & Issues Cockpit
              </div>
              <div class="font-mono text-[10px] text-[#756F68] truncate">
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
              class="font-mono text-xs text-[#756F68] hover:text-[#C98A4B] transition-colors inline-flex items-center gap-1 group"
              title="Open repository on GitHub"
            >
              <span>GitHub</span>
              <IconArrowUpRight class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <button
              type="button"
              class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C98A4B] cursor-pointer"
              aria-label="Close modal"
              @click="close"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TAB SWITCHER                                             -->
        <!-- ======================================================== -->
        <div class="px-5 py-2.5 bg-[#111114]/80 border-b border-white/[0.06] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div class="flex items-center gap-1.5" role="tablist">
            <!-- Tab 1: Pull Requests -->
            <button
              type="button"
              role="tab"
              :aria-selected="currentTab === 'prs'"
              class="px-3 py-1.5 rounded-xl font-mono text-xs transition-all border flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
              :class="currentTab === 'prs'
                ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40 font-bold shadow-[0_0_12px_rgba(201,138,75,0.2)]'
                : 'bg-[#18181C] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB] hover:bg-white/5'"
              @click="currentTab = 'prs'"
            >
              <span>🔀</span>
              <span>Pull Requests</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 font-semibold">
                {{ summary?.openPrCount ?? 0 }}
              </span>
            </button>

            <!-- Tab 2: Issues -->
            <button
              type="button"
              role="tab"
              :aria-selected="currentTab === 'issues'"
              class="px-3 py-1.5 rounded-xl font-mono text-xs transition-all border flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
              :class="currentTab === 'issues'
                ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40 font-bold shadow-[0_0_12px_rgba(201,138,75,0.2)]'
                : 'bg-[#18181C] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB] hover:bg-white/5'"
              @click="currentTab = 'issues'"
            >
              <span>🎯</span>
              <span>Issues</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 font-semibold">
                {{ summary?.openIssueCount ?? 0 }}
              </span>
            </button>

            <!-- Tab 3: Quick New Issue -->
            <button
              type="button"
              role="tab"
              :aria-selected="currentTab === 'new_issue'"
              class="px-3 py-1.5 rounded-xl font-mono text-xs transition-all border flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C98A4B]"
              :class="currentTab === 'new_issue'
                ? 'bg-[#C98A4B]/15 text-[#C98A4B] border-[#C98A4B]/40 font-bold shadow-[0_0_12px_rgba(201,138,75,0.2)]'
                : 'bg-[#18181C] text-[#756F68] border-white/[0.06] hover:text-[#F5F2EB] hover:bg-white/5'"
              @click="currentTab = 'new_issue'"
            >
              <span>+</span>
              <span>New Issue</span>
            </button>
          </div>

          <!-- Total Summary Pill -->
          <div class="font-mono text-[11px] text-[#756F68] hidden sm:block">
            <span>{{ (summary?.pullRequests || []).length }} PRs</span>
            <span class="mx-1">·</span>
            <span>{{ (summary?.issues || []).length }} Issues</span>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- TAB CONTENT BODY                                         -->
        <!-- ======================================================== -->
        <div class="p-5 overflow-y-auto space-y-3 max-h-[65vh]">
          <!-- ======================================================== -->
          <!-- TAB 1: PULL REQUESTS STREAM                              -->
          <!-- ======================================================== -->
          <div v-if="currentTab === 'prs'" class="space-y-3">
            <div v-if="pullRequestsList.length > 0" class="space-y-2.5">
              <div
                v-for="pr in pullRequestsList"
                :key="pr.id"
                class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
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
                    <span class="font-mono text-xs text-[#C98A4B] font-bold">
                      #{{ pr.number }}
                    </span>

                    <!-- PR Title -->
                    <span class="font-sans text-xs text-[#F5F2EB] font-semibold truncate max-w-md" :title="pr.title">
                      {{ pr.title }}
                    </span>
                  </div>

                  <!-- Metadata Row: Author + Branches + SHA + Comments -->
                  <div class="flex items-center gap-2.5 font-mono text-[11px] text-[#756F68] flex-wrap">
                    <!-- Author avatar & name -->
                    <div class="inline-flex items-center gap-1.5">
                      <img
                        v-if="pr.authorAvatar"
                        :src="pr.authorAvatar"
                        :alt="pr.authorName"
                        class="w-4 h-4 rounded-full border border-white/10"
                      />
                      <span class="text-[#F5F2EB]/80">{{ pr.authorName }}</span>
                    </div>

                    <span>•</span>

                    <!-- Branch routing -->
                    <div class="inline-flex items-center gap-1 bg-[#18181C] px-2 py-0.5 rounded border border-white/[0.06] text-[10px]">
                      <span class="text-[#C98A4B] font-medium">{{ pr.headBranch }}</span>
                      <span class="text-[#756F68]">➔</span>
                      <span class="text-[#F5F2EB]/80">{{ pr.baseBranch }}</span>
                    </div>

                    <!-- Short commit SHA -->
                    <span v-if="pr.headSha" class="bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] text-[10px] text-[#F5F2EB]">
                      {{ pr.headSha }}
                    </span>

                    <!-- Comments count -->
                    <span v-if="pr.commentsCount > 0" class="inline-flex items-center gap-1 text-[#756F68]">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{{ pr.commentsCount }}</span>
                    </span>

                    <span class="text-[#756F68]/60">{{ formatRelativeTime(pr.updatedAt || pr.createdAt) }}</span>
                  </div>
                </div>

                <!-- Right Action: Open on GitHub Button -->
                <div class="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <a
                    :href="pr.htmlUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-3 py-1.5 rounded-xl bg-[#18181C] hover:bg-white/10 text-[#F5F2EB] font-mono text-xs border border-white/[0.08] hover:border-[#C98A4B]/40 transition-colors inline-flex items-center gap-1.5 group"
                    title="Open PR on GitHub"
                  >
                    <span>Open on GitHub</span>
                    <IconArrowUpRight class="w-3 h-3 text-[#C98A4B] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Empty PR state -->
            <div
              v-else
              class="py-12 flex flex-col items-center justify-center border border-white/[0.06] rounded-2xl bg-[#111114] text-center space-y-2 font-mono"
            >
              <div class="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-lg">
                🔀
              </div>
              <div class="text-xs text-[#F5F2EB] font-medium">No pull requests found.</div>
              <div class="text-[11px] text-[#756F68]">There are currently no pull requests recorded for this repository.</div>
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
                class="p-4 rounded-xl bg-[#111114] border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                <!-- Issue Details -->
                <div class="space-y-1.5 flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Issue Status Pill -->
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border uppercase tracking-wider"
                      :class="issue.state === 'open' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="issue.state === 'open' ? 'bg-emerald-400' : 'bg-red-400'"></span>
                      <span>{{ issue.state === 'open' ? 'Open' : 'Closed' }}</span>
                    </span>

                    <!-- Issue #number -->
                    <span class="font-mono text-xs text-[#C98A4B] font-bold">
                      #{{ issue.number }}
                    </span>

                    <!-- Issue Title -->
                    <span class="font-sans text-xs text-[#F5F2EB] font-semibold truncate max-w-md" :title="issue.title">
                      {{ issue.title }}
                    </span>
                  </div>

                  <!-- Author & Labels Row -->
                  <div class="flex items-center gap-2 font-mono text-[11px] text-[#756F68] flex-wrap">
                    <div class="inline-flex items-center gap-1.5">
                      <img
                        v-if="issue.authorAvatar"
                        :src="issue.authorAvatar"
                        :alt="issue.authorName"
                        class="w-4 h-4 rounded-full border border-white/10"
                      />
                      <span class="text-[#F5F2EB]/80">{{ issue.authorName }}</span>
                    </div>

                    <span>•</span>

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
                    <span v-else class="text-[#756F68]/60 text-[10px]">no labels</span>

                    <span>•</span>

                    <!-- Comments count -->
                    <span v-if="issue.commentsCount > 0" class="inline-flex items-center gap-1 text-[#756F68]">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{{ issue.commentsCount }}</span>
                    </span>

                    <span class="text-[#756F68]/60">{{ formatRelativeTime(issue.updatedAt || issue.createdAt) }}</span>
                  </div>
                </div>

                <!-- Actions: Import to Kanban & Open on GitHub -->
                <div class="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <!-- Import to Kanban Action Button -->
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-xl font-mono text-xs border transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    :class="importedIssues[issue.number]
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-[#C98A4B]/15 hover:bg-[#C98A4B]/25 text-[#C98A4B] border-[#C98A4B]/30 shadow-sm'"
                    :disabled="importingIssueId === issue.id || !!importedIssues[issue.number]"
                    @click="importIssueToKanban(issue)"
                  >
                    <span
                      v-if="importingIssueId === issue.id"
                      class="w-3 h-3 border-2 border-[#C98A4B] border-t-transparent rounded-full animate-spin"
                    ></span>
                    <span v-else-if="importedIssues[issue.number]">✓</span>
                    <span v-else>+</span>
                    <span>{{ importedIssues[issue.number] ? 'Imported' : 'Import to Kanban' }}</span>
                  </button>

                  <!-- Open on GitHub Button -->
                  <a
                    :href="issue.htmlUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="px-2.5 py-1.5 rounded-xl bg-[#18181C] hover:bg-white/10 text-[#756F68] hover:text-[#F5F2EB] font-mono text-xs border border-white/[0.08] transition-colors inline-flex items-center gap-1 group"
                    title="Open Issue on GitHub"
                  >
                    <IconArrowUpRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Empty Issues state -->
            <div
              v-else
              class="py-12 flex flex-col items-center justify-center border border-white/[0.06] rounded-2xl bg-[#111114] text-center space-y-2 font-mono"
            >
              <div class="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-lg">
                🎯
              </div>
              <div class="text-xs text-[#F5F2EB] font-medium">No issues found.</div>
              <div class="text-[11px] text-[#756F68]">There are no open or closed issues in this repository.</div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- TAB 3: QUICK NEW ISSUE FORM                              -->
          <!-- ======================================================== -->
          <div v-else-if="currentTab === 'new_issue'" class="space-y-4">
            <div class="p-4 sm:p-5 rounded-2xl bg-[#111114] border border-white/[0.06] space-y-4">
              <div class="border-b border-white/[0.06] pb-3">
                <h3 class="font-mono text-xs uppercase tracking-wider text-[#F5F2EB] font-bold">
                  Quick Create GitHub Issue
                </h3>
                <p class="font-sans text-xs text-[#756F68] mt-0.5">
                  Publish a new issue directly to <span class="font-mono text-[#C98A4B]">{{ repo }}</span>.
                </p>
              </div>

              <!-- Feedback Banner -->
              <div
                v-if="createdSuccessMessage"
                class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center justify-between gap-2"
              >
                <span>{{ createdSuccessMessage }}</span>
                <button
                  type="button"
                  class="text-emerald-300 hover:text-white font-bold"
                  @click="createdSuccessMessage = ''"
                >
                  ✕
                </button>
              </div>

              <div
                v-if="createdErrorMessage"
                class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs flex items-center justify-between gap-2"
              >
                <span>{{ createdErrorMessage }}</span>
                <button
                  type="button"
                  class="text-red-300 hover:text-white font-bold"
                  @click="createdErrorMessage = ''"
                >
                  ✕
                </button>
              </div>

              <form class="space-y-4 font-mono text-xs" @submit.prevent="submitNewIssue">
                <!-- Title Field -->
                <div class="space-y-1.5">
                  <label for="issue-title" class="text-[#756F68] uppercase text-[11px] font-semibold block">
                    Issue Title *
                  </label>
                  <input
                    id="issue-title"
                    v-model="newIssueForm.title"
                    type="text"
                    required
                    placeholder="e.g. Implement WebSocket heartbeat reconnect logic"
                    class="w-full bg-[#18181C] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:border-[#C98A4B] focus:outline-none transition-colors"
                  />
                </div>

                <!-- Description / Body Field -->
                <div class="space-y-1.5">
                  <label for="issue-body" class="text-[#756F68] uppercase text-[11px] font-semibold block">
                    Description & Specifications (Markdown)
                  </label>
                  <textarea
                    id="issue-body"
                    v-model="newIssueForm.body"
                    rows="5"
                    placeholder="Detailed bug report, reproduction steps, or deliverable requirements..."
                    class="w-full bg-[#18181C] border border-white/[0.08] rounded-xl p-3.5 text-xs text-[#F5F2EB] placeholder:text-[#756F68] focus:ring-1 focus:ring-[#C98A4B] focus:border-[#C98A4B] focus:outline-none transition-colors leading-relaxed"
                  ></textarea>
                </div>

                <!-- Tech Tags / Labels Editor -->
                <div class="space-y-2">
                  <label class="text-[#756F68] uppercase text-[11px] font-semibold block">
                    Issue Labels / Tech Tags
                  </label>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      v-for="(tag, idx) in newIssueForm.techTags"
                      :key="tag"
                      class="inline-flex items-center gap-1.5 font-mono text-xs bg-[#C98A4B]/10 text-[#C98A4B] border border-[#C98A4B]/30 rounded-full px-3 py-1"
                    >
                      <span>{{ tag }}</span>
                      <button
                        type="button"
                        class="hover:text-red-400 font-bold ml-0.5 focus:outline-none"
                        title="Remove label"
                        @click="removeNewIssueTag(idx)"
                      >
                        ×
                      </button>
                    </span>

                    <div class="inline-flex items-center gap-1 bg-[#18181C] border border-white/[0.08] rounded-full p-1 pl-3">
                      <input
                        v-model="newTagInput"
                        type="text"
                        placeholder="+ add label"
                        class="bg-transparent text-xs text-[#F5F2EB] placeholder:text-[#756F68] focus:outline-none w-24 font-mono"
                        @keydown.enter.prevent="addNewIssueTag"
                      />
                      <button
                        type="button"
                        class="w-6 h-6 rounded-full bg-white/5 hover:bg-[#C98A4B] hover:text-[#09090B] text-xs text-[#756F68] flex items-center justify-center transition-colors font-bold"
                        @click="addNewIssueTag"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl text-[#756F68] hover:text-[#F5F2EB] hover:bg-white/5 border border-white/[0.08] transition-colors"
                    @click="resetNewIssueForm"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    class="px-5 py-2.5 rounded-xl bg-[#C98A4B] hover:bg-[#8B6535] text-[#09090B] font-bold shadow-lg shadow-[#C98A4B]/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    :disabled="isSubmittingIssue || !newIssueForm.title.trim()"
                  >
                    <span
                      v-if="isSubmittingIssue"
                      class="w-3.5 h-3.5 border-2 border-[#09090B] border-t-transparent rounded-full animate-spin"
                    ></span>
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
        <div class="px-5 py-3 bg-[#111114] border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-[#756F68] shrink-0">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>REST API v3 Ready</span>
          </div>
          <div>
            <span>Press </span>
            <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-[#F5F2EB] text-[10px] border border-white/10">ESC</kbd>
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
    return 'border-white/[0.1] bg-white/5 text-[#756F68]'
  }
  if (pr.state === 'open') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  }
  return 'border-red-500/30 bg-red-500/10 text-red-400'
}

function getPrDotClass(pr: GitHubPullRequest) {
  if (pr.state === 'merged') return 'bg-purple-400'
  if (pr.draft) return 'bg-[#756F68]'
  if (pr.state === 'open') return 'bg-emerald-400'
  return 'bg-red-400'
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
      color: '#F5F2EB',
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
