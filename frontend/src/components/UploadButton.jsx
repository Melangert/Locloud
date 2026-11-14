import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { getErrorMessage, uploadFile } from '../api'

export default function UploadButton({ currentFolder, onUpload, onError }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('')
  const inputRef = useRef(null)
  const controller = useRef(null)
  async function handleChange(event) {
    const files = [...(event.target.files || [])]
    event.target.value = ''
    if (!files.length) return
    setUploading(true); setStatus(''); setProgress(0)
    controller.current = new AbortController()
    let completed = 0
    try {
      for (const file of files) {
        controller.current.signal.throwIfAborted()
        setFileName(`${completed + 1}/${files.length} · ${file.name}`)
        setProgress(0)
        await uploadFile(file, currentFolder, setProgress, controller.current.signal)
        completed += 1
      }
      setStatus(`${completed} file${completed === 1 ? '' : 's'} uploaded.`)
    } catch (error) {
      if (error.name === 'AbortError') setStatus(`Upload cancelled. ${completed} completed.`)
      else onError(getErrorMessage(error))
    } finally { setUploading(false); controller.current = null; await onUpload() }
  }
  return <div className="upload-control">
    <input ref={inputRef} type="file" multiple onChange={handleChange} hidden />
    <button className="button button-primary button-wide" onClick={() => inputRef.current?.click()} disabled={uploading}><Upload size={17} />{uploading ? `Uploading ${progress}%` : 'Upload files'}</button>
    {uploading && <div className="upload-progress" aria-label={`Uploading ${fileName}`}><div className="progress-track"><div className="progress-value" style={{ width: `${progress}%` }} /></div><span>{fileName}</span><button className="icon-button" title="Cancel upload" onClick={() => controller.current?.abort()}><X size={14} /></button></div>}
    {status && <small className="muted" role="status">{status}</small>}
  </div>
}
