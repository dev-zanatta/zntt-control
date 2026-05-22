# 04 — IPC Architecture

## How It Works

```
Vue Component
  → window.electronAPI.someMethod(data)
    → electron-preload.js (contextBridge)
      → ipcRenderer.invoke('channel:name', data)
        → ipcMain.handle('channel:name', handler)
          → repository function
            → SQLite
```

No HTTP. No ports. Native Electron communication.

---

## Preload Script

**`src-electron/electron-preload.js`**
```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {

  // Projects
  getProjects:         ()       => ipcRenderer.invoke('projects:getAll'),
  getProject:          (id)     => ipcRenderer.invoke('projects:getById', id),
  createProject:       (data)   => ipcRenderer.invoke('projects:create', data),
  updateProject:       (id, d)  => ipcRenderer.invoke('projects:update', id, d),
  updateProjectStatus: (id, s)  => ipcRenderer.invoke('projects:updateStatus', id, s),
  deleteProject:       (id)     => ipcRenderer.invoke('projects:delete', id),

  // Columns
  getColumns:    (projectId) => ipcRenderer.invoke('columns:getByProject', projectId),
  createColumn:  (data)      => ipcRenderer.invoke('columns:create', data),
  updateColumn:  (id, data)  => ipcRenderer.invoke('columns:update', id, data),
  reorderColumns:(projectId, orderedIds) => ipcRenderer.invoke('columns:reorder', projectId, orderedIds),
  deleteColumn:  (id)        => ipcRenderer.invoke('columns:delete', id),

  // Tasks
  getTasksByProject: (projectId) => ipcRenderer.invoke('tasks:getByProject', projectId),
  getTask:           (id)        => ipcRenderer.invoke('tasks:getById', id),
  createTask:        (data)      => ipcRenderer.invoke('tasks:create', data),
  updateTask:        (id, data)  => ipcRenderer.invoke('tasks:update', id, data),
  moveTask:          (id, data)  => ipcRenderer.invoke('tasks:move', id, data),
  deleteTask:        (id)        => ipcRenderer.invoke('tasks:delete', id),

  // Subtasks
  createSubtask: (data)     => ipcRenderer.invoke('subtasks:create', data),
  updateSubtask: (id, data) => ipcRenderer.invoke('subtasks:update', id, data),
  toggleSubtask: (id)       => ipcRenderer.invoke('subtasks:toggle', id),
  deleteSubtask: (id)       => ipcRenderer.invoke('subtasks:delete', id),

  // Attachments
  addAttachment:    (taskId, filePath) => ipcRenderer.invoke('attachments:add', taskId, filePath),
  deleteAttachment: (id)               => ipcRenderer.invoke('attachments:delete', id),
  openAttachment:   (id)               => ipcRenderer.invoke('attachments:open', id),
  selectFile:       ()                 => ipcRenderer.invoke('files:selectFile'),

  // Categories
  getCategories:   ()         => ipcRenderer.invoke('categories:getAll'),
  createCategory:  (name)     => ipcRenderer.invoke('categories:create', name),
  updateCategory:  (id, name) => ipcRenderer.invoke('categories:update', id, name),
  deleteCategory:  (id)       => ipcRenderer.invoke('categories:delete', id),

  // Settings
  getSetting: (key)        => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: ()        => ipcRenderer.invoke('settings:getAll'),
})
```

---

## IPC Handlers Registration

**`src-electron/ipc/index.js`**
```js
const { registerProjectsHandlers }    = require('./projectsHandlers')
const { registerColumnsHandlers }     = require('./columnsHandlers')
const { registerTasksHandlers }       = require('./tasksHandlers')
const { registerSubtasksHandlers }    = require('./subtasksHandlers')
const { registerAttachmentsHandlers } = require('./attachmentsHandlers')
const { registerSettingsHandlers }    = require('./settingsHandlers')

function registerAllHandlers() {
  registerProjectsHandlers()
  registerColumnsHandlers()
  registerTasksHandlers()
  registerSubtasksHandlers()
  registerAttachmentsHandlers()
  registerSettingsHandlers()
}

module.exports = { registerAllHandlers }
```

