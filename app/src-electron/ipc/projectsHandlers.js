const { ipcMain } = require('electron')
const repo = require('../database/repositories/projectsRepository')

function registerProjectsHandlers() {
  ipcMain.handle('projects:getAll', () => repo.getAllProjects())

  ipcMain.handle('projects:getById', (_, id) => repo.getProjectWithDetails(id))

  ipcMain.handle('projects:create', (_, data) => {
    const id = repo.createProject(data)
    return repo.getProjectWithDetails(id)
  })

  ipcMain.handle('projects:update', (_, id, data) => {
    repo.updateProject(id, data)
    return repo.getProjectWithDetails(id)
  })

  ipcMain.handle('projects:updateStatus', (_, id, status) => {
    repo.updateProjectStatus(id, status)
    return repo.getProjectWithDetails(id)
  })

  ipcMain.handle('projects:delete', (_, id) => {
    repo.deleteProject(id)
    return { success: true }
  })
}

module.exports = { registerProjectsHandlers }
