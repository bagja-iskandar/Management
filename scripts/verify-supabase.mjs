import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY

if (!url || !key) {
  console.error('❌ SUPABASE_URL atau SUPABASE_SERVICE_KEY belum terisi di .env')
  process.exit(1)
}

const supabase = createClient(url, key)

async function verify() {
  console.log('📡 Menghubungkan ke Supabase:', url)
  
  // 1. Cek tabel projects
  const { data: projects, error: pErr } = await supabase.from('projects').select('*').limit(5)
  if (pErr) {
    if (pErr.code === 'PGRST205' || pErr.message?.includes('schema cache')) {
      console.log('\n⚠️  Tabel database belum dibuat di Supabase.')
      console.log('👉 Silakan buka SQL Editor Supabase Anda:')
      console.log(`   https://supabase.com/dashboard/project/${url.replace('https://', '').replace('.supabase.co', '')}/sql/new`)
      console.log('👉 Paste dan RUN isi file: server/database/migrations/001_create_nexura_tables.sql\n')
      process.exit(0)
    } else {
      console.error('❌ Error query Supabase:', pErr)
      process.exit(1)
    }
  }

  console.log('✅ Tabel `projects` terdeteksi di Supabase!')
  
  // 2. Cek tabel sprints & tasks
  const { error: sErr } = await supabase.from('sprints').select('id').limit(1)
  const { error: tErr } = await supabase.from('tasks').select('id').limit(1)

  if (sErr || tErr) {
    console.error('⚠️  Sebagian tabel belum siap:', { sErr, tErr })
    process.exit(1)
  }

  console.log('✅ Tabel `sprints` dan `tasks` terdeteksi di Supabase!')

  // 3. Auto-seed dari local data jika masih kosong
  if (projects.length === 0) {
    console.log('📦 Supabase masih kosong. Melakukan migrasi data lokal...')
    const readLocal = (file) => {
      const p = path.join(process.cwd(), '.data', 'kv', file)
      return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : []
    }

    const localProjects = readLocal('projects')
    if (localProjects.length > 0) {
      const rows = localProjects.map(p => ({
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
      const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'slug' })
      if (error) console.error('Gagal migrasi projects:', error.message)
      else console.log(`✨ Berhasil migrasi ${rows.length} projects ke Supabase!`)
    }

    const localSprints = readLocal('sprints')
    if (localSprints.length > 0) {
      const rows = localSprints.map(s => ({
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
      const { error } = await supabase.from('sprints').upsert(rows, { onConflict: 'id' })
      if (error) console.error('Gagal migrasi sprints:', error.message)
      else console.log(`✨ Berhasil migrasi ${rows.length} sprints ke Supabase!`)
    }

    const localTasks = readLocal('tasks')
    if (localTasks.length > 0) {
      const rows = localTasks.map(t => ({
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
      const { error } = await supabase.from('tasks').upsert(rows, { onConflict: 'task_id' })
      if (error) console.error('Gagal migrasi tasks:', error.message)
      else console.log(`✨ Berhasil migrasi ${rows.length} tasks ke Supabase!`)
    }
  } else {
    console.log(`ℹ️  Supabase sudah memiliki data (${projects.length} projects ditemukan).`)
  }

  console.log('\n🎉 INTEGRASI SUPABASE 100% SUKSES DAN AKTIF!\n')
}

verify().catch(console.error)
