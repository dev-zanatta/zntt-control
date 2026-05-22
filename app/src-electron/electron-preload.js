const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Projects
  getProjects:         ()           => ipcRenderer.invoke('projects:getAll'),
  getProject:          (id)         => ipcRenderer.invoke('projects:getById', id),
  createProject:       (data)       => ipcRenderer.invoke('projects:create', data),
  updateProject:       (id, data)   => ipcRenderer.invoke('projects:update', id, data),
  updateProjectStatus: (id, status) => ipcRenderer.invoke('projects:updateStatus', id, status),
  deleteProject:       (id)         => ipcRenderer.invoke('projects:delete', id),

  // Columns
  getColumns:    (projectId)           => ipcRenderer.invoke('columns:getByProject', projectId),
  createColumn:  (data)                => ipcRenderer.invoke('columns:create', data),
  updateColumn:  (id, data)            => ipcRenderer.invoke('columns:update', id, data),
  reorderColumns:(projectId, orderedIds) => ipcRenderer.invoke('columns:reorder', projectId, orderedIds),
  deleteColumn:  (id)                  => ipcRenderer.invoke('columns:delete', id),

  // Tasks
  getTasksByProject: (projectId) => ipcRenderer.invoke('tasks:getByProject', projectId),
  getTask:           (id)        => ipcRenderer.invoke('tasks:getById', id),
  createTask:        (data)      => ipcRenderer.invoke('tasks:create', data),
  updateTask:        (id, data)  => ipcRenderer.invoke('tasks:update', id, data),
  moveTask:          (id, data)  => ipcRenderer.invoke('tasks:move', id, data),
  deleteTask:        (id)        => ipcRenderer.invoke('tasks:delete', id),
  searchTasks:       (query)     => ipcRenderer.invoke('tasks:search', query),

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
  saveProjectLogo:  (projectId, src)   => ipcRenderer.invoke('projects:saveLogo', projectId, src),

  // Categories
  getCategories:  ()         => ipcRenderer.invoke('categories:getAll'),
  createCategory: (name)     => ipcRenderer.invoke('categories:create', name),
  updateCategory: (id, name) => ipcRenderer.invoke('categories:update', id, name),
  deleteCategory: (id)       => ipcRenderer.invoke('categories:delete', id),

  // Settings
  getSetting:    (key)        => ipcRenderer.invoke('settings:get', key),
  setSetting:    (key, value) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: ()           => ipcRenderer.invoke('settings:getAll'),

  // Trello import
  trelloSelectFile: ()         => ipcRenderer.invoke('trello:selectFile'),
  trelloParse:      (filePath) => ipcRenderer.invoke('trello:parse', filePath),
  trelloImport:     (params)   => ipcRenderer.invoke('trello:import', params),

  // App info & controls
  getAppVersion:    ()         => ipcRenderer.invoke('app:getVersion'),
  getDataPath:      ()         => ipcRenderer.invoke('app:getDataPath'),
  openDataFolder:   ()         => ipcRenderer.invoke('app:openDataFolder'),
  selectExportPath: ()         => ipcRenderer.invoke('app:selectExportPath'),
  exportData:       (filePath) => ipcRenderer.invoke('app:exportData', filePath),

  // Window controls
  winMinimize:     () => ipcRenderer.invoke('win:minimize'),
  winMaximize:     () => ipcRenderer.invoke('win:maximize'),
  winClose:        () => ipcRenderer.invoke('win:close'),
  winIsMaximized:  () => ipcRenderer.invoke('win:isMaximized'),
  onMaximizeChange: (cb) => {
    ipcRenderer.on('win:maximizeChange', (_, isMaximized) => cb(isMaximized))
  },
})
