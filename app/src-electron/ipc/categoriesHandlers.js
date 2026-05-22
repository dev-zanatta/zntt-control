const { ipcMain } = require('electron')
const repo = require('../database/repositories/categoriesRepository')

function registerCategoriesHandlers() {
  ipcMain.handle('categories:getAll', () => repo.getAllCategories())

  ipcMain.handle('categories:create', (_, name) => {
    const id = repo.createCategory(name)
    return repo.getCategoryById(id)
  })

  ipcMain.handle('categories:update', (_, id, name) => {
    repo.updateCategory(id, name)
    return repo.getCategoryById(id)
  })

  ipcMain.handle('categories:delete', (_, id) => {
    repo.deleteCategory(id)
    return { success: true }
  })
}

module.exports = { registerCategoriesHandlers }
