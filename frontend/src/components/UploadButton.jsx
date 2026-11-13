import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { getErrorMessage, uploadFile } from '../api'

export default function UploadButton({ currentFolder, onUpload, onError }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  async function handleChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setProgress(0)
    setFileName(file.name)
    try {
      await uploadFile(file, currentFolder, setProgress)
      onUpload()
    } catch (error) {
      onError(getErrorMessage(error))
    } finally {
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
        setFileName('')
      }, 400)
    }
  }

  return (
    <div className="upload-control">
      <input ref={inputRef} type="file" onChange={handleChange} hidden />
      <button className="button button-primary button-wide" onClick={() => inputRef.current?.click()} disabled={uploading}>
        <Upload size={17} />
        {uploading ? `Uploading ${progress}%` : 'Upload file'}
      </button>
      {uploading && (
        <div className="upload-progress" aria-label={`Uploading ${fileName}`}>
          <div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div>
          <span>{fileName}</span>
          <button className="icon-button" title="Uploads cannot be cancelled yet" disabled><X size={14} /></button>
        </div>
      )}
    </div>
  )
}
