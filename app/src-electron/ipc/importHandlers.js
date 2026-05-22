const { ipcMain, dialog, BrowserWindow } = require('electron')
const fs = require('fs')
const { getDb } = require('../database/db')

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Detect if a column name suggests it is a "done" column.
 * Matches: "concluí", "concluido", "done", "finished", "completo", "finalizado"
 */
function isDoneColumn(name) {
  return /conclu|done|finish|complet|finaliz/i.test(name)
}

/**
 * Parse and validate a Trello JSON export.
 * Returns a lightweight preview object (no side-effects).
 */
function parseTrelloExport(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Arquivo inválido.')
  if (!Array.isArray(raw.lists) || !Array.isArray(raw.cards)) {
    throw new Error('O arquivo não parece ser um export do Trello (campos lists/cards ausentes).')
  }

  // Active lists only, sorted by Trello position
  const activeLists = raw.lists
    .filter(l => !l.closed)
    .sort((a, b) => a.pos - b.pos)

  const activeListIds = new Set(activeLists.map(l => l.id))

  // Active cards in active lists only
  const activeCards = raw.cards.filter(c => !c.closed && activeListIds.has(c.idList))

  // Per-list card count
  const countByList = {}
  activeCards.forEach(c => {
    countByList[c.idList] = (countByList[c.idList] || 0) + 1
  })

  const lists = activeLists.map(l => ({
    id:        l.id,
    name:      l.name,
    cardCount: countByList[l.id] || 0,
    isDone:    isDoneColumn(l.name),
  }))

  const skippedLists = raw.lists
    .filter(l => l.closed)
    .map(l => l.name)

  return {
    boardName:    raw.name || 'Imported Project',
    lists,
    totalCards:   activeCards.length,
    skippedLists,
  }
}

/**
 * Execute the full import inside a single SQLite transaction.
 * Returns { projectId, columnsCreated, tasksImported }.
 */
function runImport(db, { filePath, mode, newProjectName, newProjectColor, existingProjectId }) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const preview = parseTrelloExport(raw)

  // Cards sorted by pos inside each list
  const cardsByList = {}
  preview.lists.forEach(l => { cardsByList[l.id] = [] })
  raw.cards
    .filter(c => !c.closed && cardsByList.hasOwnProperty(c.idList))
    .forEach(c => cardsByList[c.idList].push(c))
  Object.values(cardsByList).forEach(arr => arr.sort((a, b) => a.pos - b.pos))

  const importTx = db.transaction(() => {
    // ── 1. Resolve / create project ────────────────────────────────────────
    let projectId = existingProjectId || null

    if (mode === 'new') {
      const result = db
        .prepare('INSERT INTO projects (name, color) VALUES (?, ?)')
        .run(
          (newProjectName || preview.boardName).trim(),
          newProjectColor || '#7c6af7',
        )
      projectId = result.lastInsertRowid
    }

    if (!projectId) throw new Error('Project ID inválido.')

    // ── 2. Create columns ──────────────────────────────────────────────────
    // We append after existing columns if importing into existing project
    const existingColsResult = db
      .prepare('SELECT MAX(position) AS maxPos FROM columns WHERE project_id = ?')
      .get(projectId)
    let positionOffset = (existingColsResult?.maxPos ?? -1) + 1

    const listIdToColumnId = {}
    preview.lists.forEach((list, idx) => {
      const result = db
        .prepare(
          'INSERT INTO columns (project_id, name, position, is_done_column) VALUES (?, ?, ?, ?)',
        )
        .run(projectId, list.name, positionOffset + idx, list.isDone ? 1 : 0)
      listIdToColumnId[list.id] = result.lastInsertRowid
    })

    // ── 3. Create tasks ────────────────────────────────────────────────────
    let tasksImported = 0

    preview.lists.forEach(list => {
      const columnId = listIdToColumnId[list.id]
      const cards    = cardsByList[list.id] || []

      cards.forEach((card, position) => {
        const desc    = card.desc && card.desc.trim() ? card.desc.trim() : null
        const dueDate = card.due ? card.due.slice(0, 10) : null // ISO → YYYY-MM-DD

        db.prepare(
          `INSERT INTO tasks
             (project_id, column_id, title, description, position, due_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).run(projectId, columnId, card.name.trim(), desc, position, dueDate)

        tasksImported++
      })
    })

    return {
      projectId,
      columnsCreated: preview.lists.length,
      tasksImported,
    }
  })

  return importTx()
}

// ── IPC handlers ───────────────────────────────────────────────────────────

function registerImportHandlers() {
  // Open file picker — returns the selected file path or null
  ipcMain.handle('trello:selectFile', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win, {
      title:      'Selecionar export do Trello (.json)',
      properties: ['openFile'],
      filters:    [{ name: 'JSON', extensions: ['json'] }],
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // Parse and validate — returns preview or throws
  ipcMain.handle('trello:parse', async (_, filePath) => {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return parseTrelloExport(raw)
  })

  // Execute import — returns { projectId, columnsCreated, tasksImported }
  ipcMain.handle('trello:import', async (_, params) => {
    const db = getDb()
    return runImport(db, params)
  })
}

module.exports = { registerImportHandlers }
