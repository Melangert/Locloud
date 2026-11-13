import { useState } from 'react'
import { Download, File as FileIcon, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { downloadFile, getErrorMessage, renameFile } from '../api'

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`
}

export default function FileItem({ file, compact, onDelete, onRefresh, onError }) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(file.name)

  async function saveName() {
    const name = newName.trim()
    if (!name || name === file.name) {
      setRenaming(false)
      setNewName(file.name)
      return
    }
    try {
      await renameFile(file.id, name)
      onRefresh()
    } catch (error) {
      onError(getErrorMessage(error))
    } finally {
      setRenaming(false)
    }
  }

  async function handleDownload() {
    try {
      await downloadFile(file.id, file.name)
    } catch (error) {
      onError(getErrorMessage(error))
    }
  }

  return (
    <div
      className={`file-row ${compact ? 'compact' : ''}`}
      draggable={!renaming}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('application/x-locloud-file', file.id)
        event.dataTransfer.setData('text/plain', file.id)
      }}
    >
      <div className="file-name-cell">
        <span className="file-icon"><FileIcon size={18} /></span>
        {renaming ? (
          <input className="inline-input" value={newName} onChange={(event) => setNewName(event.target.value)} onBlur={saveName} onKeyDown={(event) => event.key === 'Enter' && saveName()} autoFocus />
        ) : <span className="truncate" title={file.name}>{file.name}</span>}
      </div>
      <span className="file-meta">{formatSize(file.size)}</span>
      <div className="row-actions">
        <button className="icon-button" title="Rename" onClick={() => setRenaming(true)}><Pencil size={16} /></button>
        <button className="icon-button" title="Download" onClick={handleDownload}><Download size={16} /></button>
        <button className="icon-button danger" title="Delete" onClick={() => onDelete(file.id)}><Trash2 size={16} /></button>
        <button className="icon-button mobile-only" title="More actions"><MoreHorizontal size={16} /></button>
      </div>
    </div>
  )
}
