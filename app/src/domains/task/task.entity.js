export const PRIORITIES = [
  { val: null,     label: 'None',   color: 'var(--zc-text-faint)' },
  { val: 'high',   label: 'High',   color: 'var(--zc-danger)'     },
  { val: 'medium', label: 'Medium', color: 'var(--zc-warning)'    },
  { val: 'low',    label: 'Low',    color: 'var(--zc-success)'    },
]

export const Task = {
  create: (data = {}) => ({
    id:               data.id               || null,
    project_id:       data.project_id       || null,
    column_id:        data.column_id        || null,
    title:            data.title            || '',
    description:      data.description      || '',
    position:         data.position         ?? 0,
    priority:         data.priority         || null,
    due_date:         data.due_date         || null,
    subtask_count:    data.subtask_count    || 0,
    subtask_done:     data.subtask_done     || 0,
    attachment_count: data.attachment_count || 0,
    subtasks:         data.subtasks         || [],
    attachments:      data.attachments      || [],
    created_at:       data.created_at       || null,
    updated_at:       data.updated_at       || null,
  }),

  priorityColor: (priority) => {
    const p = PRIORITIES.find((x) => x.val === priority)
    return p?.color || 'var(--zc-text-faint)'
  },

  isOverdue: (task) => {
    if (!task.due_date) return false
    return new Date(task.due_date) < new Date()
  },
}

export const Subtask = {
  create: (data = {}) => ({
    id:         data.id         || null,
    task_id:    data.task_id    || null,
    title:      data.title      || '',
    completed:  data.completed  || false,
    position:   data.position   ?? 0,
    created_at: data.created_at || null,
  }),
}

export const Attachment = {
  create: (data = {}) => ({
    id:            data.id            || null,
    task_id:       data.task_id       || null,
    filename:      data.filename      || '',
    original_name: data.original_name || '',
    file_path:     data.file_path     || '',
    mime_type:     data.mime_type     || '',
    size_bytes:    data.size_bytes    || 0,
    created_at:    data.created_at    || null,
  }),

  formatSize: (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  },
}
