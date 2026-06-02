import FileItem from './FileItem'
import { Folder } from 'lucide-react'

export default function FileExplorer({ files, folders, onOpenFolder, onDeleteFile, onDeleteFolder, onRefresh }) {
  if (files.length === 0 && folders.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#5f6368', marginTop: 80 }}>
        <p style={{ fontSize: 16 }}>No files here yet</p>
        <p style={{ fontSize: 14 }}>Upload something to get started</p>
      </div>
    )
  }

  return (
    <div>
      {folders.length > 0 && (
        <div>
          <p style={{ fontSize: 13, color: '#5f6368', marginBottom: 8 }}>Folders</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 24 }}>
            {folders.map(folder => (
              <div
                key={folder.id}
                onClick={() => onOpenFolder(folder.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                  border: '1px solid #e0e0e0', backgroundColor: 'white',
                  transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                <Folder size={20} color="#5f6368" />
                <span style={{ fontSize: 14, color: '#202124', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {folder.name}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onDeleteFolder(folder.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5f6368', fontSize: 18, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div>
          <p style={{ fontSize: 13, color: '#5f6368', marginBottom: 8 }}>Files</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {files.map(file => (
              <FileItem
                key={file.id}
                file={file}
                onDelete={onDeleteFile}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}