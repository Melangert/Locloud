import { Folder, HardDrive } from 'lucide-react'

export default function FolderTree({ currentFolder, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div
        onClick={() => onSelect(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 20, cursor: 'pointer',
          backgroundColor: currentFolder === null ? '#e8f0fe' : 'transparent',
          color: currentFolder === null ? '#1a73e8' : '#202124'
        }}
      >
        <HardDrive size={18} />
        <span style={{ fontSize: 14 }}>My Drive</span>
      </div>
    </div>
  )
}