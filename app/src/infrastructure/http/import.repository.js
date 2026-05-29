import { api } from '../api'

export const ImportRepository = {
  selectFile:      () => Promise.resolve(null),
  parseTrello:     (filePath) => api.post('/import/trello/parse', { filePath }).then((r) => r.data),
  runTrelloImport: (params) => api.post('/import/trello', params).then((r) => r.data),
}