---

## Handler Example

**`src-electron/ipc/projectsHandlers.js`**
```js
const { ipcMain } = require('electron')
const repo = require('../database/repositories/projectsRepository')

function registerProjectsHandlers() {

  ipcMain.handle('projects:getAll', () => {
    return repo.getAllProjects()
  })

  ipcMain.handle('projects:getById', (_, id) => {
    return repo.getProjectById(id)
  })

  ipcMain.handle('projects:create', (_, data) => {
    const id = repo.createProject(data)
    return repo.getProjectById(id)
  })

  ipcMain.handle('projects:update', (_, id, data) => {
    repo.updateProject(id, data)
    return repo.getProjectById(id)
  })

  ipcMain.handle('projects:updateStatus', (_, id, status) => {
    repo.updateProjectStatus(id, status)
    return repo.getProjectById(id)
  })

  ipcMain.handle('projects:delete', (_, id) => {
    repo.deleteProject(id)
    return { success: true }
  })
}

module.exports = { registerProjectsHandlers }
```

---

## Task Move Handler (with position reorder)

**`src-electron/ipc/tasksHandlers.js`** — moveTask handler
```js
ipcMain.handle('tasks:move', (_, taskId, { newColumnId, newPosition }) => {
  const db = getDb()

  const moveTransaction = db.transaction(() => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)

    // Remove from old column: decrement positions above
    db.prepare(`
      UPDATE tasks SET position = position - 1
      WHERE column_id = ? AND position > ? AND id != ?
    `).run(task.column_id, task.position, taskId)

    // Open space in new column
    db.prepare(`
      UPDATE tasks SET position = position + 1
      WHERE column_id = ? AND position >= ?
    `).run(newColumnId, newPosition)

    // Place task in new position
    db.prepare(`
      UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newColumnId, newPosition, taskId)
  })

  moveTransaction()
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)
})
```

---

## File Selection Handler

**`src-electron/ipc/attachmentsHandlers.js`**
```js
const { ipcMain, dialog, shell } = require('electron')
const { getDb } = require('../database/db')
const fileManager = require('../utils/fileManager')
const path = require('path')
const { app } = require('electron')
const repo = require('../database/repositories/attachmentsRepository')

ipcMain.handle('files:selectFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

ipcMain.handle('attachments:add', async (_, taskId, sourcePath) => {
  const relativePath = await fileManager.saveAttachment(taskId, sourcePath)
  const stats = require('fs').statSync(sourcePath)
  const mime = require('mime-types').lookup(sourcePath) || 'application/octet-stream'

  const id = repo.createAttachment({
    task_id: taskId,
    filename: path.basename(relativePath),
    original_name: path.basename(sourcePath),
    file_path: relativePath,
    mime_type: mime,
    size_bytes: stats.size
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
```

---

## Main Process Entry Point

**`src-electron/electron-main.js`** — startup sequence
```js
const { app, BrowserWindow } = require('electron')
const path = require('path')
const { runMigrations } = require('./database/migrations')
const { registerAllHandlers } = require('./ipc/index')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    show: false  // show after ready-to-show
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
}

app.whenReady().then(() => {
  runMigrations()        // 1. run DB migrations
  registerAllHandlers()  // 2. register IPC handlers
  createWindow()         // 3. open window
})

app.on('window-all-closed', () => app.quit())
```

---

## Using IPC in Vue Components

**`src/composables/useIpc.js`**
```js
export function useIpc() {
  return window.electronAPI
}
```

**In a Vue component or Pinia store:**
```js
import { useIpc } from 'src/composables/useIpc'

const api = useIpc()

// In an async function:
const projects = await api.getProjects()
const newProject = await api.createProject({ name, color, logo_path, category_id })
```
