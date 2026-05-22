const { ipcMain } = require('electron')
const repo = require('../database/repositories/tasksRepository')
const { getDb } = require('../database/db')

function registerTasksHandlers() {
  ipcMain.handle('tasks:getByProject', (_, projectId) => repo.getTasksByProject(projectId))

  ipcMain.handle('tasks:getById', (_, id) => {
    console.log('[zntt-main] tasks:getById: recebido id =', id, '| tipo:', typeof id)
    try {
      const result = repo.getTaskById(id)
      console.log('[zntt-main] tasks:getById: resultado =', result ? `task id=${result.id} title="${result.title}"` : result)
      return result
    } catch (err) {
      console.error('[zntt-main] tasks:getById: ERRO =', err)
      throw err
    }
  })

  ipcMain.handle('tasks:create', (_, data) => {
    const id = repo.createTask(data)
    return repo.getTaskById(id)
  })

  ipcMain.handle('tasks:update', (_, id, data) => {
    repo.updateTask(id, data)
    return repo.getTaskById(id)
  })

  ipcMain.handle('tasks:move', (_, taskId, { newColumnId, newPosition }) => {
    const db = getDb()

    const moveTransaction = db.transaction(() => {
      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)

      db.prepare(
        `UPDATE tasks SET position = position - 1
         WHERE column_id = ? AND position > ? AND id != ?`
      ).run(task.column_id, task.position, taskId)

      db.prepare(
        `UPDATE tasks SET position = position + 1
         WHERE column_id = ? AND position >= ?`
      ).run(newColumnId, newPosition)

      db.prepare(
        `UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(newColumnId, newPosition, taskId)
    })

    moveTransaction()
    return repo.getTaskById(taskId)
  })

  ipcMain.handle('tasks:delete', (_, id) => {
    repo.deleteTask(id)
    return { success: true }
  })

  ipcMain.handle('tasks:search', (_, query) => repo.searchTasks(query))
}

module.exports = { registerTasksHandlers }
