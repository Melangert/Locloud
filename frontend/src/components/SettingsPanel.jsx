import { useState } from 'react'
import { LogOut, X } from 'lucide-react'
import { changePassword, getErrorMessage } from '../api'
import { defaults, formatSize } from '../preferences'
import Modal from './Modal'

export default function SettingsPanel({ preferences, setPreferences, usage, onClose, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (key, value) => setPreferences(previous => ({ ...previous, [key]: value }))
  async function submit(event) {
    event.preventDefault()
    setError(''); setMessage('')
    if (newPassword !== confirmation) { setError('New passwords do not match.'); return }
    setBusy(true)
    try {
      const data = await changePassword(currentPassword, newPassword)
      localStorage.setItem('token', data.access_token)
      setCurrentPassword(''); setNewPassword(''); setConfirmation('')
      setMessage('Password updated. Other sessions have been signed out.')
    } catch (failure) { setError(getErrorMessage(failure)) }
    finally { setBusy(false) }
  }
  return <Modal label="Settings" onClose={onClose}>
    <div className="panel-heading"><div><p className="eyebrow">Workspace</p><h2>Settings</h2></div><button className="icon-button" aria-label="Close settings" onClick={onClose}><X size={19} /></button></div>
    <div className="settings-section">
      <h3>Appearance & browsing</h3>
      <label className="setting-row"><span><strong>Theme</strong><small>Applies on this browser.</small></span><select value={preferences.theme} onChange={e => update('theme', e.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
      <label className="setting-row"><span>Compact file list</span><input type="checkbox" checked={preferences.compact} onChange={e => update('compact', e.target.checked)} /></label>
      <label className="setting-row"><span>Default view</span><select value={preferences.viewMode} onChange={e => update('viewMode', e.target.value)}><option value="list">List</option><option value="grid">Grid</option></select></label>
      <label className="setting-row"><span>Sort files</span><select value={preferences.sort} onChange={e => update('sort', e.target.value)}><option value="name">Name A–Z</option><option value="newest">Newest first</option><option value="size">Largest first</option></select></label>
      <label className="setting-row"><span><strong>Show hidden files</strong><small>Include names starting with a dot.</small></span><input type="checkbox" checked={preferences.showHidden} onChange={e => update('showHidden', e.target.checked)} /></label>
      <button className="button button-secondary" onClick={() => setPreferences({ ...defaults })}>Reset preferences</button>
    </div>
    <div className="settings-section"><h3>Local storage</h3>{usage ? <><p>{usage.file_count} files · {formatSize(usage.used)} in Locloud</p><p>{formatSize(usage.disk_free)} free of {formatSize(usage.disk_total)} on the storage disk</p><small className="muted">Disk usage includes other apps and files on this device.</small><p className="storage-path">{usage.upload_path}</p></> : <p>Storage information is unavailable.</p>}</div>
    <div className="settings-section"><h3>Change password</h3><form className="settings-form" onSubmit={submit}>
      <label>Current password<input type="password" autoComplete="current-password" required maxLength={72} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
      <label>New password<input type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <small className="muted">Use at least 12 characters. Changing your password signs out other sessions.</small>
      {error && <p className="alert error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <button className="button button-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
    </form></div>
    <div className="settings-section"><button className="button button-secondary button-wide" onClick={onLogout}><LogOut size={16} />Sign out</button></div>
  </Modal>
}
