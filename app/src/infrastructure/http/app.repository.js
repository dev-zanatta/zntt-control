import { api } from '../api'

export const AppRepository = {
  getVersion:       () => api.get('/app/version').then((r) => r.data),
  getDataPath:      () => Promise.resolve(''),
  openDataFolder:   () => Promise.resolve(),
  selectExportPath: () => Promise.resolve(null),
  exportData:       () => Promise.resolve(),
  selectFile:       () => Promise.resolve(null),
  winMinimize:      () => Promise.resolve(),
  winMaximize:      () => Promise.resolve(),
  winClose:         () => Promise.resolve(),
  winIsMaximized:   () => Promise.resolve(false),
  onMaximizeChange: () => () => {},
}
