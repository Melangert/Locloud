import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { uploadFile } from '../api'

export default function UploadButton({ currentFolder, onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef()

  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90))
    }, 100)
    await uploadFile(file, currentFolder)
    clearInterval(interval)
    setProgress(100)
    setTimeout(() => {
      setUploading(false)
      setProgress(0)
      onUpload()
    }, 500)
    e.target.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current.click()}
        disabled={uploading}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '10px 16px',
          backgroundColor: '#1a73e8', color: 'white',
          border: 'none', borderRadius: 20, cursor: 'pointer',
          fontSize: 14, fontWeight: 500
        }}
      >
        <Upload size={18} />
        {uploading ? `Uploading... ${progress}%` : 'Upload file'}
      </button>
      {uploading && (
        <div style={{ marginTop: 8, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2 }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            backgroundColor: '#1a73e8', borderRadius: 2,
            transition: 'width 0.1s'
          }} />
        </div>
      )}
    </div>
  )
}