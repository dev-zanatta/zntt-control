import { AppRepository } from 'src/infrastructure/http/app.repository'

export const AppService = {
  getVersion:       () => AppRepository.getVersion(),
  getDataPath:      () => AppRepository.getDataPath(),
  openDataFolder:   () => AppRepository.openDataFolder(),
  selectExportPath: () => AppRepository.selectExportPath(),
  exportData:       (filePath) => AppRepository.exportData(filePath),
  selectFile:       () => AppRepository.selectFile(),
  winMinimize:      () => AppRepository.winMinimize(),
  winMaximize:      () => AppRepository.winMaximize(),
  winClose:         () => AppRepository.winClose(),
  winIsMaximized:   () => AppRepository.winIsMaximized(),
  onMaximizeChange: (cb) => AppRepository.onMaximizeChange(cb),
}
