import { HardDrive } from 'lucide-react'
import { formatSize } from '../preferences'
export default function StorageBar({ usage }) {
  if (!usage) return null
  const percent = usage.disk_total ? Math.min(100, usage.disk_used / usage.disk_total * 100) : 0
  return <div className="storage-card"><div className="storage-heading"><HardDrive size={16} /><span>Storage disk</span><strong>{Math.round(percent)}%</strong></div><div className="progress-track"><div className={`progress-value ${percent > 90 ? 'danger' : ''}`} style={{ width: `${percent}%` }} /></div><p>{formatSize(usage.disk_free)} free of {formatSize(usage.disk_total)}</p><p>Locloud files: {formatSize(usage.used)}</p></div>
}
