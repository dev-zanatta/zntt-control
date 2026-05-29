import { appDataDir, join } from '@tauri-apps/api/path'
import { copyFile, mkdir } from '@tauri-apps/plugin-fs'
import { getDb } from './db'

const PROJECT_DETAILS_SQL = `
  SELECT
    p.*,
    c.name AS category_name,
    COUNT(t.id) AS total_tasks,
    SUM(CASE WHEN col.is_done_column = 1 THEN 1 ELSE 0 END) AS done_tasks
  FROM projects p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN tasks t ON t.project_id = p.id
  LEFT JOIN columns col ON col.id = t.column_id
`

export const ProjectRepository = {
  getAll: async () => {
    const db = getDb()
    return db.select(PROJECT_DETAILS_SQL + ' GROUP BY p.id ORDER BY p.created_at DESC')
  },

  getById: async (id) => {
    const db = getDb()
    const rows = await db.select(PROJECT_DETAILS_SQL + ' WHERE p.id = ? GROUP BY p.id', [id])
    return rows[0] ?? null
  },

  create: async (data) => {
    const db = getDb()
    const result = await db.execute(
      'INSERT INTO projects (name, color, logo_path, category_id) VALUES (?, ?, ?, ?)',
      [data.name, data.color, data.logo_path ?? null, data.category_id ?? null]
    )
    const rows = await db.select(PROJECT_DETAILS_SQL + ' WHERE p.id = ? GROUP BY p.id', [result.lastInsertId])
    return rows[0]
  },

  update: async (id, fields) => {
    const db = getDb()
    const keys = Object.keys(fields)
    const sets = keys.map((k) => `${k} = ?`).join(', ')
    await db.execute(
      `UPDATE projects SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...Object.values(fields), id]
    )
    const rows = await db.select(PROJECT_DETAILS_SQL + ' WHERE p.id = ? GROUP BY p.id', [id])
    return rows[0]
  },

  updateStatus: async (id, status) => {
    const db = getDb()
    await db.execute(
      'UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    )
    const rows = await db.select(PROJECT_DETAILS_SQL + ' WHERE p.id = ? GROUP BY p.id', [id])
    return rows[0]
  },

  delete: async (id) => {
    const db = getDb()
    await db.execute('DELETE FROM projects WHERE id = ?', [id])
  },

  saveLogo: async (projectId, sourcePath) => {
    const dataDir = await appDataDir()
    const ext = sourcePath.includes('.') ? sourcePath.split('.').pop() : 'png'
    const destDir = await join(dataDir, 'attachments', 'projects', String(projectId))
    await mkdir(destDir, { recursive: true })
    const destPath = await join(destDir, `logo.${ext}`)
    await copyFile(sourcePath, destPath)

    const db = getDb()
    await db.execute(
      'UPDATE projects SET logo_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [destPath, projectId]
    )
    return destPath
  },
}
