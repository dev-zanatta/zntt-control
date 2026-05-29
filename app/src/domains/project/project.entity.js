import { convertFileSrc } from '@tauri-apps/api/core'

export const PROJECT_COLORS = [
  '#7c6af7', '#3ecfcf', '#e0a050', '#4caf82',
  '#e05c5c', '#9b7af7', '#7c9af7', '#e6b070',
]

export const PROJECT_STATUSES = ['active', 'paused', 'completed']

export const Project = {
  create: (data = {}) => ({
    id:            data.id            || null,
    name:          data.name          || '',
    color:         data.color         || PROJECT_COLORS[0],
    logo_path:     data.logo_path     || null,
    category_id:   data.category_id   || null,
    category_name: data.category_name || null,
    status:        data.status        || 'active',
    total_tasks:   data.total_tasks   || 0,
    done_tasks:    data.done_tasks    || 0,
    created_at:    data.created_at    || null,
    updated_at:    data.updated_at    || null,
  }),

  progress: (project) => {
    if (!project || project.total_tasks === 0) return 0
    return Math.round((project.done_tasks / project.total_tasks) * 100)
  },

  initials: (project) => (project?.name || 'P').slice(0, 2).toUpperCase(),

  logoSrc: (logoPath) => {
    if (!logoPath) return null
    if (logoPath.startsWith('blob:') || logoPath.startsWith('data:')) return logoPath
    return convertFileSrc(logoPath)
  },
}
