import { AuthRepository } from 'src/infrastructure/http/auth.repository'

const KEYS = { access: 'access_token', refresh: 'refresh_token', user: 'auth_user' }

export const AuthService = {
  async login(username, password) {
    const data = await AuthRepository.login(username, password)
    localStorage.setItem(KEYS.access, data.access)
    localStorage.setItem(KEYS.refresh, data.refresh)
    if (data.user) localStorage.setItem(KEYS.user, JSON.stringify(data.user))
    return data.user
  },

  async logout() {
    const refresh = localStorage.getItem(KEYS.refresh)
    try {
      if (refresh) await AuthRepository.logout(refresh)
    } catch {
      // ignore — token may already be invalid
    } finally {
      localStorage.removeItem(KEYS.access)
      localStorage.removeItem(KEYS.refresh)
      localStorage.removeItem(KEYS.user)
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem(KEYS.access)
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.user) || 'null')
    } catch {
      return null
    }
  },
}
