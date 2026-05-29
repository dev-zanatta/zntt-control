import { getDb } from './db'

export const BoardRepository = {
  getBoard: async (projectId) => {
    const db = getDb()
    const cols = await db.select(
      'SELECT * FROM columns WHERE project_id = ? ORDER BY position ASC',
      [projectId]
    )

    const tasks = await db.select(
      `SELECT t.*,
        COUNT(DISTINCT s.id)                                    AS subtask_count,
        SUM(CASE WHEN s.completed = 1 THEN 1 ELSE 0 END)       AS subtask_done,
        COUNT(DISTINCT a.id)                                    AS attachment_count
       FROM tasks t
       LEFT JOIN subtasks s    ON s.task_id = t.id
       LEFT JOIN attachments a ON a.task_id = t.id
       WHERE t.project_id = ?
       GROUP BY t.id
       ORDER BY t.position ASC`,
      [projectId]
    )

    return cols.map((col) => ({
      ...col,
      tasks: tasks.filter((t) => t.column_id === col.id),
    }))
  },

  createColumn: async (data) => {
    const db = getDb()
    const result = await db.execute(
      'INSERT INTO columns (project_id, name, position, is_done_column) VALUES (?, ?, ?, ?)',
      [data.project_id, data.name, data.position ?? 0, data.is_done_column ?? 0]
    )
    const rows = await db.select('SELECT * FROM columns WHERE id = ?', [result.lastInsertId])
    return rows[0]
  },

  updateColumn: async (id, fields) => {
    const db = getDb()
    const keys = Object.keys(fields)
    const sets = keys.map((k) => `${k} = ?`).join(', ')
    await db.execute(`UPDATE columns SET ${sets} WHERE id = ?`, [...Object.values(fields), id])
  },

  reorderColumns: async (projectId, orderedIds) => {
    const db = getDb()
    await db.execute('BEGIN')
    try {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.execute(
          'UPDATE columns SET position = ? WHERE id = ? AND project_id = ?',
          [i, orderedIds[i], projectId]
        )
      }
      await db.execute('COMMIT')
    } catch (e) {
      await db.execute('ROLLBACK')
      throw e
    }
  },

  deleteColumn: async (id) => {
    const db = getDb()
    await db.execute('DELETE FROM columns WHERE id = ?', [id])
  },
}
