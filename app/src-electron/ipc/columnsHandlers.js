const { ipcMain } = require('electron')
const repo = require('../database/repositories/columnsRepository')

function registerColumnsHandlers() {
  ipcMain.handle('columns:getByProject', (_, projectId) => repo.getColumnsByProject(projectId))

  ipcMain.handle('columns:create', (_, data) => {
    const id = repo.createColumn(data)
    return repo.getColumnById(id)
  })

  ipcMain.handle('columns:update', (_, id, data) => {
    repo.updateColumn(id, data)
    return repo.getColumnById(id)
  })

  ipcMain.handle('columns:reorder', (_, projectId, orderedIds) => {
    repo.reorderColumns(projectId, orderedIds)
    return repo.getColumnsByProject(projectId)
  })

  ipcMain.handle('columns:delete', (_, id) => {
    repo.deleteColumn(id)
    return { success: true }
  })
}

module.exports = { registerColumnsHandlers }
