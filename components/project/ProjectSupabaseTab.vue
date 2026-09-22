<template>
  <div class="space-y-6">
    <!-- Top Supabase Overview Banner -->
    <div class="bg-[#111114] border border-white/[0.07] rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
      <!-- Ambient Emerald/Teal Glow -->
      <div class="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-mono text-xs uppercase tracking-wider text-emerald-400 font-bold">
              SUPABASE CLOUD DATABASE
            </span>
          </div>
          <h2 class="font-mono text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <span>{{ projectRef }}.supabase.co</span>
          </h2>
          <p class="font-mono text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
            <span>Engine: <strong class="text-zinc-200">PostgreSQL 15.1</strong></span>
            <span>•</span>
            <span>Region: <strong class="text-zinc-200">ap-southeast-1 (Singapore)</strong></span>
            <span>•</span>
            <span>Auth: <strong class="text-emerald-400">Enabled</strong></span>
          </p>
        </div>

        <!-- Quick Launch Actions -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/[0.08] font-mono text-xs transition cursor-pointer flex items-center gap-1.5"
            @click="copyUrl"
          >
            <span>{{ copied ? '✓ Copied' : '📋 Copy API URL' }}</span>
          </button>

          <a
            :href="`https://supabase.com/dashboard/project/${projectRef}`"
            target="_blank"
            rel="noopener noreferrer"
            class="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-mono text-xs font-bold transition inline-flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 group"
          >
            <span>Supabase Studio</span>
            <IconArrowUpRight class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>

      <!-- Live Database Metric Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06] font-mono relative z-10">
        <div class="bg-[#18181C] p-3 rounded-xl border border-white/[0.05] space-y-1">
          <span class="text-[10px] text-zinc-500 uppercase">HEALTH STATUS</span>
          <div class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Connected (200 OK)</span>
          </div>
        </div>

        <div class="bg-[#18181C] p-3 rounded-xl border border-white/[0.05] space-y-1">
          <span class="text-[10px] text-zinc-500 uppercase">LATENCY PING</span>
          <div class="text-xs font-bold text-zinc-200">
            28ms (Direct Pooling)
          </div>
        </div>

        <div class="bg-[#18181C] p-3 rounded-xl border border-white/[0.05] space-y-1">
          <span class="text-[10px] text-zinc-500 uppercase">DATABASE SIZE</span>
          <div class="text-xs font-bold text-zinc-200">
            18.4 MB / 500 MB
          </div>
        </div>

        <div class="bg-[#18181C] p-3 rounded-xl border border-white/[0.05] space-y-1">
          <span class="text-[10px] text-zinc-500 uppercase">MIGRATIONS</span>
          <div class="text-xs font-bold text-emerald-400">
            4 Applied (Synced)
          </div>
        </div>
      </div>
    </div>

    <!-- Database Schema Tables & Migrations Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column: Tables Overview (7 cols) -->
      <div class="lg:col-span-7 bg-[#111114] border border-white/[0.07] rounded-2xl p-5 space-y-4 shadow-xl">
        <div class="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#C98A4B]"></span>
            <h3 class="font-mono text-xs font-bold text-zinc-100 uppercase tracking-wider">
              Database Schema Tables
            </h3>
          </div>
          <span class="font-mono text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-white/[0.06]">
            {{ tables.length }} Tables
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="table in tables"
            :key="table.name"
            class="bg-[#18181C] border border-white/[0.05] hover:border-white/[0.1] rounded-xl p-3 transition flex items-center justify-between font-mono text-xs"
          >
            <div class="space-y-0.5 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-zinc-200 font-bold">public.{{ table.name }}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                  PK: {{ table.pk }}
                </span>
              </div>
              <p class="text-[11px] text-zinc-500 font-sans">
                {{ table.description }}
              </p>
            </div>

            <div class="text-right shrink-0">
              <span class="text-emerald-400 font-bold">{{ table.rows }}</span>
              <span class="text-zinc-500 text-[10px] block">records</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Migrations & Edge Functions (5 cols) -->
      <div class="lg:col-span-5 space-y-4">
        <!-- Migrations List -->
        <div class="bg-[#111114] border border-white/[0.07] rounded-2xl p-4 space-y-3 shadow-xl font-mono text-xs">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span class="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              Database Migrations Timeline
            </span>
            <span class="text-[9px] text-emerald-400">All Synced</span>
          </div>

          <div class="space-y-2">
            <div
              v-for="m in migrations"
              :key="m.name"
              class="p-2.5 rounded-lg bg-[#18181C] border border-white/[0.04] space-y-1 text-[11px]"
            >
              <div class="flex items-center justify-between">
                <span class="text-zinc-300 font-bold truncate">{{ m.name }}</span>
                <span class="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  Applied
                </span>
              </div>
              <span class="text-[10px] text-zinc-500 block">{{ m.date }}</span>
            </div>
          </div>
        </div>

        <!-- Edge Functions -->
        <div class="bg-[#111114] border border-white/[0.07] rounded-2xl p-4 space-y-3 shadow-xl font-mono text-xs">
          <div class="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span class="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
              Edge Functions
            </span>
            <span class="text-[9px] text-zinc-500">2 Active</span>
          </div>

          <div class="space-y-2">
            <div class="p-2.5 rounded-lg bg-[#18181C] border border-white/[0.04] flex items-center justify-between">
              <div>
                <span class="text-zinc-200 font-bold block">github-webhook-sync</span>
                <span class="text-[10px] text-zinc-500">Trigger: POST /webhook</span>
              </div>
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            <div class="p-2.5 rounded-lg bg-[#18181C] border border-white/[0.04] flex items-center justify-between">
              <div>
                <span class="text-zinc-200 font-bold block">telemetry-watchdog</span>
                <span class="text-[10px] text-zinc-500">Cron: 5m heartbeat</span>
              </div>
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Project } from '~/types'

const props = defineProps<{
  project: Project
}>()

const copied = ref(false)
const projectRef = ref('wtxbclkyvqrmndjzoepk')

const tables = ref([
  { name: 'tasks', pk: 'id', rows: 12, description: 'Kanban tasks, status lifecycle, due dates, priority' },
  { name: 'projects', pk: 'slug', rows: 4, description: 'Workspace project repositories and deploy URLs' },
  { name: 'sprints', pk: 'id', rows: 2, description: 'Active and planned weekly milestone sprints' },
  { name: 'activities', pk: 'id', rows: 45, description: 'Audit log of task transfers and GitHub sync events' }
])

const migrations = ref([
  { name: '20260920_03_telemetry_schema.sql', date: 'Applied 1 hour ago' },
  { name: '20260919_02_add_github_fields.sql', date: 'Applied 1 day ago' },
  { name: '20260918_01_initial_core_schema.sql', date: 'Applied 2 days ago' }
])

function copyUrl() {
  navigator.clipboard.writeText(`https://${projectRef.value}.supabase.co`)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>
