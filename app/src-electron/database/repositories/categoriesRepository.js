const { getDb } = require('../db')

function getAllCategories() {
  const db = getDb()
  return db
    .prepare(
      `
    SELECT c.*, COUNT(p.id) as project_count
    FROM categories c
    LEFT JOIN projects p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `
    )
    .all()
}

function getCategoryById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
}

function createCategory(name) {
  const db = getDb()
  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name)
  return result.lastInsertRowid
}

function updateCategory(id, name) {
  const db = getDb()
  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id)
}

function deleteCategory(id) {
  const db = getDb()
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
}
