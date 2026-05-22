import { defineStore } from 'pinia'

export const ACCENT_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
]

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: 'dark',
    accent: '#6366f1',
    searchOpen: false,
    sidebarCollapsed: false,
  }),

  actions: {
    async initTheme() {
      const api = window.electronAPI
      const [savedTheme, savedAccent] = await Promise.all([
        api.getSetting('theme'),
        api.getSetting('accent'),
      ])
      this.theme = savedTheme || 'dark'
      this.accent = savedAccent || '#6366f1'
      this.applyTheme(this.theme)
      this.applyAccent(this.accent)
    },

    async setTheme(theme) {
      this.theme = theme
      this.applyTheme(theme)
      await window.electronAPI.setSetting('theme', theme)
    },

    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme)
    },

    async setAccent(color) {
      this.accent = color
      this.applyAccent(color)
      await window.electronAPI.setSetting('accent', color)
    },

    applyAccent(color) {
      document.documentElement.style.setProperty('--zntt-accent', color)
      document.documentElement.style.setProperty('--zc-accent', color)
    },

    openSearch()  { this.searchOpen = true  },
    closeSearch() { this.searchOpen = false },
  },
})
