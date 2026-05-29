import { getDb } from './db'

export const SettingsRepository = {
  get: async (key) => {
    const db = getDb()
    const rows = await db.select('SELECT value FROM app_settings WHERE key = ?', [key])
    return rows.length > 0 ? rows[0].value : null
  },

  set: async (key, value) => {
    const db = getDb()
    await db.execute(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      [key, value]
    )
  },
}
