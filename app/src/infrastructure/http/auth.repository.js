import { api } from '../api'

export const AuthRepository = {
  login:  (username, password) => api.post('/auth/login/', { username, password }).then((r) => r.data),
  logout: (refresh)            => api.post('/auth/logout/', { refresh }).then(() => {}),
  me:     ()                   => api.get('/auth/me/').then((r) => r.data),
}
