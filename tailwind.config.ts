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
        void: 'rgb(var(--obs-void-rgb) / <alpha-value>)',
        canvas: 'rgb(var(--obs-canvas-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--obs-surface-rgb) / <alpha-value>)',
          elevated: 'rgb(var(--obs-elevated-rgb) / <alpha-value>)',
          hover: 'rgb(var(--obs-hover-rgb) / <alpha-value>)'
        },
        'surface-elevated': 'rgb(var(--obs-elevated-rgb) / <alpha-value>)',
        'surface-hover': 'rgb(var(--obs-hover-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--obs-text-rgb) / <alpha-value>)',
        muted: 'rgb(var(--obs-muted-rgb) / <alpha-value>)',
        dim: 'rgb(var(--obs-dim-rgb) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--obs-accent-rgb) / <alpha-value>)',
          light: 'rgb(var(--obs-accent-light-rgb) / <alpha-value>)',
          dim: 'rgb(var(--obs-accent-dim-rgb) / <alpha-value>)'
        },
        'accent-light': 'rgb(var(--obs-accent-light-rgb) / <alpha-value>)',
        'accent-dim': 'rgb(var(--obs-accent-dim-rgb) / <alpha-value>)',
        // Backward-compatibility aliases
        bone: 'rgb(var(--obs-text-rgb) / <alpha-value>)',
        ochre: {
          DEFAULT: 'rgb(var(--obs-accent-rgb) / <alpha-value>)',
          dim: 'rgb(var(--obs-accent-dim-rgb) / <alpha-value>)'
        },
        'ochre-dim': 'rgb(var(--obs-accent-dim-rgb) / <alpha-value>)',
        // Semantic status
        'status-critical': '#F43F5E',
        'status-high': '#F59E0B',
        'status-medium': '#38BDF8',
        'status-low': '#8A8F9E',
        'status-success': '#10B981',
        'status-running': '#38BDF8'
      },
      height: {
        '13': '3.25rem',
        '14': '3.5rem'
      },
      fontFamily: {
        sans: ['"Geist Sans Variable"', '"Geist Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', '"Geist Mono"', '"JetBrains Mono"', 'monospace']
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
