import { api } from '../api'

export const BoardRepository = {
  getBoard:       (projectId) => api.get(`/projects/${projectId}/board`).then((r) => r.data),
  createColumn:   (data) => api.post('/columns', data).then((r) => r.data),
  updateColumn:   (id, data) => api.put(`/columns/${id}`, data).then(() => {}),
  reorderColumns: (projectId, ids) => api.put(`/projects/${projectId}/columns/reorder`, { ids }).then(() => {}),
  deleteColumn:   (id) => api.delete(`/columns/${id}`).then(() => {}),
}
