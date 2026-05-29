export const Column = {
  create: (data = {}) => ({
    id:             data.id             || null,
    project_id:     data.project_id     || null,
    name:           data.name           || '',
    position:       data.position       ?? 0,
    is_done_column: data.is_done_column || 0,
    tasks:          data.tasks          || [],
  }),
}

export const DEFAULT_COLUMNS = [
  { name: 'Backlog', done: false },
  { name: 'Doing',   done: false },
  { name: 'Review',  done: false },
  { name: 'Done',    done: true  },
]
