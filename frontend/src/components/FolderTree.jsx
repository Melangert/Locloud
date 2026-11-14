import { Folder, HardDrive } from 'lucide-react'
export default function FolderTree({ currentFolder, folders, showHidden, onSelect }) {
  function children(parent, depth = 0, seen = new Set()) {
    return folders.filter(folder => folder.parent_id === parent && !seen.has(folder.id) && (showHidden || !folder.name.startsWith('.'))).sort((a, b) => a.name.localeCompare(b.name)).map(folder => <div key={folder.id}><button title={folder.name} className={`nav-item ${currentFolder === folder.id ? 'active' : ''}`} style={{ paddingLeft: 12 + Math.min(depth, 5) * 14 }} onClick={() => onSelect(folder.id)}><Folder size={16} /><span className="truncate">{folder.name}</span></button>{children(folder.id, depth + 1, new Set([...seen, folder.id]))}</div>)
  }
  return <nav className="folder-tree" aria-label="Folders"><button className={`nav-item ${currentFolder === null ? 'active' : ''}`} onClick={() => onSelect(null)}><HardDrive size={17} /><span>My drive</span></button>{children(null)}</nav>
}
