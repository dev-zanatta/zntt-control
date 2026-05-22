const { getDb } = require('../db')

function getSubtaskById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id)
}

function createSubtask({ task_id, title, position }) {
  const db = getDb()
  const maxPos = db
    .prepare('SELECT MAX(position) as max FROM subtasks WHERE task_id = ?')
    .get(task_id)
  const pos = position ?? (maxPos.max ?? -1) + 1

  const result = db
    .prepare('INSERT INTO subtasks (task_id, title, position) VALUES (?, ?, ?)')
    .run(task_id, title, pos)
  return result.lastInsertRowid
}

function updateSubtask(id, fields) {
  const db = getDb()
  const updates = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(', ')
  db.prepare(`UPDATE subtasks SET ${updates} WHERE id = ?`).run(...Object.values(fields), id)
}

function toggleSubtask(id) {
  const db = getDb()
  db.prepare('UPDATE subtasks SET completed = 1 - completed WHERE id = ?').run(id)
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id)
}

function deleteSubtask(id) {
  const db = getDb()
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(id)
}

module.exports = {
  getSubtaskById,
  createSubtask,
  updateSubtask,
  toggleSubtask,
  deleteSubtask,
}
