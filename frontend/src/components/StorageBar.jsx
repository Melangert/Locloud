import { HardDrive } from 'lucide-react'

export default function StorageBar({ usage }) {
  if (!usage) return null
  const limit = usage.limit_bytes || 20 * 1024 * 1024 * 1024
  const percent = Math.min((usage.used / limit) * 100, 100)

  return (
    <div className="storage-card">
      <div className="storage-heading"><HardDrive size={16} /><span>Storage</span><strong>{Math.round(percent)}%</strong></div>
      <div className="progress-track"><div className={`progress-value ${percent > 90 ? 'danger' : ''}`} style={{ width: `${percent}%` }} /></div>
      <p>{usage.used_gb || '0'} GB used of {usage.limit_gb || '20'} GB</p>
    </div>
  )
}
