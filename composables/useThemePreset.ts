import { computed, watch, onMounted } from 'vue'

export type ThemePresetId = 'default' | 'indigo' | 'amethyst' | 'stealth' | 'emerald'

export interface ThemePresetOption {
  id: ThemePresetId
  label: string
  description: string
  accentColor: string
}

export const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'default',
    label: 'Default Indigo',
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
    id: 'emerald',
    label: 'Emerald Forest',
    description: 'High-contrast black with vivid emerald shine',
    accentColor: '#10B981'
  },
  {
    id: 'stealth',
    label: 'Obsidian Stealth',
    description: 'Monochrome pure void with cold silver zinc',
    accentColor: '#E4E4E7'
  }
]

/**
 * Shared theme preset composable.
 * Synchronizes selected theme across localStorage and document.body.dataset.preset.
 */
export function useThemePreset() {
  const currentPreset = useState<ThemePresetId>('obsidian_theme_preference', () => 'default')

  function applyPresetToDom(preset: ThemePresetId) {
    if (typeof document === 'undefined') return
    const resolved = preset === 'indigo' ? 'default' : preset
    document.body.dataset.preset = resolved
  }

  function setPreset(preset: ThemePresetId) {
    const resolved = preset === 'indigo' ? 'default' : preset
    currentPreset.value = resolved
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nexura:theme', resolved)
    }
    applyPresetToDom(resolved)
  }

  const currentPresetOption = computed(() => {
    const id = currentPreset.value === 'indigo' ? 'default' : currentPreset.value
    return THEME_PRESETS.find((p) => p.id === id) || THEME_PRESETS[0]
  })

  // Watch for changes to maintain DOM sync
  watch(currentPreset, (newPreset) => {
    applyPresetToDom(newPreset)
  })

  // Init on client mount
  onMounted(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('nexura:theme') as ThemePresetId | null
      if (saved && (THEME_PRESETS.some((p) => p.id === saved) || saved === 'indigo')) {
        setPreset(saved)
      } else {
        applyPresetToDom(currentPreset.value)
      }
    }
  })

  return {
    currentPreset,
    currentPresetOption,
    presets: THEME_PRESETS,
    setPreset
  }
}
