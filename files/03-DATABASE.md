# 03 — Database

## Technology
- **SQLite** via `better-sqlite3`
- File location: `app.getPath('userData') + '/database.sqlite'`
- All queries are synchronous (better-sqlite3 design — no async needed)

---

## Connection Setup

**`src-electron/database/db.js`**
```js
const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')

let db = null

function getDb() {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

module.exports = { getDb }
```

---

## Schema

### `app_settings`
```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```
Used for: `theme`, future global preferences.

---

### `categories`
```sql
CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### `projects`
```sql
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
);
```

---

### `columns`
```sql
CREATE TABLE IF NOT EXISTS columns (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  position       INTEGER NOT NULL DEFAULT 0,
  is_done_column INTEGER NOT NULL DEFAULT 0,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Position rules:**
- Columns are ordered left to right by `position` (ascending)
- Position is an integer starting at 0
- On reorder: update all affected column positions in a single transaction
- Only one column per project should have `is_done_column = 1`

---

### `tasks`
```sql
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
);
```

**Position rules:**
- Tasks are ordered top to bottom by `position` (ascending) within a column
- On drag-and-drop move: update `column_id` and `position` of the moved task,
  and reorder positions of tasks in both source and destination columns
- Use a transaction for all position updates

---

### `subtasks`
```sql
CREATE TABLE IF NOT EXISTS subtasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### `attachments`
```sql
CREATE TABLE IF NOT EXISTS attachments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    INTEGER,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**File path convention:**
- `file_path` stores relative path from userData root
- Example: `attachments/tasks/42/report.pdf`
- Full path resolved at runtime: `path.join(app.getPath('userData'), file_path)`

---

## Migrations System

**`src-electron/database/migrations.js`**
```js
const { getDb } = require('./db')

const migrations = [
  require('./migrations/001_initial_schema'),
  // require('./migrations/002_add_column_x'),  ← future
]

function runMigrations() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  for (const migration of migrations) {
    const already = db.prepare(
      'SELECT id FROM _migrations WHERE name = ?'
    ).get(migration.name)

    if (!already) {
      migration.up(db)
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name)
      console.log(`Migration applied: ${migration.name}`)
    }
  }
}

module.exports = { runMigrations }
```

**`src-electron/database/migrations/001_initial_schema.js`**
```js
module.exports = {
  name: '001_initial_schema',
  up(db) {
    db.exec(`
      -- paste full schema here (all CREATE TABLE statements above)
    `)
  }
}
```

Migrations run automatically on every app startup before any IPC handlers are registered.

---

## Repository Pattern

Each repository is a plain JS module with functions. No classes required.

**Example: `src-electron/database/repositories/projectsRepository.js`**
```js
const { getDb } = require('../db')

function getAllProjects() {
  const db = getDb()
  return db.prepare(`
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
  `).all()
}

function getProjectById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
}

function createProject({ name, color, logo_path, category_id }) {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO projects (name, color, logo_path, category_id)
    VALUES (?, ?, ?, ?)
  `).run(name, color, logo_path, category_id)
  return result.lastInsertRowid
}

function updateProject(id, fields) {
  const db = getDb()
  const updates = Object.keys(fields).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE projects SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...Object.values(fields), id)
}

function updateProjectStatus(id, status) {
  const db = getDb()
  db.prepare('UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, id)
}

function deleteProject(id) {
  const db = getDb()
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject
}
```

Apply the same pattern for all other repositories.
