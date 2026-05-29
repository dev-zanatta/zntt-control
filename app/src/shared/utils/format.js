export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', options)
}
