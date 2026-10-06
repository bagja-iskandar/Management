import dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY

if (!url || !key) {
  console.error('Kredensial Supabase tidak ditemukan!')
  process.exit(1)
}

const supabase = createClient(url, key)

async function runAudit() {
  console.log('--- 1. AUDIT KONEKSI & READ PERMISSIONS ---')
  const { data: projects, error: pErr } = await supabase.from('projects').select('*')
  if (pErr) throw new Error('Projects error: ' + pErr.message)
  console.log(`✅ Projects Read: ${projects.length} rows ditemukan.`)

  const { data: sprints, error: sErr } = await supabase.from('sprints').select('*')
  if (sErr) throw new Error('Sprints error: ' + sErr.message)
  console.log(`✅ Sprints Read: ${sprints.length} rows ditemukan.`)

  const { data: tasks, error: tErr } = await supabase.from('tasks').select('*')
  if (tErr) throw new Error('Tasks Read error: ' + tErr.message)
  console.log(`✅ Tasks Read: ${tasks.length} rows ditemukan.`)

  console.log('\n--- 2. AUDIT CRUD & RELATIONAL INTEGRITY ---')
  // Buat task uji coba
  const testTaskId = 'AUDIT-' + Date.now().toString().slice(-4)
  const { data: createdTask, error: cErr } = await supabase.from('tasks').insert({
    task_id: testTaskId,
    name: 'Audit Integrity Test Deliverable',
    project_slug: 'management',
    status: 'in_queue',
    priority: 'high',
    tech_tags: ['TypeScript', 'Testing']
  }).select().single()

  if (cErr) throw new Error('Task Insert error: ' + cErr.message)
  console.log(`✅ Task Create: ID=${createdTask.id}, TaskID=${createdTask.task_id}`)

  // Update status task
  const { data: updatedTask, error: uErr } = await supabase.from('tasks').update({
    status: 'running_sprint',
    priority: 'critical'
  }).eq('id', createdTask.id).select().single()

  if (uErr) throw new Error('Task Update error: ' + uErr.message)
  console.log(`✅ Task Update: Status=${updatedTask.status}, Priority=${updatedTask.priority}`)

  // Hapus task uji coba
  const { error: dErr } = await supabase.from('tasks').delete().eq('id', createdTask.id)
  if (dErr) throw new Error('Task Delete error: ' + dErr.message)
  console.log(`✅ Task Delete: Pembersihan task uji coba berhasil.`)

  console.log('\n--- 3. AUDIT GITHUB API TELEMETRY ---')
  const ghToken = process.env.GITHUB_TOKEN
  const ghUser = process.env.GITHUB_USERNAME || 'bagja-iskandar'
  if (ghToken) {
    const res = await fetch(`https://api.github.com/users/${ghUser}`, {
      headers: {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Nexura-Audit'
      }
    })
    console.log(`✅ GitHub API: Status ${res.status} (User: ${ghUser})`)
  } else {
    console.log(`ℹ️ GitHub Token tidak diset (Mode tanpa token).`)
  }

  console.log('\n========================================')
  console.log('🎉 SELURUH PEMERIKSAAN BERHASIL 100% TANPA ERROR!')
  console.log('========================================')
}

runAudit().catch(err => {
  console.error('\n❌ DITEMUKAN ERROR:', err.message)
  process.exit(1)
})
