const { getDb } = require('../db')

function getSetting(key) {
  const db = getDb()
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key)
  return row ? row.value : null
}

function setSetting(key, value) {
  const db = getDb()
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value)
}

function getAllSettings() {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM app_settings').all()
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {})
}

module.exports = { getSetting, setSetting, getAllSettings }
