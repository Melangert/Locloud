import { useState } from 'react'
import Modal from './Modal'
import { getErrorMessage } from '../api'

export default function MoveDialog({ file, folders, currentFolder, onMove, onClose }) {
  const [destination, setDestination] = useState(currentFolder || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function path(folder) {
    const parts = [folder.name], seen = new Set([folder.id])
    let parent = folders.find(item => item.id === folder.parent_id)
    while (parent && !seen.has(parent.id)) { seen.add(parent.id); parts.unshift(parent.name); parent = folders.find(item => item.id === parent.parent_id) }
    return parts.join(' / ')
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true)
    try { await onMove(file.id, destination || null); onClose() }
    catch (failure) { setError(getErrorMessage(failure)); setBusy(false) }
  }
  return <Modal label="Move file" onClose={onClose}><h2>Move file</h2><p className="storage-path">{file.name}</p><form className="settings-form" onSubmit={submit}><label>Destination<select value={destination} onChange={e => setDestination(e.target.value)}><option value="">My drive</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{path(folder)}</option>)}</select></label>{error && <p role="alert">{error}</p>}<button className="button button-primary" disabled={busy || destination === (currentFolder || '')}>{busy ? 'Moving…' : 'Move here'}</button><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button></form></Modal>
}
