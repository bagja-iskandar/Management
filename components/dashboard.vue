/* dashboard.vue*/

<template>
  <!-- Aksi cepat (search + tombol) -->
  <div>
    <input v-model="q" type="search" placeholder="Cari…" />
    <NuxtLink to="/projects">Tambah Project</NuxtLink>
  </div>

  <!-- KPI Cards sederhana -->
  <div>
    <div v-for="s in stats" :key="s.label">
      <p>{{ s.label }}</p>
      <h3>{{ s.value }}</h3>
      <p>{{ s.delta }} ({{ s.trend }})</p>
    </div>
  </div>

  <!-- Kolom: Quick Actions & Tabel Aktivitas -->
  <div>
    <div>
      <h3>Quick Actions</h3>
      <button @click="newTask()">+ Task baru</button>
      <NuxtLink to="/projects">Kelola projects</NuxtLink>
      <NuxtLink to="/contact">Hubungi saya</NuxtLink>
    </div>

    <div>
      <h3>Aktivitas Terbaru</h3>
      <div>
        <div>
          <span>Nama</span>
          <span>Status</span>
          <span>Tanggal</span>
        </div>

        <div v-for="r in filtered" :key="r.id">
          <span>{{ r.name }}</span>
          <span>{{ r.status }}</span>
          <span>{{ r.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Stat = { label: string; value: string | number; delta: string; trend: 'up' | 'down' }
type Row  = { id: number; name: string; status: 'selesai' | 'proses' | 'todo'; date: string }

const q = ref('')

// Ambil data dari API (SSR-friendly)
const { data: stats }      = await useAsyncData<Stat[]>('stats',      () => $fetch('/api/stats'))
const { data: activities } = await useAsyncData<Row[]> ('activities', () => $fetch('/api/activities'))

// Tabel yang tampil (disaring)
const filtered = computed(() =>
    (activities.value ?? []).filter(r => r.name.toLowerCase().includes(q.value.toLowerCase()))
)

// ========== Aksi ==========
async function newTask() {
  const name = prompt('Nama task baru?')
  if (!name) return
  await $fetch('/api/tasks', { method: 'POST', body: { name } })
  // refresh data
  await Promise.all([
    refreshNuxtData('activities'),
    refreshNuxtData('stats'),
  ])
}

// (opsional) toggle status saat diklik — perlu sedikit ubah template: @click
async function toggleStatus(row: Row) {
  const next = row.status === 'todo' ? 'proses' : row.status === 'proses' ? 'selesai' : 'todo'
  await $fetch(`/api/tasks/${row.id}`, { method: 'PUT', body: { status: next } })
  await Promise.all([
    refreshNuxtData('activities'),
    refreshNuxtData('stats'),
  ])
}
</script>

<style src="../assets/css/dashboard.css" scoped></style>