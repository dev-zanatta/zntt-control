import axios from 'axios'

const BASE = process.env.API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 15_000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/api/auth/refresh/`, { refresh })
          localStorage.setItem('access_token', data.access)
          err.config.headers.Authorization = `Bearer ${data.access}`
          return api.request(err.config)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/#/login'
        }
      }
    }
    return Promise.reject(err)
  },
)

export { api }
