import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-20',
  telemetry: false,
  alias: {
    '~/types': fileURLToPath(new URL('./types', import.meta.url)),
    '@/types': fileURLToPath(new URL('./types', import.meta.url)),
    '~~/types': fileURLToPath(new URL('./types', import.meta.url)),
    '@@/types': fileURLToPath(new URL('./types', import.meta.url))
  },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~~/assets/css/main.css'],
  tailwindcss: {
    cssPath: '~~/assets/css/main.css',
    configPath: 'tailwind.config'
  },
  components: ['~~/components'],
  imports: {
    dirs: [
      '../composables',
      '../composables/**',
      'composables',
      'composables/**'
    ]
  },
  runtimeConfig: {
    githubToken: process.env.GITHUB_TOKEN || '',
    githubUsername: process.env.GITHUB_USERNAME || 'bagja-iskandar',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '',
    vercelToken: process.env.VERCEL_TOKEN || '',
    public: {
      githubUsername: process.env.GITHUB_USERNAME || 'bagja-iskandar',
      supabaseUrl: process.env.SUPABASE_URL || 'https://iklvthppfigprjhqmrlo.supabase.co',
      vercelProductionUrl: 'https://management-sona-ta.vercel.app'
    }
  },
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      },
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      }
    }
  },
  app: {
    head: {
      title: 'Nexura — Personal Workspace',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Nexura: Modern personal engineering and project management workspace.' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  devtools: { enabled: process.env.NODE_ENV !== 'production' }
})
