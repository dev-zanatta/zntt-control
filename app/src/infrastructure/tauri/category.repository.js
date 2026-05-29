import { getDb } from './db'

export const CategoryRepository = {
  getAll: async () => {
    const db = getDb()
    return db.select(`
      SELECT c.*, COUNT(p.id) as project_count
      FROM categories c
      LEFT JOIN projects p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `)
  },

  create: async (name) => {
    const db = getDb()
    const result = await db.execute(
      'INSERT INTO categories (name) VALUES (?)',
      [name]
    )
    const rows = await db.select('SELECT * FROM categories WHERE id = ?', [result.lastInsertId])
    return rows[0]
  },

  update: async (id, name) => {
    const db = getDb()
    await db.execute('UPDATE categories SET name = ? WHERE id = ?', [name, id])
  },

  delete: async (id) => {
    const db = getDb()
    await db.execute('DELETE FROM categories WHERE id = ?', [id])
  },
}
