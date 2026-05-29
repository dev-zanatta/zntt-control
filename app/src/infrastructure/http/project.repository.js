import { api } from '../api'

export const ProjectRepository = {
  getAll:       () => api.get('/projects').then((r) => r.data),
  getById:      (id) => api.get(`/projects/${id}`).then((r) => r.data),
  create:       (data) => api.post('/projects', data).then((r) => r.data),
  update:       (id, data) => api.put(`/projects/${id}`, data).then((r) => r.data),
  updateStatus: (id, status) => api.patch(`/projects/${id}/status`, { status }).then((r) => r.data),
  delete:       (id) => api.delete(`/projects/${id}`).then(() => {}),
  saveLogo:     (projectId, logoPath) => api.post(`/projects/${projectId}/logo`, { logoPath }).then(() => {}),
}
