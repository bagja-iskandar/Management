<template>
  <section class="contact-page">
    <div class="page-heading">
      <div>
        <h1>Contact</h1>
        <p>Get in touch with the development team or send a quick message regarding this project.</p>
      </div>
      <NuxtLink to="/" class="button">Back to Dashboard</NuxtLink>
    </div>

    <div class="contact-card">
      <form class="contact-form" @submit.prevent="sendMessage">
        <label>
          Name
          <input v-model="name" type="text" placeholder="Your Name" required />
        </label>

        <label>
          Email
          <input v-model="email" type="email" placeholder="email@domain.com" required />
        </label>

        <label>
          Message
          <textarea v-model="message" placeholder="Write your message..." rows="5" required></textarea>
        </label>

        <button type="submit" class="button" :disabled="isSending">Send Message</button>
      </form>

      <div class="contact-note">
        <p>This form is currently a demo. Backend integration and email notifications will be added in upcoming updates.</p>
      </div>

      <div v-if="feedback" class="feedback" role="status" aria-live="polite" aria-atomic="true">{{ feedback }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const name = ref('')
const email = ref('')
const message = ref('')
const isSending = ref(false)
const feedback = ref('')
let feedbackTimer: ReturnType<typeof setTimeout> | null = null

function sendMessage() {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
    feedbackTimer = null
  }

  isSending.value = true
  feedback.value = 'Message prepared successfully. This is a demo and email was not actually sent.'
  setTimeout(() => {
    isSending.value = false
    name.value = ''
    email.value = ''
    message.value = ''
  }, 600)

  feedbackTimer = setTimeout(() => {
    feedback.value = ''
    feedbackTimer = null
  }, 5000)
}

onUnmounted(() => {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
  }
})
</script>
