export const ImportRepository = {
  /** @returns {Promise<string|null>} */
  selectFile: () => {},
  /** @param {string} filePath @returns {Promise<TrelloPreview>} */
  parseTrello: (_filePath) => {},
  /** @param {object} params @returns {Promise<TrelloResult>} */
  runTrelloImport: (_params) => {},
}
