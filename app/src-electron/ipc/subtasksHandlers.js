const { ipcMain } = require('electron')
const repo = require('../database/repositories/subtasksRepository')

function registerSubtasksHandlers() {
  ipcMain.handle('subtasks:create', (_, data) => {
    const id = repo.createSubtask(data)
    return repo.getSubtaskById(id)
  })

  ipcMain.handle('subtasks:update', (_, id, data) => {
    repo.updateSubtask(id, data)
    return repo.getSubtaskById(id)
  })

  ipcMain.handle('subtasks:toggle', (_, id) => repo.toggleSubtask(id))

  ipcMain.handle('subtasks:delete', (_, id) => {
    repo.deleteSubtask(id)
    return { success: true }
  })
}

module.exports = { registerSubtasksHandlers }
