import { api } from '../api'
import { mapTask, mapTaskCard, mapSubtask, mapAttachment, taskToApi } from './mappers'

export const TaskRepository = {
  getById: (id) =>
    api.get(`/tasks/${id}/`).then((r) => mapTask(r.data)),

  create: (data) =>
    api.post('/tasks/', taskToApi(data)).then((r) => mapTask(r.data)),

  update: (id, data) =>
    api.patch(`/tasks/${id}/`, taskToApi(data)).then((r) => mapTask(r.data)),

  delete: (id) =>
    api.delete(`/tasks/${id}/`).then(() => {}),

  move: (taskId, { newColumnId, newPosition }) =>
    api.post(`/tasks/${taskId}/move/`, { coluna_id: newColumnId, posicao: newPosition })
      .then((r) => mapTask(r.data)),

  search: (query) =>
    api.get('/tasks/', { params: { search: query } })
      .then((r) => (r.data?.results ?? r.data).map(mapTask)),

  // ── Subtarefas ──────────────────────────────────────────────────────────────
  // Backend: POST /subtasks/ { task, titulo, posicao }
  // Frontend input: { task_id, title, position? }
  createSubtask: (data) =>
    api.post('/subtasks/', {
      task:    data.task_id,
      titulo:  data.title,
      posicao: data.position ?? 0,
    }).then((r) => mapSubtask(r.data)),

  toggleSubtask: (id) =>
    api.post(`/subtasks/${id}/toggle/`).then((r) => mapSubtask(r.data)),

  deleteSubtask: (id) =>
    api.delete(`/subtasks/${id}/`).then(() => {}),

  // ── Anexos ──────────────────────────────────────────────────────────────────
  // Receives a File/Blob object (not a path string)
  addAttachment: (taskId, file) => {
    const form = new FormData()
    form.append('task', taskId)
    form.append('arquivo', file, file.name ?? 'attachment')
    return api.post('/attachments/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => mapAttachment(r.data))
  },

  deleteAttachment: (id) =>
    api.delete(`/attachments/${id}/`).then(() => {}),
}
