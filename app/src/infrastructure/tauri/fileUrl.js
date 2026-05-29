import { convertFileSrc } from '@tauri-apps/api/core'
import { _appDataDir } from './db'

/**
 * Converts a file path (absolute or relative to appDataDir) to a Tauri
 * asset:// URL suitable for use in <img> src or CSS background-image.
 *
 * Absolute paths are converted directly.
 * Relative paths are joined with appDataDir first.
 * Blob/data URLs are returned as-is (used for previews before saving).
 */
export function fileUrl(filePath) {
  if (!filePath) return null
  if (filePath.startsWith('blob:') || filePath.startsWith('data:')) return filePath
  if (/^[A-Za-z]:[\\/]/.test(filePath) || filePath.startsWith('/')) {
    return convertFileSrc(filePath)
  }
  if (_appDataDir) {
    const sep = _appDataDir.endsWith('/') || _appDataDir.endsWith('\\') ? '' : '/'
    return convertFileSrc(_appDataDir + sep + filePath)
  }
  return null
}
