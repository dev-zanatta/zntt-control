import Database from '@tauri-apps/plugin-sql'
import { appDataDir } from '@tauri-apps/api/path'

let _db = null
export let _appDataDir = ''

export async function initDb() {
  _appDataDir = await appDataDir()
  _db = await Database.load('sqlite:zntt.db')
  await _runMigrations(_db)
}

export function getDb() {
  if (!_db) throw new Error('Database not initialized — call initDb() first (in App.vue onMounted)')
  return _db
}

async function _runMigrations(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const rows = await db.select('SELECT name FROM _migrations')
  const applied = new Set(rows.map((r) => r.name))

  if (!applied.has('001_initial_schema')) {
    await _applySchema001(db)
    await db.execute("INSERT INTO _migrations (name) VALUES ('001_initial_schema')")
  }
}

async function _applySchema001(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
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
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS columns (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name           TEXT NOT NULL,
      position       INTEGER NOT NULL DEFAULT 0,
      is_done_column INTEGER NOT NULL DEFAULT 0,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
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
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0,
      position   INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await db.execute(`
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
  `)
  await db.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme', 'dark')")
}
