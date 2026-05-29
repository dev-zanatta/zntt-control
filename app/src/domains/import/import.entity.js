export const TrelloImport = {
  createPreview: (data = {}) => ({
    boardName:    data.boardName    || '',
    lists:        data.lists        || [],
    totalCards:   data.totalCards   || 0,
    skippedLists: data.skippedLists || [],
  }),

  createResult: (data = {}) => ({
    projectId:      data.projectId      || null,
    tasksImported:  data.tasksImported  || 0,
    columnsCreated: data.columnsCreated || 0,
  }),
}
