import { BoardRepository } from 'src/infrastructure/http/board.repository'

export const BoardService = {
  getBoard:     (projectId) => BoardRepository.getBoard(projectId),
  createColumn: (data)      => BoardRepository.createColumn(data),

  async updateColumnName(id, name) {
    await BoardRepository.updateColumn(id, { name })
  },

  async setDoneColumn(allColumns, targetColumn) {
    const newVal = !targetColumn.is_done_column
    for (const col of allColumns) {
      if (col.is_done_column && col.id !== targetColumn.id) {
        col.is_done_column = false
        await BoardRepository.updateColumn(col.id, { is_done_column: false })
      }
    }
    await BoardRepository.updateColumn(targetColumn.id, { is_done_column: newVal })
    return newVal
  },

  reorderColumns: (projectId, orderedIds) => BoardRepository.reorderColumns(projectId, orderedIds),

  async deleteColumn(column) {
    if (column.tasks?.length > 0) {
      throw new Error(`Cannot delete — ${column.tasks.length} task(s) inside. Move them first.`)
    }
    await BoardRepository.deleteColumn(column.id)
  },
}
