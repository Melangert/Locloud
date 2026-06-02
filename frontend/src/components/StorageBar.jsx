export default function StorageBar({ usage }) {
  if (!usage) return null

  const percent = Math.min((usage.used / (20 * 1024 * 1024 * 1024)) * 100, 100)

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, marginBottom: 6 }}>
        <div style={{
          width: `${percent}%`, height: '100%',
          backgroundColor: percent > 90 ? '#d93025' : '#1a73e8',
          borderRadius: 2
        }} />
      </div>
      <p style={{ fontSize: 12, color: '#5f6368' }}>
        {usage.used_gb} GB of 20 GB used
      </p>
    </div>
  )
}