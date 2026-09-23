import { getSupabaseClient } from '../utils/supabase'
import { getArray } from '../utils/store'
import type { Project, Task, Sprint } from '~/types'

export default defineNitroPlugin(async () => {
  const client = getSupabaseClient()
  if (!client) {
    console.log('[Supabase Sync] Supabase is not configured. Running in Nitro KV mode.')
    return
  }

  try {
    // 1. Check if tables exist in Supabase
    const { data: remoteProjects, error } = await client
      .from('projects')
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        console.warn('[Supabase Sync] Notice: Database tables not created yet. Please execute migration SQL in your Supabase SQL Editor.')
      } else {
        console.error('[Supabase Sync] Database check error:', error.message)
      }
      return
    }

    // 2. If projects table is empty, auto-migrate local data to Supabase
    if (!remoteProjects || remoteProjects.length === 0) {
      console.log('[Supabase Sync] Remote database is fresh. Migrating local workspace data to Supabase...')

      // Sync Projects
      const localProjects = await getArray<Project>('projects')
      if (localProjects.length > 0) {
        const rows = localProjects.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          description: p.description || '',
          status: p.status || 'active',
          priority: p.priority || 'medium',
          github_repo: p.githubRepo || null,
          deploy_url: p.deployUrl || null,
          tech_stack: p.techStack || [],
          start_date: p.startDate || null,
          due_date: p.dueDate || null,
          created_at: p.createdAt || new Date().toISOString(),
          updated_at: p.updatedAt || new Date().toISOString()
        }))

        const { error: pErr } = await client.from('projects').upsert(rows, { onConflict: 'slug' })
        if (pErr) console.error('[Supabase Sync] Failed to sync projects:', pErr.message)
        else console.log(`[Supabase Sync] Synced ${rows.length} projects to Supabase.`)
      }

      // Sync Sprints
      const localSprints = await getArray<Sprint>('sprints')
      if (localSprints.length > 0) {
        const rows = localSprints.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status || 'active',
          start_date: s.startDate,
          end_date: s.endDate,
          task_ids: s.taskIds || [],
          velocity: s.velocity || 0,
          objective: s.objective || null,
          created_at: s.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: sErr } = await client.from('sprints').upsert(rows, { onConflict: 'id' })
        if (sErr) console.error('[Supabase Sync] Failed to sync sprints:', sErr.message)
        else console.log(`[Supabase Sync] Synced ${rows.length} sprints to Supabase.`)
      }

      // Sync Tasks
      const localTasks = await getArray<Task>('tasks')
      if (localTasks.length > 0) {
        const rows = localTasks.map((t) => ({
          id: t.id,
          task_id: t.taskId || 'ENG-001',
          project_slug: t.projectSlug || 'management',
          name: t.name,
          description: t.description || '',
          status: t.status || 'in_queue',
          priority: t.priority || 'medium',
          tech_tags: t.techTags || [],
          due_date: t.dueDate || null,
          sprint_id: t.sprintId || null,
          date: t.date || null,
          github_issue_url: t.githubIssueUrl || null,
          github_issue_number: t.githubIssueNumber || null,
          github_pr_url: t.githubPrUrl || null,
          created_at: t.createdAt || new Date().toISOString(),
          updated_at: t.updatedAt || new Date().toISOString()
        }))

        const { error: tErr } = await client.from('tasks').upsert(rows, { onConflict: 'task_id' })
        if (tErr) console.error('[Supabase Sync] Failed to sync tasks:', tErr.message)
        else console.log(`[Supabase Sync] Synced ${rows.length} tasks to Supabase.`)
      }

      console.log('[Supabase Sync] Local data migration to Supabase completed!')
    } else {
      console.log('[Supabase Sync] Supabase database is active and connected.')
    }
  } catch (err: any) {
    console.error('[Supabase Sync] Unexpected error during sync check:', err.message)
  }
})
