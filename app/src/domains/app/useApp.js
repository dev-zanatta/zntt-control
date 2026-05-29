import { AppService } from './app.service'

export function useApp() {
  return {
    getVersion:       AppService.getVersion,
    getDataPath:      AppService.getDataPath,
    openDataFolder:   AppService.openDataFolder,
    selectExportPath: AppService.selectExportPath,
    exportData:       AppService.exportData,
    selectFile:       AppService.selectFile,
    winMinimize:      AppService.winMinimize,
    winMaximize:      AppService.winMaximize,
    winClose:         AppService.winClose,
    winIsMaximized:   AppService.winIsMaximized,
    onMaximizeChange: AppService.onMaximizeChange,
  }
}
