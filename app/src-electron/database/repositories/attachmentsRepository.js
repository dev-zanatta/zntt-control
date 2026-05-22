const { getDb } = require('../db')

function getAttachmentById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM attachments WHERE id = ?').get(id)
}

function getAttachmentsByTask(taskId) {
  const db = getDb()
  return db
    .prepare('SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at ASC')
    .all(taskId)
}

function createAttachment({ task_id, filename, original_name, file_path, mime_type, size_bytes }) {
  const db = getDb()
  const result = db
    .prepare(
      `
    INSERT INTO attachments (task_id, filename, original_name, file_path, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    )
    .run(task_id, filename, original_name, file_path, mime_type ?? null, size_bytes ?? null)
  return result.lastInsertRowid
}

function deleteAttachment(id) {
  const db = getDb()
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id)
}

module.exports = {
  getAttachmentById,
  getAttachmentsByTask,
  createAttachment,
  deleteAttachment,
}
