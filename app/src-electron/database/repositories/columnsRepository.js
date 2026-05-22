const { getDb } = require('../db')

function getColumnsByProject(projectId) {
  const db = getDb()
  return db
    .prepare('SELECT * FROM columns WHERE project_id = ? ORDER BY position ASC')
    .all(projectId)
}

function getColumnById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM columns WHERE id = ?').get(id)
}

function createColumn({ project_id, name, position, is_done_column = 0 }) {
  const db = getDb()
  const result = db
    .prepare(
      `
    INSERT INTO columns (project_id, name, position, is_done_column)
    VALUES (?, ?, ?, ?)
  `
    )
    .run(project_id, name, position, is_done_column)
  return result.lastInsertRowid
}

function updateColumn(id, fields) {
  const db = getDb()
  const updates = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(', ')
  db.prepare(`UPDATE columns SET ${updates} WHERE id = ?`).run(...Object.values(fields), id)
}

function reorderColumns(projectId, orderedIds) {
  const db = getDb()
  const reorderTx = db.transaction(() => {
    orderedIds.forEach((id, index) => {
      db.prepare('UPDATE columns SET position = ? WHERE id = ? AND project_id = ?').run(
        index,
        id,
        projectId
      )
    })
  })
  reorderTx()
}

function deleteColumn(id) {
  const db = getDb()
  db.prepare('DELETE FROM columns WHERE id = ?').run(id)
}

module.exports = {
  getColumnsByProject,
  getColumnById,
  createColumn,
  updateColumn,
  reorderColumns,
  deleteColumn,
}
