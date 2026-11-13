import { HardDrive } from 'lucide-react'

export default function FolderTree({ currentFolder, onSelect }) {
  return (
    <nav className="folder-tree" aria-label="Folders">
      <button className={`nav-item ${currentFolder === null ? 'active' : ''}`} onClick={() => onSelect(null)}>
        <HardDrive size={17} />
        <span>My drive</span>
      </button>
    </nav>
  )
}
