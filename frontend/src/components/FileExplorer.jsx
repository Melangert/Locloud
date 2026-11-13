import { useState } from 'react'
import { Edit3, Folder, FolderOpen, MoreHorizontal, Trash2 } from 'lucide-react'
import FileItem from './FileItem'
import { getErrorMessage, renameFolder } from '../api'

export default function FileExplorer({ files, folders, compact, onOpenFolder, onDeleteFile, onDeleteFolder, onMoveFile, onRefresh, onError }) {
  const [renamingFolder, setRenamingFolder] = useState(null)
  const [folderName, setFolderName] = useState('')
  const [dragOverFolder, setDragOverFolder] = useState(null)

  async function saveFolderName(folder) {
    const name = folderName.trim()
    if (!name || name === folder.name) {
      setRenamingFolder(null)
      return
    }
    try {
      await renameFolder(folder.id, name)
      onRefresh()
    } catch (error) {
      onError(getErrorMessage(error))
    } finally {
      setRenamingFolder(null)
    }
  }

  if (files.length === 0 && folders.length === 0) {
    return <div className="empty-state"><FolderOpen size={42} /><h3>This folder is empty</h3><p>Upload a file or create a folder to get started.</p></div>
  }

  return (
    <div className="explorer">
      {folders.length > 0 && (
        <section>
          <div className="section-label">Folders <span>{folders.length}</span></div>
          <div className="folder-grid">
            {folders.map((folder) => (
              <div
                className={`folder-card ${dragOverFolder === folder.id ? 'drag-over' : ''}`}
                key={folder.id}
                onDragOver={(event) => {
                  if (event.dataTransfer.types.includes('application/x-locloud-file')) {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                    setDragOverFolder(folder.id)
                  }
                }}
                onDragLeave={() => setDragOverFolder(null)}
                onDrop={async (event) => {
                  event.preventDefault()
                  const fileId = event.dataTransfer.getData('application/x-locloud-file') || event.dataTransfer.getData('text/plain')
                  setDragOverFolder(null)
                  if (fileId) await onMoveFile(fileId, folder.id)
                }}
              >
                {renamingFolder === folder.id ? (
                  <div className="folder-main">
                    <Folder size={20} />
                    <input className="inline-input" value={folderName} onChange={(event) => setFolderName(event.target.value)} onBlur={() => saveFolderName(folder)} onKeyDown={(event) => event.key === 'Enter' && saveFolderName(folder)} autoFocus />
                  </div>
                ) : (
                  <button className="folder-main" onClick={() => onOpenFolder(folder.id)}>
                    <Folder size={20} />
                    <span className="truncate">{folder.name}</span>
                  </button>
                )}
                <div className="folder-actions">
                  <button className="icon-button" title="Rename folder" onClick={() => { setRenamingFolder(folder.id); setFolderName(folder.name) }}><Edit3 size={15} /></button>
                  <button className="icon-button danger" title="Delete folder" onClick={() => onDeleteFolder(folder.id)}><Trash2 size={15} /></button>
                  <MoreHorizontal size={15} className="muted" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {files.length > 0 && (
        <section>
          <div className="section-label">Files <span>{files.length}</span></div>
          <div className="file-list">
            <div className="file-list-heading"><span>Name</span><span>Size</span><span /></div>
            {files.map((file) => <FileItem key={file.id} file={file} compact={compact} onDelete={onDeleteFile} onRefresh={onRefresh} onError={onError} />)}
          </div>
        </section>
      )}
    </div>
  )
}
