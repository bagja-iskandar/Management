// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['../assets/css/main.css'],
  app: {
    head: {
      title: 'Management Dashboard',
      meta: [{ name: 'description', content: 'Portfolio-ready management dashboard built with Nuxt 4.' }]
    }
  },
  devtools: { enabled: true }
})
