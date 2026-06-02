import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFiles, getFolders, deleteFile, deleteFolder, createFolder, getStorageUsage } from '../api'
import FileExplorer from '../components/FileExplorer'
import FolderTree from '../components/FolderTree'
import UploadButton from '../components/UploadButton'
import StorageBar from '../components/StorageBar'

export default function Drive() {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [usage, setUsage] = useState(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  async function load() {
    const [f, d, u] = await Promise.all([
      getFiles(currentFolder),
      getFolders(currentFolder),
      getStorageUsage()
    ])
    setFiles(f)
    setFolders(d)
    setUsage(u)
  }

  useEffect(() => { load() }, [currentFolder])

  async function handleDeleteFile(id) {
    await deleteFile(id)
    load()
  }

  async function handleDeleteFolder(id) {
    await deleteFolder(id)
    load()
  }

  async function handleCreateFolder() {
    const name = prompt('Folder name')
    if (!name) return
    await createFolder(name, currentFolder)
    load()
  }

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Google Sans, Roboto, sans-serif', backgroundColor: '#f8f9fa' }}>
      <div style={{ width: 240, backgroundColor: 'white', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid #e0e0e0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: '#202124', padding: '8px 0 16px' }}>Locloud</h2>
        <UploadButton currentFolder={currentFolder} onUpload={load} />
        <button
          onClick={handleCreateFolder}
          style={{ padding: '10px 16px', border: '1px solid #dadce0', borderRadius: 20, background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: '#202124' }}
        >
          + New folder
        </button>
        <div style={{ marginTop: 16 }}>
          <FolderTree currentFolder={currentFolder} onSelect={setCurrentFolder} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <StorageBar usage={usage} />
          <button
            onClick={handleLogout}
            style={{ marginTop: 12, width: '100%', padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#5f6368', fontSize: 13 }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #e0e0e0', backgroundColor: 'white' }}>
          <input
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 600, padding: '10px 16px', border: '1px solid #dadce0', borderRadius: 24, fontSize: 14, outline: 'none', backgroundColor: '#f1f3f4', color: '#202124' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {currentFolder && (
            <button
              onClick={() => setCurrentFolder(null)}
              style={{ marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#1a73e8', fontSize: 14 }}
            >
              ← Back
            </button>
          )}
          <FileExplorer
            files={filteredFiles}
            folders={filteredFolders}
            onOpenFolder={setCurrentFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
            onRefresh={load}
          />
        </div>
      </div>
    </div>
  )
}