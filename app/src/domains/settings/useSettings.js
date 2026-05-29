import { ref } from 'vue'
import { SettingsService } from './settings.service'
import { ACCENT_PRESETS } from './settings.entity'

const theme           = ref('dark')
const accent          = ref('#6366f1')
const searchOpen      = ref(false)
const sidebarCollapsed = ref(false)

async function init() {
  const saved = await SettingsService.init()
  theme.value  = saved.theme
  accent.value = saved.accent
  SettingsService.applyTheme(saved.theme)
  SettingsService.applyAccent(saved.accent)
}

async function setTheme(val) {
  theme.value = val
  SettingsService.applyTheme(val)
  await SettingsService.setTheme(val)
}

async function setAccent(val) {
  accent.value = val
  SettingsService.applyAccent(val)
  await SettingsService.setAccent(val)
}

export function useSettings() {
  return {
    theme,
    accent,
    searchOpen,
    sidebarCollapsed,
    ACCENT_PRESETS,
    init,
    setTheme,
    setAccent,
    openSearch:  () => { searchOpen.value = true },
    closeSearch: () => { searchOpen.value = false },
  }
}
