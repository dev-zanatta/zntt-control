const { ipcMain } = require('electron')
const repo = require('../database/repositories/settingsRepository')

function registerSettingsHandlers() {
  ipcMain.handle('settings:get', (_, key) => repo.getSetting(key))

  ipcMain.handle('settings:set', (_, key, value) => {
    repo.setSetting(key, value)
    return { success: true }
  })

  ipcMain.handle('settings:getAll', () => repo.getAllSettings())
}

module.exports = { registerSettingsHandlers }
