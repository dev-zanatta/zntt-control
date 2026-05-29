export const Category = {
  create: (data = {}) => ({
    id:            data.id            || null,
    name:          data.name          || '',
    project_count: data.project_count || 0,
  }),

  canDelete: (category) => category.project_count === 0,
}
