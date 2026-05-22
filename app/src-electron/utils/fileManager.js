const fs = require('fs')
const path = require('path')
const { app } = require('electron')
const { randomUUID } = require('crypto')

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function saveAttachment(taskId, sourcePath) {
  const ext = path.extname(sourcePath)
  const filename = randomUUID() + ext
  const relDir = path.join('attachments', 'tasks', String(taskId))
  const absDir = path.join(app.getPath('userData'), relDir)

  ensureDir(absDir)

  const destPath = path.join(absDir, filename)
  fs.copyFileSync(sourcePath, destPath)

  return path.join(relDir, filename).replace(/\\/g, '/')
}

function saveProjectLogo(projectId, sourcePath) {
  const ext = path.extname(sourcePath)
  const filename = 'logo' + ext
  const relDir = path.join('attachments', 'projects', String(projectId))
  const absDir = path.join(app.getPath('userData'), relDir)

  ensureDir(absDir)

  const destPath = path.join(absDir, filename)
  fs.copyFileSync(sourcePath, destPath)

  return path.join(relDir, filename).replace(/\\/g, '/')
}

function deleteAttachment(relativePath) {
  const fullPath = path.join(app.getPath('userData'), relativePath)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}

module.exports = { saveAttachment, saveProjectLogo, deleteAttachment }
