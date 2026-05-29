import { api } from '../api'

export const CategoryRepository = {
  getAll: () => api.get('/categories').then((r) => r.data),
  create: (name) => api.post('/categories', { name }).then((r) => r.data),
  update: (id, name) => api.put(`/categories/${id}`, { name }).then(() => {}),
  delete: (id) => api.delete(`/categories/${id}`).then(() => {}),
}
