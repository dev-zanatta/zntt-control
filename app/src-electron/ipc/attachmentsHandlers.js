const { ipcMain, dialog, shell, BrowserWindow, app } = require('electron')
const path = require('path')
const repo = require('../database/repositories/attachmentsRepository')
const fileManager = require('../utils/fileManager')

function registerAttachmentsHandlers() {
  ipcMain.handle('projects:saveLogo', async (event, projectId, sourcePath) => {
    const relativePath = fileManager.saveProjectLogo(projectId, sourcePath)
    const projectRepo = require('../database/repositories/projectsRepository')
    projectRepo.updateProject(projectId, { logo_path: relativePath })
    return relativePath
  })

  ipcMain.handle('files:selectFile', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Images',     extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] },
        { name: 'Documents',  extensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'csv'] },
        { name: 'All Files',  extensions: ['*'] },
      ],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('attachments:add', async (_, taskId, sourcePath) => {
    const relativePath = fileManager.saveAttachment(taskId, sourcePath)
    const fs = require('fs')
    const stats = fs.statSync(sourcePath)
    const mimeTypes = {
      '.pdf':  'application/pdf',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif':  'image/gif',
      '.webp': 'image/webp',
      '.bmp':  'image/bmp',
      '.svg':  'image/svg+xml',
      '.txt':  'text/plain',
      '.md':   'text/markdown',
      '.csv':  'text/csv',
      '.zip':  'application/zip',
      '.doc':  'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls':  'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
    const ext = path.extname(sourcePath).toLowerCase()
    const mime = mimeTypes[ext] || 'application/octet-stream'

    const id = repo.createAttachment({
      task_id: taskId,
      filename: path.basename(relativePath),
      original_name: path.basename(sourcePath),
      file_path: relativePath,
      mime_type: mime,
      size_bytes: stats.size,
    })
    return repo.getAttachmentById(id)
  })

  ipcMain.handle('attachments:open', (_, id) => {
    const attachment = repo.getAttachmentById(id)
    const fullPath = path.join(app.getPath('userData'), attachment.file_path)
    shell.openPath(fullPath)
  })

  ipcMain.handle('attachments:delete', (_, id) => {
    const attachment = repo.getAttachmentById(id)
    fileManager.deleteAttachment(attachment.file_path)
    repo.deleteAttachment(id)
    return { success: true }
  })
}

module.exports = { registerAttachmentsHandlers }
