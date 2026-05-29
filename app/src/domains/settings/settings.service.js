import { SettingsRepository } from 'src/infrastructure/http/settings.repository'
import { Settings } from './settings.entity'

export const SettingsService = {
  async init() {
    const [theme, accent] = await Promise.all([
      SettingsRepository.get('theme'),
      SettingsRepository.get('accent'),
    ])
    const defaults = Settings.defaults()
    return {
      theme:  theme  || defaults.theme,
      accent: accent || defaults.accent,
    }
  },

  setTheme:  (theme)  => SettingsRepository.set('theme', theme),
  setAccent: (accent) => SettingsRepository.set('accent', accent),

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
  },

  applyAccent(color) {
    document.documentElement.style.setProperty('--zntt-accent', color)
    document.documentElement.style.setProperty('--zc-accent', color)
  },
}
