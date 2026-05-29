export const BoardRepository = {
  /** @param {number} projectId @returns {Promise<Column[]>} columns with tasks nested */
  getBoard: (_projectId) => {},
  /** @param {object} data @returns {Promise<Column>} */
  createColumn: (_data) => {},
  /** @param {number} id @param {object} data @returns {Promise<void>} */
  updateColumn: (_id, _data) => {},
  /** @param {number} projectId @param {number[]} orderedIds @returns {Promise<void>} */
  reorderColumns: (_projectId, _orderedIds) => {},
  /** @param {number} id @returns {Promise<void>} */
  deleteColumn: (_id) => {},
}
