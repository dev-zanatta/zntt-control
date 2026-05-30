import { api } from '../api'

// Backend expõe um objeto único: GET/PUT /api/auth/settings/ → { tema, cor_accent }
// O service chama get('theme') e get('accent') — mapeamos aqui para os campos do backend.
const KEY_MAP = { theme: 'tema', accent: 'cor_accent' }

let _cache = null

export const SettingsRepository = {
  async get(key) {
    if (!_cache) _cache = await api.get('/auth/settings/').then((r) => r.data)
    const backendKey = KEY_MAP[key] || key
    return _cache[backendKey] ?? null
  },

  async set(key, value) {
    const backendKey = KEY_MAP[key] || key
    const data = await api.put('/auth/settings/', { [backendKey]: value }).then((r) => r.data)
    _cache = data
  },
}
