const { ipcMain, app, shell, dialog, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

function registerAppHandlers() {
  // ── Window controls ──────────────────────────────────────────────────────
  ipcMain.handle('win:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })

  ipcMain.handle('win:maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  ipcMain.handle('win:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })

  ipcMain.handle('win:isMaximized', (e) => {
    return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false
  })

  // ── App info ─────────────────────────────────────────────────────────────
  ipcMain.handle('app:getVersion', () => app.getVersion())

  ipcMain.handle('app:getDataPath', () => app.getPath('userData'))

  ipcMain.handle('app:openDataFolder', async () => {
    const dataPath = app.getPath('userData')
    await shell.openPath(dataPath)
    return { success: true }
  })

  // ── Export ───────────────────────────────────────────────────────────────
  ipcMain.handle('app:selectExportPath', async () => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export data',
      defaultPath: path.join(
        app.getPath('downloads'),
        `zntt-control-${new Date().toISOString().slice(0, 10)}.json`
      ),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    return canceled ? null : filePath
  })

  ipcMain.handle('app:exportData', async (_, exportPath) => {
    const { getDb } = require('../database/db')
    const db = getDb()

    const data = {
      exported_at: new Date().toISOString(),
      version: app.getVersion(),
      data: {
        categories:  db.prepare('SELECT * FROM categories').all(),
        projects:    db.prepare('SELECT * FROM projects').all(),
        columns:     db.prepare('SELECT * FROM columns').all(),
        tasks:       db.prepare('SELECT * FROM tasks').all(),
        subtasks:    db.prepare('SELECT * FROM subtasks').all(),
        attachments: db.prepare('SELECT * FROM attachments').all(),
        settings:    db.prepare('SELECT * FROM settings').all(),
      },
    }

    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf8')
    return { success: true, path: exportPath }
  })
}

module.exports = { registerAppHandlers }
