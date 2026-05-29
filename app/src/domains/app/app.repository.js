// Contract — defines the shape of AppRepository without any implementation.
// Infrastructure files must satisfy this interface.
export const AppRepository = {
  /** @returns {Promise<string>} */
  getVersion: () => {},
  /** @returns {Promise<string>} */
  getDataPath: () => {},
  /** @returns {Promise<void>} */
  openDataFolder: () => {},
  /** @returns {Promise<string|null>} */
  selectExportPath: () => {},
  /** @param {string} filePath @returns {Promise<void>} */
  exportData: (_filePath) => {},
  /** @returns {Promise<string|null>} */
  selectFile: () => {},
  /** @returns {Promise<void>} */
  winMinimize: () => {},
  /** @returns {Promise<void>} */
  winMaximize: () => {},
  /** @returns {Promise<void>} */
  winClose: () => {},
  /** @returns {Promise<boolean>} */
  winIsMaximized: () => {},
  /** @param {(isMaximized: boolean) => void} cb @returns {void} */
  onMaximizeChange: (_cb) => {},
}
