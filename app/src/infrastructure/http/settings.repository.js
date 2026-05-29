import { api } from '../api'

export const SettingsRepository = {
  get: (key) => api.get(`/settings/${key}`).then((r) => r.data?.value ?? null),
  set: (key, value) => api.put(`/settings/${key}`, { value }).then(() => {}),
}
