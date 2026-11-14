import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ChevronRight, FolderPlus, Grid2X2, List, LogOut, Menu, Plus, RefreshCw, Search, Settings, X } from 'lucide-react'
import { createFolder, deleteFile, deleteFolder, getAllFolders, getErrorMessage, getFiles, getFolders, getStorageUsage, moveFile } from '../api'
import FileExplorer from '../components/FileExplorer'
import FolderTree from '../components/FolderTree'
import UploadButton from '../components/UploadButton'
import StorageBar from '../components/StorageBar'
import SettingsPanel from '../components/SettingsPanel'
import MoveDialog from '../components/MoveDialog'
import { readPreferences } from '../preferences'

export default function Drive() {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [allFolders, setAllFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [usage, setUsage] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moving, setMoving] = useState(null)
  const [preferences, setPreferences] = useState(readPreferences)
  const searchRef = useRef(null)
  const requestId = useRef(0)
  const navigate = useNavigate()
  const closeSettings = useCallback(() => setSettingsOpen(false), [])
  const closeMove = useCallback(() => setMoving(null), [])
  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    try {
      const [nextFiles, nextFolders, nextUsage, tree] = await Promise.all([getFiles(currentFolder), getFolders(currentFolder), getStorageUsage(), getAllFolders()])
      if (id !== requestId.current) return
      if (currentFolder && !tree.some(folder => folder.id === currentFolder)) { setCurrentFolder(null); return }
      setFiles(nextFiles); setFolders(nextFolders); setUsage(nextUsage); setAllFolders(tree)
    } catch (failure) { if (id === requestId.current) setError(getErrorMessage(failure)) }
    finally { if (id === requestId.current) setLoading(false) }
  }, [currentFolder])
  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => { window.clearTimeout(timer); requestId.current += 1 }
  }, [load])
  useEffect(() => {
    localStorage.setItem('locloud:preferences', JSON.stringify(preferences))
    document.documentElement.dataset.theme = preferences.theme
  }, [preferences])
  useEffect(() => {
    const unauthorized = () => navigate('/login')
    const shortcuts = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus() }
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('locloud:unauthorized', unauthorized)
    window.addEventListener('keydown', shortcuts)
    return () => { window.removeEventListener('locloud:unauthorized', unauthorized); window.removeEventListener('keydown', shortcuts) }
  }, [navigate])
  const visible = useCallback(items => items.filter(item => (preferences.showHidden || !item.name.startsWith('.')) && item.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => {
    if (preferences.sort === 'newest') return new Date(b.created_at) - new Date(a.created_at)
    if (preferences.sort === 'size' && a.size !== undefined) return b.size - a.size || a.name.localeCompare(b.name)
    return a.name.localeCompare(b.name, undefined, { numeric: true })
  }), [preferences.showHidden, preferences.sort, search])
  const filteredFiles = useMemo(() => visible(files), [files, visible])
  const filteredFolders = useMemo(() => visible(folders), [folders, visible])
  const breadcrumbs = useMemo(() => {
    const result = [], seen = new Set()
    let folder = allFolders.find(item => item.id === currentFolder)
    while (folder && !seen.has(folder.id)) { seen.add(folder.id); result.unshift(folder); folder = allFolders.find(item => item.id === folder.parent_id) }
    return result
  }, [currentFolder, allFolders])
  function openFolder(id) { if (id !== currentFolder) requestId.current += 1; setCurrentFolder(id); setSearch(''); setSidebarOpen(false); setError('') }
  function logout() { localStorage.removeItem('token'); navigate('/login') }
  async function handleDeleteFile(id) {
    if (!window.confirm('Permanently delete this file? This cannot be undone.')) return
    try { await deleteFile(id); await load() } catch (failure) { setError(getErrorMessage(failure)) }
  }
  async function handleDeleteFolder(id) {
    if (!window.confirm('Permanently delete this folder and everything inside it? This cannot be undone.')) return
    try { await deleteFolder(id); await load() } catch (failure) { setError(getErrorMessage(failure)) }
  }
  async function handleMove(fileId, folderId) { await moveFile(fileId, folderId); await load() }
  async function handleDrop(fileId, folderId) {
    try { await handleMove(fileId, folderId) } catch (failure) { setError(getErrorMessage(failure)) }
  }
  async function handleCreateFolder() {
    const name = window.prompt('Name your new folder')
    if (!name?.trim()) return
    try { await createFolder(name.trim(), currentFolder); await load() } catch (failure) { setError(getErrorMessage(failure)) }
  }
  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark">L</div><span>Locloud</span><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
      <div className="sidebar-actions"><UploadButton currentFolder={currentFolder} onUpload={load} onError={setError} /><button className="button button-secondary button-wide" onClick={handleCreateFolder}><FolderPlus size={17} />New folder</button></div>
      <FolderTree currentFolder={currentFolder} folders={allFolders} showHidden={preferences.showHidden} onSelect={openFolder} />
      <div className="sidebar-bottom"><StorageBar usage={usage} /><button className="nav-item" onClick={() => setSettingsOpen(true)}><Settings size={17} /><span>Settings</span></button><button className="nav-item" onClick={logout}><LogOut size={17} /><span>Sign out</span></button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="search-box"><Search size={18} /><input ref={searchRef} aria-label="Search current folder" placeholder="Search this folder" value={search} onChange={event => setSearch(event.target.value)} /><kbd>Ctrl/⌘ K</kbd></div><button className="icon-button" title="Settings" onClick={() => setSettingsOpen(true)}><Settings size={19} /></button><div className="avatar" title="admin">A</div></header>
      <div className="content">
        <div className="content-heading"><div><p className="eyebrow">Files & folders</p><nav className="breadcrumbs" aria-label="Breadcrumb"><button onClick={() => openFolder(null)}>My drive</button>{breadcrumbs.map(folder => <span className="breadcrumb-part" key={folder.id}><ChevronRight size={16} /><button aria-current={folder.id === currentFolder ? 'page' : undefined} onClick={() => openFolder(folder.id)}>{folder.name}</button></span>)}</nav></div>
          <div className="toolbar"><button className="icon-button" title="Refresh files" onClick={load} disabled={loading}><RefreshCw size={17} /></button><select aria-label="Sort files" value={preferences.sort} onChange={event => setPreferences(p => ({ ...p, sort: event.target.value }))}><option value="name">Name A–Z</option><option value="newest">Newest</option><option value="size">Largest</option></select><div className="view-switcher">{[['list', List], ['grid', Grid2X2]].map(([mode, Icon]) => <button key={mode} className={preferences.viewMode === mode ? 'selected' : ''} aria-pressed={preferences.viewMode === mode} onClick={() => setPreferences(p => ({ ...p, viewMode: mode }))} title={`${mode === 'list' ? 'List' : 'Grid'} view`}><Icon size={17} /></button>)}</div></div>
        </div>
        {error && <div className="alert error" role="alert"><AlertCircle size={17} /><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={() => setError('')}><X size={15} /></button></div>}
        {loading ? <div className="loading-state"><div className="spinner" /><span>Loading your files…</span></div> : search && filteredFiles.length + filteredFolders.length === 0 ? <div className="search-empty"><Search size={28} /><p>No results for “{search}”</p><button className="button button-secondary" onClick={() => setSearch('')}>Clear search</button></div> : <FileExplorer files={filteredFiles} folders={filteredFolders} viewMode={preferences.viewMode} compact={preferences.compact} onOpenFolder={openFolder} onDeleteFile={handleDeleteFile} onDeleteFolder={handleDeleteFolder} onMoveFile={handleDrop} onChooseMove={setMoving} onRefresh={load} onError={setError} />}
      </div>
      <button className="floating-create" onClick={handleCreateFolder}><Plus size={18} />New folder</button>
    </main>
    {settingsOpen && <SettingsPanel preferences={preferences} setPreferences={setPreferences} usage={usage} onClose={closeSettings} onLogout={logout} />}
    {moving && <MoveDialog file={moving} folders={allFolders} currentFolder={currentFolder} onMove={handleMove} onClose={closeMove} />}
  </div>
}
