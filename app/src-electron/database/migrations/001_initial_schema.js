module.exports = {
  name: '001_initial_schema',
  up(db) {
    const createSchema = db.transaction(() => {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `).run()

      db.prepare(`
        CREATE TABLE IF NOT EXISTS categories (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      db.prepare(`
        CREATE TABLE IF NOT EXISTS projects (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        TEXT NOT NULL,
          color       TEXT NOT NULL DEFAULT '#7c6af7',
          logo_path   TEXT,
          category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
          status      TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'paused', 'completed')),
          created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      db.prepare(`
        CREATE TABLE IF NOT EXISTS columns (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          name           TEXT NOT NULL,
          position       INTEGER NOT NULL DEFAULT 0,
          is_done_column INTEGER NOT NULL DEFAULT 0,
          created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      db.prepare(`
        CREATE TABLE IF NOT EXISTS tasks (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          column_id   INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
          title       TEXT NOT NULL,
          description TEXT,
          position    INTEGER NOT NULL DEFAULT 0,
          priority    TEXT CHECK(priority IN ('low', 'medium', 'high')),
          due_date    DATE,
          created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      db.prepare(`
        CREATE TABLE IF NOT EXISTS subtasks (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          title      TEXT NOT NULL,
          completed  INTEGER NOT NULL DEFAULT 0,
          position   INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()

      db.prepare(`
        CREATE TABLE IF NOT EXISTS attachments (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          filename      TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_path     TEXT NOT NULL,
          mime_type     TEXT,
          size_bytes    INTEGER,
          created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
    })

    createSchema()

    db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'dark')").run()
  },
}
