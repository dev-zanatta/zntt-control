import { api } from '../api'
import { mapProject, projectToApi } from './mappers'

export const ProjectRepository = {
  getAll: () =>
    api.get('/projects/').then((r) => (r.data?.results ?? r.data).map(mapProject)),

  getById: (id) =>
    api.get(`/projects/${id}/`).then((r) => mapProject(r.data)),

  create: (data) =>
    api.post('/projects/', projectToApi(data)).then((r) => mapProject(r.data)),

  update: (id, data) =>
    api.put(`/projects/${id}/`, projectToApi(data)).then((r) => mapProject(r.data)),

  updateStatus: (id, status) => {
    const statusPt = { active: 'ativo', paused: 'pausado', completed: 'concluido' }
    return api.patch(`/projects/${id}/status/`, { status: statusPt[status] ?? status })
      .then((r) => mapProject(r.data))
  },

  delete: (id) =>
    api.delete(`/projects/${id}/`).then(() => {}),

  saveLogo: (projectId, file) => {
    const form = new FormData()
    form.append('logo', file)
    return api.post(`/projects/${projectId}/logo/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => mapProject(r.data))
  },

  // ── Compartilhamento ─────────────────────────────────────────

  getInviteCode:     (id) => api.get(`/projects/${id}/invite-code/`).then((r) => r.data),
  refreshInviteCode: (id) => api.post(`/projects/${id}/invite-code/refresh/`).then((r) => r.data),

  join: (code) => api.post('/projects/join/', { code }).then((r) => r.data),

  getMembers:   (id) => api.get(`/projects/${id}/members/`).then((r) => r.data),
  acceptMember: (id, userId) => api.post(`/projects/${id}/accept-member/`, { user_id: userId }).then((r) => r.data),
  rejectMember: (id, userId) => api.post(`/projects/${id}/reject-member/`, { user_id: userId }).then((r) => r.data),
  removeMember: (id, userId) => api.post(`/projects/${id}/remove-member/`, { user_id: userId }).then(() => {}),
}
