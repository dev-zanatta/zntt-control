import { ref } from 'vue'
import { BoardService } from './board.service'

export function useBoard() {
  const columns = ref([])
  const loading = ref(false)

  async function fetchBoard(projectId) {
    loading.value = true
    try {
      const board = await BoardService.getBoard(projectId)
      columns.value = board.map((col) => ({ ...col, tasks: col.tasks || [] }))
    } finally {
      loading.value = false
    }
  }

  async function createColumn(data) {
    const col = await BoardService.createColumn(data)
    columns.value.push({ ...col, tasks: [] })
    return col
  }

  async function updateColumnName(col, name) {
    const trimmed = name.trim()
    if (!trimmed || trimmed === col.name) return
    await BoardService.updateColumnName(col.id, trimmed)
    col.name = trimmed
  }

  async function setDoneColumn(column) {
    const newVal = await BoardService.setDoneColumn(columns.value, column)
    column.is_done_column = newVal
  }

  function reorderColumns(projectId) {
    const ids = columns.value.map((c) => c.id)
    BoardService.reorderColumns(projectId, ids)
  }

  async function deleteColumn(column) {
    await BoardService.deleteColumn(column)
    columns.value = columns.value.filter((c) => c.id !== column.id)
  }

  return {
    columns,
    loading,
    fetchBoard,
    createColumn,
    updateColumnName,
    setDoneColumn,
    reorderColumns,
    deleteColumn,
  }
}
