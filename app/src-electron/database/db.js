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
