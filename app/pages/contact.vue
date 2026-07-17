<template>
  <section class="contact-page">
    <div class="page-heading">
      <div>
        <h1>Contact</h1>
        <p>Hubungi tim pengembang atau kirim pesan singkat mengenai proyek ini.</p>
      </div>
      <NuxtLink to="/" class="button">Kembali ke Dashboard</NuxtLink>
    </div>

    <div class="contact-card">
      <form class="contact-form" @submit.prevent="sendMessage">
        <label>
          Nama
          <input v-model="name" type="text" placeholder="Nama Anda" required />
        </label>

        <label>
          Email
          <input v-model="email" type="email" placeholder="email@domain.com" required />
        </label>

        <label>
          Pesan
          <textarea v-model="message" placeholder="Tuliskan pesan Anda..." rows="5" required></textarea>
        </label>

        <button type="submit" class="button" :disabled="isSending">Kirim Pesan</button>
      </form>

      <div class="contact-note">
        <p>Form ini saat ini bersifat demo. Integrasi backend / notifikasi email akan ditambahkan sebagai pengembangan berikutnya.</p>
      </div>

      <div v-if="feedback" class="feedback" role="status" aria-live="polite" aria-atomic="true">{{ feedback }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
const name = ref('')
const email = ref('')
const message = ref('')
const isSending = ref(false)
const feedback = ref('')

function sendMessage() {
  isSending.value = true
  feedback.value = 'Pesan berhasil disiapkan. Ini demo dan belum mengirimkan email.'
  setTimeout(() => {
    isSending.value = false
    name.value = ''
    email.value = ''
    message.value = ''
  }, 600)
}
</script>
