import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './composables/**/*.{vue,js,ts,jsx,tsx}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        void: '#07080A',
        canvas: '#0B0C10',
        surface: {
          DEFAULT: '#111318',
          elevated: '#171920',
          hover: '#1D2029'
        },
        'surface-elevated': '#171920',
        'surface-hover': '#1D2029',
        foreground: '#F3F4F6',
        muted: '#8A8F9E',
        dim: '#565B68',
        accent: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          dim: '#4338CA'
        },
        'accent-light': '#818CF8',
        'accent-dim': '#4338CA',
        // Backward-compatibility aliases
        bone: '#F3F4F6',
        ochre: {
          DEFAULT: '#6366F1',
          dim: '#4338CA'
        },
        'ochre-dim': '#4338CA',
        // Semantic status
        'status-critical': '#F43F5E',
        'status-high': '#F59E0B',
        'status-medium': '#6366F1',
        'status-low': '#8A8F9E',
        'status-success': '#10B981',
        'status-running': '#818CF8'
      },
      height: {
        '13': '3.25rem',
        '14': '3.5rem'
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', '"Cascadia Code"', 'monospace']
      },
      boxShadow: {
        specular: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
        'specular-strong': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'glow-accent': '0 0 16px var(--obs-accent-glow)',
        'glow-ochre': '0 0 16px var(--obs-accent-glow)'
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
