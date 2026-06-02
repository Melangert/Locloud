import { useState } from 'react'
import { File, Download, Trash2, Pencil } from 'lucide-react'
import { downloadFile, deleteFile, renameFile } from '../api'

export default function FileItem({ file, onDelete, onRefresh }) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(file.name)

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  async function handleRename() {
    if (newName && newName !== file.name) {
      await renameFile(file.id, newName)
      onRefresh()
    }
    setRenaming(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 16px', borderRadius: 8, backgroundColor: 'white',
      border: '1px solid transparent', cursor: 'default'
    }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f4'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
    >
      <File size={20} color="#5f6368" />

      {renaming ? (
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => e.key === 'Enter' && handleRename()}
          autoFocus
          style={{ flex: 1, fontSize: 14, border: '1px solid #1a73e8', borderRadius: 4, padding: '2px 8px' }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: 14, color: '#202124' }}>{file.name}</span>
      )}

      <span style={{ fontSize: 12, color: '#5f6368', minWidth: 60, textAlign: 'right' }}>
        {formatSize(file.size)}
      </span>

      <button
        onClick={() => setRenaming(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', padding: 4 }}
      >
        <Pencil size={16} />
      </button>

      <button
        onClick={() => downloadFile(file.id, file.name)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', padding: 4 }}
      >
        <Download size={16} />
      </button>

      <button
        onClick={() => onDelete(file.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d93025', padding: 4 }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}