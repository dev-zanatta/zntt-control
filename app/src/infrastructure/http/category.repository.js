import { api } from '../api'
import { mapCategory } from './mappers'

export const CategoryRepository = {
  getAll: () =>
    api.get('/categories/').then((r) => (r.data?.results ?? r.data).map(mapCategory)),

  create: (name) =>
    api.post('/categories/', { nome: name }).then((r) => mapCategory(r.data)),

  update: (id, name) =>
    api.put(`/categories/${id}/`, { nome: name }).then((r) => mapCategory(r.data)),

  delete: (id) =>
    api.delete(`/categories/${id}/`).then(() => {}),
}
