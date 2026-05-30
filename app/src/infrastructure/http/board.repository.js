import { api } from '../api'
import { mapColumn, columnToApi } from './mappers'

export const BoardRepository = {
  getBoard: (projectId) =>
    api.get(`/projects/${projectId}/board/`).then((r) => r.data.map(mapColumn)),

  createColumn: (data) =>
    api.post('/columns/', columnToApi(data)).then((r) => mapColumn(r.data)),

  // PATCH (not PUT) — allows partial update (only nome OR is_done_column)
  updateColumn: (id, data) =>
    api.patch(`/columns/${id}/`, columnToApi(data)).then((r) => mapColumn(r.data)),

  reorderColumns: (projectId, ids) =>
    api.put(`/projects/${projectId}/columns/reorder/`, { ids }).then(() => {}),

  deleteColumn: (id) =>
    api.delete(`/columns/${id}/`).then(() => {}),
}
