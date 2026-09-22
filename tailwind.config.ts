import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './composables/**/*.{vue,js,ts,jsx,tsx}',
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './app.vue',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#09090B',
        surface: {
          DEFAULT: '#111114',
          elevated: '#18181C'
        },
        'surface-elevated': '#18181C',
        bone: '#F5F2EB',
        muted: '#756F68',
        ochre: {
          DEFAULT: '#C98A4B',
          dim: '#8B6535'
        },
        'ochre-dim': '#8B6535',
        'status-critical': '#EF4444',
        'status-high': '#F97316',
        'status-medium': '#EAB308',
        'status-low': '#756F68',
        'status-success': '#22C55E',
        'status-running': '#3B82F6'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace']
      },
      boxShadow: {
        'glow-ochre': '0 0 12px rgba(201, 138, 75, 0.15)'
      },
      backgroundImage: {
        'telemetry-grid': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128' shape-rendering='crispEdges'%3E%3Cpath d='M0 32h128M0 96h128M32 0v128M96 0v128' stroke='rgba(255,255,255,0.015)' stroke-width='1' fill='none'/%3E%3Cpath d='M0 64h128M64 0v128M0 128h128M128 0v128' stroke='rgba(255,255,255,0.03)' stroke-width='1' fill='none'/%3E%3Cpath d='M62 64h5M64 62v5' stroke='%23C98A4B' stroke-opacity='0.12' stroke-width='1' stroke-linecap='square' fill='none'/%3E%3C/svg%3E\")",
        'telemetry-grid-24': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96' shape-rendering='crispEdges'%3E%3Cpath d='M0 24h96M0 72h96M24 0v96M72 0v96' stroke='rgba(255,255,255,0.015)' stroke-width='1' fill='none'/%3E%3Cpath d='M0 48h96M48 0v96M0 96h96M96 0v96' stroke='rgba(255,255,255,0.03)' stroke-width='1' fill='none'/%3E%3Cpath d='M46 48h5M48 46v5' stroke='%23C98A4B' stroke-opacity='0.12' stroke-width='1' stroke-linecap='square' fill='none'/%3E%3C/svg%3E\")"
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' }
        }
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: []
} satisfies Config
