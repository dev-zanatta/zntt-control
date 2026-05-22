const { getDb } = require('../db')

function getAllProjects() {
  const db = getDb()
  return db
    .prepare(
      `
    SELECT
      p.*,
      c.name AS category_name,
      COUNT(t.id) AS total_tasks,
      SUM(CASE WHEN col.is_done_column = 1 THEN 1 ELSE 0 END) AS done_tasks
    FROM projects p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN tasks t ON t.project_id = p.id
    LEFT JOIN columns col ON col.id = t.column_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `
    )
    .all()
}

function getProjectById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
}

function getProjectWithDetails(id) {
  const db = getDb()
  return db
    .prepare(
      `
    SELECT
      p.*,
      c.name AS category_name,
      COUNT(t.id) AS total_tasks,
      SUM(CASE WHEN col.is_done_column = 1 THEN 1 ELSE 0 END) AS done_tasks
    FROM projects p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN tasks t ON t.project_id = p.id
    LEFT JOIN columns col ON col.id = t.column_id
    WHERE p.id = ?
    GROUP BY p.id
  `
    )
    .get(id)
}

function createProject({ name, color, logo_path, category_id }) {
  const db = getDb()
  const result = db
    .prepare(
      `
    INSERT INTO projects (name, color, logo_path, category_id)
    VALUES (?, ?, ?, ?)
  `
    )
    .run(name, color, logo_path ?? null, category_id ?? null)
  return result.lastInsertRowid
}

function updateProject(id, fields) {
  const db = getDb()
  const updates = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(', ')
  db.prepare(`UPDATE projects SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
    ...Object.values(fields),
    id
  )
}

function updateProjectStatus(id, status) {
  const db = getDb()
  db.prepare(
    'UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(status, id)
}

function deleteProject(id) {
  const db = getDb()
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
}

module.exports = {
  getAllProjects,
  getProjectById,
  getProjectWithDetails,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
}
