import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-20',
  telemetry: false,
  alias: {
    '~/types': fileURLToPath(new URL('./types', import.meta.url)),
    '@/types': fileURLToPath(new URL('./types', import.meta.url)),
    '~~/types': fileURLToPath(new URL('./types', import.meta.url)),
    '@@/types': fileURLToPath(new URL('./types', import.meta.url)),
    '~/composables': fileURLToPath(new URL('./composables', import.meta.url)),
    '@/composables': fileURLToPath(new URL('./composables', import.meta.url)),
    '~~/composables': fileURLToPath(new URL('./composables', import.meta.url)),
    '@@/composables': fileURLToPath(new URL('./composables', import.meta.url)),
    '~/components': fileURLToPath(new URL('./components', import.meta.url)),
    '@/components': fileURLToPath(new URL('./components', import.meta.url)),
    '~~/components': fileURLToPath(new URL('./components', import.meta.url)),
    '@@/components': fileURLToPath(new URL('./components', import.meta.url))
  },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~~/assets/css/main.css'],
  tailwindcss: {
    cssPath: '~~/assets/css/main.css',
    configPath: 'tailwind.config'
  },
  components: ['~~/components'],
  imports: {
    dirs: ['~~/composables', '~~/composables/**']
  },
  runtimeConfig: {
    githubToken: process.env.GITHUB_TOKEN || '',
    githubUsername: process.env.GITHUB_USERNAME || 'bagja-iskandar',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '',
    vercelToken: process.env.VERCEL_TOKEN || '',
    public: {
      githubUsername: process.env.GITHUB_USERNAME || 'bagja-iskandar',
      supabaseUrl: process.env.SUPABASE_URL || '',
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
  hooks: {
    'imports:dirs'(dirs) {
      const composablesRoot = fileURLToPath(new URL('./composables', import.meta.url))
      dirs.push(composablesRoot)
      for (let i = 0; i < dirs.length; i++) {
        if (dirs[i].includes('~~')) {
          dirs[i] = dirs[i].replace(/[\\/]app[\\/]~~/, '')
        }
      }
    },
    'vite:extendConfig'(config) {
      if (config.resolve?.alias) {
        if (Array.isArray(config.resolve.alias)) {
          config.resolve.alias.sort((a, b) => {
            const aLen = typeof a.find === 'string' ? a.find.length : 0
            const bLen = typeof b.find === 'string' ? b.find.length : 0
            return bLen - aLen
          })
        } else if (typeof config.resolve.alias === 'object') {
          const sortedEntries = Object.entries(config.resolve.alias).sort(([a], [b]) => b.length - a.length)
          config.resolve.alias = sortedEntries.map(([find, replacement]) => ({ find, replacement }))
        }
      }
    }
  },
  devtools: { enabled: process.env.NODE_ENV !== 'production' }
})
