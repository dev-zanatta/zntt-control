import { appDataDir, join } from '@tauri-apps/api/path'
import { copyFile, mkdir, remove } from '@tauri-apps/plugin-fs'
import { open as shellOpen } from '@tauri-apps/plugin-shell'
import { getDb } from './db'

const MIME_TYPES = {
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.bmp': 'image/bmp', '.svg': 'image/svg+xml', '.txt': 'text/plain',
  '.md': 'text/markdown', '.csv': 'text/csv', '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

async function _getFullTask(db, id) {
  const rows = await db.select('SELECT * FROM tasks WHERE id = ?', [id])
  if (!rows.length) return null
  const task = rows[0]
  task.subtasks = await db.select(
    'SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC',
    [id]
  )
  task.attachments = await db.select(
    'SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at ASC',
    [id]
  )
  return task
}

export const TaskRepository = {
  getById: async (id) => {
    const db = getDb()
    return _getFullTask(db, id)
  },

  create: async (data) => {
    const db = getDb()
    const pos = await db
      .select('SELECT MAX(position) as max FROM tasks WHERE column_id = ?', [data.column_id])
      .then((r) => (r[0]?.max ?? -1) + 1)
    const result = await db.execute(
      'INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.project_id, data.column_id, data.title, data.description ?? null, data.priority ?? null, data.due_date ?? null, pos]
    )
    return _getFullTask(db, result.lastInsertId)
  },

  update: async (id, fields) => {
    const db = getDb()
    const keys = Object.keys(fields)
    const sets = keys.map((k) => `${k} = ?`).join(', ')
    await db.execute(
      `UPDATE tasks SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...Object.values(fields), id]
    )
    return _getFullTask(db, id)
  },

  move: async (taskId, { newColumnId, newPosition }) => {
    const db = getDb()
    await db.execute('BEGIN')
    try {
      const [task] = await db.select('SELECT * FROM tasks WHERE id = ?', [taskId])
      await db.execute(
        'UPDATE tasks SET position = position - 1 WHERE column_id = ? AND position > ? AND id != ?',
        [task.column_id, task.position, taskId]
      )
      await db.execute(
        'UPDATE tasks SET position = position + 1 WHERE column_id = ? AND position >= ?',
        [newColumnId, newPosition]
      )
      await db.execute(
        'UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newColumnId, newPosition, taskId]
      )
      await db.execute('COMMIT')
    } catch (e) {
      await db.execute('ROLLBACK')
      throw e
    }
  },

  delete: async (id) => {
    const db = getDb()
    await db.execute('DELETE FROM tasks WHERE id = ?', [id])
  },

  search: async (query, limit = 25) => {
    const db = getDb()
    return db.select(
      `SELECT t.id, t.title, t.description, t.priority, t.due_date,
              t.project_id, t.column_id,
              p.name  AS project_name,
              p.color AS project_color,
              c.name  AS column_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN columns  c ON c.id = t.column_id
       WHERE t.title LIKE ? OR t.description LIKE ?
       ORDER BY t.updated_at DESC
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, limit]
    )
  },

  createSubtask: async (data) => {
    const db = getDb()
    const pos = await db
      .select('SELECT MAX(position) as max FROM subtasks WHERE task_id = ?', [data.task_id])
      .then((r) => (r[0]?.max ?? -1) + 1)
    const result = await db.execute(
      'INSERT INTO subtasks (task_id, title, position) VALUES (?, ?, ?)',
      [data.task_id, data.title, pos]
    )
    const rows = await db.select('SELECT * FROM subtasks WHERE id = ?', [result.lastInsertId])
    return rows[0]
  },

  toggleSubtask: async (id) => {
    const db = getDb()
    await db.execute('UPDATE subtasks SET completed = 1 - completed WHERE id = ?', [id])
    const rows = await db.select('SELECT * FROM subtasks WHERE id = ?', [id])
    return rows[0]
  },

  deleteSubtask: async (id) => {
    const db = getDb()
    await db.execute('DELETE FROM subtasks WHERE id = ?', [id])
  },

  addAttachment: async (taskId, sourcePath) => {
    const ext = sourcePath.includes('.') ? '.' + sourcePath.split('.').pop().toLowerCase() : ''
    const uuid = crypto.randomUUID()
    const filename = uuid + ext
    const dataDir = await appDataDir()
    const destDir = await join(dataDir, 'attachments', 'tasks', String(taskId))
    await mkdir(destDir, { recursive: true })
    const destPath = await join(destDir, filename)
    await copyFile(sourcePath, destPath)

    const mime = MIME_TYPES[ext] ?? 'application/octet-stream'
    const db = getDb()
    const result = await db.execute(
      'INSERT INTO attachments (task_id, filename, original_name, file_path, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)',
      [taskId, filename, sourcePath.split(/[\\/]/).pop(), destPath, mime, 0]
    )
    const rows = await db.select('SELECT * FROM attachments WHERE id = ?', [result.lastInsertId])
    return rows[0]
  },

  deleteAttachment: async (id) => {
    const db = getDb()
    const [att] = await db.select('SELECT * FROM attachments WHERE id = ?', [id])
    if (att?.file_path) {
      try { await remove(att.file_path) } catch (_) {}
    }
    await db.execute('DELETE FROM attachments WHERE id = ?', [id])
  },

  openAttachment: async (id) => {
    const db = getDb()
    const [att] = await db.select('SELECT * FROM attachments WHERE id = ?', [id])
    if (att?.file_path) await shellOpen(att.file_path)
  },
}
