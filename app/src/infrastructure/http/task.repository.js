import { api } from '../api'

export const TaskRepository = {
  getById:          (id) => api.get(`/tasks/${id}`).then((r) => r.data),
  create:           (data) => api.post('/tasks', data).then((r) => r.data),
  update:           (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data),
  move:             (taskId, target) => api.post(`/tasks/${taskId}/move`, target).then(() => {}),
  delete:           (id) => api.delete(`/tasks/${id}`).then(() => {}),
  search:           (query) => api.get('/tasks/search', { params: { q: query } }).then((r) => r.data),
  createSubtask:    (data) => api.post('/subtasks', data).then((r) => r.data),
  toggleSubtask:    (id) => api.post(`/subtasks/${id}/toggle`).then((r) => r.data),
  deleteSubtask:    (id) => api.delete(`/subtasks/${id}`).then(() => {}),
  addAttachment:    (taskId, filePath) => api.post(`/tasks/${taskId}/attachments`, { filePath }).then((r) => r.data),
  deleteAttachment: (id) => api.delete(`/attachments/${id}`).then(() => {}),
  openAttachment:   (id) => api.post(`/attachments/${id}/open`).then(() => {}),
}
