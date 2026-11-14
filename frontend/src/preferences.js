export const defaults = { theme: 'system', compact: false, viewMode: 'list', sort: 'name', showHidden: false }
export function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem('locloud:preferences') || '{}')
    return {
      theme: ['system', 'light', 'dark'].includes(saved.theme) ? saved.theme : localStorage.getItem('theme') || defaults.theme,
      compact: saved.compact ?? (localStorage.getItem('compact') === 'true'),
      viewMode: saved.viewMode === 'grid' ? 'grid' : 'list',
      sort: ['name', 'newest', 'size'].includes(saved.sort) ? saved.sort : 'name',
      showHidden: saved.showHidden === true,
    }
  } catch { return { ...defaults } }
}
export function formatSize(bytes = 0) {
  if (!bytes) return '0 B'
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 4)
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${['B', 'KiB', 'MiB', 'GiB', 'TiB'][index]}`
}
