// HTTP client — activate when switching from IPC to a REST API.
//
// To switch a domain from IPC to HTTP:
//   1. npm install axios
//   2. Uncomment everything below
//   3. In each src/domains/{domain}/{domain}.service.js, change:
//        import { XRepository } from '@/infrastructure/ipc/x.repository'
//      to:
//        import { XRepository } from '@/infrastructure/http/x.repository'
//
// import axios from 'axios'
//
// const api = axios.create({
//   baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
//   timeout: 10_000,
// })
//
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('auth_token')
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })
//
// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       // TODO: redirect to login when auth is implemented
//     }
//     return Promise.reject(err)
//   },
// )
//
// export { api }

export const api = null
