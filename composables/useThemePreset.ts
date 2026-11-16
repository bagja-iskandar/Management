import { computed, watch, onMounted } from 'vue'

export type ThemePresetId = 'emerald' | 'indigo' | 'amethyst' | 'stealth' | 'default'

export interface ThemePresetOption {
  id: ThemePresetId
  label: string
  description: string
  accentColor: string
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'emerald',
    label: 'Emerald (Canonical)',
    description: 'High-contrast neutral obsidian with micro-emerald highlights',
    accentColor: '#10B981'
  },
  {
    id: 'indigo',
    label: 'Electric Indigo',
    description: 'Obsidian void with electric indigo accents',
    accentColor: '#6366F1'
  },
  {
    id: 'amethyst',
    label: 'Amethyst Void',
    description: 'Deep obsidian with royal violet highlights',
    accentColor: '#A855F7'
  },
  {
    id: 'stealth',
    label: 'Obsidian Stealth',
    description: 'Monochrome pure void with cold silver zinc',
    accentColor: '#E4E4E7'
  }
]

const ALLOWED_PRESETS: ThemePresetId[] = ['emerald', 'indigo', 'amethyst', 'stealth']

function normalizePreset(preset: string | null | undefined): ThemePresetId {
  if (!preset || preset === 'default') return 'emerald'
  if (ALLOWED_PRESETS.includes(preset as ThemePresetId)) {
    return preset as ThemePresetId
  }
  return 'emerald'
}

/**
 * Shared theme preset composable.
 * Synchronizes selected theme across localStorage and document.body.dataset.preset.
 */
export function useThemePreset() {
  const currentPreset = useState<ThemePresetId>('obsidian_theme_preference', () => 'emerald')

  function applyPresetToDom(preset: ThemePresetId) {
    if (typeof document === 'undefined') return
    const resolved = normalizePreset(preset)
    document.body.dataset.preset = resolved
  }

  function setPreset(preset: ThemePresetId) {
    const resolved = normalizePreset(preset)
    currentPreset.value = resolved
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nexura:theme', resolved)
    }
    applyPresetToDom(resolved)
  }

  const currentPresetOption = computed(() => {
    const id = normalizePreset(currentPreset.value)
    return THEME_PRESETS.find((p) => p.id === id) || THEME_PRESETS[0]
  })

  // Watch for changes to maintain DOM sync
  watch(currentPreset, (newPreset) => {
    applyPresetToDom(newPreset)
  })

  // Init on client mount
  onMounted(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('nexura:theme')
      const resolved = normalizePreset(saved || currentPreset.value)
      setPreset(resolved)
    } else {
      applyPresetToDom(currentPreset.value)
    }
  })

  return {
    currentPreset,
    currentPresetOption,
    presets: THEME_PRESETS,
    setPreset
  }
}
