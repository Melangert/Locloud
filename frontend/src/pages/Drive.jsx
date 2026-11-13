import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronRight, FolderPlus, Grid2X2, List, LogOut, Menu, Plus, Search, Settings, X } from 'lucide-react'
import { createFolder, deleteFile, deleteFolder, getErrorMessage, getFiles, getFolders, getStorageUsage, moveFile } from '../api'
import FileExplorer from '../components/FileExplorer'
import FolderTree from '../components/FolderTree'
import UploadButton from '../components/UploadButton'
import StorageBar from '../components/StorageBar'

function SettingsPanel({ preferences, setPreferences, onClose, onLogout }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="panel-heading"><div><p className="eyebrow">Workspace</p><h2>Settings</h2></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div>
        <div className="settings-section">
          <h3>Appearance</h3>
          <label className="setting-row"><span><strong>Theme</strong><small>Choose how Locloud looks on this device.</small></span><select value={preferences.theme} onChange={(event) => setPreferences({ ...preferences, theme: event.target.value })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <label className="setting-row"><span><strong>Compact file list</strong><small>Reduce row spacing when you have lots of files.</small></span><input type="checkbox" checked={preferences.compact} onChange={(event) => setPreferences({ ...preferences, compact: event.target.checked })} /></label>
        </div>
        <div className="settings-section">
          <h3>Session</h3>
          <button className="button button-secondary button-wide" onClick={onLogout}><LogOut size={16} />Sign out</button>
        </div>
      </section>
    </div>
  )
}

export default function Drive() {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [usage, setUsage] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [preferences, setPreferences] = useState(() => {
    try { return { theme: localStorage.getItem('theme') || 'system', compact: localStorage.getItem('compact') === 'true' } } catch { return { theme: 'system', compact: false } }
  })
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nextFiles, nextFolders, nextUsage] = await Promise.all([getFiles(currentFolder), getFolders(currentFolder), getStorageUsage()])
      setFiles(nextFiles)
      setFolders(nextFolders)
      setUsage(nextUsage)
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [currentFolder])

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])
  useEffect(() => {
    localStorage.setItem('theme', preferences.theme)
    localStorage.setItem('compact', String(preferences.compact))
    document.documentElement.dataset.theme = preferences.theme
  }, [preferences])
  useEffect(() => {
    const handleUnauthorized = () => navigate('/login')
    window.addEventListener('locloud:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('locloud:unauthorized', handleUnauthorized)
  }, [navigate])

  const filteredFiles = useMemo(() => files.filter((file) => file.name.toLowerCase().includes(search.toLowerCase())), [files, search])
  const filteredFolders = useMemo(() => folders.filter((folder) => folder.name.toLowerCase().includes(search.toLowerCase())), [folders, search])

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  async function handleDeleteFile(id) {
    if (!window.confirm('Delete this file?')) return
    try { await deleteFile(id); await load() } catch (actionError) { setError(getErrorMessage(actionError)) }
  }

  async function handleDeleteFolder(id) {
    if (!window.confirm('Delete this folder and everything inside it?')) return
    try { await deleteFolder(id); await load() } catch (actionError) { setError(getErrorMessage(actionError)) }
  }

  async function handleMoveFile(fileId, folderId) {
    try {
      await moveFile(fileId, folderId)
      await load()
    } catch (actionError) {
      setError(getErrorMessage(actionError))
    }
  }

  async function handleCreateFolder() {
    const name = window.prompt('Name your new folder')
    if (!name?.trim()) return
    try { await createFolder(name.trim(), currentFolder); await load() } catch (actionError) { setError(getErrorMessage(actionError)) }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark">L</div><span>Locloud</span><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
        <div className="sidebar-actions">
          <UploadButton currentFolder={currentFolder} onUpload={load} onError={setError} />
          <button className="button button-secondary button-wide" onClick={handleCreateFolder}><FolderPlus size={17} />New folder</button>
        </div>
        <FolderTree currentFolder={currentFolder} onSelect={(folder) => { setCurrentFolder(folder); setSidebarOpen(false) }} />
        <div className="sidebar-bottom">
          <StorageBar usage={usage} />
          <button className="nav-item" onClick={() => setSettingsOpen(true)}><Settings size={17} /><span>Settings</span></button>
          <button className="nav-item" onClick={logout}><LogOut size={17} /><span>Sign out</span></button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="search-box"><Search size={18} /><input placeholder="Search in your drive" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></div>
          <button className="icon-button" title="Settings" onClick={() => setSettingsOpen(true)}><Settings size={19} /></button>
          <div className="avatar">A</div>
        </header>
        <div className="content">
          <div className="content-heading">
            <div><p className="eyebrow">Files & folders</p><div className="breadcrumbs"><button onClick={() => setCurrentFolder(null)}>My drive</button>{currentFolder && <><ChevronRight size={16} /><span>Current folder</span></>}</div></div>
            <div className="view-switcher"><button className={viewMode === 'list' ? 'selected' : ''} onClick={() => setViewMode('list')} title="List view"><List size={17} /></button><button className={viewMode === 'grid' ? 'selected' : ''} onClick={() => setViewMode('grid')} title="Grid view"><Grid2X2 size={17} /></button></div>
          </div>
          {error && <div className="alert error"><AlertCircle size={17} /><span>{error}</span><button className="icon-button" onClick={() => setError('')}><X size={15} /></button></div>}
          {loading ? <div className="loading-state"><div className="spinner" /><span>Loading your files…</span></div> : (
            <FileExplorer files={filteredFiles} folders={filteredFolders} compact={preferences.compact} onOpenFolder={setCurrentFolder} onDeleteFile={handleDeleteFile} onDeleteFolder={handleDeleteFolder} onMoveFile={handleMoveFile} onRefresh={load} onError={setError} />
          )}
          {!loading && search && filteredFiles.length + filteredFolders.length === 0 && <div className="search-empty"><Search size={28} /><p>No results for “{search}”</p><button className="button button-secondary" onClick={() => setSearch('')}>Clear search</button></div>}
        </div>
        <button className="floating-create" onClick={handleCreateFolder}><Plus size={18} />New</button>
      </main>
      {settingsOpen && <SettingsPanel preferences={preferences} setPreferences={setPreferences} onClose={() => setSettingsOpen(false)} onLogout={logout} />}
    </div>
  )
}
