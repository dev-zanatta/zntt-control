import { open as dialogOpen } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { getDb } from './db'

function _isDoneColumn(name) {
  return /conclu|done|finish|complet|finaliz/i.test(name)
}

function _parseTrelloExport(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Arquivo inválido.')
  if (!Array.isArray(raw.lists) || !Array.isArray(raw.cards)) {
    throw new Error('O arquivo não parece ser um export do Trello (campos lists/cards ausentes).')
  }

  const activeLists = raw.lists.filter((l) => !l.closed).sort((a, b) => a.pos - b.pos)
  const activeListIds = new Set(activeLists.map((l) => l.id))
  const activeCards = raw.cards.filter((c) => !c.closed && activeListIds.has(c.idList))

  const countByList = {}
  activeCards.forEach((c) => { countByList[c.idList] = (countByList[c.idList] || 0) + 1 })

  return {
    boardName:    raw.name || 'Imported Project',
    lists:        activeLists.map((l) => ({
      id:        l.id,
      name:      l.name,
      cardCount: countByList[l.id] || 0,
      isDone:    _isDoneColumn(l.name),
    })),
    totalCards:   activeCards.length,
    skippedLists: raw.lists.filter((l) => l.closed).map((l) => l.name),
    _rawCards:    activeCards,
  }
}

export const ImportRepository = {
  selectFile: () =>
    dialogOpen({
      title:      'Selecionar export do Trello (.json)',
      multiple:   false,
      filters:    [{ name: 'JSON', extensions: ['json'] }],
    }),

  parseTrello: async (filePath) => {
    const text = await readTextFile(filePath)
    const raw = JSON.parse(text)
    const result = _parseTrelloExport(raw)
    const { _rawCards: _, ...preview } = result
    return preview
  },

  runTrelloImport: async ({ filePath, mode, newProjectName, newProjectColor, existingProjectId }) => {
    const text = await readTextFile(filePath)
    const raw = JSON.parse(text)
    const parsed = _parseTrelloExport(raw)

    const cardsByListId = {}
    parsed.lists.forEach((l) => { cardsByListId[l.id] = [] })
    parsed._rawCards
      .filter((c) => cardsByListId.hasOwnProperty(c.idList))
      .forEach((c) => cardsByListId[c.idList].push(c))
    Object.values(cardsByListId).forEach((arr) => arr.sort((a, b) => a.pos - b.pos))

    const db = getDb()
    await db.execute('BEGIN')
    try {
      let projectId = existingProjectId ?? null
      if (mode === 'new') {
        const r = await db.execute(
          'INSERT INTO projects (name, color) VALUES (?, ?)',
          [(newProjectName || parsed.boardName).trim(), newProjectColor || '#7c6af7']
        )
        projectId = r.lastInsertId
      }
      if (!projectId) throw new Error('Project ID inválido.')

      const [posRow] = await db.select(
        'SELECT MAX(position) AS maxPos FROM columns WHERE project_id = ?',
        [projectId]
      )
      let posOffset = (posRow?.maxPos ?? -1) + 1

      const listIdToColId = {}
      for (let i = 0; i < parsed.lists.length; i++) {
        const list = parsed.lists[i]
        const r = await db.execute(
          'INSERT INTO columns (project_id, name, position, is_done_column) VALUES (?, ?, ?, ?)',
          [projectId, list.name, posOffset + i, list.isDone ? 1 : 0]
        )
        listIdToColId[list.id] = r.lastInsertId
      }

      let tasksImported = 0
      for (const list of parsed.lists) {
        const columnId = listIdToColId[list.id]
        const cards = cardsByListId[list.id] || []
        for (let pos = 0; pos < cards.length; pos++) {
          const card = cards[pos]
          await db.execute(
            'INSERT INTO tasks (project_id, column_id, title, description, position, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            [projectId, columnId, card.name.trim(), card.desc?.trim() || null, pos, card.due ? card.due.slice(0, 10) : null]
          )
          tasksImported++
        }
      }

      await db.execute('COMMIT')
      return { projectId, columnsCreated: parsed.lists.length, tasksImported }
    } catch (e) {
      await db.execute('ROLLBACK')
      throw e
    }
  },
}
