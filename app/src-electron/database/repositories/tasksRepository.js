const { getDb } = require('../db')

function getTasksByProject(projectId) {
  const db = getDb()
  const cols = db
    .prepare('SELECT * FROM columns WHERE project_id = ? ORDER BY position ASC')
    .all(projectId)

  return cols.map((col) => ({
    ...col,
    tasks: db
      .prepare(
        `SELECT t.*,
          COUNT(DISTINCT s.id) AS subtask_count,
          SUM(CASE WHEN s.completed = 1 THEN 1 ELSE 0 END) AS subtask_done,
          COUNT(DISTINCT a.id) AS attachment_count
        FROM tasks t
        LEFT JOIN subtasks s ON s.task_id = t.id
        LEFT JOIN attachments a ON a.task_id = t.id
        WHERE t.column_id = ?
        GROUP BY t.id
        ORDER BY t.position ASC`
      )
      .all(col.id),
  }))
}

function getTaskById(id) {
  console.log('[zntt-repo] getTaskById: id =', id, '| tipo:', typeof id)
  const db = getDb()
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  console.log('[zntt-repo] getTaskById: task raw do DB =', task ? `id=${task.id} title="${task.title}" column_id=${task.column_id}` : task)
  if (!task) {
    console.warn('[zntt-repo] getTaskById: task NÃO encontrado para id =', id)
    return null
  }

  task.subtasks = db
    .prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC')
    .all(id)
  console.log('[zntt-repo] getTaskById: subtasks.length =', task.subtasks.length)

  task.attachments = db
    .prepare('SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at ASC')
    .all(id)
  console.log('[zntt-repo] getTaskById: attachments.length =', task.attachments.length)

  console.log('[zntt-repo] getTaskById: retornando task completa OK')
  return task
}

function createTask({ project_id, column_id, title, description, priority, due_date }) {
  const db = getDb()
  const maxPos = db
    .prepare('SELECT MAX(position) as max FROM tasks WHERE column_id = ?')
    .get(column_id)
  const position = (maxPos.max ?? -1) + 1

  const result = db
    .prepare(
      `
    INSERT INTO tasks (project_id, column_id, title, description, priority, due_date, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      project_id,
      column_id,
      title,
      description ?? null,
      priority ?? null,
      due_date ?? null,
      position
    )

  return result.lastInsertRowid
}

function updateTask(id, fields) {
  const db = getDb()
  const updates = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(', ')
  db.prepare(
    `UPDATE tasks SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(...Object.values(fields), id)
}

function deleteTask(id) {
  const db = getDb()
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
}

function searchTasks(query, limit = 25) {
  const db = getDb()
  return db
    .prepare(
      `SELECT
        t.id, t.title, t.description, t.priority, t.due_date,
        t.project_id, t.column_id,
        p.name  AS project_name,
        p.color AS project_color,
        c.name  AS column_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN columns  c ON c.id = t.column_id
       WHERE t.title LIKE ? OR t.description LIKE ?
       ORDER BY t.updated_at DESC
       LIMIT ?`
    )
    .all(`%${query}%`, `%${query}%`, limit)
}

module.exports = {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  searchTasks,
}
