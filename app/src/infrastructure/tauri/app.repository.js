import { getVersion } from '@tauri-apps/api/app'
import { appDataDir, downloadDir } from '@tauri-apps/api/path'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open as shellOpen } from '@tauri-apps/plugin-shell'
import { open as dialogOpen, save as dialogSave } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { getDb } from './db'

export const AppRepository = {
  getVersion: () => getVersion(),

  getDataPath: () => appDataDir(),

  openDataFolder: async () => {
    const dir = await appDataDir()
    await shellOpen(dir)
  },

  selectExportPath: async () => {
    const today = new Date().toISOString().slice(0, 10)
    const dlDir = await downloadDir()
    return dialogSave({
      defaultPath: `${dlDir}/zntt-control-${today}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
  },

  exportData: async (filePath) => {
    const db = getDb()
    const version = await getVersion()
    const [categories, projects, columns, tasks, subtasks, attachments, settings] =
      await Promise.all([
        db.select('SELECT * FROM categories'),
        db.select('SELECT * FROM projects'),
        db.select('SELECT * FROM columns'),
        db.select('SELECT * FROM tasks'),
        db.select('SELECT * FROM subtasks'),
        db.select('SELECT * FROM attachments'),
        db.select('SELECT * FROM app_settings'),
      ])

    const data = {
      exported_at: new Date().toISOString(),
      version,
      data: { categories, projects, columns, tasks, subtasks, attachments, settings },
    }
    await writeTextFile(filePath, JSON.stringify(data, null, 2))
  },

  selectFile: () =>
    dialogOpen({
      multiple: false,
      filters: [
        { name: 'Images',    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'csv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    }),

  winMinimize:    () => getCurrentWindow().minimize(),
  winMaximize:    () => getCurrentWindow().toggleMaximize(),
  winClose:       () => getCurrentWindow().close(),
  winIsMaximized: () => getCurrentWindow().isMaximized(),

  onMaximizeChange: async (cb) => {
    const win = getCurrentWindow()
    const [unMax, unUnmax] = await Promise.all([
      win.listen('tauri://resize', async () => {
        const isMax = await win.isMaximized()
        cb(isMax)
      }),
    ])
    return unMax
  },
}
