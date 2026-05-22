const { getDb } = require('./db')

const migrations = [require('./migrations/001_initial_schema')]

function runMigrations() {
  const db = getDb()

  db.prepare(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  for (const migration of migrations) {
    const already = db.prepare('SELECT id FROM _migrations WHERE name = ?').get(migration.name)

    if (!already) {
      migration.up(db)
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name)
      console.log(`Migration applied: ${migration.name}`)
    }
  }
}

module.exports = { runMigrations }
